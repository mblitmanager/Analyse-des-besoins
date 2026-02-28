<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions } from "../utils/conditionalQuestions";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

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
const positionnementAnswers = ref({});
const showResults = ref(false);
const finalRecommendation = ref("");
const isPaginated = ref(false);
const currentQuestionIndex = ref(0);

// Low score warning modal
const showFormationWarning = ref(false);
const lowScoreThreshold = ref(3); // default: warn if < 3 correct answers
const lastScoreDetails = ref({ correctCount: 0, total: 0 });
const skipFormationWarning = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Computed: filter questions based on conditional logic
const filteredQuestions = computed(() => {
  return filterConditionalQuestions(questions.value, currentResponses.value);
});

async function loadLevels() {
  try {
    const res = await axios.get(
      `${apiBaseUrl}/formations/${formationSlug}/levels`,
    );
    if (res.data && res.data.length > 0) {
      levels.value = res.data; // Keep full level objects
    } else {
      levels.value = [
        { label: "Niveau 1", successThreshold: 4 },
        { label: "Niveau 2", successThreshold: 4 },
        { label: "Niveau 3", successThreshold: 4 },
      ];
    }
  } catch {
    levels.value = [
      { label: "Niveau 1", successThreshold: 4 },
      { label: "Niveau 2", successThreshold: 4 },
      { label: "Niveau 3", successThreshold: 4 },
    ];
  }
}

async function restoreProgressFromSession() {
  try {
    const res = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const session = res.data;

    if (session.levelsScores) {
      levelsScores.value = session.levelsScores;
    }

    // Si la session est déjà terminée côté backend, afficher directement le résultat
    if (session.finalRecommendation && session.stopLevel) {
      finalRecommendation.value = session.finalRecommendation;
      showResults.value = true;
      return;
    }

    // Sinon, déterminer à quel niveau reprendre en fonction des niveaux validés
    if (session.levelsScores && Array.isArray(levels.value) && levels.value.length) {
      let lastValidatedIndex = -1;
      levels.value.forEach((lvl, idx) => {
        const entry = session.levelsScores[lvl.label];
        if (entry && entry.validated) {
          lastValidatedIndex = idx;
        }
      });

      if (lastValidatedIndex >= 0) {
        // On reprend au niveau suivant celui qui a été validé
        if (lastValidatedIndex < levels.value.length - 1) {
          currentLevelIndex.value = lastValidatedIndex + 1;
        } else {
          // Tous les niveaux définis sont déjà validés : on reste sur le dernier
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
    const levelLabel = levels.value[currentLevelIndex.value].label;
    const response = await axios.get(
      `${apiBaseUrl}/questions/positionnement?formation=${formationSlug}&niveau=${levelLabel}`,
    );
    const allQuestions = response.data || [];
    // Deduplicate by text (case-insensitive) just in case
    const seen = new Set();
    questions.value = allQuestions.filter((q) => {
      const key = q.text.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    currentResponses.value = {};
    questions.value.forEach((q) => {
      if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
        currentResponses.value[q.id] = [];
      } else if (q.metadata?.type === "radio_toggle") {
        currentResponses.value[q.id] = "Non";
      } else if (q.metadata?.type === "qcm" || q.responseType === "qcm" || (q.options?.length > 0)) {
        currentResponses.value[q.id] = null;
      } else {
        currentResponses.value[q.id] = "";
      }
    });
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
  await loadLevels();
  await restoreProgressFromSession();
  await fetchPaginationSetting();
  await fetchLowScoreThreshold();
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
      if (answer === q.options[q.correctResponseIndex]) {
        correctCount++;
      }
    });

    const percentage = (correctCount / filteredQuestions.value.length) * 100;

    // Check if score is below warning threshold (if not already skipped)
    if (!skipFormationWarning.value && currentLevelIndex.value === 0 && correctCount < lowScoreThreshold.value) {
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
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      levelsScores: levelsScores.value,
      lastValidatedLevel: finalLevel,
      positionnementAnswers: positionnementAnswers.value,
    });

    // 3. Adaptive logic: check if transition to next level is allowed
    const canProgress = correctCount >= requiredCorrect;

    if (!canProgress || currentLevelIndex.value === levels.value.length - 1) {
      // Determine recommendation. The path should allow the user to validate the current
      // level (i.e. the one they just failed or completed).
      // If the user failed (!canProgress) we simply recommend that level; if they
      // validated the final level we also recommend it.
      // Recommendation targets the current level (the one failed or the final one) and its successor
      const ensureNiveau = (label) => {
        if (!label) return label;
        return label.toLowerCase().includes("niveau") ? label : `Niveau ${label}`;
      };
      
      const l1 = ensureNiveau(currentLevel.label);
      const l2 = ensureNiveau(levels.value[currentLevelIndex.value + 1]?.label);
      
      if (l2) {
        finalRecommendation.value = `${formationLabel} - ${l1} & ${l2}`;
      } else {
        finalRecommendation.value = `${formationLabel} - ${l1}`;
      }

      await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
        levelsScores: levelsScores.value,
        finalRecommendation: finalRecommendation.value,
        stopLevel: currentLevel.label,
        lastValidatedLevel: finalLevel,
        positionnementAnswers: positionnementAnswers.value,
      });

      showResults.value = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
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
            Test terminé !
          </h1>

          <p
            class="text-gray-400 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed"
          >
            Félicitations, voici votre parcours de formation recommandé :
          </p>

          <div
            class="inline-block px-10 py-6 bg-brand-primary/5 border-2 border-brand-primary rounded-3xl mb-12 transform hover:scale-105 transition-transform duration-500"
          >
            <span
              class="text-brand-primary font-black text-3xl md:text-4xl tracking-tight"
            >
              {{ finalRecommendation }}
            </span>
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
            class="w-full md:w-auto px-16 py-6 bg-brand-primary hover:bg-brand-secondary text-blue-500 font-black rounded-3xl shadow-2xl shadow-brand-primary/30 transform hover:-translate-y-1 active:scale-95 transition-all text-xl"
          >
            Continuer le parcours
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
              class="flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap"
            >
              <span class="material-icons-outlined text-sm">trending_up</span>
              Évaluation du niveau {{ levels[currentLevelIndex]?.label }}
            </div>
          </div>

          <!-- Adaptive Introduction -->
          <div class="bg-blue-400 rounded-3xl p-8 mb-8  shadow-xl shadow-blue-600/20 relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <!-- <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <span class="material-icons-outlined text-3xl">info</span>
              </div> -->
              <div class="flex-1">
                <h3 class="text-xl font-bold mb-2">
                  {{ currentLevelIndex === 0 ? "Comment fonctionne ce test ?" : "Bravo, vous progressez !" }}
                </h3>
                <p class="text-blue-50 text-sm leading-relaxed" v-if="currentLevelIndex === 0">
                  Ce test est adaptatif. Il commence par le niveau <strong>{{ levels[0]?.label }}</strong>. Si vous réussissez ce bloc, vous passerez au niveau supérieur pour une évaluation plus précise. L'objectif est de trouver le parcours qui vous correspond le mieux.
                </p>
                <p class="text-blue-50 text-sm leading-relaxed" v-else>
                  Vous avez validé l'étape précédente. Nous allons maintenant évaluer vos compétences pour le niveau <strong>{{ levels[currentLevelIndex]?.label }}</strong> afin d'affiner votre programme de formation.
                </p>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <!-- <div
            class="bg-white p-5 rounded-3xl shadow-xl border border-white mb-8"
          >
            <div class="flex items-center justify-between mb-2 px-1">
              <span
                class="text-xs font-bold section-title uppercase tracking-widest"
                >Progression globale</span
              >
              <span
                class="text-xs font-bold text-brand-primary uppercase tracking-widest"
                >Étape {{ store.getProgress("/positionnement").current }} sur
                {{ store.getProgress("/positionnement").total }}</span
              >
            </div>
            <div
              class="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-50"
            >
              <div
                class="h-full bg-brand-primary transition-all duration-700"
                :style="{
                  width:
                    ((currentLevelIndex + 1) / (levels.length || 1)) * 100 +
                    '%',
                }"
              ></div>
            </div>
          </div> -->
        </div>

          <div
            v-if="loading"
            class="flex flex-col items-center justify-center py-32 gap-4 bg-[#F0F4F8] rounded-3xl shadow-xl border border-white"
          >
          <div
            class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
          ></div>
          <p class="text-gray-400 font-medium italic text-sm">
            Préparation du module {{ levels[currentLevelIndex]?.label }}...
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
                        <p class="text-xs md:text-sm text-gray-400 font-medium">
                          Sélectionnez la réponse correcte pour valider ce point.
                        </p>
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
                class="shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-blue-400 text-sm"
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

            <div class="flex items-center gap-3">
              <template v-if="isPaginated">
                <button
                  @click="currentQuestionIndex--"
                  :disabled="currentQuestionIndex === 0"
                  class="px-6 py-3 text-sm font-bold text-gray-400 hover:text-brand-primary transition-all flex items-center gap-2 disabled:opacity-20"
                >
                  <span class="material-icons-outlined text-lg">arrow_back</span>
                  Question précédente
                </button>
                
                <button
                  v-if="currentQuestionIndex < filteredQuestions.length - 1"
                  @click="currentQuestionIndex++"
                  :disabled="!currentResponses[filteredQuestions[currentQuestionIndex].id]"
                  class="px-8 py-3 bg-white border-2 border-brand-primary text-brand-primary font-bold rounded-2xl hover:bg-brand-primary hover:text-[#428496] transition-all flex items-center gap-2 disabled:opacity-30"
                >
                  Suivant
                  <span class="material-icons-outlined text-lg">arrow_forward</span>
                </button>

                <button
                  v-else
                  @click="nextStep"
                  :disabled="submitting || !currentResponses[filteredQuestions[currentQuestionIndex].id]"
                  class="px-8 py-3 bg-brand-primary text-[#428496] font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30"
                >
                  <span>{{ currentLevelIndex === levels.length - 1 ? "Terminer le test" : "Valider le niveau" }}</span>
                  <span v-if="!submitting" class="material-icons-outlined text-lg">offline_bolt</span>
                  <div v-else class="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4"></div>
                </button>
              </template>

              <template v-else>
                <button
                  @click="router.push('/formations')"
                  class="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Précédent
                </button>
                <button
                  @click="nextStep"
                  :disabled="
                    submitting ||
                    Object.entries(currentResponses).some(([id, r]) => {
                      const q = questions.find(qv => qv.id == id);
                      return q?.responseType === 'text' ? !r || r.trim() === '' : r === null;
                    })
                  "
                  class="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 text-sm"
                >
                  <span>{{
                    currentLevelIndex === levels.length - 1
                      ? "Terminer"
                      : "Suivant"
                  }}</span>
                  <span v-if="!submitting" class="material-icons-outlined text-lg"
                    >arrow_forward</span
                  >
                  <div
                    v-else
                    class="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4"
                  ></div>
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
              Avez-vous choisi la bonne formation ?
            </h2>

            <!-- Score Details -->
            <p class="text-gray-400 text-sm md:text-base mb-8 leading-relaxed">
              Vous avez obtenu <strong class="text-gray-600">{{ lastScoreDetails.correctCount }}/{{ lastScoreDetails.total }}</strong> bonnes réponses.
              <br />Nous vous recommandons de revoir votre choix de formation.
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
              <button
                @click="closeAndChangeFormation"
                class="flex-1 px-6 py-3 bg-white text-brand-primary border-2 border-brand-primary rounded-2xl font-bold hover:bg-brand-primary/10 transition-all active:scale-95"
              >
                Changer de formation
              </button>
              <button
                @click="continueWithWarning"
                class="flex-1 px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      </transition>
    </main>
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
  border-color: var(--color-brand-primary, #3b82f6);
  background: #eef2ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.option-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  text-align: left;
  flex: 1;
}

.option-card--selected .option-card__label {
  color: var(--color-brand-primary, #3b82f6);
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
  border-color: var(--color-brand-primary, #3b82f6);
  background: var(--color-brand-primary, #3b82f6);
}

.option-card__radio-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
}
</style>
