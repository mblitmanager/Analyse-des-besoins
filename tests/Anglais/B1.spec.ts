import { test, expect } from "@playwright/test";
//Anglais B1 validé
test("test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.getByRole("textbox", { name: "Nom", exact: true }).click();
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("A1");
  await page.getByRole("textbox", { name: "Nom", exact: true }).press("Tab");
  await page.getByRole("textbox", { name: "Prénom" }).fill("TOEIC");
  await page.getByRole("textbox", { name: "Téléphone" }).click();
  await page.getByRole("textbox", { name: "Téléphone" }).fill("a");
  await page.getByRole("button", { name: "Démarrer le parcours" }).click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .click();
  await page
    .getByRole("textbox", { name: "Ex: Assistant administratif," })
    .fill("a");
  await page
    .locator("label")
    .filter({ hasText: "person_outlineSalarié" })
    .click();
  await page.getByText("person_outlineIndépendant").click();
  await page.getByText("person_outline").nth(1).click();
  await page.getByText("person_outline").nth(1).click();
  await page.getByText("Occasionnellement").first().click();
  await page.getByText("Non").first().click();
  await page.getByText("Oui avec quelques difficultés").nth(1).click();
  await page.getByText("Occasionnellement").nth(1).click();
  await page
    .getByText(
      "5Savez-vous créer un dossier et y ranger et renommer un fichier?OuiOui avec",
    )
    .click();
  await page.getByText("Occasionnellement").nth(2).click();
  await page.getByText("Non").nth(3).click();
  await page.getByRole("button", { name: "Valider mon profil" }).click();
  await page.getByRole("button", { name: "Ignorer et continuer" }).click();
  await page.getByRole("button", { name: "spellcheck Anglais" }).click();
  await page.getByText("ContinuerContinuerarrow_forward").click();
  await page.locator("label").filter({ hasText: "Collège" }).click();
  await page.locator("label").nth(4).click();
  await page.locator("label").filter({ hasText: "Clientèle" }).click();
  await page.locator("label").filter({ hasText: "Régulier" }).click();
  await page.getByText("Non").nth(1).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.locator("label").nth(1).click();
  await page.getByText("have").first().click();
  await page.locator("label").filter({ hasText: "is" }).nth(3).click();
  await page.getByText("is", { exact: true }).nth(2).click();
  await page.getByText("is watching").click();
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
  await page.getByText("since").click();
  await page.locator("label").filter({ hasText: /^had$/ }).click();
  await page.getByText("was built").click();
  await page.locator("label").filter({ hasText: "has worked" }).click();
  await page.locator("label").filter({ hasText: "had eaten" }).click();
  await page.getByText("drank").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.locator("label").filter({ hasText: "should told" }).click();
  await page.getByText("wouldn’t be").click();
  await page.locator("label").filter({ hasText: "will have finished" }).click();
  await page.getByText("will be lying").click();
  await page.locator("label").filter({ hasText: "off" }).click();
  await page.getByText("Although").click();
  await page.getByRole("button", { name: "Suivant arrow_forward" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Valider ce parcours et" }).click();
  await page
    .getByRole("combobox")
    .selectOption(
      "Je vise un emploi pour lequel de nouvelles compétences me seront utiles",
    );
  await page.getByText("Non").first().click();
  await page.locator("label").nth(2).click();
  await page.getByRole("button", { name: "Continuer arrow_forward" }).click();
  await page.getByText("wb_twilightAprès-midi").click();
  await page.getByRole("textbox").click();
  await page.getByRole("textbox").fill("fgdfg");
  await page
    .getByRole("button", { name: "Valider mes disponibilités" })
    .click();
});
