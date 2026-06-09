<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import { formatBoldText } from "../utils/formatText";
import { filterConditionalQuestions, clearHiddenResponses } from "../utils/conditionalQuestions";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import WorkflowProgressBar from '../components/WorkflowProgressBar.vue';
import { useToastStore } from "../stores/toast";

const store = useAppStore();
const router = useRouter();
const toast = useToastStore();
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

const itSkillsTriggered = computed(() => false); // Now handled by backend rules

const currentFormationName = computed(() => {
  const slug = localStorage.getItem("selected_formation_slug") || "Word";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
});

const needsPagination = computed(() => false);

function isQuestionVisible(q) {
  return filterConditionalQuestions([q], responses.value, questions.value).length > 0;
}

onMounted(async () => {
  if (store.workflowSteps.length === 0 || store.actualWorkflowSteps.length === 0) {
    await store.updateActualWorkflow();
  }
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const sessionRes = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const session = sessionRes.data;
    const formationSlug = localStorage.getItem("selected_formation_slug");

    metier.value = session.metier || "";
    // ensure situation is an array
    situation.value = Array.isArray(session.situation) ? session.situation : (session.situation ? [session.situation] : []);

    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: formationSlug ? { scope: "auto", formation: formationSlug } : { scope: "global" },
    });
    
    // Exclude questions already handled in Section 1 (Job and Situation)
    const excludedKeywords = ["métier", "situation actuelle"];
    questions.value = (res.data || []).filter(q => 
      !excludedKeywords.some(kw => q.text.toLowerCase().includes(kw))
    );

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

const proposalMessage = ref("");
const proposalFormationLabel = ref(""); // Stores the actual formation recommendation from backend

async function submitPrerequis(force = false) {
  const isForced = force === true;
  if (!metier.value || !situation.value.length) {
    toast.error("Veuillez renseigner votre métier et au moins une situation.");
    return;
  }

  const unanswered = questions.value.some(q => !responses.value[q.id]);
  if (unanswered) {
    toast.error("Veuillez répondre à toutes les questions.");
    return;
  }

  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    
    // Clear responses for questions that are currently hidden before saving
    clearHiddenResponses(questions.value, responses.value);

    // 1. Save answers first
    const patchPayload = {
      metier: metier.value,
      situation: situation.value,
      prerequisiteScore: responses.value,
      // Always sync this flag: if user did not force ignore, we must reactivate rules.
      ignoreQuestionRules: isForced,
    };

    const patchRes = await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, patchPayload);
    
    const session = patchRes.data;

    // 2. Check if a Question Rule was triggered
    if (session.isQuestionRuleOverride && !isForced) {
      if (session.ruleResultType === 'BLOCK') {
        // Direct jump to results if it's a block
        router.push("/resultats");
        return;
      } else {
        // Show proposal if it's a custom message
        proposalMessage.value = session.recommendation || "Nous vous suggérons un parcours de renforcement.";
        // Store the actual formation recommendation from backend for later use
        proposalFormationLabel.value = session.finalRecommendation || 
          (session.recommendations && session.recommendations.length > 0 ? session.recommendations.join(" & ") : "");
        showProposal.value = true;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    // Normal flow
    router.push("/formations");
  } catch (error) {
    console.error("Failed to submit:", error);
    toast.error("Erreur lors de la validation.");
  } finally {
    submitting.value = false;
  }
}

async function acceptProposal() {
  // Save the recommended formation as formationChoisie before navigating
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    // Use the real formation label from the backend recommendation
    // Fall back to the parsed proposal message if backend didn't provide it
    let formationLabel = proposalFormationLabel.value || recommendedFormations.value.join(" & ");
    // Clean: keep only the first option from each step (remove alternatives after /)
    // e.g. "TOSA Digcomp Initial & TOSA Word Initial / TOSA Excel Initial" → "TOSA Digcomp Initial & TOSA Word Initial"
    if (formationLabel) {
      formationLabel = formationLabel
        .split(/\s*&\s*/)
        .map(step => step.split(/\s*\/\s*/)[0].trim())
        .filter(Boolean)
        .join(" & ");
    }
    if (formationLabel) {
      await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
        formationChoisie: formationLabel,
        skipFormationReset: true, // Prevent backend from resetting data (not a DB column)
      });
    }
  } catch (error) {
    console.error("Failed to save recommended formation:", error);
  }
  router.push("/resultats");
}

function refuseProposal() {
  showProposal.value = false;
  submitPrerequis(true); 
}
const recommendedFormations = computed(() => {
  if (!proposalMessage.value) return [];
  // Split by | or & and trim
  return proposalMessage.value.split(/[|&]/).map(f => f.trim());
});
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader />

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 relative">
      <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary mb-4"></div>
        <p class="text-blue-900 font-bold animate-pulse uppercase tracking-widest text-xs">Chargement...</p>
      </div>

      <div v-else class="space-y-8 animate-in fade-in duration-500">
        <!-- Overlay Proposition Spéciale (Dynamique via QuestionRules) -->
        <div v-if="showProposal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-secondary/40 backdrop-blur-sm">
          <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-blue-100 animate-in fade-in zoom-in duration-300">
            <!-- <div class="h-20 w-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto text-brand-primary">
              <span class="material-icons-outlined text-4xl">lightbulb</span>
            </div> -->
            <h2 class="text-2xl font-black text-blue-900 mb-4 text-center">Parcours Recommandé</h2>
            <p class="text-gray-500 mb-6 text-center text-sm font-medium">
              Afin de sécuriser votre parcours, nous vous suggérons de débuter par :
            </p>

            <div class="flex flex-col gap-3 mb-8">
              <div 
                v-for="(f, i) in recommendedFormations" 
                :key="i"
                class="px-5 py-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-300"
                :style="{ animationDelay: `${i * 100}ms` }"
              >
                <div class="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-primary">
                  <span class="material-icons-outlined">school</span>
                </div>
                <span class="text-blue-900 font-bold text-sm">{{ f }}</span>
              </div>
            </div>
            
            <div class="flex flex-col space-y-3">
              <button @click="acceptProposal" class="w-full py-4 bg-[#ebb872] text-[#305364] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-105 transition-all active:scale-95 cursor-pointer">
                Accepter et voir mon bilan
              </button>
              <button @click="refuseProposal" class="w-full py-4 text-gray-500 font-bold text-sm hover:text-blue-900 transition-colors">
                Ignorer et continuer
              </button>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <WorkflowProgressBar customPath="/prerequis" />

        <div class="text-center mb-10">
          <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">Situation & Compétences Numériques</h1>
        </div>

        <!-- Section 1 : Situation -->
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white p-8">
          <div class="flex items-center mb-8">
            <div class="h-12 w-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mr-4 text-brand-primary">
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
              <label class="Wizi-label font-black text-[10px] uppercase tracking-widest text-blue-500 mb-6 block">Votre situation actuelle</label>
              <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div v-for="sit in ['Salarié', 'Indépendant', 'Demandeur d’emploi', 'Reconversion']" :key="sit"
                     class="formation-card group relative overflow-hidden transition-all duration-300"
                     :class="situation.includes(sit) ? 'formation-card--selected' : 'formation-card--default bg-gray-50/50 hover:bg-white'">
                  <label class="flex items-center w-full cursor-pointer justify-between p-1">
                    <input type="checkbox" class="sr-only" :value="sit" v-model="situation" />
                    <div class="flex items-center gap-4">
                       <div :class="situation.includes(sit) ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 border-gray-100'" class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm border group-hover:scale-110">
                          <span class="material-icons-outlined text-2xl">
                            {{ sit === 'Salarié' ? 'work' : sit === 'Indépendant' ? 'storefront' : sit === 'Demandeur d’emploi' ? 'search' : 'psychology' }}
                          </span>
                       </div>
                       <span class="text-base font-black text-[#0d1b3e]">{{ sit }}</span>
                    </div>
                    <div class="w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center" 
                         :class="situation.includes(sit) ? 'border-blue-500 bg-blue-500' : 'border-gray-200'">
                      <span v-if="situation.includes(sit)" class="material-icons-outlined text-white text-base">check</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-for="group in groups" :key="group.title" class="bg-white rounded-3xl shadow-2xl shadow-blue-500/5 overflow-hidden border border-white mb-10 group">
          <div class="bg-gray p-8 text-blue relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div class="flex items-center gap-4 relative z-10">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span class="material-icons-outlined text-2xl text-blue-500">{{ group.icon }}</span>
              </div>
              <h2 class="text-xl font-black uppercase tracking-tight">{{ group.title }}</h2>
            </div>
          </div>

          <div class="p-8 space-y-12">
            <div v-for="(q, idx) in group.questions" :key="q.id" v-show="isQuestionVisible(q)" class="space-y-6">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black border border-blue-100 shadow-sm">
                  {{ idx + 1 }}
                </div>
                <p class="text-xl font-black text-[#0d1b3e]">{{ q.text }}</p>
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

        <div class="pt-12 flex items-center justify-between border-t border-gray-50 mt-12">
          <button
            @click="router.push('/')"
            class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-all"
          >
            <span class="material-icons-outlined text-lg">arrow_back</span>
            Retour
          </button>
 
          <button
            @click="submitPrerequis()"
            :disabled="submitting"
            class="px-12 py-5 bg-[#ebb872] text-[#305364] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#ebb872]/20 hover:brightness-105 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 cursor-pointer"
          >
            <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
            <span>{{ submitting ? 'Validation...' : 'Valider mon profil' }}</span>
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
  --brand-primary: #3b82f6;
  --title-color: #1e3a8a;
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
  border-color: #3b82f6; 
  background: rgba(59, 130, 246, 0.05); 
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
  color: #3b82f6; 
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
  border-color: #3b82f6;
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
  border-color: var(--brand-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.05);
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
  color: var(--brand-primary, #3b82f6);
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
  border-color: var(--brand-primary, #3b82f6);
  background: var(--brand-primary, #3b82f6);
}

.option-card__radio-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
}
</style>
