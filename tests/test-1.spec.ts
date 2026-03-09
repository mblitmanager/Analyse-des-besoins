import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("a");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("a");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("aa");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aa");
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .first()
    .click();
  await page.getByText("Jamais").first().click();
  await page.getByText("Non").first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
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
});
