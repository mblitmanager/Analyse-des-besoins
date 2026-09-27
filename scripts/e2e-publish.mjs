#!/usr/bin/env node
// Turns a Playwright JSON report into a campaign readable by the admin page
// (/admin/test-validation): <outDir>/run.json + one folder of screenshots per case.
//
// Usage: node scripts/e2e-publish.mjs <playwright-report.json> <outDir> [spec]
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const [reportPath, outDir, spec = ""] = process.argv.slice(2);
if (!reportPath || !outDir) {
  console.error("Usage: node scripts/e2e-publish.mjs <playwright-report.json> <outDir> [spec]");
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
mkdirSync(outDir, { recursive: true });

const stripAnsi = (text) => String(text || "").replace(/\u001b\[[0-9;]*m/g, "");

function* walk(suite, parents = []) {
  for (const specItem of suite.specs || []) yield { spec: specItem, parents };
  for (const child of suite.suites || []) yield* walk(child, [...parents, child.title]);
}

const cases = [];
for (const root of report.suites || []) {
  for (const { spec: specItem } of walk(root)) {
    for (const test of specItem.tests || []) {
      const result = test.results?.[test.results.length - 1] || {};
      const id = createHash("sha1").update(specItem.title).digest("hex").slice(0, 12);
      const caseDir = join(outDir, id);

      let details = null;
      const screenshots = [];
      for (const attachment of result.attachments || []) {
        if (attachment.name === "rapport.json" && attachment.body) {
          details = JSON.parse(Buffer.from(attachment.body, "base64").toString("utf8"));
        } else if (attachment.contentType === "image/png" && attachment.path && existsSync(attachment.path)) {
          mkdirSync(caseDir, { recursive: true });
          const file = `${attachment.name.replace(/[^\w.-]/g, "_")}.png`;
          copyFileSync(attachment.path, join(caseDir, file));
          screenshots.push({ name: attachment.name, file });
        }
      }

      const [formation = "", ...rest] = specItem.title.split(" | ");
      cases.push({
        id,
        title: specItem.title,
        formation: rest.length ? formation : "",
        status: test.status === "expected" ? "passed" : test.status === "flaky" ? "flaky" : test.status === "skipped" ? "skipped" : "failed",
        duration: result.duration || 0,
        errors: (result.errors || []).map((e) => stripAnsi(e.message).split("\n").slice(0, 12).join("\n")),
        // Recent Playwright versions report annotations on the result, older ones on the test.
        annotations: result.annotations?.length ? result.annotations : test.annotations || [],
        details,
        screenshots: screenshots.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }
}

// Totals cover the journeys only (the matrix also has a control test without formation).
const journeys = cases.some((c) => c.formation) ? cases.filter((c) => c.formation) : cases;
const count = (status) => journeys.filter((c) => c.status === status).length;
const run = {
  id: basename(outDir),
  spec,
  startedAt: report.stats?.startTime || new Date().toISOString(),
  duration: report.stats?.duration || 0,
  totals: {
    total: journeys.length,
    passed: count("passed"),
    failed: count("failed"),
    flaky: count("flaky"),
    skipped: count("skipped"),
  },
  cases,
};
writeFileSync(join(outDir, "run.json"), JSON.stringify(run, null, 2));
console.log(`Campagne publiée : ${outDir} (${run.totals.passed}/${run.totals.total} réussis)`);
