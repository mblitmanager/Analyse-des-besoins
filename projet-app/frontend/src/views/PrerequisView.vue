<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);

// Prerequisite structure based on Mockup Image 2
const groups = ref([
  {
    title: "Votre niveau numérique global",
    icon: "leaderboard",
    color: "blue",
    questions: [
      {
        id: "level_global",
        type: "radio",
        text: "",
        options: ["Débutant", "Intermédiaire", "Avancé"],
      },
    ],
  },
  {
    title: "Fréquence d'utilisation d'un ordinateur",
    icon: "schedule",
    color: "indigo",
    questions: [
      {
        id: "freq_ordi",
        type: "radio",
        text: "",
        options: ["Tous les jours", "Occasionnelle", "Jamais"],
      },
    ],
  },
  {
    title: "Compétences techniques de base",
    icon: "check_circle",
    color: "blue",
    questions: [
      {
        id: "skill_hardware",
        type: "radio",
        text: "Savoir allumer un ordinateur, utiliser le clavier et la souris",
        options: ["Acquis", "Moyen", "Insuffisant"],
      },
      {
        id: "skill_win",
        type: "radio",
        text: "Se repérer dans l'environnement Windows",
        subtitle: "(bureau, menu démarrer, fenêtres, icônes...)",
        options: ["Acquis", "Moyen", "Insuffisant"],
      },
      {
        id: "skill_web",
        type: "radio",
        text: "Savoir naviguer sur internet",
        options: ["Acquis", "Moyen", "Insuffisant"],
      },
    ],
  },
  {
    title: "Utilisation de logiciels",
    icon: "apps",
    color: "indigo",
    subtitle: "Cochez les logiciels que vous utilisez régulièrement :",
    questions: [
      {
        id: "softwares",
        type: "checkbox",
        text: "",
        options: [
          {
            label: "Traitement de texte",
            extra: "(Word, Google Docs, Pages...)",
          },
          { label: "Tableur", extra: "(Excel, Google Sheets, Numbers...)" },
          {
            label: "Présentation",
            extra: "(PowerPoint, Google Slides, Keynote...)",
          },
          { label: "Je n'utilise aucun de ces logiciels", exclusive: true },
        ],
      },
    ],
  },
  {
    title: "Usages administratifs et sécurité",
    icon: "verified_user",
    color: "blue",
    questions: [
      {
        id: "admin_online",
        type: "radio",
        text: "Avez-vous déjà réalisé des démarches administratives en ligne ?",
        options: ["Oui", "Non"],
      },
      {
        id: "security_skills",
        type: "checkbox",
        text: "Sur votre ordinateur, savez-vous effectuer les manipulations suivantes ?",
        options: [
          { label: "Protéger votre ordinateur avec un antivirus" },
          {
            label:
              "Mettre à jour votre système d'exploitation et vos logiciels",
          },
          { label: "Changer vos mots de passe régulièrement" },
          { label: "Aucun des trois", exclusive: true },
        ],
      },
    ],
  },
]);

const responses = ref({});

onMounted(() => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  // Initialize responses
  groups.value.forEach((g) => {
    g.questions.forEach((q) => {
      if (q.type === "checkbox") {
        responses.value[q.id] = [];
      } else {
        responses.value[q.id] = null;
      }
    });
  });
  loading.value = false;
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
    router.push("/formations");
  } catch (error) {
    console.error("Failed to submit prerequisites:", error);
    alert("Erreur lors de la validation des prérequis.");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit">
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
        <span class="font-bold text-gray-800 text-xl tracking-tight"
          >Wizzy Learn</span
        >
      </div>

      <div class="flex items-center gap-6">
        <div class="hidden md:flex flex-col items-end">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
              >Progression</span
            >
            <span class="text-[10px] text-brand-primary font-bold"
              >Étape 2/5</span
            >
          </div>
          <div class="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="w-2/5 h-full bg-brand-primary transition-all duration-700"
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

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-extrabold text-[#0D1B3E] mb-3">
          Prérequis - Niveau Informatique
        </h1>
        <p class="text-gray-400 text-lg">
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
          class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
        >
          <div
            class="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30"
          >
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="
                group.color === 'blue'
                  ? 'bg-blue-600/10 text-blue-600'
                  : 'bg-indigo-600/10 text-indigo-600'
              "
            >
              <span class="material-icons-outlined">{{ group.icon }}</span>
            </div>
            <h2 class="text-lg font-bold text-gray-800">{{ group.title }}</h2>
          </div>

          <div class="p-8 md:p-10 space-y-10">
            <div
              v-if="group.subtitle"
              class="text-sm font-bold text-gray-400 uppercase tracking-wider -mb-4"
            >
              {{ group.subtitle }}
            </div>

            <div v-for="q in group.questions" :key="q.id" class="space-y-6">
              <div v-if="q.text" class="space-y-1">
                <p class="text-lg font-bold text-[#0D1B3E]">{{ q.text }}</p>
                <p v-if="q.subtitle" class="text-sm text-gray-400">
                  {{ q.subtitle }}
                </p>
              </div>

              <!-- Radio Options -->
              <div
                v-if="q.type === 'radio'"
                class="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <button
                  v-for="opt in q.options"
                  :key="opt"
                  @click="responses[q.id] = opt"
                  class="p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group"
                  :class="
                    responses[q.id] === opt
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-50 bg-[#F8FAFC] text-gray-500 hover:border-gray-200'
                  "
                >
                  <div
                    class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                    :class="
                      responses[q.id] === opt
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-gray-300 group-hover:border-brand-primary'
                    "
                  >
                    <div
                      v-if="responses[q.id] === opt"
                      class="w-2 h-2 rounded-full bg-white"
                    ></div>
                  </div>
                  <span class="font-bold">{{ opt }}</span>
                </button>
              </div>

              <!-- Checkbox Options -->
              <div v-if="q.type === 'checkbox'" class="space-y-3">
                <button
                  v-for="opt in q.options"
                  :key="opt.label"
                  @click="handleCheckbox(q.id, opt.label, opt.exclusive)"
                  class="w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group"
                  :class="
                    responses[q.id].includes(opt.label)
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-50 bg-[#F8FAFC] text-gray-500 hover:border-gray-200'
                  "
                >
                  <div
                    class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
                    :class="
                      responses[q.id].includes(opt.label)
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-gray-300 group-hover:border-brand-primary'
                    "
                  >
                    <span
                      v-if="responses[q.id].includes(opt.label)"
                      class="material-icons-outlined text-white text-sm"
                      >check</span
                    >
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold">{{ opt.label }}</span>
                    <span
                      v-if="opt.extra"
                      class="text-sm font-medium opacity-60"
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
          class="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <button
            @click="router.push('/')"
            class="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 transition-colors"
          >
            <span class="material-icons-outlined">arrow_back</span>
            Précédent
          </button>

          <button
            @click="submitPrerequis"
            :disabled="submitting"
            class="w-full sm:w-auto px-12 py-5 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            <span>Valider et continuer</span>
            <span v-if="!submitting" class="material-icons-outlined text-2xl"
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
      class="bg-white border-t border-gray-100 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-auto"
    >
      <div>© 2023 Wizzy Learn. Tous droits réservés.</div>
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
