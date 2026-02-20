import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { Level } from './entities/level.entity';
import { Question } from './entities/question.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
  ) {}

  async onApplicationBootstrap() {
    const formationCount = await this.formationRepo.count();
    if (formationCount > 0) return;

    console.log('Seeding initial data...');

    // 1. Create TOEIC Formation
    const toeic = await this.formationRepo.save({
      slug: 'toeic',
      label: 'Anglais (TOEIC)',
      isActive: true,
    });

    // 2. Create Levels for TOEIC
    const levelsData = [
      {
        label: 'A1',
        order: 1,
        successThreshold: 5,
        recommendationLabel: 'Parcours Débutant (A1)',
      },
      {
        label: 'A2',
        order: 2,
        successThreshold: 4,
        recommendationLabel: 'Parcours Elémentaire (A2)',
      },
      {
        label: 'B1',
        order: 3,
        successThreshold: 4,
        recommendationLabel: 'Parcours Intermédiaire (B1)',
      },
      {
        label: 'B2',
        order: 4,
        successThreshold: 4,
        recommendationLabel: 'Parcours Avancé (B2)',
      },
      {
        label: 'C1',
        order: 5,
        successThreshold: 4,
        recommendationLabel: 'Parcours Expert (C1)',
      },
    ];

    const levels: Record<string, Level> = {};
    for (const data of levelsData) {
      levels[data.label] = await this.levelRepo.save({
        ...data,
        formation: toeic,
      });
    }

    // 3. Create Questions (Simplified and hardcoded based on TOEIC - Test AB.md)
    const questions = [
      // A1 Questions
      {
        text: 'Hello, my name ___ Sarah.',
        options: ['am', 'is', 'are', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['A1'],
        order: 1,
        type: 'positionnement' as const,
      },
      {
        text: 'We ___ English on Monday.',
        options: ['are', 'have', 'has', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['A1'],
        order: 2,
        type: 'positionnement' as const,
      },
      {
        text: 'She ___ 12 years old.',
        options: ['is', 'are', 'has', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['A1'],
        order: 3,
        type: 'positionnement' as const,
      },
      {
        text: 'There ___ a book on the table.',
        options: ['are', 'have', 'is', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: levels['A1'],
        order: 4,
        type: 'positionnement' as const,
      },
      {
        text: 'She ___ TV right now.',
        options: ['watches', 'watching', 'is watching', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: levels['A1'],
        order: 5,
        type: 'positionnement' as const,
      },
      {
        text: 'She ___ to the gym three times a week.',
        options: ['go', 'goes', 'is going', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['A1'],
        order: 6,
        type: 'positionnement' as const,
      },

      // A2 Questions
      {
        text: 'We ___ tired, so we decided to go home.',
        options: ['was', 'were', 'are', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['A2'],
        order: 7,
        type: 'positionnement' as const,
      },
      {
        text: 'While I ___ TV, I heard a strange noise.',
        options: [
          'am watching',
          'were watching',
          'was watching',
          'Je ne sais pas',
        ],
        correctResponseIndex: 2,
        level: levels['A2'],
        order: 8,
        type: 'positionnement' as const,
      },
      {
        text: 'There isn’t ___ milk left in the fridge.',
        options: ['many', 'much', 'a few', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['A2'],
        order: 9,
        type: 'positionnement' as const,
      },
      {
        text: 'He’s the ___ student in the class.',
        options: ['more tall', 'taller', 'tallest', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: levels['A2'],
        order: 10,
        type: 'positionnement' as const,
      },
      {
        text: 'Mary is ___ her sister.',
        options: [
          'as beautiful as',
          'beautiful',
          'more beautiful',
          'Je ne sais pas',
        ],
        correctResponseIndex: 0,
        level: levels['A2'],
        order: 11,
        type: 'positionnement' as const,
      },
      {
        text: 'We ___ to the supermarket yesterday.',
        options: ['go', 'went', 'are going', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['A2'],
        order: 12,
        type: 'positionnement' as const,
      },

      // B1 Questions
      {
        text: 'I’ve known her ___ we were children.',
        options: ['for', 'since', 'during', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['B1'],
        order: 13,
        type: 'positionnement' as const,
      },
      {
        text: 'If I ___ more time, I would travel around the world.',
        options: ['have', 'had', 'will have', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['B1'],
        order: 14,
        type: 'positionnement' as const,
      },
      {
        text: 'The castle ___ in 1692.',
        options: ['was built', 'is built', 'was building', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['B1'],
        order: 15,
        type: 'positionnement' as const,
      },
      {
        text: 'She ___ here for five years.',
        options: ['has worked', 'works', 'is working', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['B1'],
        order: 16,
        type: 'positionnement' as const,
      },
      {
        text: 'He felt sick because he ___ too much chocolate.',
        options: ['ate', 'has eaten', 'had eaten', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: levels['B1'],
        order: 17,
        type: 'positionnement' as const,
      },
      {
        text: 'I ___ more water recently and I feel better.',
        options: ['have been drinking', 'had drunk', 'drank', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['B1'],
        order: 18,
        type: 'positionnement' as const,
      },

      // B2 Questions
      {
        text: 'You ___ me about the problem earlier.',
        options: ['should have told', 'should told', 'must', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['B2'],
        order: 19,
        type: 'positionnement' as const,
      },
      {
        text: 'If the baby had slept better, I ___ so tired.',
        options: [
          'won’t be',
          'wouldn’t be',
          'wouldn’t have been',
          'Je ne sais pas',
        ],
        correctResponseIndex: 2,
        level: levels['B2'],
        order: 20,
        type: 'positionnement' as const,
      },
      {
        text: 'By this time next year, I ___ my studies.',
        options: [
          'will finish',
          'will have finished',
          'am finishing',
          'Je ne sais pas',
        ],
        correctResponseIndex: 1,
        level: levels['B2'],
        order: 21,
        type: 'positionnement' as const,
      },
      {
        text: 'This time tomorrow, we ___ on the beach.',
        options: ['will lie', 'will be lying', 'lie', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['B2'],
        order: 22,
        type: 'positionnement' as const,
      },
      {
        text: 'The meeting was called ___ due to unexpected problems.',
        options: ['off', 'up', 'out', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['B2'],
        order: 23,
        type: 'positionnement' as const,
      },
      {
        text: '___ he was tired, he continued working.',
        options: ['Because', 'Despite', 'Although', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: levels['B2'],
        order: 24,
        type: 'positionnement' as const,
      },

      // C1 Questions
      {
        text: 'You ___ apologise now if you want to avoid further conflict.',
        options: ['would rather', 'had better', 'will', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['C1'],
        order: 25,
        type: 'positionnement' as const,
      },
      {
        text: 'I’d rather you ___ this matter confidential.',
        options: ['kept', 'keep', 'will keep', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: levels['C1'],
        order: 26,
        type: 'positionnement' as const,
      },
      {
        text: 'The committee demanded that the report ___ before Friday.',
        options: [
          'is submitted',
          'was submitted',
          'be submitted',
          'Je ne sais pas',
        ],
        correctResponseIndex: 2,
        level: levels['C1'],
        order: 27,
        type: 'positionnement' as const,
      },
      {
        text: '___ the circumstances, his reaction was surprisingly restrained.',
        options: ['Because', 'Although', 'Given', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: levels['C1'],
        order: 28,
        type: 'positionnement' as const,
      },
      {
        text: 'Rarely ___ such a compelling argument.',
        options: ['I have heard', 'have I heard', 'I heard', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: levels['C1'],
        order: 29,
        type: 'positionnement' as const,
      },
      {
        text: 'Not only ___ late, but he also failed to apologise.',
        options: [
          'he arrived',
          'did he arrive',
          'he did arrive',
          'Je ne sais pas',
        ],
        correctResponseIndex: 1,
        level: levels['C1'],
        order: 30,
        type: 'positionnement' as const,
      },

      // Prerequisite Questions (Computer and Need Analysis)
      {
        text: 'Niveau numérique',
        options: ['Débutant', 'Intermédiaire', 'Avancé'],
        correctResponseIndex: -1,
        order: 1,
        type: 'prerequis' as const,
      },
      {
        text: 'Fréquence d’utilisation d’un ordinateur',
        options: ['Tous les jours', 'Occasionnelle', 'Jamais'],
        correctResponseIndex: -1,
        order: 2,
        type: 'prerequis' as const,
      },
    ];

    for (const q of questions) {
      await this.questionRepo.save(q);
    }

    console.log('Seeding complete!');
  }
}
