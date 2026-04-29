import { Injectable } from '@nestjs/common';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

@Injectable()
export class PdfService {
  async generateSessionPdf(data: {
    civilite?: string | null;
    prenom?: string | null;
    nom?: string | null;
    email?: string | null;
    telephone?: string | null;
    conseiller?: string | null;
    metier?: string | null;
    situation?: string[] | null;
    brand?: string | null;
    formationChoisie?: string | null;
    finalRecommendation?: string | null;
    scoreFinal?: number;
    levelsScores?: Record<string, any>;
    prerequisiteAnswers?: Record<string, any>;
    complementaryAnswers?: Record<string, any>;
    availabilityAnswers?: Record<string, any>;
    miseANiveauAnswers?: Record<string, any>;
    positionnementAnswers?: Record<string, Record<string, any>>;
    qTextById?: Record<number, string>;
    parrainNom?: string | null;
    parrainPrenom?: string | null;
    parrainEmail?: string | null;
    parrainTelephone?: string | null;
    highLevelContinue?: boolean;
    isP3Mode?: boolean;
    parcoursNumber?: number;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title:
            `Analyse des besoins - ${data.prenom || ''} ${data.nom || ''}`.trim(),
          Author: 'NS Conseil',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      const brandBlue = '#0D8ABC';
      const darkText = '#1f2937';
      const grayText = '#6b7280';
      const lightBg = '#f8fafc';

      const publicPath = path.join(process.cwd(), 'public');
      const logoAopiaPath = path.join(publicPath, 'logo', 'Logo-AOPIA.png');
      const logoLikePath = path.join(
        publicPath,
        'logo',
        'Logo_Like_Formation.png',
      );

      // ─── Header ───
      doc
        .fontSize(22)
        .fillColor(brandBlue)
        .text('Analyse des besoins', { align: 'center' });

      if (data.parcoursNumber) {
        let badgeText = `P${data.parcoursNumber}`;
        let badgeStatus = data.parcoursNumber === 1 ? 'INITIAL' : (data.parcoursNumber === 3 ? '3ÈME PARCOURS' : 'COMPLÉMENTAIRE');
        
        // Handle multi-step P1 & P2 case
        if (data.parcoursNumber === 1 && data.finalRecommendation?.includes(' & ')) {
          badgeText = 'P1 & P2';
          badgeStatus = 'INITIAL & COMPLÉMENTAIRE';
        }

        const isInitial = data.parcoursNumber === 1;
        const badgeColor = isInitial ? '#047857' : '#4338CA';

        doc
          .fontSize(12)
          .fillColor(badgeColor)
          .font('Helvetica-Bold')
          .text(`${badgeText} - PARCOURS ${badgeStatus}`, { align: 'center' });
        doc.font('Helvetica'); // Reset
      } else if (data.isP3Mode) {
        doc
          .fontSize(12)
          .fillColor('#4338CA')
          .font('Helvetica-Bold')
          .text('P3 - PARCOURS COMPLÉMENTAIRE', { align: 'center' });
        doc.font('Helvetica'); // Reset
      }

      doc
        .fontSize(10)
        .fillColor(grayText)
        .text(`Date : ${dateStr}`, { align: 'center' });
      doc.moveDown(1.5);

      // ─── Beneficiary Info ───
      this.sectionTitle(doc, 'Informations du bénéficiaire');
      const beneficiary = [
        [
          'Bénéficiaire',
          `${data.civilite || ''} ${data.prenom || ''} ${data.nom || ''}`.trim(),
        ],
        ['Téléphone', data.telephone || 'N/A'],
        ['Conseiller', data.conseiller || 'N/A'],
        ['Métier', data.metier || 'N/A'],
        [
          'Situation',
          Array.isArray(data.situation)
            ? data.situation.join(', ')
            : data.situation || 'N/A',
        ],
      ];
      this.drawTable(doc, beneficiary, darkText, grayText, lightBg);

      // ─── Referral Info (Optional) ───
      if (
        data.parrainNom ||
        data.parrainPrenom ||
        data.parrainEmail ||
        data.parrainTelephone
      ) {
        doc.moveDown(0.5);
        this.sectionTitle(doc, 'Parrainage');
        const referral = [
          ['Parrain / Marraine', `${data.parrainPrenom || ''} ${data.parrainNom || ''}`.trim() || 'N/A'],
          ['Email Parrain', data.parrainEmail || 'N/A'],
          ['Téléphone Parrain', data.parrainTelephone || 'N/A'],
        ];
        this.drawTable(doc, referral, darkText, grayText, lightBg);
      }

      // ─── PRÉ-REQUIS ───
      this.renderAnswersSection(
        doc,
        'Pré-requis (réponses)',
        data.prerequisiteAnswers,
        data.qTextById,
        darkText,
        grayText,
        lightBg,
      );

      // ─── Formation + Recommendation ───
      doc.moveDown(0.5);
      if (data.highLevelContinue) {
        doc
          .fillColor('#991B1B')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(
            '⚠️ Niveau supérieur au parcours proposé. Le bénéficiaire a obtenu un score élevé pour cette formation et a souhaité maintenir sa demande.',
            { align: 'center' },
          );
        doc.moveDown(0.5);
      }
      this.sectionTitle(doc, 'Formation et Résultat');

      const recommendations = (data.finalRecommendation || '').split(' | ');
      const formationInfo: string[][] = [
        ['Formation choisie', data.formationChoisie || 'N/A'],
        ...recommendations.map((r, i) => [
          i === 0 ? 'Recommandation(s)' : '',
          r,
        ]),
      ];
      this.drawTable(doc, formationInfo, darkText, grayText, lightBg);

      // ─── Level Scores ───
      if (
        data.scoreFinal !== -1 &&
        data.levelsScores &&
        Object.keys(data.levelsScores).length > 0
      ) {
        doc.moveDown(0.5);
        this.sectionTitle(doc, 'Scores par niveau');
        const levelRows = Object.entries(data.levelsScores).map(
          ([lvl, e]: [string, any]) => {
            const score = `${Number(e?.score) || 0}/${Number(e?.total) || 0}`;
            const validated = e?.validated ? 'Oui' : 'Non';
            const displayLvl = lvl.toLowerCase().includes('niveau')
              ? lvl
              : `Niveau ${lvl}`;
            return [displayLvl, score, validated];
          },
        );
        this.drawTable(
          doc,
          [['Niveau', 'Score obtenu', 'Validé'], ...levelRows],
          darkText,
          grayText,
          lightBg,
          true,
        );
      }

      // ─── Answers Sections ───
      this.renderAnswersSection(
        doc,
        'Questions complémentaires (réponses)',
        data.complementaryAnswers,
        data.qTextById,
        darkText,
        grayText,
        lightBg,
      );
      this.renderAnswersSection(
        doc,
        'Disponibilités (réponses)',
        data.availabilityAnswers,
        data.qTextById,
        darkText,
        grayText,
        lightBg,
      );
      
      this.renderAnswersSection(
        doc,
        'Usage de la langue',
        data.miseANiveauAnswers,
        data.qTextById,
        darkText,
        grayText,
        lightBg,
      );

      // ─── Annex: Detailed Test Answers ───
      if (data.positionnementAnswers && Object.keys(data.positionnementAnswers).length > 0) {
        this.renderPositionnementAnnex(doc, data.positionnementAnswers, data.qTextById, darkText, grayText, lightBg);
      }

      // ─── Footer with Logos ───
      const footerY = doc.page.height - 80;

      try {
        if (fs.existsSync(logoAopiaPath)) {
          doc.image(logoAopiaPath, doc.page.width / 2 - 90, footerY, {
            height: 25,
          });
        }
        if (fs.existsSync(logoLikePath)) {
          doc.image(logoLikePath, doc.page.width / 2 + 10, footerY, {
            height: 25,
          });
        }
      } catch (e) {
        console.warn('Could not add logos to PDF:', e.message);
      }

      doc.moveDown(3);
      doc
        .fontSize(8)
        .fillColor(grayText)
        .text(
          'Document généré automatiquement par NS Conseil - Analyse des besoins',
          doc.page.width / 2 - 200,
          footerY + 35,
          {
            align: 'center',
            width: 400,
          },
        );

      doc.end();
    });
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string) {
    const y = doc.y;
    // Colored band (light grey/blue)
    doc.rect(50, y, doc.page.width - 100, 20).fill('#E0F2FE'); // Light blue band
    doc
      .fontSize(10)
      .fillColor('#0369A1') // Darker blue text for contrast
      .font('Helvetica-Bold')
      .text(title.toUpperCase(), 60, y + 5, { underline: false, align: 'left' })
      .font('Helvetica');
    
    doc.y = y + 25;
    doc.moveDown(0.2);
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    rows: string[][],
    darkText: string,
    grayText: string,
    lightBg: string,
    hasHeader = false,
  ) {
    const colWidth = (doc.page.width - 100) / (rows[0]?.length || 2);
    const startX = 50;

    rows.forEach((row, rowIndex) => {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      const y = doc.y;
      const isHeader = hasHeader && rowIndex === 0;

      if (isHeader) {
        doc.rect(startX, y - 2, doc.page.width - 100, 20).fill(lightBg);
      }

      let maxHeight = 0;
      row.forEach((cell, colIndex) => {
        const h = doc.heightOfString(cell || '', { width: colWidth - 10 });
        if (h > maxHeight) maxHeight = h;

        doc
          .fontSize(isHeader ? 9 : 10)
          .fillColor(isHeader ? grayText : colIndex === 0 ? darkText : grayText)
          // Reduced bold for questions (colIndex 0) - using Helvetica instead of Bold as requested
          .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
          .text(cell || '', startX + colIndex * colWidth, y, {
            width: colWidth - 10,
            lineBreak: true,
          });
      });

      doc.y = y + maxHeight + 10; // Tightened vertical spacing

      // Removed row separator line as requested
    });

    doc.moveDown(0.5);
  }

  private renderAnswersSection(
    doc: PDFKit.PDFDocument,
    title: string,
    answers: Record<string, any> | null | undefined,
    qTextById: Record<number, string> | undefined,
    darkText: string,
    grayText: string,
    lightBg: string,
  ) {
    if (!answers || Object.keys(answers).length === 0) return;

    doc.moveDown(0.5);
    this.sectionTitle(doc, title);

    const rows = Object.entries(answers).map(([key, val]) => {
      const idNum = Number(key);
      const label = qTextById?.[idNum] || `Question ${key}`;
      const display = Array.isArray(val) ? val.join(', ') : String(val ?? '');
      return [label, display];
    });

    this.drawTable(doc, rows, darkText, grayText, lightBg);
  }

  private renderPositionnementAnnex(
    doc: PDFKit.PDFDocument,
    positionnementAnswers: Record<string, Record<string, any>>,
    qTextById: Record<number, string> | undefined,
    darkText: string,
    grayText: string,
    lightBg: string,
  ) {
    doc.addPage();
    doc.moveDown(1);
    this.sectionTitle(doc, 'ANNEXE : DÉTAIL DES RÉPONSES DU TEST');
    
    Object.entries(positionnementAnswers).forEach(([level, levelAnswers]) => {
      doc.fontSize(10).fillColor('#0D8ABC').font('Helvetica-Bold').text(level, { align: 'left' }).moveDown(0.5).font('Helvetica');
      
      const rows = Object.entries(levelAnswers).map(([qId, val], index) => {
        const idNum = Number(qId);
        const questionText = qTextById?.[idNum] || `Question ${qId}`;
        const display = Array.isArray(val) ? val.join(', ') : String(val ?? '');
        return [questionText, display];
      });

      this.drawTable(doc, rows, darkText, grayText, lightBg);
      doc.moveDown(1);
    });
  }
}
