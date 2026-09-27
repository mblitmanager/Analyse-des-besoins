import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SessionsService } from './sessions.service';
import { Session } from '../entities/session.entity';
import { Level } from '../entities/level.entity';
import { Stagiaire } from '../entities/stagiaire.entity';
import { Question } from '../entities/question.entity';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { QuestionRule } from '../entities/question-rule.entity';
import { EmailService } from '../email/email.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionRepo: Repository<Session>;
  let stagiaireRepo: Repository<Stagiaire>;
  let emailService: EmailService;
  let pdfService: PdfService;

  const mockStagiaire = {
    id: 1,
    email: 'test@example.com',
    nom: 'Doe',
    prenom: 'John',
    civilite: 'M',
    telephone: '0123456789',
  };

  const mockSession = {
    id: 'session-1',
    email: 'test@example.com',
    nom: 'Doe',
    prenom: 'John',
    civilite: 'M',
    telephone: '0123456789',
    stagiaire: mockStagiaire,
    formationChoisie: null,
    isCompleted: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Level),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Stagiaire),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Question),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ParcoursRule),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QuestionRule),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendResultsEmail: jest.fn(),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: jest.fn(),
          },
        },
        {
          provide: PdfService,
          useValue: {
            generatePdf: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    sessionRepo = module.get<Repository<Session>>(getRepositoryToken(Session));
    stagiaireRepo = module.get<Repository<Stagiaire>>(getRepositoryToken(Stagiaire));
    emailService = module.get<EmailService>(EmailService);
    pdfService = module.get<PdfService>(PdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create session with new stagiaire if email not found', async () => {
      jest.spyOn(stagiaireRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(stagiaireRepo, 'create').mockReturnValue(mockStagiaire as any);
      jest.spyOn(stagiaireRepo, 'save').mockResolvedValue(mockStagiaire as any);
      jest.spyOn(sessionRepo, 'create').mockReturnValue(mockSession as any);
      jest.spyOn(sessionRepo, 'save').mockResolvedValue({ ...mockSession, id: 'session-1' } as any);

      const result = await service.create({
        email: 'test@example.com',
        nom: 'Doe',
        prenom: 'John',
      });

      expect(stagiaireRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(stagiaireRepo.create).toHaveBeenCalled();
      expect(sessionRepo.create).toHaveBeenCalled();
      expect(result.id).toBe('session-1');
    });

    it('should create session with existing stagiaire if email found', async () => {
      jest.spyOn(stagiaireRepo, 'findOne').mockResolvedValue(mockStagiaire as any);
      jest.spyOn(sessionRepo, 'create').mockReturnValue(mockSession as any);
      jest.spyOn(sessionRepo, 'save').mockResolvedValue({ ...mockSession, id: 'session-1' } as any);

      const result = await service.create({
        email: 'test@example.com',
        nom: 'Doe',
        prenom: 'John',
      });

      expect(stagiaireRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(stagiaireRepo.create).not.toHaveBeenCalled();
      expect(result.id).toBe('session-1');
    });

    it('should create session without email', async () => {
      jest.spyOn(sessionRepo, 'create').mockReturnValue(mockSession as any);
      jest.spyOn(sessionRepo, 'save').mockResolvedValue({ ...mockSession, id: 'session-1' } as any);

      const result = await service.create({
        nom: 'Doe',
        prenom: 'John',
      });

      expect(stagiaireRepo.findOne).not.toHaveBeenCalled();
      expect(result.id).toBe('session-1');
    });
  });

  describe('findAll', () => {
    it('should return all sessions when no stagiaireId provided', async () => {
      jest.spyOn(sessionRepo, 'find').mockResolvedValue([mockSession] as any);

      const result = await service.findAll();

      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: {},
        relations: ['stagiaire'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockSession]);
    });

    it('should return sessions for specific stagiaire', async () => {
      jest.spyOn(sessionRepo, 'find').mockResolvedValue([mockSession] as any);

      const result = await service.findAll('1');

      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: { stagiaire: { id: 1 } },
        relations: ['stagiaire'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockSession]);
    });
  });

  describe('findOne', () => {
    it('should return session with recommendations if formation chosen', async () => {
      const sessionWithFormation = {
        ...mockSession,
        formationChoisie: 'Excel',
        prerequisiteScore: { 1: 'A' },
      };

      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(sessionWithFormation as any);
      jest.spyOn(sessionRepo, 'find').mockResolvedValue([]);

      const result = await service.findOne('session-1');

      expect(sessionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        relations: ['stagiaire'],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update session and return updated session', async () => {
      const updateData = { nom: 'Updated' };
      const updatedSession = { ...mockSession, nom: 'Updated' };

      jest.spyOn(sessionRepo, 'update').mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedSession as any);

      const result = await service.update('session-1', updateData);

      expect(sessionRepo.update).toHaveBeenCalledWith('session-1', updateData);
      expect(service.findOne).toHaveBeenCalledWith('session-1');
      expect(result).toEqual(updatedSession);
    });

    it('should reset progress when formation is changed', async () => {
      const updateData = { formationChoisie: 'Word' };
      const updatedSession = { ...mockSession, formationChoisie: 'Word' };

      jest.spyOn(sessionRepo, 'update').mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedSession as any);

      await service.update('session-1', updateData);

      expect(sessionRepo.update).toHaveBeenCalledWith('session-1', {
        ...updateData,
        levelsScores: {},
        stopLevel: null,
        lastValidatedLevel: null,
        positionnementAnswers: {},
        finalRecommendation: null,
        scorePretest: null,
        explanationMessage: null,
        parcoursTitle: null,
        parcoursChoices: null,
      });
    });

    it('should not reset progress when p3SkipQuiz is set', async () => {
      const updateData = {
        formationChoisie: 'Word',
        p3SkipQuiz: true,
      };
      const updatedSession = { ...mockSession, formationChoisie: 'Word' };

      jest.spyOn(sessionRepo, 'update').mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedSession as any);

      await service.update('session-1', updateData);

      const updateCall = (sessionRepo.update as jest.Mock).mock.calls[0][1];
      expect(updateCall.levelsScores).toBeUndefined();
    });

    describe('server-side positionnement scoring', () => {
      const level = { id: 1, label: 'A1', order: 1, successThreshold: 2 };
      const questions = [
        { id: 10, type: 'positionnement', responseType: 'qcm', options: ['a', 'b'], correctResponseIndex: 0, level },
        { id: 11, type: 'positionnement', responseType: 'qcm', options: ['a', 'b'], correctResponseIndex: 1, level },
        {
          id: 12,
          type: 'positionnement',
          responseType: 'checkbox',
          options: ['x', 'y', 'z'],
          correctResponseIndexes: [0, 2],
          level,
        },
      ];

      beforeEach(() => {
        const questionRepo = (service as any).questionRepo;
        jest.spyOn(questionRepo, 'find').mockResolvedValue(questions);
        jest.spyOn(sessionRepo, 'update').mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
        jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as any);
      });

      it('overrides a forged score with the one computed from the answers', async () => {
        await service.update('session-1', {
          levelsScores: { A1: { score: 3, total: 3, percentage: 100, validated: true } },
          positionnementAnswers: { A1: { 10: 'b', 11: 'b', 12: ['z', 'x'] } },
          lastValidatedLevel: 'A1',
        } as any);

        const saved = (sessionRepo.update as jest.Mock).mock.calls[0][1];
        expect(saved.levelsScores.A1).toMatchObject({
          score: 2,
          total: 3,
          requiredCorrect: 2,
          validated: true,
        });
        expect(saved.lastValidatedLevel).toBe('A1');
      });

      it('invalidates a level claimed as validated without correct answers', async () => {
        await service.update('session-1', {
          levelsScores: { A1: { score: 3, total: 3, validated: true } },
          positionnementAnswers: { A1: { 10: 'b', 11: 'a' } },
          lastValidatedLevel: 'A1',
        } as any);

        const saved = (sessionRepo.update as jest.Mock).mock.calls[0][1];
        expect(saved.levelsScores.A1).toMatchObject({ score: 0, total: 3, validated: false });
        expect(saved.lastValidatedLevel).toBe('Débutant');
      });

      it('uses stored answers when the payload only carries levelsScores', async () => {
        jest
          .spyOn(sessionRepo, 'findOne')
          .mockResolvedValue({ positionnementAnswers: { A1: { 10: 'a', 11: 'b' } } } as any);

        await service.update('session-1', {
          levelsScores: { A1: { score: 0, total: 2, validated: false } },
        } as any);

        const saved = (sessionRepo.update as jest.Mock).mock.calls[0][1];
        expect(saved.levelsScores.A1).toMatchObject({ score: 2, total: 2, validated: true });
      });

      it('keeps P3 carry-over entries untouched', async () => {
        const carryOver = { score: 10, total: 10, percentage: 100, validated: true, isP3CarryOver: true };
        await service.update('session-1', {
          levelsScores: { A1: carryOver },
          positionnementAnswers: {},
        } as any);

        const saved = (sessionRepo.update as jest.Mock).mock.calls[0][1];
        expect(saved.levelsScores.A1).toEqual(carryOver);
      });
    });
  });

  describe('remove', () => {
    it('should remove session and return success', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepo, 'remove').mockResolvedValue(mockSession as unknown as Session);

      const result = await service.remove('session-1');

      expect(sessionRepo.findOne).toHaveBeenCalledWith({ where: { id: 'session-1' } });
      expect(sessionRepo.remove).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if session not found', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getParcoursNumber', () => {
    it('should return 3 for P3 mode', async () => {
      const p3Session = { ...mockSession, isP3Mode: true };

      const result = await service.getParcoursNumber(p3Session as unknown as Session);

      expect(result).toBe(3);
    });

    it('should return 1 for first session', async () => {
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepo, 'find').mockResolvedValue([mockSession] as any);

      const result = await service.getParcoursNumber(mockSession as unknown as Session);

      expect(result).toBe(1);
    });

    it('should return correct number for subsequent sessions', async () => {
      const session2 = { ...mockSession, id: 'session-2' };
      jest.spyOn(sessionRepo, 'findOne').mockResolvedValue(mockSession as any);
      jest.spyOn(sessionRepo, 'find').mockResolvedValue([mockSession, session2] as any);

      const result = await service.getParcoursNumber(session2 as unknown as Session);

      expect(result).toBe(2);
    });
  });
});