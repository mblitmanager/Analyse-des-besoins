<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

const currentLevelIndex = ref(0);
const levels = ref(["A1", "A2", "B1", "B2", "C1"]);
const questions = ref([]);
const currentResponses = ref({});
const loading = ref(true);
const submitting = ref(false);
const finished = ref(false);

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
  } catch (error) {
    console.error("Failed to load level questions:", error);
    alert("Erreur lors du chargement des questions de niveau.");
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

    // 3. Check cumulative logic / stop condition
    // In this simplified frontend adaptive logic, we stop if score < 80% (or dynamic threshold from DB)
    // The backend `submit` will also recalculate this, but we handle the UI flow here.
    if (
      percentage < 80 ||
      currentLevelIndex.value === levels.value.length - 1
    ) {
      // Finalize
      await axios.post(`${apiBaseUrl}/sessions/${sessionId}/submit`);
      router.push("/resultats");
    } else {
      // Go to next level
      currentLevelIndex.value++;
      loadLevelQuestions();
    }
  } catch (error) {
    console.error("Failed to advance test:", error);
    alert("Erreur lors de la validation du niveau.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen py-12 px-4 bg-gray-50 flex justify-center items-start"
  >
    <div
      class="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
    >
      <!-- Progress Bar -->
      <div class="h-2 w-full bg-gray-100">
        <div
          class="h-full bg-brand-primary transition-all duration-500"
          :style="{ width: (currentLevelIndex / levels.length) * 100 + '%' }"
        ></div>
      </div>

      <div class="p-8 md:p-12">
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10"
        >
          <div>
            <span
              class="text-brand-primary font-bold uppercase tracking-widest text-xs"
              >Positionnement adaptive</span
            >
            <h1 class="text-3xl font-extrabold text-gray-900 mt-1">
              {{ formationLabel }} - Niveau {{ levels[currentLevelIndex] }}
            </h1>
          </div>
          <div
            class="px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600"
          >
            Étage {{ currentLevelIndex + 1 }} / {{ levels.length }}
          </div>
        </div>

        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div
            class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
          ></div>
          <p class="text-gray-400 font-medium italic">
            Préparation des questions adaptées...
          </p>
        </div>

        <div v-else class="space-y-10">
          <div
            v-for="(q, idx) in questions"
            :key="q.id"
            class="animate-fade-in-up"
          >
            <p class="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-bold mr-2"
                >{{ idx + 1 }}</span
              >
              {{ q.text }}
            </p>

            <div class="grid grid-cols-1 gap-3">
              <label
                v-for="(option, oIdx) in q.options"
                :key="oIdx"
                class="flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer group relative overflow-hidden"
                :class="
                  currentResponses[q.id] === option
                    ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                    : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:border-brand-accent'
                "
              >
                <input
                  type="radio"
                  :name="'q-' + q.id"
                  v-model="currentResponses[q.id]"
                  :value="option"
                  class="hidden"
                />
                <div
                  class="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all"
                  :class="
                    currentResponses[q.id] === option
                      ? 'border-brand-primary bg-brand-primary'
                      : 'border-gray-300'
                  "
                >
                  <svg
                    v-if="currentResponses[q.id] === option"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <span
                  class="text-lg font-medium"
                  :class="
                    currentResponses[q.id] === option
                      ? 'text-brand-primary'
                      : 'text-gray-700'
                  "
                  >{{ option }}</span
                >
              </label>
            </div>
          </div>

          <div class="pt-10 flex border-t border-gray-100">
            <button
              @click="nextStep"
              :disabled="
                submitting ||
                Object.values(currentResponses).some((r) => r === null)
              "
              class="ml-auto px-12 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-xl hover:shadow-brand-primary/40 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 transform active:scale-95"
            >
              <span>{{
                currentLevelIndex === levels.length - 1
                  ? "Terminer le test"
                  : "Valider ce niveau"
              }}</span>
              <svg
                v-if="!submitting"
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
              <div
                v-else
                class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
              ></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
