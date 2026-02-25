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
    // Adaptive Logic / Cumulative Logic
    // 1. Identify all levels for the chosen formation
    const levels = await this.levelRepo.find({
      where: { formation: { label: session.formationChoisie } },
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
    addIds(session.positionnementAnswers);

    const questions = ids.size
      ? await this.questionRepo.find({ where: { id: In([...ids]) } })
      : [];
    const qTextById: Record<number, string> = {};
    questions.forEach((q) => {
      qTextById[q.id] = q.text;
    });

    let finalRecommendationValue =
      finalLevel.recommendationLabel || `Niveau: ${finalLevel.label}`;

    const hasInsuffisant = Object.values(
      (session.prerequisiteScore as Record<string, any>) || {},
    ).some((val) => String(val).toLowerCase() === 'insuffisant');

    if (hasInsuffisant) {
      finalRecommendationValue = `Digcomp Initial & Word Initial & ${finalRecommendationValue}`;
    }

    if (session.formationChoisie?.toLowerCase().includes('wordpress')) {
      const objectiveQ = questions.find((q) =>
        q.text.toLowerCase().includes('objectif principal'),
      );
      const objectiveVal = objectiveQ
        ? (session.complementaryQuestions as Record<string, any>)?.[
            objectiveQ.id
          ]
        : null;

      if (objectiveVal) {
        if (objectiveVal.includes('vitrine')) {
          finalRecommendationValue = 'WordPress - Création de site vitrine';
        } else if (objectiveVal.includes('boutique')) {
          finalRecommendationValue =
            'WordPress - Création de boutique en ligne';
        } else {
          finalRecommendationValue = 'WordPress - Découverte et Initiation';
        }
      }
    }

    const bureautiqueChoiceQ = questions.find(
      (q) =>
        q.text.toLowerCase().includes('google workspace') &&
        q.text.toLowerCase().includes('microsoft office'),
    );
    const softwareChoice = bureautiqueChoiceQ
      ? (session.complementaryQuestions as Record<string, any>)?.[
          bureautiqueChoiceQ.id
        ]
      : null;

    if (
      softwareChoice &&
      (session.formationChoisie
        ?.toLowerCase()
        .match(/word|excel|powerpoint|outlook|bureautique/) ||
        session.formationChoisie === 'Pack Office')
    ) {
      finalRecommendationValue = `${softwareChoice} - ${finalLevel.label}`;
    }

    // Determine proposed parcours
    let proposedParcours: string[] = [];
    const idx = levels.findIndex((l) => l.id === finalLevel.id);
    const nextLevel =
      idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : null;

    const l1 = finalLevel.label;
    const l2 = nextLevel ? nextLevel.label : l1;

    if (hasInsuffisant) {
      // Rule: Proposal 1: Duo (Level X et Level X+1)
      //       Proposal 2: Level X + DigComp initial et Word initial
      proposedParcours = [
        `${l1} et ${l2}`,
        `${l1} + DigComp initial et Word initial`,
      ];
    } else {
      // Normal case: The Duo
      proposedParcours = [`${l1} et ${l2}`];
    }

    // Set combined string for backward compatibility and DB storage
    finalRecommendationValue = proposedParcours.join(' | ');

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
    };
  }

  async submit(id: string) {
    const session = await this.findOne(id);
    const { recommendation, scoreFinal, finalLevel, qTextById } =
      await this.getRecommendationData(session);

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
                return `<tr>
                  <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">${safe(
                    lvl,
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

    const extraContent = `
      <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Informations du bénéficiaire</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
        <tbody>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Bénéficiaire</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            `${session.civilite || ''} ${session.prenom || ''} ${session.nom || ''}`.trim(),
          )}</td></tr>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Email</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            beneficiaryEmail,
          )}</td></tr>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Téléphone</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            session.telephone,
          )}</td></tr>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Conseiller</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            session.conseiller,
          )}</td></tr>
          <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Marque</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
            session.brand,
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
        session.complementaryQuestions,
        qTextById,
      )}
      ${renderAnswersTable(
        'Disponibilités (réponses)',
        session.availabilities,
        qTextById,
      )}
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
      email: beneficiaryEmail,
      telephone: session.telephone,
      conseiller: session.conseiller,
      brand: session.brand,
      formationChoisie: session.formationChoisie,
      finalRecommendation: recommendation,
      scoreFinal: scoreFinal,
      levelsScores: session.levelsScores as Record<string, any>,
      prerequisiteAnswers: session.prerequisiteScore as Record<string, any>,
      complementaryAnswers: session.complementaryQuestions as Record<
        string,
        any
      >,
      availabilityAnswers: session.availabilities as Record<string, any>,
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

    // Send the email with PDF attachment to configured admin(s)
    await this.emailService.sendReport(
      adminEmail,
      `Analyse des besoins - Évaluation de ${session.prenom} ${session.nom} - ${session.formationChoisie}`,
      `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
        <h2 style="color: #0D8ABC; margin-bottom: 5px;">Bilan d'évaluation - Analyse des besoins</h2>
        <p style="color: #666; font-size: 14px; margin-top: 0;">Soumis le ${dateStr}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
        <p><strong>Email :</strong> ${session.stagiaire?.email || ''}</p>
        <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
        <p><strong>Formation :</strong> ${session.formationChoisie}</p>
        <p><strong>Recommandation(s) :</strong></p>
        <div style="margin-bottom: 20px;">
          ${recommendation
            .split(' | ')
            .map(
              (r) =>
                `<div style="padding: 10px; background: #f0fdf4; border-left: 4px solid #22C55E; margin-bottom: 8px; font-weight: bold; color: #166534;">${r}</div>`,
            )
            .join('')}
        </div>
        <p><strong>Score final :</strong> <span style="color: #2563eb; font-weight: bold;">${scoreFinal}%</span></p>
        
        <div style="margin-top: 30px;">
          ${extraContent}
        </div>
        
        <p style="font-size: 11px; color: #999; margin-top: 40px;">
          Ceci est un rapport automatique généré par le système d'Analyse des Besoins AOPIA.
        </p>
      </div>`,
      [{ filename: pdfFilename, content: pdfBuffer }],
    );

    return this.update(id, {
      finalRecommendation: recommendation,
      stopLevel: finalLevel.label,
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
