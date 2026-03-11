import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("sdfsd");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("sdfsdf");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Prénom" }).fill("sdf");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("sdf");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("f");
  await page.locator(".formation-card__radio").first().click();
  await page.locator(".option-card__radio").first().click();
  await page
    .locator("div:nth-child(2) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page
    .locator("div:nth-child(4) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(4).click();
  await page
    .locator("div:nth-child(6) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page
    .locator("div:nth-child(7) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Français" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator(".option-card__radio").first().click();
  await page.locator("label").nth(5).click();
  await page.locator("label").filter({ hasText: "Un peu" }).nth(1).click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(1).click();
  await page.getByText("Régulièrement", { exact: true }).click();
  await page
    .locator("div:nth-child(7) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.getByText("Magazines").click();
  await page.locator("label").filter({ hasText: "BD" }).click();
  await page.getByText("Comptes-rendus").click();
  await page
    .locator(
      "div:nth-child(7) > .grid > .option-card.option-card--default > .option-card__radio",
    )
    .click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("Non").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
});
