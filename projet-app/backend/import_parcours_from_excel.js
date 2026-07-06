const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const filePath = path.join(__dirname, '../../nouveau p1,p2 et p3.xlsx');

async function importParcoursFromExcel() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Delete existing parcours rules
    await client.query('DELETE FROM parcours_rules');
    console.log('✓ Deleted existing parcours rules');
    
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['PARCOURS'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`Total rows in Excel: ${data.length}`);
    
    // Skip header rows (first 3 rows are headers)
    const rows = data.slice(3);
    console.log(`Rows after headers: ${rows.length}`);
    
    let formationIdMap = {
      'DIGITAL COMPETENCES': 23,
      'Digitales Compétences': 23,
      'WORD': 44,
      'Word': 44,
      'EXCEL': 45,
      'Excel': 45,
      'PPT': 54,
      'PowerPoint': 54,
      'WORDPRESS': 22,
      'WordPress': 22,
      'PHOTOSHOP': 20,
      'Photoshop': 20,
      'GIMP': 48,
      'Gimp': 48,
      'ILLUSTRATOR': 19,
      'Illustrator': 19,
      'SKETCHUP': 21,
      'SketchUp': 21,
      'OUTILS COLL': 43,
      'Outils Collaboratifs Google': 43,
      'GOOGLE SHEETS': 5,
      'Google Sheets': 5,
      'GOOGLE DOCS': 4,
      'Google Docs': 4,
      'GOOGLE SLIDES': 10,
      'Google Slides': 10,
    };
    
    let currentFormation = null;
    let currentFormationId = null;
    let order = 1;
    const rules = [];
    
    for (const row of rows) {
      if (!row[0]) continue;
      
      const parcoursName = row[0].toString().trim();
      console.log(`Processing row: "${parcoursName}"`);
      
      // Check if this is a formation name (single word like WORD, EXCEL, etc.)
      if (formationIdMap[parcoursName]) {
        currentFormation = parcoursName;
        currentFormationId = formationIdMap[parcoursName];
        order = 1;
        console.log(`  -> Set formation: ${currentFormation} (ID: ${currentFormationId})`);
        continue;
      }
      
      // Reset formation when encountering section headers that don't exist in database
      if (parcoursName.includes('PARCOURS') || 
          parcoursName.includes('LANGUE') ||
          parcoursName.includes('CREATION') ||
          parcoursName.includes('SITE') ||
          parcoursName.includes('DOCS / SHEETS') ||
          parcoursName.includes('IA GENERATIVE')) {
        currentFormation = null;
        currentFormationId = null;
        console.log(`  -> Reset formation (section header)`);
        continue;
      }
      
      // Skip notes
      if (parcoursName.includes('ATTENTION') ||
          parcoursName.includes('RAPPEL') ||
          parcoursName.includes('formation IA')) {
        continue;
      }
      
      // Skip parcours for formations that don't exist in database
      if (!currentFormationId) {
        console.log(`  -> Skipping: ${parcoursName} (no valid formation)`);
        continue;
      }
      
      // This is a parcours row
      if (currentFormation && currentFormationId && row[1] && row[4]) {
        const module1 = row[1].toString().trim();
        const module2 = row[4].toString().trim();
        
        console.log(`  -> Parcours: ${parcoursName}, Module1: ${module1}, Module2: ${module2}`);
        
        // Determine condition based on module levels
        let condition = '';
        if (module1.toLowerCase().includes('basique')) {
          condition = `Si résultat du test ${currentFormation.toUpperCase()} = Basique`;
        } else if (module1.toLowerCase().includes('opérationnel')) {
          condition = `Si résultat du test ${currentFormation.toUpperCase()} = Opérationnel`;
        } else if (module1.toLowerCase().includes('initial')) {
          condition = `Si résultat du test ${currentFormation.toUpperCase()} ≤ Basique`;
        }
        
        // Extract certificateur from codes if available
        const cert1 = row[2] ? ` (${row[2].toString().trim()})` : '';
        const cert2 = row[5] ? ` (${row[5].toString().trim()})` : '';
        
        const formation1 = module1 + cert1;
        const formation2 = module2 + cert2;
        
        rules.push({
          formation: currentFormation,
          formationId: currentFormationId,
          condition: condition,
          formation1: formation1,
          formation2: formation2,
          order: order,
          isActive: true,
          certification: null,
          prerequisiteConditions: null,
          prerequisiteLogic: 'OR',
          explanationMessage: `${module1} + ${module2}`,
          parcoursTitle: parcoursName
        });
        
        order++;
      }
    }
    
    console.log(`Found ${rules.length} parcours rules to import`);
    
    // Insert all rules
    for (const rule of rules) {
      const query = `
        INSERT INTO parcours_rules (
          formation, "formationId", condition, formation1, formation2, 
          "order", "isActive", certification, "prerequisiteConditions", 
          "prerequisiteLogic", "explanationMessage", "parcoursTitle"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      const values = [
        rule.formation,
        rule.formationId,
        rule.condition,
        rule.formation1,
        rule.formation2,
        rule.order,
        rule.isActive,
        rule.certification,
        rule.prerequisiteConditions ? JSON.stringify(rule.prerequisiteConditions) : null,
        rule.prerequisiteLogic,
        rule.explanationMessage,
        rule.parcoursTitle,
      ];
      await client.query(query, values);
      console.log(`✓ Inserted rule: ${rule.formation} - ${rule.parcoursTitle}`);
    }
    
    console.log(`\n✓ Successfully imported ${rules.length} parcours rules from Excel`);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

importParcoursFromExcel();
