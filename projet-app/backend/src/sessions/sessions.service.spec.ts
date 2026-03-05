import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { Question } from '../entities/question.entity';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';

describe('SessionsService', () => {
  let service: SessionsService;

  const mockSessionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockLevelRepo = {
    find: jest.fn(),
  };

  const mockStagiaireRepo = {};
  const mockQuestionRepo = {
    find: jest.fn().mockResolvedValue([]),
  };
  const mockEmailService = {
    sendReport: jest.fn(),
  };
  const mockSettingsService = {
    getValue: jest.fn().mockResolvedValue('admin@test.com'),
  };
  const mockPdfService = {
    generateSessionPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
        { provide: getRepositoryToken(Level), useValue: mockLevelRepo },
        { provide: getRepositoryToken(Stagiaire), useValue: mockStagiaireRepo },
        { provide: getRepositoryToken(Question), useValue: mockQuestionRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit', () => {
    it('should correctly calculate stopLevel for a standard formation (Word)', async () => {
      // Setup mock session
      const mockSession = {
        id: 'session-id-123',
        formationChoisie: 'Word',
        levelsScores: {
          Initial: { score: 80, total: 100 },
          Basique: { score: 80, total: 100 },
          Opérationnel: { score: 80, total: 100 },
          Avancé: { score: 50, total: 100 }, // Fails here (score 50 < 70)
        },
      };

      // Setup mock levels
      const mockLevels = [
        { id: 1, label: 'Initial', order: 1, successThreshold: 70 },
        { id: 2, label: 'Basique', order: 2, successThreshold: 70 },
        { id: 3, label: 'Opérationnel', order: 3, successThreshold: 70 },
        { id: 4, label: 'Avancé', order: 4, successThreshold: 70 },
        { id: 5, label: 'Expert', order: 5, successThreshold: 70 },
      ];

      mockSessionRepo.findOne.mockResolvedValue(mockSession);
      mockLevelRepo.find.mockResolvedValue(mockLevels);

      // Since it's update, it returns the updated session
      mockSessionRepo.update.mockResolvedValue({ affected: 1 });

      // We need to spy on update to see what finalRecommendation/stopLevel was calculated
      const updateSpy = jest.spyOn(mockSessionRepo, 'update');

      // Re-mock findOne to return something when update calls it
      mockSessionRepo.findOne
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({
          ...mockSession,
          finalRecommendation: 'Opérationnel | Avancé',
          stopLevel: 'Avancé',
        });

      await service.submit('session-id-123');

      expect(updateSpy).toHaveBeenCalledWith(
        'session-id-123',
        expect.objectContaining({
          stopLevel: 'Avancé',
        }),
      );
    });
  });
});
