import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { Formation } from '../entities/formation.entity';
import { Question } from '../entities/question.entity';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { QuestionRule } from '../entities/question-rule.entity';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';

describe('SessionsService - parcours métier', () => {
  let service: SessionsService;

  const levels: Level[] = [
    { id: 1, label: 'Initial', order: 1, successThreshold: 70, isActive: true } as Level,
    { id: 2, label: 'Basique', order: 2, successThreshold: 70, isActive: true } as Level,
    { id: 3, label: 'Opérationnel', order: 3, successThreshold: 70, isActive: true } as Level,
  ];

  const formation = { id: 10, slug: 'word', label: 'Word' } as Formation;

  const mockSessionRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => data),
    update: jest.fn(),
    remove: jest.fn(),
    manager: {
      getRepository: jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue(formation),
        find: jest.fn().mockResolvedValue([]),
      })),
    },
  };
  const mockLevelRepo = { find: jest.fn() };
  const mockStagiaireRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mockQuestionRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockParcoursRuleRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockQuestionRuleRepo = { find: jest.fn().mockResolvedValue([]) };
  const mockEmailService = { sendReport: jest.fn() };
  const mockSettingsService = {
    getValue: jest.fn((_key: string, fallback?: string) => Promise.resolve(fallback ?? null)),
  };
  const mockPdfService = { generateSessionPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')) };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSessionRepo.manager.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(formation),
      find: jest.fn().mockResolvedValue([]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
        { provide: getRepositoryToken(Level), useValue: mockLevelRepo },
        { provide: getRepositoryToken(Stagiaire), useValue: mockStagiaireRepo },
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepo },
        { provide: getRepositoryToken(ParcoursRule), useValue: mockParcoursRuleRepo },
        { provide: getRepositoryToken(QuestionRule), useValue: mockQuestionRuleRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    mockLevelRepo.find.mockResolvedValue(levels);
  });

  it('est défini', () => {
    expect(service).toBeDefined();
  });

  it('retourne un parcours P1 + P2 pour une règle standard à deux formations', async () => {
    mockParcoursRuleRepo.find.mockResolvedValue([
      {
        formation: 'Word',
        formationId: 10,
        condition: 'Résultat du test = Initial',
        formation1: 'Word Initial',
        formation2: 'Word Basique',
        order: 1,
        isActive: true,
        requirePrerequisiteFailure: false,
        prerequisiteConditions: [],
        selectionConditions: [],
      } as ParcoursRule,
    ]);

    const result = await service.getRecommendationData({
      id: 'p1-session',
      formationChoisie: 'word',
      stopLevel: 'Initial',
      levelsScores: { Initial: { score: 20, total: 10 } },
      prerequisiteScore: {},
      isP3Mode: false,
    } as Session);

    expect(result.recommendation).toBe('Word Initial');
    expect(result.recommendations).toEqual(['Word Initial', 'Word Basique']);
  });

  it('limite le parcours P3 à une seule recommandation', async () => {
    mockParcoursRuleRepo.find.mockResolvedValue([
      {
        formation: 'Word',
        formationId: 10,
        condition: 'Résultat du test = Initial',
        formation1: 'Word Initial',
        formation2: 'Word Basique',
        order: 1,
        isActive: true,
        requirePrerequisiteFailure: false,
        prerequisiteConditions: [],
        selectionConditions: [],
      } as ParcoursRule,
    ]);

    const result = await service.getRecommendationData({
      id: 'p3-session',
      formationChoisie: 'word',
      stopLevel: 'Initial',
      levelsScores: { Initial: { score: 20, total: 10 } },
      prerequisiteScore: {},
      isP3Mode: true,
      stagiaire: { id: 7 } as Stagiaire,
    } as Session);

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendation).toBe('Word Initial');
  });

  it('avance au niveau suivant en P3 si la recommandation est déjà présente dans un parcours précédent', async () => {
    mockParcoursRuleRepo.find.mockResolvedValue([
      {
        formation: 'Word',
        formationId: 10,
        condition: 'Résultat du test = Initial',
        formation1: 'Word Initial',
        formation2: '',
        order: 1,
        isActive: true,
        requirePrerequisiteFailure: false,
        prerequisiteConditions: [],
        selectionConditions: [],
      } as ParcoursRule,
    ]);
    mockSessionRepo.find.mockResolvedValue([
      { id: 'p3-session', finalRecommendation: null },
      { id: 'p2-session', formationChoisie: 'word', finalRecommendation: 'Word Initial' },
    ]);

    const result = await service.getRecommendationData({
      id: 'p3-session',
      formationChoisie: 'word',
      stopLevel: 'Initial',
      levelsScores: { Initial: { score: 20, total: 10 } },
      prerequisiteScore: {},
      isP3Mode: true,
      stagiaire: { id: 7 } as Stagiaire,
    } as Session);

    expect(result.recommendation).toBe('word Basique');
    expect(result.recommendations).toEqual(['word Basique']);
    expect(result.p3Redirected).toBe(true);
  });

  it('respecte le seuil et calcule le score global dans le fallback', async () => {
    const result = await service.getRecommendationData({
      id: 'fallback-session',
      formationChoisie: 'word',
      levelsScores: {
        Initial: { score: 8, total: 10 },
        Basique: { score: 5, total: 10 },
      },
      prerequisiteScore: {},
      isP3Mode: false,
    } as Session);

    expect(result.scorePretest).toBe(65);
    expect(result.finalLevel?.label).toBe('Basique');
    expect(result.recommendations).toEqual(['word Basique', 'word Opérationnel']);
  });

  it('lève NotFoundException lorsqu’une session demandée est absente', async () => {
    mockSessionRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-session')).rejects.toThrow(
      'Session not found',
    );
  });

  it('lève NotFoundException lors de la suppression d’une session absente', async () => {
    mockSessionRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('missing-session')).rejects.toThrow(
      'Session not found',
    );
    expect(mockSessionRepo.remove).not.toHaveBeenCalled();
  });

  it('ne persiste pas de suppression si le dépôt signale une erreur', async () => {
    const session = { id: 'session-to-remove' } as Session;
    mockSessionRepo.findOne.mockResolvedValue(session);
    mockSessionRepo.remove = jest.fn().mockRejectedValue(new Error('database unavailable'));

    await expect(service.remove(session.id)).rejects.toThrow(
      'database unavailable',
    );
  });

  it('normalise l’e-mail du stagiaire avant recherche et création', async () => {
    mockStagiaireRepo.findOne.mockResolvedValue(null);
    const created = { id: 12, email: 'candidate@example.com' };
    mockStagiaireRepo.create.mockReturnValue(created);
    mockStagiaireRepo.save.mockResolvedValue(created);
    mockSessionRepo.save.mockResolvedValue({ id: 'new-session' });

    await service.create({ email: '  Candidate@Example.com ' });

    expect(mockStagiaireRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'candidate@example.com' },
    });
    expect(mockStagiaireRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'candidate@example.com' }),
    );
  });

  it('réinitialise la progression quand la formation change', async () => {
    const existing = { id: 'session-1', formationChoisie: 'Excel' } as Session;
    mockSessionRepo.update.mockResolvedValue({ affected: 1 });
    jest.spyOn(service, 'findOne').mockResolvedValue(existing);

    await service.update('session-1', {
      formationChoisie: 'Word',
      levelsScores: { Initial: { score: 100, total: 1 } },
      finalRecommendation: 'Word Initial',
    });

    expect(mockSessionRepo.update).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        formationChoisie: 'Word',
        levelsScores: {},
        stopLevel: null,
        finalRecommendation: null,
        positionnementAnswers: {},
      }),
    );
  });
});
