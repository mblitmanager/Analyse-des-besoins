<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { useAppStore } from '../stores/app';
import { formatBoldText } from '../utils/formatText';
import { filterConditionalQuestions, clearHiddenResponses } from '../utils/conditionalQuestions';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const router = useRouter();
const route = useRoute();
const store = useAppStore();

const sessionId = localStorage.getItem("session_id");
const formationSlug = localStorage.getItem("selected_formation_slug");

const loading = ref(true);
const submitting = ref(false);
const questions = ref([]);
const responses = ref({});

const currentStepLabel = computed(() => {
  const step = store.actualWorkflowSteps.find(s => s.route === route.path);
  return step ? step.label : 'Questions';
});

// Computed: filter questions based on conditional logic
const filteredQuestions = computed(() => {
  return filterConditionalQuestions(questions.value, responses.value, questions.value);
});

onMounted(async () => {
  if (store.workflowSteps.length === 0 || store.actualWorkflowSteps.length === 0) {
    await store.updateActualWorkflow();
  }
  
  if (!sessionId) {
    router.push("/");
    return;
  }

  // Reload session to get previous answers
  let previousAnswers = {};
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const sessionRes = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const positionnementAnswers = sessionRes.data.positionnementAnswers || {};
    // Extract answers for this specific step (using route name as key)
    previousAnswers = positionnementAnswers[route.name] || {};
  } catch (err) {
    console.error("Failed to load session answers:", err);
  }

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    // route.name is the step code (e.g. 'identification')
    const params = formationSlug ? { formation: formationSlug, scope: "auto" } : { scope: "global" };
    
    const res = await axios.get(`${apiBaseUrl}/questions/workflow/${route.name}`, { params });
    questions.value = res.data || [];

    const initialResponses = {};
    questions.value.forEach((q) => {
      // Restore previous answer if it exists
      if (previousAnswers[q.id] !== undefined) {
          initialResponses[q.id] = previousAnswers[q.id];
      } else {
          // Initialize empty state based on question type
          if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
            initialResponses[q.id] = [];
          } else if (q.metadata?.type === "radio_toggle") {
            initialResponses[q.id] = null;
          } else if (q.metadata?.type === "qcm" || q.responseType === "qcm" || (q.options?.length > 0)) {
            initialResponses[q.id] = null;
          } else {
            initialResponses[q.id] = "";
          }
      }
    });
    responses.value = initialResponses;
  } catch (error) {
    console.error(`Failed to fetch questions for ${route.name}:`, error);
  } finally {
    loading.value = false;
  }
});

async function submitResponses() {
  const unanswered = filteredQuestions.value.some(q => {
     const ans = responses.value[q.id];
     if (Array.isArray(ans)) return ans.length === 0;
     return ans === null || ans === undefined || ans === "";
  });
  
  if (unanswered) {
    alert("Veuillez répondre à toutes les questions affichées.");
    return;
  }

  submitting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    
    // Clear responses for hidden questions
    clearHiddenResponses(questions.value, responses.value);

    // Save answers under positionnementAnswers[stepCode]
    const patchPayload = {
      positionnementAnswers: {
          [route.name]: responses.value
      }
    };

    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, patchPayload);
    
    const nextRoute = await store.getNextRouteWithQuestions(route.path);
    router.push(nextRoute || "/resultats");
  } catch (error) {
    console.error("Failed to submit:", error);
    alert("Erreur lors de la validation.");
  } finally {
    submitting.value = false;
  }
}

async function goBack() {
  // Try to find the previous step in the active workflow
  const list = store.actualWorkflowSteps.length > 0 ? store.actualWorkflowSteps : store.workflowSteps;
  const currentIndex = list.findIndex(s => s.route === route.path);
  if (currentIndex > 0) {
      router.push(list[currentIndex - 1].route);
  } else {
      router.push('/formations'); // Default fallback
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader />
    
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 relative">
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary mb-4"></div>
        <p class="text-blue-900 font-bold animate-pulse uppercase tracking-widest text-xs">Chargement...</p>
      </div>

      <div v-else-if="questions.length === 0" class="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
         <div class="bg-white rounded-3xl shadow-xl p-10 border border-white text-center max-w-lg">
            <div class="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-brand-primary mb-6">
                <span class="material-icons-outlined text-3xl">info</span>
            </div>
            <h2 class="text-2xl font-black text-blue-900 mb-2">Aucune question</h2>
            <p class="text-gray-500 font-medium mb-8">Il n'y a pas de questions configurées pour cette étape.</p>
            <button @click="submitResponses" class="w-full py-4 bg-brand-primary text-[#428496] font-black uppercase tracking-widest leading-none rounded-2xl shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95">
                Continuer
            </button>
         </div>
      </div>

      <div v-else class="space-y-8 animate-in fade-in duration-500">
        <!-- Progress Bar -->
        <div v-if="store.actualWorkflowSteps.length > 0" class="w-full h-2.5 bg-white rounded-full overflow-hidden mb-8 shadow-sm border border-gray-100">
          <div class="h-full bg-brand-primary transition-all duration-700" :style="{ width: store.getProgress(route.path).percentage + '%' }"></div>
        </div>

        <div class="text-center mb-10">
          <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">{{ currentStepLabel }}</h1>
        </div>

        <div class="bg-white rounded-l shadow-xl overflow-hidden border border-white mb-8">
          <div class="bg-brand-primary p-8 text-[#428496]">
            <div class="flex items-center">
              <span class="material-icons-outlined mr-3 text-l">assignment</span>
              <h2 class="text-l font-black uppercase tracking-tight">Vos Réponses</h2>
            </div>
          </div>

          <div class="p-8 space-y-12">
            <div v-for="(q, idx) in filteredQuestions" :key="q.id" class="space-y-6">
              <div class="flex items-start">
                <span class="shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-brand-primary font-black mr-4 border border-blue-100">
                  {{ idx + 1 }}
                </span>
                <p class="text-lg font-bold text-blue-900 mt-1" v-html="formatBoldText(q.text)"></p>
              </div>

              <!-- QCM / Radio Options -->
              <div v-if="q.options && q.options.length > 0 && q.responseType !== 'checkbox' && q.metadata?.type !== 'multi_select'" class="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-0 sm:ml-14">
                <label v-for="opt in q.options" :key="opt" class="option-card" :class="responses[q.id] === opt ? 'option-card--selected' : 'option-card--default'">
                  <input type="radio" :name="'q-' + q.id" v-model="responses[q.id]" :value="opt" class="hidden" />
                  <span class="option-card__label" v-html="formatBoldText(opt)"></span>
                  <div class="option-card__radio" :class="responses[q.id] === opt ? 'option-card__radio--selected' : 'option-card__radio--default'">
                    <div v-if="responses[q.id] === opt" class="option-card__radio-dot"></div>
                  </div>
                </label>
              </div>

              <!-- Checkbox / Multi-select Options -->
              <div v-else-if="q.options && q.options.length > 0 && (q.responseType === 'checkbox' || q.metadata?.type === 'multi_select')" class="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-0 sm:ml-14">
                <label v-for="opt in q.options" :key="opt" class="formation-card" :class="(responses[q.id] || []).includes(opt) ? 'formation-card--selected' : 'formation-card--default'">
                  <input type="checkbox" :name="'q-' + q.id" v-model="responses[q.id]" :value="opt" class="hidden" />
                  <span class="formation-card__label" v-html="formatBoldText(opt)"></span>
                  <div class="formation-card__radio" :class="(responses[q.id] || []).includes(opt) ? 'formation-card__radio--selected' : 'formation-card__radio--default'">
                    <span v-if="(responses[q.id] || []).includes(opt)" class="material-icons-outlined text-blue-600 text-xl">check</span>
                  </div>
                </label>
              </div>

              <!-- Text Input -->
              <div v-else class="ml-0 sm:ml-14">
                  <input v-if="!q.responseType || q.responseType === 'text'" v-model="responses[q.id]" type="text" class="Wizi-input w-full" placeholder="Votre réponse..." />
                  <textarea v-else-if="q.responseType === 'textarea'" v-model="responses[q.id]" class="Wizi-input w-full min-h-[100px] resize-y py-3" placeholder="Votre réponse..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-12 flex items-center justify-between border-t border-gray-50 mt-12">
          <button
            @click="goBack"
            class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-all"
          >
            <span class="material-icons-outlined text-lg">arrow_back</span>
            Retour
          </button>
 
          <button
            @click="submitResponses()"
            :disabled="submitting"
            class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
          >
            <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
            <span>{{ submitting ? 'Enregistrement...' : 'Continuer' }}</span>
            <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
:root {
  --color-brand-primary: #3b82f6;
  --title-color: #0d1b3e;
}

.font-outfit {
  font-family: "Outfit", sans-serif;
}

.heading-primary {
  color: var(--title-color);
}

.animate-in {
  animation-duration: 0.3s;
}

/* option-card styling reused from PrerequisView */
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

/* Checkbox specific styles based on PrerequisView formation-card */
.formation-card {
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

.formation-card:hover {
  border-color: #d1d5db;
  background: #e9ebee;
}

.formation-card--selected {
  border-color: #60a5fa; /* blue-400 */
  background: #f3f4f6; /* gray-100 */
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
}

.formation-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  text-align: left;
  flex: 1;
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
  border-color: #60a5fa;
  background: white;
}
</style>
