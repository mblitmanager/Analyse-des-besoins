const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const filePath = path.join(__dirname, '../../nouveau p1,p2 et p3.xlsx');

async function importP3FromExcel() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Delete existing P3 override rules
    await client.query('DELETE FROM p3_override_rules');
    console.log('✓ Deleted existing P3 override rules');
    
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
      'ANGLAIS': 25,
      'FRANCAIS': 51,
      'IA GENERATIVE': 100,
    };
    
    let currentFormation = null;
    let currentFormationId = null;
    let order = 1;
    const p3Rules = [];
    
    for (const row of rows) {
      if (!row[0]) continue;
      
      const parcoursName = row[0].toString().trim();
      const module3 = row[9] ? row[9].toString().trim() : '';
      
      // Check if this is a formation name
      if (formationIdMap[parcoursName]) {
        currentFormation = parcoursName;
        currentFormationId = formationIdMap[parcoursName];
        order = 1;
        console.log(`  -> Set formation: ${currentFormation} (ID: ${currentFormationId})`);
        continue;
      }
      
      // Reset formation when encountering section headers
      if (parcoursName.includes('PARCOURS') || 
          parcoursName.includes('LANGUE') ||
          parcoursName.includes('CREATION') ||
          parcoursName.includes('SITE') ||
          parcoursName.includes('DOCS / SHEETS') ||
          parcoursName.includes('MIXTES')) {
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
      
      // Skip if no module 3 option
      if (!module3 || module3 === '') {
        continue;
      }
      
      // This is a parcours row with P3 option
      if (currentFormation && currentFormationId && row[1] && row[4] && module3) {
        const module1 = row[1].toString().trim();
        const module2 = row[4].toString().trim();
        
        console.log(`  -> Parcours: ${parcoursName}, P3 option: ${module3}`);
        
        // Determine condition based on module levels (same logic as parcours rules)
        let condition = '';
        let testName = currentFormation
          .replace('DIGITAL COMPETENCES', 'DIGCOMP')
          .replace('Digitales Compétences', 'DIGCOMP')
          .replace('Outils Collaboratifs Google', 'OC')
          .replace('OUTILS COLL', 'OC')
          .toUpperCase();
        
        // Handle special cases for formations without clear level indicators
        if (module1.toLowerCase().includes('basique')) {
          condition = `Si résultat du test ${testName} = Basique`;
        } else if (module1.toLowerCase().includes('opérationnel')) {
          condition = `Si résultat du test ${testName} = Opérationnel`;
        } else if (module1.toLowerCase().includes('expert')) {
          condition = `Si résultat du test ${testName} = Expert`;
        } else if (module1.toLowerCase().includes('a2')) {
          condition = `Si résultat du test ${testName} = A2`;
        } else if (module1.toLowerCase().includes('b1')) {
          condition = `Si résultat du test ${testName} = B1`;
        } else if (module1.toLowerCase().includes('b2')) {
          condition = `Si résultat du test ${testName} = B2`;
        } else if (module1.toLowerCase().includes('c1')) {
          condition = `Si résultat du test ${testName} = C1`;
        } else if (module1.toLowerCase().includes('technique')) {
          condition = `Si résultat du test ${testName} = Technique`;
        } else if (module1.toLowerCase().includes('professionnel')) {
          condition = `Si résultat du test ${testName} = Professionnel`;
        } else {
          // Default condition for formations without clear level indicators
          condition = `Si résultat du test ${testName} = Opérationnel`;
        }
        
        // Extract certificateur from codes if available (same logic as parcours rules)
        const cert1 = row[2] ? ` (${row[2].toString().trim()})` : '';
        const cert2 = row[5] ? ` (${row[5].toString().trim()})` : '';
        
        const formation1 = module1 + cert1;
        const formation2 = module2 + cert2;
        
        // Split module3 options if multiple
        const p3Options = module3.split('/').map(opt => opt.trim());
        
        p3Options.forEach((p3Option, idx) => {
          // Try to extract certificateur from P3 option if it contains code
          let p3Formation = p3Option;
          // Clean up the P3 option to match format
          if (p3Option.includes('TOSA') || p3Option.includes('ICDL') || p3Option.includes('ETS') || p3Option.includes('VOLTAIRE')) {
            // Keep as is, already has certificateur
          } else {
            // Try to infer certificateur based on content
            if (p3Option.toLowerCase().includes('anglais')) {
              p3Formation = `${p3Option} (ETS)`;
            } else if (p3Option.toLowerCase().includes('voltaire')) {
              p3Formation = `${p3Option} (VOLTAIRE)`;
            } else if (p3Option.toLowerCase().includes('ia')) {
              p3Formation = `${p3Option} (INKREA)`;
            } else if (p3Option.toLowerCase().includes('tosa')) {
              p3Formation = `${p3Option} (TOSA)`;
            } else if (p3Option.toLowerCase().includes('icdl')) {
              p3Formation = `${p3Option} (ICDL)`;
            }
          }
          
          p3Rules.push({
            formation: currentFormation,
            formationId: currentFormationId,
            condition: condition,
            formation1: p3Formation,
            formation2: '',
            order: order + idx,
            isActive: true,
            certification: null,
            explanationMessage: `${formation1} + ${p3Formation}`,
            parcoursTitle: `${parcoursName} - P3`
          });
        });
        
        order += p3Options.length;
      }
    }
    
    console.log(`Found ${p3Rules.length} P3 override rules to import`);
    
    // Insert all P3 rules
    for (const rule of p3Rules) {
      const query = `
        INSERT INTO p3_override_rules (
          formation, "formationId", condition, formation1, formation2, 
          "order", "isActive", certification, "explanationMessage", "parcoursTitle"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        rule.explanationMessage,
        rule.parcoursTitle,
      ];
      await client.query(query, values);
      console.log(`✓ Inserted P3 rule: ${rule.formation} - ${rule.formation1}`);
    }
    
    console.log(`\n✓ Successfully imported ${p3Rules.length} P3 override rules from Excel`);
    
    await client.end();
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    process.exit(1);
  }
}

importP3FromExcel();
