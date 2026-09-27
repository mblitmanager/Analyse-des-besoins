import { test } from "@playwright/test";
const BASE = "http://localhost:4180";
test("menu admin", async ({ page }) => {
  test.setTimeout(180_000);
  const logs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") logs.push(`console: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on("response", (r) => { if (r.status() >= 400) logs.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
  await fetch("http://localhost:3003/api/auth/setup");
  await page.goto(BASE + "/admin/login");
  await page.locator("input[type=email]").fill("admin@wizy-learn.com");
  await page.locator("input[type=password]").fill("admin123");
  await page.locator("form button[type=submit], form button").last().click();
  await page.waitForURL(/\/admin(\/dashboard)?$/, { timeout: 15000 }).catch(() => logs.push("login: pas de redirection, url=" + page.url()));
  logs.push("après login: " + page.url());
  const items = page.locator("aside a, nav a");
  const count = await items.count();
  logs.push(`liens menu: ${count}`);
  for (let i = 0; i < count; i++) {
    const link = items.nth(i);
    const label = (await link.innerText().catch(() => "?")).replace(/\s+/g, " ").trim();
    const before = page.url();
    await link.click({ timeout: 5000 }).catch((e) => logs.push(`clic impossible ${label}: ${String(e).slice(0, 120)}`));
    await page.waitForTimeout(1500);
    logs.push(`${label} -> ${page.url()}${page.url() === before ? "  (INCHANGÉ)" : ""}`);
  }
  await page.screenshot({ path: process.env.SHOT });
  console.log(logs.join("\n"));
});
