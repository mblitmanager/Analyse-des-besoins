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

const questions = ref([]);
const responses = ref({});
const groups = ref([]);

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const sessionRes = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const session = sessionRes.data;

    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: { formation: session.formationChoisie },
    });
    questions.value = res.data;

    // Group questions by category
    const grouped = {};
    questions.value.forEach((q) => {
      if (!grouped[q.category]) {
        grouped[q.category] = {
          title: q.category,
          icon: q.icon || "list",
          color: q.metadata?.color || "blue",
          questions: [],
        };
      }
      grouped[q.category].questions.push({
        id: q.id,
        type: q.metadata?.type || "radio",
        text: q.text,
        subtitle: q.metadata?.subtitle || "",
        options: q.options.map((opt) => {
          if (typeof opt === "string") return opt;
          return opt; // metadata might contain exclusive/extra, but for seeding we used simple strings for now
        }),
      });

      // Initialize response
      if (q.metadata?.type === "checkbox") {
        responses.value[q.id] = [];
      } else {
        responses.value[q.id] = null;
      }
    });

    groups.value = Object.values(grouped);
  } catch (error) {
    console.error("Failed to fetch prerequisites:", error);
  } finally {
    loading.value = false;
  }
});

function handleCheckbox(questionId, optionLabel, exclusive) {
  if (exclusive) {
    responses.value[questionId] = [optionLabel];
  } else {
    const idx = responses.value[questionId].indexOf(optionLabel);
    // Remove exclusive options if present
    const q = groups.value
      .flatMap((g) => g.questions)
      .find((q) => q.id === questionId);
    const exclusiveOptions = q.options
      .filter((o) => o.exclusive)
      .map((o) => o.label);
    responses.value[questionId] = responses.value[questionId].filter(
      (o) => !exclusiveOptions.includes(o),
    );

    if (idx > -1) {
      responses.value[questionId].splice(idx, 1);
    } else {
      responses.value[questionId].push(optionLabel);
    }
  }
}

async function submitPrerequis() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      prerequisiteScore: responses.value,
    });
    const nextRoute = store.getNextRoute("/prerequis");
    router.push(nextRoute || "/formations");
  } catch (error) {
    console.error("Failed to submit prerequisites:", error);
    alert("Erreur lors de la validation des prérequis.");
  } finally {
    submitting.value = false;
  }
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
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black italic text-xl"
        >
          W
        </div>
        <AppLogo />
      </div>

      <div class="flex items-center gap-6">
        <div class="hidden md:flex flex-col items-end">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
              >Progression</span
            >
            <span class="text-[10px] text-brand-primary font-bold"
              >Étape {{ store.getProgress("/prerequis").current }}/{{
                store.getProgress("/prerequis").total
              }}</span
            >
          </div>
          <div class="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-brand-primary transition-all duration-700"
              :style="{
                width: store.getProgress('/prerequis').percentage + '%',
              }"
            ></div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button class="text-gray-400 hover:text-gray-600">
            <span class="material-icons-outlined text-xl">help_outline</span>
          </button>
          <div
            class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500"
          >
            JD
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">
          Prérequis - Niveau Informatique
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Veuillez répondre aux questions suivantes pour évaluer votre niveau de
          confort avec les outils numériques.
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="group in groups"
          :key="group.title"
          class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
        >
          <div
            class="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
              :class="
                group.color === 'blue'
                  ? 'bg-blue-600/10 text-blue-600'
                  : 'bg-indigo-600/10 text-indigo-600'
              "
            >
              <span class="material-icons-outlined text-lg">{{
                group.icon
              }}</span>
            </div>
            <h2 class="text-base font-bold text-gray-800">{{ group.title }}</h2>
          </div>

          <div class="p-6 md:p-8 space-y-8">
            <div
              v-if="group.subtitle"
              class="text-xs font-bold text-gray-400 uppercase tracking-widest -mb-2"
            >
              {{ group.subtitle }}
            </div>

            <div v-for="q in group.questions" :key="q.id" class="space-y-4">
              <div v-if="q.text" class="space-y-1">
                <p class="text-base font-bold heading-primary">{{ q.text }}</p>
                <p v-if="q.subtitle" class="text-xs text-gray-400">
                  {{ q.subtitle }}
                </p>
              </div>

              <!-- Radio Options -->
              <div
                v-if="q.type === 'radio'"
                class="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <button
                  v-for="opt in q.options"
                  :key="opt"
                  @click="responses[q.id] = opt"
                  class="p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left group text-sm"
                  :class="
                    responses[q.id] === opt
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-50 bg-transparent text-gray-500 hover:border-gray-200'
                  "
                >
                  <div
                    class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    :class="
                      responses[q.id] === opt
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-gray-300 group-hover:border-brand-primary'
                    "
                  >
                    <div
                      v-if="responses[q.id] === opt"
                      class="w-1.5 h-1.5 rounded-full bg-white"
                    ></div>
                  </div>
                  <span class="font-medium">{{ opt }}</span>
                </button>
              </div>

              <!-- Checkbox Options -->
              <div v-if="q.type === 'checkbox'" class="space-y-2">
                <button
                  v-for="opt in q.options"
                  :key="typeof opt === 'string' ? opt : opt.label"
                  @click="
                    handleCheckbox(
                      q.id,
                      typeof opt === 'string' ? opt : opt.label,
                      typeof opt === 'string' ? false : opt.exclusive,
                    )
                  "
                  class="w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left group text-sm"
                  :class="
                    responses[q.id].includes(
                      typeof opt === 'string' ? opt : opt.label,
                    )
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-50 bg-transparent text-gray-500 hover:border-gray-200'
                  "
                >
                  <div
                    class="flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all"
                    :class="
                      responses[q.id].includes(
                        typeof opt === 'string' ? opt : opt.label,
                      )
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-gray-300 group-hover:border-brand-primary'
                    "
                  >
                    <span
                      v-if="
                        responses[q.id].includes(
                          typeof opt === 'string' ? opt : opt.label,
                        )
                      "
                      class="material-icons-outlined text-white text-xs"
                      >check</span
                    >
                  </div>
                  <div class="flex flex-col flex-1">
                    <span class="font-medium">{{
                      typeof opt === "string" ? opt : opt.label
                    }}</span>
                    <span
                      v-if="typeof opt !== 'string' && opt.extra"
                      class="text-xs font-medium opacity-60"
                      >{{ opt.extra }}</span
                    >
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div
          class="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <button
            @click="router.push('/')"
            class="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
          >
            <span class="material-icons-outlined">arrow_back</span>
            Précédent
          </button>

          <button
            @click="submitPrerequis"
            :disabled="submitting"
            class="w-full sm:w-auto px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-blue-500 font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
          >
            <span>Valider et continuer</span>
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
    </main>

    <!-- Global Footer -->
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
