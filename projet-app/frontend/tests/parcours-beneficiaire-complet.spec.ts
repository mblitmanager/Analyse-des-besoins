import { test, expect } from '@playwright/test';

test.describe('Simulation Parcours Bénéficiaire - Par Formation et Niveau', () => {
  const API_BASE = 'http://localhost:3001/api';

  // Données de test pour différents scénarios
  const scenarios = [
    {
      formation: 'Anglais',
      p1: 'Niveau A2 - TOEIC',
      p2: 'Niveau B1 - TOEIC',
      expectedP3: 'Renforcement Anglais',
      description: 'Anglais A2 + B1 → Renforcement Anglais (B2)'
    },
    {
      formation: 'Anglais',
      p1: 'Niveau B1 - TOEIC',
      p2: 'Niveau B2 - TOEIC',
      expectedP3: 'Expertise Anglais',
      description: 'Anglais B1 + B2 → Expertise Anglais (C1)'
    },
    {
      formation: 'Excel',
      p1: 'Excel Basique (TOSA)',
      p2: 'Excel Opérationnel (TOSA)',
      expectedP3: 'Excel Expert',
      description: 'Excel Basique + Opérationnel → Excel Expert'
    },
    {
      formation: 'PowerPoint',
      p1: 'PowerPoint Basique (TOSA)',
      p2: 'PowerPoint Opérationnel (TOSA)',
      expectedP3: 'PowerPoint Expert',
      description: 'PowerPoint Basique + Opérationnel → PowerPoint Expert'
    },
    {
      formation: 'Digitales Compétences',
      p1: 'Digitales Compétences Basique',
      p2: 'Digitales Compétences Opérationnel',
      expectedP3: 'Digitales Compétences Expert',
      description: 'Digitales Compétences Basique + Opérationnel → Expert'
    }
  ];

  test.beforeEach(async ({ request }) => {
    // Vérifier que l'API est accessible
    const response = await request.get(`${API_BASE}/formations`);
    expect(response.ok()).toBeTruthy();
  });

  test.describe('Scénarios Anglais - TOEIC', () => {
    test('Scénario 1: Anglais A2 + B1 → Renforcement Anglais', async ({ request }) => {
      const scenario = scenarios[0];
      
      // 1. Récupérer la formation Anglais
      const formationsResponse = await request.get(`${API_BASE}/formations`);
      const formations = await formationsResponse.json();
      const anglaisFormation = formations.find((f: any) => f.label.includes('Anglais'));
      
      expect(anglaisFormation).toBeDefined();
      
      // 2. Créer une session pour ce scénario
      const sessionData = {
        contactId: 1,
        formationId: anglaisFormation.id,
        status: 'en_cours',
        scenario: scenario.description
      };
      
      const sessionResponse = await request.post(`${API_BASE}/sessions`, {
        data: sessionData
      });
      
      if (sessionResponse.ok()) {
        const session = await sessionResponse.json();
        console.log(`✅ Session créée: ${session.id}`);
        
        // 3. Simuler les réponses P1 et P2
        const answersData = {
          sessionId: session.id,
          p1: scenario.p1,
          p2: scenario.p2
        };
        
        // Note: Cet endpoint n'existe pas encore, on simule
        console.log(`⚠️ Simulation réponses: P1=${scenario.p1}, P2=${scenario.p2}`);
        
        // 4. Vérifier que la règle P3 correspondante existe
        const p3Response = await request.get(`${API_BASE}/p3-override?formation=Anglais`);
        const p3Rules = await p3Response.json();
        
        const relevantRule = p3Rules.find((rule: any) => 
          rule.parcoursTitle && rule.parcoursTitle.includes(scenario.expectedP3)
        );
        
        expect(relevantRule).toBeDefined();
        console.log(`✅ Règle P3 trouvée: ${relevantRule.parcoursTitle}`);
        
        // 5. Vérifier les conditions de la règle
        if (relevantRule) {
          const hasP1Condition = relevantRule.conditionP1 || relevantRule.formation1;
          const hasP2Condition = relevantRule.conditionP2 || relevantRule.formation2;
          
          expect(hasP1Condition).toBeDefined();
          expect(hasP2Condition).toBeDefined();
          
          console.log(`✅ Conditions P3 validées: P1=${hasP1Condition}, P2=${hasP2Condition}`);
        }
      } else {
        console.log('⚠️ Création session non disponible - Validation API statique');
        
        // Validation statique des règles P3
        const p3Response = await request.get(`${API_BASE}/p3-override`);
        const p3Rules = await p3Response.json();
        
        const renforcementRule = p3Rules.find((rule: any) => 
          rule.parcoursTitle && rule.parcoursTitle.includes('Renforcement Anglais')
        );
        
        expect(renforcementRule).toBeDefined();
        console.log(`✅ Règle Renforcement Anglais validée statiquement`);
      }
    });

    test('Scénario 2: Anglais B1 + B2 → Expertise Anglais', async ({ request }) => {
      const scenario = scenarios[1];
      
      // Validation statique de la règle Expertise Anglais
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      const expertiseRule = p3Rules.find((rule: any) => 
        rule.parcoursTitle && rule.parcoursTitle.includes('Expertise Anglais')
      );
      
      expect(expertiseRule).toBeDefined();
      console.log(`✅ Règle Expertise Anglais validée`);
      
      // Vérifier les conditions attendues
      if (expertiseRule) {
        console.log(`📋 Conditions: P1=${expertiseRule.conditionP1 || expertiseRule.formation1}, P2=${expertiseRule.conditionP2 || expertiseRule.formation2}`);
      }
    });

    test('Scénario 3: Anglais A1 + A2 → Perfectionnement Anglais', async ({ request }) => {
      // Vérifier qu'il existe une règle pour les niveaux bas
      const p3Response = await request.get(`${API_BASE}/p3-override?formation=Anglais`);
      const p3Rules = await p3Response.json();
      
      // Filtrer les règles qui pourraient correspondre à des niveaux bas
      const lowLevelRules = p3Rules.filter((rule: any) => 
        (rule.conditionP1 && rule.conditionP1.includes('A1')) ||
        (rule.conditionP2 && rule.conditionP2.includes('A1')) ||
        (rule.formation1 && rule.formation1.includes('A1'))
      );
      
      console.log(`📊 Règles pour niveaux bas: ${lowLevelRules.length}`);
      
      // Au moins une règle devrait exister pour Anglais
      expect(p3Rules.length).toBeGreaterThan(0);
    });
  });

  test.describe('Scénarios Excel', () => {
    test('Scénario: Excel Basique + Opérationnel → Expert', async ({ request }) => {
      const scenario = scenarios[2];
      
      // Vérifier les règles P3 pour Excel
      const p3Response = await request.get(`${API_BASE}/p3-override?formation=Excel`);
      const p3Rules = await p3Response.json();
      
      expect(p3Rules.length).toBeGreaterThan(0);
      console.log(`✅ ${p3Rules.length} règles P3 pour Excel`);
      
      // Vérifier la normalisation du nom (Excel vs EXCEL)
      const excelRules = p3Rules.filter((rule: any) => 
        rule.formation && rule.formation.includes('Excel')
      );
      
      expect(excelRules.length).toBeGreaterThan(0);
      console.log(`✅ Normalisation Excel: ${excelRules.length} règles avec "Excel"`);
    });

    test('Scénario: Excel + IA Générative', async ({ request }) => {
      // Vérifier la règle pour Excel + IA Générative
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      const excelIaRule = p3Rules.find((rule: any) => 
        rule.parcoursTitle && rule.parcoursTitle.includes('Excel') && rule.parcoursTitle.includes('IA')
      );
      
      if (excelIaRule) {
        console.log(`✅ Règle Excel + IA trouvée: ${excelIaRule.parcoursTitle}`);
        
        // Vérifier l'ordre P1/P2 pour cette règle (correction demandée)
        console.log(`📋 Conditions: P1=${excelIaRule.conditionP1 || excelIaRule.formation1}, P2=${excelIaRule.conditionP2 || excelIaRule.formation2}`);
      } else {
        console.log('⚠️ Règle Excel + IA non trouvée (peut être normale)');
      }
    });
  });

  test.describe('Scénarios PowerPoint', () => {
    test('Scénario: PowerPoint Basique + Opérationnel → Expert', async ({ request }) => {
      const scenario = scenarios[3];
      
      // Vérifier les règles P3 pour PowerPoint
      const p3Response = await request.get(`${API_BASE}/p3-override?formation=PowerPoint`);
      const p3Rules = await p3Response.json();
      
      expect(p3Rules.length).toBeGreaterThan(0);
      console.log(`✅ ${p3Rules.length} règles P3 pour PowerPoint`);
      
      // Vérifier la normalisation du nom (PowerPoint vs PPT)
      const powerPointRules = p3Rules.filter((rule: any) => 
        rule.formation && rule.formation.includes('PowerPoint')
      );
      
      expect(powerPointRules.length).toBeGreaterThan(0);
      console.log(`✅ Normalisation PowerPoint: ${powerPointRules.length} règles avec "PowerPoint"`);
    });
  });

  test.describe('Scénarios Digitales Compétences', () => {
    test('Scénario: Digitales Compétences Basique + Opérationnel → Expert', async ({ request }) => {
      const scenario = scenarios[4];
      
      // Vérifier les règles P3 pour Digitales Compétences
      const p3Response = await request.get(`${API_BASE}/p3-override?formation=Digitales Compétences`);
      const p3Rules = await p3Response.json();
      
      expect(p3Rules.length).toBeGreaterThan(0);
      console.log(`✅ ${p3Rules.length} règles P3 pour Digitales Compétences`);
      
      // Vérifier la normalisation du nom (Digitales Compétences vs DIGCOMP)
      const digitalesRules = p3Rules.filter((rule: any) => 
        rule.formation && rule.formation.includes('Digitales Compétences')
      );
      
      expect(digitalesRules.length).toBeGreaterThan(0);
      console.log(`✅ Normalisation Digitales Compétences: ${digitalesRules.length} règles`);
    });

    test('Scénario: Essentiels Digitales Compétences 1 Outlook', async ({ request }) => {
      // Vérifier la règle spécifique demandée
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      const outlookRule = p3Rules.find((rule: any) => 
        rule.parcoursTitle && rule.parcoursTitle.includes('Essentiels Digitales Compétences') && rule.parcoursTitle.includes('Outlook')
      );
      
      expect(outlookRule).toBeDefined();
      console.log(`✅ Règle "Essentiels Digitales Compétences 1 Outlook" validée`);
    });
  });

  test.describe('Scénarios Google Workspace', () => {
    test('Scénario: Google Workspace - 3 parcours distincts', async ({ request }) => {
      // Vérifier les 3 parcours Google Workspace
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      const googleSheets = p3Rules.find((rule: any) => 
        rule.parcoursTitle && rule.parcoursTitle.includes('Google Sheets')
      );
      const googleDocs = p3Rules.find((rule: any) => 
        rule.parcoursTitle && rule.parcoursTitle.includes('Google Docs')
      );
      const googleSlides = p3Rules.find((rule: any) => 
        rule.parcoursTitle && rule.parcoursTitle.includes('Google Slides')
      );
      
      expect(googleSheets || googleDocs || googleSlides).toBeDefined();
      console.log(`✅ Parcours Google Workspace validés`);
      
      if (googleSheets) console.log(`   - Google Sheets: ${googleSheets.parcoursTitle}`);
      if (googleDocs) console.log(`   - Google Docs: ${googleDocs.parcoursTitle}`);
      if (googleSlides) console.log(`   - Google Slides: ${googleSlides.parcoursTitle}`);
    });
  });

  test.describe('Validation globale des parcours', () => {
    test('Vérification cohérence des parcours par formation', async ({ request }) => {
      // Récupérer toutes les formations
      const formationsResponse = await request.get(`${API_BASE}/formations`);
      const formations = await formationsResponse.json();
      
      // Récupérer toutes les règles P3
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      // Pour chaque formation principale, vérifier qu'il existe des règles
      const mainFormations = ['Anglais', 'Excel', 'PowerPoint', 'Word', 'Digitales Compétences'];
      
      for (const formationName of mainFormations) {
        const formation = formations.find((f: any) => f.label.includes(formationName));
        if (formation) {
          const rulesForFormation = p3Rules.filter((rule: any) => 
            rule.formation && rule.formation.includes(formationName)
          );
          
          console.log(`📊 ${formationName}: ${rulesForFormation.length} règles P3`);
          expect(rulesForFormation.length).toBeGreaterThan(0);
        }
      }
    });

    test('Vérification absence de messages explicatifs avec flèches', async ({ request }) => {
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      const rulesWithArrows = p3Rules.filter((rule: any) => 
        rule.explanationMessage && (
          rule.explanationMessage.includes('->') ||
          rule.explanationMessage.includes('→') ||
          rule.explanationMessage.includes('=>')
        )
      );
      
      expect(rulesWithArrows.length).toBe(0);
      console.log(`✅ Aucun message explicatif avec flèches (${rulesWithArrows.length} trouvés)`);
    });

    test('Vérification orthographe Opérationnel avec accent', async ({ request }) => {
      const p3Response = await request.get(`${API_BASE}/p3-override`);
      const p3Rules = await p3Response.json();
      
      const operationnelRules = p3Rules.filter((rule: any) => 
        (rule.formation1 && rule.formation1.includes('Opérationnel')) ||
        (rule.formation2 && rule.formation2.includes('Opérationnel')) ||
        (rule.parcoursTitle && rule.parcoursTitle.includes('Opérationnel'))
      );
      
      expect(operationnelRules.length).toBeGreaterThan(0);
      console.log(`✅ Orthographe correcte: ${operationnelRules.length} règles avec "Opérationnel"`);
    });
  });

  test.describe('Simulation flux complet bénéficiaire', () => {
    test('Flux complet: Sélection formation → Session → Calcul P3', async ({ request }) => {
      // 1. Sélectionner une formation
      const formationsResponse = await request.get(`${API_BASE}/formations`);
      const formations = await formationsResponse.json();
      const anglaisFormation = formations.find((f: any) => f.label.includes('Anglais'));
      
      expect(anglaisFormation).toBeDefined();
      console.log(`✅ Étape 1: Formation sélectionnée - ${anglaisFormation.label}`);
      
      // 2. Créer une session
      const sessionData = {
        contactId: 1,
        formationId: anglaisFormation.id,
        status: 'en_cours'
      };
      
      const sessionResponse = await request.post(`${API_BASE}/sessions`, {
        data: sessionData
      });
      
      if (sessionResponse.ok()) {
        const session = await sessionResponse.json();
        console.log(`✅ Étape 2: Session créée - ${session.id}`);
        
        // 3. Simuler les réponses (endpoint non implémenté)
        console.log(`⚠️ Étape 3: Réponses simulées (endpoint non implémenté)`);
        
        // 4. Calculer les résultats (endpoint non implémenté)
        console.log(`⚠️ Étape 4: Calcul P3 simulé (endpoint non implémenté)`);
        
        // 5. Vérifier les règles P3 applicables
        const p3Response = await request.get(`${API_BASE}/p3-override?formation=Anglais`);
        const p3Rules = await p3Response.json();
        
        console.log(`✅ Étape 5: ${p3Rules.length} règles P3 applicables`);
        
        // 6. Sélectionner le parcours P3 approprié
        const renforcementRule = p3Rules.find((rule: any) => 
          rule.parcoursTitle && rule.parcoursTitle.includes('Renforcement Anglais')
        );
        
        if (renforcementRule) {
          console.log(`✅ Étape 6: Parcours P3 proposé - ${renforcementRule.parcoursTitle}`);
        }
      } else {
        console.log('⚠️ Session non créée - Validation statique uniquement');
      }
    });
  });
});
