
// Mocking the logic from SessionsService.ts to verify it
const levels = [
    { label: 'Initial', successThreshold: 7 },
    { label: 'Basique', successThreshold: 5 },
    { label: 'Opérationnel', successThreshold: 4 }
];

const cleanLabel = (l: string) =>
    (l || '')
      .replace(/^(Niveau|à|au|à\s+la|à\s+l'|le|la|les)\s+/i, '')
      .trim()
      .toUpperCase();

function evaluate(operator: string, targetLabel: string, stopLevelLabel: string, stopScore: number) {
    const cleanTarget = cleanLabel(targetLabel);
    const targetIdx = levels.findIndex(l => cleanLabel(l.label) === cleanTarget);
    const stopIdx = levels.findIndex(l => cleanLabel(l.label) === cleanLabel(stopLevelLabel));

    if (targetIdx === -1) return false;

    const userLevel = (stopIdx === 0 && stopScore === 0) ? -1 : stopIdx;

    console.log(`Testing: [User stopped at ${stopLevelLabel} with ${stopScore}] ${operator} ${targetLabel} (TargetIdx: ${targetIdx}, StopIdx: ${stopIdx}, UserLevel: ${userLevel})`);

    switch (operator) {
        case '=': return userLevel === targetIdx;
        case '<': return userLevel < targetIdx;
        case '≤': return userLevel <= targetIdx;
        case '>': return userLevel > targetIdx;
        case '≥': return userLevel >= targetIdx;
        default: return false;
    }
}

console.log("--- CASE: Below Initial (0 at Initial) ---");
console.log("Result < Initial:", evaluate('<', 'Initial', 'Initial', 0)); // Expected: true
console.log("Result = Initial:", evaluate('=', 'Initial', 'Initial', 0)); // Expected: false

console.log("\n--- CASE: Initial Level (Low score at Initial) ---");
console.log("Result < Initial:", evaluate('<', 'Initial', 'Initial', 2)); // Expected: false
console.log("Result = Initial:", evaluate('=', 'Initial', 'Initial', 2)); // Expected: true

console.log("\n--- CASE: Basique Level (Passed Initial, failed Basique with 0) ---");
console.log("Result < Initial:", evaluate('<', 'Initial', 'Basique', 0)); // Expected: false
console.log("Result = Initial:", evaluate('=', 'Initial', 'Basique', 0)); // Expected: false
console.log("Result = Basique:", evaluate('=', 'Basique', 'Basique', 0)); // Expected: true
console.log("Result >= Initial:", evaluate('≥', 'Initial', 'Basique', 0)); // Expected: true

console.log("\n--- CASE: French Prefixes ---");
console.log("Result < à Initial:", evaluate('<', 'à Initial', 'Initial', 0)); // Expected: true
console.log("Result = au Basique:", evaluate('=', 'au Basique', 'Basique', 2)); // Expected: true
