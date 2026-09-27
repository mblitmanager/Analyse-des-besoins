import { test, expect } from "@playwright/test";
import { getAdminToken } from "../e2e-helpers";

test("page admin recette", async ({ page }) => {
  const token = await getAdminToken();
  await page.goto("/");
  await page.evaluate((t) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_user", JSON.stringify({ email: "admin@wizy-learn.com", role: "admin" }));
  }, token);
  await page.goto("/admin/test-validation");
  await expect(page.getByRole("heading", { name: "Recette automatisée" })).toBeVisible();
  await expect(page.getByText("6 / 6 réussis")).toBeVisible();
  await page.screenshot({ path: process.env.SHOT_DIR + "/admin-1.png", fullPage: true });
  await page.getByText(/échec Niveau A2 - TOEIC/).first().click();
  await expect(page.getByText("Captures (5)")).toBeVisible();
  await expect(page.locator("img[alt='p1-02-resultats']")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: process.env.SHOT_DIR + "/admin-2.png" });
});
