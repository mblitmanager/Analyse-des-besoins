import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Contrat vivant des formations et parcours.
 *
 * Ces tests lisent le catalogue réellement servi par l'API. Le test UI crée une
 * unique session identifiable « Playwright Catalogue » pour atteindre l'écran
 * de sélection, puis contrôle toutes les formations dans cette même session.
 */
const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001/api';

type Formation = {
  id: number;
  label: string;
  isActive: boolean;
  availableInP3Only: boolean;
};

type Parcours = {
  id: number;
  formation: string;
  formationId: number | null;
  condition: string;
  formation1: string | null;
  formation2: string | null;
  isActive: boolean;
  parcoursTitle: string | null;
};

async function getActiveFormations(request: APIRequestContext): Promise<Formation[]> {
  const response = await request.get(`${apiBaseUrl}/formations`);
  expect(response.ok(), 'Le catalogue des formations doit être accessible').toBeTruthy();
  const formations = (await response.json()) as Formation[];
  return formations.filter((formation) => formation.isActive);
}

async function openFormationSelection(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Playwright');
  await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Catalogue');
  await page.getByRole('textbox', { name: 'Téléphone', exact: true }).fill('0612345678');
  await page.getByRole('button', { name: /démarrer le parcours/i }).click();
  await page.waitForURL(/\/(prerequis|formations)$/);

  // Le workflow peut désactiver l'étape prérequis : dans ce cas, le front
  // redirige directement vers le catalogue.
  if (page.url().endsWith('/prerequis')) {
    await page.locator('input.Wizi-input').first().fill('Test automatisé');
    await page.locator('.formation-card').first().click();

    const answered = new Set<string>();
    for (const option of await page.locator('.option-card').all()) {
      const name = await option.locator('input').getAttribute('name');
      if (name && !answered.has(name)) {
        await option.click();
        answered.add(name);
      }
    }

    await page.getByRole('button', { name: /valider mon profil/i }).click();
    await page.waitForURL('**/formations');
  }
}

test.describe('Catalogue — par formation', () => {
  test('chaque formation active est sélectionnable dans le front', async ({ page, request }, testInfo) => {
    test.setTimeout(90_000);
    const activeFormations = await getActiveFormations(request);
    const formations = activeFormations.filter((formation) => !formation.availableInP3Only);
    // Le groupe IA reste visible car il expose aussi Excel + IA et Word + IA,
    // deux spécialisations accessibles hors P3. Les autres entrées P3-only,
    // notamment Outlook, doivent rester masquées ici.
    const p3OnlyFormations = activeFormations.filter(
      (formation) => formation.availableInP3Only && formation.label.trim() !== 'Intelligence Artificielle Générative',
    );
    expect(formations, 'Au moins une formation standard active est requise').not.toHaveLength(0);
    await openFormationSelection(page);

    // Une formation réservée au P3 ne doit pas être proposée avant le passage
    // en mode P3. Outlook est notamment couvert par cette règle.
    for (const formation of p3OnlyFormations) {
      await test.step(`${formation.label.trim()} (P3 uniquement)`, async () => {
        await expect(
          page.locator('.formation-card').filter({ hasText: formation.label.trim() }),
          `« ${formation.label.trim()} » ne doit être proposée qu'en P3`,
        ).toHaveCount(0);
      });
    }

    for (const formation of formations) {
      const label = formation.label.trim();

      await test.step(`${label} (id ${formation.id})`, async () => {
        // Les spécialisations IA sont regroupées sous leur formation parente.
        if (label === 'Excel + IA' || label === 'Word + IA') {
          await page.locator('.formation-card').filter({ hasText: 'Intelligence Artificielle Générative' }).click();
        }

        const card = label === 'Excel + IA' || label === 'Word + IA'
          ? page.getByRole('button', { name: label, exact: false })
          : page.locator('.formation-card').filter({ hasText: label }).first();
        await expect(card, `Carte introuvable pour « ${label} »`).toBeVisible();
        await card.click();

        if (label === 'Intelligence Artificielle Générative') {
          await expect(page.getByRole('button', { name: /excel \+ ia/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /word \+ ia/i })).toBeVisible();
        } else {
          await expect(page.getByText('Formation sélectionnée', { exact: true }).last()).toBeVisible();
          await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
          await expect(page.getByRole('button', { name: /continuer/i }).last()).toBeEnabled();
        }

        const screenshot = await page.screenshot({
          path: `test-results/screenshots/catalogue-formation-${formation.id}.png`,
          fullPage: true,
        });
        await testInfo.attach(`formation-${formation.id}-${label}`, {
          body: screenshot,
          contentType: 'image/png',
        });

        // Le groupe IA sert seulement à révéler les deux spécialisations. Les
        // scénarios Excel + IA et Word + IA poursuivent eux-mêmes le parcours.
        if (label === 'Intelligence Artificielle Générative') return;

        await page.getByRole('button', { name: /continuer/i }).last().click();
        await page.waitForURL(/\/(mise-a-niveau|positionnement)$/);
        const nextStep = page.url().endsWith('/mise-a-niveau') ? 'mise-a-niveau' : 'positionnement';
        await expect(page.getByRole('main')).toBeVisible();

        const parcoursScreenshot = await page.screenshot({
          path: `test-results/screenshots/parcours-formation-${formation.id}-${nextStep}.png`,
          fullPage: true,
        });
        await testInfo.attach(`parcours-${formation.id}-${nextStep}`, {
          body: parcoursScreenshot,
          contentType: 'image/png',
        });

        // Retour au catalogue pour la formation suivante, dans la même session.
        await page.goto('/formations');
        await expect(page.getByRole('heading', { name: /quelle formation souhaitez-vous suivre/i })).toBeVisible();
      });
    }
  });
});

test.describe('Catalogue — par parcours', () => {
  test('chaque parcours actif est complet et rattaché à une formation active', async ({ request }) => {
    const formations = await getActiveFormations(request);
    const activeFormationIds = new Set(formations.map((formation) => formation.id));

    const response = await request.get(`${apiBaseUrl}/parcours?activeOnly=true`);
    expect(response.ok(), 'Les règles de parcours doivent être accessibles').toBeTruthy();
    const parcoursList = (await response.json()) as Parcours[];
    expect(parcoursList, 'Au moins un parcours actif est requis').not.toHaveLength(0);

    for (const parcours of parcoursList) {
      await test.step(`${parcours.parcoursTitle ?? `règle #${parcours.id}`}`, async () => {
        expect(parcours.isActive).toBeTruthy();
        expect(parcours.parcoursTitle?.trim(), 'Un parcours doit avoir un intitulé').toBeTruthy();
        expect(parcours.condition?.trim(), 'Un parcours doit avoir une condition').toBeTruthy();
        expect(parcours.formation?.trim(), 'Un parcours doit référencer une formation').toBeTruthy();
        // Un parcours peut être mono-module (ex. certaines spécialisations IA).
        // Dans tous les cas, il doit proposer au moins une formation.
        expect(
          parcours.formation1?.trim() || parcours.formation2?.trim(),
          'Un parcours doit contenir au moins un module recommandé',
        ).toBeTruthy();

        if (parcours.formationId !== null) {
          expect(
            activeFormationIds.has(parcours.formationId),
            `Le parcours « ${parcours.parcoursTitle} » pointe vers une formation inactive ou inexistante`,
          ).toBeTruthy();
        }
      });
    }
  });
});
