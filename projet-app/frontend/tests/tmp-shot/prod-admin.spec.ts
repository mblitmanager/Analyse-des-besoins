import { test } from "@playwright/test";
test("prod admin", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) logs.push(`${r.status()} ${r.url()}`); });
  for (const path of ["/admin/login", "/admin", "/admin/settings", "/admin/test-validation"]) {
    await page.goto("https://ns-conseil-ab.mbl-service.com" + path, { waitUntil: "networkidle" });
    logs.push(`-> ${path} = ${page.url()}`);
  }
  await page.screenshot({ path: process.env.SHOT, fullPage: false });
  console.log(logs.join("\n"));
});
