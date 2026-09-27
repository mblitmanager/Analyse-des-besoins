import { test } from "@playwright/test";
import { getAdminToken } from "../e2e-helpers";
test("erreurs", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message.slice(0, 300)}`));
  const token = await getAdminToken();
  await page.goto("/");
  await page.evaluate((t) => {
    localStorage.setItem("admin_token", t);
    localStorage.setItem("admin_user", JSON.stringify({ email: "admin@wizy-learn.com", role: "admin" }));
  }, token);
  await page.goto("/admin/p3-override");
  await page.waitForTimeout(4000);
  console.log(logs.join("\n") || "aucune erreur"); console.log("url:", page.url());
});
