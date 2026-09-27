import { test, expect } from "@playwright/test";
import { getAdminToken } from "../e2e-helpers";
const API = "http://localhost:3003/api";
test("dupliquer une règle P3 vers une autre formation", async ({ page }) => {
  const token = await getAdminToken();
  const headers = { Authorization: `Bearer ${token}` };
  const before: any[] = await (await fetch(`${API}/p3-override`, { headers })).json();
  await page.goto("/");
  await page.evaluate((t) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_user", JSON.stringify({ email: "admin@wizy-learn.com", role: "admin" }));
  }, token);
  await page.goto("/admin/p3-override");
  await page.locator("select").filter({ has: page.locator("option", { hasText: "Toutes les formations" }) }).selectOption({ label: "SketchUp" });
  await expect(page.getByText("Règles P3 Override — SketchUp")).toBeVisible();
  await page.getByTitle("Dupliquer").first().click();
  const dialog = page.locator("div.fixed", { has: page.getByRole("heading", { name: "Dupliquer la règle" }) });
  await dialog.locator("select").selectOption({ label: "Illustrator" });
  await expect(dialog.getByText("vérifiez-les pour la formation cible")).toBeVisible();
  await expect(dialog.locator("input[type=checkbox]")).toBeChecked();
  await page.screenshot({ path: process.env.SHOT + "-1.png" });
  await dialog.getByRole("button", { name: "Dupliquer" }).click();
  await expect(page.getByText("Règles P3 Override — Illustrator")).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: process.env.SHOT + "-2.png" });

  const after: any[] = await (await fetch(`${API}/p3-override`, { headers })).json();
  const created = after.filter((r) => !before.some((b) => b.id === r.id));
  expect(created).toHaveLength(1);
  console.log(JSON.stringify({ formation: created[0].formation, formationId: created[0].formationId, entity: created[0].formationEntity?.label, titre: created[0].parcoursTitle, p1: created[0].conditionP1 }));
  expect(created[0].formationId).toBe(19);
  expect(created[0].formationEntity?.label).toBe("Illustrator");
  await fetch(`${API}/p3-override/${created[0].id}`, { method: "DELETE", headers });
});
