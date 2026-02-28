import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { Level } from './entities/level.entity';
import { Question } from './entities/question.entity';
import { Setting } from './entities/setting.entity';
import { User } from './entities/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Formation)
    private formationRepo: Repository<Formation>,
    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Setting)
    private settingRepo: Repository<Setting>,
  ) {}

  async onApplicationBootstrap() {
    console.log('Checking and seeding data...');
    await this.seedFormations();
    await this.seedWorkflow();
    await this.seedAdmin();
    await this.seedSettings();
    console.log('Seeding check complete!');
  }

  async seedSettings() {
    const settings = [
      {
        key: 'ADMIN_EMAIL',
        // value: 'contact@wizi-learn.com',
        value: 'herizo.randrianiaina@mbl-service.com',
        description: 'Email de réception des bilans',
      },
      {
        key: 'SUPPORT_PHONE',
        value: '01 23 45 67 89',
        description: 'Téléphone de support affiché',
      },
      {
        key: 'PLATFORM_NAME',
        value: 'Wizy-Learn',
        description: 'Nom de la plateforme',
      },
      {
        key: 'POSITIONNEMENT_PAGINATED',
        value: 'false',
        description: 'Afficher le positionnement question par question',
      },
      {
        key: 'PREREQUIS_PAGINATED',
        value: 'false',
        description: 'Afficher les prérequis question par question',
      },
      {
        key: 'AUTO_SKIP_MISE_A_NIVEAU',
        value: 'true',
        description: "Autoriser le saut automatique de l'étape 'mise à niveau' en l'absence de questions",
      },
    ];

    for (const s of settings) {
      const exists = await this.settingRepo.findOne({ where: { key: s.key } });
      if (!exists) {
        await this.settingRepo.save(this.settingRepo.create(s));
      }
    }
  }

  async seedAdmin() {
    const email = 'admin@wizy-learn.com';
    const exists = await this.userRepo.findOne({ where: { email } });
    if (!exists) {
      const user = this.userRepo.create({
        email,
        password: 'admin123', // In a real app, hash this!
        role: 'admin',
      });
      await this.userRepo.save(user);
    }
  }

  async seedFormations() {
    // 1. Formations
    const formationsData = [
      {
        slug: 'toeic',
        label: 'Anglais (TOEIC)',
        category: 'LANGUES',
        icon: 'translate',
        color: 'blue-600',
      },
      {
        slug: 'voltaire',
        label: 'Français (Voltaire)',
        category: 'LANGUES',
        icon: 'spellcheck',
        color: 'blue-600',
      },
      {
        slug: 'word',
        label: 'Word',
        category: 'BUREAUTIQUE',
        icon: 'description',
        color: 'blue-600',
      },
      {
        slug: 'excel',
        label: 'Excel',
        category: 'BUREAUTIQUE',
        icon: 'table_view',
        color: 'green-500',
      },
      {
        slug: 'outlook',
        label: 'Outlook',
        category: 'BUREAUTIQUE',
        icon: 'mail',
        color: 'blue-500',
      },
      {
        slug: 'powerpoint',
        label: 'PowerPoint',
        category: 'BUREAUTIQUE',
        icon: 'slideshow',
        color: 'orange-500',
      },
      {
        slug: 'sketchup',
        label: 'Sketchup',
        category: 'CRÉATION & DESIGN',
        icon: '3d_rotation',
        color: 'red-500',
      },
      {
        slug: 'illustrator',
        label: 'Illustrator',
        category: 'CRÉATION & DESIGN',
        icon: 'draw',
        color: 'orange-600',
      },
      {
        slug: 'wordpress',
        label: 'WordPress',
        category: 'DIGITAL & COMPÉTENCES',
        icon: 'web',
        color: 'blue-700',
      },
      {
        slug: 'digcomp',
        label: 'DigComp',
        category: 'DIGITAL & COMPÉTENCES',
        icon: 'devices',
        color: 'purple-600',
      },
    ];

    for (const fData of formationsData) {
      const exists = await this.formationRepo.findOne({
        where: { slug: fData.slug },
      });
      if (!exists) {
        await this.formationRepo.save({ ...fData, isActive: true } as any);
        console.log(`Formation ${fData.label} created.`);
      }
    }
  }

  async seedWorkflow() {
    const toeic = await this.formationRepo.findOne({
      where: { slug: 'toeic' },
    });
    if (!toeic) return;

    // 2. Levels for TOEIC
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

    const toeicLevels: Record<string, Level> = {};
    for (const lData of levelsData) {
      let level = await this.levelRepo.findOne({
        where: { label: lData.label, formation: { id: toeic.id } },
      });
      if (!level) {
        level = await this.levelRepo.save({
          ...lData,
          formation: toeic,
        } as any);
        console.log(`Level ${lData.label} for TOEIC created.`);
      }
      if (level) {
        toeicLevels[lData.label] = level;
      }
    }

    // 2b. Generic Levels for other formations (Disabled to favor specific Markdown imports)
    /*
    const genericLevelsData = [
      {
        label: 'Débutant',
        order: 1,
        successThreshold: 4,
        recommendationLabel: 'Parcours Débutant',
      },
      ...
    ];
    */

    // 3. Prerequisite Questions
    const prerequisQuestions = [
      {
        text: 'Fréquence d’utilisation d’un ordinateur',
        options: ['Tous les jours', 'Occasionnelle', 'Jamais'],
        type: 'prerequis',
      },
      {
        text: 'Savoir allumer un ordinateur, utiliser le clavier et la souris',
        options: ['Acquis', 'Moyen', 'Insuffisant'],
        type: 'prerequis',
      },
      {
        text: "Se repérer dans l'environnement Windows (bureau, menu démarrer, fenêtres, icônes...)",
        options: ['Acquis', 'Moyen', 'Insuffisant'],
        type: 'prerequis',
      },
      {
        text: 'Savoir naviguer sur internet',
        options: ['Acquis', 'Moyen', 'Insuffisant'],
        type: 'prerequis',
      },
      {
        text: 'Avez-vous déjà utilisé les logiciels suivants :',
        options: [
          'Traitement de texte type Word, Google Docs',
          'Tableur feuille de calcul type Excel, Google Sheets',
          'Logiciel de présentation type Powerpoint, Google slides',
          "Je n'utilise aucun de ces logiciels",
        ],
        type: 'prerequis',
      },
      {
        text: 'Savoir créer un dossier et y ranger et renommer un fichier',
        options: ['Acquis', 'Moyen', 'Insuffisant'],
        type: 'prerequis',
      },
      {
        text: 'Avez-vous déjà réalisé des démarches administratives en ligne ?',
        options: ['Oui', 'Non'],
        type: 'prerequis',
      },
      {
        text: 'Sur votre ordinateur, savez-vous effectuer les manipulations suivantes ?',
        options: [
          'Protéger votre ordinateur avec un antivirus',
          'Mettre à jour votre système d’exploitation et vos logiciels',
          'Changer vos mots de passe régulièrement',
          'Aucun des trois',
        ],
        type: 'prerequis',
      },
    ];

    for (let i = 0; i < prerequisQuestions.length; i++) {
      const qData = prerequisQuestions[i];
      const exists = await this.questionRepo.findOne({
        where: { text: qData.text, type: 'prerequis' as any },
      });
      if (!exists) {
        await this.questionRepo.save({
          ...qData,
          order: i + 1,
          correctResponseIndex: -1,
          type: 'prerequis' as any,
        });
        console.log(`Prerequisite question "${qData.text}" created.`);
      }
    }

    // 4. TOEIC Positionnement Questions
    const toeicQuestions = [
      // A1
      {
        text: 'Hello, my name ___ Sarah.',
        options: ['am', 'is', 'are', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['A1'],
        order: 1,
      },
      {
        text: 'We ___ English on Monday.',
        options: ['are', 'have', 'has', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['A1'],
        order: 2,
      },
      {
        text: 'She ___ 12 years old.',
        options: ['is', 'are', 'has', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['A1'],
        order: 3,
      },
      {
        text: 'There ___ a book on the table.',
        options: ['are', 'have', 'is', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: toeicLevels['A1'],
        order: 4,
      },
      {
        text: 'She ___ TV right now.',
        options: ['watches', 'watching', 'is watching', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: toeicLevels['A1'],
        order: 5,
      },
      {
        text: 'She ___ to the gym three times a week.',
        options: ['go', 'goes', 'is going', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['A1'],
        order: 6,
      },
      // A2
      {
        text: 'We ___ tired, so we decided to go home.',
        options: ['was', 'were', 'are', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['A2'],
        order: 7,
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
        level: toeicLevels['A2'],
        order: 8,
      },
      {
        text: 'There isn’t ___ milk left in the fridge.',
        options: ['many', 'much', 'a few', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['A2'],
        order: 9,
      },
      {
        text: 'He’s the ___ student in the class.',
        options: ['more tall', 'taller', 'tallest', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: toeicLevels['A2'],
        order: 10,
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
        level: toeicLevels['A2'],
        order: 11,
      },
      {
        text: 'We ___ to the supermarket yesterday.',
        options: ['go', 'went', 'are going', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['A2'],
        order: 12,
      },
      // B1
      {
        text: 'I’ve known her ___ we were children.',
        options: ['for', 'since', 'during', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['B1'],
        order: 13,
      },
      {
        text: 'If I ___ more time, I would travel around the world.',
        options: ['have', 'had', 'will have', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['B1'],
        order: 14,
      },
      {
        text: 'The castle ___ in 1692.',
        options: ['was built', 'is built', 'was building', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['B1'],
        order: 15,
      },
      {
        text: 'She ___ here for five years.',
        options: ['has worked', 'works', 'is working', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['B1'],
        order: 16,
      },
      {
        text: 'He felt sick because he ___ too much chocolate.',
        options: ['ate', 'has eaten', 'had eaten', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: toeicLevels['B1'],
        order: 17,
      },
      {
        text: 'I ___ more water recently and I feel better.',
        options: ['have been drinking', 'had drunk', 'drank', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['B1'],
        order: 18,
      },
      // B2
      {
        text: 'You ___ me about the problem earlier.',
        options: ['should have told', 'should told', 'must', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['B2'],
        order: 19,
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
        level: toeicLevels['B2'],
        order: 20,
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
        level: toeicLevels['B2'],
        order: 21,
      },
      {
        text: 'This time tomorrow, we ___ on the beach.',
        options: ['will lie', 'will be lying', 'lie', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['B2'],
        order: 22,
      },
      {
        text: 'The meeting was called ___ due to unexpected problems.',
        options: ['off', 'up', 'out', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['B2'],
        order: 23,
      },
      {
        text: '___ he was tired, he continued working.',
        options: ['Because', 'Despite', 'Although', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: toeicLevels['B2'],
        order: 24,
      },
      // C1
      {
        text: 'You ___ apologise now if you want to avoid further conflict.',
        options: ['would rather', 'had better', 'will', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['C1'],
        order: 25,
      },
      {
        text: 'I’d rather you ___ this matter confidential.',
        options: ['kept', 'keep', 'will keep', 'Je ne sais pas'],
        correctResponseIndex: 0,
        level: toeicLevels['C1'],
        order: 26,
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
        level: toeicLevels['C1'],
        order: 27,
      },
      {
        text: '___ the circumstances, his reaction was surprisingly restrained.',
        options: ['Because', 'Although', 'Given', 'Je ne sais pas'],
        correctResponseIndex: 2,
        level: toeicLevels['C1'],
        order: 28,
      },
      {
        text: 'Rarely ___ such a compelling argument.',
        options: ['I have heard', 'have I heard', 'I heard', 'Je ne sais pas'],
        correctResponseIndex: 1,
        level: toeicLevels['C1'],
        order: 29,
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
        level: toeicLevels['C1'],
        order: 30,
      },
    ];

    for (const qData of toeicQuestions) {
      if (!qData.level) continue;
      const exists = await this.questionRepo.findOne({
        where: { text: qData.text, level: { id: qData.level.id } },
      });
      if (!exists) {
        await this.questionRepo.save({
          ...(qData as any),
          type: 'positionnement' as any,
        });
        console.log(
          `Question "${qData.text.substring(0, 20)}..." for TOEIC added.`,
        );
      }
    }

    // 5. WordPress specific questions
    const wordpress = await this.formationRepo.findOne({
      where: { slug: 'wordpress' },
    });
    if (wordpress) {
      const wpQuestions = [
        {
          text: 'Quel est l’objectif principal de votre formation ?',
          options: [
            'Découvrir l’outil par curiosité',
            'Créer un site vitrine pour présenter votre activité',
            'Créer une boutique en ligne pour vendre des produits',
          ],
          type: 'complementary',
          metadata: { type: 'radio_toggle' },
        },
      ];
      for (const q of wpQuestions) {
        const exists = await this.questionRepo.findOne({
          where: { text: q.text, type: 'complementary' as any },
        });
        if (!exists) {
          await this.questionRepo.save({
            ...q,
            order: 100, // Put them at the end
            type: 'complementary' as any,
            correctResponseIndex: 0,
          });
        }
      }
    }

    // 6. Bureautique decision aid
    const bureautiqueFormations = ['word', 'excel', 'outlook', 'powerpoint'];
    for (const slug of bureautiqueFormations) {
      const formation = await this.formationRepo.findOne({ where: { slug } });
      if (formation) {
        const decisionAidQ = {
          text: 'Quelle suite logicielle souhaitez-vous privilégier ?',
          options: [
            'Microsoft Office (Word, Excel, PPT)',
            'Google Workspace (Docs, Sheets, Slides)',
          ],
          type: 'complementary',
          metadata: { type: 'radio_toggle' },
        };
        const exists = await this.questionRepo.findOne({
          where: { text: decisionAidQ.text, type: 'complementary' as any },
        });
        if (!exists) {
          await this.questionRepo.save({
            ...decisionAidQ,
            order: 50,
            type: 'complementary' as any,
            correctResponseIndex: 0,
          });
        }
      }
    }
  }
}
