import { Injectable } from '@nestjs/common';

const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  async generateSessionPdf(data: {
    civilite?: string;
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
    conseiller?: string;
    brand?: string;
    formationChoisie?: string;
    finalRecommendation?: string;
    scoreFinal?: number;
    levelsScores?: Record<string, any>;
    prerequisiteAnswers?: Record<string, any>;
    complementaryAnswers?: Record<string, any>;
    availabilityAnswers?: Record<string, any>;
    qTextById?: Record<number, string>;
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
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} à ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const brandBlue = '#0D8ABC';
      const darkText = '#1f2937';
      const grayText = '#6b7280';
      const lightBg = '#f8fafc';

      // ─── Header ───
      doc
        .fontSize(22)
        .fillColor(brandBlue)
        .text('Analyse des besoins', { align: 'center' });
      doc
        .fontSize(10)
        .fillColor(grayText)
        .text(`Date de soumission : ${dateStr}`, { align: 'center' });
      doc.moveDown(1.5);

      // ─── Beneficiary Info ───
      this.sectionTitle(doc, 'Informations du bénéficiaire');
      const beneficiary = [
        [
          'Bénéficiaire',
          `${data.civilite || ''} ${data.prenom || ''} ${data.nom || ''}`.trim(),
        ],
        ['Email', data.email || 'N/A'],
        ['Téléphone', data.telephone || 'N/A'],
        ['Conseiller', data.conseiller || 'N/A'],
        ['Marque', data.brand || 'N/A'],
      ];
      this.drawTable(doc, beneficiary, darkText, grayText, lightBg);

      // ─── Formation + Recommendation ───
      doc.moveDown(0.5);
      this.sectionTitle(doc, 'Formation et Résultat');
      const formationInfo = [
        ['Formation choisie', data.formationChoisie || 'N/A'],
        ['Recommandation', data.finalRecommendation || 'N/A'],
        [
          'Score final',
          data.scoreFinal !== undefined ? `${data.scoreFinal}%` : 'N/A',
        ],
      ];
      this.drawTable(doc, formationInfo, darkText, grayText, lightBg);

      // ─── Level Scores ───
      if (data.levelsScores && Object.keys(data.levelsScores).length > 0) {
        doc.moveDown(0.5);
        this.sectionTitle(doc, 'Scores par niveau');
        const levelRows = Object.entries(data.levelsScores).map(
          ([lvl, e]: [string, any]) => {
            const score = `${Number(e?.score) || 0}/${Number(e?.total) || 0}`;
            const validated = e?.validated ? 'Oui' : 'Non';
            return [lvl, score, validated];
          },
        );
        this.drawTable(
          doc,
          [['Niveau', 'Score', 'Validé'], ...levelRows],
          darkText,
          grayText,
          lightBg,
          true,
        );
      }

      // ─── Answers Sections ───
      this.renderAnswersSection(
        doc,
        'Pré-requis (réponses)',
        data.prerequisiteAnswers,
        data.qTextById,
        darkText,
        grayText,
        lightBg,
      );
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

      // ─── Footer ───
      doc.moveDown(2);
      doc
        .fontSize(8)
        .fillColor(grayText)
        .text(
          'Document généré automatiquement par NS Conseil - Analyse des besoins',
          {
            align: 'center',
          },
        );

      doc.end();
    });
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc
      .fontSize(13)
      .fillColor('#0D1B3E')
      .text(title, { underline: false })
      .moveDown(0.3);
    // Draw a thin separator line
    const y = doc.y;
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .moveTo(50, y)
      .lineTo(doc.page.width - 50, y)
      .stroke();
    doc.moveDown(0.3);
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
      // Check if we need a new page
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      const y = doc.y;
      const isHeader = hasHeader && rowIndex === 0;

      // Row background
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
          .font(isHeader || colIndex === 0 ? 'Helvetica-Bold' : 'Helvetica')
          .text(cell || '', startX + colIndex * colWidth, y, {
            width: colWidth - 10,
            lineBreak: true,
          });
      });

      // Move to after the tallest cell + some padding
      doc.y = y + maxHeight + 4;

      // Row separator
      if (rowIndex < rows.length - 1) {
        doc
          .strokeColor('#f3f4f6')
          .lineWidth(0.3)
          .moveTo(startX, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
      }
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
}
