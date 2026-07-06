<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import WorkflowProgressBar from '../components/WorkflowProgressBar.vue';
import { useToastStore } from "../stores/toast";
import { getSessionParcoursTitle } from "../utils/parcoursLabel";

const store = useAppStore();
const router = useRouter();
const toast = useToastStore();
const sessionId = localStorage.getItem("session_id");
const session = ref(null);
const loading = ref(true);
const showP3Modal = ref(false);

const levelsEntries = computed(() => {
  if (!session.value?.levelsScores) return [];
  return Object.entries(session.value.levelsScores);
});

// Global score is computed only from the positionnement (pretest) score
const globalScore = computed(() => {
  if (!session.value) return 0;
  // use explicit pretest/positionnement score provided by the backend
  return Number(session.value.scorePretest || 0);
});

const validatedLevelsCount = computed(() => {
  return levelsEntries.value.filter(([, val]) => val?.validated).length;
});

const recommendedLabel = computed(() => {
  if (!session.value) return "";
  const title = getSessionParcoursTitle(session.value);
  if (title) return title;
  if (session.value.finalRecommendation)
    return session.value.finalRecommendation;

  const level =
    session.value.stopLevel || session.value.lastValidatedLevel || "";

  if (!session.value.formationChoisie && !level) return "Parcours personnalisé";

  return `${session.value.formationChoisie || ""} - ${level}`.trim();
});

const recommendedLabelParts = computed(() => {
  if (!recommendedLabel.value) return [];
  // Split the exact ' & ' string or ' | ' returned by the logic
  const rawParts = recommendedLabel.value.split(/\s*&\s*|\s*\/\s*|\s*\|\s*/);
  
  return rawParts.map(p => {
      let cleaned = p.trim();
      if (session.value?.formationChoisie && cleaned.startsWith(session.value.formationChoisie)) {
          cleaned = cleaned.replace(session.value.formationChoisie, "").replace(/^- /, "").trim();
      }
      
      const lowerCleaned = cleaned.toLowerCase();
      if (cleaned && 
          !lowerCleaned.includes("niveau") && 
          !lowerCleaned.includes("initial") &&
          cleaned !== "Parcours personnalisé") {
          cleaned = `${cleaned}`;
      }
      
      return cleaned;
  }).filter(p => p !== "");
});

// Hide "Formation visée" when it's essentially the same as the recommended parcours
// (e.g., when user was redirected by a QuestionRule without choosing a formation)
const isFormationSameAsRecommendation = computed(() => {
  if (!session.value) return false;
  const fc = (session.value.formationChoisie || "").toLowerCase().trim();
  const fr = (session.value.finalRecommendation || "").toLowerCase().trim();
  if (!fc || !fr) return false;
  // Check if formationChoisie is contained in finalRecommendation or vice versa
  // Also check if they share the same main formations (ignoring separators)
  const normalize = (s) => s.replace(/[\/|&]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalize(fc) === normalize(fr) || fc.includes(fr) || fr.includes(fc);
});

const totalLevelsCount = computed(() => levelsEntries.value.length);

const answeredPrereqCount = computed(() => {
  if (!session.value?.prerequisiteScore) return 0;
  return Object.keys(session.value.prerequisiteScore).length;
});

const isP3Enabled = ref(true);

onMounted(async () => {
  if (store.workflowSteps.length === 0 || store.actualWorkflowSteps.length === 0) {
    await store.updateActualWorkflow();
  }
  
  // Check if P3 is enabled in settings
  const p3Setting = await store.fetchSetting('ENABLE_P3');
  // Only enable if the setting is explicitly 'true'. If missing or 'false', disable it.
  isP3Enabled.value = (p3Setting === 'true');

  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${apiBaseUrl}/sessions/${sessionId}`);
    session.value = await response.json();
    
    // Automatically trigger submission/email if not already completed
    if (!session.value.isCompleted && !session.value.emailSentAt) {
      await validate({ silent: true });
    }
  } catch (error) {
    console.error("Failed to fetch session:", error);
  } finally {
    loading.value = false;
  }
});

async function validate(options = {}) {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    await fetch(`${apiBaseUrl}/sessions/${sessionId}/submit`, {
      method: "POST",
    });

    const nextRoute = store.getNextRoute("/validation");
    if (nextRoute) {
      router.push(nextRoute);
    } else if (!options.silent) {
      toast.success("Évaluation terminée avec succès !");
    }
  } catch (error) {
    console.error("Failed to submit assessment:", error);
  }
}


function goHomeClick() {
  if (!store.isP3Mode && isP3Enabled.value) {
    showP3Modal.value = true;
  } else {
    confirmGoHome();
  }
}

function confirmGoHome() {
  showP3Modal.value = false;
  store.setP3Mode(false);
  localStorage.removeItem("session_id");

  // Redirect to the external site based on the brand origin
  const brandUrls = {
    aopia: "https://www.aopia.fr",
    like: "https://www.likeformation.fr",
  };
  const externalUrl = brandUrls[store.brand];
  if (externalUrl) {
    window.location.href = externalUrl;
  } else {
    router.push("/");
  }
}

function startP3() {
  // Persist previous parcours context for P3 filtering rules.
  const previousFormationSlug = localStorage.getItem("selected_formation_slug");
  if (previousFormationSlug) {
    localStorage.setItem("p3_prev_formation_slug", previousFormationSlug);
  }
  if (session.value?.formationChoisie) {
    localStorage.setItem("p3_prev_formation", session.value.formationChoisie);
  }
  if (recommendedLabel.value) {
    const existing = localStorage.getItem("p3_prev_recommendations") || "";
    let newRecs = existing;
    if (existing) {
       if (!existing.includes(recommendedLabel.value)) {
          newRecs = `${existing} & ${recommendedLabel.value}`;
       }
    } else {
       newRecs = recommendedLabel.value;
    }
    localStorage.setItem("p3_prev_recommendations", newRecs);
  }
  if (session.value?.stopLevel || session.value?.lastValidatedLevel) {
    localStorage.setItem("p3_prev_stop_level", session.value.stopLevel || session.value.lastValidatedLevel);
  }
  // Store numeric level order for reliable matching in computeNextLevel
  const stopOrder = session.value?.stopLevelOrder !== undefined ? session.value.stopLevelOrder : 0;
  if (stopOrder > 0) {
    localStorage.setItem("p3_prev_level_order", String(stopOrder));
  }

  store.setP3Mode(true);
  router.push("/formations");
}

function confirmStartP3() {
  showP3Modal.value = false;
  startP3();
}

</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8] p-8">
    <div class="max-w-2xl mx-auto w-full">
      <div
        v-if="!loading && session"
        class="bg-white rounded-3xl shadow-xl p-10 border border-white"
      >
        <!-- Progress Bar -->
        <WorkflowProgressBar customPath="/validation" />

        <div class="relative">
          <div class="absolute -top-12 -left-12 w-32 h-32 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>

          <div class="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-green-500/30 transform hover:rotate-12 transition-transform duration-500">
            <span class="material-icons-outlined text-5xl">task_alt</span>
          </div>

          <h1 class="text-4xl md:text-5xl font-black text-[#0d1b3e] mb-2 text-center tracking-tight">
            Félicitations !
          </h1>
          <p class="text-gray-500 text-center mb-10 font-bold uppercase tracking-[0.2em] text-[10px]">
            Votre parcours est maintenant validé
          </p>
        </div>

        <div class="space-y-6 mb-10">
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4"
            >
              Informations
            </h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white">
                <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Bénéficiaire</span>
                <span class="text-sm font-black text-[#0d1b3e]">{{ session.prenom }} {{ session.nom }}</span>
              </div>
              <div v-if="session.formationChoisie && !isFormationSameAsRecommendation" class="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white">
                <span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Formation visée</span>
                <span class="text-sm font-black text-blue-600">{{ session.formationChoisie }}</span>
              </div>
              <div class="flex justify-between items-start mt-2 pt-2 border-t border-gray-200" v-if="recommendedLabel">
                <span class="text-xs text-gray-500 font-bold"
                  >Parcours recommandé</span
                >
                <span class="text-sm font-black text-green-600 text-right max-w-[300px] break-words">
                  {{ recommendedLabel }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4"
            >
              Parcours validé
            </h3>
            <p class="text-sm font-bold text-gray-600 leading-relaxed">
             Nous vous remercions d’avoir pris le temps de répondre aux différentes étapes de ce questionnaire
            </p>
          </div>
        </div>

        <!-- Statistiques de synthèse -->
        <!-- <section class="space-y-4 mb-10" v-if="session">
          <h3
            class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2"
          >
            Bilan visuel de votre évaluation
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              class="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center"
            >
              <p
                class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1"
              >
                Score global estimé
              </p>
              <p class="text-3xl font-black text-brand-primary mb-2">
                {{ globalScore }}%
              </p>
              <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-brand-primary transition-all duration-700"
                  :style="{ width: globalScore + '%' }"
                ></div>
              </div>
            </div>

            <div
              class="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center"
            >
              <p
                class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1"
              >
                Niveaux validés
              </p>
              <p class="text-3xl font-black heading-primary mb-1">
                {{ validatedLevelsCount }}/{{ totalLevelsCount || 1 }}
              </p>
              <p class="text-[11px] text-gray-500 font-medium text-center">
                du niveau débutant jusqu'au niveau atteint.
              </p>
            </div>

            <div
              class="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center"
            >
              <p
                class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1"
              >
                Questions de pré-requis
              </p>
              <p class="text-3xl font-black heading-primary mb-1">
                {{ answeredPrereqCount }}
              </p>
              <p class="text-[11px] text-gray-500 font-medium text-center">
                réponses saisies pour évaluer votre niveau de départ.
              </p>
            </div>
          </div>

           <div
            v-if="levelsEntries.length"
            class="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Scores par niveau
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-gray-50/80">
                  <tr>
                    <th
                      class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400"
                    >
                      Niveau
                    </th>
                    <th
                      class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400"
                    >
                      Score
                    </th>
                    <th
                      class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400"
                    >
                      Seuil
                    </th>
                    <th
                      class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400"
                    >
                      Validé
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="[level, val] in levelsEntries" :key="level">
                    <td class="px-4 py-2 font-bold heading-primary">
                      {{ level }}
                    </td>
                    <td class="px-4 py-2 text-gray-600">
                      {{ val?.score }}/{{ val?.total }}
                    </td>
                    <td class="px-4 py-2 text-gray-600">
                      {{ val?.requiredCorrect ?? "—" }}
                    </td>
                    <td class="px-4 py-2">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                        :class="
                          val?.validated
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-50 text-gray-400'
                        "
                      >
                        <span class="material-icons-outlined text-[12px]">
                          {{ val?.validated ? 'check_circle' : 'cancel' }}
                        </span>
                        {{ val?.validated ? 'OK' : 'NON' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div> 
        </section> -->

        <div class="flex flex-col gap-4">
          <!-- P3 Transition Card -->
          <div v-if="!store.isP3Mode && isP3Enabled" class="bg-[#428597] rounded-4xl p-10 text-center space-y-8 shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div class="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div class="relative z-10">
              <h3 class="text-2xl font-black text-white mb-2">Envie de continuer ?</h3>
              <p class="text-blue-100 text-sm font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                Vous avez la possibilité de réaliser une troisième formation pour enrichir encore davantage votre profil.
              </p>
              <div class="flex flex-col sm:flex-row gap-4">
                <button @click="confirmGoHome" class="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer transform hover:scale-105">
                  Non, c'est tout pour moi
                </button>
                <button @click="confirmStartP3" class="flex-1 py-4 bg-[#ebb872] text-[#305364] hover:brightness-105 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#ebb872]/20 transition-all cursor-pointer transform hover:scale-105">
                  Oui, avec plaisir !
                </button>
              </div>
            </div>
          </div>
          
          <div v-else-if="store.isP3Mode" class="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-4">
            <span class="material-icons-outlined text-green-500 text-3xl mb-2">check_circle</span>
            <p class="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Vous pouvez maintenant fermer cette page.
            </p>
          </div>
          <button
            v-else
            @click="confirmGoHome"
            class="w-full py-5 bg-[#3b82f6] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-xl shadow-blue-500/10 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Retour à l'accueil</span>
            <span class="material-icons-outlined">home</span>
          </button>

        </div>
      </div>

      <div v-else class="flex justify-center items-center py-20">
        <div
          class="animate-spin border-4 border-brand-primary/20 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>
    </div>

    <!-- P3 Modal -->
    <div v-if="showP3Modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div class="relative z-10">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#0D8ABC] shadow-inner">
            <span class="material-icons-outlined text-3xl">psychology_alt</span>
          </div>
          
          <h2 class="text-2xl font-black text-center text-[#0D1B3E] mb-4">Parcours complémentaire</h2>
          <p class="text-gray-600 font-medium text-center mb-8 leading-relaxed">
            Souhaitez-vous réaliser une troisième formation avec nous ?
          </p>
          
          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="confirmGoHome" class="flex-1 py-3 px-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all">
              Non, merci
            </button>
            <button @click="confirmStartP3" class="flex-1 py-3 px-4 bg-[#ebb973] text-brand-primary hover:bg-[#ebb973]/80 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-md shadow-[#ebb973]/30">
              Oui, avec plaisir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
