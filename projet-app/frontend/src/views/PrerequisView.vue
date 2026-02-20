<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();

const questions = ref([]);
const responses = ref({});
const loading = ref(true);
const submitting = ref(false);

onMounted(async () => {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(`${apiBaseUrl}/questions/prerequisites`);
    questions.value = response.data;
    // Initialize responses
    questions.value.forEach((q) => {
      responses.value[q.id] = null;
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    alert("Erreur lors du chargement des questions.");
  } finally {
    loading.value = false;
  }
});

async function submitPrerequisites() {
  const sessionId = localStorage.getItem("session_id");
  if (!sessionId || sessionId === "undefined") {
    console.error("No valid session ID found");
    router.push("/");
    return;
  }

  // Basic validation: check if all questions answered if needed, or just submit
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      prerequisiteScore: responses.value,
    });
    router.push("/formation-selection");
  } catch (error) {
    console.error("Failed to submit prerequisites:", error);
    alert("Erreur lors de l’enregistrement de vos réponses.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen py-12 px-4 bg-gray-50 flex justify-center items-start"
  >
    <div
      class="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 border-t-8 border-brand-primary transition-all"
    >
      <div class="mb-8">
        <span
          class="text-brand-primary font-bold uppercase tracking-widest text-xs"
          >Étape 2 / 5</span
        >
        <h1 class="text-3xl font-extrabold text-gray-900 mt-2">
          Test Pré-requis Numériques
        </h1>
        <p class="text-gray-500 mt-2">
          Ces questions nous aident à mieux comprendre votre aisance avec les
          outils informatiques.
        </p>
      </div>

      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20 gap-4"
      >
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
        <p class="text-gray-400 font-medium">Chargement des questions...</p>
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          class="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-brand-accent transition-colors"
        >
          <p class="text-lg font-semibold text-gray-800 mb-4">
            {{ idx + 1 }}. {{ q.text }}
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label
              v-for="(option, oIdx) in q.options"
              :key="oIdx"
              class="flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer group"
              :class="
                responses[q.id] === option
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              "
            >
              <input
                type="radio"
                :name="'q-' + q.id"
                v-model="responses[q.id]"
                :value="option"
                class="hidden"
              />
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-all"
                :class="
                  responses[q.id] === option
                    ? 'border-brand-primary'
                    : 'border-gray-300 group-hover:border-gray-400'
                "
              >
                <div
                  v-if="responses[q.id] === option"
                  class="w-3 h-3 rounded-full bg-brand-primary"
                ></div>
              </div>
              <span
                class="font-medium"
                :class="
                  responses[q.id] === option
                    ? 'text-brand-primary'
                    : 'text-gray-700'
                "
                >{{ option }}</span
              >
            </label>
          </div>
        </div>

        <div class="pt-6 flex justify-end">
          <button
            @click="submitPrerequisites"
            :disabled="submitting"
            class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-xl hover:shadow-brand-primary/20 transform hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <span>Continuer</span>
            <svg
              v-if="!submitting"
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <div
              v-else
              class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
            ></div>
        