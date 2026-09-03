const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const expectedRules = [
  ['DIGCOMP Basique', 'WORD Basique'],
  ['DIGCOMP Basique', 'EXCEL Basique'],
  ['DIGCOMP Basique', 'PPT Basique'],
  ['DIGCOMP Basique', 'OUTLOOK Basique'],
  ['DIGCOMP Opérationnel', 'OUTILS COLLABORATIFS'],
  ['WORD Basique', 'WORD Opérationnel'],
  ['EXCEL Basique', 'EXCEL Opérationnel'],
  ['EXCEL Opérationnel', 'EXCEL Expert'],
  ['PPT Basique', 'PPT Opérationnel'],
  ['WORD Basique', 'EXCEL Basique'],
  ['WORD Opérationnel', 'EXCEL Opérationnel'],
  ['OUTILS COLLABORATIFS', 'GOOGLE SHEETS'],
  ['OUTILS COLLABORATIFS', 'GOOGLE DOCS'],
  ['OUTILS COLLABORATIFS', 'GOOGLE SLIDES'],
  ['GOOGLE SHEETS', 'GOOGLE DOCS/SLIDES'],
  ['GOOGLE DOCS', 'GOOGLE SHEETS/SLIDES'],
  ['GOOGLE SLIDES', 'GOOGLE DOCS/SHEETS'],
  ['A2', 'B1'],
  ['B1', 'B2'],
  ['B2', 'C1'],
  ['VOLTAIRE Technique', 'VOLTAIRE Professionnel'],
  ['VOLTAIRE Professionnel', 'VOLTAIRE Affaires'],
  ['PHOTOSHOP basique', 'PHOTOSHOP Opérationnel'],
  ['SKETCHUP', 'ICDL GIMP'],
  ['GIMP', 'ILLUSTRATOR Opérationnel'],
  ['ILLUSTRATOR Basique', 'ILLUSTRATOR Opérationnel'],
  ['WORDPRESS Basique', 'WORDPRESS Opérationnel'],
  ['EXCEL opérationnel', 'IA GENERATIVE'],
  ['WORD', 'IA GENERATIVE'],
];

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const pairKey = (a, b) => `${normalize(a)} => ${normalize(b)}`;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const report = { missing: [], duplicates: [], inactive: [], unexpected: [], notes: [] };

  try {
    await client.connect();

    const tableCheck = await client.query(`
      SELECT to_regclass('public.formations') AS formations,
             to_regclass('public.parcours_rules') AS parcours_rules,
             to_regclass('public.p3_override_rules') AS p3_override_rules,
             to_regclass('public.p3_filter_rule') AS p3_filter_rule
    `);
    console.log('Tables:', tableCheck.rows[0]);

    if (!tableCheck.rows[0].parcours_rules) {
      throw new Error('La table public.parcours_rules est absente.');
    }

    const rules = await client.query(`
      SELECT id, formation, "formationId", condition, formation1, formation2,
             "isActive", "order", "parcoursTitle"
      FROM public.parcours_rules
      ORDER BY formation, "order", id
    `);

    const active = rules.rows.filter((r) => r.isActive !== false);
    const activeByPair = new Map();
    for (const row of active) {
      const key = pairKey(row.formation1, row.formation2);
      activeByPair.set(key, (activeByPair.get(key) || 0) + 1);
      if (activeByPair.get(key) > 1) report.duplicates.push({ key, row });
    }

    for (const [formation1, formation2] of expectedRules) {
      const exact = active.filter((r) =>
        normalize(r.formation1) === normalize(formation1) &&
        normalize(r.formation2) === normalize(formation2),
      );
      const inactive = rules.rows.filter((r) =>
        normalize(r.formation1) === normalize(formation1) &&
        normalize(r.formation2) === normalize(formation2) &&
        r.isActive === false,
      );

      if (exact.length === 0) {
        if (inactive.length > 0) report.inactive.push({ formation1, formation2, rows: inactive });
        else report.missing.push({ formation1, formation2 });
      }
    }

    const formations = await client.query(`
      SELECT id, slug, label, category, "isActive"
      FROM public.formations
      ORDER BY label
    `);
    const formationText = formations.rows
      .map((r) => `${normalize(r.slug)} ${normalize(r.label)}`)
      .join(' ');

    for (const [formation1, formation2] of expectedRules) {
      for (const value of [formation1, formation2]) {
        const token = normalize(value).replace(/\/(.*)/, '').trim();
        if (token && !formationText.includes(token)) {
          report.unexpected.push({ type: 'formation-not-found-by-label-or-slug', value });
        }
      }
    }

    report.notes.push(
      'Les codes certificateurs, heures et propositions de module 3 du tableau ne sont pas des colonnes de parcours_rules. Ils doivent être vérifiés dans les champs programme/modaliteDuree/certificateur ou dans une table catalogue dédiée.',
    );
    report.notes.push(
      'Le tableau contient 29 lignes de parcours exploitables ; les lignes Google avec « ou » sont contrôlées comme libellés composites et nécessitent une validation métier manuelle.',
    );

    console.log(JSON.stringify({
      expectedCount: expectedRules.length,
      dbRuleCount: rules.rows.length,
      activeRuleCount: active.length,
      ...report,
    }, null, 2));

    process.exitCode = report.missing.length || report.inactive.length || report.duplicates.length ? 1 : 0;
  } catch (error) {
    console.error('Vérification impossible:', error.message);
    process.exitCode = 2;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main();
