<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const formations = ref([]);
const loading = ref(true);
const selectedFormation = ref(null);
const submitting = ref(false);

onMounted(async () => {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(`${apiBaseUrl}/formations`);
    formations.value = response.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
    alert("Erreur lors du chargement des formations.");
  } finally {
    loading.value = false;
  }
});

async function confirmSelection() {
  if (!selectedFormation.value) {
    alert("Veuillez sélectionner une formation.");
    return;
  }

  const sessionId = localStorage.getItem("session_id");
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      formationChoisie: selectedFormation.value.label,
    });
    localStorage.setItem(
      "selected_formation_slug",
      selectedFormation.value.slug,
    );
    localStorage.setItem(
      "selected_formation_label",
      selectedFormation.value.label,
    );
    router.push("/positionnement");
  } catch (error) {
    console.error("Failed to update session:", error);
    alert("Erreur lors de la sélection de la formation.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen py-12 px-4 bg-gray-50 flex justify-center items-center"
  >
    <div
      class="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
    >
      <div class="bg-brand-primary p-10 text-center text-white">
        <span
          class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          >Étape 3 / 5</span
        >
        <h1 class="text-4xl font-black mt-4">Quelle formation visez-vous ?</h1>
        <p class="mt-2 text-white/80 max-w-lg mx-auto">
          Sélectionnez le test correspondant à votre projet professionnel pour
          commencer le positionnement.
        </p>
      </div>

      <div class="p-10">
        <div v-if="loading" class="flex justify-center py-20">
          <div
            class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
          ></div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="f in formations"
            :key="f.id"
            @click="selectedFormation = f"
            class="group relative p-8 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center overflow-hidden"
            :class="
              selectedFormation?.id === f.id
                ? 'border-brand-primary bg-brand-primary/5 shadow-inner'
                : 'border-gray-100 bg-white hover:border-brand-accent hover:shadow-xl'
            "
          >
            <div
              class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:text-white transition-colors"
              :class="
                selectedFormation?.id === f.id
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-400'
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
            </div>
            <h3
              class="text-xl font-bold mb-2 group-hover:text-brand-primary transition-colors"
              :class="
                selectedFormation?.id === f.id
                  ? 'text-brand-primary'
                  : 'text-gray-800'
              "
            >
              {{ f.label }}
            </h3>
            <p class="text-sm text-gray-500">
              Test complet de positionnement {{ f.label }} avec échelles CECRL.
            </p>

            <!-- Selection indicator -->
            <div
              v-if="selectedFormation?.id === f.id"
              class="absolute top-4 right-4 text-brand-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="mt-12 flex flex-col items-center gap-4">
          <button
            @click="confirmSelection"
            :disabled="!selectedFormation || submitting"
            class="w-full sm:w-64 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-2xl hover:shadow-brand-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span>Confirmer le choix</span>
            <div
              v-if="submitting"
              class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
            ></div>
          </button>
          <button
            @click="router.back()"
            class="text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            Retour à l'étape précédente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
