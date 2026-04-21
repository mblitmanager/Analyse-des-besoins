import { PdfService } from '../backend/src/pdf/pdf.service';
import * as fs from 'fs';

async function generate() {
  const svc = new PdfService();
  const buffer = await svc.generateSessionPdf({
    civilite: 'M.',
    prenom: 'Christopher',
    nom: 'BURTIN',
    telephone: '+33750260219',
    conseiller: 'Veronique Herault',
    metier: 'Conducteur de travaux',
    situation: ['Salarié'],
    formationChoisie: 'Anglais',
    finalRecommendation: 'Anglais : Consolider les bases - TOEIC & Anglais Développer l\'autonomie - TOEIC',
    levelsScores: {
      'A1 - Revoir les bases': { score: 4, total: 6, validated: false, requiredCorrect: 5 }
    },
    prerequisiteAnswers: {
      1: 'Quotidiennement',
      2: 'Oui'
    },
    qTextById: {
      1: 'A quelle fréquence utilisez-vous un ordinateur ?',
      2: 'A quelle fréquence utilisez-vous internet ?'
    }
  });
  fs.writeFileSync('test.pdf', buffer);
  console.log('PDF Generated at test.pdf');
}
generate().catch(console.error);
