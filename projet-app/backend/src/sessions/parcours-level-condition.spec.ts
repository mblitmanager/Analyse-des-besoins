import {
  findConditionLevelIndex,
  matchesLevelCondition,
  testResultIndex,
} from './parcours-level-condition';

const word = ['Initial', 'Basique', 'Opérationnel', 'Avance', 'Expert'].map((label) => ({ label }));
const toeic = ['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => ({ label: `Niveau ${l} - TOEIC` }));

describe('testResultIndex', () => {
  it('is the last validated level', () => {
    expect(
      testResultIndex(word, {
        Initial: { validated: true },
        Basique: { validated: true },
        'Opérationnel': { validated: false },
      }),
    ).toBe(1);
  });

  it('is the first level when none is validated', () => {
    expect(testResultIndex(word, { Initial: { validated: false } })).toBe(0);
    expect(testResultIndex(word, null)).toBe(0);
  });
});

describe('findConditionLevelIndex', () => {
  it('matches full labels and short forms on both sides', () => {
    expect(findConditionLevelIndex(toeic, 'Niveau B2 - TOEIC')).toBe(3);
    expect(findConditionLevelIndex(toeic, 'Niveau B2')).toBe(3);
    expect(findConditionLevelIndex(word, 'Opérationnel')).toBe(2);
    expect(findConditionLevelIndex(word, 'Niveau Inconnu')).toBe(-1);
  });
});

describe('matchesLevelCondition', () => {
  it('evaluates each operator against the result level', () => {
    expect(matchesLevelCondition('Si résultat du test = Basique', word, 1)).toBe(true);
    expect(matchesLevelCondition('Si résultat du test = Basique', word, 2)).toBe(false);
    expect(matchesLevelCondition('Si résultat du test <= Initial', word, 0)).toBe(true);
    expect(matchesLevelCondition('Si résultat du test ≤ Initial', word, 1)).toBe(false);
    expect(matchesLevelCondition('Si résultat du test < Basique', word, 0)).toBe(true);
    expect(matchesLevelCondition('Si résultat du test > Basique', word, 2)).toBe(true);
    expect(matchesLevelCondition('Si résultat du test ≥ Opérationnel', word, 4)).toBe(true);
  });

  it('matches TOEIC rules written with the formation suffix (B2/C1 candidates)', () => {
    expect(matchesLevelCondition('Si résultat du test ≥ Niveau B2 - TOEIC', toeic, 3)).toBe(true);
    expect(matchesLevelCondition('Si résultat du test ≥ Niveau B2 - TOEIC', toeic, 4)).toBe(true);
    expect(matchesLevelCondition('Si résultat du test ≥ Niveau B2 - TOEIC', toeic, 2)).toBe(false);
    expect(matchesLevelCondition('Si résultat du test ≤ Niveau A2', toeic, 0)).toBe(true);
  });

  it('is false for an unknown level and null without operator', () => {
    expect(matchesLevelCondition('Si résultat du test = Niveau Z9', word, 0)).toBe(false);
    expect(matchesLevelCondition('Basique', word, 1)).toBeNull();
  });
});
