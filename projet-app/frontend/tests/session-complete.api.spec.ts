import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:3001/api';
const RUN_REAL_E2E = process.env.RUN_REAL_E2E === '1';

test.describe('E2E API - parcours complet d’une session', () => {
  test.skip(!RUN_REAL_E2E, 'Définir RUN_REAL_E2E=1 pour utiliser une API locale dédiée aux E2E.');

  test('crée, complète, soumet et relit une session', async ({ request }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.test`;

    const create = await request.post(`${API_BASE_URL}/sessions`, {
      data: {
        brand: 'aopia',
        civilite: 'Mme',
        nom: 'E2E',
        prenom: 'Candidate',
        telephone: '0600000000',
        conseiller: null,
        metier: 'Test automatisé',
        situation: ['salarié'],
        formationChoisie: 'word',
        email: uniqueEmail,
      },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    const created = await create.json();
    expect(created.id).toBeTruthy();

    const sessionId = created.id as string;
    const update = await request.patch(`${API_BASE_URL}/sessions/${sessionId}`, {
      data: {
        prerequisiteScore: {},
        levelsScores: {
          Initial: { score: 8, total: 10, validated: true },
          Basique: { score: 6, total: 10, validated: false },
        },
        positionnementAnswers: {},
        stopLevel: 'Basique',
        stopLevelOrder: 2,
        lastValidatedLevel: 'Initial',
      },
    });
    expect(update.ok(), await update.text()).toBeTruthy();

    const submit = await request.post(`${API_BASE_URL}/sessions/${sessionId}/submit`);
    expect(submit.ok(), await submit.text()).toBeTruthy();
    const submitted = await submit.json();
    expect(submitted).toBeTruthy();

    const read = await request.get(`${API_BASE_URL}/sessions/${sessionId}`);
    expect(read.ok(), await read.text()).toBeTruthy();
    const result = await read.json();
    expect(result.id).toBe(sessionId);
    expect(result.formationChoisie).toBe('word');
    expect(result.finalRecommendation).toBeTruthy();
    expect(result.isCompleted).toBe(true);
  });

  test('refuse une session inexistante sans masquer l’erreur', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/sessions/00000000-0000-0000-0000-000000000000`);
    expect(response.status()).toBe(404);
  });
});
