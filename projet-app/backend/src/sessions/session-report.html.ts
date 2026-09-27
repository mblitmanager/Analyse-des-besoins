import * as path from 'path';
import * as fs from 'fs';
import { Session } from '../entities/session.entity';

/** HTML fragments of the report email sent to the advisor after a session. */

export function safe(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderAnswersTable(
  title: string,
  answers: any,
  qTextById: Record<number, string>,
  correctAnswersById?: Record<number, string | string[]>,
): string {
  if (!answers || Object.keys(answers).length === 0) return '';
  const rows = Object.entries(answers)
    .map(([key, val]) => {
      const idNum = Number(key);
      const qText = qTextById[idNum] || `Question ${key}`;
      const displayVal = Array.isArray(val) ? val.join(', ') : String(val);

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

      const color = isError ? '#991B1B' : '#1f2937';
      const marker = isError ? ' <span style="color:#991B1B;"></span>' : '';

      return `
      <tr>
        <td style="padding:10px;border-top:1px solid #eee;font-size:13px;width:60%; color: ${color};">${safe(
          qText,
        )}</td>
        <td style="padding:10px;border-top:1px solid #eee;font-size:13px;font-weight:700; color: ${color};">${safe(
          displayVal,
        )}${marker}</td>
      </tr>`;
    })
    .join('');

  return `
    <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">${safe(title)}</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function renderLevelsTable(levelsScores: Session['levelsScores']): string {
  if (!levelsScores) return '';
  return `
    <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Scores par niveau</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <thead style="background:#f8fafc;">
        <tr>
          <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Niveau</th>
          <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Score</th>
          <th style="text-align:left;padding:10px;font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Validé</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(levelsScores)
          .map(([lvl, e]: any) => {
            const ok = e?.validated ? 'Oui' : 'Non';
            const score = `${Number(e?.score) || 0}/${Number(e?.total) || 0}`;
            const displayLvl = lvl.toLowerCase().includes('niveau') ? lvl : `Niveau ${lvl}`;
            return `<tr>
              <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">${safe(displayLvl)}</td>
              <td style="padding:10px;border-top:1px solid #eee;">${safe(score)}</td>
              <td style="padding:10px;border-top:1px solid #eee;">${safe(ok)}</td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function renderParrainage(session: Session): string {
  if (
    !session.parrainNom &&
    !session.parrainPrenom &&
    !session.parrainEmail &&
    !session.parrainTelephone
  ) {
    return '';
  }
  return `
    <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Parrainage</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <tbody>
        <tr>
          <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Parrain / Marraine</td>
          <td style="padding:10px;border-top:1px solid #eee;">${safe(`${session.parrainPrenom || ''} ${session.parrainNom || ''}`.trim() || 'N/A')}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Email Parrain</td>
          <td style="padding:10px;border-top:1px solid #eee;">${safe(session.parrainEmail)}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Téléphone Parrain</td>
          <td style="padding:10px;border-top:1px solid #eee;">${safe(session.parrainTelephone)}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/** Advisor, sponsorship, level scores and answers blocks of the standard report. */
export function renderReportDetails(
  session: Session,
  answers: {
    qTextById: Record<number, string>;
    prerequis: any;
    complementary: any;
    miseANiveau: any;
  },
): string {
  return `
    <h3 style="margin:18px 0 10px 0;color:#0D1B3E;">Informations complémentaires</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:10px;overflow:hidden;">
      <tbody>
        <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Conseiller</td><td style="padding:10px;border-top:1px solid #eee;">${safe(session.conseiller)}</td></tr>
        <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Métier</td><td style="padding:10px;border-top:1px solid #eee;">${safe(session.metier)}</td></tr>
        <tr><td style="padding:10px;border-top:1px solid #eee;font-weight:700;">Situation</td><td style="padding:10px;border-top:1px solid #eee;">${safe(
          Array.isArray(session.situation) ? session.situation.join(', ') : session.situation,
        )}</td></tr>
      </tbody>
    </table>

    ${renderParrainage(session)}

    ${renderLevelsTable(session.levelsScores)}

    ${renderAnswersTable('Pré-requis (réponses)', answers.prerequis, answers.qTextById)}
    ${renderAnswersTable('Questions complémentaires (réponses)', answers.complementary, answers.qTextById)}
    ${renderAnswersTable('Usage de la langue', answers.miseANiveau, answers.qTextById)}
    ${session.highLevelContinue ? `<div style="background-color: #FEF2F2; color: #991B1B; padding: 12px; border-left: 4px solid #EF4444; margin-bottom: 20px; border-radius: 4px; font-weight: bold;">⚠️ Niveau supérieur au parcours proposé. Le bénéficiaire a obtenu un score élevé pour cette formation et a souhaité maintenir sa demande.</div>` : ''}
  `;
}

/** "P1", "P1 & P2" or "P3" badge shown at the top of the report. */
export function reportBadge(
  baseParcoursNumber: number,
  recommendationCount: number,
  isP3Mode: boolean,
) {
  let text = `P${baseParcoursNumber}`;
  let status =
    baseParcoursNumber === 1
      ? 'INITIAL'
      : baseParcoursNumber === 3
        ? '3ÈME PARCOURS'
        : 'COMPLÉMENTAIRE';

  if (recommendationCount > 1) {
    // Multiple recommendations is the standard P1 & P2 outcome
    text = 'P1 & P2';
    status = 'INITIAL & COMPLÉMENTAIRE';
  } else if (isP3Mode || baseParcoursNumber >= 3) {
    text = 'P3';
    status = '3ÈME PARCOURS';
  }

  const isInitial = text.includes('P1');
  return {
    text,
    status,
    bg: isInitial ? '#ecfdf5' : '#EEF2FF',
    border: isInitial ? '#6ee7b7' : '#C7D2FE',
    color: isInitial ? '#047857' : '#4338CA',
  };
}

const LOGOS_HTML = `
  <div style="margin-top: 20px; text-align: right;">
    <img src="cid:logo_aopia" alt="AOPIA" height="30" style="height: 30px; margin-left: 15px; vertical-align: middle;">
    <img src="cid:logo_like" alt="Like Formation" height="30" style="height: 30px; vertical-align: middle;">
  </div>`;

const FOOTER_HTML = `
  <p style="font-size: 11px; color: #999; margin-top: 40px;">
    Ceci est un rapport automatique généré par le système d'Analyse des Besoins AOPIA.
  </p>`;

export function renderStandardReportEmail(options: {
  session: Session;
  badge: ReturnType<typeof reportBadge>;
  resend: boolean;
  dateStr: string;
  fullRecommendation: string;
  recommendationSummaryHtml: string;
  detailsHtml: string;
}): string {
  const { session, badge, resend, dateStr, fullRecommendation } = options;
  return `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
    <div style="background-color: ${badge.bg}; border: 1px solid ${badge.border}; border-radius: 8px; padding: 10px; margin-bottom: 20px; text-align: center;">
      <span style="color: ${badge.color}; font-weight: bold; font-size: 14px;">
        🔷 ${badge.text} - PARCOURS ${badge.status}${resend ? ' (Rapport Renvoyé)' : ''}
      </span>
    </div>
    <h2 style="color: #0D8ABC; margin-bottom: 5px; font-size: 18px;">Bilan d'évaluation - Analyse des besoins${resend ? ' (Renvoyé)' : ''}</h2>
    <p style="color: #666; font-size: 14px; margin-top: 0;">Soumis le ${dateStr}</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

    <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
    <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
    ${
      session.parrainNom || session.parrainPrenom
        ? `<p><strong>Parrain / Marraine :</strong> ${session.parrainPrenom || ''} ${session.parrainNom || ''}</p>`
        : ''
    }
    <p><strong>Formation :</strong> ${session.formationChoisie || fullRecommendation}</p>
    <p><strong>Recommandations :</strong></p>
    ${options.recommendationSummaryHtml}

    <div style="margin-top: 30px;">
      ${options.detailsHtml}
    </div>
    ${LOGOS_HTML}
    ${FOOTER_HTML}
  </div>`;
}

export function renderP3SkipQuizReportEmail(options: {
  session: Session;
  resend: boolean;
  dateStr: string;
  recommendationSummaryHtml: string;
}): string {
  const { session, resend, dateStr } = options;
  return `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
    <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 10px; margin-bottom: 20px; text-align: center;">
      <span style="color: #4338CA; font-weight: bold; font-size: 14px;">🔷 P3 - 3ÈME PARCOURS (Même formation - Suite du parcours${resend ? ' - Renvoyé' : ''})</span>
    </div>
    <h2 style="color: #0D8ABC; margin-bottom: 5px; font-size: 18px;">Analyse des besoins - P3${resend ? ' (Renvoyé)' : ''}</h2>
    <p style="color: #666; font-size: 14px; margin-top: 0;">Complétude le ${dateStr}</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p><strong>Bénéficiaire :</strong> ${session.civilite || ''} ${session.prenom} ${session.nom}</p>
    <p><strong>Téléphone :</strong> ${session.telephone || ''}</p>
    <p><strong>Formation :</strong> ${session.formationChoisie || 'P3'}</p>
    <p><strong>Recommandation :</strong></p>
    ${options.recommendationSummaryHtml}
    ${LOGOS_HTML}
    ${FOOTER_HTML}
  </div>`;
}

/** Inline logo attachments referenced by cid in the email body. */
export function reportLogoAttachments(): any[] {
  const logoDir = path.join(process.cwd(), 'public', 'logo');
  const logos = [
    { file: 'Logo-AOPIA.png', filename: 'logo-aopia.png', cid: 'logo_aopia' },
    { file: 'Logo_Like_Formation.png', filename: 'logo-like.png', cid: 'logo_like' },
  ];
  return logos
    .map((logo) => ({ ...logo, path: path.join(logoDir, logo.file) }))
    .filter((logo) => fs.existsSync(logo.path))
    .map(({ filename, path: logoPath, cid }) => ({ filename, path: logoPath, cid }));
}

/** Formatted date for the email body and ISO day for PDF filenames. */
export function reportTimestamps(now = new Date()) {
  return {
    dateStr: now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    filenameTimestamp: now.toISOString().slice(0, 10),
  };
}
