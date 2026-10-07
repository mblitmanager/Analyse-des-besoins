import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Formation } from '../entities/formation.entity';
import { ParcoursRule } from '../entities/parcours-rule.entity';
import { P3OverrideRule } from '../entities/p3-override-rule.entity';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

export type P3Proposal = { label: string; parcoursTitle: string; requireTest: boolean };

export type ParcoursEntry = {
  condition: string;
  parcoursTitle: string;
  formation1: string;
  formation2: string;
  /** "Niveau trop avancé" alternative (hidden rule). */
  tooAdvanced: boolean;
  /** P3 choices after this P1 + P2: imposed by P3 Override rules, or the free list. */
  p3: { source: 'override' | 'generic' | 'libre'; proposals: P3Proposal[] };
};

export type FormationMap = {
  id: number;
  slug: string;
  label: string;
  category: string | null;
  levels: string[];
  parcours: ParcoursEntry[];
  /** P3 Override rules whose P1/P2 conditions match none of the formation's parcours. */
  unmatchedP3Rules: { conditionP1: string; conditionP2: string; proposals: P3Proposal[] }[];
};

const normalize = (value?: string | null) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Same comparison as the P3 screen (frontend utils/p3Override.js labelsMatch). */
function labelsMatch(actual: string, expected?: string | null): boolean {
  const a = normalize(actual);
  const e = normalize(expected);
  if (!e) return true;
  if (!a) return false;
  return a === e || a.includes(e) || e.includes(a);
}

const hasP1P2 = (rule: P3OverrideRule) =>
  !!(String(rule.conditionP1 || '').trim() || String(rule.conditionP2 || '').trim());

function proposalsOf(rules: P3OverrideRule[], formationsById: Map<number, Formation>): P3Proposal[] {
  const seen = new Set<string>();
  const proposals: P3Proposal[] = [];
  const add = (label: string, rule: P3OverrideRule) => {
    const key = normalize(label);
    if (!label || seen.has(key)) return;
    seen.add(key);
    proposals.push({ label, parcoursTitle: (rule.parcoursTitle || '').trim(), requireTest: !!rule.requireTest });
  };
  for (const rule of rules) {
    const tests = Array.isArray(rule.testFormations)
      ? rule.testFormations
      : Object.values((rule.testFormations as any) || {});
    if (tests.length) {
      const names = tests.map((id: any) => formationsById.get(Number(id))?.label).filter(Boolean);
      add(`${(rule.formation1 || rule.formation || '').trim()}${names.length ? ` (test : ${names.join(', ')})` : ''}`, rule);
    } else {
      add(String(rule.formation1 || '').trim(), rule);
      add(String(rule.formation2 || '').trim(), rule);
    }
  }
  return proposals;
}

/**
 * Map of the parcours configuration, per formation: the possible P1 + P2 parcours and,
 * for each, the P3 choices. Shown on the admin dashboard and exported (Excel, PDF).
 */
@Injectable()
export class ParcoursMapService {
  constructor(
    @InjectRepository(Formation) private readonly formationRepo: Repository<Formation>,
    @InjectRepository(ParcoursRule) private readonly parcoursRepo: Repository<ParcoursRule>,
    @InjectRepository(P3OverrideRule) private readonly overrideRepo: Repository<P3OverrideRule>,
  ) {}

  async build(): Promise<FormationMap[]> {
    const [formations, parcoursRules, overrideRules] = await Promise.all([
      this.formationRepo.find({ relations: ['levels'] }),
      this.parcoursRepo.find({ where: { isActive: true }, order: { order: 'ASC' } }),
      this.overrideRepo.find({ where: { isActive: true }, order: { order: 'ASC' } }),
    ]);
    const formationsById = new Map(formations.map((f) => [f.id, f]));
    const belongsTo = (rule: { formationId?: number | null; formation?: string }, f: Formation) =>
      rule.formationId ? Number(rule.formationId) === f.id : labelsMatch(f.label, rule.formation);

    return formations
      .filter((f) => f.isActive && !f.availableInP3Only)
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
      .map((f) => {
        const overrides = overrideRules.filter((r) => belongsTo(r, f));
        const withP1P2 = overrides.filter(hasP1P2);
        const generic = overrides.filter((r) => !hasP1P2(r));
        const usedRuleIds = new Set<number>();

        const parcours: ParcoursEntry[] = parcoursRules
          .filter((r) => belongsTo(r, f))
          .map((rule) => {
            const p1 = String(rule.formation1 || '').trim();
            const p2 = String(rule.formation2 || '').trim() || p1;
            const matched = withP1P2.filter(
              (o) => labelsMatch(p1, o.conditionP1) && labelsMatch(p2, o.conditionP2),
            );
            matched.forEach((o) => usedRuleIds.add(o.id));
            const p3 = matched.length
              ? { source: 'override' as const, proposals: proposalsOf(matched, formationsById) }
              : generic.length
                ? { source: 'generic' as const, proposals: proposalsOf(generic, formationsById) }
                : { source: 'libre' as const, proposals: [] };
            return {
              condition: rule.condition,
              parcoursTitle: (rule.parcoursTitle || '').trim(),
              formation1: rule.formation1 || '',
              formation2: rule.formation2 || '',
              tooAdvanced: !!rule.isHiddenResult,
              p3,
            };
          });

        const unmatched = new Map<string, P3OverrideRule[]>();
        for (const o of withP1P2.filter((r) => !usedRuleIds.has(r.id))) {
          const key = `${normalize(o.conditionP1)}|${normalize(o.conditionP2)}`;
          unmatched.set(key, [...(unmatched.get(key) || []), o]);
        }

        return {
          id: f.id,
          slug: f.slug,
          label: f.label.trim(),
          category: f.category || null,
          levels: [...(f.levels || [])]
            .filter((l) => l.isActive !== false)
            .sort((a, b) => a.order - b.order)
            .map((l) => l.label),
          parcours,
          unmatchedP3Rules: [...unmatched.values()].map((rules) => ({
            conditionP1: rules[0].conditionP1 || '',
            conditionP2: rules[0].conditionP2 || '',
            proposals: proposalsOf(rules, formationsById),
          })),
        };
      });
  }

  static p3Text(entry: ParcoursEntry): string {
    if (entry.p3.source === 'libre') return 'Liste libre (règles de filtrage P3)';
    const list = entry.p3.proposals.map((p) => p.label).join(' / ');
    return entry.p3.source === 'generic' ? `${list} (règle sans condition P1/P2)` : list;
  }

  async toExcel(): Promise<Buffer> {
    const map = await this.build();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Analyse des besoins';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Parcours P1-P2-P3', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
      { header: 'Formation', key: 'formation', width: 26 },
      { header: 'Condition (résultat du test)', key: 'condition', width: 34 },
      { header: 'Parcours P1 + P2', key: 'title', width: 42 },
      { header: 'P1', key: 'p1', width: 34 },
      { header: 'P2', key: 'p2', width: 34 },
      { header: 'Niveau trop avancé', key: 'tooAdvanced', width: 12 },
      { header: 'P3 possibles', key: 'p3', width: 60 },
      { header: 'Origine P3', key: 'p3Source', width: 16 },
    ];
    for (const f of map) {
      if (!f.parcours.length) {
        sheet.addRow({ formation: f.label, condition: '—', title: 'Aucun parcours configuré' });
        continue;
      }
      for (const p of f.parcours) {
        sheet.addRow({
          formation: f.label,
          condition: p.condition,
          title: p.parcoursTitle,
          p1: p.formation1,
          p2: p.formation2,
          tooAdvanced: p.tooAdvanced ? 'Oui' : '',
          p3: ParcoursMapService.p3Text(p),
          p3Source: { override: 'P3 Override', generic: 'Règle générique', libre: 'Liste libre' }[p.p3.source],
        });
      }
    }
    this.styleSheet(sheet);

    const orphans = workbook.addWorksheet('Règles P3 sans parcours', { views: [{ state: 'frozen', ySplit: 1 }] });
    orphans.columns = [
      { header: 'Formation', key: 'formation', width: 26 },
      { header: 'Condition P1', key: 'p1', width: 40 },
      { header: 'Condition P2', key: 'p2', width: 40 },
      { header: 'Propositions P3 (jamais appliquées)', key: 'p3', width: 60 },
    ];
    for (const f of map) {
      for (const o of f.unmatchedP3Rules) {
        orphans.addRow({ formation: f.label, p1: o.conditionP1, p2: o.conditionP2, p3: o.proposals.map((p) => p.label).join(' / ') });
      }
    }
    this.styleSheet(orphans);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private styleSheet(sheet: ExcelJS.Worksheet) {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1B3E' } };
    sheet.eachRow((row) => {
      row.alignment = { vertical: 'top', wrapText: true };
    });
    if (sheet.rowCount > 1) {
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
    }
  }

  async toPdf(): Promise<Buffer> {
    const map = await this.build();
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    const width = doc.page.width - 72;
    const cols = [
      { title: 'Condition', w: 0.17 },
      { title: 'Parcours P1 + P2', w: 0.22 },
      { title: 'P1', w: 0.17 },
      { title: 'P2', w: 0.17 },
      { title: 'P3 possibles', w: 0.27 },
    ].map((c) => ({ ...c, w: c.w * width }));

    const ensureSpace = (h: number) => {
      if (doc.y + h > doc.page.height - 40) doc.addPage();
    };
    // The standard PDF fonts (WinAnsi) have no ≤ / ≥ glyphs.
    const pdfText = (value: string) => String(value || '').replace(/≤/g, '<=').replace(/≥/g, '>=');
    const drawRow = (rawCells: string[], bold = false, fill?: string) => {
      const cells = rawCells.map(pdfText);
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      const heights = cells.map((text, i) => doc.heightOfString(text || '', { width: cols[i].w - 8 }));
      const h = Math.max(...heights) + 8;
      ensureSpace(h);
      const y = doc.y;
      if (fill) doc.rect(36, y, width, h).fill(fill);
      let x = 36;
      cells.forEach((text, i) => {
        doc.fillColor('#0D1B3E').text(text || '', x + 4, y + 4, { width: cols[i].w - 8 });
        x += cols[i].w;
      });
      doc.moveTo(36, y + h).lineTo(36 + width, y + h).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      doc.y = y + h;
    };

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0D1B3E').text('Cartographie des parcours P1 + P2 et P3');
    doc.font('Helvetica').fontSize(9).fillColor('#64748B')
      .text(`Configuration au ${new Date().toLocaleDateString('fr-FR')} — règles actives uniquement`);
    doc.moveDown();

    for (const f of map) {
      ensureSpace(60);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0D1B3E').text(f.label, 36, doc.y);
      doc.font('Helvetica').fontSize(8).fillColor('#64748B').text(`Niveaux : ${f.levels.join(' > ') || '—'}`);
      doc.moveDown(0.3);
      drawRow(cols.map((c) => c.title), true, '#F1F5F9');
      if (!f.parcours.length) drawRow(['—', 'Aucun parcours configuré', '', '', '']);
      for (const p of f.parcours) {
        drawRow([
          p.condition,
          `${p.parcoursTitle}${p.tooAdvanced ? ' (niveau trop avancé)' : ''}`,
          p.formation1,
          p.formation2,
          ParcoursMapService.p3Text(p),
        ]);
      }
      for (const o of f.unmatchedP3Rules) {
        drawRow([
          'Règle P3 sans parcours',
          `P1 : ${o.conditionP1} / P2 : ${o.conditionP2}`,
          '',
          '',
          `${o.proposals.map((p) => p.label).join(' / ')} (jamais appliquée)`,
        ], false, '#FEF2F2');
      }
      doc.moveDown();
    }
    doc.end();
    return done;
  }
}
