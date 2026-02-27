<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import axios from "axios";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions } from "../utils/conditionalQuestions";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const questions = ref([]);
const responses = ref({});
const loading = ref(true);
const submitting = ref(false);

// validation state
const unanswered = ref(false);

// group questions by category for UI design
const groups = ref([]);

function buildGroups(questionsList) {
  const map = new Map();
  questionsList.forEach((q) => {
    const key = q.category || 'Général';
    if (!map.has(key)) {
      map.set(key, { title: key, icon: q.icon || 'quiz', questions: [] });
    }
    map.get(key).questions.push(q);
  });
  groups.value = Array.from(map.values());
}

// Computed: filter questions based on conditional logic
const filteredQuestions = computed(() => {
  return filterConditionalQuestions(questions.value, responses.value);
});

// Update groups when filtered questions change
const computedGroups = computed(() => {
  const map = new Map();
  filteredQuestions.value.forEach((q) => {
    const key = q.category || 'Général';
    if (!map.has(key)) {
      map.set(key, { title: key, icon: q.icon || 'quiz', questions: [] });
    }
    map.get(key).questions.push(q);
  });
  return Array.from(map.values());
});

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const formationSlug = localStorage.getItem("selected_formation_slug");
    
    // Fetch mise_à_niveau questions:
    // - scope: 'auto' => include global questions + formation-specific questions
    // - formation param => filter to this formation (excludes other formations)
    // Result: ONLY global + this formation's questions, NOT other formations
    const fetchParams = { scope: 'auto' };
    if (formationSlug) {
      fetchParams.formation = formationSlug;
    }
    
    const res = await axios.get(`${apiBaseUrl}/questions/workflow/mise_a_niveau`, {
      params: fetchParams,
    });
    questions.value = Array.from(new Map((res.data || []).map((q) => [q.id ?? q.text, q])).values());
    questions.value.forEach((q) => {
      if (q.metadata?.type === "radio_toggle") responses.value[q.id] = "Non";
      else if (q.metadata?.type === "qcm") responses.value[q.id] = null;
      else responses.value[q.id] = "";
    });
    buildGroups(filteredQuestions.value);
  } catch (error) {
    console.error("Failed to fetch mise à niveau questions:", error);
  } finally {
    loading.value = false;
  }
});


async function nextStep() {
  // check unanswered (on filtered questions only)
  unanswered.value = filteredQuestions.value.some(q => {
    const ans = responses.value[q.id];
    return ans === null || ans === "" || ans === undefined;
  });
  if (unanswered.value) {
    alert("Veuillez répondre à toutes les questions avant de continuer.");
    return;
  }

  submitting.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, { miseANiveauAnswers: responses.value });
    const nextRoute = store.getNextRoute("/mise-a-niveau");
    router.push(nextRoute || "/positionnement");
  } catch (error) {
    console.error("Failed to save mise à niveau answers:", error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader>
      <template #actions>
        <div class="hidden md:flex flex-col items-end mr-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mise à niveau</span>
            <span class="text-[10px] text-brand-primary font-bold">Étape 1 / 2</span>
          </div>
        </div>
      </template>
    </SiteHeader>
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 relative">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">Mise à niveau</h1>
        <p class="text-gray-400 text-base md:text-lg">Répondez aux questions pour adapter votre parcours.</p>
        <p v-if="unanswered" class="text-red-600 font-bold text-sm mt-2">Toutes les questions doivent être complétées.</p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="space-y-8">
        <div v-for="grp in computedGroups" :key="grp.title" class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white">
          <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-indigo-600/5 flex items-center justify-center">
              <span class="material-icons-outlined text-indigo-600 text-lg">{{ grp.icon }}</span>
            </div>
            <h2 class="text-base font-bold text-gray-800">{{ grp.title }}</h2>
          </div>
          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in grp.questions" :key="q.id" :class="['space-y-3', { 'border border-red-400 rounded-lg p-3': unanswered && (responses[q.id] === null || responses[q.id] === '' || responses[q.id] === undefined) }]">
              <div class="flex items-center gap-2">
                <p class="text-base font-bold heading-primary">{{ q.text }}</p>
              </div>
              <div v-if="q.metadata?.type === 'radio_toggle'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label v-for="opt in q.options" :key="opt" class="option-card" :class="responses[q.id] === opt ? 'option-card--selected' : 'option-card--default'">
                  <input type="radio" :name="'q-' + q.id" v-model="responses[q.id]" :value="opt" class="hidden" />
                  <span class="option-card__label" v-html="formatBoldText(opt)"></span>
                  <div class="option-card__radio" :class="responses[q.id] === opt ? 'option-card__radio--selected' : 'option-card__radio--default'">
                    <div v-if="responses[q.id] === opt" class="option-card__radio-dot"></div>
                  </div>
                </label>
              </div>
              <div v-else-if="q.metadata?.type === 'qcm'" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label v-for="opt in q.options" :key="opt" class="option-card" :class="responses[q.id] === opt ? 'option-card--selected' : 'option-card--default'">
                  <input type="radio" :name="'q-' + q.id" v-model="responses[q.id]" :value="opt" class="hidden" />
                  <span class="option-card__label" v-html="formatBoldText(opt)"></span>
                  <div class="option-card__radio" :class="responses[q.id] === opt ? 'option-card__radio--selected' : 'option-card__radio--default'">
                    <div v-if="responses[q.id] === opt" class="option-card__radio-dot"></div>
                  </div>
                </label>
              </div>
              <div v-else>
                <input v-model="responses[q.id]" type="text" class="Wizi-input" />
              </div>
            </div>
          </div>
        </div>

        <div class="pt-8 flex justify-end">
          <button @click="nextStep" :disabled="submitting" class="px-8 py-4 bg-brand-primary text-[#428496] font-black uppercase rounded-2xl">
            <span v-if="submitting" class="material-icons-outlined animate-spin">sync</span>
            <span v-else>Continuer</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Bottom Actions Sticky -->
    <div class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-40">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button @click="router.push('/')" class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors">
          <span class="material-icons-outlined text-lg">arrow_back</span>
          Retour
        </button>

        <button @click="nextStep" :disabled="submitting" class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
          <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
          <span>{{ submitting ? 'Enregistrement...' : 'Continuer' }}</span>
          <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.Wizi-input { width:100%; padding:0.75rem; border-radius:1rem; border:1px solid #e5e7eb }

/* reuse option-card styles for radio selections */
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
