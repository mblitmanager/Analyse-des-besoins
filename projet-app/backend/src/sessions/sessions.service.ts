import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    private emailService: EmailService,
  ) {}

  create(data: Partial<Session>) {
    const session = this.sessionRepo.create(data);
    return this.sessionRepo.save(session);
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

    return this.update(id, {
      finalRecommendation: recommendation,
      stopLevel: finalLevel.label,
      emailSentAt: new Date(), // Mocking email send for now
    });
  }
}
