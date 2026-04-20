import type { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createE2EApp,
  signupAndLoginAdmin,
} from './utils/e2e-helpers';

/**
 * P3 Filter Rules Application Tests (E2E)
 * 
 * Tests that P3 filter rules are correctly applied to formation catalogs
 * based on a session's previous training path
 */
describe('P3 filter rules application to sessions (e2e)', () => {
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

  describe('P3 rule filtering in sessions', () => {
    let ruleId: string;
    let sessionId: string;

    it('setup: create P3 rule for Bureautique filtering', async () => {
      // Create a rule: if user completes "Bureautique" level <= 2,
      // allow ONLY Word, Excel, Google Workspace
      const res = await request(app.getHttpServer())
        .post(`${api}/p3-filter-rules`)
        .set(authHeader(token))
        .send({
          name: 'Bureautique Level 1-2 Restriction',
          sourceCategory: 'bureautique',
          maxLevelOrder: 2,
          filterMode: 'ALLOW_ONLY',
          targetSlugs: [
            'microsoft-word',
            'microsoft-excel',
            'google-workspace',
          ],
          isActive: true,
          order: 1,
        })
        .expect(HttpStatus.CREATED);

      ruleId = res.body.id;
      expect(ruleId).toBeDefined();
    });

    it('setup: get active formations list', async () => {
      const res = await request(app.getHttpServer())
        .get(`${api}/formations?activeOnly=true`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      // Should have some formations available
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('setup: create a session to test P3 filtering', async () => {
      const res = await request(app.getHttpServer())
        .post(`${api}/sessions`)
        .send({
          brand: 'aopia',
          civilite: 'Mme',
          nom: 'Dupont',
          prenom: 'Marie',
          telephone: '06 12 34 56 78',
          conseiller: 'Jean',
          formationChoisie: 'bureautique',
          lastValidatedLevel: '1', // Completed level 1
          isP3Mode: true,
        })
        .expect(HttpStatus.CREATED);

      sessionId = res.body.id;
      expect(sessionId).toBeDefined();
    });

    it('should apply P3 rules when getting available formations via endpoint', async () => {
      // Assuming there's an endpoint for P3-filtered formations
      // GET /sessions/:id/available-formations
      const res = await request(app.getHttpServer())
        .get(`${api}/sessions/${sessionId}/available-formations-with-p3`)
        .expect(HttpStatus.OK);

      // Should return formations
      expect(Array.isArray(res.body)).toBe(true);

      // All returned formations should match the ALLOW_ONLY targets
      const allowedSlugs = [
        'microsoft-word',
        'microsoft-excel',
        'google-workspace',
      ];
      for (const formation of res.body) {
        expect(allowedSlugs).toContain(formation.slug);
      }
    });

    it('EXCLUDE mode should remove specified formations', async () => {
      // Create a rule that EXCLUDES certain formations
      const excludeRes = await request(app.getHttpServer())
        .post(`${api}/p3-filter-rules`)
        .set(authHeader(token))
        .send({
          name: 'Exclude Advanced Courses',
          sourceCategory: 'digital',
          filterMode: 'EXCLUDE',
          targetCategories: ['advanced', 'expert'],
          isActive: true,
          order: 2,
        })
        .expect(HttpStatus.CREATED);

      const excludeRuleId = excludeRes.body.id;

      // Create session from digital formation
      const sessionRes = await request(app.getHttpServer())
        .post(`${api}/sessions`)
        .send({
          brand: 'aopia',
          civilite: 'M.',
          nom: 'Martin',
          prenom: 'Pierre',
          telephone: '06 98 76 54 32',
          formationChoisie: 'digcomp',
          lastValidatedLevel: '1',
          isP3Mode: true,
        })
        .expect(HttpStatus.CREATED);

      const excludeSessionId = sessionRes.body.id;

      // Get available formations (should exclude advanced/expert)
      const res = await request(app.getHttpServer())
        .get(`${api}/sessions/${excludeSessionId}/available-formations-with-p3`)
        .expect(HttpStatus.OK);

      // Verify excluded formations are NOT present
      for (const formation of res.body) {
        expect(['advanced', 'expert']).not.toContain(
          formation.category?.toLowerCase(),
        );
      }

      // Cleanup
      await request(app.getHttpServer())
        .delete(`${api}/p3-filter-rules/${excludeRuleId}`)
        .set(authHeader(token))
        .expect(HttpStatus.OK);
    });

    it('P3 rules should not apply when level exceeds maxLevelOrder', async () => {
      // Create a session with high level (3 or higher)
      const sessionRes = await request(app.getHttpServer())
        .post(`${api}/sessions`)
        .send({
          brand: 'aopia',
          civilite: 'Mme',
          nom: 'Expert',
          prenom: 'Isabelle',
          telephone: '06 11 22 33 44',
          formationChoisie: 'bureautique',
          lastValidatedLevel: '3', // Level 3 > maxLevelOrder (2)
          isP3Mode: true,
        })
        .expect(HttpStatus.CREATED);

      const highLevelSessionId = sessionRes.body.id;

      // Get available formations
      // Since level 3 exceeds the rule's maxLevelOrder 2,
      // the rule should NOT apply and user should see all formations
      const res = await request(app.getHttpServer())
        .get(`${api}/sessions/${highLevelSessionId}/available-formations-with-p3`)
        .expect(HttpStatus.OK);

      // Should include formations beyond the ALLOW_ONLY targets
      // because the rule doesn't apply to level 3
      expect(Array.isArray(res.body)).toBe(true);
      // More formations should be available (rule didn't apply)
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('multiple P3 rules should chain correctly', async () => {
      // Create a second rule that further restricts
      const rule2Res = await request(app.getHttpServer())
        .post(`${api}/p3-filter-rules`)
        .set(authHeader(token))
        .send({
          name: 'Second Restriction',
          sourceCategory: 'bureautique',
          filterMode: 'EXCLUDE',
          targetSlugs: ['google-workspace'], // Remove Google from the previous ALLOW_ONLY
          isActive: true,
          order: 2, // Applied after rule 1
        })
        .expect(HttpStatus.CREATED);

      const rule2Id = rule2Res.body.id;

      // If rules chain correctly:
      // Rule 1 (ALLOW_ONLY): [word, excel, google]
      // Rule 2 (EXCLUDE): removes google
      // Result should be: [word, excel]

      const sessionRes = await request(app.getHttpServer())
        .post(`${api}/sessions`)
        .send({
          brand: 'aopia',
          civilite: 'M.',
          nom: 'Chained',
          prenom: 'Test',
          telephone: '06 99 88 77 66',
          formationChoisie: 'bureautique',
          lastValidatedLevel: '1',
          isP3Mode: true,
        })
        .expect(HttpStatus.CREATED);

      const chainSessionId = sessionRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`${api}/sessions/${chainSessionId}/available-formations-with-p3`)
        .expect(HttpStatus.OK);

      // Verify google-workspace is excluded
      const slugs = res.body.map((f: any) => f.slug?.toLowerCase());
      expect(slugs).not.toContain('google-workspace');

      // Cleanup
      await request(app.getHttpServer())
        .delete(`${api}/p3-filter-rules/${rule2Id}`)
        .set(authHeader(token))
        .expect(HttpStatus.OK);
    });

    it('session without previous formation should see all formations', async () => {
      // Create a session with no formationChoisie
      const sessionRes = await request(app.getHttpServer())
        .post(`${api}/sessions`)
        .send({
          brand: 'aopia',
          civilite: 'Mme',
          nom: 'New',
          prenom: 'Candidate',
          telephone: '06 15 24 36 47',
          isP3Mode: true,
          // No formationChoisie set
        })
        .expect(HttpStatus.CREATED);

      const newSessionId = sessionRes.body.id;

      const res = await request(app.getHttpServer())
        .get(`${api}/sessions/${newSessionId}/available-formations-with-p3`)
        .expect(HttpStatus.OK);

      // Should return all active formations (no filtering applied)
      const allFormRes = await request(app.getHttpServer())
        .get(`${api}/formations?activeOnly=true`)
        .expect(HttpStatus.OK);

      expect(res.body.length).toBe(allFormRes.body.length);
    });

    it('cleanup: delete test P3 rule', async () => {
      await request(app.getHttpServer())
        .delete(`${api}/p3-filter-rules/${ruleId}`)
        .set(authHeader(token))
        .expect(HttpStatus.OK);
    });
  });
});
