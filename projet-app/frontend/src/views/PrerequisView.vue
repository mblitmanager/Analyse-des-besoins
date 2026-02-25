<script setup>
import { ref, onMounted, computed } from "vue";
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

const questions = ref([]);
const responses = ref({});
const groups = ref([]);
const QUESTIONS_PER_PAGE = 5;
const isPaginated = ref(false);
const currentPage = ref(0);

const allQuestions = computed(() =>
  groups.value.flatMap((g) => g.questions)
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(allQuestions.value.length / QUESTIONS_PER_PAGE))
);

const paginatedQuestions = computed(() => {
  if (!isPaginated.value) return allQuestions.value;
  const start = currentPage.value * QUESTIONS_PER_PAGE;
  return allQuestions.value.slice(start, start + QUESTIONS_PER_PAGE);
});

const needsPagination = computed(() => isPaginated.value && allQuestions.value.length > QUESTIONS_PER_PAGE);

function nextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++;
}

function prevPage() {
  if (currentPage.value > 0) currentPage.value--;
}

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const sessionRes = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    const session = sessionRes.data;

    const formationSlug =
      localStorage.getItem("selected_formation_slug") ||
      session.formationChoisie ||
      undefined;

    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: formationSlug
        ? { formation: formationSlug, scope: "auto" }
        : { scope: "global" },
    });
    // deduplicate fetched questions by id or text
    questions.value = Array.from(
      new Map((res.data || []).map((q) => [q.id ?? q.text, q])).values(),
    );

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
        responseType: q.responseType || "qcm",
        subtitle: q.metadata?.subtitle || "",
        options: q.options.map((opt) => {
          if (typeof opt === "string") return opt;
          return opt; // metadata might contain exclusive/extra, but for seeding we used simple strings for now
        }),
      });

      // Initialize response
      if (q.responseType === "text") {
        responses.value[q.id] = "";
      } else if (q.metadata?.type === "checkbox") {
        responses.value[q.id] = [];
      } else {
        responses.value[q.id] = null;
      }
    });

    groups.value = Object.values(grouped);

    // Fetch pagination setting
    try {
      const settingsRes = await axios.get(`${apiBaseUrl}/settings/PREREQUIS_PAGINATED`);
      if (settingsRes.data && settingsRes.data.value !== undefined) {
        isPaginated.value = settingsRes.data.value === "true";
      }
    } catch (e) {
      console.warn("Could not fetch PREREQUIS_PAGINATED setting, using default (true)");
    }
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
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
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
    <SiteHeader>
      <template #actions>
        <div class="hidden md:flex flex-col items-end mr-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Progression</span>
            <span class="text-[10px] text-brand-primary font-bold">
              Étape {{ store.getProgress("/prerequis").current }}/{{ store.getProgress("/prerequis").total }}
            </span>
          </div>
          <div class="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-brand-primary transition-all duration-700"
              :style="{ width: store.getProgress('/prerequis').percentage + '%' }"
            ></div>
          </div>
        </div>
      </template>
    </SiteHeader>

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
        <!-- Pagination dots -->
        <div v-if="needsPagination" class="flex items-center justify-center gap-3 mb-2">
          <button
            v-for="p in totalPages"
            :key="p - 1"
            @click="currentPage = p - 1"
            class="w-3 h-3 rounded-full transition-all"
            :class="currentPage === p - 1 ? 'bg-brand-primary scale-125' : 'bg-gray-200 hover:bg-gray-300'"
          ></button>
          <span class="text-xs text-gray-400 font-bold ml-2">
            {{ currentPage + 1 }} / {{ totalPages }}
          </span>
        </div>

        <div
          class="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
        >
          <div
            class="px-6 py-5 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-blue-600/10 text-blue-600"
            >
              <span class="material-icons-outlined text-lg">quiz</span>
            </div>
            <h2 class="text-base font-bold text-gray-800">
              Questions {{ needsPagination ? `(${currentPage * QUESTIONS_PER_PAGE + 1}-${Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, allQuestions.length)} sur ${allQuestions.length})` : '' }}
            </h2>
          </div>

          <div class="p-6 md:p-8 space-y-8">
            <div v-for="q in paginatedQuestions" :key="q.id" class="space-y-4">
              <div v-if="q.text" class="space-y-1">
                <p class="text-base font-bold heading-primary">{{ q.text }}</p>
                <p v-if="q.subtitle" class="text-xs text-gray-400">
                  {{ q.subtitle }}
                </p>
              </div>

              <!-- Free-text -->
              <div v-if="q.responseType === 'text'" class="mt-4">
                <textarea
                  v-model="responses[q.id]"
                  rows="3"
                  class="w-full px-5 py-4 bg-white border border-gray-100 focus:border-brand-primary outline-none rounded-2xl transition-all font-bold text-sm shadow-sm"
                  placeholder="Saisissez votre réponse ici..."
                ></textarea>
              </div>

              <!-- Radio Options -->
              <div
                v-else-if="q.type === 'radio'"
                class="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                <button
                  v-for="opt in q.options"
                  :key="opt"
                  @click="responses[q.id] = opt"
                  class="prereq-option"
                  :class="
                    responses[q.id] === opt
                      ? 'prereq-option--selected'
                      : 'prereq-option--default'
                  "
                >
                  <span class="prereq-option__label">{{ opt }}</span>
                  <div
                    class="prereq-option__radio"
                    :class="
                      responses[q.id] === opt
                        ? 'prereq-option__radio--selected'
                        : ''
                    "
                  >
                    <div
                      v-if="responses[q.id] === opt"
                      class="prereq-option__radio-dot"
                    ></div>
                  </div>
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
                  class="prereq-option prereq-option--full"
                  :class="
                    responses[q.id].includes(
                      typeof opt === 'string' ? opt : opt.label,
                    )
                      ? 'prereq-option--selected'
                      : 'prereq-option--default'
                  "
                >
                  <div class="flex flex-col flex-1">
                    <span class="prereq-option__label">{{
                      typeof opt === "string" ? opt : opt.label
                    }}</span>
                    <span
                      v-if="typeof opt !== 'string' && opt.extra"
                      class="text-xs font-medium opacity-60"
                      >{{ opt.extra }}</span
                    >
                  </div>
                  <div
                    class="prereq-option__check"
                    :class="
                      responses[q.id].includes(
                        typeof opt === 'string' ? opt : opt.label,
                      )
                        ? 'prereq-option__check--selected'
                        : ''
                    "
                  >
                    <span
                      v-if="
                        responses[q.id].includes(
                          typeof opt === 'string' ? opt : opt.label,
                        )
                      "
                      class="material-icons-outlined text-[#428496] text-xs"
                      >check</span
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
            @click="needsPagination && currentPage > 0 ? prevPage() : router.push('/')"
            class="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
          >
            <span class="material-icons-outlined">arrow_back</span>
            {{ needsPagination && currentPage > 0 ? 'Précédent' : 'Retour' }}
          </button>

          <!-- Next page button (shown when not on last page) -->
          <button
            v-if="needsPagination && currentPage < totalPages - 1"
            @click="nextPage"
            class="w-full sm:w-auto px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 text-base"
          >
            <span>Suivant</span>
            <span class="material-icons-outlined text-xl">arrow_forward</span>
          </button>

          <!-- Submit button (shown on last page or when no pagination) -->
          <button
            v-else
            @click="submitPrerequis"
            :disabled="submitting"
            class="w-full sm:w-auto px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
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

    <SiteFooter />
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}

/* Prereq option card */
.prereq-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  min-height: 3.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 0.875rem;
}

.prereq-option--full {
  width: 100%;
}

.prereq-option--default:hover {
  border-color: #d1d5db;
}

.prereq-option--selected {
  border-color: var(--color-brand-primary, #3b82f6);
  background: rgba(59, 130, 246, 0.03);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.prereq-option__label {
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.prereq-option--selected .prereq-option__label {
  color: var(--color-brand-primary, #3b82f6);
}

.prereq-option__radio {
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

.prereq-option__radio--selected {
  border-color: var(--color-brand-primary, #3b82f6);
  background: var(--color-brand-primary, #3b82f6);
}

.prereq-option__radio-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
}

.prereq-option__check {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.375rem;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.prereq-option__check--selected {
  border-color: var(--color-brand-primary, #3b82f6);
  background: var(--color-brand-primary, #3b82f6);
}
</style>
