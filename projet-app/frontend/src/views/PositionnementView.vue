<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import AppLogo from '../components/AppLogo.vue';

const store = useAppStore();
const router = useRouter();

const currentLevelIndex = ref(0);
const levels = ref([]); // loaded dynamically from API
const questions = ref([]);
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
    questions.value = response.data;
    currentResponses.value = {};
    questions.value.forEach((q) => {
      currentResponses.value[q.id] = null;
    });
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
  if (!showResults.value) {
    await loadLevelQuestions();
  }
});

async function nextStep() {
  submitting.value = true;
  try {
    // 1. Calculate score for current level
    let correctCount = 0;
    const currentLevel = levels.value[currentLevelIndex.value];
    const percentage = (correctCount / questions.value.length) * 100;

    // Stocker les réponses de ce niveau dans un objet par niveau
    if (!positionnementAnswers.value[currentLevel.label]) {
      positionnementAnswers.value[currentLevel.label] = {};
    }
    questions.value.forEach((q) => {
      const answer = currentResponses.value[q.id];
      positionnementAnswers.value[currentLevel.label][q.id] = answer;
      if (answer === q.options[q.correctResponseIndex]) {
        correctCount++;
      }
    });

    // Sécurise le seuil : si le niveau demande plus de bonnes réponses que le nombre
    // de questions chargées, on considère le maximum possible.
    const requiredCorrect = Math.min(
      Number(currentLevel.successThreshold ?? questions.value.length),
      questions.value.length,
    );

    levelsScores.value[currentLevel.label] = {
      score: correctCount,
      total: questions.value.length,
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
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      levelsScores: levelsScores.value,
      lastValidatedLevel: finalLevel,
      positionnementAnswers: positionnementAnswers.value,
    });

    // 3. Adaptive logic: check if transition to next level is allowed
    const canProgress = correctCount >= requiredCorrect;

    if (!canProgress || currentLevelIndex.value === levels.value.length - 1) {
      finalRecommendation.value = `${formationLabel} - ${finalLevel}`;

      await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
        levelsScores: levelsScores.value,
        finalRecommendation: finalRecommendation.value,
        stopLevel: currentLevel.label,
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
async function saveAndExit() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
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
  <div class="min-h-screen flex flex-col font-outfit bg-gray-50/50">
    <!-- Header -->
    <header
      class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl"
        >
           <AppLogo />
        </div>
          
        
      </div>

      <div class="flex items-center gap-4">
        <button
          @click="saveAndExit"
          :disabled="submitting"
          class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm text-gray-600 border border-gray-100"
        >
          <span class="material-icons-outlined text-lg">save</span>
          {{ submitting ? "Sauvegarde..." : "Enregistrer et quitter" }}
        </button>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto p-4 py-12 md:py-20">
      <!-- Section Résultats -->
      <div
        v-if="showResults"
        class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div
          class="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl shadow-brand-primary/10 border border-brand-primary/5 text-center"
        >
          <div
            class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-blue-400 mx-auto mb-8 shadow-xl shadow-green-500/30"
          >
            <span class="material-icons-outlined text-5xl">task_alt</span>
          </div>

          <h1
            class="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight"
          >
            Test terminé !
          </h1>

          <p
            class="text-gray-400 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed"
          >
            Félicitations, voici votre niveau recommandé :
          </p>

          <div
            class="inline-block px-10 py-6 bg-brand-primary/5 border-2 border-brand-primary rounded-3xl mb-12 transform hover:scale-105 transition-transform duration-500"
          >
            <span
              class="text-brand-primary font-black text-3xl md:text-4xl tracking-tight uppercase"
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
                Parcours adaptatif : Succès sur les premières questions validé.
              </p>
            </div>
            <div
              class="flex items-center gap-2 px-5 py-2 bg-success-soft text-success rounded-full text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap"
            >
              <span class="material-icons-outlined text-sm">trending_up</span>
              En bonne voie pour {{ levels[currentLevelIndex]?.label }}
            </div>
          </div>

          <!-- Progress Bar -->
          <div
            class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8"
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
          </div>
        </div>

        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-2xl shadow-sm border border-gray-100"
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
            <div class="flex items-center gap-4 mb-8">
              <span
                class="text-xs font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap"
                >Révision {{ levels[currentLevelIndex]?.label }}</span
              >
              <div class="h-px w-full bg-gray-100"></div>
            </div>

            <div class="space-y-5">
              <div
                v-for="(q, idx) in questions"
                :key="q.id"
                class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
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

                  <div class="grid grid-cols-1 gap-3">
                    <label
                      v-for="(option, oIdx) in q.options"
                      :key="oIdx"
                      class="flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group/opt"
                      :class="
                        currentResponses[q.id] === option
                          ? 'border-brand-primary bg-brand-primary/5'
                          : 'border-gray-50 bg-transparent hover:border-brand-primary/30 hover:bg-white'
                      "
                    >
                      <input
                        type="radio"
                        :name="'q-' + q.id"
                        v-model="currentResponses[q.id]"
                        :value="option"
                        class="hidden"
                      />
                      <div class="flex items-center gap-3">
                        <div
                          class="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                          :class="
                            currentResponses[q.id] === option
                              ? 'border-brand-primary bg-brand-primary'
                              : 'border-gray-300 group-hover/opt:border-brand-primary'
                          "
                        >
                          <div
                            v-if="currentResponses[q.id] === option"
                            class="w-1.5 h-1.5 rounded-full bg-white"
                          ></div>
                        </div>
                        <span
                          class="font-medium text-sm"
                          :class="
                            currentResponses[q.id] === option
                              ? 'text-brand-primary'
                              : 'text-gray-700'
                          "
                        >
                          {{ option }}
                        </span>
                      </div>
                      <span
                        v-if="currentResponses[q.id] === option"
                        class="material-icons-outlined text-brand-primary text-sm animate-scale-in"
                        >check_circle</span
                      >
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sticky Footer Info -->
          <div
            class="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4"
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
                  Object.values(currentResponses).some((r) => r === null)
                "
                class="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-blue-500 font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 text-sm"
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
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

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
</style>
