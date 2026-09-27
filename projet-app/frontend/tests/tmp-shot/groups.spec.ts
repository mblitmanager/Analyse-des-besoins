import { test, expect } from "@playwright/test";
import { getAdminToken } from "../e2e-helpers";
test("groupes P1/P2", async ({ page }) => {
  const token = await getAdminToken();
  await page.goto("/");
  await page.evaluate((t) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_user", JSON.stringify({ email: "admin@wizy-learn.com", role: "admin" }));
  }, token);
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto("/admin/p3-override");
  await page.locator("select").filter({ has: page.locator("option", { hasText: "Toutes les formations" }) }).selectOption({ label: "Word" });
  await expect(page.getByText("Règles P3 Override — Word")).toBeVisible();
  const groups = page.locator("section").filter({ has: page.getByText("proposition(s) active(s)") });
  console.log("groupes:", await groups.count());
  for (const t of await groups.locator("> div").first().allInnerTexts()) console.log(" -", t.replace(/\s+/g, " ").slice(0, 160));
  await page.getByText("Règles P3 Override — Word").scrollIntoViewIfNeeded();
  await page.screenshot({ path: process.env.SHOT });
  await page.getByRole("button", { name: /Ajouter une proposition/ }).first().click();
  const p1 = await page.locator("select").filter({ has: page.locator("option") }).evaluateAll((els) => els.map((e: any) => e.value).filter(Boolean));
  console.log("valeurs du formulaire:", JSON.stringify(p1).slice(0, 300));
});
