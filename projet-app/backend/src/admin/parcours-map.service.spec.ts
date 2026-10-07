import * as ExcelJS from 'exceljs';
import { ParcoursMapService } from './parcours-map.service';

const repo = (rows: any[]) => ({ find: jest.fn().mockResolvedValue(rows) });

const formations = [
  { id: 30, slug: 'sketchup', label: 'SketchUp', isActive: true, availableInP3Only: false, levels: [
    { label: 'Initial', order: 0, isActive: true }, { label: 'Basique', order: 1, isActive: true },
  ] },
  { id: 24, slug: 'ia', label: 'Intelligence Artificielle Générative', isActive: true, availableInP3Only: true, levels: [] },
  { id: 19, slug: 'illustrator', label: 'Illustrator', isActive: true, availableInP3Only: false, levels: [] },
];
const parcours = [
  { id: 1, formationId: 30, formation: 'SketchUp', condition: 'Si résultat du test ≤ Basique', parcoursTitle: 'Création visuels', formation1: 'SketchUp Opérationnel (ICDL)', formation2: 'Gimp Opérationnel (ICDL)', isHiddenResult: false },
];
const overrides = [
  { id: 245, formationId: 30, formation: 'SketchUp', conditionP1: 'SketchUp Opérationnel (ICDL)', conditionP2: 'Gimp Opérationnel (ICDL)', formation1: 'IA Générative (INKREA)', testFormations: [24], requireTest: true, parcoursTitle: 'P3 - IA' },
  { id: 246, formationId: 30, formation: 'SketchUp', conditionP1: 'SketchUp Opérationnel (ICDL)', conditionP2: 'Gimp Opérationnel (ICDL)', formation1: 'Illustrator Basique (TOSA)', testFormations: [19], requireTest: true, parcoursTitle: 'P3 - Illustrator' },
  { id: 247, formationId: 30, formation: 'SketchUp', conditionP1: 'SketchUp Basique (TOSA)', conditionP2: 'Gimp Basique', formation1: 'Word Basique (TOSA)', testFormations: [], parcoursTitle: 'P3 - orpheline' },
];

describe('ParcoursMapService', () => {
  const service = new ParcoursMapService(repo(formations) as any, repo(parcours) as any, repo(overrides) as any);

  it('lists P1 + P2 parcours with every matching P3 override choice', async () => {
    const map = await service.build();
    expect(map.map((f) => f.slug)).toEqual(['illustrator', 'sketchup']); // P3-only formations excluded
    const sketchup = map.find((f) => f.slug === 'sketchup')!;
    expect(sketchup.levels).toEqual(['Initial', 'Basique']);
    expect(sketchup.parcours[0].p3.source).toBe('override');
    expect(sketchup.parcours[0].p3.proposals.map((p) => p.label)).toEqual([
      'IA Générative (INKREA) (test : Intelligence Artificielle Générative)',
      'Illustrator Basique (TOSA) (test : Illustrator)',
    ]);
  });

  it('reports P3 override rules matching no parcours of the formation', async () => {
    const sketchup = (await service.build()).find((f) => f.slug === 'sketchup')!;
    expect(sketchup.unmatchedP3Rules).toEqual([
      expect.objectContaining({ conditionP1: 'SketchUp Basique (TOSA)', conditionP2: 'Gimp Basique' }),
    ]);
  });

  it('shows the free P3 list when no override applies', async () => {
    const illustrator = (await service.build()).find((f) => f.slug === 'illustrator')!;
    expect(illustrator.parcours).toEqual([]);
  });

  it('exports an Excel workbook with the parcours and the orphan rules', async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load((await service.toExcel()) as any);
    const sheet = workbook.getWorksheet('Parcours P1-P2-P3')!;
    expect(sheet.getRow(1).getCell(1).value).toBe('Formation');
    const values = sheet.getSheetValues().flat().map(String).join(' ');
    expect(values).toContain('Création visuels');
    expect(values).toContain('Illustrator Basique (TOSA)');
    expect(workbook.getWorksheet('Règles P3 sans parcours')!.rowCount).toBe(2);
  });

  it('exports a PDF (≤ / ≥ written <= / >= for the standard fonts)', async () => {
    const pdf = await service.toPdf();
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
