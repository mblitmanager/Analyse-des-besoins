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
    parcoursTitle?: string | null;
    recommendations?: string[];
    fullRecommendation?: string | null;
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
    stopLevelOrder?: number;
    // Optional flag provided by caller to indicate that this formation is a language course
    isLanguageFormation?: boolean;
    correctAnswersById?: Record<number, string | string[]>;
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
      const p1Color = '#305364'; // Slate Blue
      const p2Color = '#059669'; // Emerald
      const p3Color = '#b45309'; // Dark Golden

      const publicPath = path.join(process.cwd(), 'public');
      const logoAopiaPath = path.join(publicPath, 'logo', 'Logo-AOPIA.png');
      const logoLikePath = path.join(
        publicPath,
        'logo',
        'Logo_Like_Formation.png',
      );

      // ─── Header with Logos ───
      try {
        let logoX = 50;
        if (fs.existsSync(logoAopiaPath)) {
          doc.image(logoAopiaPath, logoX, 40, { height: 20 });
          logoX += 80;
        }
        if (fs.existsSync(logoLikePath)) {
          // Separator line
          if (logoX > 50) {
            doc
              .strokeColor('#e5e7eb')
              .lineWidth(1)
              .moveTo(logoX - 10, 42)
              .lineTo(logoX - 10, 58)
              .stroke();
          }
          doc.image(logoLikePath, logoX, 40, { height: 20 });
        }
      } catch (e) {
        console.warn('Header logos failed:', e.message);
      }

      doc
        .fontSize(18)
        .fillColor(brandBlue)
        .font('Helvetica-Bold')
        .text('Analyse des besoins', { align: 'right' });
      doc.font('Helvetica');

      if (data.parcoursNumber || data.isP3Mode) {
        const pNum = data.parcoursNumber || (data.isP3Mode ? 3 : 1);
        let badgeText = `P${pNum}`;
        let badgeStatus =
          pNum === 1
            ? 'INITIAL'
            : pNum === 3
              ? '3ÈME PARCOURS'
              : 'COMPLÉMENTAIRE';

        const badgeColor =
          pNum === 1 ? p1Color : pNum === 2 ? p2Color : p3Color;

        doc
          .fontSize(10)
          .fillColor(badgeColor)
          .font('Helvetica-Bold')
          .text(`${badgeText} - PARCOURS ${badgeStatus}`, { align: 'right' });
        doc.font('Helvetica'); // Reset
      }

      doc
        .fontSize(10)
        .fillColor(grayText)
        .text(`Date : ${dateStr}`, { align: 'center' });
      doc.moveDown(0.5);

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
          [
            'Parrain / Marraine',
            `${data.parrainPrenom || ''} ${data.parrainNom || ''}`.trim() ||
              'N/A',
          ],
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
        undefined,
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
        doc.moveDown(0.3);
      }
      this.sectionTitle(doc, 'Formation et Résultat');

      const formationDemandee = data.formationChoisie || 'N/A';
      const recommendationItems = this.getRecommendationItems(data);
      const fullRecommendation =
        data.fullRecommendation ||
        recommendationItems.join(' & ') ||
        data.finalRecommendation ||
        'Analyse en cours';
      const parcoursPréconisé = this.getRecommendationTitle(
        data.parcoursTitle,
        fullRecommendation,
      );
      // Only show "Formation demandée" if it differs from the recommendation
      // (when user was redirected by a QuestionRule, both are the same)
      const formationInfo: string[][] = formationDemandee !== parcoursPréconisé && formationDemandee !== 'N/A'
        ? [
            ['Formation demandée', formationDemandee],
            ['Parcours préconisé', parcoursPréconisé],
          ]
        : [
            ['Parcours préconisé', parcoursPréconisé],
          ];
      this.drawTable(doc, formationInfo, darkText, grayText, lightBg);

      if (
        data.finalRecommendation ||
        data.parcoursTitle ||
        recommendationItems.length > 0
      ) {
        doc.moveDown(0.2);
        this.renderRecommendationSummary(
          doc,
          parcoursPréconisé,
          recommendationItems,
          fullRecommendation,
          !!data.isP3Mode || data.parcoursNumber === 3,
        );
      }

      const checkSectionBreak = (h: number = 100) => {
        if (doc.y > doc.page.height - h) {
          doc.addPage();
        }
      };

      // ─── Level Scores ───
      if (
        data.scoreFinal !== -1 &&
        data.levelsScores &&
        Object.keys(data.levelsScores).length > 0
      ) {
        doc.moveDown(0.3);
        checkSectionBreak(120);
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
      checkSectionBreak(80);
      this.renderAnswersSection(
        doc,
        'Questions complémentaires (réponses)',
        data.complementaryAnswers,
        data.qTextById,
        undefined,
        darkText,
        grayText,
        lightBg,
      );
      checkSectionBreak(80);
      this.renderAnswersSection(
        doc,
        'Disponibilités (réponses)',
        data.availabilityAnswers,
        data.qTextById,
        undefined,
        darkText,
        grayText,
        lightBg,
      );

      checkSectionBreak(80);
      // Titre dynamique selon le type de formation
      // Determine title for mise à niveau section.
      // Prefer an explicit flag provided by the caller (isLanguageFormation). If missing, fall back to label-matching for common language formations.
      let isLangueFormation: boolean | undefined = (data as any).isLanguageFormation;
      if (typeof isLangueFormation === 'undefined') {
        isLangueFormation = ['anglais', 'français', 'francais'].some(
          (lang) => (data.formationChoisie || '').toLowerCase().includes(lang),
        );
      }
      const miseNiveauTitle = isLangueFormation ? 'Usage de la langue' : 'Usage du logiciel';
      this.renderAnswersSection(
        doc,
        miseNiveauTitle,
        data.miseANiveauAnswers,
        data.qTextById,
        undefined,
        darkText,
        grayText,
        lightBg,
      );

      // ─── Annex: Detailed Test Answers ───
      if (
        data.positionnementAnswers &&
        Object.keys(data.positionnementAnswers).length > 0
      ) {
        this.renderPositionnementAnnex(
          doc,
          data.positionnementAnswers,
          data.qTextById,
          data.correctAnswersById,
          darkText,
          grayText,
          lightBg,
        );
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

      doc.end();
    });
  }

  private normalizeLabel(value?: string | null): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private hasMeaningfulTitle(
    title?: string | null,
    fallback?: string | null,
  ): boolean {
    const cleanTitle = this.normalizeLabel(title);
    if (!cleanTitle) return false;
    if (
      cleanTitle === 'parcours' ||
      cleanTitle === 'parcours personnalise' ||
      cleanTitle === 'parcours de formation'
    ) {
      return false;
    }

    const cleanFallback = this.normalizeLabel(fallback);
    return !cleanFallback || cleanTitle !== cleanFallback;
  }

  private getRecommendationItems(data: {
    finalRecommendation?: string | null;
    recommendations?: string[];
  }): string[] {
    const source =
      data.recommendations && data.recommendations.length > 0
        ? data.recommendations
        : String(data.finalRecommendation || '')
            .replace(/\|/g, '&')
            .split('&');

    return source
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  private getRecommendationTitle(
    parcoursTitle?: string | null,
    fallback?: string | null,
  ): string {
    return this.hasMeaningfulTitle(parcoursTitle, fallback)
      ? String(parcoursTitle).trim()
      : fallback || 'Analyse en cours';
  }

  private renderRecommendationSummary(
    doc: PDFKit.PDFDocument,
    title: string,
    recommendations: string[],
    fallbackRecommendation: string,
    isP3: boolean,
  ) {
    const boxX = 50;
    const boxWidth = doc.page.width - 100;
    const padding = 14;
    const innerWidth = boxWidth - padding * 2;
    const titleText = title || fallbackRecommendation || 'Parcours préconisé';
    const titleNorm = this.normalizeLabel(titleText);
    const p3Detail = recommendations.find(
      (item) => this.normalizeLabel(item) !== titleNorm,
    );
    const cardItems = isP3
      ? [
          {
            label: 'P3',
            text: p3Detail ? `3ème parcours - ${p3Detail}` : '3ème parcours',
            badgeBg: '#EEF2FF',
            badgeColor: '#4338CA',
            border: '#C7D2FE',
          },
        ]
      : (recommendations.length > 1
          ? recommendations.slice(0, 2)
          : [recommendations[0] || fallbackRecommendation]
        ).map((item, index) => ({
          label: `P${index + 1}`,
          text: item,
          badgeBg: index === 0 ? '#E0F2FE' : '#FEF3C7',
          badgeColor: index === 0 ? '#075985' : '#92400E',
          border: index === 0 ? '#BAE6FD' : '#FDE68A',
        }));

    doc.font('Helvetica-Bold').fontSize(12);
    const titleHeight = doc.heightOfString(titleText, { width: innerWidth });
    const cardHeights = cardItems.map((item) => {
      doc.font('Helvetica-Bold').fontSize(9);
      return Math.max(
        30,
        doc.heightOfString(item.text, { width: innerWidth - 62 }) + 16,
      );
    });
    const totalHeight =
      padding +
      titleHeight +
      10 +
      cardHeights.reduce((sum, h) => sum + h + 6, 0) +
      padding -
      6;

    if (doc.y + totalHeight > doc.page.height - 80) {
      doc.addPage();
    }

    const boxY = doc.y;
    doc.rect(boxX, boxY, boxWidth, totalHeight).fill('#F8FAFC');
    doc.rect(boxX, boxY, 4, totalHeight).fill(isP3 ? '#6366F1' : '#22C55E');
    doc
      .rect(boxX, boxY, boxWidth, totalHeight)
      .strokeColor(isP3 ? '#C7D2FE' : '#BBF7D0')
      .lineWidth(1)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#0D1B3E')
      .text(titleText, boxX + padding, boxY + padding, { width: innerWidth });

    let y = boxY + padding + titleHeight + 10;
    cardItems.forEach((item, index) => {
      this.drawRecommendationCard(
        doc,
        boxX + padding,
        y,
        innerWidth,
        cardHeights[index],
        item,
      );
      y += cardHeights[index] + 6;
    });

    doc.font('Helvetica');
    doc.y = boxY + totalHeight + 10;
  }

  private drawRecommendationCard(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    item: {
      label: string;
      text: string;
      badgeBg: string;
      badgeColor: string;
      border: string;
    },
  ) {
    const badgeWidth = 34;
    const badgeHeight = 16;
    const textX = x + 10 + badgeWidth + 10;
    const textWidth = width - 20 - badgeWidth - 10;

    doc.rect(x, y, width, height).fill('#FFFFFF');
    doc.rect(x, y, width, height).strokeColor(item.border).lineWidth(1).stroke();
    doc.rect(x + 10, y + 7, badgeWidth, badgeHeight).fill(item.badgeBg);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(item.badgeColor)
      .text(item.label, x + 10, y + 11, {
        width: badgeWidth,
        align: 'center',
      });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#0D1B3E')
      .text(item.text, textX, y + 8, {
        width: textWidth,
      });
  }

  private sectionTitle(doc: PDFKit.PDFDocument, title: string) {
    const y = doc.y;
    // Colored band (light grey/blue)
    doc.rect(50, y, doc.page.width - 100, 18).fill('#E0F2FE'); // Light blue band
    doc
      .fontSize(9)
      .fillColor('#0369A1') // Darker blue text for contrast
      .font('Helvetica-Bold')
      .text(title.toUpperCase(), 60, y + 4, { underline: false, align: 'left' })
      .font('Helvetica');

    doc.y = y + 22;
    doc.moveDown(0.1);
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
      if (doc.y > doc.page.height - 70) {
        doc.addPage();
      }

      const y = doc.y;
      const isHeader = hasHeader && rowIndex === 0;

      if (isHeader) {
        doc.rect(startX, y - 2, doc.page.width - 100, 20).fill(lightBg);
      }

      let maxHeight = 0;
      row.forEach((cell) => {
        const h = doc.heightOfString(cell || '', { width: colWidth - 10 });
        if (h > maxHeight) maxHeight = h;
      });

      row.forEach((cell, colIndex) => {
        const cellX = startX + colIndex * colWidth;
        const isError = row[row.length - 1] === 'true' && colIndex === 1;
        doc
          .fontSize(isHeader ? 8 : 9)
          .fillColor(
            isError
              ? '#991B1B'
              : isHeader
                ? grayText
                : colIndex === 0
                  ? darkText
                  : grayText,
          );

        const baseFont = isHeader ? 'Helvetica-Bold' : 'Helvetica';
        const boldFont = 'Helvetica-Bold';

        this.renderFormattedText(
          doc,
          cell || '',
          cellX,
          y,
          colWidth - 10,
          baseFont,
          boldFont,
        );
      });

      doc.y = y + maxHeight + 6; // Compacted vertical spacing
    });

    doc.moveDown(0.5);
  }

  private renderFormattedText(
    doc: any,
    text: string,
    x: number,
    y: number,
    width: number,
    baseFont: string,
    boldFont: string,
  ) {
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
    
    if (parts.length === 0) {
      doc.text(text, x, y, { width: width });
      return;
    }

    doc.font(baseFont);

    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      const isBold = part.startsWith('**') && part.endsWith('**');
      const cleanPart = isBold ? part.substring(2, part.length - 2) : part;

      doc.font(isBold ? boldFont : baseFont);

      const options = { width: width, continued: !isLast };
      if (i === 0) {
        doc.text(cleanPart, x, y, options);
      } else {
        doc.text(cleanPart, options);
      }
    });
  }

  private renderAnswersSection(
    doc: PDFKit.PDFDocument,
    title: string,
    answers: Record<string, any> | null | undefined,
    qTextById: Record<number, string> | undefined,
    correctAnswersById: Record<number, string | string[]> | undefined,
    darkText: string,
    grayText: string,
    lightBg: string,
  ) {
    if (!answers || Object.keys(answers).length === 0) return;

    doc.moveDown(0.3);
    this.sectionTitle(doc, title);

    const rows = Object.entries(answers).map(([key, val], index) => {
      const idNum = Number(key);
      const label = qTextById?.[idNum] || `Question ${key}`;
      const questionLabel = `Q${index + 1} : ${label}`;
      let display = Array.isArray(val) ? val.join(', ') : String(val ?? '');

      const correctAnswer = correctAnswersById?.[idNum];
      let isError = false;
      if (correctAnswer !== undefined) {
        if (Array.isArray(correctAnswer)) {
          const userVals = Array.isArray(val) ? val : [val];
          isError =
            !correctAnswer.every((v) => userVals.includes(v)) ||
            userVals.length !== correctAnswer.length;
        } else {
          isError = String(val).trim() !== String(correctAnswer).trim();
        }
      }

      if (isError) {
        display += '';
      }

      return [questionLabel, display, isError ? 'true' : 'false']; // Tag as error
    });

    // Modified drawTable call within renderAnswersSection
    const colWidth = (doc.page.width - 100) / 2;
    const startX = 50;

    rows.forEach((row) => {
      if (doc.y > doc.page.height - 70) doc.addPage();
      const y = doc.y;
      const isError = row[2] === 'true';
      const cellColor = isError ? '#991B1B' : darkText;
      const valColor = isError ? '#991B1B' : grayText;

      const h1 = doc.heightOfString(row[0], { width: colWidth - 10 });
      const h2 = doc.heightOfString(row[1], { width: colWidth - 10 });
      const maxHeight = Math.max(h1, h2);

      doc.fontSize(10).fillColor(cellColor);
      this.renderFormattedText(
        doc,
        row[0],
        startX,
        y,
        colWidth - 10,
        'Helvetica',
        'Helvetica-Bold',
      );
      doc.fillColor(valColor);
      this.renderFormattedText(
        doc,
        row[1],
        startX + colWidth,
        y,
        colWidth - 10,
        'Helvetica',
        'Helvetica-Bold',
      );

      doc.y = y + maxHeight + 6; // Compacted vertical spacing
    });
  }

  private renderPositionnementAnnex(
    doc: PDFKit.PDFDocument,
    positionnementAnswers: Record<string, Record<string, any>>,
    qTextById: Record<number, string> | undefined,
    correctAnswersById: Record<number, string | string[]> | undefined,
    darkText: string,
    grayText: string,
    lightBg: string,
  ) {
    const hasAnyAnswer = Object.values(positionnementAnswers).some(
      (lvl) => Object.keys(lvl || {}).length > 0,
    );
    if (!hasAnyAnswer) return;

    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    } else {
      doc.moveDown(1);
    }
    this.sectionTitle(doc, 'ANNEXE : DÉTAIL DES RÉPONSES DU TEST');

    Object.entries(positionnementAnswers).forEach(([level, levelAnswers]) => {
      doc
        .fontSize(10)
        .fillColor('#0D8ABC')
        .font('Helvetica-Bold')
        .text(level, 50, doc.y, { align: 'left' })
        .moveDown(0.5)
        .font('Helvetica');

      const rows = Object.entries(levelAnswers).map(([qId, val], index) => {
        const idNum = Number(qId);
        const questionText = qTextById?.[idNum] || `Question ${qId}`;
        const questionLabel = `Q${index + 1} : ${questionText}`;
        let display = Array.isArray(val) ? val.join(', ') : String(val ?? '');

        const correctAnswer = correctAnswersById?.[idNum];
        let isError = false;
        if (correctAnswer !== undefined) {
          if (Array.isArray(correctAnswer)) {
            const userVals = Array.isArray(val) ? val : [val];
            isError =
              !correctAnswer.every((v) => userVals.includes(v)) ||
              userVals.length !== correctAnswer.length;
          } else {
            isError = String(val).trim() !== String(correctAnswer).trim();
          }
        }

        if (isError) {
          display += ' ';
        }

        return [questionLabel, display, isError ? 'true' : 'false'];
      });

      const colWidth = (doc.page.width - 100) / 2;
      const startX = 50;

      rows.forEach((row) => {
        if (doc.y > doc.page.height - 70) doc.addPage();
        const y = doc.y;
        const isError = row[2] === 'true';
        const cellColor = isError ? '#991B1B' : darkText;
        const valColor = isError ? '#991B1B' : grayText;

        const h1 = doc.heightOfString(row[0], { width: colWidth - 10 });
        const h2 = doc.heightOfString(row[1], { width: colWidth - 10 });
        const maxHeight = Math.max(h1, h2);

        doc.fontSize(10).fillColor(cellColor);
        this.renderFormattedText(
          doc,
          row[0],
          startX,
          y,
          colWidth - 10,
          'Helvetica',
          'Helvetica-Bold',
        );
        doc.fillColor(valColor);
        this.renderFormattedText(
          doc,
          row[1],
          startX + colWidth,
          y,
          colWidth - 10,
          'Helvetica',
          'Helvetica-Bold',
        );

        doc.y = y + maxHeight + 6; // Compacted vertical spacing
      });
    });
  }
}
