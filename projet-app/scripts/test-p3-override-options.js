function normalizeParcoursLabel(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'oe')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Sample formations array as in frontend (label, id, slug)
const formations = [
  { id: 31, label: 'Word', slug: 'word' },
  { id: 33, label: 'Excel', slug: 'excel' },
  { id: 16, label: 'Google Workspace', slug: 'google-workspace' },
  { id: 24, label: 'Intelligence Artificielle Générative', slug: 'intelligence-artificielle-generative' }
];

// Test rules: one inkrea rule and one normal rule
const rules = [
  {
    id: 1,
    formation: 'Intelligence Artificielle Générative',
    certification: 'INKREA',
    formation1: null,
    formation2: null,
    isActive: true,
  },
  {
    id: 2,
    formation: 'Photoshop',
    certification: null,
    formation1: 'Photoshop Basique (TOSA)',
    formation2: 'Illustrator',
    isActive: true,
  }
];

function computeP3OverrideChoiceOptions(rules, formations) {
  const seen = new Set();
  const options = [];

  rules.forEach((rule) => {
    const isInkrea = (String(rule?.certification || '').toLowerCase() === 'inkrea') || (String(rule?.formation || '').toLowerCase().includes('intelligence artificielle')) || (String(rule?.formation || '').toLowerCase().includes('ia generative'));
    if (isInkrea) {
      const pairTargets = ['word', 'excel'];
      pairTargets.forEach((targetKey) => {
        const found = formations.find(f => (f.label || '').toLowerCase().includes(targetKey));
        if (found) {
          const combinedLabel = `${found.label} + ${rule.formation || 'IA GENERATIVE'}${rule.certification ? ` (${rule.certification})` : ''}`;
          const clean = normalizeParcoursLabel(combinedLabel);
          if (!seen.has(clean)) {
            seen.add(clean);
            options.push({ label: combinedLabel, rule });
          }
        }
      });
      return;
    }

    ['formation1', 'formation2'].forEach((field) => {
      const label = String(rule?.[field] || "").trim();
      const clean = normalizeParcoursLabel(label);
      if (!label || seen.has(clean)) return;
      seen.add(clean);
      options.push({ label, rule });
    });
  });

  return options;
}

console.log('Formations:', formations.map(f=>f.label).join(', '));
console.log('Rules:');
rules.forEach(r => console.log(`- id=${r.id}, formation=${r.formation}, certification=${r.certification}`));

const opts = computeP3OverrideChoiceOptions(rules, formations);
console.log('\nGenerated options:');
opts.forEach((o, idx) => console.log(`${idx+1}. ${o.label}  (rule id=${o.rule.id})`));

// Additional test: simulate selecting 'Word + IA' and mapping back to formation
const selected = opts.find(o => o.label.toLowerCase().includes('word +'));
if (selected) {
  console.log('\nSimulated selection mapping:');
  const cleanChosen = selected.label.replace(/\s*\([^)]+\)$/, '').trim();
  console.log('cleanChosen =', cleanChosen);
  // try to find matching formation by label
  const targetFormation = formations.find(f => {
    const fl = f.label.toLowerCase();
    const cl = cleanChosen.toLowerCase();
    return cl.startsWith(fl) || fl === cl.split(' ')[0];
  });
  console.log('Mapped formation found:', targetFormation ? targetFormation.label : 'none');
}
