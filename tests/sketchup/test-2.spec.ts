import { test, expect } from "@playwright/test";
//sketchup
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("aa");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Prénom" }).fill("a");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("a");
  await page.getByRole("textbox", { name: "Conseiller commercial (" }).click();
  await page
    .getByRole("textbox", { name: "Conseiller commercial (" })
    .fill("a");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("zer");
  await page
    .locator("div")
    .filter({ hasText: /^person_outlineSalarié$/ })
    .first()
    .click();
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Oui avec quelques difficultés").first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page
    .locator("span")
    .filter({ hasText: /^Oui avec quelques difficultés$/ })
    .click();
  await page.getByText("Non").nth(3).click();
  await page
    .locator("label")
    .filter({ hasText: "Occasionnellement" })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "square Sketchup" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page
    .getByRole("combobox")
    .selectOption(
      "Je me prépare à entrer dans une formation qualifiante ou à un concours d'entrée",
    );
  await page.getByText("Non").first().click();
  await page.locator("label").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("wb_twilightAprès-midi").click();
  await page.getByRole("textbox").click();
  await page.getByRole("textbox").fill("fg");
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
  await page.goto("http://localhost:5173validation");
  await page.getByRole("button", { name: "Accueil home" }).click();
  await page.goto("http://localhost:5173");
  await page.goto("http://localhost:5173");
});
