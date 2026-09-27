import { getP3PreviousParcours } from './p3-previous-parcours';

describe('getP3PreviousParcours', () => {
  it('reads P1 and P2 from the P3 explanation "P1 + P2 -> P3"', () => {
    expect(
      getP3PreviousParcours(
        { explanationMessage: 'Illustrator Basique (TOSA) + Illustrator Opérationnel (ICDL) -> IA Générative (INKREA)' },
        [],
        ['IA Générative (INKREA)'],
      ),
    ).toEqual(['Illustrator Basique (TOSA)', 'Illustrator Opérationnel (ICDL)']);
  });

  it("falls back on the candidate's earlier sessions, oldest first, without the P3 itself", () => {
    expect(
      getP3PreviousParcours(
        { id: 'p3', explanationMessage: null },
        [
          { id: 'p3', finalRecommendation: 'Excel Basique (TOSA)', createdAt: '2026-03-02' },
          { id: 'p1', finalRecommendation: 'Word Basique (TOSA) & Word Opérationnel (ICDL)', createdAt: '2026-03-01' },
        ],
        ['Excel Basique (TOSA)'],
      ),
    ).toEqual(['Word Basique (TOSA)', 'Word Opérationnel (ICDL)']);
  });

  it('returns nothing when no previous parcours is known', () => {
    expect(getP3PreviousParcours({ explanationMessage: 'Parcours adapté' })).toEqual([]);
  });
});
