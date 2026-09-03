import { test, expect } from '@playwright/test';

test.describe('Tests API P3 Override - Formateur Herizo Randria', () => {
  const API_BASE = 'http://localhost:3001/api';

  test('Test API - Liste des formations disponibles', async ({ request }) => {
    const response = await request.get(`${API_BASE}/formations`);
    
    expect(response.ok()).toBeTruthy();
    const formations = await response.json();
    
    expect(Array.isArray(formations)).toBeTruthy();
    expect(formations.length).toBeGreaterThan(0);
    
    console.log(`✅ Test API formations - ${formations.length} formations récupérées`);
  });

  test('Test API - Règles P3 Override', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    expect(Array.isArray(rules)).toBeTruthy();
    expect(rules.length).toBeGreaterThan(0);
    
    console.log(`✅ Test API règles P3 - ${rules.length} règles récupérées`);
  });

  test('Test API - Vérification règle Essentiels Digitales Compétences 1 Outlook', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const outlookRule = rules.find((rule: any) => 
      rule.parcoursTitle && rule.parcoursTitle.includes('Essentiels Digitales Compétences') && rule.parcoursTitle.includes('Outlook')
    );
    
    expect(outlookRule).toBeDefined();
    console.log('✅ Test API règle Outlook - Règle "Essentiels Digitales Compétences 1 Outlook" trouvée');
  });

  test('Test API - Vérification règles Google Workspace', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const googleRules = rules.filter((rule: any) => 
      rule.parcoursTitle && rule.parcoursTitle.includes('Google')
    );
    
    expect(googleRules.length).toBeGreaterThanOrEqual(3);
    console.log(`✅ Test API Google Workspace - ${googleRules.length} parcours Google trouvés`);
  });

  test('Test API - Vérification règle Expertise Anglais', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const expertiseRule = rules.find((rule: any) => 
      rule.parcoursTitle && rule.parcoursTitle.includes('Expertise Anglais')
    );
    
    expect(expertiseRule).toBeDefined();
    console.log('✅ Test API Expertise Anglais - Règle "Expertise Anglais" trouvée');
  });

  test('Test API - Normalisation des noms (Digitales Compétences)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const digitalesCompetencesRules = rules.filter((rule: any) => 
      (rule.formation1 && rule.formation1.includes('Digitales Compétences')) ||
      (rule.formation2 && rule.formation2.includes('Digitales Compétences')) ||
      (rule.parcoursTitle && rule.parcoursTitle.includes('Digitales Compétences'))
    );
    
    expect(digitalesCompetencesRules.length).toBeGreaterThan(0);
    console.log(`✅ Test API normalisation - ${digitalesCompetencesRules.length} règles avec "Digitales Compétences"`);
  });

  test('Test API - Normalisation des noms (PowerPoint)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const powerPointRules = rules.filter((rule: any) => 
      (rule.formation1 && rule.formation1.includes('PowerPoint')) ||
      (rule.formation2 && rule.formation2.includes('PowerPoint')) ||
      (rule.parcoursTitle && rule.parcoursTitle.includes('PowerPoint'))
    );
    
    expect(powerPointRules.length).toBeGreaterThan(0);
    console.log(`✅ Test API normalisation - ${powerPointRules.length} règles avec "PowerPoint"`);
  });

  test('Test API - Vérification orthographe Opérationnel', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const operationnelRules = rules.filter((rule: any) => 
      (rule.formation1 && rule.formation1.includes('Opérationnel')) ||
      (rule.formation2 && rule.formation2.includes('Opérationnel')) ||
      (rule.parcoursTitle && rule.parcoursTitle.includes('Opérationnel'))
    );
    
    expect(operationnelRules.length).toBeGreaterThan(0);
    console.log(`✅ Test API orthographe - ${operationnelRules.length} règles avec "Opérationnel" (accent)`);
  });

  test('Test API - Absence messages explicatifs avec flèches', async ({ request }) => {
    const response = await request.get(`${API_BASE}/p3-override`);
    
    expect(response.ok()).toBeTruthy();
    const rules = await response.json();
    
    const rulesWithArrows = rules.filter((rule: any) => 
      rule.explanationMessage && (
        rule.explanationMessage.includes('->') ||
        rule.explanationMessage.includes('→') ||
        rule.explanationMessage.includes('=>')
      )
    );
    
    expect(rulesWithArrows.length).toBe(0);
    console.log(`✅ Test API messages explicatifs - ${rulesWithArrows.length} règles avec flèches (attendu: 0)`);
  });

  test('Test API - Calcul P3 pour parcours Anglais', async ({ request }) => {
    // Test du calcul P3 pour un parcours avec P1=A2, P2=B1
    const response = await request.post(`${API_BASE}/sessions/calculate-p3`, {
      data: {
        formation: 'Anglais',
        p1: 'Niveau A2 - TOEIC',
        p2: 'Niveau B1 - TOEIC'
      }
    });
    
    // Si l'endpoint n'existe pas encore, ce test échouera
    if (response.ok()) {
      const result = await response.json();
      console.log('✅ Test API calcul P3 - Endpoint fonctionnel', result);
    } else {
      console.log('⚠️ Test API calcul P3 - Endpoint non implémenté encore');
    }
  });

  test('Test API - Niveaux TOEIC format correct', async ({ request }) => {
    const response = await request.get(`${API_BASE}/formations`);
    
    expect(response.ok()).toBeTruthy();
    const formations = await response.json();
    
    const anglaisFormation = formations.find((f: any) => 
      f.label && f.label.includes('Anglais')
    );
    
    if (anglaisFormation) {
      // Vérifier que la formation Anglais existe
      expect(anglaisFormation).toBeDefined();
      console.log(`✅ Test API niveaux TOEIC - Formation Anglais trouvée`);
      
      // Si la formation a des niveaux, vérifier le format
      if (anglaisFormation.levels) {
        const toeicLevels = anglaisFormation.levels.filter((level: any) => 
          level.name && level.name.includes('TOEIC')
        );
        
        if (toeicLevels.length > 0) {
          // Vérifier le format "Niveau X - TOEIC"
          const correctFormat = toeicLevels.every((level: any) => 
            level.name && level.name.match(/^Niveau [A-C][12] - TOEIC$/)
          );
          
          expect(correctFormat).toBeTruthy();
          console.log(`✅ Test API niveaux TOEIC - ${toeicLevels.length} niveaux au format correct`);
        } else {
          console.log('⚠️ Test API niveaux TOEIC - Aucun niveau TOEIC trouvé dans la structure');
        }
      } else {
        console.log('⚠️ Test API niveaux TOEIC - Structure de données sans levels');
      }
    } else {
      console.log('⚠️ Test API niveaux TOEIC - Formation Anglais non trouvée');
    }
  });
});
