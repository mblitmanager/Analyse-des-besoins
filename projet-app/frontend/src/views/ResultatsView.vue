<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();
const session = ref(null);
const loading = ref(true);

onMounted(async () => {
  const sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    router.push("/");
    return;
  }

  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    session.value = response.data;
  } catch (error) {
    console.error("Failed to fetch session results:", error);
    alert("Erreur lors du chargement de vos résultats.");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="min-h-screen py-16 px-4 bg-gray-50 flex justify-center items-center"
  >
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <div
        class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
      ></div>
      <p class="text-gray-400 font-medium">
        Génération de votre bilan personnalisé...
      </p>
    </div>

    <div
      v-else-if="session"
      class="max-w-3xl w-full bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden"
    >
      <!-- Success Header -->
      <div
        class="bg-gradient-to-br from-brand-primary to-brand-secondary p-12 text-center text-white relative"
      >
        <div
          class="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"
        ></div>
        <div class="relative z-10">
          <div
            class="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 class="text-4xl font-black mb-2 italic">
            Félicitations, {{ session.prenom }} !
          </h1>
          <p class="text-white/80 text-lg">
            Votre test de positionnement est terminé.
          </p>
        </div>
      </div>

      <div class="p-10 md:p-14">
        <!-- Main Result Card -->
        <div
          class="bg-gray-50 rounded-3xl p-8 mb-10 border border-gray-100 text-center"
        >
          <span
            class="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2 block"
            >Préconisation de formation</span
          >
          <h2
            class="text-3xl md:text-4xl font-black text-brand-primary mb-4 leading-tight"
          >
            {{ session.finalRecommendation }}
          </h2>
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 rounded-full text-brand-primary font-bold"
          >
            <span
              class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"
            ></span>
            Niveau atteint : {{ session.stopLevel }}
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="p-6 rounded-2xl border border-gray-100 bg-white">
            <h3 class="text-sm font-bold text-gray-400 uppercase mb-4">
              Formation choisie
            </h3>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <span class="text-xl font-bold text-gray-800">{{
                session.formationChoisie
              }}</span>
            </div>
          </div>
          <div class="p-6 rounded-2xl border border-gray-100 bg-white">
            <h3 class="text-sm font-bold text-gray-400 uppercase mb-4">
              Statut du rapport
            </h3>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span class="text-xl font-bold text-gray-800"
                >Envoyé par email</span
              >
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="router.push('/')"
            class="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
          >
            Nouvelle analyse
          </button>
          <button
            @click="window.print()"
            class="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-xl hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Imprimer mon bilan
          </button>
        </div>
      </div>

      <!-- Footer Brand Info -->
      <div
        class="bg-gray-50 p-8 border-t border-gray-100 flex items-center justify-between"
      >
        <p class="text-xs text-gray-400 font-medium">
          © 2026
          {{
            store.brand === "aopia"
              ? "AOPIA Service RH"
              : "LIKE Formation Expert"
          }}
        </p>
        <div
          class="flex gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
        >
          <!-- Placeholder for social or cert labels -->
        </div>
      </div>
    </div>
  </div>
</template>
