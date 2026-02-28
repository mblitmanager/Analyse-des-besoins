<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");
const session = ref(null);
const loading = ref(true);

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
  if (session.value.finalRecommendation)
    return session.value.finalRecommendation;

  const level =
    session.value.stopLevel || session.value.lastValidatedLevel || "";

  if (!session.value.formationChoisie && !level) return "Parcours personnalisé";

  return `${session.value.formationChoisie || ""}${
    level ? " - " + level : ""
  }`.trim();
});

const recommendedLabelParts = computed(() => {
  if (!recommendedLabel.value) return [];
  // Split by common separators
  const parts = recommendedLabel.value.split(/ \| | & | \/ | - /);
  // The first part is usually the formation name if we used the "Formation - Level" format
  // If we only have levels, we return them.
  // Actually, if it's "Photoshop - B1 & B2", we want ["Photoshop", "B1", "B2"] or just the levels.
  
  // Let's simplify: split by " | ", " & ", or " / " and remove the formation prefix if it exists in each part
  const rawParts = recommendedLabel.value.split(/ \| | & | \/ /);
  return rawParts.map(p => {
      let cleaned = p.trim();
      if (session.value?.formationChoisie && cleaned.startsWith(session.value.formationChoisie)) {
          cleaned = cleaned.replace(session.value.formationChoisie, "").replace(/^- /, "").trim();
      }
      
      // Add 'Niveau ' prefix if missing and it's not the full recommended label (which might be "Parcours personnalisé")
      if (cleaned && !cleaned.toLowerCase().includes("niveau") && cleaned !== "Parcours personnalisé") {
          cleaned = `Niveau ${cleaned}`;
      }
      
      return cleaned;
  }).filter(p => p !== "");
});

const totalLevelsCount = computed(() => levelsEntries.value.length);

const answeredPrereqCount = computed(() => {
  if (!session.value?.prerequisiteScore) return 0;
  return Object.keys(session.value.prerequisiteScore).length;
});

onMounted(async () => {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${apiBaseUrl}/sessions/${sessionId}`);
    session.value = await response.json();
  } catch (error) {
    console.error("Failed to fetch session:", error);
  } finally {
    loading.value = false;
  }
});

async function validate() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    await fetch(`${apiBaseUrl}/sessions/${sessionId}/submit`, {
      method: "POST",
    });

    const nextRoute = store.getNextRoute("/validation");
    if (nextRoute) router.push(nextRoute);
    else alert("Évaluation terminée avec succès !");
  } catch (error) {
    console.error("Failed to submit assessment:", error);
  }
}


function goHome() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8] p-8">
    <div class="max-w-2xl mx-auto w-full">
      <div
        v-if="!loading && session"
        class="bg-white rounded-3xl shadow-xl p-10 border border-white"
      >
        <div
          class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500"
        >
          <span class="material-icons-outlined text-4xl">verified</span>
        </div>

        <h1
          class="text-3xl font-black heading-primary mb-2 text-center italic uppercase tracking-tight"
        >
          Validation Finale
        </h1>
        <!-- <div class="flex items-center justify-between mb-2 px-1">
          <span
            class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
            >Progression</span
          >
          <span class="text-[10px] text-brand-primary font-bold"
            >Étape 8/8</span
          >
        </div>
        <div
          class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-10"
        >
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            style="width: 100%"
          ></div>
        </div> -->
        <p
          class="text-gray-400 text-center mb-10 font-bold uppercase tracking-widest text-xs"
        >
          Récapitulatif de votre demande
        </p>

        <div class="space-y-6 mb-10">
          <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4"
            >
              Informations
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500 font-bold"
                  >Bénéficiaire</span
                >
                <span class="text-sm font-black heading-primary"
                  >{{ session.prenom }} {{ session.nom }}</span
                >
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500 font-bold"
                  >Formation visée</span
                >
                <span class="text-sm font-black text-brand-primary">{{
                  session.formationChoisie
                }}</span>
              </div>
              <div class="flex justify-between items-start mt-2 pt-2 border-t border-gray-200" v-if="recommendedLabelParts.length">
                <span class="text-xs text-gray-500 font-bold"
                  >Parcours recommandé</span
                >
                <div class="flex flex-col items-end gap-1">
                  <span v-for="part in recommendedLabelParts" :key="part" class="text-sm font-black text-green-600 text-right max-w-[200px]">
                    {{ part }}
                  </span>
                </div>
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
              Vous avez complété l'identification, la sélection de formation, et
              les tests de positionnement.
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

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="goHome"
            class="flex-1 py-5 bg-white text-brand-primary rounded-2xl font-black uppercase tracking-widest text-sm border border-gray-100 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
          >
            <span>Accueil</span>
            <span class="material-icons-outlined">home</span>
          </button>
          <!-- <button
            @click="validate"
            class="flex-1 py-5 bg-brand-primary text-[#428496] rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
          >
            <span>Soumettre</span>
            <span class="material-icons-outlined">rocket_launch</span>
          </button> -->
          
        </div>
      </div>

      <div v-else class="flex justify-center items-center py-20">
        <div
          class="animate-spin border-4 border-brand-primary/20 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>
    </div>
  </div>
</template>
