import { test, expect } from "@playwright/test";
import { getAdminToken } from "../e2e-helpers";
test("réglages", async ({ page }) => {
  const token = await getAdminToken();
  await page.goto("/");
  await page.evaluate((t) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_user", JSON.stringify({ email: "admin@wizy-learn.com", role: "admin" }));
  }, token);
  await page.goto("/admin/settings");
  await expect(page.getByText("P3_OVERRIDE_ORDER").first()).toBeVisible();
  await page.getByText("P3_OVERRIDE_ORDER").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: process.env.SHOT });
});
