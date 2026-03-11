import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("sdfds");
  await page.getByRole("textbox", { name: "Prénom" }).click();
  await page.getByRole("textbox", { name: "Prénom" }).fill("fsdf");

  await page.getByRole("textbox", { name: "Téléphone" }).fill("sd");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("sdfdsf");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("fghfgh");
  await page.locator(".formation-card__radio").first().click();
  await page.getByText("Occasionnellement").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).first().click();
  await page.getByText("Quotidiennement").nth(1).click();
  await page.getByText("Oui").nth(4).click();
  await page.locator("label").filter({ hasText: /^Oui$/ }).nth(3).click();
  await page.getByText("7A quelle fréquence utilisez-").click();
  await page.getByText("Occasionnellement").nth(2).click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Français" }).click();
  await page.getByRole("button", { name: "spellcheck Français" }).click();
});
