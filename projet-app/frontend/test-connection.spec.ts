import { test, expect } from "@playwright/test";

test("Connexion au site", async ({ page }) => {
  console.log("📍 Navigation vers formations...");
  await page.goto("/formations", { timeout: 10000 });
  console.log("✅ Page chargée");
  
  const title = await page.title();
  console.log(`📄 Titre: ${title}`);
  
  expect(title).toBeTruthy();
  
  // Chercher un élément formation
  const formations = await page.locator("*:has-text('Anglais')").count();
  console.log(`🎓 Éléments 'Anglais' trouvés: ${formations}`);
});
