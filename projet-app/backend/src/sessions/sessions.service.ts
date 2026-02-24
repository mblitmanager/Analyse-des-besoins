import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { EmailService } from '../email/email.service';
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

  async submit(id: string) {
    const session = await this.findOne(id);

    // Adaptive Logic / Cumulative Logic
    // 1. Identify all levels for the chosen formation
    const levels = await this.levelRepo.find({
      where: { formation: { label: session.formationChoisie } }, // Simplified or use formation slug if stored
      order: { order: 'ASC' },
    });

    if (levels.length === 0) {
      // Fallback if formation not found by label
      return this.update(id, { finalRecommendation: 'Formation non reconnue' });
    }

    const scores =
      (session.levelsScores as Record<string, number | { score?: number }>) ||
      {};
    let finalLevel = levels[0]; // Default to first level

    for (const level of levels) {
      const raw = scores[level.label];
      const userScore =
        typeof raw === 'number' ? raw : (raw as any)?.score ?? undefined;

      if (userScore !== undefined) {
        if (userScore >= level.successThreshold) {
          finalLevel = level;
        } else {
          finalLevel = level;
          break; // Stop at the first level they fail
        }
      } else {
        // No score for this level, maybe they stopped before
        break;
      }
    }

    const recommendation =
      finalLevel.recommendationLabel || `Niveau: ${finalLevel.label}`;

    const safe = (v: any) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const renderAnswersTable = (
      title: string,
      answers: Record<string, any> | null | undefined,
      qTextById: Record<number, string>,
    ) => {
      if (!answers) return '';
      const rows = Object.entries(answers)
        .map(([key, val]) => {
          const idNum = Number(key);
          const label = qTextById[idNum] || `Question ${key}`;
          const display = Array.isArray(val) ? val.join(', ') : val;
          return `<tr>
            <td style="padding:10px;border-top:1px solid #eee;font-weight:700;vertical-align:top;">${safe(
              label,
            )}</td>
            <td style="padding:10px;border-top:1px solid #eee;color:#374151;vertical-align:top;">${safe(
              display,
            )}</td>
          </tr>`;
        })
        .join('');

      return `
        <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">${safe(title)}</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
          <thead style="background:#f8fafc;">
            <tr>
              <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Question</th>
              <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Réponse</th>
            </tr>
          </thead>
          <tbody>${rows || ''}</tbody>
        </table>
      `;
    };

    // Index texte des questions (pré-requis + complémentaires + disponibilités)
    const ids = new Set<number>();
    const addIds = (obj: any) => {
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

    // Score final global (si possible)
    const levelsEntries: any[] = session.levelsScores
      ? (Object.values(session.levelsScores as any) as any[])
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
            ${Object.entries(session.levelsScores as any)
              .map(([lvl, e]: any) => {
                const ok = e?.validated ? 'Oui' : 'Non';
                const score = `${Number(e?.score) || 0}/${Number(e?.total) || 0}`;
                return `<tr>
                  <td style=\"padding:10px;border-top:1px solid #eee;font-weight:700;\">${safe(
                    lvl,
                  )}</td>
                  <td style=\"padding:10px;border-top:1px solid #eee;\">${safe(
                    score,
                  )}</td>
                  <td style=\"padding:10px;border-top:1px solid #eee;\">${safe(
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

    // Send the email
    await this.emailService.sendReport(
      // 'contact@wizi-learn.fr', // In a real app, this would be the admin or brand email
      'herizo.randrianiaina@mbl-service.com', // In a real app, this would be the admin or brand email
      `Analyse des besoins - Évaluation de ${session.prenom} ${session.nom} - ${session.formationChoisie}`,
      `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0D8ABC;">Bilan d'évaluation</h2>
        <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
        <p><strong>Email :</strong> ${session.stagiaire?.email || ''}</p>
        <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
        <p><strong>Formation :</strong> ${session.formationChoisie}</p>
        <p><strong>Recommandation :</strong> <span style="color: #22C55E;">${recommendation}</span></p>
        <p><strong>Score final :</strong> <span style="color: #2563eb;">${scoreFinal}%</span></p>
        <hr />
        ${extraContent}
      </div>`,
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
