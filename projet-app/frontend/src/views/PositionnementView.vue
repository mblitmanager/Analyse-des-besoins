<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();

const currentLevelIndex = ref(0);
const levels = ref(["A1", "A2", "B1", "B2", "C1"]);
const questions = ref([]);
const currentResponses = ref({});
const loading = ref(true);
const submitting = ref(false);

const formationSlug = localStorage.getItem("selected_formation_slug");
const formationLabel = localStorage.getItem("selected_formation_label");
const sessionId = localStorage.getItem("session_id");

const levelsScores = ref({});

async function loadLevelQuestions() {
  loading.value = true;
  try {
    const levelLabel = levels.value[currentLevelIndex.value];
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(
      `${apiBaseUrl}/questions/positionnement?formation=${formationSlug}&niveau=${levelLabel}`,
    );
    questions.value = response.data;
    currentResponses.value = {};
    questions.value.forEach((q) => {
      currentResponses.value[q.id] = null;
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Failed to load level questions:", error);
    alert("Erreur lors de l'chargement des questions.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!sessionId || !formationSlug) {
    router.push("/");
    return;
  }
  loadLevelQuestions();
});

async function nextStep() {
  submitting.value = true;
  try {
    // 1. Calculate score for current level
    let correctCount = 0;
    questions.value.forEach((q) => {
      if (currentResponses.value[q.id] === q.options[q.correctResponseIndex]) {
        correctCount++;
      }
    });

    const percentage = (correctCount / questions.value.length) * 100;
    const currentLevelLabel = levels.value[currentLevelIndex.value];
    levelsScores.value[currentLevelLabel] = percentage;

    // 2. Update session with scores so far
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      levelsScores: levelsScores.value,
    });

    // 3. Adaptive logic: threshold 80%
    if (
      percentage < 80 ||
      currentLevelIndex.value === levels.value.length - 1
    ) {
      // Finalize level and go to next workflow step
      const nextRoute = store.getNextRoute("/positionnement");
      router.push(nextRoute || "/resultats");
    } else {
      // Go to next level
      currentLevelIndex.value++;
      loadLevelQuestions();
    }
  } catch (error) {
    console.error("Failed to advance test:", error);
    alert("Erreur lors de la validation.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black italic text-xl"
        >
          W
        </div>
        <span class="font-bold text-gray-800 text-xl tracking-tight"
          >Wizzy Learn</span
        >
      </div>

      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm text-gray-600 border border-gray-100"
        >
          <span class="material-icons-outlined text-lg">save</span>
          Enregistrer et quitter
        </button>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto p-4 py-10">
      <!-- Title Area -->
      <div class="mb-10 relative">
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 class="text-3xl md:text-4xl font-extrabold text-[#0D1B3E] mb-2">
              Test de positionnement - {{ formationLabel }}
            </h1>
            <p class="text-gray-400 font-medium text-sm md:text-base">
              Parcours adaptatif : Succès sur les premières questions validé.
            </p>
          </div>
          <div
            class="flex items-center gap-2 px-5 py-2 bg-[#E1F9EB] text-[#22C55E] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap"
          >
            <span class="material-icons-outlined text-sm">trending_up</span>
            En bonne voie pour {{ levels[currentLevelIndex] }}
          </div>
        </div>

        <!-- Progress Bar -->
        <div
          class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8"
        >
          <div class="flex items-center justify-between mb-2 px-1">
            <span
              class="text-xs font-bold text-[#0D1B3E] uppercase tracking-widest"
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
                width: ((currentLevelIndex + 1) / levels.length) * 100 + '%',
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
          Préparation du module {{ levels[currentLevelIndex] }}...
        </p>
      </div>

      <div v-else class="space-y-10">
        <div class="relative">
          <div class="flex items-center gap-4 mb-8">
            <span
              class="text-xs font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap"
              >Révision {{ levels[currentLevelIndex] }}</span
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
                    class="flex-shrink-0 w-8 h-8 rounded-xl bg-[#E1F9EB] flex items-center justify-center text-[#22C55E] font-bold text-sm"
                  >
                    {{ idx + 1 }}
                  </div>
                  <div>
                    <h3
                      class="text-base md:text-lg font-bold text-[#0D1B3E] leading-snug mb-1"
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
                        : 'border-gray-50 bg-[#F8FAFC] hover:border-brand-primary/30 hover:bg-white'
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
                        class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
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
              class="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm"
            >
              <span class="material-icons-outlined">auto_fix_high</span>
            </div>
            <div>
              <p
                class="text-xs font-bold text-gray-300 uppercase tracking-widest mb-0.5"
              >
                Prochaine étape
              </p>
              <p class="text-sm font-bold text-[#0D1B3E]">
                Finalisation du profil {{ levels[currentLevelIndex] }}
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
              class="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 text-sm"
            >
              <span>{{
                currentLevelIndex === levels.length - 1 ? "Terminer" : "Suivant"
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
