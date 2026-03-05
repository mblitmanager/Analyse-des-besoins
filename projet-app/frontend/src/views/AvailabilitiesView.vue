<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions, clearHiddenResponses } from "../utils/conditionalQuestions";
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

  let displayLevel = level;
  if (displayLevel && !displayLevel.toLowerCase().includes("niveau")) {
      displayLevel = `Niveau ${displayLevel}`;
  }

  return `${session.value.formationChoisie || ""}${
    displayLevel ? " - " + displayLevel : ""
  }`.trim();
});

function isQuestionVisible(q) {
  return filterConditionalQuestions([q], responses.value, questions.value).length > 0;
}


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
    const initialResponses = {};
    questions.value.forEach((q) => {
      if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
        initialResponses[q.id] = [];
      } else if (q.metadata?.type === "radio_toggle") {
        initialResponses[q.id] = null;  // no default selection
      } else if (q.metadata?.type === "qcm" || q.responseType === "qcm" || (q.options?.length > 0)) {
        initialResponses[q.id] = null;
      } else {
        initialResponses[q.id] = "";
      }
    });
    responses.value = initialResponses;
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
    
    // Clear responses for questions that are currently hidden before saving
    clearHiddenResponses(questions.value, responses.value);

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

function getOptionIcon(opt) {
  const o = opt.toLowerCase();
  if (o.includes("matin")) return "light_mode";
  if (o.includes("après-midi") || o.includes("apres-midi")) return "wb_twilight";
  if (o.includes("12h") || o.includes("14h") || o.includes("midi") || o.includes("déjeuner")) return "restaurant";
  if (o.includes("journée") || o.includes("journee")) return "wb_sunny";
  return null;
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
        <h2 class="text-[25px] text-gray-400 font-bold uppercase tracking-widest">Etape 5/5</h2>
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
          class="bg-[#5fa0a] rounded-3xl shadow-xl border border-white overflow-hidden"
        >
          <!-- <div
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
          </div> -->

          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in questions" :key="q.id" v-show="isQuestionVisible(q)" class="space-y-3">
              <div class="flex items-center gap-2">
                <span
                  v-if="q.icon"
                  class="material-icons-outlined text-brand-primary text-sm"
                  >{{ q.icon }}</span
                >
                <p class="text-base font-bold heading-primary">{{ q.text }}</p>
              </div>

              <!-- QCM Type (Selection Cards) -->
              <div
                v-if="q.responseType === 'qcm' || q.metadata?.type === 'qcm' || (q.options?.length > 0 && q.metadata?.type !== 'multi_select')"
                :class="q.text.includes('moment êtes-vous disponible') ? 'grid grid-cols-2 md:grid-cols-4 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'"
              >
                <label
                  v-for="opt in q.options"
                  :key="opt"
                  class="option-card"
                  :class="[
                    responses[q.id] === opt ? 'option-card--selected' : 'option-card--default',
                    q.text.includes('moment êtes-vous disponible') ? 'flex-col py-6 px-4 text-center' : 'flex-row py-4 px-6'
                  ]"
                >
                  <input
                    type="radio"
                    :name="'q-' + q.id"
                    v-model="responses[q.id]"
                    :value="opt"
                    class="hidden"
                  />
                  <!-- Icon for availability time slots -->
                  <div 
                    v-if="q.text.includes('moment êtes-vous disponible') && getOptionIcon(opt)"
                    class="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
                    :class="responses[q.id] === opt ? 'bg-[brand-primary] text-[#eab973] shadow-lg shadow-brand-primary/20' : 'bg-gray-100 text-gray-400'"
                  >
                    <span class="material-icons-outlined text-2xl">{{ getOptionIcon(opt) }}</span>
                  </div>

                  <div class="flex-1 flex flex-col items-center">
                    <span 
                      class="option-card__label" 
                      :class="{'text-center': q.text.includes('moment êtes-vous disponible'), 'font-black uppercase tracking-widest text-[11px]': q.text.includes('moment êtes-vous disponible')}"
                      v-html="formatBoldText(opt)"
                    ></span>
                  </div>

                  <div 
                    v-if="!q.text.includes('moment êtes-vous disponible')"
                    class="option-card__radio" 
                    :class="responses[q.id] === opt ? 'option-card__radio--selected' : 'option-card__radio--default'"
                  >
                    <div v-if="responses[q.id] === opt" class="option-card__radio-dot"></div>
                  </div>

                  <!-- Checkmark for specific vertical cards -->
                  <div 
                    v-if="q.text.includes('moment êtes-vous disponible') && responses[q.id] === opt"
                    class="absolute top-3 right-3 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center text-white scale-110 shadow-sm"
                  >
                    <span class="material-icons-outlined text-[12px] bg-transparent font-bold">check</span>
                  </div>
                </label>
              </div>

              <!-- Multi-Select Type (créneaux) -->
              <div
                v-else-if="q.metadata?.type === 'multi_select'"
                class="grid grid-cols-1 md:grid-cols-3 gap-2"
              >
                <label
                  v-for="(opt, idx) in q.options"
                  :key="opt"
                  class="option-card h-auto! flex-col! items-center! py-2.5!"
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
                    class="material-icons-outlined text-lg mb-1 transition-colors"
                    :class="
                      responses[q.id].includes(opt)
                        ? 'text-brand-primary'
                        : 'text-gray-300'
                    "
                  >
                    {{ q.metadata.icons[idx] }}
                  </span>
                  <span 
                    class="option-card__label text-center! text-[13px] font-bold"
                    :class="responses[q.id].includes(opt) ? 'text-brand-primary' : 'text-gray-700'"
                    v-html="formatBoldText(opt)"
                  ></span>
                  

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
        <div class="pt-12 flex items-center justify-between border-t border-gray-50 mt-12 w-full">
          <!-- Retour button -->
          <button
            @click="router.push('/complementary')"
            class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-all disabled:opacity-20"
            :disabled="submitting"
          >
            <span class="material-icons-outlined text-lg">arrow_back</span>
            Retour
          </button>

          <button
            @click="nextStep"
            :disabled="submitting"
            class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
          >
            <span>Valider mes disponibilités</span>
            <span v-if="!submitting" class="material-icons-outlined text-xl"
              >event_available</span
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
  background: #f8fafc;
  border: 2px solid #f1f5f9;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.option-card--default:hover {
  border-color: #e2e8f0;
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
}

.option-card--selected {
  border-color: var(--color-brand-primary, #3b82f6);
  background: white;
  box-shadow: 0 15px 30px -10px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.option-card__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
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
