import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './entities/formation.entity';
import { Level } from './entities/level.entity';
import { Question } from './entities/question.entity';
import { Setting } from './entities/setting.entity';
import { User } from './entities/user.entity';
import { ParcoursRule } from './entities/parcours-rule.entity';
import { QuestionRule } from './entities/question-rule.entity';

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
    @InjectRepository(ParcoursRule)
    private parcoursRuleRepo: Repository<ParcoursRule>,
    @InjectRepository(QuestionRule)
    private questionRuleRepo: Repository<QuestionRule>,
  ) {}

  async onApplicationBootstrap() {
    console.log('Checking and seeding data...');
    // await this.seedFormations();
    // await this.seedWorkflow();
    // await this.seedAdmin();
    await this.seedSettings();
    // await this.seedParcours();
    // await this.seedQuestionRules();
    console.log('Seeding check complete!');
  }

  async seedSettings() {
    const count = await this.settingRepo.count();
    if (count > 0) return; // Don't re-seed if settings already exist

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
        description:
          "Autoriser le saut automatique de l'étape 'mise à niveau' en l'absence de questions",
      },
      {
        key: 'PREREQUISITE_FAILURE_VALUES',
        value: 'non,insuffisant,jamais',
        description:
          'Valeurs considérées comme un échec aux prérequis (séparées par des virgules)',
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
    const count = await this.userRepo.count();
    if (count > 0) return; // Don't re-seed if users already exist

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
    const count = await this.formationRepo.count();
    if (count > 0) return; // Don't re-seed if formations already exist

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
    const count = await this.levelRepo.count({
      where: { formation: { id: toeic.id } },
    });
    if (count > 0) return; // Don't re-seed levels if some already exist for TOEIC

    for (const lData of levelsData) {
      const level = await this.levelRepo.save({
        ...lData,
        formation: toeic,
      } as any);
      console.log(`Level ${lData.label} for TOEIC created.`);
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
        options: ['Oui', 'Non'],
        type: 'prerequis',
      },
      {
        text: "Se repérer dans l'environnement Windows (bureau, menu démarrer, fenêtres, icônes...)",
        options: ['Oui', 'Non'],
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
      } else {
        // Update options if they changed to ensure rules sync
        if (JSON.stringify(exists.options) !== JSON.stringify(qData.options)) {
          exists.options = qData.options;
          await this.questionRepo.save(exists);
          console.log(`Prerequisite question "${qData.text}" options updated.`);
        }
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

  private async seedParcours() {
    const count = await this.parcoursRuleRepo.count();
    if (count > 0) return;
    console.log('Seeding parcours rules...');

    const rules: Partial<ParcoursRule>[] = [
      // WORD
      {
        formation: 'Word',
        condition: 'Si test pré requis informatique KO (1 "Non")',
        formation1: 'TOSA Digcomp Initial',
        formation2: 'TOSA Word Initial',
        order: 0,
      },
      {
        formation: 'Word',
        condition: 'Si résultat du test < à Initial',
        formation1: 'TOSA Digcomp Initial',
        formation2:
          'TOSA Word/Excel /ppt Initial(choix de formation à valider avec votre conseiller)',
        order: 0.5,
      },
      {
        formation: 'Word',
        condition: 'Si résultat du test = Initial',
        formation1: 'TOSA Word Initial',
        formation2: 'TOSA Word Basique',
        order: 1,
      },
      {
        formation: 'Word',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA Word Basique',
        formation2: 'TOSA Word Opérationnel',
        order: 2,
      },
      {
        formation: 'Word',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA Word Opérationnel',
        formation2: 'TOSA Word Avancé',
        order: 3,
      },
      {
        formation: 'Word',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA Word Avancé',
        formation2: 'TOSA Word Expert',
        order: 4,
      },

      // EXCEL
      {
        formation: 'Excel',
        condition: 'Si test pré requis informatique KO (1 "Non")',
        formation1: 'TOSA Digcomp Initial',
        formation2: 'TOSA Excel Initial',
        order: 0,
      },
      {
        formation: 'Excel',
        condition: 'Si résultat du test < à Initial',
        formation1: 'TOSA Digcomp Initial',
        formation2:
          'TOSA Word/Excel /ppt Initial(choix de formation à valider avec votre conseiller)',
        order: 0.5,
      },
      {
        formation: 'Excel',
        condition: 'Si résultat du test = Initial',
        formation1: 'TOSA Excel Initial',
        formation2: 'TOSA Excel Basique',
        order: 1,
      },
      {
        formation: 'Excel',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA Excel Basique',
        formation2: 'TOSA Excel Opérationnel',
        order: 2,
      },
      {
        formation: 'Excel',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA Excel Opérationnel',
        formation2: 'TOSA Excel Avancé',
        order: 3,
      },
      {
        formation: 'Excel',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA Excel Avancé',
        formation2: 'TOSA Excel Expert',
        order: 4,
      },

      // ANGLAIS
      {
        formation: 'Anglais',
        condition: 'Si test = A1 - Revoir les bases et obtenir le niveau B1',
        formation1: 'A2',
        formation2: 'B1',
        order: 0,
      },
      {
        formation: 'Anglais',
        condition:
          'Si test = A2 - Consolider les bases et obtenir le niveau B1',
        formation1: 'A2',
        formation2: 'B1',
        order: 1,
      },
      {
        formation: 'Anglais',
        condition:
          "Si test = B1 - Développer l'autonomie et obtenir le niveau B1",
        formation1: 'A2',
        formation2: 'B1',
        order: 2,
      },
      {
        formation: 'Anglais',
        condition: 'Si test = B2 - Renforcer les compétences',
        formation1: 'B1',
        formation2: 'B2',
        order: 3,
      },
      {
        formation: 'Anglais',
        condition: 'Si test = C1 Se perfectionner',
        formation1: 'B2',
        formation2: 'C1',
        order: 4,
      },

      // PPT
      {
        formation: 'PowerPoint',
        condition: 'Si test pré requis informatique KO (1 "Non")',
        formation1: 'TOSA Digcomp Initial',
        formation2: 'TOSA PPT Initial',
        order: 0,
      },
      {
        formation: 'PowerPoint',
        condition: 'Si résultat du test < à Initial',
        formation1: 'TOSA Digcomp Initial',
        formation2:
          'TOSA Word/Excel /ppt Initial(choix de formation à valider avec votre conseiller)',
        order: 0.5,
      },
      {
        formation: 'PowerPoint',
        condition: 'Si résultat du test = Initial',
        formation1: 'TOSA PPT Initial',
        formation2: 'TOSA PPT Basique',
        order: 1,
      },
      {
        formation: 'PowerPoint',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA PPT Basique',
        formation2: 'TOSA PPT Opérationnel',
        order: 2,
      },
      {
        formation: 'PowerPoint',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA PPT Opérationnel',
        formation2: 'TOSA PPT Avancé',
        order: 3,
      },
      {
        formation: 'PowerPoint',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA PPT Avancé',
        formation2: 'TOSA PPT Expert',
        order: 4,
      },

      // DIGCOMP
      {
        formation: 'DigComp',
        condition: 'Si résultat du test < à Initial',
        formation1: 'TOSA Digcomp Initial',
        formation2:
          'TOSA Word/Excel /ppt Initial(choix de formation à valider avec votre conseiller)',
        order: 0,
      },
      {
        formation: 'DigComp',
        condition: 'Si résultat du test = Initial',
        formation1: 'TOSA Digcomp Initial',
        formation2: 'TOSA Digcomp Basique',
        order: 1,
      },
      {
        formation: 'DigComp',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA Digcomp Basique',
        formation2: 'TOSA Digcomp Opérationnel',
        order: 2,
      },
      {
        formation: 'DigComp',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA Digcomp Opérationnel',
        formation2: 'TOSA Digcomp Avancé',
        order: 3,
      },
      {
        formation: 'DigComp',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA Digcomp Avancé',
        formation2: 'TOSA Digcomp Expert',
        order: 4,
      },

      // WORDPRESS
      {
        formation: 'WordPress',
        condition: 'Si résultat du test = Initial',
        formation1: 'TOSA WordPress Initial',
        formation2: 'TOSA WordPress Basique',
        order: 0,
      },
      {
        formation: 'WordPress',
        condition: 'Si résultat du test = Basique ou Opérationnel',
        formation1: 'TOSA WordPress Basique',
        formation2: 'TOSA WordPress Opérationnel',
        order: 1,
      },

      // SKETCHUP
      {
        formation: 'SketchUp',
        condition: 'Si résultat du test = Initial',
        formation1: 'ICDL SketchUp Initial',
        formation2: 'ICDL SketchUp Basique',
        order: 0,
      },
      {
        formation: 'SketchUp',
        condition: 'Si résultat du test = Basique ou Opérationnel',
        formation1: 'ICDL SketchUp Basique',
        formation2: 'ICDL SketchUp Opérationnel',
        order: 1,
      },
      {
        formation: 'SketchUp',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'ICDL SketchUp Opérationnel',
        formation2: 'ICDL SketchUp Avancé',
        order: 2,
      },

      // FRANÇAIS
      {
        formation: 'Français',
        condition: 'Si résultat du test = Découverte',
        formation1: 'Voltaire Découverte',
        formation2: 'Voltaire Technique',
        order: 0,
      },
      {
        formation: 'Français',
        condition: 'Si résultat du test = Technique',
        formation1: 'Voltaire Technique',
        formation2: 'Voltaire Professionnel',
        order: 1,
      },
      {
        formation: 'Français',
        condition: 'Si résultat du test = Professionnel ou Affaires',
        formation1: 'Voltaire Professionnel',
        formation2: 'Voltaire Affaires',
        order: 2,
      },

      // OUTLOOK
      {
        formation: 'Outlook',
        condition: 'Si résultat du test < à Initial',
        formation1: 'TOSA Digcomp Initial',
        formation2:
          'TOSA Word/Excel /ppt Initial(choix de formation à valider avec votre conseiller)',
        order: 0.5,
      },
      {
        formation: 'Outlook',
        condition: 'Si résultat du test = Initial',
        formation1: 'TOSA Outlook Initial',
        formation2: 'TOSA Outlook Basique',
        order: 1,
      },
      {
        formation: 'Outlook',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA Outlook Basique',
        formation2: 'TOSA Outlook Opérationnel',
        order: 1,
      },
      {
        formation: 'Outlook',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA Outlook Opérationnel',
        formation2: 'TOSA Outlook Avancé',
        order: 2,
      },
      {
        formation: 'Outlook',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA Outlook Avancé',
        formation2: 'TOSA Outlook Expert',
        order: 3,
      },

      // PHOTOSHOP
      {
        formation: 'Photoshop',
        condition: 'Si résultat du test <= Initial',
        formation1: 'TOSA Photoshop Initial',
        formation2: 'TOSA Photoshop Basique',
        order: 0,
      },
      {
        formation: 'Photoshop',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA Photoshop Basique',
        formation2: 'TOSA Photoshop Opérationnel',
        order: 1,
      },
      {
        formation: 'Photoshop',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA Photoshop Opérationnel',
        formation2: 'TOSA Photoshop Avancé',
        order: 2,
      },
      {
        formation: 'Photoshop',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA Photoshop Avancé',
        formation2: 'TOSA Photoshop Expert',
        order: 3,
      },

      // GIMP
      {
        formation: 'GIMP',
        condition: 'Si résultat du test = Initial',
        formation1: 'ICDL GIMP Initial',
        formation2: 'ICDL GIMP Basique',
        order: 0,
      },
      {
        formation: 'GIMP',
        condition: 'Si résultat du test = Basique ou Opérationnel',
        formation1: 'ICDL GIMP Basique',
        formation2: 'ICDL GIMP Opérationnel',
        order: 1,
      },
      {
        formation: 'GIMP',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'ICDL GIMP Opérationnel',
        formation2: 'ICDL GIMP Avancé',
        order: 2,
      },

      // OUTILS COLLABORATIFS
      {
        formation: 'Outils Collaboratifs Google',
        condition: 'Si résultat du test < Initial',
        formation1: 'ICDL Outils Coll',
        formation2: 'ICDL Outils Coll',
        order: 0,
      },
      {
        formation: 'Outils Collaboratifs Google',
        condition: 'Si résultat du test = Initial ou Basique ou Opérationnel',
        formation1: 'ICDL Outils Coll',
        formation2: 'ICDL Docs/Sheets/Slides (choix à valider avec conseiller)',
        order: 1,
      },
      {
        formation: 'Outils Collaboratifs Google',
        condition: 'Si supérieur ou égal au dernier niveau disponible',
        formation1: 'ICDL Outils Coll',
        formation2: 'ICDL Docs/Sheets/Slides (choix à valider avec conseiller)',
        order: 2,
      },

      // DOCS / SHEETS / SLIDES
      {
        formation: 'Google Docs/Sheets/Slides',
        condition: 'Si résultat du test < Initial',
        formation1: 'ICDL Outils Coll',
        formation2: 'ICDL Outils Coll',
        order: 0,
      },
      {
        formation: 'Google Docs/Sheets/Slides',
        condition: 'Si résultat du test = Initial ou Basique ou Opérationnel',
        formation1: 'ICDL Docs/Sheets/Slides',
        formation2: 'ICDL Docs/Sheets/Slides',
        order: 1,
      },
      {
        formation: 'Google Docs/Sheets/Slides',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'ICDL Docs/Sheets/Slides',
        formation2: 'ICDL Docs/Sheets/Slides',
        order: 2,
      },

      // ILLUSTRATOR
      {
        formation: 'Illustrator',
        condition: 'Si résultat du test <= Initial',
        formation1: 'TOSA Illustrator Initial',
        formation2: 'TOSA Illustrator Basique',
        order: 0,
      },
      {
        formation: 'Illustrator',
        condition: 'Si résultat du test = Basique',
        formation1: 'TOSA Illustrator Basique',
        formation2: 'TOSA Illustrator Opérationnel',
        order: 1,
      },
      {
        formation: 'Illustrator',
        condition: 'Si résultat du test = Opérationnel',
        formation1: 'TOSA Illustrator Opérationnel',
        formation2: 'TOSA Illustrator Avancé',
        order: 2,
      },
      {
        formation: 'Illustrator',
        condition: 'Si résultat du test = Avancé ou Expert',
        formation1: 'TOSA Illustrator Avancé',
        formation2: 'TOSA Illustrator Expert',
        order: 3,
      },

      // IA INKREA
      {
        formation: 'IA Inkrea',
        condition: 'Test pré-requis technique uniquement',
        formation1: 'Inkrea IA',
        formation2: 'Inkrea IA',
        order: 0,
      },
    ];

    const entities = this.parcoursRuleRepo.create(
      rules.map((rule) => ({
        ...rule,
        requirePrerequisiteFailure: false,
      })),
    );
    await this.parcoursRuleRepo.save(entities);
    console.log(`Seeded ${entities.length} parcours rules.`);
  }

  private async seedQuestionRules() {
    const rules = [
      {
        text: 'Fréquence d’utilisation d’un ordinateur',
        value: 'Jamais',
        recommendation: 'DigComp Initial | Word/Excel/PPT Initial',
      },
      {
        text: 'Savoir allumer un ordinateur, utiliser le clavier et la souris',
        value: 'Non',
        recommendation: 'DigComp Initial | Word/Excel/PPT Initial',
      },
      {
        text: "Se repérer dans l'environnement Windows (bureau, menu démarrer, fenêtres, icônes...)",
        value: 'Non',
        recommendation: 'DigComp Initial | Word/Excel/PPT Initial',
      },
    ];

    for (const rule of rules) {
      const question = await this.questionRepo.findOne({
        where: { text: rule.text, type: 'prerequis' as any },
      });

      if (question) {
        const exists = await this.questionRuleRepo.findOne({
          where: {
            workflow: 'prerequis',
            questionId: question.id,
            expectedValue: rule.value,
          },
        });

        if (!exists) {
          const newRule = this.questionRuleRepo.create({
            workflow: 'prerequis',
            questionId: question.id,
            operator: 'EQUALS',
            expectedValue: rule.value,
            resultType: 'FORMATION_RECOMMENDATION',
            resultMessage: rule.recommendation,
            isActive: true,
            order: 0,
          });
          await this.questionRuleRepo.save(newRule);
          console.log(`Question rule for "${rule.text}" seeded.`);
        }
      }
    }
  }
}
