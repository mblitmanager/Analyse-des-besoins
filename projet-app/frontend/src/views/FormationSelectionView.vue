<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const selectedFormation = ref(null);

const formations = ref([]);

async function fetchFormations() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);

    formations.value = res.data;
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
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
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
    <SiteHeader>
      <template #actions>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-bold text-sm text-blue-900 border border-white/30"
        >
          <span class="material-icons-outlined text-lg">save</span>
          Sauvegarder et quitter
        </button>
      </template>
    </SiteHeader>

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
          Sélectionnez votre programme de formation.
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>

      <div v-else class="formations-grid pb-24">
        <button
          v-for="form in formations"
          :key="form.id"
          @click="selectedFormation = form"
          class="formation-card"
          :class="
            selectedFormation?.id === form.id
              ? 'formation-card--selected'
              : 'formation-card--default'
          "
        >
          <span class="formation-card__label">{{ form.label }}</span>
          <div
            class="formation-card__radio"
            :class="
              selectedFormation?.id === form.id
                ? 'formation-card__radio--selected'
                : 'formation-card__radio--default'
            "
          >
            <div
              v-if="selectedFormation?.id === form.id"
              class="formation-card__radio-dot"
            ></div>
          </div>
        </button>
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
    <SiteFooter />
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}

.formations-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .formations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .formations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Formation card */
.formation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  min-height: 4.5rem;
  background: #f3f4f6;
  border: 2px solid transparent;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.formation-card:active {
  transform: scale(0.98);
}

.formation-card--default {
  border-color: #e5e7eb;
}

.formation-card--default:hover {
  border-color: #d1d5db;
  background: #e9ebee;
}

.formation-card--selected {
  border-color: var(--color-brand-primary, #3b82f6);
  background: #eef2ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.formation-card__label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
  text-align: left;
  flex: 1;
}

.formation-card__radio {
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

.formation-card__radio--selected {
  border-color: var(--color-brand-primary, #3b82f6);
  background: var(--color-brand-primary, #3b82f6);
}

.formation-card__radio--default {
  border-color: #d1d5db;
}

.formation-card__radio-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
}
</style>
