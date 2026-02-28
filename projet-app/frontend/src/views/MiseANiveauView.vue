<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import axios from "axios";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions } from "../utils/conditionalQuestions";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import QuestionGroup from '../components/QuestionGroup.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const questions = ref([]);
const responses = ref({});
const loading = ref(true);
const submitting = ref(false);

// validation state
const unanswered = ref(false);

// (groups state removed – we'll compute on the fly)


// Computed: filter questions based on conditional logic and selected formation
const filteredQuestions = computed(() => {
  // apply conditional rules first
  let list = filterConditionalQuestions(questions.value, responses.value);
  // enforce formation-specific / global scope on client side as a safety net
  const formationSlug = localStorage.getItem("selected_formation_slug");
  if (formationSlug) {
    list = list.filter(q => {
      return !q.formation || q.formation.slug === formationSlug;
    });
  }
  return list;
});

// Grouping is derived from filteredQuestions
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

  // ensure workflow is loaded so skipping logic works even on reload
  if (store.workflowSteps.length === 0) {
    await store.fetchWorkflow();
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
    
    // backend should already limit to global + selected formation,
    // but we'll dedupe and keep the result in case of misconfiguration.
    const allQuestions = res.data || [];
    questions.value = Array.from(
      new Map(allQuestions.map((q) => [q.id ?? q.text, q])).values()
    );

    // if there are no relevant questions, skip this step immediately
    if (questions.value.length === 0) {
      const nextRoute = await store.getNextRouteWithQuestions("/mise-a-niveau");
      router.push(nextRoute || "/positionnement");
      return;
    }

    questions.value.forEach((q) => {
      if (q.responseType === "checkbox" || q.metadata?.type === "multi_select") {
        responses.value[q.id] = [];
      } else if (q.metadata?.type === "radio_toggle") {
        responses.value[q.id] = "Non";
      } else if (q.metadata?.type === "qcm" || q.responseType === "qcm") {
        responses.value[q.id] = null;
      } else {
        responses.value[q.id] = "";
      }
    });
    // groups will automatically recompute via computedGroups
  } catch (error) {
    console.error("Failed to fetch mise à niveau questions:", error);
    // if the request failed, there's nothing to answer – skip this step
    const nextRoute = await store.getNextRouteWithQuestions("/mise-a-niveau");
    router.push(nextRoute || "/positionnement");
    return;
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
    const nextRoute = await store.getNextRouteWithQuestions("/mise-a-niveau");
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
        <!-- <div class="hidden md:flex flex-col items-end mr-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Progression</span>
            <span class="text-[10px] text-brand-primary font-bold">Étape {{ store.getProgress("/mise-a-niveau").current }}/{{ store.getProgress("/mise-a-niveau").total }}</span>
          </div>
          <div class="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-brand-primary transition-all duration-700"
              :style="{ width: store.getProgress('/mise-a-niveau').percentage + '%' }"
            ></div>
          </div>
        </div> -->
      </template>
    </SiteHeader>
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 relative">
      <div class="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2 italic uppercase tracking-tight">Mise à niveau</h1>
        <p class="text-gray-400 text-sm md:text-base font-bold uppercase tracking-widest">Répondez aux questions pour adapter votre parcours</p>
        <p v-if="unanswered" class="text-red-500 font-black text-[10px] uppercase tracking-widest mt-4 flex items-center justify-center gap-2 animate-pulse">
          <span class="material-icons-outlined text-sm">warning</span>
          Toutes les questions doivent être complétées
        </p>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12 mb-4"></div>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chargement des questions...</p>
      </div>

      <div v-else class="space-y-8 animate-in fade-in duration-700 delay-200 pb-32">
        <QuestionGroup
          v-for="grp in computedGroups"
          :key="grp.title"
          :group="grp"
          :responses="responses"
          :unanswered="unanswered"
        />

        <!-- <div class="pt-8 flex justify-end md:hidden">
          <button @click="nextStep" :disabled="submitting" class="w-full px-8 py-4 bg-brand-primary text-[#428496] font-black uppercase rounded-2xl shadow-xl shadow-brand-primary/20">
            <span v-if="submitting" class="material-icons-outlined animate-spin">sync</span>
            <span v-else>Continuer</span>
          </button>
        </div> -->
      </div>
    </main>

    <!-- Bottom Actions Sticky -->
    <div class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-40">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button @click="router.push('/formations')" class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 transition-all hover:-translate-x-1">
          <span class="material-icons-outlined text-lg">arrow_back</span>
          Retour
        </button>

        <button @click="nextStep" :disabled="submitting" class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
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
/* No scoped styles needed as QuestionGroup/Item handle their own styling */
</style>
