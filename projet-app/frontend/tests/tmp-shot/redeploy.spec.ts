import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const BASE = "http://localhost:4180";
const S = process.env.SCRATCH!;
test("menu après redéploiement", async ({ page }) => {
  test.setTimeout(240_000);
  const logs: string[] = [];
  page.on("response", (r) => { if (r.status() >= 400 && r.url().includes("/assets/")) logs.push(`${r.status()} ${r.url()}`); });
  await page.goto(BASE + "/admin/login");
  await page.locator("input[type=email]").fill("admin@wizy-learn.com");
  await page.locator("input[type=password]").fill("admin123");
  await page.locator("form button").last().click();
  await page.waitForURL(/\/admin\/dashboard$/);

  // Build B: the Settings page chunk changes, build A files are removed.
  const file = "src/views/admin/SettingsManagerView.vue";
  const original = readFileSync(file, "utf8");
  writeFileSync(file, original.replace("Enregistrer", "Enregistrer "));
  try {
    execSync(`VITE_API_BASE_URL=http://localhost:3003/api npx vite build --outDir ${S}/dist-e2e --emptyOutDir`, { stdio: "ignore" });
  } finally {
    writeFileSync(file, original);
  }

  await page.getByRole("link", { name: /Paramètres/ }).click();
  await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 20_000 });
  await expect(page.getByText("P3_OVERRIDE_ORDER").first()).toBeVisible({ timeout: 20_000 });
  console.log(logs.join("\n") || "aucun 404");
});
