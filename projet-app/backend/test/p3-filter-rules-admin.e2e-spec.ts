import type { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createE2EApp,
  signupAndLoginAdmin,
} from './utils/e2e-helpers';

describe('P3 filter rules admin flow (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdRuleId: string;

  const api = '/api';

  beforeAll(async () => {
    app = await createE2EApp({ globalPrefix: 'api' });
    const auth = await signupAndLoginAdmin({ app, apiPrefix: api });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuse la creation sans source', async () => {
    await request(app.getHttpServer())
      .post(`${api}/p3-filter-rules`)
      .set(authHeader(token))
      .send({
        name: 'Invalid no source',
        filterMode: 'EXCLUDE',
        targetSlugs: ['wordpress'],
        order: 1,
        isActive: true,
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('refuse la creation sans cible', async () => {
    await request(app.getHttpServer())
      .post(`${api}/p3-filter-rules`)
      .set(authHeader(token))
      .send({
        name: 'Invalid no target',
        sourceCategory: 'bureautique',
        filterMode: 'ALLOW_ONLY',
        order: 2,
        isActive: true,
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('cree une regle valide', async () => {
    const res = await request(app.getHttpServer())
      .post(`${api}/p3-filter-rules`)
      .set(authHeader(token))
      .send({
        name: 'Bureautique restriction e2e',
        sourceCategory: 'BUREAUTIQUE',
        sourceSlugs: ['microsoft-word', 'microsoft-excel'],
        maxLevelOrder: 2,
        filterMode: 'ALLOW_ONLY',
        targetSlugs: ['google-workspace', 'microsoft-word'],
        targetCategories: ['Bureautique'],
        isActive: true,
        order: 1,
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('id');
    expect(res.body.sourceCategory).toBe('bureautique');
    expect(res.body.filterMode).toBe('ALLOW_ONLY');
    expect(res.body.targetSlugs).toEqual(
      expect.arrayContaining(['google-workspace', 'microsoft-word']),
    );
    createdRuleId = res.body.id;
  });

  it('modifie la regle', async () => {
    const res = await request(app.getHttpServer())
      .patch(`${api}/p3-filter-rules/${createdRuleId}`)
      .set(authHeader(token))
      .send({
        name: 'Bureautique restriction e2e updated',
        sourceCategory: 'bureautique',
        sourceSlugs: ['microsoft-word'],
        maxLevelOrder: 3,
        filterMode: 'EXCLUDE',
        targetSlugs: ['wordpress'],
        targetCategories: ['creation'],
        isActive: false,
        order: 5,
      })
      .expect(HttpStatus.OK);

    expect(res.body.name).toBe('Bureautique restriction e2e updated');
    expect(res.body.filterMode).toBe('EXCLUDE');
    expect(res.body.isActive).toBe(false);
    expect(res.body.order).toBe(5);
  });

  it('liste les regles et retrouve la regle modifiee', async () => {
    const res = await request(app.getHttpServer())
      .get(`${api}/p3-filter-rules`)
      .expect(HttpStatus.OK);

    const found = (res.body || []).find((r: any) => r.id === createdRuleId);
    expect(found).toBeDefined();
    expect(found.filterMode).toBe('EXCLUDE');
  });

  it('supprime la regle', async () => {
    await request(app.getHttpServer())
      .delete(`${api}/p3-filter-rules/${createdRuleId}`)
      .set(authHeader(token))
      .expect(HttpStatus.OK);

    const res = await request(app.getHttpServer())
      .get(`${api}/p3-filter-rules`)
      .expect(HttpStatus.OK);

    const found = (res.body || []).find((r: any) => r.id === createdRuleId);
    expect(found).toBeUndefined();
  });
});

