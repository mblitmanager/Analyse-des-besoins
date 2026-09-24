#!/usr/bin/env node

const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'wizzylearn',
  password: 'root',
  port: 5432,
});

async function exportToXlsx() {
  try {
    console.log('🔍 Extraction et export en Excel...\n');

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

    // Créer le workbook
    const workbook = new ExcelJS.Workbook();

    // ===== Feuille 1: FORMATIONS =====
    const wsFormations = workbook.addWorksheet('Formations', { pageSetup: { paperSize: 9, orientation: 'landscape' } });
    
    wsFormations.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Label', key: 'label', width: 30 },
      { header: 'Slug', key: 'slug', width: 25 },
      { header: 'Catégorie', key: 'category', width: 25 },
      { header: 'Certificateur', key: 'certificateur', width: 20 },
    ];

    wsFormations.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsFormations.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } };

    for (const row of formations.rows) {
      wsFormations.addRow(row);
    }

    // ===== Feuille 2: NIVEAUX =====
    const wsLevels = workbook.addWorksheet('Niveaux');
    
    wsLevels.columns = [
      { header: 'ID Niveau', key: 'id', width: 8 },
      { header: 'Libellé', key: 'label', width: 25 },
      { header: 'Ordre', key: 'order', width: 8 },
      { header: 'Seuil (%)', key: 'successThreshold', width: 10 },
      { header: 'ID Formation', key: 'formationId', width: 12 },
      { header: 'Formation', key: 'formationName', width: 30 },
    ];

    wsLevels.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsLevels.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };

    // Créer map formations par ID
    const formationsMap = {};
    for (const f of formations.rows) {
      formationsMap[f.id] = f.label;
    }

    for (const row of levels.rows) {
      wsLevels.addRow({
        id: row.id,
        label: row.label,
        order: row.order,
        successThreshold: row.successThreshold,
        formationId: row.formationId,
        formationName: formationsMap[row.formationId] || '-'
      });
    }

    // ===== Feuille 3: PARCOURS RULES =====
    const wsParcours = workbook.addWorksheet('Parcours Rules');
    
    wsParcours.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Formation', key: 'formation', width: 25 },
      { header: 'Condition', key: 'condition', width: 35 },
      { header: 'Formation 1', key: 'formation1', width: 35 },
      { header: 'Formation 2', key: 'formation2', width: 35 },
      { header: 'Ordre', key: 'order', width: 8 },
    ];

    wsParcours.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsParcours.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    for (const row of parcoursRules.rows) {
      wsParcours.addRow({
        id: row.id,
        formation: row.formation,
        condition: row.condition,
        formation1: row.formation1,
        formation2: row.formation2,
        order: row.order
      });
    }

    // ===== Feuille 4: P3 FILTER RULES =====
    const wsP3 = workbook.addWorksheet('P3 Filter Rules');
    
    wsP3.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nom', key: 'name', width: 30 },
      { header: 'Mode Filter', key: 'filterMode', width: 15 },
      { header: 'Source Catégorie', key: 'sourceCategory', width: 20 },
      { header: 'Source Slugs', key: 'sourceSlugs', width: 30 },
      { header: 'Cible Slugs', key: 'targetSlugs', width: 30 },
      { header: 'Cible Catégories', key: 'targetCategories', width: 30 },
      { header: 'Ordre', key: 'order', width: 8 },
    ];

    wsP3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsP3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC5504D' } };

    for (const row of p3Filter.rows) {
      wsP3.addRow({
        id: row.id,
        name: row.name,
        filterMode: row.filterMode,
        sourceCategory: row.sourceCategory || '-',
        sourceSlugs: row.sourceSlugs || '-',
        targetSlugs: row.targetSlugs || '-',
        targetCategories: row.targetCategories || '-',
        order: row.order
      });
    }

    // ===== Feuille 5: RÉSUMÉ =====
    const wsSummary = workbook.addWorksheet('Résumé', { pageSetup: { paperSize: 9, orientation: 'portrait' } });
    
    wsSummary.columns = [
      { header: 'Élément', key: 'element', width: 30 },
      { header: 'Valeur', key: 'value', width: 15 },
    ];

    wsSummary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsSummary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };

    const summaryData = [
      { element: 'Date d\'extraction', value: new Date().toLocaleDateString('fr-FR') },
      { element: 'Heure d\'extraction', value: new Date().toLocaleTimeString('fr-FR') },
      { element: 'Base de données', value: 'wizzylearn (PostgreSQL)' },
      { element: '', value: '' },
      { element: 'Total Formations', value: formations.rows.length },
      { element: 'Total Niveaux', value: levels.rows.length },
      { element: 'Total Parcours Rules', value: parcoursRules.rows.length },
      { element: 'Total P3 Filter Rules', value: p3Filter.rows.length },
    ];

    for (const row of summaryData) {
      const newRow = wsSummary.addRow(row);
      if (row.element) {
        newRow.getCell('element').font = { bold: true };
      }
    }

    // ===== Feuille 6: FORMATIONS PAR NIVEAUX =====
    const wsFormParNiv = workbook.addWorksheet('Formations x Niveaux');
    
    // Construire la structure
    const formationsMap2 = {};
    for (const f of formations.rows) {
      formationsMap2[f.id] = {
        label: f.label,
        category: f.category,
        certificateur: f.certificateur,
        levels: []
      };
    }
    
    for (const l of levels.rows) {
      if (formationsMap2[l.formationId]) {
        formationsMap2[l.formationId].levels.push({
          label: l.label,
          order: l.order,
          threshold: l.successThreshold
        });
      }
    }

    wsFormParNiv.columns = [
      { header: 'Formation', key: 'formation', width: 30 },
      { header: 'Catégorie', key: 'category', width: 25 },
      { header: 'Certificateur', key: 'certificateur', width: 20 },
      { header: 'Niveaux', key: 'levels', width: 60 },
    ];

    wsFormParNiv.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsFormParNiv.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA6732D' } };

    for (const [formId, formData] of Object.entries(formationsMap2)) {
      const levelsList = formData.levels
        .sort((a, b) => a.order - b.order)
        .map(l => `${l.label} (${l.threshold}%)`)
        .join(', ');
      
      wsFormParNiv.addRow({
        formation: formData.label,
        category: formData.category || '-',
        certificateur: formData.certificateur || '-',
        levels: levelsList
      });
    }

    // Sauvegarder le fichier
    const outputPath = './parcours_formations_db.xlsx';
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Export Excel complété !');
    console.log(`📁 Fichier: ${outputPath}`);
    console.log(`📊 Contenu:`);
    console.log(`   • Feuille 1: Formations (${formations.rows.length} lignes)`);
    console.log(`   • Feuille 2: Niveaux (${levels.rows.length} lignes)`);
    console.log(`   • Feuille 3: Parcours Rules (${parcoursRules.rows.length} lignes)`);
    console.log(`   • Feuille 4: P3 Filter Rules (${p3Filter.rows.length} lignes)`);
    console.log(`   • Feuille 5: Résumé`);
    console.log(`   • Feuille 6: Formations x Niveaux`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

exportToXlsx();
