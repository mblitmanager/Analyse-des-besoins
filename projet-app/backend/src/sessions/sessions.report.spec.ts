import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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

/**
 * Characterization tests: pin the exact emails, PDFs and session updates produced
 * by submit/resendEmail so the report-building code can be refactored safely.
 */
describe('SessionsService report generation', () => {
  let service: SessionsService;
  let sendReport: jest.Mock;
  let generateSessionPdf: jest.Mock;
  let settings: Record<string, string>;

  const recommendationData = {
    recommendation: 'Word & Excel',
    scorePretest: 12,
    finalLevel: { label: 'B1', order: 3 },
    levels: [{ label: 'A1', order: 1 }],
    qTextById: { 1: 'Question prérequis', 2: 'Question complémentaire', 3: 'Usage' },
    correctAnswersById: { 10: 'a' },
    filteredMiseAnswers: { 3: 'Souvent' },
    filteredPrerequis: { 1: 'Oui' },
    filteredComplementaryAnswers: { 2: 'Matin', 3: 'Doublon mise à niveau' },
    filteredAvailabilities: { 4: 'Lundi' },
    miseTitle: 'Usage de la langue',
    parcoursTitle: 'Bureautique',
  };

  const baseSession = {
    id: 'session-1',
    civilite: 'Mme',
    prenom: 'Alice',
    nom: 'Martin',
    telephone: '0600000000',
    conseiller: 'Jean Dupont',
    metier: 'Assistante',
    situation: ['Salariée', 'Temps partiel'],
    formationChoisie: 'Word',
    parcoursTitle: null,
    levelsScores: {
      A1: { score: 6, total: 6, validated: true },
      'Niveau B1': { score: 2, total: 6, validated: false },
    },
    positionnementAnswers: { A1: { 10: 'a' } },
    parrainNom: 'Durand',
    parrainPrenom: 'Paul',
    parrainEmail: 'paul@example.test',
    parrainTelephone: '0700000000',
    highLevelContinue: true,
    isP3Mode: false,
    stopLevel: null,
    stopLevelOrder: 2,
    scorePretest: null,
    isCompleted: true,
    stagiaire: { email: 'alice@example.test' },
  };

  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date('2026-03-15T09:30:00Z'), doNotFake: ['nextTick', 'setImmediate'] });
    settings = { ADMIN_EMAIL: 'admin@example.test', AUTO_SEND_EMAIL: 'true' };
    sendReport = jest.fn().mockResolvedValue({ success: true });
    generateSessionPdf = jest
      .fn()
      .mockImplementation(async (data) => Buffer.from(`pdf:${data.finalRecommendation}`));

    const repo = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn(), update: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            ...repo,
            update: jest.fn().mockResolvedValue({}),
            manager: {
              getRepository: () => ({
                find: jest.fn().mockResolvedValue([
                  { prenom: 'Jean', nom: 'Dupont', email: 'jean.dupont@example.test' },
                ]),
              }),
            },
          },
        },
        { provide: getRepositoryToken(Level), useValue: repo },
        { provide: getRepositoryToken(Stagiaire), useValue: repo },
        { provide: getRepositoryToken(Question), useValue: repo },
        { provide: getRepositoryToken(ParcoursRule), useValue: repo },
        { provide: getRepositoryToken(QuestionRule), useValue: repo },
        { provide: EmailService, useValue: { sendReport } },
        {
          provide: SettingsService,
          useValue: { getValue: jest.fn(async (key: string, def: string) => settings[key] ?? def) },
        },
        { provide: PdfService, useValue: { generateSessionPdf } },
      ],
    }).compile();

    service = module.get(SessionsService);
    jest.spyOn(service, 'getRecommendationData').mockResolvedValue(recommendationData as any);
    jest.spyOn(service, 'getParcoursNumber').mockResolvedValue(1);
    jest.spyOn(service, 'update').mockImplementation(async (_id, data) => ({ updated: data }) as any);
  });

  afterEach(() => jest.useRealTimers());

  const useSession = (overrides: Record<string, any> = {}) =>
    jest.spyOn(service, 'findOne').mockResolvedValue({ ...baseSession, ...overrides } as any);

  // Logo paths depend on the working directory; buffers are shown as text; runs of
  // whitespace are collapsed so re-indenting HTML templates does not change snapshots.
  const normalize = (value: unknown) =>
    JSON.parse(
      JSON.stringify(value, (_key, v) => {
        if (v && v.type === 'Buffer' && Array.isArray(v.data)) return `<buffer ${Buffer.from(v.data).toString()}>`;
        if (typeof v === 'string') return v.split(process.cwd()).join('<cwd>').replace(/\s+/g, ' ').trim();
        return v;
      }),
    );

  const captured = (result: unknown) =>
    normalize({
      pdfCalls: generateSessionPdf.mock.calls.map(([data]) => data),
      emails: sendReport.mock.calls,
      updates: (service.update as jest.Mock).mock.calls,
      result,
    });

  it('submit: P1 & P2 report', async () => {
    useSession();
    expect(captured(await service.submit('session-1'))).toMatchSnapshot();
  });

  it('submit: single P3 recommendation', async () => {
    useSession({ isP3Mode: true, parrainNom: null, parrainPrenom: null, parrainEmail: null, parrainTelephone: null, highLevelContinue: false });
    jest.spyOn(service, 'getRecommendationData').mockResolvedValue({ ...recommendationData, recommendation: 'Excel', finalLevel: null } as any);
    jest.spyOn(service, 'getParcoursNumber').mockResolvedValue(3);
    expect(captured(await service.submit('session-1'))).toMatchSnapshot();
  });

  it('submit: AUTO_SEND_EMAIL disabled, unknown conseiller, no levels', async () => {
    settings.AUTO_SEND_EMAIL = 'false';
    useSession({ conseiller: 'Inconnu', levelsScores: null });
    jest.spyOn(service, 'getRecommendationData').mockResolvedValue({ ...recommendationData, recommendation: '', finalLevel: null, levels: [] } as any);
    expect(captured(await service.submit('session-1'))).toMatchSnapshot();
  });

  it('resendEmail: uses stored recommendation and score', async () => {
    useSession({ finalRecommendation: 'PowerPoint | Outlook', scorePretest: 7 });
    jest.spyOn(service, 'getParcoursNumber').mockResolvedValue(2);
    expect(captured(await service.resendEmail('session-1'))).toMatchSnapshot();
  });

  it('resendEmail: sends even when AUTO_SEND_EMAIL is disabled', async () => {
    settings.AUTO_SEND_EMAIL = 'false';
    useSession({ finalRecommendation: null });
    expect(captured(await service.resendEmail('session-1'))).toMatchSnapshot();
  });

  it('submit: P3 same-formation shortcut', async () => {
    useSession({ p3SkipQuiz: true, finalRecommendation: 'Word Avancé', stopLevel: null });
    expect(captured(await service.submit('session-1'))).toMatchSnapshot();
  });

  it('resendEmail: P3 same-formation shortcut', async () => {
    useSession({ p3SkipQuiz: true, finalRecommendation: 'Word Avancé', formationChoisie: null });
    expect(captured(await service.resendEmail('session-1'))).toMatchSnapshot();
  });

  it('resendEmail: rejects incomplete sessions', async () => {
    useSession({ isCompleted: false });
    await expect(service.resendEmail('session-1')).rejects.toThrow('Session non complétée');
  });
});
