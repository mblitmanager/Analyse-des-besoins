<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import WorkflowProgressBar from '../components/WorkflowProgressBar.vue';
import { useToastStore } from "../stores/toast";
import { getSessionParcoursTitle, normalizeParcoursLabel } from "../utils/parcoursLabel";

// Ref attaché à la bannière inline
const inlineBannerRef = ref(null);
// Sticky visible quand la bannière inline est hors du viewport
const showStickyBar = ref(false);
let observer = null;

const store = useAppStore();
const router = useRouter();
const toast = useToastStore();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const selectedFormation = ref(null);
const selectedSuite = ref(localStorage.getItem('selected_suite') || '');
const showP3SameFormationModal = ref(false);
const p3SameFormationLabel = ref("");
const p3NextLevelLabel = ref("");
const p3NextFinalRecommendation = ref("");
const p3NextParcoursTitle = ref("");
const p3NextExplanation = ref("");
const p3NextLevelLabelRaw = ref("");
const p3NextLevelOrder = ref(0);
const p3IsMaxLevel = ref(false);
const p3IsSingleLevel = ref(false);
const p3NoConfiguredParcours = ref(false);
const p3IsUnselectedChoice = ref(false);
const p3UnselectedChoicesList = ref([]);
const p3SelectedRemainingChoice = ref('');
const p3AutoParcoursTitle = computed(() => {
  if (p3IsUnselectedChoice.value) return p3SelectedRemainingChoice.value;
  return p3NextParcoursTitle.value || p3NextLevelLabel.value;
});

const p3AutoFormationDetail = computed(() => {
  if (p3IsUnselectedChoice.value) return "";
  const detail = p3NextFinalRecommendation.value || "";
  const title = p3AutoParcoursTitle.value;
  if (!detail || normalizeParcoursLabel(detail) === normalizeParcoursLabel(title)) return "";
  return detail;
});

// ── P3 OVERRIDE: Admin-configurable forced formations by formation and level ──
const p3OverrideEnabled = ref(false);
const p3OverrideRules = ref([]); // Array of P3 override rules
const showP3OverrideModal = ref(false);
const p3OverrideAllowManual = ref(true);   // P3_OVERRIDE_ALLOW_MANUAL : afficher "Choisir manuellement"
const p3OverrideSelectedChoice = ref('');
const p3OverrideMatchedRule = ref(null); // The rule that matched the user's formation/level
const p3OverrideMatchedRules = ref([]);

const p3OverrideChoiceOptions = computed(() => {
  const rules = p3OverrideMatchedRules.value.length
    ? p3OverrideMatchedRules.value
    : (p3OverrideMatchedRule.value ? [p3OverrideMatchedRule.value] : []);
  const seen = new Set();
  const options = [];

  rules.forEach((rule) => {
    // Vérifier si la règle a testFormations configuré (paramétrable, pas hardcoded)
    const hasTestFormations = rule?.testFormations && 
      (Array.isArray(rule.testFormations) ? rule.testFormations.length > 0 : Object.keys(rule.testFormations).length > 0);
    
    if (hasTestFormations) {
      // Convertir testFormations en tableau si c'est un objet
      const testFormationsArray = Array.isArray(rule.testFormations) 
        ? rule.testFormations 
        : Object.values(rule.testFormations || {});
      
      // Utiliser les formations configurées dans testFormations
      testFormationsArray.forEach((formationLabel) => {
        const found = formations.value.find(f => (f.label || '').toLowerCase().includes(formationLabel.toLowerCase()));
        if (found) {
          // Format: "Formation P3 proposée (Cible 1) (Formation de test)"
          // Utiliser formation1 (Cible 1) comme nom du parcours
          const parcoursName = rule.formation1 || rule.formation || 'Formation';
          const combinedLabel = `${parcoursName} (${formationLabel})`;
          const clean = normalizeParcoursLabel(combinedLabel);
          if (!seen.has(clean)) {
            seen.add(clean);
            options.push({ label: combinedLabel, rule });
          }
        }
      });
      return; // skip normal formation1/formation2 handling for this rule
    }

    ["formation1", "formation2"].forEach((field) => {
      const label = String(rule?.[field] || "").trim();
      const clean = normalizeParcoursLabel(label);
      if (!label || seen.has(clean)) return;
      seen.add(clean);
      options.push({ label, rule });
    });
  });

  return options;
});

const p3UnselectedChoicesListWithOrder = computed(() => {
  if (!selectedFormation.value?.levels) return [];
  const clean = (s) => (s || '').toLowerCase().replace(/^(niveau|tosa|icdl|digcomp|anglais|français|francais)\s+/i, '').trim();
  return p3UnselectedChoicesList.value.map(choice => {
    const choiceClean = clean(choice);
    const matchedLevel = selectedFormation.value.levels.find(l => {
      const lClean = clean(l.label);
      return choiceClean === lClean || choiceClean.includes(lClean) || lClean.includes(choiceClean);
    });
    return {
      label: choice,
      order: matchedLevel ? matchedLevel.order : 0
    };
  });
});

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

// Previous sessions for P3 mode - to get parcoursTitle
const previousSessions = ref([]);

function getParcoursSummaryLabel(session) {
  const title = getSessionParcoursTitle(session);
  if (title) return title;
  if (session?.finalRecommendation) return session.finalRecommendation;
  if (session?.formationChoisie) {
    return `${session.formationChoisie} - ${session.stopLevel || ''}`.trim();
  }
  return "";
}

function splitRecommendation(value) {
  return String(value || "")
    .split(/\s*&\s*|\s*\|\s*|\s+et\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function findParcoursRuleForSession(session, title = "") {
  const cleanTitle = normalizeParcoursLabel(title || getSessionParcoursTitle(session));
  const cleanRec = normalizeParcoursLabel(session?.finalRecommendation);
  const cleanFormation = normalizeParcoursLabel(session?.formationChoisie);

  return allParcoursRules.value.find((rule) => {
    const ruleTitle = normalizeParcoursLabel(rule.parcoursTitle);
    const ruleFormation = normalizeParcoursLabel(rule.formation);
    const f1 = normalizeParcoursLabel(rule.formation1);
    const f2 = normalizeParcoursLabel(rule.formation2);

    if (cleanTitle && ruleTitle && cleanTitle === ruleTitle) return true;
    if (cleanFormation && ruleFormation && cleanFormation === ruleFormation && cleanRec) {
      return (f1 && cleanRec.includes(f1)) || (f2 && cleanRec.includes(f2));
    }
    return false;
  });
}

function getFormationItemsFromSession(session, title = "") {
  const items = [];
  const cleanFormation = normalizeParcoursLabel(session?.formationChoisie);
  const add = (label) => {
    const clean = normalizeParcoursLabel(label);
    if (!clean || clean === normalizeParcoursLabel(title)) return;
    if (cleanFormation && clean === cleanFormation) return;
    if (!items.some((item) => normalizeParcoursLabel(item) === clean)) {
      items.push(label);
    }
  };

  if (Array.isArray(session?.recommendations)) {
    session.recommendations.forEach(add);
  }
  splitRecommendation(session?.finalRecommendation).forEach(add);

  const rule = findParcoursRuleForSession(session, title);
  if (items.length < 2 && rule) {
    add(rule.formation1);
    add(rule.formation2);
  }

  return items;
}

const p3SummaryTitle = computed(() => {
  const sessions = [currentSession.value, ...previousSessions.value].filter(Boolean);
  for (const session of sessions) {
    const title = getSessionParcoursTitle(session);
    if (title) return title;
  }

  const fromStorage = p3PrevRecommendations.value.find((label) =>
    allParcoursRules.value.some(
      (rule) => normalizeParcoursLabel(rule.parcoursTitle) === normalizeParcoursLabel(label),
    ),
  );
  return fromStorage || "";
});

const p3ParcoursItems = computed(() => {
  const labels = [];
  const seen = new Set();
  const addLabel = (label) => {
    const clean = normalizeParcoursLabel(label);
    if (clean === normalizeParcoursLabel(p3SummaryTitle.value)) return;
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    labels.push(label);
  };

  const sessions = [...previousSessions.value, currentSession.value].filter(Boolean);
  sessions.forEach((session) => {
    getFormationItemsFromSession(session, p3SummaryTitle.value).forEach(addLabel);
  });

  if (labels.length < 2) {
    const rule = findParcoursRuleForSession(currentSession.value, p3SummaryTitle.value);
    if (rule) {
      addLabel(rule.formation1);
      addLabel(rule.formation2);
    }
  }

  if (labels.length < 2) p3PrevRecommendations.value.forEach(addLabel);

  return labels.slice(0, 2);
});

async function fetchPreviousSessions() {
  if (!store.isP3Mode || !currentSession.value?.stagiaire?.id) return;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/sessions?stagiaireId=${currentSession.value.stagiaire.id}`);
    const sessions = (res.data || [])
      .filter(s => s.isCompleted && s.id !== sessionId)
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    previousSessions.value = await Promise.all(
      sessions.map(async (session) => {
        try {
          const detailRes = await axios.get(`${apiBaseUrl}/sessions/${session.id}`);
          return detailRes.data || session;
        } catch {
          return session;
        }
      }),
    );
    console.log('[P3] Previous sessions fetched:', previousSessions.value.map(s => ({
      id: s.id,
      formationChoisie: s.formationChoisie,
      finalRecommendation: s.finalRecommendation,
      parcoursTitle: s.parcoursTitle
    })));
  } catch (err) {
    console.error("Failed to fetch previous sessions:", err);
  }
}

async function fetchFormations() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    if (store.isP3Mode && sessionId) {
      // In P3 mode, use the server-side filtered endpoint which applies P3 rules
      // based on the candidate's full training history
      const res = await axios.get(`${apiBaseUrl}/sessions/${sessionId}/available-formations-with-p3`);
      formations.value = res.data;
    } else {
      const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);
      formations.value = res.data;
    }
    
    // Once formations are loaded, compute level order if in P3 mode
    computeAndStorePrevLevelOrder();
  } catch (error) {
    console.error("Failed to fetch formations:", error);
    // Fallback to all formations
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
      const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);
      formations.value = res.data;
    } catch (fallbackError) {
      console.error("Fallback formation fetch also failed:", fallbackError);
    }
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
      axios.get(`${apiBaseUrl}/parcours?activeOnly=true`)
    ]);
    p3Rules.value = p3Res.data;
    allParcoursRules.value = (parcoursRes.data || []).filter(rule => rule.isActive !== false);
  } catch (err) {
    console.error("Failed to fetch P3/Parcours rules:", err);
  }
}

function labelsMatch(actual, expected) {
  const cleanActual = normalizeParcoursLabel(actual);
  const cleanExpected = normalizeParcoursLabel(expected);
  if (!cleanExpected) return true;
  if (!cleanActual) return false;
  return (
    cleanActual === cleanExpected ||
    cleanActual.includes(cleanExpected) ||
    cleanExpected.includes(cleanActual)
  );
}

function getP3PreviousItemsForConditions() {
  const title = getSessionParcoursTitle(currentSession.value);
  const sessionItems = getFormationItemsFromSession(currentSession.value, title);
  const fallbackItems = [
    localStorage.getItem("p3_prev_p1") || "",
    localStorage.getItem("p3_prev_p2") || "",
  ];
  const legacyItems = p3PrevRecommendations.value;

  // Si sessionItems[0] est vide, la formation principale (formationChoisie) peut être P1
  // Ex: session P2 = Digcomp+Excel → formationChoisie = "Digitales Compétences", items = ["EXCEL Basique (TOSA)"]
  // conditionP1 vérifie la formation principale → on l'ajoute comme fallback P1
  const sessionFormation = currentSession.value?.formationChoisie || "";
  const sessionFormationFull = currentSession.value?.finalRecommendation
    ? currentSession.value.finalRecommendation.split(/\s*[\|&]\s*/)[0] || sessionFormation
    : sessionFormation;

  return [
    sessionItems[0] || fallbackItems[0] || legacyItems[0] || sessionFormationFull || "",
    sessionItems[1] || sessionItems[0] || fallbackItems[1] || legacyItems[1] || sessionFormationFull || "",
  ];
}

function hasP1P2OverrideConditions(rule) {
  return !!(String(rule.conditionP1 || "").trim() || String(rule.conditionP2 || "").trim());
}

function matchesP1P2Override(rule) {
  const [p1, p2] = getP3PreviousItemsForConditions();
  const p1Ok = !String(rule.conditionP1 || "").trim() || labelsMatch(p1, rule.conditionP1);
  const p2Ok = !String(rule.conditionP2 || "").trim() || labelsMatch(p2, rule.conditionP2);
  return p1Ok && p2Ok;
}

function matchesLegacyP3Override(rule) {
  const prevFormation = localStorage.getItem('p3_prev_formation') || currentSession.value?.formationChoisie || '';
  if (!prevFormation) return false;

  const formationMatches =
    labelsMatch(prevFormation, rule.formation) ||
    (rule.formationId && Number(rule.formationId) === Number(currentSession.value?.formationId));
  if (!formationMatches) return false;

  const condMatch = String(rule.condition || "").match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (!condMatch) return false;

  const operator = condMatch[1].replace('≤', '<=').replace('≥', '>=');
  const targetLevel = condMatch[2];
  const userLevelLabel = currentSession.value?.stopLevel || localStorage.getItem('p3_prev_stop_level') || '';
  if (!userLevelLabel) return false;

  const previousFormation = formations.value.find((formation) =>
    labelsMatch(formation.label, prevFormation) ||
    (rule.formationId && Number(formation.id) === Number(rule.formationId))
  );
  const levels = previousFormation?.levels || [];
  const targetLevelObj = levels.find((level) => labelsMatch(level.label, targetLevel));
  const userLevelObj = levels.find((level) => labelsMatch(level.label, userLevelLabel));
  if (!targetLevelObj || !userLevelObj) return false;

  const targetOrder = Number(targetLevelObj.order || 0);
  const userOrder = Number(userLevelObj.order || 0);
  switch (operator) {
    case '=':
      return userOrder === targetOrder;
    case '<':
      return userOrder < targetOrder;
    case '<=':
      return userOrder <= targetOrder;
    case '>':
      return userOrder > targetOrder;
    case '>=':
      return userOrder >= targetOrder;
    default:
      return false;
  }
}

function p3OverrideRuleMatchesFormation(rule, formation) {
  if (!formation) return true;
  return (
    (rule.formationId && Number(rule.formationId) === Number(formation.id)) ||
    labelsMatch(formation.label, rule.formation)
  );
}

function findMatchingP3OverrideRules(formation = null) {
  const sortedRules = [...p3OverrideRules.value]
    .filter((rule) => rule.isActive !== false && p3OverrideRuleMatchesFormation(rule, formation))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const p1p2Matches = sortedRules.filter(
    (rule) => hasP1P2OverrideConditions(rule) && matchesP1P2Override(rule),
  );
  if (p1p2Matches.length) return p1p2Matches;

  const legacyMatch = sortedRules.find(
    (rule) => !hasP1P2OverrideConditions(rule) && matchesLegacyP3Override(rule),
  );
  return legacyMatch ? [legacyMatch] : [];
}

function showP3OverrideForRules(rules) {
  if (!rules.length) return false;
  p3OverrideEnabled.value = true;
  p3OverrideMatchedRules.value = rules;
  p3OverrideMatchedRule.value = rules[0];
  p3OverrideSelectedChoice.value = p3OverrideChoiceOptions.value[0]?.label || "";
  return true;
}

/**
 * P3 Override: checks if admin has configured forced formation choices for P3.
 * Fetches P3 override rules and matches them against the user's formation and level.
 * If a rule matches, shows a modal with the configured formation choices.
 */
async function fetchP3Override() {
  if (!store.isP3Mode) return;
  try {
    const enabled = await store.fetchSetting('P3_OVERRIDE_ENABLED');
    if (enabled !== 'true') return;

    await loadP3OverrideRules();

    const currentFormation = currentSession.value
      ? {
          id: currentSession.value.formationId,
          label: currentSession.value.formationChoisie,
        }
      : null;
    showP3OverrideForRules(findMatchingP3OverrideRules(currentFormation));
  } catch (e) {
    console.warn('[P3 Override] Error fetching override rules:', e);
  }
}

async function loadP3OverrideRules() {
  try {
    const enabled = await store.fetchSetting('P3_OVERRIDE_ENABLED');
    if (enabled !== 'true') { p3OverrideRules.value = []; return; }
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const rulesRes = await axios.get(`${apiBaseUrl}/p3-override?activeOnly=true`);
    p3OverrideRules.value = (rulesRes.data || []).filter(rule => rule.isActive !== false);

    // Charger les options de comportement
    const allowManualVal = await store.fetchSetting('P3_OVERRIDE_ALLOW_MANUAL');
    p3OverrideAllowManual.value = allowManualVal !== 'false'; // true par défaut
  } catch (e) {
    console.warn('[P3 Override] Error loading rules:', e);
  }
}
async function confirmP3Override() {
  if (!p3OverrideSelectedChoice.value) return;
  console.log('[P3] confirmP3Override called with choice:', p3OverrideSelectedChoice.value);
  p3OverrideEnabled.value = false;
  submitting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    
    const selectedOption = p3OverrideChoiceOptions.value.find(
      (option) => option.label === p3OverrideSelectedChoice.value,
    );
    const chosenLabel = selectedOption?.label || p3OverrideSelectedChoice.value;
    const rule = selectedOption?.rule || p3OverrideMatchedRule.value;
    const overrideP1 = String(rule?.conditionP1 || "").trim();
    const overrideP2 = String(rule?.conditionP2 || "").trim();
    if (overrideP1) localStorage.setItem("p3_prev_p1", overrideP1);
    if (overrideP2) localStorage.setItem("p3_prev_p2", overrideP2);

    if (rule?.requireTest) {
      // ── Mode avec test : identifier la formation à tester depuis le CHOIX ──
      // chosenLabel = "EXCEL Basique (TOSA)" → formation = "Excel"
      // On cherche d'abord depuis chosenLabel, puis depuis formation1 de la règle

      // Mapping certifications → formations connues (pour les cas où le label ne matche pas directement)
      // Pour les formations groupes (IA Générative), on redirige vers la sélection normale
      const certToFormation = {
        'inkrea': { label: 'Intelligence Artificielle Générative', isGroup: true },
      };

      // 1. Extraire depuis chosenLabel : "EXCEL Basique (TOSA)" → "EXCEL Basique" → matcher "Excel"
      const cleanChosen = chosenLabel.replace(/\s*\([^)]+\)$/, '').trim(); // "EXCEL Basique"
      const certInChosen = (chosenLabel.match(/\(([^)]+)\)/) || [])[1]?.toLowerCase() || '';
      
      // Vérifier mapping certification d'abord
      let targetFormation = null;
      let isGroupFormation = false;
      const certMapping = certToFormation[certInChosen];
      if (certMapping) {
        targetFormation = formations.value.find(f => f.label === certMapping.label || f.label.toLowerCase() === certMapping.label.toLowerCase());
        isGroupFormation = certMapping.isGroup || false;
      }

      // Vérifier si la règle a testFormations configuré (formation groupe paramétrable)
      const hasTestFormations = rule?.testFormations && 
        (Array.isArray(rule.testFormations) ? rule.testFormations.length > 0 : Object.keys(rule.testFormations).length > 0);
      
      console.log('[P3] confirmP3Override - hasTestFormations:', hasTestFormations, 'testFormations:', rule?.testFormations);
      
      if (hasTestFormations) {
        // Extraire la formation de test depuis chosenLabel (ex: "Excel + IA" depuis "WORD Basique (TOSA) (Excel + IA)")
        const match = chosenLabel.match(/\(([^)]+)\)$/);
        const testFormationLabel = match ? match[1] : chosenLabel.split(' + ')[0].trim();
        console.log('[P3] confirmP3Override - testFormationLabel extracted:', testFormationLabel);
        
        // Trouver la formation de test dans la liste des formations
        // Priorité à la correspondance exacte, puis partielle
        const testFormation = formations.value.find(f => {
          const fl = f.label.toLowerCase();
          const tl = testFormationLabel.toLowerCase();
          // Correspondance exacte d'abord
          if (fl === tl) return true;
          // Correspondance exacte avec espaces/parenthèses
          if (fl.replace(/\s+/g, '') === tl.replace(/\s+/g, '')) return true;
          // Correspondance partielle seulement si le label contient le terme recherché en entier
          if (fl.includes(tl)) return true;
          return false;
        });
        
        if (testFormation) {
          console.log('[P3] confirmP3Override - Found test formation:', testFormation.label);
          console.log('[P3] confirmP3Override - rule.formation:', rule?.formation);
          console.log('[P3] confirmP3Override - rule.parcoursTitle:', rule?.parcoursTitle);
          
          // Utiliser directement la formation de test pour le test de positionnement
          selectedFormation.value = testFormation;
          
          // Stocker le parcours final pour l'affichage après le test
          // Utiliser parcoursTitle si disponible, sinon formation, sinon fallback
          const finalParcoursLabel = rule?.parcoursTitle || rule?.formation || 'Formation';
          console.log('[P3] confirmP3Override - finalParcoursLabel to store:', finalParcoursLabel);
          localStorage.setItem('p3_forced_recommendation', finalParcoursLabel);
          localStorage.setItem('p3_forced_parcours_title', rule?.parcoursTitle || '');
          const overrideSummaryGroup = [overrideP1, overrideP2].filter(Boolean).join(" + ");
          localStorage.setItem('p3_forced_explanation', rule?.explanationMessage || (overrideSummaryGroup ? `${overrideSummaryGroup} -> ${finalParcoursLabel}` : ''));
          localStorage.setItem('p3_forced_force_choice', rule?.forceChoice === false ? 'false' : 'true');
          
          if (overrideP1) localStorage.setItem("p3_prev_p1", overrideP1);
          if (overrideP2) localStorage.setItem("p3_prev_p2", overrideP2);
          
          // Continuer automatiquement avec le test de positionnement
          // Appeler doSelectFormation directement pour lancer le test
          await doSelectFormation();
          return;
        } else {
          console.log('[P3] confirmP3Override - Could not find test formation:', testFormationLabel);
        }
      }

      // Si c'est une formation groupe (IA Générative), l'apprenant doit choisir la sous-formation
      // → On redirige vers FormationSelectionView avec le parcours forcé stocké
      if (isGroupFormation && targetFormation) {
        console.log('[P3] confirmP3Override - isGroupFormation, redirecting to formation selection');
        const payload = {
          isP3Mode: true,
          parcoursNumber: 3,
        };
        await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);

        // Extraire la formation de test depuis chosenLabel (ex: "Excel + IA" depuis "WORD Basique (TOSA) (Excel + IA)")
        // Format actuel: formation1 (formationLabel)
        const match = chosenLabel.match(/\(([^)]+)\)$/);
        const testFormationLabel = match ? match[1] : chosenLabel.split(' + ')[0].trim();
        
        // Le parcours final est toujours la formation originale de la règle (IA Générative)
        const finalParcoursLabel = rule?.formation || 'IA GENERATIVE (INKREA)';
        
        localStorage.setItem('p3_forced_recommendation', finalParcoursLabel);
        localStorage.setItem('p3_forced_parcours_title', rule?.parcoursTitle || '');
        const overrideSummaryGroup = [overrideP1, overrideP2].filter(Boolean).join(" + ");
        localStorage.setItem('p3_forced_explanation', rule?.explanationMessage || (overrideSummaryGroup ? `${overrideSummaryGroup} -> ${finalParcoursLabel}` : ''));
        localStorage.setItem('p3_forced_force_choice', rule?.forceChoice === false ? 'false' : 'true');
        
        // Stocker la formation de test séparément pour l'utiliser dans le test de positionnement
        localStorage.setItem('p3_test_formation', testFormationLabel);

        if (overrideP1) localStorage.setItem("p3_prev_p1", overrideP1);
        if (overrideP2) localStorage.setItem("p3_prev_p2", overrideP2);

        // Flag pour indiquer qu'on vient d'un groupe IA → éviter de redemander le modal P3 override
        localStorage.setItem('p3_ia_group_redirect', 'true');

        // Relancer la sélection de formation pour choisir Word+IA ou Excel+IA
        store.setP3Mode(true);
        submitting.value = false;
        router.push('/formations');
        return;
      }

      // Sinon cherche par correspondance label
      if (!targetFormation) {
        targetFormation = formations.value.find(f => {
          const fl = f.label.toLowerCase();
          const cl = cleanChosen.toLowerCase();
          return cl.startsWith(fl) || fl === cl.split(' ')[0];
        });
      }

      // 2. Extraire depuis formation1 de la règle si chosenLabel ne matche pas
      if (!targetFormation && rule?.formation1) {
        const cleanF1 = rule.formation1.replace(/\s*\([^)]+\)$/, '').trim();
        targetFormation = formations.value.find(f => {
          const fl = f.label.toLowerCase();
          const cl = cleanF1.toLowerCase();
          return cl.startsWith(fl) || fl === cl.split(' ')[0];
        });
      }

      // 3. Chercher par formationId de la règle (dernier recours)
      if (!targetFormation) {
        targetFormation = formations.value.find(f => rule?.formationId && f.id === rule.formationId);
      }

      console.debug('[P3 Override] targetFormation:', targetFormation?.label, '| chosenLabel:', chosenLabel);

      const formationLabel = targetFormation?.label || rule?.formation || chosenLabel;
      const formationSlug = targetFormation?.slug || '';

      const payload = {
        formationChoisie: formationLabel,
        isP3Mode: true,
        parcoursNumber: 3,
      };
      if (rule?.parcoursTitle) payload.parcoursTitle = rule.parcoursTitle;
      const overrideSummary = [overrideP1, overrideP2].filter(Boolean).join(" + ");
      if (rule?.explanationMessage) payload.explanationMessage = rule.explanationMessage;
      else if (overrideSummary) payload.explanationMessage = `${overrideSummary} -> ${chosenLabel}`;
      if (rule?.certification) payload.certification = rule.certification;

      await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);

      // Stocker le parcours P3 imposé (le certif choisi) pour PositionnementView
      localStorage.setItem('p3_forced_recommendation', chosenLabel);
      localStorage.setItem('p3_forced_parcours_title', rule?.parcoursTitle || '');
      localStorage.setItem('p3_forced_explanation', payload.explanationMessage || '');
      // forceChoice : true (défaut) = imposer peu importe le résultat du test
      localStorage.setItem('p3_forced_force_choice', rule?.forceChoice === false ? 'false' : 'true');

      if (formationSlug) {
        localStorage.setItem("selected_formation_slug", formationSlug);
      }
      localStorage.setItem("selected_formation_label", formationLabel);

      await store.updateActualWorkflow();
      const nextRoute = await store.getNextRouteWithQuestions("/formations");
      router.push(nextRoute || "/positionnement");
    } else {
      // ── Mode sans test (défaut) : finaliser directement ──
      const payload = {
        formationChoisie: chosenLabel,
        isP3Mode: true,
        p3SkipQuiz: true,
        finalRecommendation: chosenLabel,
        stopLevel: chosenLabel,
      };
      if (rule?.parcoursTitle) payload.parcoursTitle = rule.parcoursTitle;
      const overrideSummary = [overrideP1, overrideP2].filter(Boolean).join(" + ");
      if (rule?.explanationMessage) payload.explanationMessage = rule.explanationMessage;
      else if (overrideSummary) payload.explanationMessage = `${overrideSummary} -> ${chosenLabel}`;
      if (rule?.certification) payload.certification = rule.certification;

      await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);
      await axios.post(`${apiBaseUrl}/sessions/${sessionId}/submit`);
      router.push('/validation');
    }
  } catch (error) {
    console.error('Failed to confirm P3 override:', error);
    toast.error('Erreur lors de la validation du P3.');
  } finally {
    submitting.value = false;
  }
}

function skipP3Override() {
  // User wants to proceed with normal formation selection instead
  p3OverrideEnabled.value = false;
  p3OverrideMatchedRule.value = null;
  p3OverrideMatchedRules.value = [];
  p3OverrideSelectedChoice.value = "";
}

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  
  // Fresh P1 session: clear any leftover P3 state from previous journeys
  if (store.parcoursNumber === 1) {
    const p3Keys = ['p3_prev_formation', 'p3_prev_recommendations', 'p3_prev_p1', 'p3_prev_p2', 'p3_prev_stop_level', 'p3_prev_level_order', 'p3_unselected_choices'];
    p3Keys.forEach(k => localStorage.removeItem(k));
  }
  
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  try {
    const res = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    currentSession.value = res.data;
    await fetchPreviousSessions();
  } catch (err) {
    console.error("Failed to fetch session for P3 filtering", err);
  }

  await Promise.all([
    fetchFormations(),
    fetchP3Rules(),
  ]);
  await fetchP3Override();

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
    toast.error('Veuillez choisir : Google Workspace ou Microsoft Office');
    return;
  }

  // ── Cas redirection depuis groupe IA (Word+IA ou Excel+IA) ──
  // Quand l'apprenant arrive ici après avoir choisi IA GENERATIVE dans le modal P3 override,
  // on pré-sélectionne automatiquement la formation de test stockée dans p3_test_formation
  if (store.isP3Mode && localStorage.getItem('p3_ia_group_redirect') === 'true') {
    localStorage.removeItem('p3_ia_group_redirect');
    const testFormationLabel = localStorage.getItem('p3_test_formation');
    if (testFormationLabel) {
      console.log('[P3] Looking for test formation:', testFormationLabel);
      console.log('[P3] Available formations:', formations.value.map(f => f.label));
      
      // Pré-sélectionner la formation de test (ex: Word + IA)
      // Essayer plusieurs méthodes de correspondance
      const testFormation = formations.value.find(f => {
        const fl = f.label.toLowerCase();
        const tl = testFormationLabel.toLowerCase();
        // Correspondance exacte
        if (fl === tl) return true;
        // Correspondance partielle (formation contient le label recherché)
        if (fl.includes(tl)) return true;
        // Correspondance partielle inversée (label recherché contient la formation)
        if (tl.includes(fl)) return true;
        // Correspondance par mot clé (ex: "excel" pour "Excel + IA")
        const tlKeyword = tl.split(' ')[0]; // Premier mot
        if (fl.includes(tlKeyword)) return true;
        return false;
      });
      
      if (testFormation) {
        selectedFormation.value = testFormation;
        console.log('[P3] Pre-selected test formation:', testFormation.label);
      } else {
        console.log('[P3] Could not find matching formation for:', testFormationLabel);
      }
      localStorage.removeItem('p3_test_formation');
    }
  }

  // P3: if user chose the SAME formation as P2, check settings
  if (store.isP3Mode) {
    // Charger les règles P3 override si pas encore fait (ex: entré en P3 après le montage)
    if (p3OverrideRules.value.length === 0) {
      await loadP3OverrideRules();
    }
    
    // ── Vérifier si la règle matchante a testFormations configurés ──
    // Ceci est paramétrable via l'admin, pas hardcoded
    const matchingOverrideRules = findMatchingP3OverrideRules(selectedFormation.value);
    if (matchingOverrideRules.length > 0) {
      // Filtrer les règles qui ont testFormations configurés
      const rulesWithTestFormations = matchingOverrideRules.filter(rule => {
        const tf = rule?.testFormations;
        // Gérer à la fois les tableaux et les objets
        if (!tf) return false;
        if (Array.isArray(tf)) return tf.length > 0;
        // Si c'est un objet, vérifier s'il a des propriétés
        if (typeof tf === 'object') return Object.keys(tf).length > 0;
        return false;
      });
      
      if (rulesWithTestFormations.length > 0) {
        console.log('[P3] Found rules with testFormations configured:', rulesWithTestFormations.length);
        if (showP3OverrideForRules(rulesWithTestFormations)) return;
      }
      
      // ── Priorité absolue : vérifier P3 override en premier ──
      // Si une règle override matche avec requireTest=true, on lance le test
      // directement sans vérifier si c'est la même formation que P1/P2
      // Vérifier si au moins une règle matchante a requireTest=true
      const hasRequireTest = matchingOverrideRules.some(r => r.requireTest);
      if (hasRequireTest) {
        // Afficher le modal P3 override — confirmP3Override gérera le test
        if (showP3OverrideForRules(matchingOverrideRules)) {
          return;
        }
      }
    }

    const prevFormation = localStorage.getItem('p3_prev_formation') || '';
    const sameFormationTest = await store.fetchSetting('P3_SAME_FORMATION_TEST');
    const otherFormationTest = await store.fetchSetting('P3_OTHER_FORMATION_TEST');
    
    if (prevFormation && labelsMatch(selectedFormation.value.label, prevFormation)) {
      // Same formation selected
      if (sameFormationTest === 'false') {
        toast.error("En mode P3, vous devez choisir une formation différente de celle du P2.");
        return;
      }
      if (showP3OverrideForRules(matchingOverrideRules)) {
        return;
      }
      // If allowed, skip quiz entirely
      p3SameFormationLabel.value = selectedFormation.value.label;
      const computedResult = computeNextLevel();
      p3NextLevelLabel.value = computedResult.label;
      p3NextFinalRecommendation.value = computedResult.finalRecommendation || computedResult.label;
      p3NextParcoursTitle.value = computedResult.parcoursTitle || "";
      p3NextExplanation.value = computedResult.explanationMessage || "";
      p3NextLevelLabelRaw.value = computedResult.nextLevelLabel;
      p3NextLevelOrder.value = computedResult.nextLevelOrder;
      p3IsMaxLevel.value = computedResult.isMaxLevel;
      p3IsSingleLevel.value = computedResult.isSingleLevel || false;
      p3NoConfiguredParcours.value = computedResult.noConfiguredParcours || false;
      p3IsUnselectedChoice.value = computedResult.isUnselectedChoice || false;
      p3UnselectedChoicesList.value = computedResult.unselectedChoices || [];
      if (p3UnselectedChoicesList.value.length > 0) {
        p3SelectedRemainingChoice.value = p3UnselectedChoicesList.value[0];
      }
      showP3SameFormationModal.value = true;
      return;
    } else {
      // Different formation selected
      // Si P3_OTHER_FORMATION_TEST = false → skip le test, imposer le parcours P3 directement
      if (otherFormationTest === 'false') {
        if (showP3OverrideForRules(matchingOverrideRules)) {
          return;
        }
        // Calculer le parcours P3 imposé et finaliser sans test
        await doSelectFormationWithoutTest();
        return;
      }
    }
    // Pour les formations différentes avec P3_OTHER_FORMATION_TEST = true (ou non défini)
    // et sans requireTest : vérifier l'override normalement
    if (showP3OverrideForRules(matchingOverrideRules)) {
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
      parcoursNumber: store.isP3Mode ? 3 : 1,
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
    
    // En P3 avec formation DIFFÉRENTE : calculer et stocker le parcours P3 imposé
    // Le test de positionnement sera fait pour évaluer le niveau, mais le parcours
    // final sera toujours celui imposé ici (indépendant du résultat du QCM).
    if (store.isP3Mode) {
      const computedResult = computeNextLevel();
      if (computedResult.finalRecommendation || computedResult.label) {
        localStorage.setItem('p3_forced_recommendation', computedResult.finalRecommendation || computedResult.label);
        localStorage.setItem('p3_forced_parcours_title', computedResult.parcoursTitle || '');
        localStorage.setItem('p3_forced_explanation', computedResult.explanationMessage || '');
      } else {
        localStorage.removeItem('p3_forced_recommendation');
        localStorage.removeItem('p3_forced_parcours_title');
        localStorage.removeItem('p3_forced_explanation');
      }
    }
    
    // Update the real workflow path based on the selected formation
    await store.updateActualWorkflow();
    
    const nextRoute = await store.getNextRouteWithQuestions("/formations");
    router.push(nextRoute || "/positionnement");
  } catch (error) {
    console.error("Failed to select formation:", error);
    toast.error("Erreur lors de la sélection de la formation.");
  } finally {
    submitting.value = false;
  }
}

/**
 * P3 formation différente + P3_OTHER_FORMATION_TEST = false :
 * Sauvegarde la formation, calcule le parcours P3 imposé et finalise
 * directement sans passer par le test de positionnement.
 */
async function doSelectFormationWithoutTest() {
  submitting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    const computedResult = computeNextLevel();
    const finalRec = computedResult.finalRecommendation || computedResult.label || selectedFormation.value.label;
    const finalTitle = computedResult.parcoursTitle || "";
    const finalExplanation = computedResult.explanationMessage || "";
    const finalStopLevel = computedResult.nextLevelLabel || computedResult.label || selectedFormation.value.label;
    const finalStopLevelOrder = computedResult.nextLevelOrder || 0;

    const payload = {
      formationChoisie: selectedFormation.value.label,
      isP3Mode: true,
      p3SkipQuiz: true,
      finalRecommendation: finalRec,
      stopLevel: finalStopLevel,
      stopLevelOrder: finalStopLevelOrder,
      parcoursNumber: 3,
    };
    if (finalTitle) payload.parcoursTitle = finalTitle;
    if (finalExplanation) payload.explanationMessage = finalExplanation;
    if ((selectedFormation.value.category || '').toLowerCase() === 'bureautique') {
      payload.bureautiqueSuite = selectedSuite.value;
    }

    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);

    localStorage.setItem("selected_formation_slug", selectedFormation.value.slug);
    localStorage.setItem("selected_formation_label", selectedFormation.value.label);
    if (store.isP3Mode && currentSession.value) {
      localStorage.setItem('p3_prev_formation', currentSession.value.formationChoisie || "");
      localStorage.setItem('p3_prev_level_order', String(currentSession.value.stopLevelOrder || 0));
    }
    if (selectedSuite.value) localStorage.setItem('selected_suite', selectedSuite.value);

    // Finaliser la session directement (pas de test)
    await axios.post(`${apiBaseUrl}/sessions/${sessionId}/submit`);

    router.push('/validation');
  } catch (error) {
    console.error("Failed to select formation without test:", error);
    toast.error("Erreur lors de la sélection de la formation.");
  } finally {
    submitting.value = false;
  }
}

function computeNextLevel() {
  const formation = selectedFormation.value;
  if (!formation) {
    return { label: 'Niveau suivant', nextLevelLabel: 'Niveau suivant', isMaxLevel: true, isSingleLevel: true, isUnselectedChoice: false };
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

  // Priority 1: match by numeric order (stored by startP3)
  if (prevLevelOrder > 0) {
    prevIdx = sortedLevels.findIndex(l => (l.order || 0) === prevLevelOrder);
  }

  // Priority 2: match by stop level text across ALL previous propositions
  // We ALWAYS check text history to see if it contains a HIGHER level than Priority 1
  const allHistory = (prevRecs + ' & ' + prevStopLevel);
  const historyCode = extractLevelCode(allHistory);
  if (prevRecs) {
    const recs = prevRecs.split('&').map(r => r.trim());
    const formClean = clean(formation.label);
    
    let highestFoundIdx = -1;
    for (const rec of recs) {
      const recClean = clean(rec);
      // Check if this recommendation belongs to the current formation
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
    // Only override if we found a HIGHER index in the text history
    if (highestFoundIdx > prevIdx) {
      prevIdx = highestFoundIdx;
    }
  }

  // Fallback to stop level text matching
  const prevStopLevel2 = localStorage.getItem('p3_prev_stop_level') || '';
  const findInText = (text) => {
    if (!text) return -1;
    const tClean = clean(text);
    return sortedLevels.findIndex(l => {
      const lClean = clean(l.label);
      return tClean === lClean || tClean.includes(lClean) || lClean.includes(tClean);
    });
  };

  const stopIdx = findInText(prevStopLevel2);
  if (stopIdx > prevIdx) prevIdx = stopIdx;

  if (prevIdx === -1 && historyCode) {
      const codeIdx = sortedLevels.findIndex(l => {
          const lCode = extractLevelCode(l.label);
          return lCode && lCode === historyCode;
      });
      if (codeIdx > prevIdx) prevIdx = codeIdx;
  }

  // The next level is simply prevIdx + 1
  const nextIdx = prevIdx + 1;

  // Check if formation has a configured maxLevelOrder
  const configuredMaxLevel = formation.maxLevelOrder !== null && formation.maxLevelOrder !== undefined ? formation.maxLevelOrder : null;
  
  // Use configured max level if available, otherwise use total levels count
  const maxLevelThreshold = configuredMaxLevel !== null ? configuredMaxLevel : sortedLevels.length;
  const isMaxLevel = nextIdx >= maxLevelThreshold;
  
  const targetIdx = Math.min(nextIdx, sortedLevels.length - 1);
  const nextLevel = sortedLevels[targetIdx];

  // ── RULE-BASED LABELING ──
  // Find the parcours rule whose formation1 or formation2 contains the target level
  const cleanR = (s) => (s || '').toLowerCase().trim();
  const nextLevelClean = cleanR(nextLevel.label);
  
  let displayLabel = `${formation.label} - ${nextLevel.label}`;
  let finalRecommendation = displayLabel;
  let parcoursTitle = "";
  let explanationMessage = "";
  
  const matchedRule = allParcoursRules.value.find(r => {
    // Match by formation ID or EXACT label
    const isTargetForm = (r.formationId && Number(r.formationId) === Number(formation.id)) || 
                         (r.formation && r.formation.trim().toLowerCase() === formation.label.trim().toLowerCase());
    if (!isTargetForm) return false;

    // Check if the target level appears in formation1 or formation2 OUTPUT labels
    const f1Clean = cleanR(r.formation1);
    const f2Clean = cleanR(r.formation2);
    return f1Clean.includes(nextLevelClean) || f2Clean.includes(nextLevelClean);
  });

  if (matchedRule) {
    parcoursTitle = getSessionParcoursTitle(
      { parcoursTitle: matchedRule.parcoursTitle, formationChoisie: formation.label },
      formation.label,
    );
    explanationMessage = matchedRule.explanationMessage || "";
    // Pick the output label that matches the target level
    const f1Clean = cleanR(matchedRule.formation1);
    const f2Clean = cleanR(matchedRule.formation2);
    if (f1Clean.includes(nextLevelClean)) {
      finalRecommendation = matchedRule.formation1;
    } else if (f2Clean.includes(nextLevelClean)) {
      finalRecommendation = matchedRule.formation2;
    }
    displayLabel = parcoursTitle || finalRecommendation;
  } else {
    // Do not invent a P3 parcours that is not configured in active rules.
    const message = "Aucun parcours actif ne correspond à cette progression.";
    return {
      label: message,
      finalRecommendation: "",
      parcoursTitle: "",
      explanationMessage: "",
      nextLevelLabel: message,
      nextLevelOrder: nextLevel.order,
      isMaxLevel: true,
      isSingleLevel: false,
      isUnselectedChoice: false,
      noConfiguredParcours: true
    };
  }

  return {
    label: displayLabel,
    finalRecommendation,
    parcoursTitle,
    explanationMessage,
    nextLevelLabel: nextLevel.label,
    nextLevelOrder: nextLevel.order,
    isMaxLevel,
    isSingleLevel: false,
    isUnselectedChoice: false,
    noConfiguredParcours: false
  };
}

async function confirmP3SameFormation() {
  showP3SameFormationModal.value = false;
  submitting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    
    let finalRec = p3NextFinalRecommendation.value || p3NextLevelLabel.value;
    let finalStopLevel = p3NextLevelLabelRaw.value;
    let finalStopLevelOrder = p3NextLevelOrder.value;
    let finalParcoursTitle = p3NextParcoursTitle.value;
    let finalExplanation = p3NextExplanation.value;
    
    if (p3IsUnselectedChoice.value && p3SelectedRemainingChoice.value) {
      finalRec = p3SelectedRemainingChoice.value;
      finalStopLevel = p3SelectedRemainingChoice.value;
      finalParcoursTitle = "";
      finalExplanation = "";
      // Use the order from the selected choice if available, otherwise fallback to history
      const choiceObj = p3UnselectedChoicesListWithOrder.value.find(c => c.label === finalRec);
      finalStopLevelOrder = choiceObj ? choiceObj.order : Number(localStorage.getItem('p3_prev_level_order') || 0);
    }
    
    // Save the formation choice with p3SkipQuiz flag and pre-set recommendation
    const payload = {
      formationChoisie: selectedFormation.value.label,
      isP3Mode: true,
      p3SkipQuiz: true,
      finalRecommendation: finalRec,
      stopLevel: finalStopLevel,
      stopLevelOrder: finalStopLevelOrder,
    };
    if (finalParcoursTitle) payload.parcoursTitle = finalParcoursTitle;
    if (finalExplanation) payload.explanationMessage = finalExplanation;
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);
    // Submit (finalize) the session - backend will use pre-set values
    await axios.post(`${apiBaseUrl}/sessions/${sessionId}/submit`);
    
    router.push('/validation');
  } catch (error) {
    console.error('Failed to confirm P3 same formation:', error);
    toast.error('Erreur lors de la validation du P3.');
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
  bureautique: { 
    color: '#3b82f6', 
    bg: '#eff6ff', 
    accent: '#2563eb', 
    accentBg: '#f8faff' 
  },
  langues: {
    color: '#f59e0b', 
    bg: '#fffbeb', 
    accent: '#d97706', 
    accentBg: '#fffdf5' 
  },
  creation: { 
    color: '#10b981', 
    bg: '#ecfdf5', 
    accent: '#059669', 
    accentBg: '#f9fffb' 
  },
  internet: { 
    color: '#8b5cf6', 
    bg: '#f5f3ff', 
    accent: '#7c3aed', 
    accentBg: '#faf9ff' 
  }
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
// NOTE: In P3 mode, formations are already filtered by the backend via
// /sessions/:id/available-formations-with-p3 which applies P3 rules correctly
// (respecting levelOperator gte/lte and checking previous sessions history).
// Do NOT re-filter here to avoid double-filtering with potentially wrong logic.
const sections = computed(() => {
  const map = new Map(groupedFormations.value.map((g) => [g.category, g.items]));

  // No frontend filtering needed - backend already applied P3 rules
  const getItems = (cat) => map.get(cat) || [];

  const bureauItems = getItems('bureautique');
  const microsoft = bureauItems.filter(f => {
    const l = f.label.toLowerCase();
    return l.includes('microsoft') || l.includes('office') || l.includes('word') || l.includes('excel') || l.includes('ppt') || l.includes('powerpoint') || l.includes('outlook');
  });
  const google = bureauItems.filter(f => f.label.toLowerCase().includes('google'));

  const langs = getItems('anglais-francais');
  const creation = getItems('illustration');
  const ia = getItems('ia-generative');
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
  const digcompGroup = getItems('digcomp-google-wordpress');

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
      
        <div class="text-center relative">
          <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
          <h1 class="text-4xl md:text-5xl font-black text-[#0d1b3e] mb-4 tracking-tight">
            {{ store.isP3Mode ? 'Choisissez votre 3ème formation' : 'Quelle formation souhaitez-vous suivre ?' }}
          </h1>
          <p class="text-gray-500 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            {{ store.isP3Mode ? 'Sélectionnez un parcours complémentaire (1 seul parcours)' : 'Faites votre choix ci-dessous :' }}
          </p>
        </div>

        <!-- P3 Banner: Previous Parcours -->
        <div v-if="store.isP3Mode && (p3SummaryTitle || p3ParcoursItems.length > 0) && (p3OverrideMatchedRule?.formationEntity?.enableP3ManualChoice !== false)" 
             class="mt-10 bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-white shadow-2xl shadow-blue-500/5 relative overflow-hidden group">
          <!-- Decorative elements -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
          
          <div class="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            <div class="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <span class="material-icons-outlined text-3xl">history_edu</span>
            </div>
            
            <div class="flex-1 text-center md:text-left">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4">Récapitulatif de vos parcours</p>
              
              <h2 v-if="p3SummaryTitle" class="text-xl md:text-2xl font-black text-[#0d1b3e] tracking-tight mb-4">
                {{ p3SummaryTitle }}
              </h2>

              <div class="flex flex-wrap justify-center md:justify-start gap-4">
                <div v-for="(rec, idx) in p3ParcoursItems" :key="idx" 
                     class="bg-white px-5 py-3 rounded-2xl border border-gray-50 shadow-sm flex items-center gap-3 hover:translate-y-[-2px] transition-transform">
                  <span class="flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black text-white" 
                        :style="{ backgroundColor: idx === 0 ? '#305364' : '#ebb872' }">
                    P{{ idx + 1 }}
                  </span>
                  <span class="text-sm font-black text-[#0d1b3e]">{{ rec }}</span>
                </div>
              </div>
              
              <div class="mt-6 flex items-center justify-center md:justify-start gap-2 text-gray-400">
                <span class="material-icons-outlined text-sm">info</span>
                <p class="text-xs font-bold italic">Sélectionnez votre 3ème parcours parmi les formations ci-dessous.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="bg-white rounded-4xl p-6 md:p-12 shadow-xl border border-white">
        <div v-if="store.isP3Mode && (p3OverrideMatchedRule?.formationEntity?.enableP3ManualChoice === false)" class="p-8 text-center">
          <p class="text-lg font-black text-[#0d1b3e]">Veuillez patienter, affichage des parcours disponibles...</p>
          <p class="text-sm text-gray-500 mt-2">Chargement en cours...</p>
          <div class="mt-4 flex items-center justify-center">
            <!-- <button @click="showP3OverrideModal = true" class="px-6 py-2 bg-[#ebb872] text-[#305364] font-black uppercase tracking-widest text-xs rounded-xl shadow-md hover:brightness-105">Voir les choix imposés</button> -->
          </div>
        </div>
        <div v-else class="space-y-12">
          <div v-for="section in sections" :key="section.key" class="space-y-6">
            <div class="flex items-center gap-4 mb-8">
              <div class="h-8 w-1.5 rounded-full" :style="{ backgroundColor: section.style?.color || '#3b82f6' }"></div>
              <h3 class="text-xl font-black text-[#0d1b3e] uppercase tracking-tight">
                {{ section.title }}
              </h3>
            </div>

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
            class="px-10 py-4 bg-[#ebb872] hover:brightness-105 text-[#305364] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#ebb872]/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 cursor-pointer"
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
            class="px-8 py-3.5 font-black uppercase tracking-widest text-xs rounded-xl shadow-2xl transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-40 shrink-0 cursor-pointer"
            style="background-color: #ebb872; color: #305364; boxShadow: 0 12px 24px -6px #ebb87260"
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
          <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner', p3IsMaxLevel ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500']">
            <span class="material-icons-outlined text-3xl">{{ p3IsMaxLevel ? 'block' : 'trending_up' }}</span>
          </div>
          
          <h2 class="text-xl font-black text-center text-[#305364] mb-3 uppercase tracking-tight">{{ p3IsSingleLevel ? 'Formation à parcours unique' : 'Formation sélectionnée' }}</h2>
          <p class="text-gray-600 font-medium text-center mb-2 leading-relaxed">
            Vous avez choisi <strong class="text-[#305364]">{{ p3SameFormationLabel }}</strong><span v-if="!p3IsSingleLevel"> pour votre 3ème parcours</span>.
          </p>
          
          <template v-if="p3IsSingleLevel">
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mb-4">
              <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Parcours unique disponible</p>
              <p class="text-lg font-black text-amber-700">{{ p3NextLevelLabel }}</p>
            </div>
            <p class="text-amber-600 font-medium text-sm text-center mb-6">
              Cette formation ne propose qu'un seul niveau. Vous l'avez déjà suivi lors d'un parcours précédent. Veuillez choisir une formation différente pour votre 3ème parcours.
            </p>
          </template>

          <template v-else-if="!p3IsMaxLevel">
            <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center mb-4">
              <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                {{ p3IsUnselectedChoice ? 'Option restante attribuée' : 'Parcours attribué automatiquement' }}
              </p>
              
              <!-- Selection mode if multiple unselected choices -->
              <div v-if="p3IsUnselectedChoice && p3UnselectedChoicesList.length > 1" class="flex flex-col gap-2 mt-2">
                <p class="text-xs text-blue-800 font-bold mb-2">Veuillez choisir votre prochaine spécialité :</p>
                <label 
                  v-for="choice in p3UnselectedChoicesList" 
                  :key="choice"
                  class="flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all bg-white"
                  :class="p3SelectedRemainingChoice === choice ? 'border-[#ebb872] shadow-md' : 'border-slate-100 hover:border-blue-200 shadow-sm'"
                >
                  <span class="font-black text-[#305364] text-sm">{{ choice }}</span>
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all" 
                       :class="p3SelectedRemainingChoice === choice ? 'border-[#ebb872] bg-[#ebb872]' : 'border-slate-200'">
                    <span v-if="p3SelectedRemainingChoice === choice" class="material-icons-outlined text-[12px] text-[#305364] font-black">check</span>
                  </div>
                  <input 
                    type="radio" 
                    :value="choice" 
                    v-model="p3SelectedRemainingChoice"
                    class="hidden"
                  />
                </label>
              </div>
              
              <!-- Simple text mode (single choice or standard next level) -->
              <div v-else class="space-y-2">
                <p class="text-xl font-black text-[#305364] leading-tight">
                  {{ p3AutoParcoursTitle }}
                </p>
                <p v-if="p3AutoFormationDetail" class="text-sm font-black text-blue-700 leading-tight">
                  {{ p3AutoFormationDetail }}
                </p>
              </div>
            </div>
            <p class="text-gray-400 font-bold italic text-[11px] text-center mb-6">
              Aucun test supplémentaire n'est nécessaire.
            </p>
          </template>
          
          <template v-else-if="p3NoConfiguredParcours">
            <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
              <p class="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Aucun parcours actif configuré</p>
              <p class="text-lg font-black text-red-700">{{ p3NextLevelLabel }}</p>
            </div>
            <p class="text-red-500 font-medium text-sm text-center mb-6">
              Cette proposition n'existe pas dans la liste des parcours actifs. Veuillez choisir une autre formation ou ajouter le parcours correspondant dans le back office.
            </p>
          </template>

          <template v-else>
            <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
              <p class="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Niveau Maximum Atteint</p>
              <p class="text-lg font-black text-red-700">{{ p3NextLevelLabel }}</p>
            </div>
            <p class="text-red-500 font-medium text-sm text-center mb-6">
              Vous avez déjà atteint le niveau maximum disponible pour cette formation. Veuillez sélectionner une formation différente pour votre 3ème parcours.
            </p>
          </template>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="showP3SameFormationModal = false" :class="['flex-1 py-4 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all', (p3IsMaxLevel || p3IsSingleLevel) ? 'bg-[#305364] text-white hover:brightness-110' : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
              {{ (p3IsMaxLevel || p3IsSingleLevel) ? 'Changer de formation' : 'Annuler' }}
            </button>
            <button v-if="!p3IsMaxLevel && !p3IsSingleLevel" @click="confirmP3SameFormation" :disabled="submitting" class="flex-1 py-4 px-4 bg-[#ebb872] text-[#305364] hover:brightness-105 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-[#ebb872]/20 disabled:opacity-50 cursor-pointer">
              <span v-if="submitting" class="material-icons-outlined animate-spin text-sm mr-1">sync</span>
              Valider mon parcours P3
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- P3 Override Section (Admin-configured forced choices by formation and level) -->
    <div v-if="p3OverrideEnabled && p3OverrideMatchedRule" class="fixed bottom-0 left-0 right-0 bg-white border-t-2 shadow-2xl z-[70] p-4 md:p-6" :style="{ borderColor: selectedAccent.accent + '40', backgroundColor: selectedAccent.accentBg || '#eff6ff' }">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
            <span class="material-icons-outlined text-2xl">auto_awesome</span>
          </div>
          <div class="flex-1">
            <p class="text-[10px] font-black uppercase tracking-[0.2em]" :style="{ color: selectedAccent.accent }">3ème Parcours</p>
            <h3 class="text-lg md:text-xl font-black text-[#0D1B3E]">Choix recommandé</h3>
          </div>
        </div>
        
        <div class="space-y-3 mb-4">
          <!-- Special UI for testFormations: show large side-by-side choice buttons -->
          <template v-if="p3OverrideMatchedRule?.testFormations && (Array.isArray(p3OverrideMatchedRule.testFormations) ? p3OverrideMatchedRule.testFormations.length > 0 : Object.keys(p3OverrideMatchedRule.testFormations).length > 0)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                v-for="option in p3OverrideChoiceOptions"
                :key="option.label"
                @click="p3OverrideSelectedChoice = option.label"
                :class="p3OverrideSelectedChoice === option.label ? 'border-2 shadow-xl transform scale-[1.02]' : 'border-2 hover:shadow-lg hover:scale-[1.01]'"
                class="p-4 md:p-5 rounded-xl font-black text-sm md:text-base text-[#0d1b3e] flex items-center justify-center gap-3 transition-all bg-white"
                :style="{ 
                  borderColor: p3OverrideSelectedChoice === option.label ? selectedAccent.accent : selectedAccent.accent + '30',
                  boxShadow: p3OverrideSelectedChoice === option.label ? `0 10px 30px -5px ${selectedAccent.accent}40` : 'none'
                }"
              >
                <span class="material-icons-outlined text-xl md:text-2xl" :style="{ color: selectedAccent.accent }">school</span>
                <span class="text-center">{{ option.label }}</span>
                <div v-if="p3OverrideSelectedChoice === option.label" class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
                  <span class="material-icons-outlined text-sm">check</span>
                </div>
              </button>
            </div>
          </template>
          <template v-else>
            <label
              v-for="option in p3OverrideChoiceOptions"
              :key="option.label"
              class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white"
              :class="p3OverrideSelectedChoice === option.label ? 'border-2 shadow-lg transform scale-[1.01]' : 'border-2 hover:shadow-lg hover:scale-[1.01]'"
              :style="{ 
                borderColor: p3OverrideSelectedChoice === option.label ? selectedAccent.accent : selectedAccent.accent + '30',
                boxShadow: p3OverrideSelectedChoice === option.label ? `0 10px 30px -5px ${selectedAccent.accent}40` : 'none'
              }"
            >
              <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0" :style="{ borderColor: selectedAccent.accent, backgroundColor: p3OverrideSelectedChoice === option.label ? selectedAccent.accent : 'white' }">
                <div v-if="p3OverrideSelectedChoice === option.label" class="w-3 h-3 rounded-full bg-white"></div>
              </div>
              <div class="flex-1">
                <span class="text-sm md:text-base font-black text-[#0d1b3e]">{{ option.label }}</span>
              </div>
              <div v-if="p3OverrideSelectedChoice === option.label" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
                <span class="material-icons-outlined text-sm">check</span>
              </div>
            </label>
          </template>
        </div>
        
        <div class="flex gap-3">
          <button v-if="p3OverrideAllowManual && (p3OverrideMatchedRule?.formationEntity?.enableP3ManualChoice !== false)" @click="skipP3Override" class="py-3 px-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all">
            Choisir manuellement
          </button>
          <button 
            @click="confirmP3Override" 
            :disabled="!p3OverrideSelectedChoice || submitting"
            class="flex-1 py-3 px-4 bg-[#ebb872] text-[#305364] hover:brightness-105 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#ebb872]/20 transition-all disabled:opacity-50"
          >
            {{ submitting ? 'Validation...' : 'Valider ce choix' }}
          </button>
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
  gap: 1rem;
  padding: 1.5rem;
  min-height: 5.5rem;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.formation-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: #e2e8f0;
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
  color: #3b82f6; /* blue-600 */
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
  border-color: #3b82f6; /* blue-600 */
  background: white;
}

.formation-card--selected .formation-card__radio-dot {
  background: #3b82f6; /* blue-600 */
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

