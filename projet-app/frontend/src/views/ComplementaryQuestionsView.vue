<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import axios from "axios";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions, clearHiddenResponses } from "../utils/conditionalQuestions";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const questions = ref([]);
const responses = ref({});
const loading = ref(true);
const submitting = ref(false);

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  if (store.workflowSteps.length === 0 || store.actualWorkflowSteps.length === 0) {
    await store.updateActualWorkflow();
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const formationSlug = localStorage.getItem("selected_formation_slug");
    const res = await axios.get(
      `${apiBaseUrl}/questions/workflow/complementary`,
      {
        params: formationSlug
          ? { formation: formationSlug, scope: "auto" }
          : { scope: "global" },
      },
    );
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
    // keep user on page even if load failed; they can try again or skip manually
  } finally {
    loading.value = false;
  }
});

async function nextStep() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    
    // Clear responses for questions that are currently hidden before saving
    clearHiddenResponses(questions.value, responses.value);

    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      complementaryQuestions: responses.value,
    });
    const nextRoute = await store.getNextRouteWithQuestions("/complementary");
    router.push(nextRoute || "/availabilities");
  } catch (error) {
    console.error("Failed to save complementary questions:", error);
  } finally {
    submitting.value = false;
  }
}

function shouldShowQuestion(q) {
  // Check multi-parent showIfRules / showIfQuestionId via shared util
  const filtered = filterConditionalQuestions([q], responses.value, questions.value);
  if (filtered.length === 0) return false;

  // Legacy metadata.condition support
  if (q.metadata?.condition) {
    if (q.metadata.condition === "handicap == 'Oui'") {
      const handicapQ = questions.value.find((item) =>
        item.text.toLowerCase().includes("handicap"),
      );
      return handicapQ ? responses.value[handicapQ.id] === "Oui" : false;
    }
  }
  return true;
}

async function skipStep() {
  const nextRoute = await store.getNextRouteWithQuestions("/complementary");
  router.push(nextRoute || "/availabilities");
}

</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader />

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <!-- Progress Bar -->
      <div v-if="store.actualWorkflowSteps.length > 0" class="w-full h-2.5 bg-white rounded-full overflow-hidden mb-8 shadow-sm border border-gray-100">
        <div class="h-full bg-brand-primary transition-all duration-700" :style="{ width: store.getProgress('/complementary').percentage + '%' }"></div>
      </div>

      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">
          Questions Complémentaires
        </h1>
        <p class="text-gray-400 text-base md:text-lg">On y est presque !<br>
          Quelques informations supplémentaires pour personnaliser votre
          parcours.
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
          <!-- <div
            class="px-6 py-5 border-b border-gray-100 flex items-center gap-3"
          >
            <div
              class="w-9 h-9 rounded-lg bg-blue-600/5 flex items-center justify-center"
            >
              <span class="material-icons-outlined text-blue-600 text-lg"
                >person_search</span
              >
            </div>
            <h2 class="text-base font-bold text-gray-800">Votre profil</h2>
          </div> -->
          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in questions" :key="q.id">
              <div v-if="shouldShowQuestion(q)" class="space-y-3">
                <div class="flex items-center gap-2">
                  <span
                    v-if="q.icon"
                    class="material-icons-outlined text-brand-primary text-sm"
                    >{{ q.icon }}</span
                  >
                  <p class="text-base font-bold heading-primary">
                    {{ q.text }}
                  </p>
                </div>

                <!-- Radio Toggle Type (Oui/Non) -->
                <div
                  v-if="q.metadata?.type === 'radio_toggle'"
                  class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <label
                    v-for="opt in q.options"
                    :key="opt"
                    class="option-card"
                    :class="
                      responses[q.id] === opt
                        ? 'option-card--selected'
                        : 'option-card--default'
                    "
                  >
                    <input
                      type="radio"
                      :name="'q-' + q.id"
                      v-model="responses[q.id]"
                      :value="opt"
                      class="hidden"
                    />
                    <span class="option-card__label" v-html="formatBoldText(opt)"></span>
                    <div
                      class="option-card__radio"
                      :class="
                        responses[q.id] === opt
                          ? 'option-card__radio--selected'
                          : 'option-card__radio--default'
                      "
                    >
                      <div
                        v-if="responses[q.id] === opt"
                        class="option-card__radio-dot"
                      ></div>
                    </div>
                  </label>
                </div>

                <!-- QCM Type (Multiple Choice) -->
                <div
                  v-else-if="q.metadata?.type === 'qcm'"
                  class="grid grid-cols-1 gap-3"
                >
                  <label
                    v-for="(opt, oIdx) in q.options"
                    :key="oIdx"
                    class="option-card"
                    :class="
                      responses[q.id] === opt
                        ? 'option-card--selected'
                        : 'option-card--default'
                    "
                  >
                    <input
                      type="radio"
                      :name="'q-' + q.id"
                      v-model="responses[q.id]"
                      :value="opt"
                      class="hidden"
                    />
                    <span class="option-card__label" v-html="formatBoldText(opt)"></span>
                    <div
                      class="option-card__radio"
                      :class="
                        responses[q.id] === opt
                          ? 'option-card__radio--selected'
                          : 'option-card__radio--default'
                      "
                    >
                      <div
                        v-if="responses[q.id] === opt"
                        class="option-card__radio-dot"
                      ></div>
                    </div>
                  </label>
                </div>

                <!-- Textarea Type -->
                <textarea
                  v-else-if="q.metadata?.type === 'textarea'"
                  v-model="responses[q.id]"
                  :rows="q.metadata.rows || 3"
                  :placeholder="q.metadata.placeholder || ''"
                  class="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-sm text-gray-700 shadow-sm"
                ></textarea>

                <!-- Dropdown Type (Liste déroulante) -->
                <div v-else-if="q.responseType === 'dropdown'" class="relative">
                  <select
                    v-model="responses[q.id]"
                    class="w-full px-5 py-4 pr-10 bg-white border-2 border-gray-100 rounded-2xl focus:border-brand-primary outline-none transition-all text-sm font-semibold text-gray-700 appearance-none shadow-sm cursor-pointer hover:border-gray-200"
                  >
                    <option value="" disabled>Sélectionnez une option...</option>
                    <option v-for="opt in q.options" :key="opt" :value="typeof opt === 'string' ? opt : opt.label">
                      {{ typeof opt === 'string' ? opt : opt.label }}
                    </option>
                  </select>
                  <span class="material-icons-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">expand_more</span>
                </div>

                <!-- Default Text Type (texte libre) -->
                <input
                  v-else
                  v-model="responses[q.id]"
                  type="text"
                  :placeholder="q.metadata?.placeholder || 'Votre réponse...'"
                  class="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-sm text-gray-700 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="pt-12 flex items-center justify-center border-t border-gray-50 mt-12 w-full">
          <button
            @click="nextStep"
            :disabled="submitting"
            class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
          >
            <span>Continuer</span>
            <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
            <div
              v-else
              class="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4"
            ></div>
          </button>
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
