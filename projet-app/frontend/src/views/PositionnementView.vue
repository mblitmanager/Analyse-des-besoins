<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions, clearHiddenResponses } from "../utils/conditionalQuestions";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import HighLevelAlertModal from "../components/HighLevelAlertModal.vue";
import WorkflowProgressBar from '../components/WorkflowProgressBar.vue';

// Display helper: strips the letter prefix (e.g. "A1 - Revoir les bases" => "Revoir les bases")
function displayLevel(label) {
  if (!label) return '';
  if (label.includes(' - ')) return label.split(' - ').slice(1).join(' - ').trim();
  return label;
}

const store = useAppStore();
const router = useRouter();

const currentLevelIndex = ref(0);
const levels = ref([]); // loaded dynamically from API
const questions = ref([]);
const allQuestions = ref([]); // Store all questions before filtering
const currentResponses = ref({});
const loading = ref(true);
const submitting = ref(false);

const formationSlug = localStorage.getItem("selected_formation_slug");
const formationLabel = localStorage.getItem("selected_formation_label");
const sessionId = localStorage.getItem("session_id");

const levelsScores = ref({});
const parcoursRuleHadPrereqCondition = ref(false);
const positionnementAnswers = ref({});
const prerequisiteAnswers = ref({}); // Réponses aux questions prérequis (étape précédente)
const prereqQuestionsCache = ref([]); // Cache des questions prérequis pour résoudre texte → index
const showResults = ref(false);
const finalRecommendation = ref("");
const p3Redirected = ref(false);
const submitting = ref(false);
const currentQuestionIndex = ref(0);
const showHighLevelAlert = ref(false);
const highLevelValidated = ref("");

// High level alert settings
const alertSettings = ref({
  formations: [],
  thresholdOrder: 2
});

// Low score warning modal
const showFormationWarning = ref(false);
const allowSkip = ref(true); // admin toggle for skipping this step
const lowScoreThreshold = ref(3); // default: warn if < 3 correct answers
const lastScoreDetails = ref({ correctCount: 0, total: 0 });
const skipFormationWarning = ref(false);
const formation = ref(null);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Computed: filter questions based on conditional logic
const levelContent = computed(() => {
  const messages = [
    {
      title: "Comment fonctionne ce test ?",
      text: `Ce test est adaptatif. Il commence par le niveau <strong>${displayLevel(levels.value[0]?.label)}</strong>. Si vous réussissez ce bloc, vous passerez au niveau supérieur pour une évaluation plus précise. L'objectif est de trouver le parcours qui vous correspond le mieux.`
    },
    {
      title: "Bravo, vous progressez !",
      text: `Vous avez validé l'étape initiale. Passons maintenant au niveau <strong>${displayLevel(levels.value[1]?.label)}</strong> pour consolider vos acquis.`
    },
    {
      title: "Excellent début !",
      text: `Vos bases sont solides. Nous évaluons maintenant votre capacité à être <strong>opérationnel</strong> sur des tâches courantes.`
    },
    {
      title: "En route vers la maîtrise",
      text: `Vous démontrez de réelles compétences. Le niveau <strong>${displayLevel(levels.value[3]?.label)}</strong> va nous permettre d'identifier vos futurs points de perfectionnement.`
    },
    {
      title: "Vers l'expertise",
      text: `Vous atteignez un niveau avancé ! Ce bloc <strong>${displayLevel(levels.value[4]?.label)}</strong> vise à confirmer votre autonomie complète.`
    },
    {
      title: "Le sommet approche",
      text: `Vos résultats sont impressionnants. Nous testons maintenant vos compétences d'<strong>expert</strong>.`
    },
    {
      title: "Maîtrise totale",
      text: `Dernière étape ! Ce bloc final va valider l'étendue de votre <strong>expertise</strong>.`
    }
  ];
  return messages[currentLevelIndex.value] || { title: "Bravo, vous progressez !", text: `Vous avez validé l'étape précédente. Nous allons maintenant évaluer vos compétences pour le niveau <strong>${displayLevel(levels.value[currentLevelIndex.value]?.label)}</strong> afin d'affiner votre programme de formation.` };
});

const filteredQuestions = computed(() => {
  return filterConditionalQuestions(questions.value, currentResponses.value);
});

const shouldShowAlert = computed(() => {
  return filterConditionalQuestions(questions.value, currentResponses.value);
});

async function loadLevels() {
  try {
    const res = await axios.get(
      `${apiBaseUrl}/formations/${formationSlug}/levels`,
    );
    if (res.data && res.data.length > 0) {
      levels.value = res.data.filter(l => l.isActive !== false); // Keep only active levels
    } else {
      levels.value = [];
    }
  } catch {
    levels.value = [];
  }
}

async function loadFormation() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations/${formationSlug}`);
    formation.value = res.data;
  } catch (error) {
    console.error("Failed to load formation details:", error);
  }
}

async function restoreProgressFromSession() {
  try {
    const res = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const session = res.data;

    if (session.levelsScores && Object.keys(session.levelsScores).length > 0) {
      levelsScores.value = session.levelsScores;
    } else if (store.isP3Mode) {
      // Fresh start of P2 in P3 mode: Check if we should carry over progress
      const prevFormation = localStorage.getItem('p3_prev_formation');
      const prevOrder = Number(localStorage.getItem('p3_prev_level_order') || 0);

      // Same formation: start AFTER previous results
      if (prevFormation === formationLabel && localStorage.getItem('p3_prev_level_order') !== null) {
        // Pre-validate dummy entries for previously achieved levels
        levels.value.forEach((lvl, idx) => {
          if (idx < prevOrder) {
            levelsScores.value[lvl.label] = {
              score: 10,
              total: 10,
              percentage: 100,
              validated: true,
              isP3CarryOver: true
            };
          }
        });
        currentLevelIndex.value = Math.min(prevOrder, levels.value.length - 1);
        
        // Cleanup P3 storage to avoid reuse if refreshed
        localStorage.removeItem('p3_prev_formation');
        localStorage.removeItem('p3_prev_level_order');
      }
    }

    // Charger les réponses prérequis depuis la session (indépendant des levelsScores)
    // Sauvegardées sous "prerequisiteScore" par PrerequisView
    if (session.prerequisiteScore && Object.keys(session.prerequisiteScore).length > 0) {
      prerequisiteAnswers.value = session.prerequisiteScore;
    }

    // If session is already finalized on backend, show results directly
    if (session.finalRecommendation && session.stopLevel) {
      finalRecommendation.value = session.finalRecommendation;
      showResults.value = true;
      return;
    }

    // Determine current level index from existing levelsScores (for normal restoration)
    if (Object.keys(levelsScores.value).length > 0 && Array.isArray(levels.value) && levels.value.length) {
      let lastValidatedIndex = -1;
      levels.value.forEach((lvl, idx) => {
        const entry = levelsScores.value[lvl.label];
        if (entry && entry.validated) {
          lastValidatedIndex = idx;
        }
      });

      if (lastValidatedIndex >= 0) {
        // Start at the level after the last validated one
        if (lastValidatedIndex < levels.value.length - 1) {
          currentLevelIndex.value = lastValidatedIndex + 1;
        } else {
          currentLevelIndex.value = lastValidatedIndex;
        }
      }
    }
  } catch (error) {
    console.error("Failed to restore positioning progress from session:", error);
  }
}

async function loadLevelQuestions() {
  loading.value = true;
  try {
    if (!levels.value || levels.value.length === 0) {
      // No levels defined for this formation
      if (allowSkip.value) {
        const nextRoute = await store.getNextRouteWithQuestions("/positionnement");
        router.push(nextRoute || "/resultats");
      } else {
        loading.value = false;
        alert("Aucun niveau défini pour cette formation.");
      }
      return;
    }
    const fetchQuestionsForLevel = async (levelLabel) => {
      const response = await axios.get(`${apiBaseUrl}/questions/positionnement`, {
        params: {
          formation: formationSlug,
          niveau: levelLabel,
        },
      });
      const allQuestions = response.data || [];
      // Deduplicate by text (case-insensitive) just in case
      const seen = new Set();
      return allQuestions.filter((q) => {
        const key = (q.text || "").trim().toLowerCase();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Try current level; if empty at the start, seek the first level that has questions
    let nextIndex = currentLevelIndex.value;
    let fetched = await fetchQuestionsForLevel(levels.value[nextIndex]?.label);
    if (fetched.length === 0 && currentLevelIndex.value === 0) {
      for (let i = 1; i < levels.value.length; i++) {
        const attempt = await fetchQuestionsForLevel(levels.value[i]?.label);
        if (attempt.length > 0) {
          nextIndex = i;
          fetched = attempt;
          break;
        }
      }
      if (nextIndex !== currentLevelIndex.value) {
        currentLevelIndex.value = nextIndex;
      }
    }

    questions.value = fetched;

    const initialResponses = {};
    questions.value.forEach((q) => {
      if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
        initialResponses[q.id] = [];
      } else if (q.metadata?.type === "radio_toggle") {
        initialResponses[q.id] = "Non";
      } else if (
        q.metadata?.type === "qcm" ||
        q.responseType === "qcm" ||
        q.options?.length > 0
      ) {
        initialResponses[q.id] = null;
      } else {
        initialResponses[q.id] = "";
      }
    });
    currentResponses.value = initialResponses;

    // Auto-skip or finish if no questions found for this level (and no further levels have questions)
    if (questions.value.length === 0) {
      if (currentLevelIndex.value === 0) {
        if (allowSkip.value) {
          const nextRoute = await store.getNextRouteWithQuestions("/positionnement");
          router.push(nextRoute || "/resultats");
          return;
        } else {
          alert(
            "Aucune question de positionnement pour cette formation. Vous pouvez continuer.",
          );
        }
      } else {
        // We reached an empty level AFTER doing some levels.
        // Finish the test based on previous data.
        await finishTest();
        return;
      }
    }

    currentQuestionIndex.value = 0; // Reset question index for new level
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Failed to load level questions:", error);
    alert("Erreur lors du chargement des questions.");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!sessionId || !formationSlug) {
    router.push("/");
    return;
  }
  await loadFormation();
  await loadLevels();
  await restoreProgressFromSession();
  await fetchPaginationSetting();
  await fetchLowScoreThreshold();
  await fetchSkipSetting();
  await fetchPrereqQuestionsCache();
  await fetchAlertSettings();
  // ensure workflow is loaded
  if (store.workflowSteps.length === 0 || store.actualWorkflowSteps.length === 0) {
    await store.updateActualWorkflow();
  }
  if (!showResults.value) {
    await loadLevelQuestions();
  }
});

async function fetchPaginationSetting() {
  try {
    const res = await axios.get(`${apiBaseUrl}/settings/POSITIONNEMENT_PAGINATED`);
    isPaginated.value = res.data?.value === 'true';
  } catch (error) {
    console.error("Failed to fetch pagination setting:", error);
    isPaginated.value = false;
  }
}
async function fetchLowScoreThreshold() {
  try {
    const res = await axios.get(`${apiBaseUrl}/settings/LOW_SCORE_THRESHOLD`);
    // Default to 3 if not set or invalid
    const value = Number(res.data?.value);
    lowScoreThreshold.value = !isNaN(value) ? value : 3;
  } catch (error) {
    console.error("Failed to fetch low score threshold:", error);
    lowScoreThreshold.value = 3; // fallback
  }
}
async function fetchSkipSetting() {
  const value = await store.fetchSetting('AUTO_SKIP_POSITIONNEMENT');
  // Default to true unless explicitly set to 'false'
  allowSkip.value = value !== 'false';
}

async function fetchPrereqQuestionsCache() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: formationSlug ? { scope: 'auto', formation: formationSlug } : { scope: 'global' },
    });
    prereqQuestionsCache.value = res.data || [];
  } catch (error) {
    console.warn('[Parcours] Impossible de charger le cache des questions prérequis:', error);
    prereqQuestionsCache.value = [];
  }
}
async function fetchAlertSettings() {
  try {
    const [formsRes, thresholdRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/settings/HIGH_LEVEL_ALERT_FORMATIONS`),
      axios.get(`${apiBaseUrl}/settings/HIGH_LEVEL_THRESHOLD_ORDER`)
    ]);
    
    if (formsRes.data?.value) {
      alertSettings.value.formations = formsRes.data.value.split(',').map(s => s.trim());
    }
    if (thresholdRes.data?.value) {
      alertSettings.value.thresholdOrder = parseInt(thresholdRes.data.value) || 2;
    }
  } catch (error) {
    console.warn("Failed to fetch high level alert settings:", error);
  }
}
async function nextStep() {
  submitting.value = true;
  try {
    // 1. Calculate score for current level (using filtered questions only)
    let correctCount = 0;
    const currentLevel = levels.value[currentLevelIndex.value];

    // Stocker les réponses de ce niveau dans un objet par niveau
    if (!positionnementAnswers.value[currentLevel.label]) {
      positionnementAnswers.value[currentLevel.label] = {};
    }

    // Score only on filtered (displayed) questions
    filteredQuestions.value.forEach((q) => {
      const answer = currentResponses.value[q.id];
      positionnementAnswers.value[currentLevel.label][q.id] = answer;

      if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
        // Multi-select: compare selected options against correctResponseIndexes
        if (Array.isArray(answer) && Array.isArray(q.correctResponseIndexes)) {
          const correctOptions = q.correctResponseIndexes.map(i => q.options[i]).sort();
          const selectedSorted = [...answer].sort();
          if (
            correctOptions.length === selectedSorted.length &&
            correctOptions.every((v, i) => v === selectedSorted[i])
          ) {
            correctCount++;
          }
        }
      } else {
        // Single-choice (qcm): compare single answer against correct option
        if (answer === q.options[q.correctResponseIndex]) {
          correctCount++;
        }
      }
    });

    const percentage = (correctCount / filteredQuestions.value.length) * 100;

    const shouldWarn = !skipFormationWarning.value && 
                       (formation.value?.enableLowScoreWarning !== false) &&
                       currentLevelIndex.value === 0 && 
                       correctCount < lowScoreThreshold.value;

    if (shouldWarn) {
      lastScoreDetails.value = { correctCount, total: filteredQuestions.value.length };
      showFormationWarning.value = true;
      submitting.value = false;
      return; // Stop here, wait for user decision
    }

    // Sécurise le seuil : si le niveau demande plus de bonnes réponses que le nombre
    // de questions affichées, on considère le maximum possible.
    const requiredCorrect = Math.min(
      Number(currentLevel.successThreshold ?? filteredQuestions.value.length),
      filteredQuestions.value.length,
    );

    levelsScores.value[currentLevel.label] = {
      score: correctCount,
      total: filteredQuestions.value.length,
      percentage: percentage,
      requiredCorrect,
      validated: correctCount >= requiredCorrect,
    };

    // 2. Update session with scores so far
    let finalLevel = "Débutant";
    levels.value.forEach((l) => {
      if (levelsScores.value[l.label]?.validated) {
        finalLevel = l.label;
      }
    });

    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const patchRes = await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      levelsScores: levelsScores.value,
      lastValidatedLevel: finalLevel,
      positionnementAnswers: positionnementAnswers.value,
    });

    const session = patchRes.data;

    // Check for Rule Overrides (Absolute Priority)
    if (session.isQuestionRuleOverride) {
      if (session.ruleResultType === 'BLOCK') {
        // Stop everything and go to results
        router.push("/resultats");
        return;
      }
      // If it's just a message/recommendation, we might still finish the test early
      // depending on the rule. For now, let's treat any override during positionnement
      // as a reason to show results.
      await finishTest(session); 
      return;
    }

    // 3. Adaptive logic: check if transition to next level is allowed
    const canProgress = correctCount >= requiredCorrect;

    if (!canProgress || currentLevelIndex.value === levels.value.length - 1) {
      await finishTest();
    } else {
      // Go to next level
      currentLevelIndex.value++;
      await loadLevelQuestions();
    }
  } catch (error) {
    console.error("Failed to advance test:", error);
    alert("Erreur lors de la validation.");
  } finally {
    submitting.value = false;
  }
}

async function finishTest(overrideSession = null) {
  const currentLevel = levels.value[currentLevelIndex.value];
  
  if (overrideSession?.isQuestionRuleOverride) {
    // If a backend rule already decided the result, use it immediately
    let rec = overrideSession.recommendation || "";
    if (store.isP3Mode && rec) {
      const parts = rec.split(/\s*&\s*|\s*\|\s*|,/);
      if (parts.length > 0) rec = parts[0];
    }
    finalRecommendation.value = rec;
    showResults.value = true;
    submitting.value = false;
    return;
  }

  const ensureNiveau = (label) => {
    if (!label) return label;
    return label.toLowerCase().includes("niveau") ? label : `Niveau ${label}`;
  };

  // ── Try to use active parcours rules for the recommendation ──
  let usedParcoursRule = false;
  try {
    const rulesRes = await axios.get(`${apiBaseUrl}/parcours`);
    const allRules = rulesRes.data || [];
    // Filter rules for this formation that are active, ordered by their order field
    const formationRules = allRules
      .filter(r => {
        const matchesId = formation.value?.id && Number(r.formationId) === Number(formation.value.id);
        const matchesLabel = r.formation === formationLabel;
        return (matchesId || matchesLabel) && r.isActive !== false;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (formationRules.length > 0) {
      const stopLabel = currentLevel.label.toUpperCase();
      const cleanLabel = (l) => l.replace(/^Niveau\s+/i, '').trim().toUpperCase();

      const evaluateLevelCondition = (rule) => {
        const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
        if (condMatch) {
          const operator = condMatch[1].replace('<=', '≤').replace('>=', '≥');
          const targetStr = cleanLabel(condMatch[2]);
          const targetIdx = levels.value.findIndex((l) => cleanLabel(l.label) === targetStr);
          if (targetIdx === -1) return false;
          switch (operator) {
            case '=':  return currentLevelIndex.value === targetIdx;
            case '<':  return currentLevelIndex.value < targetIdx;
            case '≤':  return currentLevelIndex.value <= targetIdx;
            case '>':  return currentLevelIndex.value > targetIdx;
            case '≥':  return currentLevelIndex.value >= targetIdx;
            default:   return false;
          }
        }
        return cleanLabel(rule.condition).includes(cleanLabel(stopLabel));
      };


      // ── 2. Évalue les conditions prérequis d'une règle ──
      // prerequisiteAnswers contient { [questionId]: "texte de la réponse choisie" }
      // responseIndexes dans les règles sont des index dans q.options[]
      // → on retrouve l'index de la valeur texte pour comparer
      const evaluatePrereqConditions = (rule) => {
        if (!rule.requirePrerequisiteFailure) {
          return { matched: 0, total: 0, applicable: false };
        }

        const prereqConditions = rule.prerequisiteConditions || [];
        if (prereqConditions.length === 0) {
          return { matched: 1, total: 1, applicable: true };
        }

        const conditionResults = prereqConditions.map((cond) => {
          const userAnswerRaw = prerequisiteAnswers.value[cond.questionId];
          if (userAnswerRaw === undefined || userAnswerRaw === null) return false;

          if (!cond.responseIndexes || cond.responseIndexes.length === 0) return true;

          // Trouver la question pour accéder à ses options et convertir texte → index
          const question = prereqQuestionsCache.value.find(q => q.id === cond.questionId);

          // Résoudre l'index de la réponse utilisateur
          let userAnswerIndex = -1;
          if (question?.options?.length) {
            if (Array.isArray(userAnswerRaw)) {
              // Multi-select : vérifier si un des index sélectionnés est dans responseIndexes
              const selectedIndexes = userAnswerRaw.map(val => question.options.indexOf(val)).filter(i => i !== -1);
              return selectedIndexes.some(i => cond.responseIndexes.includes(i));
            } else {
              userAnswerIndex = question.options.indexOf(userAnswerRaw);
            }
          } else {
            // Pas de question en cache → fallback comparaison directe par index numérique
            userAnswerIndex = Number(userAnswerRaw);
          }

          return cond.responseIndexes.includes(userAnswerIndex);
        });

        const matched = conditionResults.filter(Boolean).length;
        const total = prereqConditions.length;

        if (rule.prerequisiteLogic === 'AND') {
          return matched === total
            ? { matched, total, applicable: true }
            : { matched: 0, total, applicable: false };
        } else {
          return matched > 0
            ? { matched, total, applicable: true }
            : { matched: 0, total, applicable: false };
        }
      };

      // ── 3. Score chaque règle ──
      // Une règle AVEC prérequis satisfaits est PLUS SPÉCIFIQUE qu'une règle sans prérequis.
      // → bonus de spécificité de 10 pour forcer sa priorité sur une règle générique
      const scoredRules = formationRules.map((rule) => {
        const levelOk = evaluateLevelCondition(rule);
        if (!levelOk) return { rule, score: 0, debug: 'niveau KO' };

        const prereq = evaluatePrereqConditions(rule);

        if (prereq.applicable === false && rule.requirePrerequisiteFailure) {
          // Règle exige des prérequis mais ils ne sont pas satisfaits → disqualifiée
          return { rule, score: 0, debug: 'prérequis KO' };
        }

        // Règle sans prérequis = score 2 (générique)
        // Règle avec prérequis satisfaits = score 2 + 10 (spécificité) + N conditions matched
        const specificityBonus = rule.requirePrerequisiteFailure ? 10 : 0;
        const score = 2 + specificityBonus + (prereq.matched || 0);
        return { rule, score, debug: `niveau OK${rule.requirePrerequisiteFailure ? ` + prérequis (${prereq.matched}/${prereq.total})` : ' sans prérequis'}` };
      });

      console.debug('[Parcours] Scoring des règles :', scoredRules.map(s => ({
        id: s.rule.id,
        condition: s.rule.condition,
        requirePrereq: s.rule.requirePrerequisiteFailure,
        score: s.score,
        debug: s.debug,
      })));

      // ── 4. Règle gagnante = score le plus élevé ──
      // En cas d'égalité → order le plus bas (déjà triées)
      const best = scoredRules
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      let matchedRule = best?.rule || null;

      // Fallback : aucune règle ne passe → dernière règle active
      if (!matchedRule) {
        console.debug('[Parcours] Aucune règle ne correspond, fallback sur la dernière règle active');
        matchedRule = formationRules[formationRules.length - 1];
      }

      if (matchedRule) {
        const f1 = matchedRule.formation1 || "";
        const f2 = matchedRule.formation2 || "";
        
        if (store.isP3Mode) {
            // P3 Mode: Skip history duplicates
            const prevRecs = localStorage.getItem('p3_prev_recommendations') || "";
            const cleanS = (s) => (s || '').toLowerCase().replace(/^(niveau|tosa|icdl|digcomp|anglais|français|francais)\s+/i, '').trim();
            const recs = prevRecs.split(/\s*&\s*|\s*\/\s*|\s*\|\s*/).map(r => r.trim()).filter(Boolean);
            
            const isProposed = (val) => {
                const vClean = cleanS(val);
                return recs.some(r => {
                    const rClean = cleanS(r);
                    const rWords = rClean.split(/[\s\-\']+/).filter(w => w.length > 1);
                    const vWords = vClean.split(/[\s\-\']+/).filter(w => w.length > 1);
                    return vWords.some(vw => rWords.includes(vw));
                });
            };

            if (isProposed(f1) && f2) {
                finalRecommendation.value = f2;
                p3Redirected.value = true;
            } else {
                finalRecommendation.value = f1;
            }
        } else {
            if (f2 && f1 !== f2) {
                finalRecommendation.value = `${f1} | ${f2}`;
            } else {
                finalRecommendation.value = f1;
            }
        }
        usedParcoursRule = true;
        // Track if the winning rule had a prerequisite condition
        parcoursRuleHadPrereqCondition.value = !!matchedRule.requirePrerequisiteFailure;
      }
    }
  } catch (error) {
    console.warn("Could not fetch parcours rules, using fallback logic:", error);
  }

  // ── Fallback: logic if no parcours rules matched ──
  if (!usedParcoursRule) {
    let l1 = formationLabel || 'Parcours personnalisé';
    
    // Si on a des niveaux on tente de proposer le niveau validé ou le focus actuel
    if (levels.value && levels.value.length > 0) {
      let targetIdx = Math.min(Math.max(0, currentLevelIndex.value), levels.value.length - 1);
      
      if (store.isP3Mode) {
          const prevRecs = localStorage.getItem('p3_prev_recommendations') || "";
          const cleanS = (s) => (s || '').toLowerCase().replace(/^(niveau|tosa|icdl|digcomp|anglais|français|francais)\s+/i, '').trim();
          const recs = prevRecs.split(/\s*&\s*|\s*\/\s*|\s*\|\s*/).map(r => r.trim()).filter(Boolean);
          
          while (targetIdx < levels.value.length) {
              const currentLvl = levels.value[targetIdx];
              const lvlClean = cleanS(currentLvl.label);
              const isDuplicate = recs.some(r => {
                  const rClean = cleanS(r);
                  const rWords = rClean.split(/[\s\-\']+/).filter(w => w.length > 1);
                  const vWords = lvlClean.split(/[\s\-\']+/).filter(w => w.length > 1);
                  return vWords.some(vw => rWords.includes(vw));
              });
              if (!isDuplicate) break;
              targetIdx++;
          }
          if (targetIdx >= levels.value.length) targetIdx = levels.value.length - 1;
          
          if (targetIdx > Math.min(Math.max(0, currentLevelIndex.value), levels.value.length - 1)) {
              p3Redirected.value = true;
          }
      }
      
      l1 = ensureNiveau(levels.value[targetIdx].label);
    }
    
    finalRecommendation.value = l1;
  }

  // 2. Identify last validated level so far
  let finalLevelLabel = "Débutant";
  levels.value.forEach((l) => {
    if (levelsScores.value[l.label]?.validated) {
      finalLevelLabel = l.label;
    }
  });

  // 3. CHECK FOR HIGH LEVEL ALERT (Dynamic checking)
  let isHighLevel = false;
  
  const validatedLevelObj = levels.value.find(l => l.label === finalLevelLabel);

  if (validatedLevelObj) {
    // Determine the level of the proposed parcours dynamically
    const sortedLevelsDesc = [...levels.value].sort((a, b) => b.order - a.order);
    
    // Check if the user validated the highest possible level for this formation
    const isMaxLevel = sortedLevelsDesc.length > 0 && validatedLevelObj.order === sortedLevelsDesc[0].order;

    const proposedLevelObj = sortedLevelsDesc.find(l => {
      const rawLabel = l.label.toLowerCase();
      const cleanL = rawLabel.replace(/^niveau\s+/i, '').trim();
      const recText = finalRecommendation.value.toLowerCase();
      // Match whole words for short labels like A1, A2 to avoid substring mismatch
      if (cleanL.length <= 2) {
        const regex = new RegExp(`\\b${cleanL}\\b`, 'i');
        return regex.test(recText);
      }
      return recText.includes(rawLabel) || recText.includes(cleanL);
    });

    if (isMaxLevel || (proposedLevelObj && validatedLevelObj.order >= proposedLevelObj.order)) {
      isHighLevel = true;
    }

    // Fallback to legacy admin threshold if it couldn't be detected dynamically
    if (!isHighLevel && alertSettings.value.formations.length > 0) {
      const isTargetFormation = alertSettings.value.formations.some(f => 
        (formationLabel || "").toLowerCase().includes(f.toLowerCase()) ||
        (formationSlug || "").toLowerCase().includes(f.toLowerCase())
      );
      
      if (isTargetFormation && validatedLevelObj.order >= alertSettings.value.thresholdOrder) {
        isHighLevel = true;
      }
    }

    // NEVER trigger high level alert if they only validated the absolute first level (unless it's the only level)
    const isFirstLevel = sortedLevelsDesc.length > 0 && validatedLevelObj.order === sortedLevelsDesc[sortedLevelsDesc.length - 1].order;
    if (isFirstLevel && !isMaxLevel) {
      isHighLevel = false;
    }
  }

  if (isHighLevel && !showResults.value) {
    highLevelValidated.value = finalLevelLabel;
    showHighLevelAlert.value = true;
    submitting.value = false;
    // We update the session anyway so it's saved
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      levelsScores: levelsScores.value,
      finalRecommendation: finalRecommendation.value,
      stopLevel: currentLevel.label,
      lastValidatedLevel: finalLevelLabel,
      positionnementAnswers: positionnementAnswers.value,
    });
    return; // Stop here, modal will trigger showResults = true
  }

  // 4. Update session
  await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
    levelsScores: levelsScores.value,
    finalRecommendation: finalRecommendation.value,
    stopLevel: currentLevel.label,
    lastValidatedLevel: finalLevelLabel,
    positionnementAnswers: positionnementAnswers.value,
    parcoursRuleHadPrereqCondition: parcoursRuleHadPrereqCondition.value,
  });

  showResults.value = true;
  submitting.value = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleHighLevelContinue() {
  showResults.value = true;
  showHighLevelAlert.value = false;
}

function handleHighLevelChangeFormation() {
  router.push("/formations");
}

function finishStep() {
  const nextRoute = store.getNextRoute("/positionnement");
  router.push(nextRoute || "/complementary");
}
function closeAndChangeFormation() {
  showFormationWarning.value = false;
  router.push("/formations");
}

async function continueWithWarning() {
  skipFormationWarning.value = true;
  showFormationWarning.value = false;
  // Re-enter nextStep with the flag set to skip the warning
  await nextStep();
}

async function saveAndExit() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      levelsScores: levelsScores.value,
      positionnementAnswers: positionnementAnswers.value,
    });
    router.push("/");
  } catch (error) {
    console.error("Failed to save progress:", error);
    alert("Erreur lors de la sauvegarde.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader>
      <template #actions>
        <!-- <button
          @click="saveAndExit"
          :disabled="submitting"
          class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-bold text-sm text-blue-900 border border-white/30"
        >
          <span class="material-icons-outlined text-lg">save</span>
          {{ submitting ? "Sauvegarde..." : "Enregistrer et quitter" }}
        </button> -->
      </template>
    </SiteHeader>

    <main class="flex-1 max-w-5xl w-full mx-auto p-4 py-12 md:py-20">
      <!-- Section Résultats -->
      <div
        v-if="showResults"
        class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <!-- Progress Bar -->
        <WorkflowProgressBar customPath="/positionnement" />

        <div
          class="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl border border-white text-center"
        >
          <!-- <div
            class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-8 shadow-xl shadow-green-500/30"
          >
            <span class="material-icons-outlined text-5xl">task_alt</span>
          </div> -->

          <h1
            class="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight"
          >
        Félicitations!
          </h1>

          <p
            class="text-gray-400 text-lg md:text-xl mb-6 max-w-lg mx-auto leading-relaxed"
          >
            Voici votre parcours de formation recommandé :
          </p>

          <!-- P3 Redirection Message -->
          <div v-if="p3Redirected" class="max-w-2xl mx-auto mb-8 animate-in zoom-in duration-500">
            <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex items-center gap-5 text-left">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <span class="material-icons-outlined text-blue-600">auto_awesome</span>
              </div>
              <div>
                <h4 class="text-blue-900 font-black text-sm uppercase tracking-wider mb-1">Optimisation P3</h4>
                <p class="text-blue-700 text-sm font-medium leading-relaxed">
                  Certains niveaux ont été ignorés car ils font déjà partie de vos parcours précédents (P1/P2). 
                  Nous vous proposons directement le <strong>niveau supérieur</strong> pour compléter votre progression.
                </p>
              </div>
            </div>
          </div>

          <div class="inline-block px-10 py-6 bg-[#ebb973] border-2 border-brand-primary rounded-3xl mb-12 transform hover:scale-105 transition-transform duration-500">
            <!-- Parse steps (& separator) then alternatives (/ or OU) -->
            <template v-if="finalRecommendation">
              <div class="flex flex-col gap-3">
                <div
                  v-for="(step, stepIdx) in finalRecommendation.split(/\s*&\s*|\s*\|\s*/)"
                  :key="stepIdx"
                  class="flex items-center gap-3"
                >
                  <span class="flex-shrink-0 w-7 h-7 rounded-full bg-white/50 text-[#315264] text-xs font-black flex items-center justify-center">
                    {{ stepIdx + 1 }}
                  </span>
                  <div class="text-left">
                    <template v-for="(choice, ci) in step.split(/\s*\/\s*|\s+OU\s+/i)" :key="choice">
                      <span class="text-[#315264] font-black text-xl md:text-2xl tracking-tight">{{ choice.trim() }}</span>
                      <span v-if="ci < step.split(/\s*\/\s*|\s+OU\s+/i).length - 1" class="text-[#315264]/60 font-bold text-base mx-2">ou</span>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-16"
          >
            <div
              v-for="(score, level) in levelsScores"
              :key="level"
              class="flex items-center justify-between p-5 rounded-2xl border-2 transition-all"
              :class="
                score.validated
                  ? 'bg-green-50 border-green-100 text-green-700'
                  : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
              "
            >
              <span class="font-bold">Niveau {{ level }}</span>
              <div class="flex items-center gap-2 font-black">
                <span>{{ score.score }}/{{ score.total }}</span>
                <span class="material-icons-outlined text-xl">{{
                  score.validated ? "check_circle" : "cancel"
                }}</span>
              </div>
            </div>
          </div>

          <button
            @click="finishStep"
            class="w-full md:w-auto px-16 py-6 bg-[#ebb973] hover:brightness-95 text-[#428496] font-black rounded-3xl shadow-2xl shadow-brand-primary/30 transform hover:-translate-y-1 active:scale-95 transition-all text-xl"
          >
            Continuer
          </button>
        </div>
      </div>

      <!-- Section Questions -->
      <div v-else class="space-y-12">
        <!-- Title Area -->
        <div class="mb-10 relative">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
          >
            <div>
              <h1
                class="text-3xl md:text-4xl font-extrabold heading-primary mb-2"
              >
                Test de positionnement - {{ formationLabel }}
              </h1>
              <p class="text-gray-400 font-medium text-sm md:text-base">
                {{ currentLevelIndex === 0 ? "Bienvenue dans votre évaluation adaptive." : "Niveau suivant débloqué !" }}
              </p>
              
            </div>
            <div
              class="flex items-center gap-2 px-5 py-2 bg-[#ebb973]/80 text-brand-primary rounded-full text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap"
            >
              <span class="material-icons-outlined text-sm">trending_up</span>
              Évaluation du niveau {{ displayLevel(levels[currentLevelIndex]?.label) }}
            </div>
          </div>

          <!-- Adaptive Introduction -->
          <div class="bg-[#ebb973]/20 rounded-3xl p-8 mb-8 shadow-xl shadow-brand-primary/20 relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div class="flex-1">
                <h3 class="text-xl font-bold mb-2 text-[#0d1b3e]">
                  {{ levelContent.title }}
                </h3>
                <p class="text-[#0d1b3e]/80 text-sm leading-relaxed" v-html="levelContent.text">
                </p>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <WorkflowProgressBar customPath="/positionnement" />
        </div>

          <div
            v-if="loading"
            class="flex flex-col items-center justify-center py-32 gap-4 bg-[#F0F4F8] rounded-3xl shadow-xl border border-white"
          >
          <div
            class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
          ></div>
          <p class="text-gray-400 font-medium italic text-sm">
             Préparation du module {{ displayLevel(levels[currentLevelIndex]?.label) }}...
          </p>
        </div>

        <div v-else class="space-y-10">
          <div class="relative">
            <!-- <div class="flex items-center gap-4 mb-8">
              <span
                class="text-xs font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap"
                >Parcours {{ levels[currentLevelIndex]?.label }}</span
              >
              <div class="h-px w-full bg-gray-100"></div>
            </div> -->

            <div class="space-y-5">
              
              <!-- Consigne du niveau -->
              <div v-if="levels[currentLevelIndex]?.consigne" class="border-2 border-brand-primary bg-amber-50 text-brand-primary font-bold px-6 py-4 rounded-2xl shadow-sm text-center mb-6">
                {{ levels[currentLevelIndex].consigne }}
              </div>

              <!-- MODE LISTE (CLASSIQUE) -->
              <template v-if="!isPaginated">
                <div
                  v-for="(q, idx) in filteredQuestions"
                  :key="q.id"
                  class="bg-white rounded-3xl shadow-xl border border-white overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <div class="p-6 md:p-8">
                    <div class="flex items-start gap-4 mb-6">
                      <div
                      class="shrink-0 w-8 h-8 rounded-xl bg-success-soft flex items-center justify-center text-success font-bold text-sm"
                      >
                        {{ idx + 1 }}
                      </div>
                      <div>
                        <h3
                          class="text-base md:text-lg font-bold heading-primary leading-snug mb-1"
                        >
                          {{ q.text }}
                        </h3>
                        <!-- <p class="text-xs md:text-sm text-gray-400 font-medium">
                          Sélectionnez la réponse correcte pour valider ce point.
                        </p> -->
                      </div>
                    </div>

                    <div v-if="q.responseType === 'checkbox' || q.metadata?.type === 'multi_select'" class="grid grid-cols-1 gap-3">
                      <label
                        v-for="(option, oIdx) in q.options"
                        :key="oIdx"
                        class="option-card"
                        :class="
                          Array.isArray(currentResponses[q.id]) && currentResponses[q.id].includes(option)
                            ? 'option-card--selected'
                            : 'option-card--default'
                        "
                      >
                        <input
                          type="checkbox"
                          v-model="currentResponses[q.id]"
                          :value="option"
                          class="hidden"
                        />
                        <span class="option-card__label" v-html="formatBoldText(option)"></span>
                        <div
                          class="option-card__radio rounded-md"
                          :class="
                            Array.isArray(currentResponses[q.id]) && currentResponses[q.id].includes(option)
                              ? 'option-card__radio--selected'
                              : 'option-card__radio--default'
                          "
                        >
                           <span v-if="Array.isArray(currentResponses[q.id]) && currentResponses[q.id].includes(option)" class="material-icons-outlined text-white text-[14px]">check</span>
                        </div>
                      </label>
                    </div>

                    <div v-else-if="q.responseType === 'text'" class="mt-4">
                      <textarea
                        v-model="currentResponses[q.id]"
                        rows="3"
                        class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                        placeholder="Saisissez votre réponse..."
                      ></textarea>
                    </div>

                    <div v-else class="grid grid-cols-1 gap-3">
                      <label
                        v-for="(option, oIdx) in q.options"
                        :key="oIdx"
                        class="option-card"
                        :class="
                          currentResponses[q.id] === option
                            ? 'option-card--selected'
                            : 'option-card--default'
                        "
                      >
                        <input
                          type="radio"
                          :name="'q-' + q.id"
                          v-model="currentResponses[q.id]"
                          :value="option"
                          class="hidden"
                        />
                        <span class="option-card__label" v-html="formatBoldText(option)"></span>
                        <div
                          class="option-card__radio"
                          :class="
                            currentResponses[q.id] === option
                              ? 'option-card__radio--selected'
                              : 'option-card__radio--default'
                          "
                        >
                          <div
                            v-if="currentResponses[q.id] === option"
                            class="option-card__radio-dot"
                          ></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </template>

              <!-- MODE PAGINÉ (QUESTION PAR QUESTION) -->
              <template v-else>
                <div 
                  v-if="filteredQuestions[currentQuestionIndex]"
                  :key="filteredQuestions[currentQuestionIndex].id"
                  class="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500"
                >
                  <div class="p-8 md:p-12">
                    <div class="flex items-center justify-between mb-8">
                      <span class="px-5 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                        Question {{ currentQuestionIndex + 1 }} sur {{ filteredQuestions.length }}
                      </span>
                      <div class="flex gap-2">
                        <div 
                          v-for="(_, i) in filteredQuestions" 
                          :key="i"
                          class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                          :class="i === currentQuestionIndex ? 'bg-brand-primary w-4' : (currentResponses[filteredQuestions[i].id] ? 'bg-green-300' : 'bg-gray-200')"
                        ></div>
                      </div>
                    </div>

                    <div class="space-y-8">
                      <h3 class="text-xl md:text-2xl font-black heading-primary leading-tight">
                        {{ questions[currentQuestionIndex].text }}
                      </h3>

                      <div v-if="questions[currentQuestionIndex].responseType === 'checkbox' || questions[currentQuestionIndex].metadata?.type === 'multi_select'" class="grid grid-cols-1 gap-4">
                        <label
                          v-for="(option, oIdx) in questions[currentQuestionIndex].options"
                          :key="oIdx"
                          class="option-card rounded-3xl! p-6! min-h-18!"
                          :class="
                            Array.isArray(currentResponses[questions[currentQuestionIndex].id]) && currentResponses[questions[currentQuestionIndex].id].includes(option)
                              ? 'option-card--selected'
                              : 'option-card--default'
                          "
                        >
                          <input
                            type="checkbox"
                            v-model="currentResponses[questions[currentQuestionIndex].id]"
                            :value="option"
                            class="hidden"
                          />
                          <span class="option-card__label text-base!" v-html="formatBoldText(option)"></span>
                          <div
                            class="option-card__radio w-6! h-6! rounded-md"
                            :class="
                              Array.isArray(currentResponses[questions[currentQuestionIndex].id]) && currentResponses[questions[currentQuestionIndex].id].includes(option)
                                ? 'option-card__radio--selected'
                                : 'option-card__radio--default'
                            "
                          >
                             <span v-if="Array.isArray(currentResponses[questions[currentQuestionIndex].id]) && currentResponses[questions[currentQuestionIndex].id].includes(option)" class="material-icons-outlined text-white text-base">check</span>
                          </div>
                        </label>
                      </div>

                      <div v-else-if="questions[currentQuestionIndex].responseType === 'text'">
                        <textarea
                          v-model="currentResponses[questions[currentQuestionIndex].id]"
                          rows="4"
                          class="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-4xl outline-none transition-all font-bold text-base"
                          placeholder="Saisissez votre réponse..."
                        ></textarea>
                      </div>

                      <!-- Dropdown (Liste déroulante) -->
                      <div v-else-if="questions[currentQuestionIndex].responseType === 'dropdown'" class="relative">
                        <select
                          v-model="currentResponses[questions[currentQuestionIndex].id]"
                          class="w-full px-6 py-5 pr-12 bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-4xl outline-none transition-all font-bold text-base text-gray-700 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Sélectionnez une option...</option>
                          <option
                            v-for="opt in questions[currentQuestionIndex].options"
                            :key="opt"
                            :value="typeof opt === 'string' ? opt : opt.label"
                          >
                            {{ typeof opt === 'string' ? opt : opt.label }}
                          </option>
                        </select>
                        <span class="material-icons-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                      </div>

                      <div v-else class="grid grid-cols-1 gap-4">
                        <label
                          v-for="(option, oIdx) in questions[currentQuestionIndex].options"
                          :key="oIdx"
                          class="option-card rounded-3xl! p-6! min-h-18!"
                          :class="
                            currentResponses[questions[currentQuestionIndex].id] === option
                              ? 'option-card--selected'
                              : 'option-card--default'
                          "
                        >
                          <input
                            type="radio"
                            :name="'q-paginated'"
                            v-model="currentResponses[questions[currentQuestionIndex].id]"
                            :value="option"
                            class="hidden"
                          />
                          <span class="option-card__label text-base!" v-html="formatBoldText(option)"></span>
                          <div
                            class="option-card__radio w-6! h-6!"
                            :class="
                              currentResponses[questions[currentQuestionIndex].id] === option
                                ? 'option-card__radio--selected'
                                : 'option-card__radio--default'
                            "
                          >
                            <div
                              v-if="currentResponses[questions[currentQuestionIndex].id] === option"
                              class="option-card__radio-dot w-2! h-2!"
                            ></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Sticky Footer Info -->
          <div
            class="bg-white border border-white rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="shrink-0 w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-[#428496] text-sm">
              >
                <span class="material-icons-outlined">auto_fix_high</span>
              </div>
              <div>
                <p
                  class="text-xs font-bold text-gray-300 uppercase tracking-widest mb-0.5"
                >
                  Prochaine étape
                </p>
                <p class="text-sm font-bold heading-primary">
                  Finalisation du profil {{ levels[currentLevelIndex]?.label }}
                </p>
              </div>
            </div>

            <!-- Boutons de navigation alignés à droite -->
            <div class="flex items-center gap-3">
              <template v-if="isPaginated">
                <button
                  v-if="currentQuestionIndex > 0"
                  @click="currentQuestionIndex--"
                  class="px-6 py-3 text-xs font-bold text-gray-400 hover:text-brand-primary transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  Question précédente
                </button>
                
                <button
                  v-if="currentQuestionIndex < filteredQuestions.length - 1"
                  @click="currentQuestionIndex++"
                  :disabled="!currentResponses[filteredQuestions[currentQuestionIndex].id]"
                  class="px-8 py-4 bg-brand-primary hover:brightness-95 text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
                >
                  <span>Question Suivante</span>
                  <span class="material-icons-outlined text-lg">arrow_forward</span>
                </button>

                <button
                  v-else
                  @click="nextStep"
                  :disabled="submitting || !currentResponses[filteredQuestions[currentQuestionIndex].id]"
                  class="px-10 py-4 bg-brand-primary hover:brightness-95 text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
                >
                  <span>{{ currentLevelIndex === levels.length - 1 ? "Terminer le test" : "Valider le niveau" }}</span>
                  <span v-if="!submitting" class="material-icons-outlined text-lg">offline_bolt</span>
                  <div v-else class="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4"></div>
                </button>
              </template>

              <template v-else>
                <button
                  @click="nextStep"
                  :disabled="
                    submitting ||
                    Object.entries(currentResponses).some(([id, r]) => {
                      const q = questions.find(qv => qv.id == id);
                      return q?.responseType === 'text' ? !r || r.trim() === '' : r === null;
                    })
                  "
                  class="px-10 py-4 bg-[#ebb973] hover:brightness-95 text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
                >
                  <span>{{ currentLevelIndex === levels.length - 1 ? "Terminer" : "Suivant" }}</span>
                  <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
                  <div v-else class="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4"></div>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Score Warning Modal -->
      <transition name="modal-fade">
  <div v-if="showFormationWarning" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="continueWithWarning()"></div>

    <div class="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md relative z-10 text-center animate-in zoom-in duration-300">
      
      <!-- Warning Icon -->
      <div class="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="material-icons-outlined text-4xl text-yellow-600">warning</span>
      </div>

      <!-- Title -->
      <h2 class="text-2xl md:text-3xl font-black heading-primary mb-4">
        Formation peut-être non adaptée à votre niveau
      </h2>

      <!-- Score Details -->
      <p class="text-gray-500 text-sm md:text-base mb-8 leading-relaxed">
        Vous avez obtenu 
        <strong class="text-gray-700">
          {{ lastScoreDetails.correctCount }}/{{ lastScoreDetails.total }}
        </strong> bonnes réponses au test de positionnement.
        <br /><br />
        Nous vous recommandons d’envisager une formation plus adaptée à votre niveau.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <button
          @click="closeAndChangeFormation"
          class="flex-1 px-6 py-3 bg-white text-brand-primary border-2 border-brand-primary rounded-2xl font-bold hover:bg-brand-primary/10 transition-all active:scale-95"
        >
          Modifier mon choix
        </button>

        <button
          @click="continueWithWarning"
          class="flex-1 px-6 py-3 bg-[#ebb973] hover:brightness-95 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
        >
          Continuer quand même
        </button>
      </div>
            </div>
          </div>
      </transition>
    </main>

    <HighLevelAlertModal
      :show="showHighLevelAlert"
      :formation="formationLabel"
      :level="highLevelValidated"
      @continue="handleHighLevelContinue"
      @changeFormation="handleHighLevelChangeFormation"
      @close="showHighLevelAlert = false"
    />
    <SiteFooter />
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}

.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal fade transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Option card */
.option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  min-height: 3.5rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card--default:hover {
  border-color: #d1d5db;
  background: #e9ebee;
}

.option-card--selected {
  border-color: var(--brand-primary, #ebb973);
  background: rgba(235, 185, 115, 0.05);
  box-shadow: 0 4px 12px rgba(235, 185, 115, 0.1);
}

.option-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  text-align: left;
  flex: 1;
}

.option-card--selected .option-card__label {
  color: var(--brand-primary, #ebb973);
}

.option-card__radio {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.option-card__radio--selected {
  border-color: var(--brand-primary, #ebb973);
  background: var(--brand-primary, #ebb973);
}

.option-card__radio-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
}
</style>