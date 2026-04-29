<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import WorkflowProgressBar from '../components/WorkflowProgressBar.vue';

// Ref attaché à la bannière inline
const inlineBannerRef = ref(null);
// Sticky visible quand la bannière inline est hors du viewport
const showStickyBar = ref(false);
let observer = null;

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const selectedFormation = ref(null);
const selectedSuite = ref(localStorage.getItem('selected_suite') || '');
const showP3SameFormationModal = ref(false);
const p3SameFormationLabel = ref("");
const p3NextLevelLabel = ref("");
const p3IsMaxLevel = ref(false);
const p3IsSingleLevel = ref(false);
const p3IsUnselectedChoice = ref(false);
const p3UnselectedChoicesList = ref([]);
const p3SelectedRemainingChoice = ref('');

const formations = ref([]);
const currentSession = ref(null);
const p3Rules = ref([]);
const allParcoursRules = ref([]);

// P3 context from localStorage
const p3PrevFormation = computed(() => localStorage.getItem('p3_prev_formation') || '');
const p3PrevRecommendations = computed(() => {
  let raw = localStorage.getItem('p3_prev_recommendations') || '';
  if (!raw && currentSession.value?.finalRecommendation) {
    raw = currentSession.value.finalRecommendation;
  }
  if (!raw) return [];
  return raw.split(/\s*&\s*|\s*\/\s*|\s*\|\s*/).map(r => r.trim()).filter(Boolean);
});

async function fetchFormations() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);

    formations.value = res.data;
    
    // Once formations are loaded, compute level order if in P3 mode
    computeAndStorePrevLevelOrder();
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  } finally {
    loading.value = false;
  }
}

/**
 * Computes and stores p3_prev_level_order from loaded formations data.
 * Called after formations are fetched so we have the levels with their order numbers.
 * This allows computeNextLevel() to use numeric order matching (reliable)
 * instead of fragile text matching.
 */
function computeAndStorePrevLevelOrder() {
  if (!store.isP3Mode) return;
  // Only compute if not already set
  if (localStorage.getItem('p3_prev_level_order') && Number(localStorage.getItem('p3_prev_level_order')) > 0) return;
  
  const prevFormationLabel = localStorage.getItem('p3_prev_formation') || '';
  const prevStopLevel = localStorage.getItem('p3_prev_stop_level') || '';
  if (!prevFormationLabel || !prevStopLevel) return;
  
  const prevFormation = formations.value.find(f => f.label === prevFormationLabel);
  if (!prevFormation?.levels?.length) return;
  
  const clean = (s) => (s || '').toLowerCase().replace(/^niveau\s+/i, '').trim();
  const prevClean = clean(prevStopLevel);
  const matchedLevel = prevFormation.levels.find(l => clean(l.label) === prevClean);
  if (matchedLevel?.order) {
    localStorage.setItem('p3_prev_level_order', String(matchedLevel.order));
    console.log(`[P3] Level order resolved: ${prevStopLevel} → order ${matchedLevel.order}`);
  }
}

async function fetchP3Rules() {
  if (!store.isP3Mode) return;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const [p3Res, parcoursRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/p3-filter-rules?activeOnly=true`),
      axios.get(`${apiBaseUrl}/parcours`)
    ]);
    p3Rules.value = p3Res.data;
    allParcoursRules.value = parcoursRes.data || [];
  } catch (err) {
    console.error("Failed to fetch P3/Parcours rules:", err);
  }
}

onMounted(() => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  
  // Fresh P1 session: clear any leftover P3 state from previous journeys
  if (store.parcoursNumber === 1) {
    const p3Keys = ['p3_prev_formation', 'p3_prev_recommendations', 'p3_prev_stop_level', 'p3_prev_level_order', 'p3_unselected_choices'];
    p3Keys.forEach(k => localStorage.removeItem(k));
  }
  
  // Fetch session data first for P3 filtering
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  axios.get(`${apiBaseUrl}/sessions/${sessionId}`).then(res => {
    currentSession.value = res.data;
  }).catch(err => console.error("Failed to fetch session for P3 filtering", err));

  fetchFormations();
  fetchP3Rules();

  // IntersectionObserver : affiche la sticky quand la bannière inline sort du viewport
  observer = new IntersectionObserver(
    ([entry]) => {
      // Visible dans le viewport = pas sticky, sinon sticky
      showStickyBar.value = !entry.isIntersecting;
    },
    { threshold: 0.1 }
  );
  // On démarre l'observation après que la bannière soit montée
  setTimeout(() => {
    if (inlineBannerRef.value) observer.observe(inlineBannerRef.value);
  }, 300);
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

async function selectFormation() {
  if (!selectedFormation.value) return;
  // For bureautique formations require a suite choice
  if ((selectedFormation.value.category || '').toLowerCase() === 'bureautique' && !selectedSuite.value) {
    alert('Veuillez choisir : Google Workspace ou Microsoft Office');
    return;
  }

  // P3: if user chose the SAME formation as P2, skip quiz entirely
  if (store.isP3Mode) {
    const prevFormation = localStorage.getItem('p3_prev_formation') || '';
    if (prevFormation && selectedFormation.value.label === prevFormation) {
      p3SameFormationLabel.value = selectedFormation.value.label;
      const { label: nextLabel, isMaxLevel, isSingleLevel, isUnselectedChoice, unselectedChoices } = computeNextLevel();
      p3NextLevelLabel.value = nextLabel;
      p3IsMaxLevel.value = isMaxLevel;
      p3IsSingleLevel.value = isSingleLevel || false;
      p3IsUnselectedChoice.value = isUnselectedChoice || false;
      p3UnselectedChoicesList.value = unselectedChoices || [];
      if (p3UnselectedChoicesList.value.length > 0) {
        p3SelectedRemainingChoice.value = p3UnselectedChoicesList.value[0];
      }
      showP3SameFormationModal.value = true;
      return;
    }
  }

  await doSelectFormation();
}

async function doSelectFormation() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const payload = {
      formationChoisie: selectedFormation.value.label,
      isP3Mode: store.isP3Mode,
    };
    if ((selectedFormation.value.category || '').toLowerCase() === 'bureautique') {
      payload.bureautiqueSuite = selectedSuite.value;
    }

    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);
    localStorage.setItem(
      "selected_formation_slug",
      selectedFormation.value.slug,
    );
    if (store.isP3Mode && currentSession.value) {
      localStorage.setItem('p3_prev_formation', currentSession.value.formationChoisie || "");
      localStorage.setItem('p3_prev_level_order', String(currentSession.value.stopLevelOrder || 0));
    }
    localStorage.setItem(
      "selected_formation_label",
      selectedFormation.value.label,
    );
    if (selectedSuite.value) localStorage.setItem('selected_suite', selectedSuite.value);
    
    // Update the real workflow path based on the selected formation
    await store.updateActualWorkflow();
    
    const nextRoute = await store.getNextRouteWithQuestions("/formations");
    router.push(nextRoute || "/positionnement");
  } catch (error) {
    console.error("Failed to select formation:", error);
    alert("Erreur lors de la sélection de la formation.");
  } finally {
    submitting.value = false;
  }
}

function computeNextLevel() {
  const formation = selectedFormation.value;
  if (!formation) {
    return { label: 'Niveau suivant', nextLevelLabel: 'Niveau suivant', isMaxLevel: true, isSingleLevel: true, isUnselectedChoice: false };
  }

  // CHECK FOR UNSELECTED CHOICES IF SAME FORMATION
  const prevFormationStr = localStorage.getItem('p3_prev_formation') || '';
  if (prevFormationStr && formation.label === prevFormationStr) {
    try {
      const unselectedStr = localStorage.getItem('p3_unselected_choices');
      if (unselectedStr) {
        const unselected = JSON.parse(unselectedStr);
        if (unselected && unselected.length > 0) {
          // FILTER: Remove choices that are already in the P1/P2 history
          const prevRecs = localStorage.getItem('p3_prev_recommendations') || '';
          const recs = prevRecs.split(/\s*&\s*|\s*\/\s*|\s*\|\s*/).map(r => r.trim()).filter(Boolean);
          const cleanU = (s) => (s || '').toLowerCase().replace(/^(niveau|tosa|icdl|digcomp|anglais|français|francais)\s+/i, '').trim();
          
          const filtered = unselected.filter(u => {
              const uClean = cleanU(u);
              return !recs.some(r => {
                  const rClean = cleanU(r);
                  const rWords = rClean.split(/[\s\-\']+/).filter(w => w.length > 1);
                  const vWords = uClean.split(/[\s\-\']+/).filter(w => w.length > 1);
                  return vWords.some(vw => rWords.includes(vw));
              });
          });

          if (filtered.length > 0) {
            const joinedLabel = filtered.join(' OU ');
            return {
              label: joinedLabel,
              nextLevelLabel: joinedLabel,
              isMaxLevel: false,
              isSingleLevel: false,
              isUnselectedChoice: true,
              unselectedChoices: filtered
            };
          }
        }
      }
    } catch(e) {}
  }

  // Formation has no levels configured: treat as single-level (no progression possible)
  if (!formation.levels || formation.levels.length === 0) {
    return { label: formation.label, nextLevelLabel: formation.label, isMaxLevel: true, isSingleLevel: true, isUnselectedChoice: false };
  }

  // Formation has exactly one level: already at max by definition
  if (formation.levels.length === 1) {
    const onlyLevel = formation.levels[0];
    return {
      label: `${formation.label} - ${onlyLevel.label}`,
      nextLevelLabel: onlyLevel.label,
      isMaxLevel: true,
      isSingleLevel: true,
      isUnselectedChoice: false
    };
  }

  const sortedLevels = [...formation.levels].sort((a, b) => (a.order || 0) - (b.order || 0));

  const clean = (s) => (s || '').toLowerCase().replace(/^(niveau|tosa|icdl|digcomp|anglais|français|francais)\s+/i, '').trim();
  
  // Helper to extract level codes like A1, B2, C1 etc for languages
  const extractLevelCode = (s) => {
      const match = (s || '').toUpperCase().match(/\b([A-C][1-2])\b/);
      if (match) return match[1];
      
      // Keyword fallback for descriptive language labels
      const lower = (s || '').toLowerCase();
      if (lower.includes('revoir les bases')) return 'A1';
      if (lower.includes('consolider les bases')) return 'A2';
      if (lower.includes('autonomie')) return 'B1';
      if (lower.includes('renforcer')) return 'B2';
      if (lower.includes('perfectionner')) return 'C1';
      if (lower.includes('découverte')) return 'Découverte';
      if (lower.includes('technique')) return 'Technique';
      if (lower.includes('professionnel')) return 'Professionnel';
      if (lower.includes('affaires')) return 'Affaires';
      
      // Bureautique (TOSA) keywords
      if (lower.includes('initial')) return 'Initial';
      if (lower.includes('basique')) return 'Basique';
      if (lower.includes('opérationnel') || lower.includes('operationnel')) return 'Opérationnel';
      if (lower.includes('avancé') || lower.includes('avance')) return 'Avancé';
      if (lower.includes('expert')) return 'Expert';

      return null;
  };

  let prevIdx = -1;
  let prevRecs = localStorage.getItem('p3_prev_recommendations') || '';
  const prevStopLevel = localStorage.getItem('p3_prev_stop_level') || '';
  const prevLevelOrder = Number(localStorage.getItem('p3_prev_level_order') || 0);

  // Priority 1: match by numeric order (most reliable — stored by startP3)
  if (prevLevelOrder > 0) {
    prevIdx = sortedLevels.findIndex(l => (l.order || 0) === prevLevelOrder);
  }

  // Priority 2: match by stop level text across ALL previous propositions
  if (prevIdx === -1) {
    // Search in all previous recommendations to find the highest level reached for THIS formation
    const allHistory = (prevRecs + ' & ' + prevStopLevel);
    const historyCode = extractLevelCode(allHistory);
    if (prevRecs) {
      const recs = prevRecs.split('&').map(r => r.trim());
      const formClean = clean(formation.label);
      
      let highestFoundIdx = -1;
      for (const rec of recs) {
        const recClean = clean(rec);
        // Ensure this recommendation is related to the selected formation
        if (recClean.includes(formClean) || formClean.includes(recClean.replace(/tosa|icdl/gi, '').trim())) {
          const foundIdx = sortedLevels.findIndex(l => {
            const lvlClean = clean(l.label);
            return recClean === lvlClean || recClean.includes(lvlClean) || lvlClean.includes(recClean);
          });
          if (foundIdx > highestFoundIdx) {
            highestFoundIdx = foundIdx;
          }
        }
      }
      if (highestFoundIdx !== -1) {
        prevIdx = highestFoundIdx;
      }
    }

    // Fallback to stop level if not found in recommendations array
    if (prevIdx === -1) {
      const prevStopLevel = localStorage.getItem('p3_prev_stop_level') || '';
      const prevRecs = localStorage.getItem('p3_prev_recommendations') || '';
      
      const findInText = (text) => {
        if (!text) return -1;
        const tClean = clean(text);
        return sortedLevels.findIndex(l => {
          const lClean = clean(l.label);
          // Check if level label is in text or vice versa
          return tClean === lClean || tClean.includes(lClean) || lClean.includes(tClean);
        });
      };

      prevIdx = findInText(prevStopLevel);
      if (prevIdx === -1) {
          // Try each part of the recommendation
          const parts = prevRecommendationsStr.split(/\s*&\s*|\s*\|\s*/);
          for (const part of parts) {
              const idx = findInText(part);
              if (idx > prevIdx) prevIdx = idx; // take the highest found
          }
      }
      
      // Language specific code matching (A1, B2 etc)
      if (prevIdx === -1 && historyCode) {
          prevIdx = sortedLevels.findIndex(l => {
              const lCode = extractLevelCode(l.label);
              return lCode && lCode === historyCode;
          });
      }
    }
  }

  // Safety fallback: assume first level (prevIdx = -1 means we are before the first level)
  if (prevIdx === -1) {
    prevIdx = -1; 
  }

  // LOGIC TO SKIP ALREADY TAKEN LEVELS
  // We look forward to find the first level that is NOT in the previous recommendations
  let nextIdx = prevIdx + 1;
  
  const recs = prevRecs.split(/\s*&\s*|\s*\/\s*|\s*\|\s*/).map(r => r.trim()).filter(Boolean);

  while (nextIdx < sortedLevels.length) {
    const nextLvl = sortedLevels[nextIdx];
    const nClean = clean(nextLvl.label);
    const nCode = extractLevelCode(nextLvl.label);
    
    // Check if this level label or code is already in any of the historical recommendations
    const alreadyProposed = recs.some(rec => {
      const rClean = clean(rec);
      const nClean = clean(nextLvl.label);
      const rCode = extractLevelCode(rec);
      
      // 1. Match by code (A1, B2, etc)
      if (nCode && rCode === nCode) return true;
      
      // 2. Match by whole words (highly reliable for TOSA/Language levels)
      // e.g. "excel basique" contains "basique"
      const rWords = rClean.split(/[\s\-\']+/).filter(w => w.length > 2);
      const nWords = nClean.split(/[\s\-\']+/).filter(w => w.length > 2);
      
      const wordMatch = nWords.some(nw => rWords.includes(nw));
      if (wordMatch) return true;

      // 3. Match by text (lenient) - strip common suffixes like " - TOEIC" for comparison
      const rText = rClean.split(/\s*-\s*/)[0].trim();
      const nText = nClean.split(/\s*-\s*/)[0].trim();
      return rText.includes(nText) || nText.includes(rText);
    });
    
    if (!alreadyProposed) break;
    nextIdx++;
  }
  
  // If we skipped levels, update prevIdx to be the one just before the new nextIdx
  prevIdx = nextIdx - 1;

  const isMaxLevel = nextIdx >= sortedLevels.length;
  const targetIdx = Math.min(nextIdx, sortedLevels.length - 1);
  const nextLevel = sortedLevels[targetIdx];

  // Try to match the style of previous recommendations (e.g. "Anglais Consolider les bases - TOEIC")
  let displayLabel = `${formation.label} - ${nextLevel.label}`;
  
  // ── RULE-BASED LABELING (Priority) ──
  // Search for a direction rule (ParcoursRule) that matches this level
  const cleanL = (s) => (s || '').toLowerCase().replace(/^(si résultat du test\s*=\s*|niveau\s+)/i, '').trim();
  const targetClean = cleanL(nextLevel.label);
  
  const matchedRule = allParcoursRules.value.find(r => {
    // Match by formation ID or EXACT label
    const isTargetForm = (r.formationId && Number(r.formationId) === Number(formation.id)) || 
                         (r.formation && r.formation.trim().toLowerCase() === formation.label.trim().toLowerCase());
    if (!isTargetForm) return false;

    const condClean = cleanL(r.condition);
    // Flexible matching: condition includes level label OR level label includes condition
    return condClean.includes(targetClean) || targetClean.includes(condClean);
  });

  if (matchedRule) {
    // If formation1 is already in history, try formation2 as fallback
    const f1Already = recs.some(rec => {
        const rClean = clean(rec);
        const f1Clean = clean(matchedRule.formation1);
        return rClean.includes(f1Clean) || f1Clean.includes(rClean);
    });

    if (f1Already && matchedRule.formation2) {
        displayLabel = matchedRule.formation2;
    } else {
        displayLabel = matchedRule.formation1;
    }
  } else {
    // ── FALLBACK DYNAMIC LABELING ──
    // 1. Look for prefixes like "Anglais" or "TOSA Excel"
    const escapedForm = formation.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixMatch = prevRecs.match(new RegExp(`(TOSA\\s+)?${escapedForm}`, 'i'));
    
    // 2. Look for suffixes like "- TOEIC" or "- VOLTAIRE"
    const suffixMatch = prevRecs.match(/\s*-\s*(TOEIC|VOLTAIRE|TOSA|ICDL|BUREAUTIQUE)\b/i);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    
    if (prefixMatch) {
      const hasDashInHistory = prevRecs.includes(' - ');
      const sep = hasDashInHistory ? ' - ' : ' ';
      displayLabel = `${prefixMatch[0]}${sep}${nextLevel.label}${suffix}`;
    } else {
      displayLabel = `${formation.label} - ${nextLevel.label}${suffix}`;
    }
  }

  return {
    label: displayLabel,
    nextLevelLabel: nextLevel.label,
    nextLevelOrder: nextLevel.order,
    isMaxLevel,
    isSingleLevel: false,
    isUnselectedChoice: false
  };
}

async function confirmP3SameFormation() {
  showP3SameFormationModal.value = false;
  submitting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const { label: recommendation, nextLevelLabel, nextLevelOrder } = computeNextLevel();
    
    let finalRec = recommendation;
    let finalStopLevel = nextLevelLabel;
    let finalStopLevelOrder = nextLevelOrder;
    
    if (p3IsUnselectedChoice.value && p3SelectedRemainingChoice.value) {
      finalRec = p3SelectedRemainingChoice.value;
      finalStopLevel = p3SelectedRemainingChoice.value;
      // Use the order from the selected choice if available, otherwise fallback to history
      const choiceObj = p3UnselectedChoicesListWithOrder.value.find(c => c.label === finalRec);
      finalStopLevelOrder = choiceObj ? choiceObj.order : Number(localStorage.getItem('p3_prev_level_order') || 0);
    }
    
    // Save the formation choice with p3SkipQuiz flag and pre-set recommendation
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      formationChoisie: selectedFormation.value.label,
      isP3Mode: true,
      p3SkipQuiz: true,
      finalRecommendation: finalRec,
      stopLevel: finalStopLevel,
      stopLevelOrder: finalStopLevelOrder,
    });
    // Submit (finalize) the session - backend will use pre-set values
    await fetch(`${apiBaseUrl}/sessions/${sessionId}/submit`, { method: 'POST' });
    // Go to home
    store.setP3Mode(false);
    router.push('/');
  } catch (error) {
    console.error('Failed to confirm P3 same formation:', error);
    alert('Erreur lors de la validation du P3.');
  } finally {
    submitting.value = false;
  }
}

// Grouping rules and preferred order
const categoryGroupsOrder = [
  'bureautique',
  'anglais-francais',
  'illustration',
  'ia-generative',
  'digcomp-google-wordpress',
  'autres',
];

function detectGroupForFormation(f) {
  const cat = (f.category || '').toLowerCase();
  const lab = (f.label || '').toLowerCase();
  
  if (cat.includes('langue')) return 'anglais-francais';
  if (cat.includes('bureautique')) return 'bureautique';
  if (cat.includes('ia') || cat.includes('intelligence') || lab.includes(' ia ')) return 'ia-generative';
  if (cat.includes('création') || cat.includes('creation') || cat.includes('design')) return 'illustration';
  if (cat.includes('digital') || cat.includes('internet') || cat.includes('compétence') || lab.includes('wordpress')) return 'digcomp-google-wordpress';
  return 'autres';
}

const groupedFormations = computed(() => {
  const map = new Map();
  (formations.value || []).forEach((f) => {
    const group = detectGroupForFormation(f);
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(f);
  });
  const groups = Array.from(map.entries()).map(([group, items]) => ({
    category: group,
    items: items.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
  }));
  groups.sort((a, b) => {
    const ai = categoryGroupsOrder.indexOf(a.category);
    const bi = categoryGroupsOrder.indexOf(b.category);
    if (ai === -1 && bi === -1) return a.category.localeCompare(b.category);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return groups;
});

// Section styles configuration with accent colors
const sectionStyles = {
  bureautique: { color: '#a4c2f4', bg: '#a4c2f415', accent: '#3b82f6', accentBg: '#eff6ff' },
  langues :{
  color: '#FFA500',       // texte orange
  bg: '#FFA50015',        // fond très clair orange (15% opacity)
  accent: '#FF7F50',      // accent plus vif (corail/orange)
  accentBg: '#FFF5E5',    // fond accent clair
},
  creation: { color: '#d9ebd3', bg: '#d9ebd315', accent: '#16a34a', accentBg: '#f0fdf4' },
  internet: { color: '#ebd1dc', bg: '#ebd1dc15', accent: '#9333ea', accentBg: '#faf5ff' }
};

// Helper to get accent color for a given formation
function getSectionAccent(form) {
  if (!form) return { accent: '#3b82f6', accentBg: '#eff6ff' };
  for (const sec of sections.value) {
    if (sec.subSections) {
      for (const sub of sec.subSections) {
        if (sub.items.some(i => i.id === form.id)) return sec.style;
      }
    } else if (sec.items?.some(i => i.id === form.id)) {
      return sec.style;
    }
  }
  return { accent: '#3b82f6', accentBg: '#eff6ff' };
}

const selectedAccent = computed(() => getSectionAccent(selectedFormation.value));

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalSlug(value) {
  const v = normalizeKey(value);
  const aliases = {
    "microsoft-word": "word",
    "microsoft-excel": "excel",
    "microsoft-powerpoint": "powerpoint",
    "microsoft-outlook": "outlook",
    "google-workspace": "google-docs-sheets-slides",
    "google-docs": "google-docs-sheets-slides",
    "google-sheets": "google-docs-sheets-slides",
    "google-slides": "google-docs-sheets-slides",
    "digcomp-google-wordpress": "digcomp",
  };
  return aliases[v] || v;
}

// Build explicit sections per requested layout
const sections = computed(() => {
  const map = new Map(groupedFormations.value.map((g) => [g.category, g.items]));

  // P3 Filtering Logic based on API rules
  const isP3 = store.isP3Mode;
  const lastFormationSlug = localStorage.getItem('p3_prev_formation_slug') || ""; // Assuming we have the slug, or we can use label
  const lastFormationLabel = currentSession.value?.formationChoisie || "";
  const lastLevel = (currentSession.value?.stopLevel || "").toLowerCase();
  const lastLevelOrder =
    currentSession.value?.stopLevelOrder ||
    Number(localStorage.getItem('p3_prev_level_order') || 0);

  // Dynamic level order getter
  const getLevelOrder = (formationLabel, levelLabel) => {
    const f = formations.value.find(form => form.label === formationLabel);
    if (!f || !f.levels) {
      const lvl = levelLabel.toLowerCase();
      if (lvl.includes('initial')) return 1;
      if (lvl.includes('basique')) return 2;
      if (lvl.includes('opérationnel') || lvl.includes('operationnel')) return 3;
      if (lvl.includes('avancé') || lvl.includes('avance')) return 4;
      if (lvl.includes('expert')) return 5;
      return 0;
    }
    const clean = (s) => s.toLowerCase().replace(/^niveau\s+/i, '').trim();
    const target = clean(levelLabel);
    const l = f.levels.find(lvl => clean(lvl.label) === target);
    return l ? (l.order || 0) : 0;
  };

  const currentLevelOrder = lastLevelOrder || getLevelOrder(lastFormationLabel, lastLevel);
  const prevCategory = normalizeKey(
    formations.value.find(f => f.label === lastFormationLabel)?.category || ''
  );
  const prevSlug = canonicalSlug(lastFormationSlug);

  // Determine applicable rules based on priority (lowest order first)
  const sortedRules = [...p3Rules.value].sort((a, b) => a.order - b.order);
  
  const rulesToApply = sortedRules.filter(rule => {
    // Check level condition
    if (rule.maxLevelOrder != null && currentLevelOrder > rule.maxLevelOrder) {
       return false;
    }
    // Check source category match
    const ruleSourceCategory = normalizeKey(rule.sourceCategory);
    const categoryMatches = ruleSourceCategory && prevCategory.includes(ruleSourceCategory);
    
    // Check source slug/label match
    const slugMatches = rule.sourceSlugs?.length > 0 && rule.sourceSlugs.some(s => {
      const ruleSlug = canonicalSlug(s);
      const labelKey = canonicalSlug(lastFormationLabel);
      return prevSlug === ruleSlug || labelKey.includes(ruleSlug);
    });
    
    return categoryMatches || slugMatches;
  });

  // Allowed / Excluded sets
  let allowMap = { formations: new Set(), categories: new Set() };
  let excludeMap = { formations: new Set(), categories: new Set() };
  let hasAllowRule = false;

  if (isP3 && rulesToApply.length > 0) {
    rulesToApply.forEach(r => {
      if (r.filterMode === 'ALLOW_ONLY') {
        hasAllowRule = true;
        r.targetSlugs?.forEach(s => allowMap.formations.add(canonicalSlug(s)));
        r.targetCategories?.forEach(c => allowMap.categories.add(normalizeKey(c)));
      } else if (r.filterMode === 'EXCLUDE') {
        r.targetSlugs?.forEach(s => excludeMap.formations.add(canonicalSlug(s)));
        r.targetCategories?.forEach(c => excludeMap.categories.add(normalizeKey(c)));
      }
    });
  }

  // Filter helper
  const filterGroup = (items) => {
    let filtered = items;

    if (!isP3 || rulesToApply.length === 0) return filtered;
    
    return filtered.filter(f => {
      const slug = canonicalSlug(f.slug);
      const label = canonicalSlug(f.label);
      const cat = normalizeKey(f.category);

      // Check Exclude first
      const isExcluded = 
        [...excludeMap.formations].some(ex => slug === ex || label.includes(ex)) ||
        [...excludeMap.categories].some(ex => cat.includes(ex));
        
      if (isExcluded) return false;

      // Check Allow Only
      if (hasAllowRule) {
        const isAllowed = 
          [...allowMap.formations].some(al => slug === al || label.includes(al)) ||
          [...allowMap.categories].some(al => cat.includes(al));
        return isAllowed;
      }

      return true; // If no allow rule, keep it (assuming not excluded)
    });
  };

  const bureauItems = filterGroup(map.get('bureautique') || []);
  const microsoft = bureauItems.filter(f => {
    const l = f.label.toLowerCase();
    return l.includes('microsoft') || l.includes('office') || l.includes('word') || l.includes('excel') || l.includes('ppt') || l.includes('powerpoint') || l.includes('outlook');
  });
  const google = bureauItems.filter(f => f.label.toLowerCase().includes('google'));

  const langs = filterGroup(map.get('anglais-francais') || []);
  const creation = filterGroup(map.get('illustration') || []);
  const ia = filterGroup(map.get('ia-generative') || []);
  let iaGrp = [];
  if (ia.length > 0) {
    iaGrp = [{
      id: 'iag-group',
      label: 'Intelligence Artificielle Générative',
      icon: 'smart_toy',
      isIAGroup: true,
      children: ia
    }];
  }
  const digcompGroup = filterGroup(map.get('digcomp-google-wordpress') || []);

  return [
    { 
      key: 'bureautique', 
      title: 'Bureautique', 
      style: sectionStyles.bureautique,
      subSections: [
        { title: '1. Microsoft Office', items: microsoft, suite: 'microsoft' },
        { title: '2. Google Workspace', items: google, suite: 'google' }
      ],
      hidden: bureauItems.length === 0
    },
    { key: 'langues', title: 'Langues', items: langs, style: sectionStyles.langues },
    { key: 'creation', title: 'Création', items: [...creation, ...iaGrp], style: sectionStyles.creation },
    { key: 'internet', title: 'Internet', items: digcompGroup, style: sectionStyles.internet },
  ].filter(s => !s.hidden && (s.items?.length > 0 || (s.subSections && s.subSections.some(sub => sub.items?.length > 0))));
});

function selectBureau(form, suite) {
  selectedFormation.value = form;
  selectedSuite.value = suite;
  // If we want immediate selection like before:
  // selectFormation();
}

function isSectionActive(section) {
  if (!selectedFormation.value) return false;
  if (section.items?.some(i => i.id === selectedFormation.value.id || (i.isIAGroup && i.children?.some(c => c.id === selectedFormation.value.id)))) return true;
  if (section.subSections?.some(sub => sub.items.some(i => i.id === selectedFormation.value.id))) return true;
  return false;
}

</script>

<template>
  <div class="min-h-screen bg-[#F0F4F8] flex flex-col font-outfit">
    <SiteHeader />

    <main class="flex-1 max-w-5xl w-full mx-auto p-4 py-10">
      <div class="max-w-3xl mx-auto mb-10">
        <!-- Progress Bar -->
        <WorkflowProgressBar customPath="/formations" />
      
        <div class="text-center">
          <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-3">
            {{ store.isP3Mode ? 'Choisissez votre 3ème formation' : 'Quelle formation souhaitez-vous suivre ?' }}
          </h1>
          <p class="text-gray-400 text-base md:text-lg">
            {{ store.isP3Mode ? 'Sélectionnez un parcours complémentaire (1 seul parcours)' : 'Faites votre choix ci-dessous :' }}
          </p>
        </div>

        <!-- P3 Banner: Previous Parcours -->
        <div v-if="store.isP3Mode && p3PrevRecommendations.length > 0" class="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-icons-outlined text-indigo-500 text-xl">history_edu</span>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Vos parcours précédents</p>
              <div class="space-y-1.5">
                <div v-for="(rec, idx) in p3PrevRecommendations" :key="idx" class="flex items-center gap-2">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black text-white" :class="idx === 0 ? 'bg-blue-400' : 'bg-green-400'">
                    P{{ idx + 1 }}
                  </span>
                  <span class="text-sm font-bold text-gray-700">{{ rec }}</span>
                </div>
              </div>
              <p class="text-xs text-gray-400 mt-2 italic">Un 3ème parcours vous est proposé ci-dessous.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="bg-white rounded-4xl p-6 md:p-12 shadow-xl border border-white">
        <div class="space-y-12">
          <div v-for="section in sections" :key="section.key" class="space-y-6">
            <h3 
              class="inline-block px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest border"
              :style="{ 
                backgroundColor: section.style?.bg || '#eff6ff', 
                color: '#1f2937',
                borderColor: section.style?.color || '#3b82f6'
              }"
            >
              {{ section.title }}
            </h3>

            <!-- Subsections (Bureautique) -->
            <div v-if="section.subSections" class="space-y-10 pl-4">
              <div v-for="sub in section.subSections" :key="sub.title" class="space-y-4">
                <h4 class="text-sm font-bold text-gray-500 italic">{{ sub.title }}</h4>
                <div class="formations-grid">
                  <button
                    v-for="form in sub.items"
                    :key="form.id"
                    @click="selectBureau(form, sub.suite)"
                    class="formation-card relative"
                    :class="selectedFormation?.id === form.id ? 'formation-card--selected' : 'formation-card--default'"
                    :style="selectedFormation?.id === form.id ? { borderColor: selectedAccent.accent, boxShadow: `0 15px 30px -10px ${selectedAccent.accent}33` } : {}"
                  >
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm" :style="selectedFormation?.id === form.id ? { backgroundColor: selectedAccent.accent, color: 'white', boxShadow: `0 8px 16px -4px ${selectedAccent.accent}40` } : { backgroundColor: 'white', color: '#9ca3af' }">
                          <span class="material-icons-outlined text-xl">{{ sub.suite === 'microsoft' ? 'description' : 'cloud' }}</span>
                       </div>
                       <span class="formation-card__label" :style="selectedFormation?.id === form.id ? { color: selectedAccent.accent } : {}">{{ form.label }}</span>
                    </div>

                    <!-- Selected badge -->
                    <div v-if="selectedFormation?.id === form.id" class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10 animate-scale-up" :style="{ backgroundColor: selectedAccent.accent }">
                      <span class="material-icons-outlined text-[14px] font-bold">check</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Normal Sections -->
            <div v-else class="formations-grid">
              <button
                v-for="form in section.items"
                :key="form.id"
                @click="selectedFormation = form; if(section.key!=='bureautique') selectedSuite=''"
                class="formation-card relative"
                :class="(selectedFormation?.id === form.id || (form.isIAGroup && form.children?.some(c => c.id === selectedFormation?.id))) ? 'formation-card--selected' : 'formation-card--default'"
                :style="(selectedFormation?.id === form.id || (form.isIAGroup && form.children?.some(c => c.id === selectedFormation?.id))) ? { borderColor: selectedAccent.accent, boxShadow: `0 15px 30px -10px ${selectedAccent.accent}33` } : {}"
              >
                <div class="flex items-center gap-4">
                   <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm" :style="(selectedFormation?.id === form.id || (form.isIAGroup && form.children?.some(c => c.id === selectedFormation?.id))) ? { backgroundColor: selectedAccent.accent, color: 'white', boxShadow: `0 8px 16px -4px ${selectedAccent.accent}40` } : { backgroundColor: 'white', color: '#9ca3af' }">
                      <span class="material-icons-outlined text-xl">{{ form.icon || 'star' }}</span>
                   </div>
                   <span class="formation-card__label" :style="(selectedFormation?.id === form.id || (form.isIAGroup && form.children?.some(c => c.id === selectedFormation?.id))) ? { color: selectedAccent.accent } : {}">{{ form.label }}</span>
                </div>

                <!-- Selected badge -->
                <div v-if="(selectedFormation?.id === form.id || (form.isIAGroup && form.children?.some(c => c.id === selectedFormation?.id)))" class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10 animate-scale-up" :style="{ backgroundColor: selectedAccent.accent }">
                  <span class="material-icons-outlined text-[14px] font-bold">check</span>
                </div>
              </button>
            </div>

            <!-- Selected Formation Feedback (prominent inline banner) placed immediately after the active section -->
            <div v-if="isSectionActive(section)" class="mt-8">
              <transition name="fade-slide" mode="out-in">
                <div v-if="(selectedFormation && selectedFormation.isIAGroup) || (section.items?.some(i => i.isIAGroup && i.children?.some(c => c.id === selectedFormation?.id)))"
                     class="p-6 md:p-8 rounded-3xl border-2 flex flex-col items-center gap-6 animate-scale-up shadow-2xl relative overflow-hidden bg-white"
                     :style="{ borderColor: selectedAccent.accent + '40', boxShadow: `0 20px 50px -12px ${selectedAccent.accent}25` }">
                   <h3 class="text-xl md:text-2xl font-black text-[#0d1b3e] text-center mb-2">Choisissez votre outil de spécialisation IA :</h3>
                   <div class="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-2xl">
                     <button v-for="child in (selectedFormation?.isIAGroup ? selectedFormation.children : section.items.find(i => i.isIAGroup).children)" :key="child.id"
                             @click="selectedFormation = child; selectedSuite=''"
                             class="flex-1 p-4 rounded-xl border-2 transition-all font-bold flex items-center justify-center gap-3 relative"
                             :class="selectedFormation?.id === child.id ? 'bg-brand-primary/10 text-[#0d1b3e]' : 'hover:bg-brand-primary/5 text-gray-700 active:scale-95'"
                             :style="{ borderColor: selectedFormation?.id === child.id ? selectedAccent.accent : selectedAccent.accent + '60' }"
                     >
                       <span class="material-icons-outlined text-xl" :style="{ color: selectedAccent.accent }">{{ child.icon || 'smart_toy' }}</span>
                       <span class="text-lg">{{ child.label }}</span>
                       <div v-if="selectedFormation?.id === child.id" class="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10" :style="{ backgroundColor: selectedAccent.accent }">
                          <span class="material-icons-outlined text-[12px] font-bold">check</span>
                       </div>
                     </button>
                   </div>
                </div>

                <div v-else-if="selectedFormation && !selectedFormation.isIAGroup" 
                     class="p-6 md:p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-6 animate-scale-up shadow-2xl relative overflow-hidden" 
                     :style="{ 
                       backgroundColor: 'white',
                       borderColor: selectedAccent.accent + '40',
                       boxShadow: `0 20px 50px -12px ${selectedAccent.accent}25`
                     }">
                  <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 pointer-events-none" :style="{ backgroundColor: selectedAccent.accent }"></div>
                  
                  <div class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
                    <span class="material-icons-outlined text-3xl">verified</span>
                  </div>
                  <div class="text-center md:text-left flex-1">
                    <p class="text-[10px] font-black uppercase tracking-[0.2em] mb-1" :style="{ color: selectedAccent.accent }">Formation sélectionnée</p>
                    <h3 class="text-2xl md:text-3xl font-black text-[#0d1b3e] leading-tight">{{ selectedFormation.label }}</h3>
                    <div v-if="selectedSuite" class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                       <span class="material-icons-outlined text-xs">{{ selectedSuite === 'microsoft' ? 'description' : 'cloud' }}</span>
                       {{ selectedSuite === 'microsoft' ? 'Microsoft Office' : 'Google Workspace' }}
                    </div>
                  </div>
                  <div class="hidden lg:block h-12 w-px bg-gray-100 mx-4"></div>
                  <div class="flex items-center gap-2 text-gray-400">
                    <span class="material-icons-outlined text-sm">info</span>
                    <span class="text-xs font-bold italic">Cliquez sur « Continuer » pour valider</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- Reference for sticky bottom bar (empty block just to trigger IntersectionObserver) -->
        <div ref="inlineBannerRef" class="h-1"></div>
        <!-- removed old inline banner block -->

        <!-- Bottom Actions -->
        <div class="pt-12 flex items-center justify-center border-t border-gray-50 mt-12">
          <button
            @click="selectFormation"
            :disabled="submitting || !selectedFormation || selectedFormation.isIAGroup"
            class="px-10 py-4 bg-[#ebb973] hover:brightness-95 text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
          >
            <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
            <span>{{ submitting ? 'Chargement...' : 'Continuer' }}</span>
            <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>

    <SiteFooter />

    <!-- Sticky Bottom Bar - apparaît quand la bannière inline sort du viewport -->
    <transition name="sticky-slide">
      <div
        v-if="selectedFormation && !selectedFormation.isIAGroup && showStickyBar"
        class="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 shadow-2xl"
        :style="{ backgroundColor: selectedAccent.accentBg || '#eff6ff', borderTop: `2px solid ${selectedAccent.accent}30` }"
      >
        <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg animate-pulse" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
              <span class="material-icons-outlined text-xl">verified</span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.2em]" :style="{ color: selectedAccent.accent }">Formation sélectionnée</p>
              <p class="text-base md:text-lg font-black text-[#0d1b3e] leading-tight">{{ selectedFormation.label }}</p>
            </div>
          </div>
          <button
            @click="selectFormation"
            :disabled="submitting"
            class="px-8 py-3.5 font-black uppercase tracking-widest text-xs rounded-xl shadow-2xl transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-40 shrink-0"
            :style="{ backgroundColor: selectedAccent.accent, color: 'white', boxShadow: `0 12px 24px -6px ${selectedAccent.accent}60` }"
          >
            <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
            <span class="hidden sm:inline">{{ submitting ? 'Chargement...' : 'Continuer' }}</span>
            <span class="sm:hidden">{{ submitting ? '...' : 'Continuer' }}</span>
            <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- P3 Same Formation Modal -->
    <div v-if="showP3SameFormationModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div class="relative z-10">
          <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner', p3IsMaxLevel ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500']">
            <span class="material-icons-outlined text-3xl">{{ p3IsMaxLevel ? 'block' : 'trending_up' }}</span>
          </div>
          
          <h2 class="text-xl font-black text-center text-[#0D1B3E] mb-3">{{ p3IsSingleLevel ? 'Formation à parcours unique' : 'Même formation' }}</h2>
          <p class="text-gray-600 font-medium text-center mb-2 leading-relaxed">
            Vous avez choisi <strong class="text-[#0D8ABC]">{{ p3SameFormationLabel }}</strong><span v-if="!p3IsSingleLevel">, la même formation que votre parcours précédent</span>.
          </p>
          
          <template v-if="p3IsSingleLevel">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4">
              <p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Parcours unique disponible</p>
              <p class="text-lg font-black text-amber-700">{{ p3NextLevelLabel }}</p>
            </div>
            <p class="text-amber-600 font-medium text-sm text-center mb-6">
              Cette formation ne propose qu'un seul niveau. Vous l'avez déjà suivi lors d'un parcours précédent. Veuillez choisir une formation différente pour votre 3ème parcours.
            </p>
          </template>

          <template v-else-if="!p3IsMaxLevel">
            <div class="bg-green-50 border border-green-200 rounded-xl p-3 text-center mb-4">
              <p class="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                {{ p3IsUnselectedChoice ? 'Option restante attribuée' : 'Parcours P3 attribué automatiquement' }}
              </p>
              
              <!-- Selection mode if multiple unselected choices -->
              <div v-if="p3IsUnselectedChoice && p3UnselectedChoicesList.length > 1" class="flex flex-col gap-2 mt-2">
                <p class="text-sm text-green-800 font-medium mb-1">Veuillez choisir votre prochaine spécialité :</p>
                <label 
                  v-for="choice in p3UnselectedChoicesList" 
                  :key="choice"
                  class="flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all bg-white"
                  :class="p3SelectedRemainingChoice === choice ? 'border-green-500 shadow-md' : 'border-transparent hover:border-green-300 shadow-sm'"
                >
                  <span class="font-black text-green-900 text-sm">{{ choice }}</span>
                  <input 
                    type="radio" 
                    :value="choice" 
                    v-model="p3SelectedRemainingChoice"
                    class="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                </label>
              </div>
              
              <!-- Simple text mode (single choice or standard next level) -->
              <p v-else class="text-lg font-black text-green-700">
                {{ p3IsUnselectedChoice ? p3SelectedRemainingChoice : p3NextLevelLabel }}
              </p>
            </div>
            <p class="text-gray-500 text-sm text-center mb-6">
              Aucun test supplémentaire n'est nécessaire.
            </p>
          </template>
          
          <template v-else>
            <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-center mb-4">
              <p class="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Niveau Maximum Atteint</p>
              <p class="text-lg font-black text-red-700">{{ p3NextLevelLabel }}</p>
            </div>
            <p class="text-red-500 font-medium text-sm text-center mb-6">
              Vous avez déjà atteint le niveau maximum disponible pour cette formation. Veuillez sélectionner une formation différente pour votre 3ème parcours.
            </p>
          </template>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="showP3SameFormationModal = false" :class="['flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all', (p3IsMaxLevel || p3IsSingleLevel) ? 'bg-[#0D1B3E] text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
              {{ (p3IsMaxLevel || p3IsSingleLevel) ? 'Changer de formation' : 'Annuler' }}
            </button>
            <button v-if="!p3IsMaxLevel && !p3IsSingleLevel" @click="confirmP3SameFormation" :disabled="submitting" class="flex-1 py-3 px-4 bg-[#ebb973] text-brand-primary hover:bg-[#ebb973]/80 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-md shadow-[#ebb973]/30 disabled:opacity-50">
              <span v-if="submitting" class="material-icons-outlined animate-spin text-sm mr-1">sync</span>
              Confirmer le P3
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

/* CSS variables and animations */
:root {
  --color-brand-primary: #ebb973;
  --color-brand-secondary: #0d1b3e;
  --title-color: #315264;
}

.heading-primary {
  color: var(--title-color);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.5s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-20px); }

/* Sticky bottom bar animation */
.sticky-slide-enter-active, .sticky-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.sticky-slide-enter-from { transform: translateY(100%); opacity: 0; }
.sticky-slide-leave-to { transform: translateY(100%); opacity: 0; }

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.formations-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .formations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .formations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Formation card */
.formation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  min-height: 5rem;
  background: #f1f5f9;
  border: 1px solid #f1f5f9;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.formation-card:hover {
  background: #e2e8f0;
  border-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
}

.formation-card:active {
  transform: translateY(0) scale(0.98);
}

.formation-card--selected {
  border-color: #2563eb; /* blue-600 */
  border-width: 2px;
  background: white;
  box-shadow: 0 15px 30px -10px rgba(37, 99, 235, 0.25);
  transform: translateY(-4px) scale(1.02);
  z-index: 5;
}

.formation-card__label {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--title-color);
  text-align: left;
  line-height: 1.25;
  transition: color 0.3s ease;
}

.formation-card--selected .formation-card__label {
  color: #60a5fa; /* blue-400 */
}

.formation-card__radio {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.formation-card__radio--selected {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-primary);
}

.formation-card--selected .formation-card__radio--selected {
  border-color: #60a5fa; /* blue-400 */
  background: white;
}

.formation-card--selected .formation-card__radio-dot {
  background: #60a5fa; /* blue-400 */
}

.formation-card__radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: white;
}

/* Bureau card styling for modal */
.bureau-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  min-height: 3rem;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

@media (min-width: 768px) {
  .bureau-card {
    gap: 1rem;
    padding: 1rem 1.25rem;
    min-height: 3.5rem;
    border-radius: 1.25rem;
  }
}

.bureau-card--google {
  color: #1f2937;
  border-color: #bfdbfe;
  background: #f0f9ff;
}

.bureau-card--google:hover {
  border-color: #3b82f6;
  background: #e0f2fe;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
}

.bureau-card--google-selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
}

.bureau-card--microsoft {
  color: #1f2937;
  border-color: #c7d2fe;
  background: #f5f3ff;
}

.bureau-card--microsoft:hover {
  border-color: #6366f1;
  background: #ede9fe;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
}

.bureau-card--microsoft-selected {
  border-color: #6366f1;
  background: #faf5ff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.15);
}
</style>
