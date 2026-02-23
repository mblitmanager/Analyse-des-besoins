<script setup>
import { ref, onMounted } from "vue"; // Fixed: was missing onMounted
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import AppLogo from '../components/AppLogo.vue'
import axios from "axios";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const questions = ref([]);
const responses = ref({});
const loading = ref(true);
const submitting = ref(false);

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const res = await axios.get(
      `${apiBaseUrl}/questions/workflow/availabilities`,
    );
    questions.value = res.data;

    // Initialize responses keyed by q.id
    questions.value.forEach((q) => {
      if (q.metadata?.type === "multi_select") {
        responses.value[q.id] = [];
      } else {
        responses.value[q.id] = "";
      }
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
  } finally {
    loading.value = false;
  }
});

function toggleMultiSelect(qId, option) {
  const index = responses.value[qId].indexOf(option);
  if (index > -1) responses.value[qId].splice(index, 1);
  else responses.value[qId].push(option);
}

async function nextStep() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      availabilities: responses.value,
    });
    const nextRoute = store.getNextRoute("/availabilities");
    router.push(nextRoute || "/validation");
  } catch (error) {
    console.error("Failed to save availabilities:", error);
  } finally {
    submitting.value = false;
  }
}

async function skipStep() {
  const nextRoute = store.getNextRoute("/availabilities");
  router.push(nextRoute || "/validation");
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl"
        >
          W
        </div>
        <span class="font-bold text-gray-800 text-xl tracking-tight"
          >Wizzy Learn</span
        >
      </div>
      <div class="hidden md:flex flex-col items-end">
        <div class="flex items-center gap-2 mb-1">
          <span
            class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
            >Progression</span
          >
          <span class="text-[10px] text-brand-primary font-bold">
            Étape {{ store.getProgress("/availabilities").current }}/{{
              store.getProgress("/availabilities").total
            }}
          </span>
        </div>
        <div class="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            :style="{
              width: store.getProgress('/availabilities').percentage + '%',
            }"
          ></div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">
          Vos Disponibilités
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Planifions ensemble votre parcours de formation.
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>

      <div v-else class="space-y-6">
        <div
          class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
        >
          <div
            class="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30"
          >
            <div
              class="w-9 h-9 rounded-lg bg-indigo-600/10 flex items-center justify-center"
            >
              <span class="material-icons-outlined text-indigo-600 text-lg"
                >event_available</span
              >
            </div>
            <h2 class="text-base font-bold text-gray-800">Planification</h2>
          </div>

          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in questions" :key="q.id" class="space-y-3">
              <div class="flex items-center gap-2">
                <span
                  v-if="q.icon"
                  class="material-icons-outlined text-brand-primary text-sm"
                  >{{ q.icon }}</span
                >
                <p class="text-base font-bold heading-primary">{{ q.text }}</p>
              </div>

              <!-- Multi-Select Type (créneaux) -->
              <div
                v-if="q.metadata?.type === 'multi_select'"
                class="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <button
                  v-for="(opt, idx) in q.options"
                  :key="opt"
                  @click="toggleMultiSelect(q.id, opt)"
                  class="py-4 px-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group"
                  :class="
                    responses[q.id].includes(opt)
                      ? 'bg-brand-primary/5 text-brand-primary border-brand-primary shadow-sm'
                      : 'bg-transparent text-gray-400 border-gray-100 hover:border-brand-primary/30'
                  "
                >
                  <span
                    v-if="q.metadata.icons?.[idx]"
                    class="material-icons-outlined text-2xl"
                    :class="
                      responses[q.id].includes(opt)
                        ? 'text-brand-primary'
                        : 'text-gray-300 group-hover:text-brand-primary'
                    "
                  >
                    {{ q.metadata.icons[idx] }}
                  </span>
                  <span class="font-bold text-sm">{{ opt }}</span>
                </button>
              </div>

              <!-- Textarea Type (dates libres) -->
              <textarea
                v-else-if="q.metadata?.type === 'textarea'"
                v-model="responses[q.id]"
                :rows="q.metadata.rows || 3"
                :placeholder="q.metadata.placeholder || ''"
                class="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all text-sm text-gray-700 shadow-sm"
              ></textarea>

              <!-- Default Text Type -->
              <input
                v-else
                v-model="responses[q.id]"
                type="text"
                :placeholder="q.metadata?.placeholder || ''"
                class="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all text-sm text-gray-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div
          class="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <button
            @click="router.push('/complementary')"
            class="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
          >
            <span class="material-icons-outlined">arrow_back</span>
            Précédent
          </button>
          <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              @click="skipStep"
              class="px-6 py-4 text-gray-400 hover:text-gray-600 font-bold text-sm transition-all border-2 border-transparent hover:border-gray-100 rounded-2xl"
            >
              Passer cette étape
            </button>
            <button
              @click="nextStep"
              :disabled="submitting"
              class="flex-1 sm:w-64 px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-blue-500 font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
            >
              <span>Valider mes disponibilités</span>
              <span v-if="!submitting" class="material-icons-outlined text-xl"
                >event_available</span
              >
              <div
                v-else
                class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
              ></div>
            </button>
          </div>
        </div>
      </div>
    </main>

    <footer
      class="bg-white border-t border-gray-100 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-bold uppercase tracking-widest mt-auto"
    >
      <div class="flex items-center justify-center">
        <AppLogo />
      </div>
      <div class="flex gap-8">
        <a href="#" class="hover:text-brand-primary">Confidentialité</a>
        <a href="#" class="hover:text-brand-primary">Conditions</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
