<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { formatBoldText } from "../../utils/formatText";

const questions = ref([]);
const loading = ref(true);
const filterType = ref("");
const showModal = ref(false);
const editingQuestion = ref(null);
const form = ref({
  text: "",
  type: "prerequis",
  responseType: "qcm",
  category: "",
  icon: "quiz",
  options: ["", ""],
  formationId: "",
  levelId: "",
  correctResponseIndex: 0,
  isActive: true,
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const formations = ref([]);
const formationFilter = ref("");
const levelFilter = ref("");
const savingOrder = ref(false);
const token = localStorage.getItem("admin_token");

async function fetchQuestions() {
  loading.value = true;
  try {
    const url = filterType.value
      ? `${apiBaseUrl}/questions/workflow/${filterType.value}`
      : `${apiBaseUrl}/questions`;
    const res = await axios.get(url, {
      params: { ...(formationFilter.value ? { formation: formationFilter.value } : {}) },
      headers: { Authorization: `Bearer ${token}` }
    });
    // deduplicate fetched questions by id or text
    questions.value = Array.from(
      new Map((res.data || []).map((q) => [q.id ?? q.text, q])).values(),
    );
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
    responseType: "qcm",
    category: "",
    icon: "quiz",
    options: ["", ""],
    formationId: "",
    levelId: "",
    correctResponseIndex: 0,
    isActive: true,
  };
  showModal.value = true;
}

function openEditModal(q) {
  editingQuestion.value = q;
  form.value = {
    text: q.text,
    type: q.type,
    responseType: q.responseType || "qcm",
    category: q.category || "",
    icon: q.icon || "quiz",
    options: q.options
      ? [...q.options.map((o) => (typeof o === "string" ? o : o.label))]
      : ["", ""],
    formationId: q.formation?.id || "",
    levelId: q.level?.id || "",
    correctResponseIndex: q.correctResponseIndex || 0,
    isActive: q.isActive !== false, // Default to true
  };
  showModal.value = true;
}

async function saveQuestion() {
  try {
    // Filter out empty options
    const payload = {
      ...form.value,
      options: form.value.responseType === 'text' ? [] : form.value.options.filter((o) => o.trim() !== ""),
    };

    if (editingQuestion.value) {
      await axios.patch(
        `${apiBaseUrl}/questions/${editingQuestion.value.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(`${apiBaseUrl}/questions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    showModal.value = false;
    await fetchQuestions();
  } catch (error) {
    alert("Erreur lors de l'enregistrement");
    console.error(error);
  }
}

async function toggleStatus(q) {
  try {
    const newStatus = !q.isActive;
    await axios.patch(
      `${apiBaseUrl}/questions/${q.id}`,
      { isActive: newStatus },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    q.isActive = newStatus;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

async function deleteQuestion(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/questions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
  if (form.value.correctResponseIndex === index) {
    form.value.correctResponseIndex = 0;
  } else if (form.value.correctResponseIndex > index) {
    form.value.correctResponseIndex--;
  }
}

onMounted(() => {
  fetchQuestions();
  fetchFormations();
});

function moveQuestion(levelGroup, index, direction) {
  if (!enableOrdering) return;
  const fromQ = levelGroup.questions[index];
  const toQ = levelGroup.questions[index + direction];
  if (!fromQ || !toQ) return;

  const idxA = questions.value.findIndex((q) => q.id === fromQ.id);
  const idxB = questions.value.findIndex((q) => q.id === toQ.id);
  if (idxA === -1 || idxB === -1) return;

  const copy = [...questions.value];
  [copy[idxA], copy[idxB]] = [copy[idxB], copy[idxA]];
  questions.value = copy;
}

async function saveOrder(questionsList) {
  savingOrder.value = true;
  try {
    const payload = questionsList.map((q, idx) => ({
      id: q.id,
      order: idx + 1
    }));
    await axios.patch(`${apiBaseUrl}/questions/order`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Ordre mis à jour");
    await fetchQuestions();
  } catch (error) {
    console.error("Failed to save order", error);
    alert("Erreur lors de la sauvegarde de l'ordre");
  } finally {
    savingOrder.value = false;
  }
}

const types = [
  { label: "Tous", value: "" },
  { label: "Pré-requis", value: "prerequis" },
  { label: "Positionnement", value: "positionnement" },
  { label: "Complémentaires", value: "complementary" },
  { label: "Disponibilités", value: "availabilities" },
];
// Toggle to enable ordering UI
const enableOrdering = true;

const availableLevels = computed(() => {
  if (!form.value.formationId) return [];
  const selectedFormation = formations.value.find(
    (f) => f.id === form.value.formationId,
  );
  return selectedFormation?.levels || [];
});

// Options de filtre par niveau (basées sur les questions chargées)
const levelFilterOptions = computed(() => {
  const labels = new Set();
  questions.value.forEach((q) => {
    // Si une formation est sélectionnée, ignorer les autres formations et Global
    if (
      formationFilter.value &&
      (!q.formation || q.formation.slug !== formationFilter.value)
    ) {
      return;
    }
    const label = q.level?.label || "Sans niveau";
    labels.add(label);
  });
  return Array.from(labels);
});

// Vue admin : regroupement par formation puis par niveau, avec filtres
const groupedQuestions = computed(() => {
  const map = new Map();

  questions.value.forEach((q) => {
    // Filtre formation : si une formation est choisie, ne garder que celle-ci (et pas Global)
    if (
      formationFilter.value &&
      (!q.formation || q.formation.slug !== formationFilter.value)
    ) {
      return;
    }

    const levelLabel = q.level?.label || "Sans niveau";
    if (levelFilter.value && levelLabel !== levelFilter.value) {
      return;
    }

    const formationKey = q.formation?.id || "global";
    const formationLabel = q.formation?.label || "Global";

    if (!map.has(formationKey)) {
      map.set(formationKey, {
        id: formationKey,
        label: formationLabel,
        levels: new Map(),
      });
    }

    const formationGroup = map.get(formationKey);
    const levelKey = q.level?.id || "no-level";

    if (!formationGroup.levels.has(levelKey)) {
      formationGroup.levels.set(levelKey, {
        id: levelKey,
        label: levelLabel,
        questions: [],
      });
    }

    formationGroup.levels.get(levelKey).questions.push(q);
  });

  return Array.from(map.values()).map((fg) => ({
    id: fg.id,
    label: fg.label,
    levels: Array.from(fg.levels.values()),
  }));
});
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
        class="w-full md:w-auto px-8 py-4 bg-brand-primary text-[#428496] rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all"
      >
        <span class="material-icons-outlined">add</span>
        Nouvelle Question
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex flex-wrap gap-2 p-2 bg-gray-200 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          v-for="t in types"
          :key="t.value"
          @click="
            filterType = t.value;
            fetchQuestions();
          "
          :aria-pressed="filterType === t.value"
          class="flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          :class="
            filterType === t.value
              ? 'bg-gray-300 text-(--title-color) shadow-md'
              : 'text-gray-400 hover:text-gray-600'
          "
        >
          {{ t.label }}
        </button>
      </div>

      <select
        v-model="formationFilter"
        @change="() => { levelFilter = ''; fetchQuestions(); }"
        class="w-full sm:w-auto px-4 py-3 bg-white border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-w-[200px]"
      >
        <option value="">Toutes les formations</option>
        <option v-for="f in formations" :key="f.id" :value="f.slug">
          {{ f.label }}
        </option>
      </select>

      <select
        v-model="levelFilter"
        class="w-full sm:w-auto px-4 py-3 bg-white border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-w-[180px]"
      >
        <option value="">Tous les niveaux</option>
        <option
          v-for="lvl in levelFilterOptions"
          :key="lvl"
          :value="lvl"
        >
          {{ lvl }}
        </option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-6">
      <div
        v-if="loading"
        v-for="i in 3"
        :key="i"
        class="h-32 bg-white rounded-[32px] animate-pulse"
      ></div>

      <!-- Vue regroupée par formation puis par niveau -->
      <div
        v-else
        v-for="fg in groupedQuestions"
        :key="fg.id"
        class="space-y-4"
      >
        <div class="flex items-center gap-3 px-2">
          <span
            class="px-4 py-2 bg-purple-50 text-[9px] font-black uppercase tracking-widest text-purple-600 rounded-full border border-purple-100 flex items-center gap-1"
          >
            <span class="material-icons-outlined text-[12px]">school</span>
            {{ fg.label }}
          </span>
          <span
            class="text-[10px] font-bold text-gray-300 uppercase tracking-widest"
          >
            {{ fg.levels.length }} niveau(x)
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="lg in fg.levels"
            :key="lg.id"
            class="bg-white rounded-[32px] border border-gray-100 shadow-sm"
          >
            <div
              class="px-6 py-3 border-b border-gray-50 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-8 h-8 rounded-full bg-yellow-50 text-yellow-700 flex items-center justify-center text-[11px] font-black uppercase tracking-widest"
                >
                  {{ lg.label === 'Sans niveau' ? '?' : lg.label }}
                </span>
                <span
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                >
                  {{ lg.questions.length }} question(s)
                </span>
                <button 
                  v-if="enableOrdering"
                  @click="saveOrder(lg.questions)"
                  :disabled="savingOrder"
                  class="flex items-center gap-2 px-4 py-1.5 bg-brand-primary text-[#428496] rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                >
                  Appliquer l'ordre
                </button>
              </div>
            </div>

            <div class="divide-y divide-gray-50">
              <div
                v-for="(q, idx) in lg.questions"
                :key="q.id"
                class="p-6 flex items-start gap-6 hover:bg-gray-50/60 transition-colors group relative"
              >
                <!-- REORDER CONTROLS -->
                <div v-if="enableOrdering" class="flex flex-col gap-1 mt-1 shrink-0">
                  <button 
                    @click="moveQuestion(lg, idx, -1)" 
                    :disabled="idx === 0"
                    class="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:bg-brand-primary hover:text-[#428496] disabled:opacity-10 transition-all border border-gray-50"
                  >
                    <span class="material-icons-outlined text-sm">expand_less</span>
                  </button>
                  <div class="text-[9px] font-black text-gray-300 text-center">{{ idx + 1 }}</div>
                  <button 
                    @click="moveQuestion(lg, idx, 1)" 
                    :disabled="idx === lg.questions.length - 1"
                    class="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:bg-brand-primary hover:text-[#428496] disabled:opacity-10 transition-all border border-gray-50"
                  >
                    <span class="material-icons-outlined text-sm">expand_more</span>
                  </button>
                </div>

                <div
                  class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-[#428496] transition-all shadow-inner"
                >
                  <span class="material-icons-outlined text-xl">{{
                    q.icon || "quiz"
                  }}</span>
                </div>

                <div class="flex-1 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="px-3 py-1 bg-indigo-50 text-[8px] font-black uppercase tracking-widest text-indigo-500 rounded-full border border-indigo-100"
                      >{{ q.responseType || 'qcm' }}</span
                    >
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
                      class="px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border"
                      :class="q.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'"
                    >
                      {{ q.isActive ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>
                  <p class="text-sm font-black heading-primary">
                    {{ q.text }}
                  </p>
                  <div v-if="q.responseType !== 'text'" class="flex flex-wrap gap-2">
                    <span
                      v-for="(opt, oIdx) in q.options"
                      :key="oIdx"
                      class="text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-1 border border-transparent"
                      :class="
                        oIdx === q.correctResponseIndex
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'text-gray-400 bg-gray-50 border-gray-100'
                      "
                    >
                      <span v-html="formatBoldText(typeof opt === 'string' ? opt : opt.label)"></span>
                      <span
                        v-if="oIdx === q.correctResponseIndex"
                        class="material-icons-outlined text-[10px]"
                        >check_circle</span
                      >
                    </span>
                  </div>
                </div>

                <div
                  class="flex flex-col sm:flex-row lg:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <button
                    @click="toggleStatus(q)"
                    class="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
                    :title="q.isActive ? 'Désactiver' : 'Activer'"
                  >
                    <span class="material-icons-outlined text-sm">{{ q.isActive ? 'visibility_off' : 'visibility' }}</span>
                  </button>
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
            </div>
          </div>
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
        <div class="p-10 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
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

              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Type de réponse</label
                >
                <select
                  v-model="form.responseType"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                >
                  <option value="qcm">Multiple (QCM)</option>
                  <option value="checkbox">Cases à cocher</option>
                  <option value="text">Texte libre</option>
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

              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Actif ?</label
                >
                <div
                  @click="form.isActive = !form.isActive"
                  class="w-full px-6 py-4 rounded-2xl cursor-pointer transition-all font-bold text-sm text-center border"
                  :class="
                    form.isActive
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-red-50 border-red-200 text-red-600'
                  "
                >
                  {{ form.isActive ? "OUI" : "NON" }}
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

            <div v-if="form.responseType === 'qcm' || form.responseType === 'checkbox'" class="space-y-4">
              <div class="flex items-center justify-between px-1">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                  >{{ form.responseType === 'qcm' ? 'Options de Réponse' : 'Cases à cocher' }}</label
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
                  v-for="(opt, oIdx) in form.options"
                  :key="oIdx"
                  class="flex gap-2 items-center group relative"
                >
                  <label v-if="form.responseType === 'qcm'" class="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer hover:bg-green-50 transition-colors" title="Marquer comme bonne réponse">
                    <input type="radio" :value="oIdx" v-model="form.correctResponseIndex" class="w-4 h-4 text-green-500 border-gray-300 focus:ring-green-500 cursor-pointer" />
                  </label>
                  <div v-else class="w-8 h-8"></div>
                  <input
                    v-model="form.options[oIdx]"
                    class="flex-1 px-6 py-3 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm"
                    placeholder="Option..."
                  />
                  <button
                    v-if="form.options.length > 1"
                    type="button"
                    @click="removeOption(oIdx)"
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
                class="w-full py-5 bg-brand-primary text-[#428496] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
