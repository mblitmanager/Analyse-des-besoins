import { test, expect } from '@playwright/test';

test.describe('Parcours Complet Bénéficiaire - Anglais B1 + B2', () => {
  test('Flux complet: Accueil → Formulaire → Parcours → Résultats P3', async ({ page }) => {
    // 1. Accéder à la page d'accueil (racine)
    await page.goto('http://localhost:5173/');
    
    console.log('✅ Étape 1: Page d\'accueil chargée');
    await page.screenshot({ path: 'etape-1-accueil.png' });
    
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    
    // Vérifier que nous sommes sur la page d'accueil
    const title = page.locator('h1, h2, .title, .welcome').first();
    await expect(title).toBeVisible();
    
    // 2. Remplir le formulaire initial
    console.log('📝 Étape 2: Remplissage du formulaire');
    
    // Remplir tous les champs visibles du formulaire
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    
    console.log(`   - ${inputCount} champs de formulaire trouvés`);
    
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const inputType = await input.getAttribute('type');
      const inputName = await input.getAttribute('name') || await input.getAttribute('placeholder') || `champ ${i}`;
      
      if (inputType === 'text' || inputType === 'email' || inputType === 'tel') {
        if (inputName.toLowerCase().includes('nom') || inputName.toLowerCase().includes('name')) {
          await input.fill('Test');
          console.log(`   - ${inputName}: Test`);
        } else if (inputName.toLowerCase().includes('prénom') || inputName.toLowerCase().includes('prenom') || inputName.toLowerCase().includes('first')) {
          await input.fill('Bénéficiaire');
          console.log(`   - ${inputName}: Bénéficiaire`);
        } else if (inputType === 'email') {
          await input.fill('test@beneficiaire.com');
          console.log(`   - ${inputName}: test@beneficiaire.com`);
        } else if (inputType === 'tel') {
          await input.fill('0123456789');
          console.log(`   - ${inputName}: 0123456789`);
        }
      }
    }
    
    await page.screenshot({ path: 'etape-2-formulaire-rempli.png' });
    
    // 3. Cliquer sur le bouton pour démarrer
    console.log('🚀 Étape 3: Démarrage du parcours');
    
    // Chercher tous les boutons possibles
    const allButtons = page.locator('button, input[type="submit"], a.btn');
    const buttonCount = await allButtons.count();
    
    console.log(`   - ${buttonCount} boutons/liens trouvés`);
    
    // Afficher les textes des boutons pour débogage
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const buttonText = await button.textContent();
      if (buttonText && buttonText.trim()) {
        console.log(`   - Bouton ${i}: "${buttonText.trim()}"`);
      }
    }
    
    // Essayer différents boutons
    const startButton = page.locator('button:has-text("Commencer"), button:has-text("Démarrer"), button:has-text("Suivant"), button:has-text("Valider"), button:has-text("Envoyer"), input[type="submit"]').first();
    
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('   - Bouton cliqué');
    } else {
      // Essayer le dernier bouton (souvent le bouton de validation)
      const lastButton = allButtons.last();
      if (await lastButton.isVisible()) {
        await lastButton.click();
        console.log('   - Dernier bouton cliqué');
      }
    }
    
    // Attendre un peu pour la navigation
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'etape-3-apres-clic.png' });
    
    // Attendre la navigation
    await page.waitForLoadState('networkidle');
    
    // 4. Continuer depuis la page prérequis
    console.log('📚 Étape 4: Page prérequis');
    
    await page.screenshot({ path: 'etape-4-prerequis.png' });
    
    // Chercher un bouton pour continuer sur la page prérequis
    const prerequisButtons = page.locator('button, a').filter({ hasText: /Continuer|Suivant|OK|Valider/ });
    
    if (await prerequisButtons.first().isVisible()) {
      await prerequisButtons.first().click();
      console.log('   - Bouton continuer cliqué sur prérequis');
      await page.waitForLoadState('networkidle');
    }
    
    // 5. Sélectionner la formation Anglais
    console.log('📚 Étape 5: Sélection de la formation Anglais');
    
    await page.screenshot({ path: 'etape-5-avant-selection.png' });
    
    // Chercher la formation Anglais
    const anglaisFormation = page.locator('text=Anglais').first();
    
    if (await anglaisFormation.isVisible()) {
      await anglaisFormation.click();
      console.log('   - Formation Anglais sélectionnée');
    } else {
      // Chercher dans une liste ou cartes
      const formationCard = page.locator('.formation-card, .formation-item, .v-card').filter({ hasText: 'Anglais' }).first();
      if (await formationCard.isVisible()) {
        await formationCard.click();
        console.log('   - Formation Anglais cliquée via carte');
      }
    }
    
    await page.screenshot({ path: 'etape-5-apres-selection.png' });
    
    // Attendre la navigation vers positionnement
    await page.waitForLoadState('networkidle');
    
    // 6. Questions de positionnement (simuler réponses pour B1 et B2)
    console.log('❓ Étape 6: Questions de positionnement');
    
    // Vérifier si nous sommes sur une page de questions
    const currentUrl = page.url();
    console.log(`   - URL actuelle: ${currentUrl}`);
    
    if (currentUrl.includes('positionnement') || currentUrl.includes('positioning') || currentUrl.includes('quiz')) {
      console.log('   - Page de positionnement détectée');
      
      // Simuler des réponses pour obtenir B1 et B2
      const questions = page.locator('.question, .quiz-question, .question-card');
      const questionCount = await questions.count();
      
      console.log(`   - ${questionCount} questions trouvées`);
      
      // Répondre à quelques questions (adapter selon votre interface)
      for (let i = 0; i < Math.min(questionCount, 3); i++) {
        const question = questions.nth(i);
        await question.scrollIntoViewIfNeeded();
        
        // Chercher des options de réponse
        const answerOption = question.locator('input[type="radio"], .answer-option, button[type="button"]').first();
        if (await answerOption.isVisible()) {
          await answerOption.click();
          console.log(`   - Question ${i + 1} répondue`);
        }
        
        // Cliquer sur suivant si nécessaire
        const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Continuer")').first();
        if (await nextButton.isVisible() && i < Math.min(questionCount, 3) - 1) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
      
      // Cliquer sur terminer/valider
      const finishButton = page.locator('button:has-text("Terminer"), button:has-text("Valider"), button:has-text("Finir")').first();
      if (await finishButton.isVisible()) {
        await finishButton.click();
        console.log('   - Questionnaire terminé');
      }
    } else {
      console.log('   - Page de positionnement non détectée, navigation manuelle peut-être nécessaire');
    }
    
    // Attendre la navigation vers résultats
    await page.waitForLoadState('networkidle');
    
    // 7. Vérifier les résultats et le P3 proposé
    console.log('📊 Étape 7: Vérification des résultats P3');
    
    const resultsUrl = page.url();
    console.log(`   - URL résultats: ${resultsUrl}`);
    
    // Chercher les informations sur P1, P2, P3
    const p1Element = page.locator('text=P1, text=Niveau B1, text=B1').first();
    const p2Element = page.locator('text=P2, text=Niveau B2, text=B2').first();
    const p3Element = page.locator('text=P3, text=C1, text=Expertise').first();
    
    console.log('   - Recherche des résultats P1/P2/P3...');
    
    if (await p1Element.isVisible()) {
      const p1Text = await p1Element.textContent();
      console.log(`   - P1 trouvé: ${p1Text}`);
    }
    
    if (await p2Element.isVisible()) {
      const p2Text = await p2Element.textContent();
      console.log(`   - P2 trouvé: ${p2Text}`);
    }
    
    if (await p3Element.isVisible()) {
      const p3Text = await p3Element.textContent();
      console.log(`   - P3 trouvé: ${p3Text}`);
      
      // Vérifier si le P3 est "C1" ou "Niveau C1 - TOEIC"
      if (p3Text && p3Text.includes('C1')) {
        if (p3Text === 'C1' || p3Text.trim() === 'C1') {
          console.log('   ✅ P3 au format correct: "C1"');
        } else {
          console.log(`   ⚠️  P3 au format complet: "${p3Text}" (attendu: "C1")`);
        }
      }
    }
    
    // Chercher le parcours proposé
    const parcoursPropose = page.locator('text=Expertise Anglais, text=Renforcement').first();
    if (await parcoursPropose.isVisible()) {
      const parcoursText = await parcoursPropose.textContent();
      console.log(`   - Parcours proposé: ${parcoursText}`);
      
      // Vérifier si le parcours contient "C1" au format attendu
      if (parcoursText && parcoursText.includes('C1')) {
        if (parcoursText.includes('Niveau C1 - TOEIC')) {
          console.log('   ⚠️  P3 au format complet détecté dans le parcours');
        } else if (parcoursText.includes('C1') && !parcoursText.includes('Niveau')) {
          console.log('   ✅ P3 au format court détecté: "C1"');
        }
      }
    }
    
    // 8. Capture d'écran des résultats
    console.log('📸 Étape 8: Capture d\'écran des résultats');
    
    await page.screenshot({ 
      path: 'etape-8-resultats.png',
      fullPage: true 
    });
    
    console.log('   - Capture sauvegardée: parcours-anglais-resultats.png');
    
    console.log('✅ Parcours complet terminé');
  });
});
