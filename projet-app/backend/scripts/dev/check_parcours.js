const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('Tables:', tables.rows.map(r => r.tablename).join(', '));

    const parcoursTable = tables.rows.map(r => r.tablename).find(t => t.toLowerCase().includes('parcours'));
    if (!parcoursTable) { console.log('No parcours table found'); return; }
    console.log('Using table:', parcoursTable);

    const res = await pool.query(
      'SELECT id, formation, "formationId", formation1, formation2, "parcoursTitle", "isActive" FROM "' + parcoursTable + '" WHERE "isActive" = true LIMIT 20'
    );
    console.log('\n=== PARCOURS ACTIFS ===');
    res.rows.forEach(row => {
      console.log('---');
      console.log('  formation:', row.formation, '| formationId:', row.formationId);
      console.log('  formation1:', row.formation1);
      console.log('  formation2:', row.formation2);
      console.log('  parcoursTitle:', row.parcoursTitle);
    });

    const levelsTable = tables.rows.map(r => r.tablename).find(t => t.toLowerCase().includes('formation_level') || t.toLowerCase().includes('formationlevel'));
    const formationsTable = tables.rows.map(r => r.tablename).find(t => t.toLowerCase() === 'formations' || t.toLowerCase() === 'formation');
    if (levelsTable && formationsTable) {
      const levels = await pool.query(
        'SELECT fl.label, fl."order", f.label as flabel FROM "' + levelsTable + '" fl JOIN "' + formationsTable + '" f ON fl."formationId" = f.id WHERE f.label ILIKE \'%word%\' ORDER BY fl."order"'
      );
      console.log('\n=== NIVEAUX Word ===');
      levels.rows.forEach(row => console.log('  order=' + row.order + ' => "' + row.label + '"'));
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

main();
