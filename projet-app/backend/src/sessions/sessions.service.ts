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

    if (session.formationChoisie) {
      try {
        const data = await this.getRecommendationData(session);
        (session as any).recommendations = data.recommendations;

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
    // Handle special "Parcours Initial" virtual formation
    if (session.formationChoisie === 'Parcours Initial (DigComp & Word)') {
      return {
        recommendation: 'DigComp Initial | Word Initial',
        recommendations: ['DigComp Initial', 'Word Initial'],
        scoreFinal: 0,
        finalLevel: { label: 'Initial' } as Level,
        qTextById: {},
        filteredMiseAnswers: session.miseANiveauAnswers,
        miseTitle: 'Mise à niveau (réponses)',
      };
    }

    // Adaptive Logic / Cumulative Logic
    // 1. Identify all levels for the chosen formation
    const levels = await this.levelRepo.find({
      where: { formation: { label: session.formationChoisie as string } },
      order: { order: 'ASC' },
    });

    if (levels.length === 0) {
      return {
        recommendation: 'Formation non reconnue',
        scoreFinal: 0,
        finalLevel: null,
        qTextById: {},
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

    // Index texte des questions
    const ids = new Set<number>();
    const addIds = (obj: Record<string, any> | undefined | null) => {
      if (!obj) return;
      Object.keys(obj).forEach((k) => {
        const n = Number(k);
        if (!Number.isNaN(n)) ids.add(n);
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

    // helper to filter mise à niveau answers: include only answered questions for selected formation
    const formationLabel = session.formationChoisie;
    const filterMiseAnswers = (answers: any) => {
      if (!answers || !formationLabel) return answers;
      const result: Record<string, any> = {};
      Object.entries(answers).forEach(([key, val]) => {
        // Skip null, undefined, or empty responses
        if (val === null || val === undefined || val === '') return;

        const idNum = Number(key);
        const q = questions.find((x) => x.id === idNum);
        // include if question has no formation (global) or matches the chosen formation label
        if (!q || !q.formation || q.formation.label === formationLabel) {
          result[key] = val;
        }
      });
      return result;
    };

    const filteredMiseAnswers = filterMiseAnswers(session.miseANiveauAnswers);
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

    // Use stopLevel if available, as it represents the target level where the user struggled
    const stopLevelLabel = session.stopLevel;
    const stopLevelIdx = stopLevelLabel
      ? levels.findIndex((l) => l.label === stopLevelLabel)
      : -1;

    if (stopLevelIdx !== -1) {
      l1 = ensureNiveau(levels[stopLevelIdx].label);
      if (stopLevelIdx < levels.length - 1) {
        l2 = ensureNiveau(levels[stopLevelIdx + 1].label);
      } else {
        l2 = l1;
      }
    } else {
      // Fallback to score logic (for legacy or manual sessions)
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

    let proposedParcours: string[] = [];
    if (l1 === l2) {
      proposedParcours = [l1];
    } else {
      proposedParcours = [l1, l2];
    }

    // Set combined string for backward compatibility and DB storage
    const finalRecommendationValue = proposedParcours.join(' | ');

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
    const filteredComplementary = Object.fromEntries(
      Object.entries(session.complementaryQuestions || {}).filter(
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
        session.prerequisiteScore,
        qTextById,
      )}
      ${renderAnswersTable(
        'Questions complémentaires (réponses)',
        filteredComplementary,
        qTextById,
      )}
      ${renderAnswersTable(
        'Disponibilités (réponses)',
        session.availabilities,
        qTextById,
      )}
      ${renderAnswersTable(miseTitle, filteredMiseAnswers, qTextById)}
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
      prerequisiteAnswers: session.prerequisiteScore as Record<string, any>,
      complementaryAnswers: filteredComplementary as Record<string, any>,
      availabilityAnswers: session.availabilities as Record<string, any>,
      miseANiveauAnswers: filteredMiseAnswers as Record<string, any>,
      qTextById,
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
