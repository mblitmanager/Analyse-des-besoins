import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("dsf");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("sdfsd");
  await page
    .getByText(
      "CivilitéMonsieurMadameNomPrénomTéléphonecallConseiller commercial (facultatif)",
    )
    .click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("s");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("sdf");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("s");
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("sdf");
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .first()
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Oui avec quelques difficultés" })
    .first()
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Oui avec quelques difficultés" })
    .nth(1)
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(1)
    .click();
  await page
    .locator("span")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(3).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Français" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Oui").click();
  await page.getByText("Un peu").first().click();
  await page.locator("label").filter({ hasText: "Pas du tout" }).nth(1).click();
  await page.getByText("Non").nth(1).click();
  await page.getByText("Non").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").first().click();
  await page.getByText("Un déterminant").first().click();
  await page.getByText("Un déterminant").nth(1).click();
  await page
    .locator("label")
    .filter({ hasText: "les documents" })
    .first()
    .click();
  await page
    .locator("label")
    .filter({ hasText: "à ses collègues" })
    .nth(1)
    .click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.goto("http://localhost:5173/positionnement");
});
