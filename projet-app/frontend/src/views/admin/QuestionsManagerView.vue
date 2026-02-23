<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const questions = ref([]);
const loading = ref(true);
const filterType = ref("");
const showModal = ref(false);
const editingQuestion = ref(null);
const form = ref({
  text: "",
  type: "prerequis",
  category: "",
  icon: "quiz",
  options: ["", ""],
  formationId: "",
  levelId: "",
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formations = ref([]);
const formationFilter = ref("");

async function fetchQuestions() {
  loading.value = true;
  try {
    const url = filterType.value
      ? `${apiBaseUrl}/questions/workflow/${filterType.value}`
      : `${apiBaseUrl}/questions`;
    const res = await axios.get(url, {
      params: { ...(formationFilter.value ? { formation: formationFilter.value } : {}) }
    });
    questions.value = res.data;
  } catch (error) {
    console.error("Failed to fetch questions:", error);
  } finally {
    loading.value = false;
  }
}

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`);
    formations.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  }
}

function openAddModal() {
  editingQuestion.value = null;
  form.value = {
    text: "",
    type: "prerequis",
    category: "",
    icon: "quiz",
    options: ["", ""],
    formationId: "",
    levelId: "",
  };
  showModal.value = true;
}

function openEditModal(q) {
  editingQuestion.value = q;
  form.value = {
    text: q.text,
    type: q.type,
    category: q.category || "",
    icon: q.icon || "quiz",
    options: q.options
      ? [...q.options.map((o) => (typeof o === "string" ? o : o.label))]
      : ["", ""],
    formationId: q.formation?.id || "",
    levelId: q.level?.id || "",
  };
  showModal.value = true;
}

async function saveQuestion() {
  try {
    // Filter out empty options
    const payload = {
      ...form.value,
      options: form.value.options.filter((o) => o.trim() !== ""),
    };

    if (editingQuestion.value) {
      await axios.patch(
        `${apiBaseUrl}/questions/${editingQuestion.value.id}`,
        payload,
      );
    } else {
      await axios.post(`${apiBaseUrl}/questions`, payload);
    }

    showModal.value = false;
    await fetchQuestions();
  } catch (error) {
    alert("Erreur lors de l'enregistrement");
    console.error(error);
  }
}

async function deleteQuestion(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/questions/${id}`);
    await fetchQuestions();
  } catch (error) {
    alert("Erreur lors de la suppression");
    console.error(error);
  }
}

function addOption() {
  form.value.options.push("");
}

function removeOption(index) {
  form.value.options.splice(index, 1);
}

onMounted(() => {
  fetchQuestions();
  fetchFormations();
});

const types = [
  { label: "Tous", value: "" },
  { label: "Pré-requis", value: "prerequis" },
  { label: "Positionnement", value: "positionnement" },
  { label: "Complémentaires", value: "complementary" },
  { label: "Disponibilités", value: "availabilities" },
];

const availableLevels = computed(() => {
  if (!form.value.formationId) return [];
  const selectedFormation = formations.value.find(f => f.id === form.value.formationId);
  return selectedFormation?.levels || [];
});
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-black heading-primary">
          Gestion des Questions
        </h2>
        <p
          class="text-gray-400 font-bold uppercase tracking-widest text-[10px]"
        >
          Personnalisez le contenu de vos questionnaires
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-8 py-4 bg-brand-primary text-blue-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
      >
        <span class="material-icons-outlined">add</span>
        Nouvelle Question
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          v-for="t in types"
          :key="t.value"
          @click="
            filterType = t.value;
            fetchQuestions();
          "
          class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          :class="
            filterType === t.value
              ? 'bg-white text-[var(--title-color)] shadow-md'
              : 'text-gray-400 hover:text-gray-600'
          "
        >
          {{ t.label }}
        </button>
      </div>

      <select
        v-model="formationFilter"
        @change="fetchQuestions"
        class="px-4 py-3 bg-white border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-w-[200px]"
      >
        <option value="">Toutes les formations</option>
        <option v-for="f in formations" :key="f.id" :value="f.slug">{{ f.label }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <div
        v-if="loading"
        v-for="i in 3"
        :key="i"
        class="h-32 bg-white rounded-[32px] animate-pulse"
      ></div>

      <div
        v-else
        v-for="q in questions"
        :key="q.id"
        class="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all border border-transparent hover:border-blue-50 group flex items-start gap-6"
      >
        <div
          class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-blue-400 transition-all shadow-inner"
        >
          <span class="material-icons-outlined text-2xl">{{
            q.icon || "quiz"
          }}</span>
        </div>

        <div class="flex-1 space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <span
              v-if="q.formation"
              class="px-3 py-1 bg-purple-50 text-[8px] font-black uppercase tracking-widest text-purple-600 rounded-full border border-purple-100"
            >
              <span class="material-icons-outlined text-[10px] align-text-bottom mr-1"
                >school</span
              >
              {{ q.formation.label }}
            </span>
            <span
              v-else
              class="px-3 py-1 bg-emerald-50 text-[8px] font-black uppercase tracking-widest text-emerald-600 rounded-full border border-emerald-100"
            >
              <span class="material-icons-outlined text-[10px] align-text-bottom mr-1"
                >public</span
              >
              Global
            </span>

            <span
              class="px-3 py-1 bg-gray-50 text-[8px] font-black uppercase tracking-widest text-gray-400 rounded-full border border-gray-100"
              >{{ q.type }}</span
            >
            <span
              v-if="q.category"
              class="px-3 py-1 bg-blue-50 text-[8px] font-black uppercase tracking-widest text-blue-500 rounded-full border border-blue-100"
              >{{ q.category }}</span
            >
            <span
              v-if="q.level"
              class="px-3 py-1 bg-yellow-50 text-[8px] font-black uppercase tracking-widest text-yellow-600 rounded-full border border-yellow-100"
            >
              Niveau: {{ q.level.label }}
            </span>
          </div>
          <p class="text-lg font-black heading-primary">{{ q.text }}</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="opt in q.options"
              :key="opt"
              class="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg"
            >
              {{ typeof opt === "string" ? opt : opt.label }}
            </span>
          </div>
        </div>

        <div
          class="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            @click="openEditModal(q)"
            class="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
          >
            <span class="material-icons-outlined text-sm">edit</span>
          </button>
          <button
            @click="deleteQuestion(q.id)"
            class="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"
          >
            <span class="material-icons-outlined text-sm">delete</span>
          </button>
        </div>
      </div>

      <div
        v-if="!loading && questions.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-[40px] shadow-sm"
      >
        <span class="material-icons-outlined text-6xl mb-4 opacity-20"
          >search_off</span
        >
        <p class="font-bold uppercase tracking-widest text-xs">
          Aucune question trouvée pour ce type
        </p>
      </div>
    </div>

    <!-- Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
      <div
        class="absolute inset-0 overlay-dark backdrop-blur-sm"
        @click="showModal = false"
      ></div>
      <div
        class="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-scale-up"
      >
        <div class="p-10 space-y-8">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black heading-primary">
                {{ editingQuestion ? "Modifier" : "Ajouter" }} une Question
              </h3>
              <p
                class="text-gray-400 text-xs font-bold uppercase tracking-widest"
              >
                Configurez les paramètres de la question
              </p>
            </div>
            <button
              @click="showModal = false"
              class="text-gray-300 hover:text-gray-600 transition-colors"
            >
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveQuestion" class="space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Formation Associée (Optionnel)</label
                >
                <select
                  v-model="form.formationId"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                >
                  <option value="">-- Toutes les formations (Global) --</option>
                  <option v-for="f in formations" :key="f.id" :value="f.id">{{ f.label }}</option>
                </select>
              </div>

              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Type de Workflow</label
                >
                <select
                  v-model="form.type"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                >
                  <option value="prerequis">Pré-requis</option>
                  <option value="positionnement">Positionnement</option>
                  <option value="complementary">Complémentaires</option>
                  <option value="availabilities">Disponibilités</option>
                </select>
              </div>

              <div class="space-y-2" v-if="(form.type === 'positionnement' || form.type === 'prerequis') && form.formationId">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Niveau Associé (Optionnel)</label
                >
                <select
                  v-model="form.levelId"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                >
                  <option value="">-- Ignorer le niveau --</option>
                  <option v-for="lvl in availableLevels" :key="lvl.id" :value="lvl.id">{{ lvl.label }} ({{ lvl.successThreshold }} Q.)</option>
                </select>
              </div>

              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Catégorie / Icone</label
                >
                <div class="flex gap-2">
                  <input
                    v-model="form.category"
                    placeholder="ex: Expérience"
                    class="flex-1 px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  />
                  <input
                    v-model="form.icon"
                    placeholder="quiz"
                    class="w-24 px-4 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm text-center"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label
                class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                >Texte de la Question</label
              >
              <textarea
                v-model="form.text"
                rows="3"
                class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                placeholder="Saisissez votre question ici..."
              ></textarea>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between px-1">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                  >Options de Réponse</label
                >
                <button
                  type="button"
                  @click="addOption"
                  class="text-brand-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  + Ajouter une option
                </button>
              </div>
              <div
                class="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar"
              >
                <div
                  v-for="(opt, idx) in form.options"
                  :key="idx"
                  class="flex gap-2"
                >
                  <input
                    v-model="form.options[idx]"
                    class="flex-1 px-6 py-3 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                    placeholder="Option..."
                  />
                  <button
                    v-if="form.options.length > 1"
                    type="button"
                    @click="removeOption(idx)"
                    class="w-11 h-11 flex items-center justify-center text-red-300 hover:text-red-500 transition-colors"
                  >
                    <span class="material-icons-outlined text-lg"
                      >remove_circle_outline</span
                    >
                  </button>
                </div>
              </div>
            </div>

            <div class="pt-4">
              <button
                type="submit"
                class="w-full py-5 bg-brand-primary text-blue-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Enregistrer la Question
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.animate-scale-up {
  animation: scaleUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #e2e8f0;
}
</style>
