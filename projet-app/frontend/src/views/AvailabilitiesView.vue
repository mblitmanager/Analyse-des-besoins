<script setup>
import { ref, onMounted, computed } from "vue"; // Fixed: was missing onMounted and computed
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import { formatBoldText } from "../utils/formatText";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import axios from "axios";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const questions = ref([]);
const responses = ref({});
const session = ref(null);
const loading = ref(true);
const submitting = ref(false);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const recommendedLabel = computed(() => {
  if (!session.value) return "";
  if (session.value.finalRecommendation)
    return session.value.finalRecommendation.replace(/ \| /g, " / ");

  const level =
    session.value.lastValidatedLevel || session.value.stopLevel || "";

  if (!session.value.formationChoisie && !level) return "Parcours personnalisé";

  return `${session.value.formationChoisie || ""}${
    level ? " - " + level : ""
  }`.trim();
});


onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  if (store.workflowSteps.length === 0) {
    await store.fetchWorkflow();
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const formationSlug = localStorage.getItem("selected_formation_slug");
    const res = await axios.get(
      `${apiBaseUrl}/questions/workflow/availabilities`,
      {
        params: formationSlug
          ? { formation: formationSlug, scope: "auto" }
          : { scope: "global" },
      },
    );
    // Fetch session for email notification
    const sessRes = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    session.value = sessRes.data;

    // remove duplicate questions (prefer unique id, fallback to text)
    questions.value = Array.from(
      new Map(
        (res.data || []).map((q) => [q.id ?? q.text, q]),
      ).values(),
    );


    // Initialize responses keyed by q.id
    questions.value.forEach((q) => {
      if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
        responses.value[q.id] = [];
      } else if (q.metadata?.type === "radio_toggle") {
        responses.value[q.id] = "Non";
      } else if (q.metadata?.type === "qcm" || q.responseType === "qcm" || (q.options?.length > 0)) {
        responses.value[q.id] = null;
      } else {
        responses.value[q.id] = "";
      }
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    // keep the user here, fetching failed
  } finally {
    loading.value = false;
  }
});

function toggleMultiSelect(qId, option) {
  const index = responses.value[qId].indexOf(option);
  if (index > -1) responses.value[qId].splice(index, 1);
  else responses.value[qId].push(option);
}

async function nextStep() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      availabilities: responses.value,
    });

    // Submit session (sends official email report with PDF)
    await axios.post(`${apiBaseUrl}/sessions/${sessionId}/submit`);

    const nextRoute = store.getNextRoute("/availabilities");
    router.push(nextRoute || "/validation");
  } catch (error) {
    console.error("Failed to save availabilities:", error);
  } finally {
    submitting.value = false;
  }
}

function skipStep() {
  const nextRoute = store.getNextRoute("/availabilities");
  router.push(nextRoute || "/validation");
}

</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader>
      <template #actions>
        <!-- <div class="hidden md:flex flex-col items-end mr-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Progression</span>
            <span class="text-[10px] text-brand-primary font-bold">
              Étape {{ store.getProgress("/availabilities").current }}/{{ store.getProgress("/availabilities").total }}
            </span>
          </div>
          <div class="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-brand-primary transition-all duration-700"
              :style="{ width: store.getProgress('/availabilities').percentage + '%' }"
            ></div>
          </div>
        </div> -->
      </template>
    </SiteHeader>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">
          Vos Disponibilités
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Planifions ensemble votre parcours de formation.
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>

      <div v-else class="space-y-6">
        <div
          class="bg-white rounded-3xl shadow-xl border border-white overflow-hidden"
        >
          <div
            class="px-6 py-5 border-b border-gray-100 flex items-center gap-3"
          >
            <div
              class="w-9 h-9 rounded-lg bg-indigo-600/5 flex items-center justify-center"
            >
              <span class="material-icons-outlined text-indigo-600 text-lg"
                >event_available</span
              >
            </div>
            <h2 class="text-base font-bold text-gray-800">Planification</h2>
          </div>

          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in questions" :key="q.id" class="space-y-3">
              <div class="flex items-center gap-2">
                <span
                  v-if="q.icon"
                  class="material-icons-outlined text-brand-primary text-sm"
                  >{{ q.icon }}</span
                >
                <p class="text-base font-bold heading-primary">{{ q.text }}</p>
              </div>

              <!-- Multi-Select Type (créneaux) -->
              <div
                v-if="q.metadata?.type === 'multi_select'"
                class="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <label
                  v-for="(opt, idx) in q.options"
                  :key="opt"
                  class="option-card h-auto! flex-col! items-center! py-6!"
                  :class="
                    responses[q.id].includes(opt)
                      ? 'option-card--selected'
                      : 'option-card--default'
                  "
                >
                  <input
                    type="checkbox"
                    @change="toggleMultiSelect(q.id, opt)"
                    :checked="responses[q.id].includes(opt)"
                    class="hidden"
                  />
                  <span
                    v-if="q.metadata.icons?.[idx]"
                    class="material-icons-outlined text-3xl mb-2 transition-colors"
                    :class="
                      responses[q.id].includes(opt)
                        ? 'text-brand-primary'
                        : 'text-gray-300'
                    "
                  >
                    {{ q.metadata.icons[idx] }}
                  </span>
                  <span 
                    class="option-card__label text-center! text-sm font-bold"
                    :class="responses[q.id].includes(opt) ? 'text-brand-primary' : 'text-gray-700'"
                    v-html="formatBoldText(opt)"
                  ></span>
                  
                  <!-- Checkbox indicator -->
                  <div
                    class="mt-3 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center placeholder-checkbox"
                    :class="
                      responses[q.id].includes(opt)
                        ? 'bg-brand-primary border-brand-primary'
                        : 'border-gray-200'
                    "
                  >
                    <span v-if="responses[q.id].includes(opt)" class="material-icons-outlined text-[#428496] text-[14px] font-black">check</span>
                  </div>
                </label>
              </div>

              <!-- Textarea Type (dates libres) -->
              <textarea
                v-else-if="q.metadata?.type === 'textarea'"
                v-model="responses[q.id]"
                :rows="q.metadata.rows || 3"
                :placeholder="q.metadata.placeholder || ''"
                class="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-sm text-gray-700 shadow-sm"
              ></textarea>

              <!-- Default Text Type -->
              <input
                v-else
                v-model="responses[q.id]"
                type="text"
                :placeholder="q.metadata?.placeholder || ''"
                class="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-sm text-gray-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div
          class="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <button
            @click="router.push('/complementary')"
            class="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
          >
            <span class="material-icons-outlined">arrow_back</span>
            Précédent
          </button>
          <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <!-- <button
              @click="skipStep"
              class="px-6 py-4 text-gray-400 hover:text-gray-600 font-bold text-sm transition-all border-2 border-transparent hover:border-gray-100 rounded-2xl"
            >
              Passer cette étape
            </button> -->
            <button
              @click="nextStep"
              :disabled="submitting"
              class="flex-1 sm:w-64 px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
            >
              <span>Valider mes disponibilités</span>
              <span v-if="!submitting" class="material-icons-outlined text-xl"
                >event_available</span
              >
              <div
                v-else
                class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
              ></div>
            </button>
          </div>
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>


.font-outfit {
  font-family: "Outfit", sans-serif;
}

/* Option card styling synced from PositionnementView */
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
