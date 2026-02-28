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
    // Attempt to notify via backend email endpoint, fallback to mailto
    await sendNotificationEmail();

    const nextRoute = await store.getNextRouteWithQuestions("/validation");
    if (nextRoute) router.push(nextRoute);
    else alert("Évaluation terminée avec succès !");
  } catch (error) {
    console.error("Failed to submit assessment:", error);
  }
}

async function sendNotificationEmail() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  // Retrieve configured admin email from settings so notification goes to same recipient as bilan d'évaluation
  try {
    const settingsRes = await fetch(`${apiBaseUrl}/settings/ADMIN_EMAIL`);
    let to = 'mblitmanager@gmail.com';
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      // settings controller returns the setting object { key, value }
      if (s && s.value) to = s.value;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Nouvelle soumission - ${session.value?.prenom || ''} ${session.value?.nom || ''}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: auto;">
        <h2 style="color: #0D8ABC; margin-bottom: 5px;">Bilan d'évaluation - Analyse des besoins</h2>
        <p style="color: #666; font-size: 14px; margin-top: 0;">Soumis le ${dateStr}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <p><strong>Bénéficiaire :</strong> ${session.value?.civilite || ''} ${session.value?.prenom || ''} ${session.value?.nom || ''}</p>
        <p><strong>Email :</strong> ${session.value?.stagiaire?.email || ''}</p>
        <p><strong>Téléphone :</strong> ${session.value?.telephone || ''}</p>
        <p><strong>Formation :</strong> ${session.value?.formationChoisie || ''}</p>
        <p><strong>Recommandation :</strong> <span style="color: #22C55E; font-weight: bold;">${session.value?.finalRecommendation || ''}</span></p>
        <p><strong>Score final :</strong> <span style="color: #2563eb; font-weight: bold;">${session.value?.scorePretest ?? ''}%</span></p>
        
        <div style="margin-top: 30px;">
          <p style="font-size:13px;color:#444;">Session ID: ${sessionId}</p>
        </div>
        
        <p style="font-size: 11px; color: #999; margin-top: 40px;">Ceci est un rapport automatique généré par le système d'Analyse des Besoins AOPIA.</p>
      </div>
    `;

    const payload = {
      to,
      subject,
      body: htmlBody,
    };

    const res = await fetch(`${apiBaseUrl}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Email API returned error');
  } catch (err) {
    // Fallback: open user's mail client with prefilled mail (use ADMIN_EMAIL if available)
    const fallbackTo = (await (async () => {
      try {
        const r = await fetch(`${apiBaseUrl}/settings/ADMIN_EMAIL`);
        if (r.ok) { const j = await r.json(); return j?.value || 'mblitmanager@gmail.com'; }
      } catch (e) {}
      return 'mblitmanager@gmail.com';
    })());
    const subject = `Nouvelle soumission - ${session.value?.prenom || ''} ${session.value?.nom || ''}`;
    const plainBody = `Bilan d'évaluation - Analyse des besoins\nSoumis le ${new Date().toLocaleString('fr-FR')}\n\nBénéficiaire: ${session.value?.civilite || ''} ${session.value?.prenom || ''} ${session.value?.nom || ''}\nEmail: ${session.value?.stagiaire?.email || ''}\nTéléphone: ${session.value?.telephone || ''}\nFormation: ${session.value?.formationChoisie || ''}\nRecommandation: ${session.value?.finalRecommendation || ''}\nScore final: ${session.value?.scorePretest ?? ''}%\n\nSession ID: ${sessionId}`;
    const mailto = `mailto:${encodeURIComponent(fallbackTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;
    window.location.href = mailto;
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
              <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-200" v-if="session.finalRecommendation">
                <span class="text-xs text-gray-500 font-bold"
                  >Parcours recommandé</span
                >
                <span class="text-sm font-black text-green-600 text-right max-w-[200px]">{{
                  session.finalRecommendation.replace(/ \| /g, " / ")
                }}</span>
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
              les tests de positionnement. Merci de confirmer, pour soumettre vos résultats.
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
          <button
            @click="validate"
            class="flex-1 py-5 bg-brand-primary text-[#428496] rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
          >
            <span>Soumettre</span>
            <!-- <span class="material-icons-outlined">rocket_launch</span> -->
          </button>
          
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
