<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import axios from "axios";
import AppLogo from '../components/AppLogo.vue'

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
      `${apiBaseUrl}/questions/workflow/complementary`,
    );
    questions.value = res.data;

    // Initialize responses keyed by q.id
    questions.value.forEach((q) => {
      if (q.metadata?.type === "radio_toggle") {
        responses.value[q.id] = "Non";
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

async function nextStep() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      complementaryQuestions: responses.value,
    });
    const nextRoute = store.getNextRoute("/complementary");
    router.push(nextRoute || "/availabilities");
  } catch (error) {
    console.error("Failed to save complementary questions:", error);
  } finally {
    submitting.value = false;
  }
}

function shouldShowQuestion(q) {
  if (!q.metadata?.condition) return true; // Fixed: was 'True' (Python syntax)

  // Support: "handicap == 'Oui'"
  if (q.metadata.condition === "handicap == 'Oui'") {
    const handicapQ = questions.value.find((item) =>
      item.text.toLowerCase().includes("handicap"),
    );
    return handicapQ ? responses.value[handicapQ.id] === "Oui" : false;
  }
  return true;
}

async function skipStep() {
  const nextRoute = store.getNextRoute("/complementary");
  router.push(nextRoute || "/availabilities");
}
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl">W</div>
        <AppLogo />
      </div>
      <div class="hidden md:flex flex-col items-end">
        <div class="flex items-center gap-2 mb-1">
          <span
            class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
            >Progression</span
          >
          <span class="text-[10px] text-brand-primary font-bold">
            Étape {{ store.getProgress("/complementary").current }}/{{
              store.getProgress("/complementary").total
            }}
          </span>
        </div>
        <div class="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            :style="{
              width: store.getProgress('/complementary').percentage + '%',
            }"
          ></div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">
          Questions Complémentaires
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Quelques informations supplémentaires pour personnaliser votre
          parcours.
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
              class="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center"
            >
              <span class="material-icons-outlined text-blue-600 text-lg"
                >person_search</span
              >
            </div>
            <h2 class="text-base font-bold text-gray-800">Votre profil</h2>
          </div>
          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in questions" :key="q.id">
              <div v-if="shouldShowQuestion(q)" class="space-y-3">
                <div class="flex items-center gap-2">
                  <span
                    v-if="q.icon"
                    class="material-icons-outlined text-brand-primary text-sm"
                    >{{ q.icon }}</span
                  >
                  <p class="text-base font-bold heading-primary">
                    {{ q.text }}
                  </p>
                </div>

                <!-- Radio Toggle Type (Oui/Non) -->
                <div
                  v-if="q.metadata?.type === 'radio_toggle'"
                  class="flex gap-3"
                >
                  <button
                    v-for="opt in q.options"
                    :key="opt"
                    @click="responses[q.id] = opt"
                    class="flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                    :class="
                      responses[q.id] === opt
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                        : 'border-gray-100 text-gray-400 hover:border-brand-primary/30'
                    "
                  >
                    {{ opt }}
                  </button>
                </div>

                <!-- Textarea Type -->
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
        </div>

        <!-- Footer Actions -->
        <div
          class="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <button
            @click="router.push('/resultats')"
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
              <span>Continuer</span>
              <span v-if="!submitting" class="material-icons-outlined text-xl"
                >arrow_forward</span
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
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <a
          href="https://ns-conseil.com/reglement-interieur/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-brand-primary"
        >
          Règlement intérieur
        </a>
        <a
          href="https://ns-conseil.com/cgv/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-brand-primary"
        >
          CGV
        </a>
        <router-link
          to="/mentions-legales"
          class="hover:text-brand-primary"
        >
          Mentions légales
        </router-link>
        <router-link
          to="/respect-vie-privee"
          class="hover:text-brand-primary"
        >
          Respect de la vie privée
        </router-link>
        <router-link
          to="/politique-confidentialite"
          class="hover:text-brand-primary"
        >
          Politique de confidentialité
        </router-link>
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
