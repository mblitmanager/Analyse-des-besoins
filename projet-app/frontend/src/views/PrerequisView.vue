<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import { formatBoldText } from "../utils/formatText";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const questions = ref([]);
const responses = ref({});
const groups = ref([]);

const metier = ref("");
// allow multiple situations via checkboxes
const situation = ref([]);
const showProposal = ref(false);

const itSkillsTriggered = computed(() => {
  return Object.values(responses.value).some(
    (val) => String(val).toLowerCase() === "insuffisant"
  );
});

const needsPagination = computed(() => false); // Disable for this specific screen

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const sessionRes = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const session = sessionRes.data;

    metier.value = session.metier || "";
    // ensure situation is an array
    situation.value = Array.isArray(session.situation) ? session.situation : (session.situation ? [session.situation] : []);

    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: formationSlug ? { scope: "auto", formation: formationSlug } : { scope: "global" },
    });
    
    // Filter for Screen 2 questions
    const itKeywords = ["ordinateur", "windows", "internet", "dossier", "clavier", "souris"];
    questions.value = (res.data || []).filter(q => 
      itKeywords.some(kw => q.text.toLowerCase().includes(kw))
    );

    questions.value.forEach((q) => {
      if (q.responseType === "text") {
        responses.value[q.id] = "";
      } else {
        responses.value[q.id] = null;
      }
    });

    groups.value = [
      {
        title: "Compétences Numériques",
        icon: "devices",
        questions: questions.value
      }
    ];
  } catch (error) {
    console.error("Failed to fetch prerequisites:", error);
  } finally {
    loading.value = false;
  }
});

async function submitPrerequis(force = false) {
  const isForced = force === true;
  if (!metier.value || !situation.value.length) {
    alert("Veuillez renseigner votre métier et au moins une situation.");
    return;
  }

  const unanswered = questions.value.some(q => !responses.value[q.id]);
  if (unanswered) {
    alert("Veuillez répondre à toutes les questions.");
    return;
  }

  if (itSkillsTriggered.value && !showProposal.value && !isForced) {
    showProposal.value = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      metier: metier.value,
      situation: situation.value, // already an array from checkboxes
      prerequisiteScore: responses.value,
    });
    
    if (showProposal.value) {
       await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
          formationChoisie: "Parcours Initial (DigComp & Word)",
          finalRecommendation: "DigComp Initial | Word Initial",
       });
       router.push("/resultats");
    } else {
       router.push("/formations");
    }
  } catch (error) {
    console.error("Failed to submit:", error);
    alert("Erreur lors de la validation.");
  } finally {
    submitting.value = false;
  }
}

function refuseProposal() {
  showProposal.value = false;
  submitPrerequis(true); 
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader>
      <template #actions>
        <div class="hidden md:flex flex-col items-end mr-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Analyse des besoins</span>
            <span class="text-[10px] text-brand-primary font-bold">Étape 2 / 2</span>
          </div>
        </div>
      </template>
    </SiteHeader>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 relative">
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary mb-4"></div>
        <p class="text-blue-900 font-bold animate-pulse uppercase tracking-widest text-xs">Chargement...</p>
      </div>

      <div v-else class="space-y-8 animate-in fade-in duration-500">
        <!-- Overlay Proposition Spéciale -->
        <div v-if="showProposal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
          <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-blue-100 animate-in fade-in zoom-in duration-300">
            <div class="h-20 w-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto text-brand-primary">
              <span class="material-icons-outlined text-4xl">lightbulb</span>
            </div>
            <h2 class="text-2xl font-black text-blue-900 mb-4 text-center">Parcours Recommandé</h2>
            <p class="text-gray-600 mb-8 text-center leading-relaxed">
              Au vu de vos réponses sur les compétences numériques de base, nous vous suggérons de débuter par un renforcement initial :
            </p>
            <div class="space-y-3 mb-8">
              <div class="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span class="material-icons-outlined text-blue-600 mr-3">star_outline</span>
                <span class="font-bold text-blue-900">DigComp Initial</span>
              </div>
              <div class="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span class="material-icons-outlined text-blue-600 mr-3">description</span>
                <span class="font-bold text-blue-900">Word Initial</span>
              </div>
            </div>
            <div class="flex flex-col space-y-3">
              <button @click="submitPrerequis()" class="w-full py-4 bg-brand-primary text-[#428496] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95">
                Accepter et voir mon bilan
              </button>
              <button @click="refuseProposal" class="w-full py-4 text-gray-500 font-bold text-sm hover:text-blue-900 transition-colors">
                Ignorer et continuer
              </button>
            </div>
          </div>
        </div>

        <div class="text-center mb-10">
          <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">Bloc Commun - Étape 2</h1>
          <p class="text-gray-400 text-sm font-bold uppercase tracking-widest">Situation & Compétences Numériques</p>
        </div>

        <!-- Section 1 : Situation -->
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white p-8">
          <div class="flex items-center mb-8">
            <div class="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mr-4 text-brand-primary">
              <span class="material-icons-outlined">work_outline</span>
            </div>
            <h2 class="text-xl font-black text-blue-900 uppercase tracking-tight">Votre Profil</h2>
          </div>

          <div class="grid grid-cols-1 gap-8">
            <div>
              <label class="Wizi-label">Votre métier (poste actuel)</label>
              <input v-model="metier" type="text" class="Wizi-input" placeholder="Ex: Assistant administratif, Comptable..." />
            </div>

            <div>
              <label class="Wizi-label font-black text-[10px] uppercase tracking-widest text-gray-400 mb-4 block">Votre situation actuelle</label>
              <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="sit in ['Salarié', 'Indépendant', 'Demandeur d’emploi', 'Reconversion']" :key="sit"
                     class="formation-card"
                     :class="situation.includes(sit) ? 'formation-card--selected' : 'formation-card--default'">
                  <label class="flex items-center w-full cursor-pointer justify-between">
                    <input type="checkbox" class="sr-only" :value="sit" v-model="situation" />
                    <div class="flex items-center gap-4">
                       <div :class="situation.includes(sit) ? 'bg-blue-400/10 text-blue-400' : 'bg-white text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-gray-100">
                          <span class="material-icons-outlined text-xl">person_outline</span>
                       </div>
                       <span class="formation-card__label">{{ sit }}</span>
                    </div>
                    <div class="formation-card__radio" :class="situation.includes(sit) ? 'formation-card__radio--selected' : 'formation-card__radio--default'">
                      <span v-if="situation.includes(sit)" class="material-icons-outlined text-blue-600 text-xl">check</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2 : IT Skills -->
        <div v-for="group in groups" :key="group.title" class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white mb-8">
          <div class="bg-[#eab973] p-8 text-white">
            <div class="flex items-center">
              <span class="material-icons-outlined mr-3 text-3xl">{{ group.icon }}</span>
              <h2 class="text-2xl font-black uppercase tracking-tight">{{ group.title }}</h2>
            </div>
          </div>

          <div class="p-8 space-y-12">
            <div v-for="(q, idx) in group.questions" :key="q.id" class="space-y-6">
              <div class="flex items-start">
                <span class="shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-brand-primary font-black mr-4 border border-blue-100">
                  {{ idx + 1 }}
                </span>
                <p class="text-lg font-bold text-blue-900 mt-1">{{ q.text }}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 ml-0 sm:ml-14">
                <label v-for="opt in q.options" :key="opt" class="option-card" :class="responses[q.id] === opt ? 'option-card--selected' : 'option-card--default'">
                  <input type="radio" :name="'q-' + q.id" v-model="responses[q.id]" :value="opt" class="hidden" />
                  <span class="option-card__label" v-html="formatBoldText(opt)"></span>
                  <div class="option-card__radio" :class="responses[q.id] === opt ? 'option-card__radio--selected' : 'option-card__radio--default'">
                    <div v-if="responses[q.id] === opt" class="option-card__radio-dot"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Padding for sticky bar -->
        <div class="h-32"></div>
      </div>
    </main>

    <!-- Bottom Actions Sticky -->
    <div class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-40">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button @click="router.push('/')" class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors">
          <span class="material-icons-outlined text-lg">arrow_back</span>
          Retour
        </button>

        <button @click="submitPrerequis()" :disabled="submitting"
                class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30">
          <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
          <span>{{ submitting ? 'Validation...' : 'Valider mon profil' }}</span>
          <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>

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

/* Formation card style alignment */
.formation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  min-height: 4.5rem;
  background: #f1f5f9;
  border: 1px solid #f1f5f9;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.formation-card:hover {
  background: #e2e8f0;
  border-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
}

.formation-card:active {
  transform: translateY(0) scale(0.98);
}

.formation-card--selected {
  border-color: #60a5fa; /* blue-400 */
  background: #f3f4f6; /* gray-100 */
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
}

.formation-card__label {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--title-color);
  text-align: left;
  line-height: 1.25;
  transition: color 0.3s ease;
}

.formation-card--selected .formation-card__label {
  color: #60a5fa; /* blue-400 */
}

.formation-card__radio {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
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

/* remove dot style since we now use icon */
.formation-card__radio-dot {
  display: none;
}

.animate-in {
  animation-duration: 0.3s;
}

/* option-card styling reused from other views for radio questions */
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
