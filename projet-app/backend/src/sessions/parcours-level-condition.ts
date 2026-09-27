/**
 * Evaluation of parcours rule conditions such as "Si résultat du test ≤ Niveau A2",
 * shared semantics with the results screen (PositionnementView):
 * - the test result is the last validated level, or the first level if none is;
 * - "Niveau B2 - TOEIC" and "Niveau B2" designate the same level.
 */

type LevelLike = { label: string };

const cleanLabel = (label: string) =>
  (label || '')
    .replace(/^(Niveau|à|au|à\s+la|à\s+l'|le|la|les)\s+/i, '')
    .trim()
    .toUpperCase();

const levelPart = (label: string) => cleanLabel(label).split(/\s*-\s*/)[0].trim();

export function findConditionLevelIndex(levels: LevelLike[], label: string): number {
  return levels.findIndex(
    (l) => cleanLabel(l.label) === cleanLabel(label) || levelPart(l.label) === levelPart(label),
  );
}

/** Index (in `levels` order) of the level the candidate reached. */
export function testResultIndex(
  levels: LevelLike[],
  levelsScores: Record<string, { validated?: boolean }> | null | undefined,
): number {
  let lastValidated = -1;
  levels.forEach((level, idx) => {
    if (levelsScores?.[level.label]?.validated) lastValidated = idx;
  });
  return Math.max(lastValidated, 0);
}

/**
 * true/false for a condition with an operator; null when the condition has no
 * operator (legacy rules, matched by label by the caller).
 */
export function matchesLevelCondition(
  condition: string,
  levels: LevelLike[],
  resultIdx: number,
): boolean | null {
  const match = (condition || '').match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (!match) return null;
  const targetIdx = findConditionLevelIndex(levels, match[2]);
  if (targetIdx === -1) return false;
  switch (match[1].replace('<=', '≤').replace('>=', '≥')) {
    case '=':
      return resultIdx === targetIdx;
    case '<':
      return resultIdx < targetIdx;
    case '≤':
      return resultIdx <= targetIdx;
    case '>':
      return resultIdx > targetIdx;
    case '≥':
      return resultIdx >= targetIdx;
    default:
      return false;
  }
}
