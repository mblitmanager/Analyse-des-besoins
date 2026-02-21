<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");
const session = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
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
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
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
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit p-8">
    <div class="max-w-2xl mx-auto w-full">
      <div
        v-if="!loading && session"
        class="bg-white rounded-3xl shadow-xl p-10 border border-gray-100"
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
        <div class="flex items-center justify-between mb-2 px-1">
          <span
            class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
            >Progression</span
          >
          <span class="text-[10px] text-brand-primary font-bold"
            >Étape {{ store.getProgress("/validation").current }}/{{
              store.getProgress("/validation").total
            }}</span
          >
        </div>
        <div
          class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-10"
        >
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            :style="{
              width: store.getProgress('/validation').percentage + '%',
            }"
          ></div>
        </div>
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
              les tests de positionnement. Vos réponses ont été enregistrées
              avec succès.
            </p>
          </div>
        </div>

        <button
          @click="validate"
          class="w-full py-5 bg-brand-primary text-blue-500 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
        >
          <span>Découvrir mes résultats</span>
          <span class="material-icons-outlined">rocket_launch</span>
        </button>
      </div>

      <div v-else class="flex justify-center items-center py-20">
        <div
          class="animate-spin border-4 border-brand-primary/20 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>
    </div>
  </div>
</template>
