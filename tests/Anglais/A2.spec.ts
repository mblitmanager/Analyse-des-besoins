import { test, expect } from "@playwright/test";
//Anglais B1 validé
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Anglais");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("B1");
  await page.getByRole("textbox", { name: "Prénom" }).press("Tab");
  await page.getByRole("textbox", { name: "Téléphone" }).fill("06 06 06 06 06");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("aa");
  await page.locator(".formation-card__radio").first().click();
  await page.getByText("Occasionnellement").first().click();
  await page.locator("label").filter({ hasText: "Oui" }).first().click();
  await page.locator("label").filter({ hasText: "Oui" }).nth(2).click();
  await page
    .locator("label")
    .filter({ hasText: "Quotidiennement" })
    .nth(1)
    .click();
  await page
    .locator("div:nth-child(5) > .grid > label > .option-card__radio")
    .first()
    .click();
  await page.locator("label").filter({ hasText: /^Oui$/ }).nth(3).click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "Lycée" }).click();
  await page.locator("label").nth(5).click();
  await page.locator("label").filter({ hasText: "Non" }).nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator('label:has-text("is")').first().click();//non séléctionné
  await page
    .locator(
      "div:nth-child(2) > .p-6 > .grid > label:nth-child(2) > .option-card__radio",
    )
    .click();
  await page.locator("label").filter({ hasText: "is" }).nth(3).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.locator("label").filter({ hasText: "is watching" }).click();
  await page.locator("label").filter({ hasText: "goes" }).click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("were", { exact: true }).click();
  await page.getByText("were watching").click();
  await page.locator("label").filter({ hasText: "was watching" }).click();
  await page.getByText("much").click();
  await page.locator("label").filter({ hasText: "tallest" }).click();
  await page.getByText("as beautiful as").click();
  await page.getByText("went").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByText("during").click();
  await page.locator("label").filter({ hasText: /^have$/ }).click();
  await page.getByText("is built").click();
  await page.locator("label").filter({ hasText: "has worked" }).click();
  await page.locator("label").filter({ hasText: "has eaten" }).click();
  await page.getByText("drank").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  // await page.locator("label").filter({ hasText: "should told" }).click();
  // await page.getByText("wouldn’t be").click();
  // await page.locator("label").filter({ hasText: "will have finished" }).click();
  // await page.getByText("will be lying").click();
  // await page.locator("label").filter({ hasText: "off" }).click();
  // await page.getByText("Although").click();
  // await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  // await page.getByRole("button", { name: "Continuer" }).click();
  // await page.getByRole("button", { name: "Valider ce parcours et" }).click();
  // await page
  //   .getByRole("combobox")
  //   .selectOption(
  //     "Je vise un emploi pour lequel de nouvelles compétences me seront utiles",
  //   );
  // await page.getByText("Non").first().click();
  // await page.locator("label").nth(2).click();
  // await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  // await page.getByText("wb_twilightAprès-midi").click();
  // await page.getByRole("textbox").click();
  // await page.getByRole("textbox").fill("fgdfg");
  // await page
  //   .getByRole("button", { name: "Valider mes disponibilités" })
  //   .click();

  // --- Capture d’écran avant de fermer ---
  await page.screenshot({ path: 'test-A2.png', fullPage: true });
});
