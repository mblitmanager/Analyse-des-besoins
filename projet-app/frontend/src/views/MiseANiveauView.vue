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
  <div class="min-h-screen flex flex-col font-outfit">
    <SiteHeader />
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">Mise à niveau</h1>
        <p class="text-gray-400 text-base md:text-lg">Répondez aux questions pour adapter votre parcours.</p>
        <p v-if="unanswered" class="text-red-600 font-bold text-sm mt-2">Toutes les questions doivent être complétées.</p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="space-y-8">
        <div v-for="grp in computedGroups" :key="grp.title" class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
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
                <button v-for="opt in q.options" :key="opt" @click="responses[q.id] = opt" class="formation-card" :class="responses[q.id] === opt ? 'formation-card--selected' : 'formation-card--default'">
                  <span class="formation-card__label" v-html="formatBoldText(opt)"></span>
                  <div class="formation-card__radio" :class="responses[q.id] === opt ? 'formation-card__radio--selected' : 'formation-card__radio--default'">
                    <div v-if="responses[q.id] === opt" class="formation-card__radio-dot"></div>
                  </div>
                </button>
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
    <SiteFooter />
  </div>
</template>

<style scoped>
.Wizi-input { width:100%; padding:0.75rem; border-radius:1rem; border:1px solid #e5e7eb }
</style>
