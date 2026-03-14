
const levels = [
    { label: 'Initial', successThreshold: 7 },
    { label: 'Basique', successThreshold: 5 },
    { label: 'Opérationnel', successThreshold: 4 }
];

const cleanLabel = (l) =>
    (l || '')
      .replace(/^(Niveau|à|au|à\s+la|à\s+l'|le|la|les)\s+/i, '')
      .trim()
      .toUpperCase();

function evaluate(operator, targetLabel, stopLevelLabel, stopScore) {
    const cleanTarget = cleanLabel(targetLabel);
    const targetIdx = levels.findIndex(l => cleanLabel(l.label) === cleanTarget);
    const stopIdx = levels.findIndex(l => cleanLabel(l.label) === cleanLabel(stopLevelLabel));

    if (targetIdx === -1) return false;

    const userLevel = (stopIdx === 0 && stopScore === 0) ? -1 : stopIdx;

    const result = (() => {
        switch (operator) {
            case '=': return userLevel === targetIdx;
            case '<': return userLevel < targetIdx;
            case '≤': return userLevel <= targetIdx;
            case '>': return userLevel > targetIdx;
            case '≥': return userLevel >= targetIdx;
            default: return false;
        }
    })();

    process.stdout.write(`Testing: [User stopped at ${stopLevelLabel} with ${stopScore}] ${operator} ${targetLabel} -> Result: ${result}\n`);
    return result;
}

evaluate('<', 'Initial', 'Initial', 0);
evaluate('=', 'Initial', 'Initial', 0);
evaluate('<', 'Initial', 'Initial', 2);
evaluate('=', 'Initial', 'Initial', 2);
evaluate('<', 'Initial', 'Basique', 0);
evaluate('=', 'Initial', 'Basique', 0);
evaluate('=', 'Basique', 'Basique', 0);
evaluate('≥', 'Initial', 'Basique', 0);
evaluate('<', 'à Initial', 'Initial', 0);
evaluate('=', 'au Basique', 'Basique', 2);
