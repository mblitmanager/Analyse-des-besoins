#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
});

async function extractParcoursData() {
  try {
    console.log('🔍 Extraction des données de parcours depuis la base de données...\n');

    // 1. Récupérer toutes les formations avec leurs niveaux
    const formationsResult = await pool.query(`
      SELECT 
        f.id,
        f.slug,
        f.label,
        f.category,
        f.certificateur,
        json_agg(
          json_build_object(
            'id', l.id,
            'label', l.label,
            'shortName', l.short_name,
            'order', l.order,
            'successThreshold', l.success_threshold
          ) ORDER BY l.order
        ) as levels
      FROM formations f
      LEFT JOIN levels l ON l.formation_id = f.id AND l.is_active = true
      WHERE f.is_active = true
      GROUP BY f.id, f.slug, f.label, f.category, f.certificateur
      ORDER BY f.category, f.label
    `);

    // 2. Récupérer les parcours rules
    const parcoursRulesResult = await pool.query(`
      SELECT 
        pr.id,
        pr.formation,
        f.label as formation_label,
        pr.condition,
        pr.formation1,
        pr.formation2,
        pr."order",
        pr.is_active,
        pr.is_hidden_result,
        pr.hidden_result_type,
        pr.parcours_title,
        pr.certification
      FROM parcours_rules pr
      LEFT JOIN formations f ON pr.formation_id = f.id
      WHERE pr.is_active = true
      ORDER BY pr.formation, pr."order"
    `);

    // 3. Récupérer les règles P3
    const p3RulesResult = await pool.query(`
      SELECT 
        pr.id,
        pr.formation_id,
        f.label as formation_label,
        f.slug as formation_slug,
        pr.level_id,
        l.label as level_label,
        pr.p3_formations,
        pr.priority,
        pr.is_active
      FROM p3_filter_rules pr
      LEFT JOIN formations f ON pr.formation_id = f.id
      LEFT JOIN levels l ON pr.level_id = l.id
      WHERE pr.is_active = true
      ORDER BY f.label, l."order", pr.priority
    `);

    // 3b. Récupérer les règles P3 Override
    const p3OverrideResult = await pool.query(`
      SELECT 
        por.id,
        por.formation_id,
        f.label as formation_label,
        f.slug as formation_slug,
        por.level_id,
        l.label as level_label,
        por.override_p3_formations,
        por.is_active
      FROM p3_override_rules por
      LEFT JOIN formations f ON por.formation_id = f.id
      LEFT JOIN levels l ON por.level_id = l.id
      WHERE por.is_active = true
      ORDER BY f.label, l."order"
    `);

    // Structurer les données
    const result = {
      timestamp: new Date().toISOString(),
      database: 'wizzylearn',
      formations: formationsResult.rows,
      parcoursRules: parcoursRulesResult.rows,
      p3FilterRules: p3RulesResult.rows,
      p3OverrideRules: p3OverrideResult.rows,
      summary: {
        totalFormations: formationsResult.rows.length,
        totalParcoursRules: parcoursRulesResult.rows.length,
        totalP3FilterRules: p3RulesResult.rows.length,
        totalP3OverrideRules: p3OverrideResult.rows.length,
      },
    };

    // Créer les vues structurées
    const formationsParNiveau = {};
    const p3PossiblesParFormationNiveau = {};

    // Organiser par formation et niveau
    for (const formation of formationsResult.rows) {
      if (!formationsParNiveau[formation.label]) {
        formationsParNiveau[formation.label] = {
          id: formation.id,
          slug: formation.slug,
          category: formation.category,
          certificateur: formation.certificateur,
          niveaux: {}
        };
      }

      if (formation.levels && Array.isArray(formation.levels)) {
        for (const level of formation.levels) {
          formationsParNiveau[formation.label].niveaux[level.label] = {
            id: level.id,
            shortName: level.shortName,
            order: level.order,
            successThreshold: level.successThreshold
          };
        }
      }
    }

    // Organiser les P3 par formation:niveau
    for (const p3 of p3RulesResult.rows) {
      if (p3.formation_label && p3.level_label) {
        const key = `${p3.formation_label}:${p3.level_label}`;
        if (!p3PossiblesParFormationNiveau[key]) {
          p3PossiblesParFormationNiveau[key] = [];
        }
        if (p3.p3_formations) {
          const formations = typeof p3.p3_formations === 'string' 
            ? JSON.parse(p3.p3_formations) 
            : p3.p3_formations;
          p3PossiblesParFormationNiveau[key].push(...(Array.isArray(formations) ? formations : [formations]));
        }
      }
    }

    // Dédupliquer et trier
    for (const key in p3PossiblesParFormationNiveau) {
      p3PossiblesParFormationNiveau[key] = [...new Set(p3PossiblesParFormationNiveau[key])].sort();
    }

    result.structuredViews = {
      formationsParNiveau,
      p3PossiblesParFormationNiveau
    };

    // Afficher en console
    console.log('='.repeat(80));
    console.log('📊 FORMATIONS PAR NIVEAU');
    console.log('='.repeat(80));
    for (const [formation, data] of Object.entries(formationsParNiveau)) {
      console.log(`\n${formation} (${data.category || 'N/A'})`);
      console.log(`  Certificateur: ${data.certificateur || 'N/A'}`);
      console.log(`  Niveaux:`);
      for (const [niveau, info] of Object.entries(data.niveaux)) {
        console.log(`    - ${niveau} (shortName: ${info.shortName}, ordre: ${info.order})`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 PARCOURS RULES');
    console.log('='.repeat(80));
    const groupedByFormation = {};
    for (const rule of parcoursRulesResult.rows) {
      if (!groupedByFormation[rule.formation]) {
        groupedByFormation[rule.formation] = [];
      }
      groupedByFormation[rule.formation].push(rule);
    }

    for (const [formation, rules] of Object.entries(groupedByFormation)) {
      console.log(`\n${formation}:`);
      for (const rule of rules) {
        console.log(`  Condition: ${rule.condition}`);
        console.log(`    → Formation 1: ${rule.formation1}`);
        console.log(`    → Formation 2: ${rule.formation2}`);
        if (rule.parcours_title) {
          console.log(`    → Titre parcours: ${rule.parcours_title}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 P3 POSSIBLES PAR FORMATION:NIVEAU');
    console.log('='.repeat(80));
    for (const [key, formations] of Object.entries(p3PossiblesParFormationNiveau)) {
      console.log(`${key}: ${formations.join(', ')}`);
    }

    // Sauvegarder en JSON
    const fs = require('fs');
    fs.writeFileSync(
      './extracted_db_parcours.json',
      JSON.stringify(result, null, 2),
      'utf8'
    );

    console.log('\n' + '='.repeat(80));
    console.log('✅ Extraction complétée !');
    console.log(`📁 Fichier sauvegardé: ./extracted_db_parcours.json`);
    console.log(`📊 Total: ${result.summary.totalFormations} formations, ${result.summary.totalParcoursRules} règles parcours, ${result.summary.totalP3FilterRules} règles P3`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

extractParcoursData();
