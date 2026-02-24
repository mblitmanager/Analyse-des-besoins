import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    @InjectRepository(Stagiaire)
    private stagiaireRepo: Repository<Stagiaire>,
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
    const session = await this.sessionRepo.findOne({ where: { id } });
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

    const scores = (session.levelsScores as Record<string, number>) || {};
    let finalLevel = levels[0]; // Default to first level

    for (const level of levels) {
      const userScore = scores[level.label];
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

    // Prepare extra sections for email
    let extraContent = '';
    if (session.complementaryQuestions) {
      extraContent += '<h3>Questions Complémentaires</h3><ul>';
      Object.entries(session.complementaryQuestions).forEach(([q, a]) => {
        extraContent += `<li><strong>${q}:</strong> ${a}</li>`;
      });
      extraContent += '</ul>';
    }

    if (session.availabilities) {
      extraContent += '<h3>Disponibilités</h3><ul>';
      Object.entries(session.availabilities).forEach(([key, val]) => {
        if (key === 'comments') return;
        extraContent += `<li><strong>${key}:</strong> ${val}</li>`;
      });
      if (session.availabilities['comments']) {
        extraContent += `<li><strong>Commentaires:</strong> ${session.availabilities['comments']}</li>`;
      }
      extraContent += '</ul>';
    }

    // Send the email
    await this.emailService.sendReport(
      'contact@wizy-learn.fr', // In a real app, this would be the admin or brand email
      `Nouvelle Évaluation: ${session.prenom} ${session.nom} - ${session.formationChoisie}`,
      `<div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0D8ABC;">Bilan d'évaluation Wizzy Learn</h2>
        <p><strong>Candidat :</strong> ${session.prenom} ${session.nom}</p>
        <p><strong>Formation :</strong> ${session.formationChoisie}</p>
        <p><strong>Recommandation :</strong> <span style="color: #22C55E;">${recommendation}</span></p>
        <hr />
        ${extraContent}
      </div>`,
    );

    return this.update(id, {
      finalRecommendation: recommendation,
      stopLevel: finalLevel.label,
      emailSentAt: new Date(),
      isCompleted: true,
    });
  }
}
