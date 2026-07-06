const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function updateParcoursRules() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Delete existing parcours rules to start fresh
    await client.query('DELETE FROM parcours_rules');
    console.log('✓ Deleted existing parcours rules');
    
    const rules = [
      // DIGCOMP
      {
        formation: 'Digitales Compétences',
        formationId: 23,
        condition: 'Si résultat du test DIGCOMP ≤ Basique',
        formation1: 'Digitales Compétences Basique (TOSA)',
        formation2: 'WORD Basique (TOSA)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'DIGCOMP Basique + WORD Basique',
        parcoursTitle: 'Essentiels Digitales Compétences & Word'
      },
      {
        formation: 'Digitales Compétences',
        formationId: 23,
        condition: 'Si résultat du test DIGCOMP ≤ Basique',
        formation1: 'Digitales Compétences Basique (TOSA)',
        formation2: 'EXCEL Basique (TOSA)',
        order: 2,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'DIGCOMP Basique + EXCEL Basique',
        parcoursTitle: 'Essentiels Digitales Compétences & Excel'
      },
      {
        formation: 'Digitales Compétences',
        formationId: 23,
        condition: 'Si résultat du test DIGCOMP ≤ Basique',
        formation1: 'Digitales Compétences Basique (TOSA)',
        formation2: 'PPT Basique (TOSA)',
        order: 3,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'DIGCOMP Basique + PPT Basique',
        parcoursTitle: 'Essentiels Digitales Compétences & PPT'
      },
      {
        formation: 'Digitales Compétences',
        formationId: 23,
        condition: 'Si résultat du test DIGCOMP ≤ Basique',
        formation1: 'Digitales Compétences Basique (TOSA)',
        formation2: 'OUTLOOK Basique (TOSA)',
        order: 4,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'DIGCOMP Basique + OUTLOOK Basique',
        parcoursTitle: 'Essentiels Digitales Compétences 1 Outlook'
      },
      {
        formation: 'Digitales Compétences',
        formationId: 23,
        condition: 'Si résultat du test DIGCOMP = Opérationnel',
        formation1: 'Digitales Compétences Opérationnel (TOSA)',
        formation2: 'OUTILS COLLABORATIFS (ICDL)',
        order: 5,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'DIGCOMP Opérationnel + OUTILS COLLABORATIFS',
        parcoursTitle: 'Perfectionnement Digitales Compétences & Outils Coll.'
      },
      
      // WORD
      {
        formation: 'Word',
        formationId: 44,
        condition: 'Si résultat du test WORD = Basique',
        formation1: 'WORD Basique (TOSA)',
        formation2: 'WORD Opérationnel (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'WORD Basique + WORD Opérationnel',
        parcoursTitle: 'Renforcement Word'
      },
      
      // EXCEL
      {
        formation: 'Excel',
        formationId: 45,
        condition: 'Si résultat du test EXCEL = Basique',
        formation1: 'EXCEL Basique (TOSA)',
        formation2: 'EXCEL Opérationnel (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'EXCEL Basique + EXCEL Opérationnel',
        parcoursTitle: 'Renforcement Excel'
      },
      {
        formation: 'Excel',
        formationId: 45,
        condition: 'Si résultat du test EXCEL = Opérationnel',
        formation1: 'EXCEL Opérationnel (ICDL)',
        formation2: 'EXCEL Expert (TOSA)',
        order: 2,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'EXCEL Opérationnel + EXCEL Expert',
        parcoursTitle: 'Expertise Excel'
      },
      
      // POWERPOINT
      {
        formation: 'PowerPoint',
        formationId: 54,
        condition: 'Si résultat du test PPT = Basique',
        formation1: 'PPT Basique (TOSA)',
        formation2: 'PPT Opérationnel (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'PPT Basique + PPT Opérationnel',
        parcoursTitle: 'Renforcement Powerpoint'
      },
      
      // OUTILS COLLABORATIFS
      {
        formation: 'Outils Collaboratifs Google',
        formationId: 43,
        condition: 'Si résultat du test OC = Opérationnel',
        formation1: 'OUTILS COLLABORATIFS (ICDL)',
        formation2: 'GOOGLE SHEETS (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'OUTILS COLLABORATIFS + GOOGLE SHEETS',
        parcoursTitle: 'Google Workspace (OC & SHEETS)'
      },
      {
        formation: 'Outils Collaboratifs Google',
        formationId: 43,
        condition: 'Si résultat du test OC = Opérationnel',
        formation1: 'OUTILS COLLABORATIFS (ICDL)',
        formation2: 'GOOGLE DOCS (ICDL)',
        order: 2,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'OUTILS COLLABORATIFS + GOOGLE DOCS',
        parcoursTitle: 'Google Workspace (OC & DOCS)'
      },
      {
        formation: 'Outils Collaboratifs Google',
        formationId: 43,
        condition: 'Si résultat du test OC = Opérationnel',
        formation1: 'OUTILS COLLABORATIFS (ICDL)',
        formation2: 'GOOGLE SLIDES (ICDL)',
        order: 3,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'OUTILS COLLABORATIFS + GOOGLE SLIDES',
        parcoursTitle: 'Google Workspace (OC & SLIDES)'
      },
      
      // GOOGLE SHEETS
      {
        formation: 'Google Sheets',
        formationId: 5,
        condition: 'Si résultat du test SHEETS = Opérationnel',
        formation1: 'GOOGLE SHEETS (ICDL)',
        formation2: 'GOOGLE DOCS/SLIDES (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'GOOGLE SHEETS + GOOGLE DOCS/SLIDES',
        parcoursTitle: 'Bureautique Google (SHEETS)'
      },
      
      // GOOGLE DOCS
      {
        formation: 'Google Docs',
        formationId: 4,
        condition: 'Si résultat du test DOCS = Opérationnel',
        formation1: 'GOOGLE DOCS (ICDL)',
        formation2: 'GOOGLE SHEETS/SLIDES (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'GOOGLE DOCS + GOOGLE SHEETS/SLIDES',
        parcoursTitle: 'Bureautique Google (DOCS)'
      },
      
      // GOOGLE SLIDES
      {
        formation: 'Google Slides',
        formationId: 10,
        condition: 'Si résultat du test SLIDES = Opérationnel',
        formation1: 'GOOGLE SLIDES (ICDL)',
        formation2: 'GOOGLE DOCS/SHEETS (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'GOOGLE SLIDES + GOOGLE DOCS/SHEETS',
        parcoursTitle: 'Bureautique Google (SLIDES)'
      },
      
      // PHOTOSHOP
      {
        formation: 'Photoshop',
        formationId: 20,
        condition: 'Si résultat du test PHOTOSHOP = Basique',
        formation1: 'PHOTOSHOP basique (TOSA)',
        formation2: 'PHOTOSHOP Opérationnel (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'PHOTOSHOP basique + PHOTOSHOP Opérationnel',
        parcoursTitle: 'Renforcement Photoshop'
      },
      
      // SKETCHUP
      {
        formation: 'SketchUp',
        formationId: 21,
        condition: 'Si résultat du test SKETCHUP ≤ Basique',
        formation1: 'SKETCHUP (ICDL)',
        formation2: 'ICDL GIMP (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'SKETCHUP + ICDL GIMP',
        parcoursTitle: 'Création visuels : 3D/Images'
      },
      
      // GIMP
      {
        formation: 'Gimp',
        formationId: 48,
        condition: 'Si résultat du test GIMP = Opérationnel',
        formation1: 'GIMP (ICDL)',
        formation2: 'ILLUSTRATOR Opérationnel (TOSA)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'GIMP + ILLUSTRATOR Opérationnel',
        parcoursTitle: 'Création graphique'
      },
      
      // ILLUSTRATOR
      {
        formation: 'Illustrator',
        formationId: 19,
        condition: 'Si résultat du test ILLUSTRATOR = Basique',
        formation1: 'ILLUSTRATOR Basique (TOSA)',
        formation2: 'ILLUSTRATOR Opérationnel (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'ILLUSTRATOR Basique + ILLUSTRATOR Opérationnel',
        parcoursTitle: 'Renforcement Illustrator'
      },
      
      // WORDPRESS
      {
        formation: 'WordPress',
        formationId: 22,
        condition: 'Si résultat du test WORDPRESS = Basique',
        formation1: 'WORDPRESS Basique (TOSA)',
        formation2: 'WORDPRESS Opérationnel (ICDL)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'WORDPRESS Basique + WORDPRESS Opérationnel',
        parcoursTitle: 'Renforcement Wordpress'
      },
      
      // ANGLAIS
      {
        formation: 'Anglais',
        formationId: 25,
        condition: 'Si résultat du test ANGLAIS ≤ A2',
        formation1: 'Anglais A2 (ETS)',
        formation2: 'Anglais B1 (ETS)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'A2 + B1',
        parcoursTitle: 'Renforcement Anglais (A2 & B1) - TOEIC'
      },
      {
        formation: 'Anglais',
        formationId: 25,
        condition: 'Si résultat du test ANGLAIS = B1',
        formation1: 'Anglais B1 (ETS)',
        formation2: 'Anglais B2 (ETS)',
        order: 2,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'B1 + B2',
        parcoursTitle: 'Perfectionnement Anglais (B1 & B2) - TOEIC'
      },
      {
        formation: 'Anglais',
        formationId: 25,
        condition: 'Si résultat du test ANGLAIS = B2',
        formation1: 'Anglais B2 (ETS)',
        formation2: 'Anglais C1 (ETS)',
        order: 3,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'B2 + C1',
        parcoursTitle: 'Expertise Anglais (B2 & C1) - TOEIC'
      },
      
      // FRANÇAIS
      {
        formation: 'Français',
        formationId: 51,
        condition: 'Si résultat du test FRANÇAIS = Technique',
        formation1: 'Français Technique (VOLTAIRE)',
        formation2: 'Français Professionnel (VOLTAIRE)',
        order: 1,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'Technique + Professionnel',
        parcoursTitle: 'Renforcement Français'
      },
      {
        formation: 'Français',
        formationId: 51,
        condition: 'Si résultat du test FRANÇAIS = Professionnel',
        formation1: 'Français Professionnel (VOLTAIRE)',
        formation2: 'Français Affaires (VOLTAIRE)',
        order: 2,
        isActive: true,
        certification: null,
        prerequisiteConditions: null,
        prerequisiteLogic: 'OR',
        explanationMessage: 'Professionnel + Affaires',
        parcoursTitle: 'Perfectionnement Français'
      },
    ];
    
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
      console.log(`✓ Inserted rule: ${rule.formation} - ${rule.condition}`);
    }
    
    console.log(`\n✓ Successfully inserted ${rules.length} parcours rules`);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    await client.end();
    process.exit(1);
  }
}

updateParcoursRules();
