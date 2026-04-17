import type { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createE2EApp,
  signupAndLoginAdmin,
} from './utils/e2e-helpers';

describe('API smoke (e2e) - /api prefix', () => {
  let app: INestApplication;
  let token: string;

  const api = '/api';

  beforeAll(async () => {
    app = await createE2EApp({ globalPrefix: 'api' });
    const auth = await signupAndLoginAdmin({ app, apiPrefix: api });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health & root', () => {
    it('GET /api/health -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/health`).expect(200);
    });

    it('GET /api -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/`).expect(200);
    });
  });

  describe('Auth', () => {
    it('GET /api/auth/me -> 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/auth/me`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /api/auth/me -> 200 with token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${api}/auth/me`)
        .set(authHeader(token))
        .expect(200);

      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('role');
    });

    it('GET /api/auth/me -> 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/auth/me`)
        .set({ Authorization: 'Bearer invalid.token.value' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Formations', () => {
    it('GET /api/formations -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/formations`).expect(200);
    });
  });

  describe('Workflow', () => {
    it('GET /api/workflow -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/workflow`).expect(200);
    });
  });

  describe('Questions', () => {
    it('GET /api/questions/prerequisites -> 200', async () => {
      await request(app.getHttpServer())
        .get(`${api}/questions/prerequisites`)
        .expect(200);
    });

    it('GET /api/questions -> 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/questions`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /api/questions -> 200 with token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/questions`)
        .set(authHeader(token))
        .expect(200);
    });

    it('POST /api/questions -> 400 for positionnement without levelId', async () => {
      await request(app.getHttpServer())
        .post(`${api}/questions`)
        .set(authHeader(token))
        .send({
          text: 'Question positionnement invalide',
          type: 'positionnement',
          responseType: 'qcm',
          options: ['A', 'B'],
          correctResponseIndex: 0,
          formationId: 1,
          isActive: true,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Sessions', () => {
    it('POST /api/sessions -> 201 (public create)', async () => {
      await request(app.getHttpServer())
        .post(`${api}/sessions`)
        .send({
          brand: 'Aopia',
          civilite: 'Monsieur',
          nom: 'Smoke',
          prenom: 'Test',
          telephone: '0102030405',
          formationChoisie: 'Word',
        })
        .expect(HttpStatus.CREATED);
    });

    it('GET /api/sessions -> 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/sessions`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /api/sessions -> 200 with token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/sessions`)
        .set(authHeader(token))
        .expect(200);
    });
  });

  describe('Contacts', () => {
    it('GET /api/contacts -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/contacts`).expect(200);
    });
  });

  describe('Settings', () => {
    it('GET /api/settings -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/settings`).expect(200);
    });

    it('PATCH /api/settings/ENABLE_P3 -> 401 without token', async () => {
      await request(app.getHttpServer())
        .patch(`${api}/settings/ENABLE_P3`)
        .send({ value: 'true' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('PATCH /api/settings/ENABLE_P3 -> 200 with token', async () => {
      await request(app.getHttpServer())
        .patch(`${api}/settings/ENABLE_P3`)
        .set(authHeader(token))
        .send({ value: 'true' })
        .expect(200);
    });
  });

  describe('Admin', () => {
    it('GET /api/admin/stats -> 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/admin/stats`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /api/admin/stats -> 200 with token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/admin/stats`)
        .set(authHeader(token))
        .expect(200);
    });

    it('GET /api/admin/users -> 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/admin/users`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /api/admin/users -> 200 with token', async () => {
      await request(app.getHttpServer())
        .get(`${api}/admin/users`)
        .set(authHeader(token))
        .expect(200);
    });
  });

  describe('Parcours', () => {
    it('GET /api/parcours -> 200', async () => {
      await request(app.getHttpServer()).get(`${api}/parcours`).expect(200);
    });

    it('POST /api/parcours -> 401 without token', async () => {
      await request(app.getHttpServer())
        .post(`${api}/parcours`)
        .send({ name: 'Smoke Parcours' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Question rules', () => {
    it('GET /api/question-rules -> 200', async () => {
      await request(app.getHttpServer())
        .get(`${api}/question-rules`)
        .expect(200);
    });
  });

  describe('P3 filter rules', () => {
    it('GET /api/p3-filter-rules -> 200', async () => {
      await request(app.getHttpServer())
        .get(`${api}/p3-filter-rules`)
        .expect(200);
    });

    it('POST /api/p3-filter-rules -> 401 without token', async () => {
      await request(app.getHttpServer())
        .post(`${api}/p3-filter-rules`)
        .send({ name: 'Smoke', active: true })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});

