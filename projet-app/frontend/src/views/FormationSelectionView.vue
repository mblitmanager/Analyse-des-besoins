<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import AppLogo from '../components/AppLogo.vue'

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const selectedFormation = ref(null);

const categories = ref([]);

async function fetchFormations() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);

    // Group by category
    const grouped = res.data.reduce((acc, formation) => {
      const catName = formation.category || "AUTRES";
      if (!acc[catName]) {
        acc[catName] = { name: catName, formations: [] };
      }
      acc[catName].formations.push(formation);
      return acc;
    }, {});

    categories.value = Object.values(grouped);
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  fetchFormations();
});

async function selectFormation() {
  if (!selectedFormation.value) return;

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
    const nextRoute = store.getNextRoute("/formations");
    router.push(nextRoute || "/positionnement");
  } catch (error) {
    console.error("Failed to select formation:", error);
    alert("Erreur lors de la sélection de la formation.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
        <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl">W</div>
        <AppLogo />
      </div>

      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm text-gray-600 border border-gray-100"
        >
          <span class="material-icons-outlined text-lg">save</span>
          Sauvegarder et quitter
        </button>
      </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <div class="flex flex-col items-center gap-4 mb-6">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="text-xs text-gray-400 font-bold uppercase tracking-widest"
              >Étape {{ store.getProgress("/formations").current }} sur
              {{ store.getProgress("/formations").total }}</span
            >
            <span
              class="text-xs text-brand-primary font-bold uppercase tracking-widest"
              >{{
                Math.round(store.getProgress("/formations").percentage)
              }}%</span
            >
          </div>
          <div
            class="w-full max-w-md h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100"
          >
            <div
              class="h-full bg-brand-primary transition-all duration-700"
              :style="{
                width: store.getProgress('/formations').percentage + '%',
              }"
            ></div>
          </div>
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-3">
          Quelle formation souhaitez-vous suivre ?
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Parcourez nos catégories et sélectionnez votre programme.
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>

      <div v-else class="space-y-10 pb-24">
        <div v-for="cat in categories" :key="cat.name" class="space-y-4">
          <div class="flex items-center gap-4">
            <span
              class="text-xs font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap"
              >{{ cat.name }}</span
            >
            <div class="h-px w-full bg-gray-100"></div>
          </div>

          <div class="space-y-2">
            <button
              v-for="form in cat.formations"
              :key="form.id"
              @click="selectedFormation = form"
              class="w-full p-5 bg-white border-2 rounded-2xl flex items-center justify-between transition-all group scale-100 active:scale-[0.98]"
              :class="
                selectedFormation?.id === form.id
                  ? 'border-brand-primary shadow-lg shadow-brand-primary/10'
                  : 'border-gray-50 hover:border-gray-200'
              "
            >
              <div class="flex items-center gap-5">
                <span
                  class="material-icons-outlined text-2xl group-hover:scale-110 transition-transform"
                  :class="`text-${form.color}`"
                  >{{ form.icon }}</span
                >
                <span class="text-base font-bold text-gray-800">{{
                  form.label
                }}</span>
              </div>
              <div
                class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                :class="
                  selectedFormation?.id === form.id
                    ? 'border-brand-primary bg-brand-primary'
                    : 'border-gray-200'
                "
              >
                <div
                  v-if="selectedFormation?.id === form.id"
                  class="w-1.5 h-1.5 rounded-full bg-white"
                ></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Actions Sticky -->
    <div
      class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-40"
    >
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button
          @click="router.push('/prerequis')"
          class="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
        >
          <span class="material-icons-outlined">arrow_back</span>
          Retour
        </button>

        <button
          @click="selectFormation"
          :disabled="submitting || !selectedFormation"
          class="px-10 py-3 bg-brand-primary hover:bg-brand-secondary text-blue-500 font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 text-base"
        >
          <span>Confirmer la sélection</span>
          <span v-if="!submitting" class="material-icons-outlined text-lg"
            >arrow_forward</span
          >
          <div
            v-else
            class="animate-spin border-2 border-white/30 border-t-white rounded-full h-4 w-4"
          ></div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
