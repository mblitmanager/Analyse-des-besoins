import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { Question } from '../entities/question.entity';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { QuestionRule } from '../entities/question-rule.entity';
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
      const found = await this.stagiaireRepo.findOne({
        where: { email: data.email },
      });
      stagiaire = found ?? undefined;

      if (!stagiaire) {
        stagiaire = this.stagiaireRepo.create({
          email: data.email,
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

        // Ensure visibility flags are passed to the frontend
        (session as any).isQuestionRuleOverride = data.isQuestionRuleOverride;
        (session as any).ruleResultType = data.ruleResultType;

        // Ensure values are synced if not already stored
        if (!session.finalRecommendation) {
          session.finalRecommendation = data.recommendation;
          session.scorePretest = data.scoreFinal;
        }
      } catch (e) {
        console.error('Failed to include recommendations array:', e);
      }
    }

    return session;
  }

  async update(id: string, data: Partial<Session>) {
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

  private async getRecommendationData(session: Session) {
    // 0. Fetch all question texts and details for filtering and labeling
    // This ensures consistency between PositionnementView, ResultatsView, Mail, and PDF
    const ids = new Set<number>();
    const addIds = (obj: any) => {
      if (!obj) return;
      Object.keys(obj).forEach((k) => {
        const n = Number(k);
        if (!isNaN(n)) ids.add(n);
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
        scoreFinal: session.scorePretest || 0,
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
      };
    }

    // 1. Evaluate Question Rules first (gives absolute priority)
    const questionRules = await this.questionRuleRepo.find({
      where: { isActive: true },
      order: { workflow: 'ASC', order: 'ASC' },
    });

    if (questionRules.length > 0 && !session.ignoreQuestionRules) {
      // Evaluate rules against session answers
      for (const rule of questionRules) {
        // Only evaluate if rule formation matches session formation, or if rule is global
        if (rule.formation && rule.formation !== session.formationChoisie) {
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
          const userAnswer = answers[rule.questionId];
          let conditionMet = false;

          // Normalize values for comparison
          const normalize = (v: any) =>
            String(v || '')
              .trim()
              .toLowerCase();
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
                scoreFinal: 0,
                finalLevel: null,
                qTextById,
                filteredMiseAnswers: session.miseANiveauAnswers,
                miseTitle:
                  rule.resultType === 'FORMATION_RECOMMENDATION'
                    ? 'Recommandation basée sur vos prérequis'
                    : 'Questions complémentaires',
                isQuestionRuleOverride: true, // Flag for frontend
                ruleResultType: rule.resultType,
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
        scoreFinal: 0,
        finalLevel: { label: 'Initial' } as Level,
        qTextById,
        filteredMiseAnswers: session.miseANiveauAnswers,
        miseTitle: 'Mise à niveau (réponses)',
      };
    }

    // Adaptive Logic / Cumulative Logic
    // 1. Identify all levels for the chosen formation
    const allLevels = await this.levelRepo.find({
      where: { formation: { label: session.formationChoisie as string } },
      order: { order: 'ASC' },
    });

    const levels = allLevels.filter((l) => l.isActive !== false);

    // ── Try active parcours rules first ──
    const activeRules = await this.parcoursRuleRepo.find({
      where: { formation: session.formationChoisie as string, isActive: true },
      order: { order: 'ASC' },
    });

    if (activeRules.length > 0 && levels.length > 0) {
      const stopLevelLabel = session.stopLevel || '';
      const stopUpper = stopLevelLabel.toUpperCase();
      let matchedRule: ParcoursRule | null = null;

      // Check if there are any prerequisite failures based on configurable settings
      const failureValuesStr = await this.settingsService.getValue(
        'PREREQUISITE_FAILURE_VALUES',
        'non,insuffisant,jamais',
      );
      const failureValues = failureValuesStr
        .split(',')
        .map((v) => v.trim().toLowerCase());

      const hasPrereqFailure =
        session.prerequisiteScore &&
        Object.values(session.prerequisiteScore).some((v) =>
          failureValues.includes(String(v).toLowerCase()),
        );

      const stopIdx = levels.findIndex((l) => l.label === stopLevelLabel);
      const evaluateRuleCondition = (rule: ParcoursRule): boolean => {
        // Condition is expected to be like "Si résultat du test < Basique" or "< Basique"
        const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);

        // Ensure both target strings match regardless of "Niveau" prefix
        const cleanLabel = (l: string) =>
          l
            .replace(/^Niveau\s+/i, '')
            .trim()
            .toUpperCase();

        if (condMatch) {
          const operator = condMatch[1].replace('<=', '≤').replace('>=', '≥');
          const targetStr = cleanLabel(condMatch[2]);
          const targetIdx = levels.findIndex(
            (l) => cleanLabel(l.label) === targetStr,
          );

          // If the target level doesn't exist in the formation, rule cannot be evaluated
          if (targetIdx === -1) return false;

          // Note: if user didn't even pass Level 0, their index should be handled correctly.
          // In the current architecture, stopIdx represents the first failed level.
          // Example: [Débutant, Initial, Basique]. If they fail Débutant, stopIdx = 0.

          switch (operator) {
            case '=':
              return stopIdx === targetIdx;
            case '<':
              return stopIdx < targetIdx;
            case '≤':
              return stopIdx <= targetIdx;
            case '>':
              return stopIdx > targetIdx;
            case '≥':
              return stopIdx >= targetIdx;
            default:
              return false;
          }
        }

        // Fallback for old rules without operators (implicit = or substring match)
        return rule.condition.toUpperCase().includes(stopUpper);
      };

      // 1. Evaluate all active rules to see which ones match the user's score AND prereq failure status
      const validRules = activeRules.filter(
        (r) =>
          evaluateRuleCondition(r) &&
          !!r.requirePrerequisiteFailure === !!hasPrereqFailure,
      );

      // 2. Select the rule with the highest priority (lowest order number).
      // If multiple rules matched and had the same order, pick the first one.
      if (validRules.length > 0) {
        // Sort by order just in case they aren't already sorted
        validRules.sort((a, b) => a.order - b.order);
        matchedRule = validRules[0];
      }

      // Fallback: last active rule that matches prereq status if possible, regardless of score conditions
      if (!matchedRule) {
        matchedRule =
          activeRules
            .reverse()
            .find(
              (r) => !!r.requirePrerequisiteFailure === !!hasPrereqFailure,
            ) || activeRules[0];
      }

      // Fallback: last active rule that matches prereq status if possible
      if (!matchedRule) {
        matchedRule =
          activeRules
            .reverse()
            .find(
              (r) => !!r.requirePrerequisiteFailure === !!hasPrereqFailure,
            ) || activeRules[0];
      }

      if (matchedRule) {
        const f1 = matchedRule.formation1 || '';
        const f2 = matchedRule.formation2 || '';
        const proposedParcours = f1 === f2 || !f2 ? [f1] : [f1, f2];
        const finalRecommendationValue = proposedParcours.join(' & ');

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

        const finalLevel = levels[levels.length - 1];

        return {
          recommendation: finalRecommendationValue,
          recommendations: proposedParcours,
          scoreFinal,
          finalLevel,
          qTextById,
          filteredMiseAnswers: session.miseANiveauAnswers,
          filteredPrerequis: session.prerequisiteScore,
          filteredComplementaryAnswers: session.complementaryQuestions,
          filteredAvailabilities: session.availabilities,
          miseTitle: 'Mise à niveau (réponses)',
        };
      }
    }

    if (levels.length === 0) {
      return {
        recommendation: 'Formation non reconnue',
        scoreFinal: 0,
        finalLevel: null,
        qTextById,
      };
    }

    const scores =
      (session.levelsScores as Record<string, number | { score?: number }>) ||
      {};
    let finalLevel = levels[0];

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

    // Determine proposed parcours (Logic Duo)
    // Rule:
    // Parcours 1: Last validated level (or Level 0 if nothing validated)
    // Parcours 2: Next level (First failed level)
    // If Beginner (Level 0) failed, suggest Level 0 and Level 1

    let lastValidatedIdx = -1;
    for (let i = 0; i < levels.length; i++) {
      const raw = scores[levels[i].label];
      const userScore =
        typeof raw === 'number' ? raw : ((raw as any)?.score ?? undefined);
      if (userScore !== undefined && userScore >= levels[i].successThreshold) {
        lastValidatedIdx = i;
      }
    }

    let l1: string, l2: string;

    const ensureNiveau = (label: string) => {
      if (!label) return label;
      return label.toLowerCase().includes('niveau') ? label : `Niveau ${label}`;
    };

    // ── Highest Active Level Validated Rule ──
    let stopLevelLabel = session.stopLevel;
    let stopLevelIdx = stopLevelLabel
      ? levels.findIndex((l) => l.label === stopLevelLabel)
      : -1;

    const passedStopLevel =
      session.levelsScores &&
      stopLevelLabel &&
      session.levelsScores[stopLevelLabel]?.validated;
    const isHighestActiveLevel = stopLevelIdx === levels.length - 1;

    if (passedStopLevel && isHighestActiveLevel) {
      const recommendationLevel = ensureNiveau(stopLevelLabel);
      const proposedParcours = [recommendationLevel];
      const finalRecommendationValue = proposedParcours.join(' & ');

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

      return {
        recommendation: finalRecommendationValue,
        recommendations: proposedParcours,
        scoreFinal,
        finalLevel,
        qTextById,
        filteredMiseAnswers,
        filteredPrerequis,
        filteredComplementaryAnswers,
        filteredAvailabilities,
        miseTitle,
      };
    }

    // ── Special rule for language formations (LANGUES category) ──
    // Check if this formation belongs to the LANGUES category
    const isLangueFormation =
      session.formationChoisie &&
      String(session.formationChoisie).toLowerCase().includes('anglais');

    if (isLangueFormation && levels.length >= 2) {
      // Language-specific regulatory rules:
      // Map level labels to find A1, A2, B1, B2, C1
      const labelMap = new Map(
        levels.map((l, i) => [l.label.toUpperCase(), i]),
      );

      const findIdx = (...targets: string[]) => {
        for (const t of targets) {
          const idx = labelMap.get(t);
          if (idx !== undefined) return idx;
        }
        return -1;
      };

      const a2Idx = findIdx('A2');
      const b1Idx = findIdx('B1');
      const b2Idx = findIdx('B2');
      const c1Idx = findIdx('C1');

      // Use stopLevel if available, as it represents the target level where the user struggled
      const stopLabelUpper = (session.stopLevel || '').toUpperCase();

      if (['A1', 'A2', 'B1'].includes(stopLabelUpper)) {
        // Fails A1, A2, or B1 → parcours A2 + B1
        l1 = ensureNiveau(
          a2Idx >= 0 ? levels[a2Idx].label : levels[0]?.label || '',
        );
        l2 = ensureNiveau(
          b1Idx >= 0 ? levels[b1Idx].label : levels[1]?.label || l1,
        );
      } else if (stopLabelUpper === 'B2') {
        // Passes B1, fails B2 → parcours B1 + B2
        l1 = ensureNiveau(
          b1Idx >= 0 ? levels[b1Idx].label : levels[0]?.label || '',
        );
        l2 = ensureNiveau(
          b2Idx >= 0 ? levels[b2Idx].label : levels[1]?.label || l1,
        );
      } else if (stopLabelUpper === 'C1') {
        // Fails C1 → parcours B2 + C1
        l1 = ensureNiveau(
          b2Idx >= 0 ? levels[b2Idx].label : levels[0]?.label || '',
        );
        l2 = ensureNiveau(
          c1Idx >= 0 ? levels[c1Idx].label : levels[1]?.label || l1,
        );
      } else {
        // Fallback: use generic logic below
        l1 = '';
        l2 = '';
      }

      // If language-specific rules matched, use them
      if (l1 && l2) {
        const proposedParcours = l1 === l2 ? [l1] : [l1, l2];
        const finalRecommendationValue = proposedParcours.join(' & ');

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

        return {
          recommendation: finalRecommendationValue,
          recommendations: proposedParcours,
          scoreFinal,
          finalLevel,
          qTextById,
          filteredMiseAnswers,
          filteredPrerequis,
          filteredComplementaryAnswers,
          filteredAvailabilities,
          miseTitle,
        };
      }
    }

    // ── Generic parcours logic (non-language formations) ──
    const isFrenchFormation =
      session.formationChoisie &&
      String(session.formationChoisie).toLowerCase().includes('français');

    // Use stopLevel if available, as it represents the target level where the user struggled
    stopLevelLabel = session.stopLevel;
    const stopLevelUpper = (stopLevelLabel || '').toUpperCase();

    // Fallback if stopLevelIdx is needed for generic logic when condition not met
    stopLevelIdx = stopLevelLabel
      ? levels.findIndex((l) => l.label === stopLevelLabel)
      : -1;

    if (isFrenchFormation) {
      if (
        stopLevelUpper.includes('DÉCOUVERTE') ||
        stopLevelUpper.includes('DECOUVERTE')
      ) {
        const l_dec =
          levels.find(
            (l) =>
              l.label.toUpperCase().includes('DÉCOUVERTE') ||
              l.label.toUpperCase().includes('DECOUVERTE'),
          )?.label || 'Découverte';
        const l_tech =
          levels.find((l) => l.label.toUpperCase().includes('TECHNIQUE'))
            ?.label || 'Technique';
        l1 = ensureNiveau(l_dec);
        l2 = ensureNiveau(l_tech);
      } else if (
        stopLevelUpper.includes('TECHNIQUE') ||
        stopLevelUpper.includes('PROFESSIONNEL')
      ) {
        const l_tech =
          levels.find((l) => l.label.toUpperCase().includes('TECHNIQUE'))
            ?.label || 'Technique';
        const l_pro =
          levels.find((l) => l.label.toUpperCase().includes('PROFESSIONNEL'))
            ?.label || 'Professionnel';
        l1 = ensureNiveau(l_tech);
        l2 = ensureNiveau(l_pro);
      } else if (stopLevelUpper.includes('AFFAIRES')) {
        const l_pro =
          levels.find((l) => l.label.toUpperCase().includes('PROFESSIONNEL'))
            ?.label || 'Professionnel';
        const l_aff =
          levels.find((l) => l.label.toUpperCase().includes('AFFAIRES'))
            ?.label || 'Affaires';
        l1 = ensureNiveau(l_pro);
        l2 = ensureNiveau(l_aff);
      } else {
        l1 = '';
        l2 = '';
      }
    } else {
      // General tools / IT courses
      if (stopLevelUpper.includes('INITIAL')) {
        const l_ini =
          levels.find((l) => l.label.toUpperCase().includes('INITIAL'))
            ?.label || 'Initial';
        const l_bas =
          levels.find((l) => l.label.toUpperCase().includes('BASIQUE'))
            ?.label || 'Basique';
        l1 = ensureNiveau(l_ini);
        l2 = ensureNiveau(l_bas);
      } else if (
        stopLevelUpper.includes('BASIQUE') ||
        stopLevelUpper.includes('OPÉRATIONNEL') ||
        stopLevelUpper.includes('OPERATIONNEL')
      ) {
        const l_bas =
          levels.find((l) => l.label.toUpperCase().includes('BASIQUE'))
            ?.label || 'Basique';
        const l_ope =
          levels.find(
            (l) =>
              l.label.toUpperCase().includes('OPÉRATIONNEL') ||
              l.label.toUpperCase().includes('OPERATIONNEL'),
          )?.label || 'Opérationnel';
        l1 = ensureNiveau(l_bas);
        l2 = ensureNiveau(l_ope);
      } else if (
        stopLevelUpper.includes('AVANCÉ') ||
        stopLevelUpper.includes('AVANCE')
      ) {
        const l_ope =
          levels.find(
            (l) =>
              l.label.toUpperCase().includes('OPÉRATIONNEL') ||
              l.label.toUpperCase().includes('OPERATIONNEL'),
          )?.label || 'Opérationnel';
        const l_ava =
          levels.find(
            (l) =>
              l.label.toUpperCase().includes('AVANCÉ') ||
              l.label.toUpperCase().includes('AVANCE'),
          )?.label || 'Avancé';
        l1 = ensureNiveau(l_ope);
        l2 = ensureNiveau(l_ava);
      } else if (stopLevelUpper.includes('EXPERT')) {
        const l_ava =
          levels.find(
            (l) =>
              l.label.toUpperCase().includes('AVANCÉ') ||
              l.label.toUpperCase().includes('AVANCE'),
          )?.label || 'Avancé';
        const l_exp =
          levels.find((l) => l.label.toUpperCase().includes('EXPERT'))?.label ||
          'Expert';
        l1 = ensureNiveau(l_ava);
        l2 = ensureNiveau(l_exp);
      } else {
        // Ultimate fallback
        if (stopLevelIdx !== -1) {
          l1 = ensureNiveau(levels[stopLevelIdx].label);
          if (stopLevelIdx < levels.length - 1) {
            l2 = ensureNiveau(levels[stopLevelIdx + 1].label);
          } else {
            l2 = l1;
          }
        } else {
          if (lastValidatedIdx < levels.length - 1) {
            l1 = ensureNiveau(levels[lastValidatedIdx + 1].label);
            if (lastValidatedIdx + 1 < levels.length - 1) {
              l2 = ensureNiveau(levels[lastValidatedIdx + 2].label);
            } else {
              l2 = l1;
            }
          } else {
            l1 = ensureNiveau(levels[levels.length - 1].label);
            l2 = l1;
          }
        }
      }
    }

    let proposedParcours: string[] = [];
    if (l1 === l2) {
      proposedParcours = [l1];
    } else {
      proposedParcours = [l1, l2];
    }

    // Set combined string for backward compatibility and DB storage
    const finalRecommendationValue = proposedParcours.join(' & ');

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
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return {
      recommendation: finalRecommendationValue,
      recommendations: proposedParcours,
      scoreFinal,
      finalLevel,
      qTextById,
      filteredMiseAnswers,
      filteredPrerequis,
      filteredComplementaryAnswers,
      filteredAvailabilities,
      miseTitle,
    };
  }

  async submit(id: string) {
    const session = await this.findOne(id);
    const {
      recommendation,
      scoreFinal,
      finalLevel,
      qTextById,
      filteredMiseAnswers,
      filteredPrerequis,
      filteredComplementaryAnswers,
      filteredAvailabilities,
      miseTitle,
    } = await this.getRecommendationData(session);

    if (!finalLevel) {
      return this.update(id, { finalRecommendation: 'Formation non reconnue' });
    }

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
        'Disponibilités (réponses)',
        filteredAvailabilities,
        qTextById,
      )}
      ${renderAnswersTable(miseTitle, filteredMiseAnswers, qTextById)}
      ${session.highLevelContinue ? `<div style="background-color: #FEF2F2; color: #991B1B; padding: 12px; border-left: 4px solid #EF4444; margin-bottom: 20px; border-radius: 4px; font-weight: bold;">⚠️ Le bénéficiaire a obtenu un score élevé pour cette formation, et a souhaité maintenir sa demande.</div>` : ''}
    `;

    // Determine admin recipients from settings (can be comma-separated)
    const adminEmail = await this.settingsService.getValue(
      'ADMIN_EMAIL',
      'herizo.randrianiaina@mbl-service.com',
    );

    // Generate PDF attachment
    const pdfBuffer = await this.pdfService.generateSessionPdf({
      civilite: session.civilite,
      prenom: session.prenom,
      nom: session.nom,
      telephone: session.telephone,
      conseiller: session.conseiller,
      metier: session.metier,
      situation: session.situation,
      formationChoisie: session.formationChoisie,
      finalRecommendation: recommendation,
      scoreFinal: scoreFinal,
      levelsScores: session.levelsScores as Record<string, any>,
      prerequisiteAnswers: filteredPrerequis as Record<string, any>,
      complementaryAnswers: finalComplementary as Record<string, any>,
      availabilityAnswers: filteredAvailabilities as Record<string, any>,
      miseANiveauAnswers: filteredMiseAnswers as Record<string, any>,
      qTextById,
      highLevelContinue: session.highLevelContinue,
    });

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

    const pdfFilename =
      `Analyse - ${session.prenom || ''} ${session.nom || ''} - ${filenameTimestamp}.pdf`.trim();

    const publicPath = path.join(process.cwd(), 'public');
    const logoAopiaPath = path.join(publicPath, 'logo', 'Logo-AOPIA.png');
    const logoLikePath = path.join(
      publicPath,
      'logo',
      'Logo_Like_Formation.png',
    );

    const emailAttachments: any[] = [
      { filename: pdfFilename, content: pdfBuffer },
    ];

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

    // Send the email with PDF attachment to configured admin(s)
    await this.emailService.sendReport(
      adminEmail,
      `Analyse des besoins - Évaluation de ${session.prenom} ${session.nom} - ${session.formationChoisie}`,
      `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
        <h2 style="color: #0D8ABC; margin-bottom: 5px;">Bilan d'évaluation - Analyse des besoins</h2>
        <p style="color: #666; font-size: 14px; margin-top: 0;">Soumis le ${dateStr}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
        <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
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
    );

    return this.update(id, {
      finalRecommendation: recommendation,
      stopLevel: finalLevel ? finalLevel.label : 'Initial',
      scorePretest: scoreFinal,
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
