<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import axios from "axios";
import { formatBoldText } from "../utils/formatText";
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
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const formationSlug = localStorage.getItem("selected_formation_slug");
    const res = await axios.get(`${apiBaseUrl}/questions/workflow/mise_a_niveau`, {
      params: formationSlug ? { formation: formationSlug, scope: 'auto' } : { scope: 'global' },
    });
    questions.value = Array.from(new Map((res.data || []).map((q) => [q.id ?? q.text, q])).values());
    questions.value.forEach((q) => {
      if (q.metadata?.type === "radio_toggle") responses.value[q.id] = "Non";
      else if (q.metadata?.type === "qcm") responses.value[q.id] = null;
      else responses.value[q.id] = "";
    });
  } catch (error) {
    console.error("Failed to fetch mise à niveau questions:", error);
  } finally {
    loading.value = false;
  }
});

async function nextStep() {
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
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in questions" :key="q.id" class="space-y-3">
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
