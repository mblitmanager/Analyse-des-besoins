import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, ILike } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { Formation } from '../entities/formation.entity';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { Question } from '../entities/question.entity';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { QuestionRule } from '../entities/question-rule.entity';
import { Contact } from '../entities/contact.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    @InjectRepository(Stagiaire)
    private stagiaireRepo: Repository<Stagiaire>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    @InjectRepository(ParcoursRule)
    private parcoursRuleRepo: Repository<ParcoursRule>,
    @InjectRepository(QuestionRule)
    private questionRuleRepo: Repository<QuestionRule>,
    private emailService: EmailService,
    private settingsService: SettingsService,
    private pdfService: PdfService,
  ) {}

  async create(data: Partial<Session> & { email?: string }) {
    let stagiaire: Stagiaire | undefined = undefined;
    if (data.email) {
      const normalizedEmail = data.email.toLowerCase().trim();
      const found = await this.stagiaireRepo.findOne({
        where: { email: normalizedEmail },
      });
      stagiaire = found ?? undefined;

      if (!stagiaire) {
        stagiaire = this.stagiaireRepo.create({
          email: normalizedEmail,
          nom: data.nom,
          prenom: data.prenom,
          civilite: data.civilite,
          telephone: data.telephone,
        });
        await this.stagiaireRepo.save(stagiaire);
      }
    }

    const session = this.sessionRepo.create({
      ...data,
      stagiaire: stagiaire || undefined,
    });
    return this.sessionRepo.save(session);
  }

  /**
   * Determine the sequence number of the parcours (P1, P2, P3) for a given session.
   */
  async getParcoursNumber(session: Session): Promise<number> {
    if (session.isP3Mode) return 3;
    if (!session.stagiaire || !session.stagiaire.id) {
      const loaded = await this.sessionRepo.findOne({
        where: { id: session.id },
        relations: ['stagiaire'],
      });
      if (!loaded || !loaded.stagiaire) return 1;
      session.stagiaire = loaded.stagiaire;
    }

    const allSessions = await this.sessionRepo.find({
      where: { stagiaire: { id: session.stagiaire.id } },
      order: { createdAt: 'ASC' },
    });

    const idx = allSessions.findIndex((s) => s.id === session.id);
    return idx !== -1 ? idx + 1 : 1;
  }

  async findAll() {
    return this.sessionRepo.find({
      relations: ['stagiaire'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['stagiaire'],
    });
    if (!session) throw new NotFoundException('Session not found');

    if (
      session.formationChoisie ||
      (session.prerequisiteScore &&
        Object.keys(session.prerequisiteScore).length > 0)
    ) {
      try {
        const data = await this.getRecommendationData(session);
        (session as any).recommendations = data.recommendations;
        (session as any).parcoursNumber = await this.getParcoursNumber(session);

        // Ensure visibility flags are passed to the frontend
        (session as any).isQuestionRuleOverride = data.isQuestionRuleOverride;
        (session as any).ruleResultType = data.ruleResultType;

        // Ensure values are synced if not already stored
        if (!session.finalRecommendation) {
          session.finalRecommendation = data.recommendation;
          session.scorePretest = data.scoreFinal ?? data.scorePretest ?? 0;
        }
      } catch (e) {
        console.error('Failed to include recommendations array:', e);
      }
    }

    return session;
  }

  async update(id: string, data: Partial<Session>) {
    // If formation is changed, reset progress to avoid mixing results from different formations
    if (data.formationChoisie) {
      const resetData = data as any;
      resetData.levelsScores = {};
      resetData.stopLevel = null;
      resetData.lastValidatedLevel = null;
      resetData.positionnementAnswers = {};
      resetData.finalRecommendation = null;
      resetData.scorePretest = null;
    }

    await this.sessionRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await this.sessionRepo.remove(session);
    return { success: true };
  }

  async getRecommendationData(session: Session): Promise<{
    recommendation: string;
    recommendations?: string[];
    scorePretest?: number;
    scoreFinal?: number;
    finalLevel: Level | null;
    lastValidatedLevel?: string | null;
    stopLevel?: string | null;
    qTextById: Record<number, string>;
    filteredMiseAnswers?: any;
    filteredPrerequis?: any;
    filteredComplementaryAnswers?: any;
    filteredAvailabilities?: any;
    miseTitle: string;
    certification?: any;
    isQuestionRuleOverride?: boolean;
    ruleResultType?: string | null;
    levels: Level[];
    stopLevelOrder?: number;
  }> {
    // 0. Fetch all question texts and details for filtering and labeling
    // This ensures consistency between PositionnementView, ResultatsView, Mail, and PDF
    const ids = new Set<number>();
    const addIds = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      Object.entries(obj).forEach(([k, v]) => {
        const n = Number(k);
        if (!isNaN(n)) ids.add(n);
        // Recursively add IDs from nested objects (e.g. positionnementAnswers grouped by level)
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          addIds(v);
        }
      });
    };
    addIds(session.prerequisiteScore);
    addIds(session.complementaryQuestions);
    addIds(session.availabilities);
    addIds(session.miseANiveauAnswers);
    addIds(session.positionnementAnswers);

    const questions = ids.size
      ? await this.questionRepo.find({
          where: { id: In([...ids]) },
          relations: ['formation'],
        })
      : [];

    const qTextById: Record<number, string> = {};
    questions.forEach((q) => {
      qTextById[q.id] = q.text;
    });

    // If a recommendation is already set (e.g., from a positioning test), use it directly
    // This ensures consistency between PositionnementView, ResultatsView, Mail, and PDF
    if (session.finalRecommendation) {
      const recommendations = session.finalRecommendation.includes(' & ')
        ? session.finalRecommendation.split(' & ')
        : [session.finalRecommendation];

      const formationLabel = session.formationChoisie;

      // Inline filter: remove nulls, filter by formation
      // Note: we do NOT apply isQuestionVisible here because the answers
      // were already validated during the live questionnaire flow.
      // Re-checking visibility with serialized session data can cause
      // false negatives for conditional child questions.
      const filterAnswers = (answers: any) => {
        if (!answers) return {};
        const result: Record<string, any> = {};
        Object.entries(answers).forEach(([key, val]) => {
          if (val === null || val === undefined || val === '') return;
          const idNum = Number(key);
          const q = questions.find((x) => x.id === idNum);
          if (!q) return;
          if (q.formation && q.formation.label !== formationLabel) return;
          result[key] = val;
        });
        return result;
      };

      return {
        recommendation: session.finalRecommendation,
        recommendations,
        scorePretest: session.scorePretest || 0,
        finalLevel: { label: session.lastValidatedLevel || 'Inconnu' } as Level,
        lastValidatedLevel: session.lastValidatedLevel,
        stopLevel: session.stopLevel,
        qTextById,
        filteredMiseAnswers: filterAnswers(session.miseANiveauAnswers),
        filteredPrerequis: filterAnswers(session.prerequisiteScore),
        filteredComplementaryAnswers: filterAnswers(
          session.complementaryQuestions,
        ),
        filteredAvailabilities: filterAnswers(session.availabilities),
        miseTitle: session.formationChoisie
          ? `Mise à niveau (réponses – ${safe(session.formationChoisie)})`
          : 'Mise à niveau (réponses)',
        isQuestionRuleOverride: false,
        ruleResultType: null,
        levels: [] as Level[],
        stopLevelOrder: session.stopLevelOrder,
      };
    }

    // Adaptive Logic / Cumulative Logic
    // 1. Identify all levels for the chosen formation
    const formationChoice = String(session.formationChoisie ?? '').trim();
    const formation = formationChoice
      ? await this.sessionRepo.manager.getRepository(Formation).findOne({
          where: [{ slug: formationChoice }, { label: formationChoice }],
        })
      : null;

    // 1. Evaluate Question Rules first (gives absolute priority)
    const questionRules = await this.questionRuleRepo.find({
      where: { isActive: true },
      order: { workflow: 'ASC', order: 'ASC' },
    });

    if (questionRules.length > 0 && !session.ignoreQuestionRules) {
      // Evaluate rules against session answers
      for (const rule of questionRules) {
        // Only evaluate if rule formation matches session formation, or if rule is global
        if (rule.formationId) {
          if (rule.formationId !== formation?.id) continue;
        } else if (rule.formation && rule.formation !== formationChoice) {
          continue;
        }

        // Determine which answer set to check based on workflow
        let answers: Record<string, any> = {};
        if (rule.workflow === 'prerequis')
          answers = session.prerequisiteScore || {};
        else if (rule.workflow === 'mise_a_niveau')
          answers = session.miseANiveauAnswers || {};
        else continue;

        if (rule.questionId) {
          const userAnswer =
            answers[rule.questionId] ?? answers[String(rule.questionId)];
          let conditionMet = false;

          // Normalize values for comparison
          const normalize = (v: any) => {
            let raw = String(v ?? '').trim();
            // Handle persisted values like "\"Non\"" or "'Non'"
            if (
              (raw.startsWith('"') && raw.endsWith('"')) ||
              (raw.startsWith("'") && raw.endsWith("'"))
            ) {
              raw = raw.slice(1, -1).trim();
            }
            return raw.toLowerCase();
          };
          const target = normalize(rule.expectedValue);
          const actual = normalize(userAnswer);

          switch (rule.operator) {
            case 'EQUALS':
              if (target.includes(',')) {
                const targets = target.split(',').map((t) => t.trim());
                conditionMet = targets.includes(actual);
              } else {
                conditionMet = actual === target;
              }
              break;
            case 'CONTAINS':
              conditionMet = actual.includes(target);
              break;
            // Additional operators can be added here
          }

          if (conditionMet) {
            if (
              rule.resultType === 'CUSTOM_MESSAGE' ||
              rule.resultType === 'BLOCK' ||
              rule.resultType === 'FORMATION_RECOMMENDATION'
            ) {
              return {
                recommendation:
                  rule.resultMessage ||
                  'Message personnalisé basé sur vos réponses.',
                recommendations: [
                  rule.resultMessage || 'Recommandation personnalisée',
                ],
                scorePretest: 0,
                finalLevel: null,
                qTextById,
                filteredMiseAnswers: session.miseANiveauAnswers,
                miseTitle:
                  rule.resultType === 'FORMATION_RECOMMENDATION'
                    ? 'Recommandation basée sur vos prérequis'
                    : 'Questions complémentaires',
                isQuestionRuleOverride: true, // Flag for frontend
                ruleResultType: rule.resultType,
                levels: [] as Level[],
              };
            }
          }
        }
      }
    }

    // Handle special "Parcours Initial" virtual formation
    if (session.formationChoisie?.startsWith('Parcours Initial')) {
      return {
        recommendation:
          session.finalRecommendation || 'DigComp Initial & Word Initial',
        recommendations: [
          session.finalRecommendation || 'DigComp Initial & Word Initial',
        ],
        scorePretest: 0,
        finalLevel: { label: 'Initial' } as Level,
        qTextById,
        filteredMiseAnswers: session.miseANiveauAnswers,
        miseTitle: 'Mise à niveau (réponses)',
        levels: [] as Level[],
      };
    }

    const allLevels = formation?.id
      ? await this.levelRepo.find({
          where: { formation: { id: formation.id } },
          order: { order: 'ASC' },
        })
      : [];

    const levels = allLevels.filter((l) => l.isActive !== false);

    // ── Try active parcours rules first ──
    const activeRulesWhere: any[] = [];
    if (formation?.id) {
      activeRulesWhere.push({ formationId: formation.id, isActive: true });
    }
    if (formationChoice) {
      // Legacy fallback if formationId is not yet populated
      activeRulesWhere.push({ formation: ILike(formationChoice), isActive: true });
    }
    const activeRules = activeRulesWhere.length
      ? await this.parcoursRuleRepo.find({
          where: activeRulesWhere,
          order: { order: 'ASC' },
        })
      : [];

    if (activeRules.length > 0) {
      const stopLevelLabel = session.stopLevel || '';
      const stopUpper = stopLevelLabel.toUpperCase();
      let matchedRule: ParcoursRule | null = null;

      // Fetch all prerequisite questions once to map indices for rules
      const allPrereqs = await this.questionRepo.find({
        where: { type: 'prerequis' },
      });

      // Check if there are any prerequisite failures based on configurable settings
      const failureValuesStr = await this.settingsService.getValue(
        'PREREQUISITE_FAILURE_VALUES',
        'non,insuffisant,jamais',
      );
      const failureValues = failureValuesStr
        .split(',')
        .map((v) => v.trim().toLowerCase());

      const cleanLabel = (l: string) =>
        (l || '')
          .replace(/^(Niveau|à|au|à\s+la|à\s+l'|le|la|les)\s+/i, '')
          .trim()
          .toUpperCase();

      const checkPrereqFailure = (rule?: ParcoursRule): boolean => {
        if (!session.prerequisiteScore) return false;

        const qScores = session.prerequisiteScore;
        const conditions = rule?.prerequisiteConditions;
        const logic = rule?.prerequisiteLogic || 'OR';

        // Helper to check if a specific value is a failure using global failure keywords
        const isGenericFailure = (v: any) =>
          failureValues.includes(String(v).toLowerCase());

        if (conditions && conditions.length > 0) {
          const results = conditions.map((cond) => {
            const userResponse = qScores[cond.questionId];
            if (userResponse === undefined || userResponse === null)
              return false;

            // If no specific response indexes are defined, use keyword-based failure detection
            if (!cond.responseIndexes || cond.responseIndexes.length === 0) {
              return isGenericFailure(userResponse);
            }

            // Otherwise, check if user's response matches any of the target option strings
            const question = allPrereqs.find((q) => q.id === cond.questionId);
            if (!question || !question.options) return false;

            // userResponse might be an array or a comma-separated string if multiple answers
            const userResponsesArr = Array.isArray(userResponse)
              ? userResponse.map((r) => String(r).toLowerCase())
              : String(userResponse)
                  .split(',')
                  .map((r) => r.trim().toLowerCase());

            return cond.responseIndexes.some((idx) => {
              const targetOption = question.options[idx];
              if (!targetOption) return false;
              return userResponsesArr.includes(
                String(targetOption).toLowerCase(),
              );
            });
          });

          return logic === 'AND'
            ? results.every((r) => r)
            : results.some((r) => r);
        }

        // If no specific conditions are set but failure is required,
        // we check for any generic failure unless the rule is used for "all" profiles
        // Align with frontend: if no conditions, return true (matched)
        return true;
      };

      const stopIdx = levels.findIndex(
        (l) => cleanLabel(l.label) === cleanLabel(stopLevelLabel),
      );
      const evaluateRuleCondition = (rule: ParcoursRule): boolean => {
        // Match operator and target level even if prefixed with descriptive text
        const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);

        if (condMatch) {
          const operator = condMatch[1].replace('<=', '≤').replace('>=', '≥');
          const targetStr = cleanLabel(condMatch[2]);
          let targetIdx = levels.findIndex(
            (l) => cleanLabel(l.label) === targetStr,
          );
          
          if (targetIdx === -1 && targetStr.length > 0) {
              // Try substring match as fallback
              targetIdx = levels.findIndex(l => cleanLabel(l.label).includes(targetStr));
          }

          // If the target level doesn't exist in the formation, rule cannot be evaluated
          if (targetIdx === -1) return false;

          // Note: if user didn't even pass Level 0, their index should be handled correctly.
          // In the current architecture, stopIdx represents the first failed level.
          // Example: [Débutant, Initial, Basique]. If they fail Débutant, stopIdx = 0.

          const stopScore = session.levelsScores?.[stopLevelLabel]?.score || 0;
          const userLevel = (stopIdx === 0 && stopScore === 0) ? -1 : stopIdx;

          switch (operator) {
            case '=':
              return userLevel === targetIdx;
            case '<':
              return userLevel < targetIdx;
            case '≤':
              return userLevel <= targetIdx;
            case '>':
              return userLevel > targetIdx;
            case '≥':
              return userLevel >= targetIdx;
            default:
              return false;
          }
        }

        // Fallback for old rules without operators (implicit = or substring match)
        return cleanLabel(rule.condition).includes(stopUpper);
      };

      // 1. Evaluate all active rules to see which ones match the user's score
      // Note: checkPrereqFailure compares boolean flags, only enforce if requirePrerequisiteFailure is true
      const validRules = activeRules.filter((r) => {
        const ruleMatches = evaluateRuleCondition(r);
        // If rule requires failure, ensure user failed. If rule doesn't require failure, it applies anyway.
        const reqFail = !!r.requirePrerequisiteFailure;
        const userFailed = checkPrereqFailure(r);
        const prereqMatches = reqFail ? userFailed : true;

        return ruleMatches && prereqMatches;
      });

      // 2. Select the first matched rule
      if (validRules.length > 0) {
        matchedRule = validRules[0];
      }

      // Fallback: search for a rule that matches ONLY the prereq status if no score condition matched
      if (!matchedRule) {
        matchedRule =
          activeRules.find(
            (r) => !!r.requirePrerequisiteFailure === checkPrereqFailure(r),
          ) || null;
      }

      if (matchedRule) {
        const f1 = matchedRule.formation1 || '';
        const f2 = matchedRule.formation2 || '';
        let proposedParcours = f1 === f2 || !f2 ? [f1] : [f1, f2];
        let finalRecommendationValue = proposedParcours.join(' & ');

        // P3 mode: present multiple options as a CHOICE (OU) instead of sequential (&)
        // e.g. "ICDL - Google Docs OU ICDL - Google Sheets" = pick ONE
        if (session.isP3Mode && proposedParcours.length > 1) {
          finalRecommendationValue = proposedParcours.join(' OU ');
        } else if (session.isP3Mode && proposedParcours.length === 1) {
          finalRecommendationValue = proposedParcours[0];
        }

        const levelsEntries: any[] = session.levelsScores
          ? Object.values(session.levelsScores)
          : [];
        const totalAnswered: number = levelsEntries.reduce(
          (acc: number, e: any) => acc + (Number(e?.total) || 0),
          0 as number,
        );
        const totalCorrect: number = levelsEntries.reduce(
          (acc: number, e: any) => acc + (Number(e?.score) || 0),
          0 as number,
        );
        const scorePretest =
          totalAnswered > 0
            ? Math.round((totalCorrect / totalAnswered) * 100)
            : 0;

        // Determine the final level order based on the proposed parcours
        let highestOrder = 0;
        let finalLevel: any = null;
        
        if (levels.length > 0) {
            const clean = (s: string) => (s || '').toLowerCase().replace(/^(niveau|tosa|icdl)\s+/i, '').trim();
            proposedParcours.forEach(rec => {
                const recClean = clean(rec);
                levels.forEach(l => {
                    const lClean = clean(l.label);
                    if (recClean.includes(lClean) || lClean.includes(recClean)) {
                        if ((l.order || 0) > highestOrder) {
                            highestOrder = l.order || 0;
                            finalLevel = l;
                        }
                    }
                });
            });
        }

        if (!finalLevel && levels.length > 0) {
            finalLevel = levels[levels.length - 1];
            highestOrder = finalLevel.order || 0;
        }

        return {
          recommendation: finalRecommendationValue,
          recommendations: proposedParcours,
          scorePretest,
          finalLevel,
          qTextById,
          filteredMiseAnswers: session.miseANiveauAnswers,
          filteredPrerequis: session.prerequisiteScore,
          filteredComplementaryAnswers: session.complementaryQuestions,
          filteredAvailabilities: session.availabilities,
          miseTitle: 'Mise à niveau (réponses)',
          certification: matchedRule.certification,
          levels,
          stopLevelOrder: session.stopLevelOrder || (finalLevel ? (finalLevel as any).order : 0),
        };
      }
    }

    // 4. CHECK FOR EXPLICIT QUESTION OVERRIDES
    const overrideSession = (session as any).overrideData;
    if (overrideSession?.isQuestionRuleOverride) {
      let overrideRecValue = String(overrideSession.recommendations);
      if (session.isP3Mode) {
        const parts = overrideRecValue.split(/\s*&\s*|\s*\|\s*|,/);
        if (parts.length > 0) {
          overrideRecValue = parts[0];
        }
      }

      return {
        recommendation: overrideRecValue,
        isQuestionRuleOverride: overrideSession.isQuestionRuleOverride,
        ruleResultType: overrideSession.ruleResultType,
        finalLevel: null,
        qTextById,
        miseTitle: session.formationChoisie
          ? `Mise à niveau (réponses – ${safe(session.formationChoisie)})`
          : 'Mise à niveau (réponses)',
        levels,
      };
    }

    // ── FALLBACK CAREFUL LOGIC: No hardcoded rules, pure DB driven. ──
    // If no active rule was found in DB and it reached here,
    // Assign default based on their chosen formation name or empty generic response.
    // Ensure finalLevel doesn't break if no levels defined.
    
    // Calculate global score fallback
    const scores =
      (session.levelsScores as Record<string, number | { score?: number }>) ||
      {};
    
    let finalLevel = levels.length > 0 ? levels[0] : null;

    if (levels.length > 0) {
      for (const level of levels) {
        const raw = scores[level.label];
        const userScore =
          typeof raw === 'number'
            ? raw
            : ((raw as Record<string, any>)?.score ?? undefined);

        if (userScore !== undefined) {
          if (userScore >= level.successThreshold) {
            finalLevel = level;
          } else {
            finalLevel = level;
            break;
          }
        } else {
          break;
        }
      }
    }

    // Default fallback recommendation
    const baseFormation = session.formationChoisie || 'Parcours personnalisé';
    let proposedParcours = [baseFormation];

    // Build the fallback parcours
    let currentLevel = levels.length > 0 ? levels[0] : null;
    const targetLevelLabel = session.stopLevel || session.lastValidatedLevel || '';
    if (targetLevelLabel) {
      const currentIdx = Math.max(
        0,
        levels.findIndex((l) => l.label === targetLevelLabel),
      );
      currentLevel = levels[currentIdx];
    } else {
      currentLevel = finalLevel; // Use the parsed level from scores
    }

    if (currentLevel) {
      proposedParcours = [`${baseFormation} ${currentLevel.label}`.trim()];
      
      // If we are NOT in P3 mode, we might propose current + next (2-step).
      // But actually, the normal mode might already have matched a ParcoursRule. 
      // If no ParcoursRule matched, let's keep the existing behaviour for normal mode (if there was one).
      // Wait, let's just make it 1-step fallback if P3 mode, otherwise keep whatever it does normally.
      if (!session.isP3Mode && levels.length > 0) {
          const currentIdx = levels.findIndex((l) => l.label === currentLevel.label);
          const nextLevel = levels[currentIdx + 1];
          if (nextLevel && session.formationChoisie) {
            // Note: The previous logic was explicitly adding a 2-step for P3!
            // But the user requested only 1 for P3. 
            // In normal mode (P1/P2), it's standard to propose 2.
            proposedParcours = [
              `${baseFormation} ${currentLevel.label}`.trim(),
              `${baseFormation} ${nextLevel.label}`.trim(),
            ];
          }
      }
    }

    let finalRecommendationValue = proposedParcours.join(' & ');

    // Enforce ONE formation exactly for P3 mode, regardless of DB rules or fallbacks!
    if (session.isP3Mode) {
      const parts = finalRecommendationValue.split(/\s*&\s*|\s*\|\s*/);
      if (parts.length > 0) {
        finalRecommendationValue = parts[0];
        proposedParcours = [parts[0]];
      }

      // Logic to avoid repeating P2 in P3 for the same formation
      if (session.stagiaire?.id) {
        try {
          const allUserSessions = await this.sessionRepo.find({
            where: { stagiaire: { id: session.stagiaire.id } },
            order: { createdAt: 'DESC' },
            take: 5
          });
          
          // The current session is at index 0, P2 was at index 1
          const prevSession = allUserSessions[1];
          if (prevSession && prevSession.formationChoisie === session.formationChoisie) {
            // Check if recommendation is identical (normalized)
            const norm = (s: string) => (s || '').toLowerCase().trim();
            if (norm(finalRecommendationValue) === norm(prevSession.finalRecommendation)) {
              // Try to find next level
              const currentLvlLabel = levels.find(l => norm(finalRecommendationValue).includes(norm(l.label)))?.label;
              if (currentLvlLabel) {
                const currentIdx = levels.findIndex(l => l.label === currentLvlLabel);
                if (currentIdx !== -1 && currentIdx < levels.length - 1) {
                  const nextLvl = levels[currentIdx + 1];
                  finalRecommendationValue = `${session.formationChoisie} ${nextLvl.label}`.trim();
                  proposedParcours = [finalRecommendationValue];
                }
              }
            }
          }
        } catch (e) {
          console.warn('[P3] Failed to check previous session for recommendation overlap:', e.message);
        }
      }
    }

    // Score final global
    const levelsEntries: any[] = session.levelsScores
      ? Object.values(session.levelsScores)
      : [];
    const totalAnswered: number = levelsEntries.reduce(
      (acc: number, e: any) => acc + (Number(e?.total) || 0),
      0 as number,
    );
    const totalCorrect: number = levelsEntries.reduce(
      (acc: number, e: any) => acc + (Number(e?.score) || 0),
      0 as number,
    );
    const scoreFinal =
      totalAnswered > 0
        ? Math.round((totalCorrect / totalAnswered) * 100)
        : 0;

    const allAnswers = {
      ...(session.prerequisiteScore || {}),
      ...(session.complementaryQuestions || {}),
      ...(session.availabilities || {}),
      ...(session.miseANiveauAnswers || {}),
      ...(session.positionnementAnswers || {}),
    };

    // helper to filter answers: include only visible questions and matching the selected formation
    const formationLabel = session.formationChoisie;
    const filterByVisibility = (answers: any) => {
      if (!answers) return answers;
      const result: Record<string, any> = {};
      Object.entries(answers).forEach(([key, val]) => {
        // Skip null, undefined, or empty responses
        if (val === null || val === undefined || val === '') return;

        const idNum = Number(key);
        const q = questions.find((x) => x.id === idNum);
        if (!q) return;

        // 1. Formation filter (safety net)
        if (q.formation && q.formation.label !== formationLabel) return;

        // 2. Visibility filter (Conditional Logic)
        if (!isQuestionVisible(q, allAnswers, questions)) return;

        result[key] = val;
      });
      return result;
    };

    const filteredMiseAnswers = filterByVisibility(session.miseANiveauAnswers);
    const filteredPrerequis = filterByVisibility(session.prerequisiteScore);
    const filteredComplementaryAnswers = filterByVisibility(
      session.complementaryQuestions,
    );
    const filteredAvailabilities = filterByVisibility(session.availabilities);
    const miseTitle = session.formationChoisie
      ? `Mise à niveau (réponses – ${safe(session.formationChoisie)})`
      : 'Mise à niveau (réponses)';

    return {
      recommendation: finalRecommendationValue,
      recommendations: proposedParcours,
      scorePretest: scoreFinal,
      finalLevel,
      qTextById,
      filteredMiseAnswers,
      filteredPrerequis,
      filteredComplementaryAnswers,
      filteredAvailabilities,
      miseTitle,
      levels,
    };
  }

  async submit(id: string) {
    const session = await this.findOne(id);

    // P3 same-formation shortcut: skip recommendation calc, use pre-set values
    if (session.p3SkipQuiz && session.finalRecommendation) {
      return this.submitP3SkipQuiz(session);
    }

    const {
      recommendation,
      scorePretest,
      finalLevel,
      qTextById,
      filteredMiseAnswers,
      filteredPrerequis,
      filteredComplementaryAnswers,
      filteredAvailabilities,
      miseTitle,
      levels,
    } = await this.getRecommendationData(session);

    const levelsTable = session.levelsScores
      ? `
        <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Scores par niveau</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
          <thead style="background:#f8fafc;">
            <tr>
              <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Niveau</th>
              <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Score</th>
              <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Validé</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(session.levelsScores)
              .map(([lvl, e]: any) => {
                const ok = e?.validated ? 'Oui' : 'Non';
                const score = `${Number(e?.score) || 0}/${Number(e?.total) || 0}`;
                const displayLvl = lvl.toLowerCase().includes('niveau')
                  ? lvl
                  : `Niveau ${lvl}`;
                return `<tr>
                  <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">${safe(
                    displayLvl,
                  )}</td>
                  <td style="padding:10px;border-top:1px solid #eee;">${safe(
                    score,
                  )}</td>
                  <td style="padding:10px;border-top:1px solid #eee;">${safe(
                    ok,
                  )}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      `
      : '';

    const beneficiaryEmail = session.stagiaire?.email || '';

    // Filter complementary questions to exclude those already in Mise à niveau
    const miseKeys = new Set(
      Object.keys(filteredMiseAnswers || {}).map(String),
    );
    const finalComplementary = Object.fromEntries(
      Object.entries(filteredComplementaryAnswers || {}).filter(
        ([key]) => !miseKeys.has(String(key)),
      ),
    );

    const extraContent = `
      <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Informations complémentaires</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <tbody>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Conseiller</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            session.conseiller,
          )}</td></tr>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Métier</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            session.metier,
          )}</td></tr>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Situation</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            Array.isArray(session.situation)
              ? session.situation.join(', ')
              : session.situation,
          )}</td></tr>
        </tbody>
      </table>

      ${
        session.parrainNom ||
        session.parrainPrenom ||
        session.parrainEmail ||
        session.parrainTelephone
          ? `
        <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Parrainage</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
          <tbody>
            <tr>
              <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Parrain / Marraine</td>
              <td style="padding:10px;border-top:1px solid #eee;">${safe(`${session.parrainPrenom || ''} ${session.parrainNom || ''}`.trim() || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Email Parrain</td>
              <td style="padding:10px;border-top:1px solid #eee;">${safe(session.parrainEmail)}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Téléphone Parrain</td>
              <td style="padding:10px;border-top:1px solid #eee;">${safe(session.parrainTelephone)}</td>
            </tr>
          </tbody>
        </table>
      `
          : ''
      }

      ${levelsTable}

      ${renderAnswersTable(
        'Pré-requis (réponses)',
        filteredPrerequis,
        qTextById,
      )}
      ${renderAnswersTable(
        'Questions complémentaires (réponses)',
        finalComplementary,
        qTextById,
      )}
      ${renderAnswersTable(
        'Usage de la langue',
        filteredMiseAnswers,
        qTextById,
      )}
      ${session.highLevelContinue ? `<div style="background-color: #FEF2F2; color: #991B1B; padding: 12px; border-left: 4px solid #EF4444; margin-bottom: 20px; border-radius: 4px; font-weight: bold;">⚠️ Niveau supérieur au parcours proposé. Le bénéficiaire a obtenu un score élevé pour cette formation et a souhaité maintenir sa demande.</div>` : ''}
    `;

    // Determine admin recipients from settings (can be comma-separated)
    const adminEmail = await this.settingsService.getValue(
      'ADMIN_EMAIL',
      'contact@wizi-learn.com',
    );

    let commercialEmail: string | null = null;
    if (session.conseiller) {
      const contactRepo = this.sessionRepo.manager.getRepository(Contact);
      const contacts = await contactRepo.find();
      const conseillerLower = session.conseiller.toLowerCase().trim();
      const match = contacts.find(c => 
        `${c.prenom} ${c.nom}`.toLowerCase().includes(conseillerLower) || 
        `${c.nom} ${c.prenom}`.toLowerCase().includes(conseillerLower) ||
        conseillerLower.includes(c.nom.toLowerCase())
      );
      if (match && match.email) {
        commercialEmail = match.email;
      }
    }

    const emailTo = commercialEmail || adminEmail;
    const emailCc = undefined;

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const filenameTimestamp = now
      .toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .slice(0, 16);

    const emailAttachments: any[] = [];
    const recommendationsList = recommendation
      .replace(/\|/g, '&')
      .split('&')
      .map(r => r.trim())
      .filter(Boolean);

    if (recommendationsList.length === 0) {
      recommendationsList.push(session.formationChoisie || 'Parcours');
    }

    // Generate PDF attachment for EACH formation
    const parcoursNumber = await this.getParcoursNumber(session);
    for (let i = 0; i < recommendationsList.length; i++) {
      const rec = recommendationsList[i];
      const pdfBuffer = await this.pdfService.generateSessionPdf({
        civilite: session.civilite,
        prenom: session.prenom,
        nom: session.nom,
        email: session.stagiaire?.email,
        telephone: session.telephone,
        conseiller: session.conseiller,
        metier: session.metier,
        situation: session.situation,
        formationChoisie: rec, // Specific formation
        finalRecommendation: recommendation, // Full recommendation string for labeling logic
        scoreFinal: scorePretest,
        levelsScores: session.levelsScores as Record<string, any>,
        prerequisiteAnswers: filteredPrerequis as Record<string, any>,
        complementaryAnswers: finalComplementary as Record<string, any>,
        availabilityAnswers: filteredAvailabilities as Record<string, any>,
        miseANiveauAnswers: filteredMiseAnswers as Record<string, any>,
        positionnementAnswers: session.positionnementAnswers as Record<string, any>,
        qTextById,
        parrainNom: session.parrainNom,
        parrainPrenom: session.parrainPrenom,
        parrainEmail: session.parrainEmail,
        parrainTelephone: session.parrainTelephone,
        highLevelContinue: session.highLevelContinue,
        isP3Mode: session.isP3Mode,
        parcoursNumber,
        stopLevelOrder: session.stopLevelOrder,
      });

      const safeRec = rec.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const pdfFilename = `Analyse_${session.prenom || ''}_${session.nom || ''}_${safeRec}_${filenameTimestamp}.pdf`.trim();

      emailAttachments.push({ filename: pdfFilename, content: pdfBuffer });
    }

    const publicPath = path.join(process.cwd(), 'public');
    const logoAopiaPath = path.join(publicPath, 'logo', 'Logo-AOPIA.png');
    const logoLikePath = path.join(
      publicPath,
      'logo',
      'Logo_Like_Formation.png',
    );

    if (fs.existsSync(logoAopiaPath)) {
      emailAttachments.push({
        filename: 'logo-aopia.png',
        path: logoAopiaPath,
        cid: 'logo_aopia',
      });
    }
    if (fs.existsSync(logoLikePath)) {
      emailAttachments.push({
        filename: 'logo-like.png',
        path: logoLikePath,
        cid: 'logo_like',
      });
    }

    // Send the email with PDF attachment to configured admin(s) if setting is enabled
    const autoSendEmail = await this.settingsService.getValue(
      'AUTO_SEND_EMAIL',
      'true',
    );

    // Determine dynamic labeling based on sequence and steps
    let badgeText = `P${parcoursNumber}`;
    let badgeStatus = parcoursNumber === 1 ? 'INITIAL' : (parcoursNumber === 3 ? '3ÈME PARCOURS' : 'COMPLÉMENTAIRE');
    
    // Explicit overrides for clear labeling
    if (recommendationsList.length > 1) {
      // If we have multiple recommendations (standard P1 & P2 outcome), force this label
      badgeText = 'P1 & P2';
      badgeStatus = 'INITIAL & COMPLÉMENTAIRE';
    } else if (session.isP3Mode || parcoursNumber >= 3) {
      // If we are in P3 mode or reached the 3rd session, force P3
      badgeText = 'P3';
      badgeStatus = '3ÈME PARCOURS';
    }

    const isInitial = badgeText.includes('P1');
    const badgeBg = isInitial ? '#ecfdf5' : '#EEF2FF';
    const badgeBorder = isInitial ? '#6ee7b7' : '#C7D2FE';
    const badgeColor = isInitial ? '#047857' : '#4338CA';

    if (autoSendEmail !== 'false') {
      await this.emailService.sendReport(
        emailTo,
        `Analyse des besoins - ${badgeText} ${session.prenom} ${session.nom} - ${session.formationChoisie}`,
        `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
        <div style="background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 8px; padding: 10px; margin-bottom: 20px; text-align: center;">
          <span style="color: ${badgeColor}; font-weight: bold; font-size: 14px;">
            🔷 ${badgeText} - PARCOURS ${badgeStatus}
          </span>
        </div>
        <h2 style="color: #0D8ABC; margin-bottom: 5px;">Bilan d'évaluation - Analyse des besoins</h2>
          <p style="color: #666; font-size: 14px; margin-top: 0;">Soumis le ${dateStr}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
          <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
          ${
            session.parrainNom || session.parrainPrenom
              ? `<p><strong>Parrain / Marraine :</strong> ${session.parrainPrenom || ''} ${session.parrainNom || ''}</p>`
              : ''
          }
          <p><strong>Formation :</strong> ${session.formationChoisie}</p>
          <p><strong>Recommandations :</strong></p>
          <div style="margin-bottom: 20px;">
            ${recommendation
              .split(' | ')
              .map(
                (r) =>
                  `<div style="padding: 10px; background: #f0fdf4; border-left: 4px solid #22C55E; margin-bottom: 8px; font-weight: bold; color: #166534;">${r}</div>`,
              )
              .join('')}
          </div>
          
          <div style="margin-top: 30px;">
            ${extraContent}
          </div>
          
          <div style="margin-top: 20px; text-align: right;">
            <img src="cid:logo_aopia" alt="AOPIA" height="30" style="height: 30px; margin-left: 15px; vertical-align: middle;">
            <img src="cid:logo_like" alt="Like Formation" height="30" style="height: 30px; vertical-align: middle;">
          </div>

          <p style="font-size: 11px; color: #999; margin-top: 40px;">
            Ceci est un rapport automatique généré par le système d'Analyse des Besoins AOPIA.
          </p>
        </div>`,
        emailAttachments,
        emailCc,
      );
    } else {
      console.log(
        `[SessionsService] Skipping report email for session ${id} (AUTO_SEND_EMAIL is false)`,
      );
    }

    return this.update(id, {
      finalRecommendation: recommendation,
      stopLevel: finalLevel
        ? finalLevel.label
        : levels.length > 0
          ? levels[0].label
          : 'Initial',
      stopLevelOrder: finalLevel ? finalLevel.order : (levels.length > 0 ? levels[0].order : 0),
      scorePretest,
      emailSentAt: new Date(),
      isCompleted: true,
    });
  }

  /**
   * P3 same-formation shortcut: submit without quiz.
   * Uses the pre-set finalRecommendation and stopLevel from the frontend.
   * Generates PDF and sends email like normal submit.
   */
  private async submitP3SkipQuiz(session: Session) {
    const recommendation = session.finalRecommendation || session.formationChoisie || 'Parcours P3';

    // Retrieve all processed maps/filters just like a normal submit
    const {
      qTextById,
      filteredMiseAnswers,
      filteredPrerequis,
      filteredComplementaryAnswers,
      filteredAvailabilities,
    } = await this.getRecommendationData(session);

    const adminEmail = await this.settingsService.getValue(
      'ADMIN_EMAIL',
      'contact@wizi-learn.com',
    );

    let commercialEmail: string | null = null;
    if (session.conseiller) {
      const contactRepo = this.sessionRepo.manager.getRepository(Contact);
      const contacts = await contactRepo.find();
      const conseillerLower = session.conseiller.toLowerCase().trim();
      const match = contacts.find(c =>
        `${c.prenom} ${c.nom}`.toLowerCase().includes(conseillerLower) ||
        `${c.nom} ${c.prenom}`.toLowerCase().includes(conseillerLower) ||
        conseillerLower.includes(c.nom.toLowerCase())
      );
      if (match && match.email) {
        commercialEmail = match.email;
      }
    }

    const emailTo = commercialEmail || adminEmail;
    const emailCc = undefined;

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const filenameTimestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 16);

    // Generate a single PDF for the P3 recommendation
    const pdfBuffer = await this.pdfService.generateSessionPdf({
      civilite: session.civilite,
      prenom: session.prenom,
      nom: session.nom,
      telephone: session.telephone,
      conseiller: session.conseiller,
      metier: session.metier,
      situation: session.situation,
      formationChoisie: session.formationChoisie || recommendation,
      finalRecommendation: recommendation,
      scoreFinal: -1, // No quiz taken
      levelsScores: {},
      prerequisiteAnswers: filteredPrerequis,
      complementaryAnswers: filteredComplementaryAnswers,
      availabilityAnswers: filteredAvailabilities,
      miseANiveauAnswers: filteredMiseAnswers,
      positionnementAnswers: session.positionnementAnswers as Record<string, any>,
      qTextById,
      parrainNom: session.parrainNom,
      parrainPrenom: session.parrainPrenom,
      parrainEmail: session.parrainEmail,
      parrainTelephone: session.parrainTelephone,
      highLevelContinue: false,
      isP3Mode: true,
      parcoursNumber: 3,
    });

    const safeRec = recommendation.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const pdfFilename = `Analyse_${session.prenom || ''}_${session.nom || ''}_P3_${safeRec}_${filenameTimestamp}.pdf`;

    const emailAttachments: any[] = [
      { filename: pdfFilename, content: pdfBuffer },
    ];

    const publicPath = path.join(process.cwd(), 'public');
    const logoAopiaPath = path.join(publicPath, 'logo', 'Logo-AOPIA.png');
    const logoLikePath = path.join(publicPath, 'logo', 'Logo_Like_Formation.png');

    if (fs.existsSync(logoAopiaPath)) {
      emailAttachments.push({ filename: 'logo-aopia.png', path: logoAopiaPath, cid: 'logo_aopia' });
    }
    if (fs.existsSync(logoLikePath)) {
      emailAttachments.push({ filename: 'logo-like.png', path: logoLikePath, cid: 'logo_like' });
    }

    const autoSendEmail = await this.settingsService.getValue('AUTO_SEND_EMAIL', 'true');
    if (autoSendEmail !== 'false') {
      await this.emailService.sendReport(
        emailTo,
        `Analyse des besoins - P3 ${session.prenom} ${session.nom} - ${recommendation}`,
        `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
          <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 10px; margin-bottom: 20px; text-align: center;">
            <span style="color: #4338CA; font-weight: bold; font-size: 14px;">🔷 P3 - 3ÈME PARCOURS (Même formation - Suite du parcours)</span>
          </div>
          <h2 style="color: #0D8ABC; margin-bottom: 5px;">Analyse des besoins - P3</h2>
          <p style="color: #666; font-size: 14px; margin-top: 0;">Complétude le ${dateStr}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
          <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
          <p><strong>Formation :</strong> ${session.formationChoisie || 'P3'}</p>
          <p><strong>Recommandation :</strong></p>
          <div style="margin-bottom: 20px;">
            <div style="padding: 10px; background: #f0fdf4; border-left: 4px solid #22C55E; margin-bottom: 8px; font-weight: bold; color: #166534;">
              ${recommendation}
            </div>
          </div>
          <p style="background: #f0fdf4; border-left: 4px solid #22C55E; padding: 10px; font-weight: bold; color: #166534;">
            Même formation que le parcours précédent → Suite logique du parcours attribuée (Niveau supérieur ou Option restante)
          </p>
          <div style="margin-top: 20px; text-align: right;">
            <img src="cid:logo_aopia" alt="AOPIA" height="30" style="height: 30px; margin-left: 15px; vertical-align: middle;">
            <img src="cid:logo_like" alt="Like Formation" height="30" style="height: 30px; vertical-align: middle;">
          </div>
          <p style="font-size: 11px; color: #999; margin-top: 40px;">
            Ceci est un rapport automatique généré par le système d'Analyse des Besoins AOPIA.
          </p>
        </div>`,
        emailAttachments,
        emailCc,
      );
    }

    return this.update(session.id, {
      finalRecommendation: recommendation,
      stopLevel: session.stopLevel || 'P3 Auto',
      stopLevelOrder: session.stopLevelOrder,
      scorePretest: -1,
      emailSentAt: new Date(),
      isCompleted: true,
    });
  }
}

function safe(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAnswersTable(
  title: string,
  answers: any,
  qTextById: Record<number, string>,
): string {
  if (!answers || Object.keys(answers).length === 0) return '';
  const rows = Object.entries(answers)
    .map(([key, val]) => {
      const idNum = Number(key);
      const qText = qTextById[idNum] || `Question ${key}`;
      const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
      return `
      <tr>
        <td style="padding:10px;border-top:1px solid #eee;font-size:13px;width:60%;">${safe(
          qText,
        )}</td>
        <td style="padding:10px;border-top:1px solid #eee;font-size:13px;font-weight:700;">${safe(
          displayVal,
        )}</td>
      </tr>`;
    })
    .join('');

  return `
    <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">${safe(title)}</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function isQuestionVisible(
  q: Question,
  responses: any,
  questionsPool: Question[],
): boolean {
  // 1. Check showIfRules (Advanced logic)
  if (
    q.showIfRules &&
    Array.isArray(q.showIfRules) &&
    q.showIfRules.length > 0
  ) {
    const results = q.showIfRules.map((rule) => {
      const parentId = rule.questionId;
      const parentResponse = responses[parentId] ?? responses[String(parentId)];

      if (
        parentResponse === undefined ||
        parentResponse === null ||
        parentResponse === ''
      ) {
        return false;
      }

      // Parent must also be visible recursively
      const parentQuestion = questionsPool.find((x) => x.id === parentId);
      if (
        parentQuestion &&
        !isQuestionVisible(parentQuestion, responses, questionsPool)
      ) {
        return false;
      }

      // If index based (qcm/checkbox)
      if (rule.responseIndexes && Array.isArray(rule.responseIndexes)) {
        if (Array.isArray(parentResponse)) {
          // Checkbox: parentResponse is array of indices
          return rule.responseIndexes.some((idx) =>
            parentResponse.map(Number).includes(Number(idx)),
          );
        } else {
          // QCM/Radio: parentResponse is single index
          return rule.responseIndexes.some(
            (idx) => Number(idx) === Number(parentResponse),
          );
        }
      }

      // If value based (text)
      if (rule.responseValue) {
        return (
          String(parentResponse).trim().toLowerCase() ===
          String(rule.responseValue).trim().toLowerCase()
        );
      }

      return false;
    });

    if (q.showIfOperator === 'AND') {
      return results.every((r) => r === true);
    }
    return results.some((r) => r === true);
  }

  // 2. Legacy showIfQuestionId simple dependency
  if (q.showIfQuestionId) {
    const parentId = q.showIfQuestionId;
    const parentResponse = responses[parentId] ?? responses[String(parentId)];
    if (
      parentResponse === undefined ||
      parentResponse === null ||
      parentResponse === ''
    ) {
      return false;
    }

    // Check recursive visibility
    const parentQuestion = questionsPool.find((x) => x.id === Number(parentId));
    if (
      parentQuestion &&
      !isQuestionVisible(parentQuestion, responses, questionsPool)
    ) {
      return false;
    }

    if (
      q.showIfResponseIndexes &&
      Array.isArray(q.showIfResponseIndexes) &&
      q.showIfResponseIndexes.length > 0
    ) {
      if (Array.isArray(parentResponse)) {
        return q.showIfResponseIndexes.some((idx) =>
          parentResponse.map(Number).includes(Number(idx)),
        );
      } else {
        return q.showIfResponseIndexes.some(
          (idx) => Number(idx) === Number(parentResponse),
        );
      }
    }

    if (q.showIfResponseValue) {
      return (
        String(parentResponse).trim().toLowerCase() ===
        String(q.showIfResponseValue).trim().toLowerCase()
      );
    }
  }

  // 3. Legacy metadata.condition (handicap example)
  if (q.metadata?.condition === "handicap == 'Oui'") {
    const handicapQ = questionsPool.find((item) =>
      item.text.toLowerCase().includes('handicap'),
    );
    if (handicapQ) {
      return String(responses[handicapQ.id]).toLowerCase() === 'oui';
    }
    return false;
  }

  return true;
}
