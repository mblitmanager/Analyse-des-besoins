import { test, expect } from "@playwright/test";
//illustrator Opérationnel OK
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");

  await page.getByText("Madame").click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Nom", exact: true })
    .fill("Illustrator");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("Test");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 60");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("Comptable");
  await page.locator(".formation-card__radio").first().click();
  await page
    .locator(
      "div:nth-child(4) > .flex.items-center.w-full > .formation-card__radio",
    )
    .click();
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page.getByText("Jamais").nth(1).click();
  await page.getByText("Non").nth(2).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page.getByText("Jamais").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "star Illustrator" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").first().click();
  await page.locator("label").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Illustrator permet d'agrandir").click();
  await page.getByText("Le plan de travail.").click();
  await page
    .locator("label")
    .filter({ hasText: "Du dessin vectoriel" })
    .click();
  await page.getByText(".AI").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("Dans la barre d'outils (à").click();
  await page.locator("label").filter({ hasText: "Le plan de travail" }).click();
  await page.locator("label").filter({ hasText: "Majuscule (Shift)" }).click();
  await page.getByText("Menu Objet > Disposition >").click();
  await page
    .locator("label")
    .filter({ hasText: "À déplacer tout un groupe d'" })
    .click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("L'outil Plume").click();
  await page
    .locator("label")
    .filter({ hasText: "À fusionner ou soustraire des" })
    .click();
  await page
    .locator("label")
    .filter({ hasText: 'En utilisant la fonction "' })
    .click();
  await page.getByText("CMJN (Cyan, Magenta, Jaune,").click();
  await page
    .locator("label")
    .filter({ hasText: "Les lignes directrices (ou" })
    .click();
  await page.getByRole("button", { name: "Terminer arrow_forward" }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-Illustrator.png", fullPage: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-Illustrator2.png", fullPage: true });

  // Validation
});
