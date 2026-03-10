import { test, expect } from "@playwright/test";

type Scenario = {
  nom: string;
  prenom: string;
  telephone: string;
  statut: string;
  metier: string;
  profilAnswers: string[];
  formation: string;
  niveau: string;
  quizAnswers: string[];
  expectedResult: string; // texte attendu à la fin
};

const scenarios: Scenario[] = [
  {
    nom: "dfdf",
    prenom: "d",
    telephone: "d",
    statut: "Salarié",
    metier: "df",
    profilAnswers: ["Jamais", "Non", "Occasionnellement", "Oui avec quelques difficultés", "Non", "Occasionnellement"],
    formation: "Anglais",
    niveau: "Collège",
    quizAnswers: ["is", "are", "is watching", "is going"],
    expectedResult: "Revoir les bases", // A1 KO
  },
  {
    nom: "df2",
    prenom: "d2",
    telephone: "d2",
    statut: "Salarié",
    metier: "df2",
    profilAnswers: ["Occasionnellement", "Oui", "Quotidiennement"],
    formation: "Anglais",
    niveau: "Lycée",
    quizAnswers: ["is", "goes", "was", "have"],
    expectedResult: "Niveau B2", // exemple
  },
  // Tu peux ajouter B1, B2, C1 ici
];

for (const s of scenarios) {
  test(`Parcours anglais - ${s.expectedResult}`, async ({ page }) => {
    test.setTimeout(120000);

    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // Formulaire
    await page.getByRole("textbox", { name: "Nom", exact: true }).fill(s.nom);
    await page.getByRole("textbox", { name: "Prénom" }).fill(s.prenom);
    await page.getByRole("textbox", { name: "Téléphone" }).fill(s.telephone);
    await page.getByRole("button", { name: "Démarrer le parcours" }).click();

    // Statut
    await page.locator("label", { hasText: s.statut }).click();

    // Métier
    await page.getByRole("textbox", { name: "Ex: Assistant administratif," }).fill(s.metier);

    // Profil
    for (const answer of s.profilAnswers) {
      await page.locator("label", { hasText: answer }).click();
    }

    await page.getByRole("button", { name: "Valider mon profil" }).click();

    // Ignorer bilan
    const skipBtn = page.getByRole("button", { name: "Ignorer et continuer" });
    await expect(skipBtn).toBeVisible();
    await expect(skipBtn).toBeEnabled();
    await skipBtn.click();

    // Formation
    await page.getByRole("button", { name: s.formation }).click();
    const continuerBtn = page.getByRole("button", { name: /Continuer/ });
    await expect(continuerBtn).toBeVisible();
    await expect(continuerBtn).toBeEnabled();
    await continuerBtn.click();

    // Niveau
    await page.locator("label", { hasText: s.niveau }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Quiz
    for (const ans of s.quizAnswers) {
      await page.locator("button", { hasText: ans, exact: true }).click();
    }

    await page.getByRole("button", { name: /Suivant|Continuer/ }).click();

    // Assertion finale
    await expect(page.getByText(s.expectedResult)).toBeVisible();
  });
}