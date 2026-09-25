#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
});

async function extract() {
  try {
    console.log('🔍 Extraction des données...\n');

    // 1. Formations
    const formations = await pool.query(`
      SELECT id, slug, label, category, certificateur, "isActive"
      FROM formations
      WHERE "isActive" = true
      ORDER BY category, label
    `);

    // 2. Niveaux
    const levels = await pool.query(`
      SELECT id, label, "order", "successThreshold", "formationId", "isActive"
      FROM levels
      WHERE "isActive" = true
      ORDER BY "formationId", "order"
    `);

    // 3. Parcours Rules
    const parcoursRules = await pool.query(`
      SELECT id, formation, condition, formation1, formation2, "order", "isActive", "formationId"
      FROM parcours_rules
      WHERE "isActive" = true
      ORDER BY formation, "order"
    `);

    // 4. P3 Filter Rules
    const p3Filter = await pool.query(`
      SELECT id, name, "sourceCategory", "sourceSlugs", "maxLevelOrder", "filterMode", 
             "targetSlugs", "targetCategories", "isActive", "order"
      FROM p3_filter_rule
      WHERE "isActive" = true
      ORDER BY "order"
    `);

    // Structure
    const formationsParNiveau = {};
    for (const f of formations.rows) {
      formationsParNiveau[f.label] = {
        id: f.id,
        slug: f.slug,
        category: f.category,
        certificateur: f.certificateur,
        niveaux: []
      };
    }

    for (const l of levels.rows) {
      for (const [fname, fdata] of Object.entries(formationsParNiveau)) {
        if (fdata.id === l.formationId) {
          fdata.niveaux.push({
            id: l.id,
            label: l.label,
            order: l.order,
            successThreshold: l.successThreshold
          });
          break;
        }
      }
    }

    const parcoursParFormation = {};
    for (const rule of parcoursRules.rows) {
      if (!parcoursParFormation[rule.formation]) {
        parcoursParFormation[rule.formation] = [];
      }
      parcoursParFormation[rule.formation].push({
        id: rule.id,
        condition: rule.condition,
        formation1: rule.formation1,
        formation2: rule.formation2,
        order: rule.order
      });
    }

    const result = {
      metadata: {
        timestamp: new Date().toISOString(),
        database: 'wizzylearn'
      },
      summary: {
        formations: formations.rows.length,
        niveaux: levels.rows.length,
        parcoursRules: parcoursRules.rows.length,
        p3FilterRules: p3Filter.rows.length
      },
      data: {
        formations: formations.rows,
        levels: levels.rows,
        parcoursRules: parcoursRules.rows,
        p3FilterRules: p3Filter.rows
      },
      structured: {
        formationsParNiveau,
        parcoursParFormation
      }
    };

    // Affichage
    console.log('='.repeat(80));
    console.log('📊 FORMATIONS PAR NIVEAU (BASE DE DONNÉES)');
    console.log('='.repeat(80));
    let idx = 1;
    for (const [fname, fdata] of Object.entries(formationsParNiveau)) {
      console.log(`\n${idx}. ${fname} (${fdata.category})`);
      console.log(`   Certificateur: ${fdata.certificateur || 'N/A'}`);
      console.log(`   Niveaux:`);
      for (const n of fdata.niveaux) {
        console.log(`     • ${n.label} (ordre: ${n.order}, seuil: ${n.successThreshold}%)`);
      }
      idx++;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 PARCOURS PAR FORMATION');
    console.log('='.repeat(80));
    idx = 1;
    for (const [fname, rules] of Object.entries(parcoursParFormation)) {
      console.log(`\n${idx}. ${fname}:`);
      for (const r of rules) {
        console.log(`   [${r.condition || 'DÉFAUT'}]`);
        console.log(`     → ${r.formation1} → ${r.formation2 || '-'}`);
      }
      idx++;
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 RÈGLES P3 FILTER');
    console.log('='.repeat(80));
    for (let i = 0; i < p3Filter.rows.length; i++) {
      const r = p3Filter.rows[i];
      console.log(`\n${i + 1}. ${r.name}`);
      console.log(`   Mode: ${r.filterMode}`);
      console.log(`   Source: ${r.sourceCategory}`);
      console.log(`   Cible: ${r.targetSlugs || r.targetCategories || 'N/A'}`);
    }

    // Sauvegarder
    fs.writeFileSync('./extracted_db_data.json', JSON.stringify(result, null, 2), 'utf8');

    console.log('\n' + '='.repeat(80));
    console.log('✅ Extraction complétée !');
    console.log(`📁 Fichier: extracted_db_data.json`);
    console.log(`📊 ${result.summary.formations} formations | ${result.summary.niveaux} niveaux | ${result.summary.parcoursRules} règles parcours`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

extract();
