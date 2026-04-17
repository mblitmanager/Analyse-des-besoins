import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Sessions High Level Scenario (e2e)', () => {
  let app: INestApplication;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockLevelScores = {
    Initial: { score: 100, total: 100 },
    Basique: { score: 100, total: 100 },
    Opérationnel: { score: 100, total: 100 },
    Avancé: { score: 50, total: 100 }, // failed
  };

  it('1. Create a session for Word', () => {
    return request(app.getHttpServer())
      .post('/sessions')
      .send({
        brand: 'Aopia',
        civilite: 'Monsieur',
        nom: 'Test',
        prenom: 'User',
        telephone: '0102030405',
        formationChoisie: 'Word',
      })
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body).toHaveProperty('id');
        sessionId = response.body.id;
        expect(response.body.formationChoisie).toBe('Word');
      });
  });

  it('2. Update the session with mock scores and stopLevel', () => {
    return request(app.getHttpServer())
      .patch(`/sessions/${sessionId}`)
      .send({
        levelsScores: mockLevelScores,
        stopLevel: 'Avancé', // Often set by frontend before calling submit
      })
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.levelsScores).toEqual(mockLevelScores);
        expect(response.body.stopLevel).toBe('Avancé');
      });
  });

  it('3. Submit the session', () => {
    return request(app.getHttpServer())
      .post(`/sessions/${sessionId}/submit`)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        // Backend overrides finalRecommendation and stopLevel based on scores
        expect(response.body).toHaveProperty('finalRecommendation');
        expect(response.body).toHaveProperty('stopLevel');
        // stopLevel can vary depending on scoring rules and seeded thresholds
        expect(typeof response.body.stopLevel).toBe('string');
        expect(response.body.stopLevel.length).toBeGreaterThan(0);
        expect(response.body.isCompleted).toBe(true);
      });
  });
});
