<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { formatBoldText } from "../../utils/formatText";

const questions = ref([]);
const loading = ref(true);
const filterType = ref(localStorage.getItem('admin_q_filterType') || "");
const showModal = ref(false);
const editingQuestion = ref(null);
const workflowTypes = ref([]);
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
  showIfEnabled: false,
  showIfOperator: "OR",
  showIfRules: [],
  showIfQuestionId: "",
  showIfResponseIndexes: [],
  showIfResponseValue: "",
  correctResponseIndexes: [],
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const getHeader = () => {
  const token = localStorage.getItem("admin_token");
  if (!token) return null;
  return { headers: { Authorization: `Bearer ${token}` } };
};

const formations = ref([]);
const formationFilter = ref(localStorage.getItem('admin_q_formationFilter') || "");
const levelFilter = ref(localStorage.getItem('admin_q_levelFilter') || "");
const savingOrder = ref(false);
const searchTerm = ref("");
const page = ref(1);

// Duplication state
const showDuplicateModal = ref(false);
const duplicateIds = ref([]);
const dupFormationId = ref("");
const dupLevelId = ref("");
const duplicating = ref(false);
const dupAvailableLevels = computed(() => {
  if (!dupFormationId.value) return [];
  const f = formations.value.find((f) => f.id == dupFormationId.value);
  return f?.levels || [];
});

function openDuplicateModal(ids) {
  duplicateIds.value = Array.isArray(ids) ? ids : [ids];
  dupFormationId.value = "";
  dupLevelId.value = "";
  showDuplicateModal.value = true;
}

async function confirmDuplicate() {
  if (duplicateIds.value.length === 0) return;
  const header = getHeader();
  if (!header) return;
  duplicating.value = true;
  try {
    const res = await axios.post(`${apiBaseUrl}/questions/duplicate`, {
      ids: duplicateIds.value,
      targetFormationId: dupFormationId.value ? Number(dupFormationId.value) : null,
      targetLevelId: dupLevelId.value ? Number(dupLevelId.value) : null,
    }, header);
    showDuplicateModal.value = false;
    selectedIds.value.clear();
    alert(`${res.data.count} question(s) dupliquée(s) avec succès`);
    await fetchQuestions();
  } catch (error) {
    console.error("Duplicate failed:", error);
    alert("Erreur lors de la duplication");
  } finally {
    duplicating.value = false;
  }
}

const selectedIds = ref(new Set());
const isAllSelected = computed(() => {
  if (questions.value.length === 0) return false;
  return questions.value.every(q => selectedIds.value.has(q.id));
});

function toggleSelection(id) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
}

function toggleAllSelection() {
  if (isAllSelected.value) {
    selectedIds.value.clear();
  } else {
    questions.value.forEach(q => selectedIds.value.add(q.id));
  }
}

// Persist filters to localStorage
watch(filterType, (v) => localStorage.setItem('admin_q_filterType', v));
watch(formationFilter, (v) => localStorage.setItem('admin_q_formationFilter', v));
watch(levelFilter, (v) => localStorage.setItem('admin_q_levelFilter', v));
const pageSize = ref(25);

async function fetchQuestions() {
  const header = getHeader();
  if (!header) return;
  loading.value = true;
  try {
    const url = filterType.value
      ? `${apiBaseUrl}/questions/workflow/${filterType.value}`
      : `${apiBaseUrl}/questions`;
    const res = await axios.get(url, {
      params: { ...(formationFilter.value ? { formation: formationFilter.value } : {}) },
      headers: header.headers
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
  const header = getHeader();
  if (!header) return;
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`, header);
    formations.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  }
}

async function fetchWorkflowTypes() {
  const header = getHeader();
  if (!header) return;
  try {
    const res = await axios.get(`${apiBaseUrl}/workflow`, header);
    // Map ALL active workflow steps to question types (code -> lowercase)
    workflowTypes.value = res.data
      .filter(step => step.isActive !== false)
      .map(step => ({
        label: step.label,
        value: step.code.toLowerCase(), // Convert code to lowercase for type
      }));
  } catch (error) {
    console.error("Failed to fetch workflow types:", error);
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
    showIfEnabled: false,
    showIfOperator: "OR",
    showIfRules: [],
    showIfQuestionId: "",
    showIfResponseIndexes: [],
    showIfResponseValue: "",
    correctResponseIndexes: [],
  };
  showModal.value = true;
}

function openEditModal(q) {
  editingQuestion.value = q;
  // Build showIfRules from existing data
  let rules = [];
  if (q.showIfRules && q.showIfRules.length) {
    rules = q.showIfRules.map(r => ({
      questionId: String(r.questionId || ""),
      responseIndexes: r.responseIndexes || [],
      responseValue: r.responseValue || "",
    }));
  } else if (q.showIfQuestionId) {
    // Legacy single-parent migration
    rules = [{
      questionId: String(q.showIfQuestionId),
      responseIndexes: q.showIfResponseIndexes || [],
      responseValue: q.showIfResponseValue || "",
    }];
  }
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
    isActive: q.isActive !== false,
    showIfEnabled: rules.length > 0,
    showIfOperator: q.showIfOperator || "OR",
    showIfRules: rules,
    showIfQuestionId: q.showIfQuestionId || "",
    showIfResponseIndexes: q.showIfResponseIndexes || [],
    showIfResponseValue: q.showIfResponseValue || "",
    correctResponseIndexes: q.correctResponseIndexes || [],
  };
  showModal.value = true;
}

async function saveQuestion() {
  const header = getHeader();
  if (!header) return;
  try {
    const payload = {
      ...form.value,
      options: (form.value.responseType === 'text' || form.value.responseType === 'dropdown') ? form.value.options.filter((o) => o.trim() !== "") : form.value.options.filter((o) => o.trim() !== ""),
      showIfRules: form.value.showIfEnabled
        ? form.value.showIfRules
            .filter(r => r.questionId)
            .map(r => ({
              questionId: Number(r.questionId),
              responseIndexes: (r.responseIndexes || []).map(i => Number(i)),
              responseValue: r.responseValue ? String(r.responseValue).trim() : "",
            }))
        : [],
      showIfOperator: form.value.showIfEnabled ? form.value.showIfOperator : 'OR',
      showIfQuestionId: form.value.showIfEnabled && form.value.showIfRules.length > 0 && form.value.showIfRules[0].questionId
        ? Number(form.value.showIfRules[0].questionId) : null,
      showIfResponseIndexes: form.value.showIfEnabled && form.value.showIfRules.length > 0
        ? (form.value.showIfRules[0].responseIndexes || []).map(i => Number(i)) : [],
      showIfResponseValue: form.value.showIfEnabled && form.value.showIfRules.length > 0 && form.value.showIfRules[0].responseValue
        ? String(form.value.showIfRules[0].responseValue).trim() : "",
      correctResponseIndexes: form.value.responseType === 'checkbox' ? (form.value.correctResponseIndexes || []).map(i => Number(i)) : [],
    };
    delete payload.showIfEnabled;

    if (editingQuestion.value) {
      const res = await axios.patch(
        `${apiBaseUrl}/questions/${editingQuestion.value.id}`,
        payload,
        header
      );
      const idx = questions.value.findIndex((q) => q.id === editingQuestion.value.id);
      if (idx !== -1) {
        questions.value[idx] = { ...questions.value[idx], ...res.data };
      }
    } else {
      const res = await axios.post(`${apiBaseUrl}/questions`, payload, header);
      questions.value.push(res.data);
    }

    showModal.value = false;
    await fetchQuestions();
  } catch (error) {
    alert("Erreur lors de l'enregistrement");
    console.error(error);
  }
}

async function toggleStatus(q) {
  const header = getHeader();
  if (!header) return;
  try {
    const newStatus = !q.isActive;
    await axios.patch(
      `${apiBaseUrl}/questions/${q.id}`,
      { isActive: newStatus },
      header,
    );
    q.isActive = newStatus;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

async function deleteQuestion(id) {
  const header = getHeader();
  if (!header) return;
  try {
    const checkRes = await axios.get(`${apiBaseUrl}/questions/${id}/is-used`, header);
    
    let confirmMsg = "Êtes-vous sûr de vouloir supprimer cette question ?";
    if (checkRes.data === true) {
      confirmMsg = "Attention : Cette question est utilisée comme condition d'affichage pour d'autres questions. Sa suppression affectera les règles de ces questions. Voulez-vous continuer ?";
    }

    if (!confirm(confirmMsg)) return;

    await axios.delete(`${apiBaseUrl}/questions/${id}`, header);
    const idx = questions.value.findIndex((q) => q.id === id);
    if (idx !== -1) questions.value.splice(idx, 1);
    selectedIds.value.delete(id);
  } catch (error) {
    alert("Erreur lors de la suppression");
    console.error(error);
  }
}

async function bulkToggleStatus(isActive) {
  if (selectedIds.value.size === 0) return;
  const header = getHeader();
  if (!header) return;
  try {
    const ids = Array.from(selectedIds.value);
    await axios.patch(`${apiBaseUrl}/questions/bulk`, {
      ids,
      data: { isActive }
    }, header);
    
    questions.value.forEach(q => {
      if (selectedIds.value.has(q.id)) q.isActive = isActive;
    });
    selectedIds.value.clear();
  } catch (error) {
    console.error("Bulk toggle failed:", error);
    alert("Erreur lors de la mise à jour en lot");
  }
}

async function bulkDelete() {
  if (selectedIds.value.size === 0) return;
  if (!confirm(`Supprimer ces ${selectedIds.value.size} questions ?`)) return;
  const header = getHeader();
  if (!header) return;
  try {
    const ids = Array.from(selectedIds.value);
    await axios.delete(`${apiBaseUrl}/questions/bulk`, {
      data: { ids },
      ...header
    });
    
    questions.value = questions.value.filter(q => !selectedIds.value.has(q.id));
    selectedIds.value.clear();
  } catch (error) {
    console.error("Bulk delete failed:", error);
    alert("Erreur lors de la suppression en lot");
  }
}

function moveOptionInModal(idx, direction) {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= form.value.options.length) return;
  
  const temp = form.value.options[idx];
  form.value.options[idx] = form.value.options[newIdx];
  form.value.options[newIdx] = temp;
  
  if (form.value.correctResponseIndex === idx) {
    form.value.correctResponseIndex = newIdx;
  } else if (form.value.correctResponseIndex === newIdx) {
    form.value.correctResponseIndex = idx;
  }

  if (form.value.responseType === 'checkbox' && form.value.correctResponseIndexes) {
    const hasIdx = form.value.correctResponseIndexes.includes(idx);
    const hasNext = form.value.correctResponseIndexes.includes(newIdx);
    
    let newIndices = form.value.correctResponseIndexes.filter(i => i !== idx && i !== newIdx);
    if (hasIdx) newIndices.push(newIdx);
    if (hasNext) newIndices.push(idx);
    form.value.correctResponseIndexes = newIndices;
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
  fetchWorkflowTypes();
});

function moveQuestion(levelGroup, index, direction) {
  if (!enableOrdering) return;
  const fromQ = levelGroup.questions[index];
  const toQ = levelGroup.questions[index + direction];
  if (!fromQ || !toQ) return;

  const tempOrder = fromQ.order;
  fromQ.order = toQ.order;
  toQ.order = tempOrder;

  if (fromQ.order === toQ.order) {
    fromQ.order = index + 1;
    toQ.order = index + direction + 1;
  }

  questions.value = [...questions.value];
}

async function saveOrder(questionsList) {
  const header = getHeader();
  if (!header) return;
  savingOrder.value = true;
  try {
    const payload = questionsList.map((q, idx) => ({
      id: q.id,
      order: idx + 1
    }));
    await axios.patch(`${apiBaseUrl}/questions/order`, payload, header);
    questionsList.forEach((q, idx) => {
      const idxAll = questions.value.findIndex((x) => x.id === q.id);
      if (idxAll !== -1) questions.value[idxAll].order = idx + 1;
    });
    alert("Ordre mis à jour");
  } catch (error) {
    console.error("Failed to save order", error);
    alert("Erreur lors de la sauvegarde de l'ordre");
  } finally {
    savingOrder.value = false;
  }
}

const types = computed(() => {
  const baseTypes = [{ label: "Tous", value: "" }];
  return baseTypes.concat(
    workflowTypes.value.length > 0
      ? workflowTypes.value
      : [
          { label: "Pré-requis", value: "prerequis" },
          { label: "Mise à niveau", value: "mise-a-niveau" },
          { label: "Positionnement", value: "positionnement" },
          { label: "Complémentaires", value: "complementary" },
          { label: "Disponibilités", value: "availabilities" },
        ]
  );
});
const enableOrdering = true;

const visibleTypes = computed(() => {
  return types.value.filter((t) => {
    if (!t.value) return true; 
    return questions.value.some((q) => (q.type || '').toLowerCase() === String(t.value).toLowerCase());
  });
});

const availableLevels = computed(() => {
  if (!form.value.formationId) return [];
  const selectedFormation = formations.value.find(
    (f) => f.id === form.value.formationId,
  );
  return selectedFormation?.levels || [];
});

function getRuleParentOptions(rule) {
  const pq = questions.value.find((q) => String(q.id) === String(rule.questionId));
  if (!pq || !pq.options || pq.options.length === 0) return [];
  return pq.options.map((o, idx) => ({
    idx,
    label: typeof o === 'string' ? o : o.label,
  }));
}

function getRuleParentType(rule) {
  const pq = questions.value.find((q) => String(q.id) === String(rule.questionId));
  return pq?.responseType || 'qcm';
}

function addShowIfRule() {
  form.value.showIfRules.push({ questionId: "", responseIndexes: [], responseValue: "" });
}

function removeShowIfRule(idx) {
  form.value.showIfRules.splice(idx, 1);
}

const levelFilterOptions = computed(() => {
  const labels = new Set();
  questions.value.forEach((q) => {
    if (formationFilter.value && (!q.formation || q.formation.slug !== formationFilter.value)) return;
    const label = q.level?.label || "Sans niveau";
    labels.add(label);
  });
  return Array.from(labels);
});

const totalFilteredCount = computed(() => {
  const q = (searchTerm.value || "").toLowerCase().trim();
  return questions.value.filter((item) => {
    if (formationFilter.value && (!item.formation || item.formation.slug !== formationFilter.value)) return false;
    const levelLabel = item.level?.label || "Sans niveau";
    if (levelFilter.value && levelLabel !== levelFilter.value) return false;
    if (q && !(item.text || "").toLowerCase().includes(q)) return false;
    return true;
  }).length;
});

const groupedQuestions = computed(() => {
  const map = new Map();
  const q = (searchTerm.value || "").toLowerCase().trim();

  questions.value.forEach((item) => {
    if (formationFilter.value && (!item.formation || item.formation.slug !== formationFilter.value)) return;
    const levelLabel = item.level?.label || "Sans niveau";
    if (levelFilter.value && levelLabel !== levelFilter.value) return;
    if (q && !(item.text || "").toLowerCase().includes(q)) return;

    const formationKey = item.formation?.id || "global";
    const formationLabel = item.formation?.label || "Global";

    if (!map.has(formationKey)) {
      map.set(formationKey, { id: formationKey, label: formationLabel, levels: new Map() });
    }

    const formationGroup = map.get(formationKey);
    const levelKey = item.level?.id || "no-level";

    if (!formationGroup.levels.has(levelKey)) {
      formationGroup.levels.set(levelKey, { id: levelKey, label: levelLabel, questions: [] });
    }

    formationGroup.levels.get(levelKey).questions.push(item);
  });

  return Array.from(map.values()).map((fg) => ({
    id: fg.id,
    label: fg.label,
    levels: Array.from(fg.levels.values()).map((lg) => ({
      ...lg,
      questions: lg.questions.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    })),
  }));
});
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Banque de Questions</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Gérez votre contenu pédagogique et vos quiz de positionnement
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95"
      >
        <span class="material-icons-outlined text-sm">add_circle</span>
        Nouvelle Question
      </button>
    </div>

    <!-- Filters Section -->
    <div class="space-y-4">
      <!-- Row 1: Type Pills -->
      <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          v-for="t in visibleTypes"
          :key="t.value"
          @click="filterType = t.value; fetchQuestions();"
          class="px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          :class="filterType === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Row 2: Selects & Search -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-[200px]">
          <span class="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">school</span>
          <select
            v-model="formationFilter"
            @change="() => { levelFilter = ''; fetchQuestions(); }"
            class="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 focus:border-brand-primary outline-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none transition-all shadow-sm"
          >
            <option value="">Toutes les formations</option>
            <option v-for="f in formations" :key="f.id" :value="f.slug">{{ f.label }}</option>
          </select>
          <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">expand_more</span>
        </div>

        <div class="relative min-w-[150px]">
           <span class="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">layers</span>
           <select
            v-model="levelFilter"
            class="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 focus:border-brand-primary outline-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none transition-all shadow-sm"
          >
            <option value="">Tous niveaux</option>
            <option v-for="lvl in levelFilterOptions" :key="lvl" :value="lvl">{{ lvl }}</option>
          </select>
          <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">expand_more</span>
        </div>

        <div class="relative flex-1 group">
          <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors text-sm">search</span>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="Rechercher une question..."
            class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 focus:border-brand-primary outline-none rounded-xl text-xs font-bold transition-all shadow-sm"
          />
        </div>
        
        <div class="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
          <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {{ totalFilteredCount }} questions
          </span>
        </div>
      </div>
    </div>

    <!-- Questions Grouped List -->
    <div class="space-y-10">
      <div v-if="loading" v-for="i in 2" :key="i" class="space-y-4">
        <div class="h-6 bg-slate-100 rounded-lg w-32 animate-pulse"></div>
        <div class="h-40 bg-white rounded-3xl animate-pulse border border-slate-50"></div>
      </div>

      <div
        v-else
        v-for="fg in groupedQuestions"
        :key="fg.id"
        class="space-y-6"
      >
        <!-- Formation Header -->
        <div class="flex items-center gap-3">
          <div class="h-px bg-slate-200 flex-1"></div>
          <div class="flex items-center gap-2 px-6 py-2 bg-slate-900 rounded-full shadow-lg shadow-slate-900/10">
            <span class="material-icons-outlined text-white/50 text-sm">school</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-white">{{ fg.label }}</span>
          </div>
          <div class="h-px bg-slate-200 flex-1"></div>
        </div>

        <div
          v-for="lg in fg.levels"
          :key="lg.id"
          class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
        >
          <!-- Level Mini-Header -->
          <div class="px-8 py-4 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                :checked="lg.questions.every(q => selectedIds.has(q.id))"
                @change="(e) => {
                  if (e.target.checked) lg.questions.forEach(q => selectedIds.add(q.id));
                  else lg.questions.forEach(q => selectedIds.delete(q.id));
                }"
                class="w-4 h-4 text-slate-900 border-slate-200 rounded focus:ring-0 cursor-pointer"
              >
              <div class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 ml-1">
                {{ lg.label === 'Sans niveau' ? '?' : lg.label[0] }}
              </div>
              <p class="text-xs font-black text-slate-500 uppercase tracking-widest">{{ lg.label }}</p>
              <span class="w-1 h-1 rounded-full bg-slate-300"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ lg.questions.length }} questions</p>
            </div>
            
            <button 
              v-if="enableOrdering"
              @click="saveOrder(lg.questions)"
              :disabled="savingOrder"
              class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <span class="material-icons-outlined text-xs">reorder</span>
              Appliquer l'ordre
            </button>
          </div>

          <!-- Questions List -->
          <div class="divide-y divide-slate-50">
            <div
              v-for="(q, idx) in lg.questions"
              :key="q.id"
              class="p-8 flex items-start gap-8 hover:bg-slate-50/50 transition-all group relative"
            >
              <!-- Checkbox -->
              <div class="pt-1 select-none">
                <input 
                  type="checkbox" 
                  :checked="selectedIds.has(q.id)"
                  @change="toggleSelection(q.id)"
                  class="w-4 h-4 text-slate-900 border-slate-200 rounded focus:ring-0 cursor-pointer"
                >
              </div>

              <!-- Order Controls -->
              <div v-if="enableOrdering" class="flex flex-col gap-1 shrink-0 bg-slate-50 p-1 rounded-lg">
                <button 
                   @click="moveQuestion(lg, idx, -1)" 
                   :disabled="idx === 0"
                   class="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-slate-900 disabled:opacity-20 transition-all"
                >
                  <span class="material-icons-outlined text-sm">expand_less</span>
                </button>
                <div class="text-[9px] font-black text-slate-400 text-center select-none">{{ idx + 1 }}</div>
                <button 
                  @click="moveQuestion(lg, idx, 1)" 
                  :disabled="idx === lg.questions.length - 1"
                  class="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-slate-900 disabled:opacity-20 transition-all"
                >
                  <span class="material-icons-outlined text-sm">expand_more</span>
                </button>
              </div>

              <!-- Icon -->
              <div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-200 transition-transform group-hover:scale-110">
                <span class="material-icons-outlined text-xl">{{ q.icon || "quiz" }}</span>
              </div>

              <!-- Content -->
              <div class="flex-1 space-y-4">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                    {{ q.responseType || 'qcm' }}
                  </span>
                  <span class="px-2.5 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {{ q.type }}
                  </span>
                  <span v-if="q.category" class="px-2.5 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                    {{ q.category }}
                  </span>
                  <span
                    class="ml-auto px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1"
                    :class="q.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'"
                  >
                    <span class="w-1 h-1 rounded-full bg-current"></span>
                    {{ q.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </div>

                <p class="text-base font-black text-slate-900 leading-tight pr-12">
                  {{ q.text }}
                </p>

                <!-- Options -->
                <div v-if="q.responseType !== 'text'" class="flex flex-wrap gap-2">
                  <div
                    v-for="(opt, oIdx) in q.options"
                    :key="oIdx"
                    class="text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 border transition-all"
                    :class="
                      (q.responseType === 'checkbox' ? (q.correctResponseIndexes || []).includes(oIdx) : oIdx === q.correctResponseIndex)
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm'
                        : 'text-slate-400 bg-slate-50 border-slate-100'
                    "
                  >
                    <span v-html="formatBoldText(typeof opt === 'string' ? opt : opt.label)"></span>
                    <span
                      v-if="(q.responseType === 'checkbox' ? (q.correctResponseIndexes || []).includes(oIdx) : oIdx === q.correctResponseIndex)"
                      class="material-icons-outlined text-[12px]"
                    >verified</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button
                  @click="openEditModal(q)"
                  class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all flex items-center justify-center shadow-sm"
                  title="Modifier"
                >
                  <span class="material-icons-outlined text-sm">edit</span>
                </button>
                <button
                  @click="openDuplicateModal(q.id)"
                  class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center shadow-sm"
                  title="Dupliquer vers une autre formation"
                >
                  <span class="material-icons-outlined text-sm">content_copy</span>
                </button>
                <div class="h-8 flex items-center px-1" title="Activer / Désactiver">
                  <label class="relative inline-flex items-center cursor-pointer transform scale-75 origin-right">
                    <input type="checkbox" :checked="q.isActive" @change="toggleStatus(q)" class="sr-only peer" />
                    <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <button
                  @click="deleteQuestion(q.id)"
                  class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center shadow-sm"
                  title="Supprimer"
                >
                  <span class="material-icons-outlined text-sm">delete_outline</span>
                </button>
              </div>
            </div><!-- End Q Loop -->
          </div><!-- End divide-y -->
        </div><!-- End LG Loop -->
      </div><!-- End FG Loop -->

      <!-- Empty state -->
      <div v-if="!loading && questions.length === 0" class="py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-300">
         <span class="material-icons-outlined text-6xl mb-4 opacity-10">quiz</span>
         <p class="text-xs font-black uppercase tracking-widest">Aucune question dans cette catégorie</p>
      </div>
    </div><!-- End space-y-10 -->

    <!-- Bulk Action Bar -->
    <Transition name="slide-up">
      <div v-if="selectedIds.size > 0" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-md">
        <div class="flex items-center gap-3 pr-8 border-r border-white/10">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black">
            {{ selectedIds.size }}
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none">Questions</span>
            <span class="text-[11px] font-black uppercase tracking-tight">Sélectionnées</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button @click="bulkToggleStatus(true)" class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <span class="material-icons-outlined text-sm">visibility</span> Activer
          </button>
          <button @click="bulkToggleStatus(false)" class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <span class="material-icons-outlined text-sm">visibility_off</span> Désactiver
          </button>
          <button @click="openDuplicateModal(Array.from(selectedIds))" class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <span class="material-icons-outlined text-sm">content_copy</span> Dupliquer
          </button>
          <button @click="bulkDelete" class="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <span class="material-icons-outlined text-sm">delete</span> Supprimer
          </button>
        </div>

        <button @click="selectedIds.clear()" class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
          <span class="material-icons-outlined text-sm">close</span>
        </button>
      </div>
    </Transition>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" @click="showModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div>
            <h3 class="text-2xl font-black text-slate-900">{{ editingQuestion ? "Modifier" : "Nouvelle" }} Question</h3>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuration des paramètres pédagogiques</p>
          </div>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-xl transition-all">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <form @submit.prevent="saveQuestion" id="questionForm" class="space-y-8">
            <!-- Text area -->
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Intitulé de la question</label>
              <textarea
                v-model="form.text"
                required
                rows="3"
                placeholder="Écrivez votre question ici..."
                class="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 leading-relaxed shadow-sm"
              ></textarea>
            </div>

            <!-- Basic selection row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type de Workflow</label>
                <select v-model="form.type" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm">
                  <option v-for="wt in workflowTypes" :key="wt.value" :value="wt.value">{{ wt.label }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mode de réponse</label>
                <select v-model="form.responseType" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm">
                  <option value="qcm">Multiple (QCM)</option>
                  <option value="checkbox">Cases à cocher</option>
                  <option value="text">Texte libre (Direct)</option>
                  <option value="dropdown">Liste déroulante</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Formation (Optionnel)</label>
                <select v-model="form.formationId" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm">
                  <option value="">Global (Toutes formations)</option>
                  <option v-for="f in formations" :key="f.id" :value="f.id">{{ f.label }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Niveau</label>
                <select 
                  v-model="form.levelId" 
                  :disabled="!form.formationId"
                  class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm disabled:opacity-30"
                >
                  <option value="">Sélectionner</option>
                  <option v-for="lvl in availableLevels" :key="lvl.id" :value="lvl.id">{{ lvl.label }}</option>
                </select>
              </div>
            </div>

            <!-- Options Management -->
            <div v-if="form.responseType !== 'text'" class="space-y-4">
              <div class="flex items-center justify-between">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Options de réponse</label>
                 <button type="button" @click="addOption" class="text-[9px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1 hover:underline transition-all">
                   <span class="material-icons-outlined text-xs">add</span> Ajouter option
                 </button>
              </div>
              
              <div class="space-y-3">
                <div v-for="(opt, idx) in form.options" :key="idx" class="flex items-center gap-3 animate-slide-in group/opt">
                  <!-- Move Controls -->
                  <div class="flex flex-col gap-1 shrink-0 bg-slate-50 p-1 rounded-lg opacity-0 group-hover/opt:opacity-100 transition-all">
                    <button 
                      type="button"
                      @click="moveOptionInModal(idx, -1)" 
                      :disabled="idx === 0"
                      class="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-900 disabled:opacity-20 transition-all"
                    >
                      <span class="material-icons-outlined text-xs">expand_less</span>
                    </button>
                    <button 
                      type="button"
                      @click="moveOptionInModal(idx, 1)" 
                      :disabled="idx === form.options.length - 1"
                      class="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-slate-900 disabled:opacity-20 transition-all"
                    >
                      <span class="material-icons-outlined text-xs">expand_more</span>
                    </button>
                  </div>

                  <div class="flex-1 relative group">
                    <input
                      v-model="form.options[idx]"
                      required
                      placeholder="Texte de la réponse..."
                      class="w-full pl-5 pr-12 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm shadow-sm"
                    />
                    <button 
                      v-if="form.responseType === 'checkbox'"
                      type="button"
                      @click="() => {
                        if (!form.correctResponseIndexes) form.correctResponseIndexes = [];
                        const iIdx = form.correctResponseIndexes.indexOf(idx);
                        if (iIdx === -1) form.correctResponseIndexes.push(idx);
                        else form.correctResponseIndexes.splice(iIdx, 1);
                      }"
                      class="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      :class="(form.correctResponseIndexes || []).includes(idx) ? 'text-emerald-500' : 'text-slate-300'"
                    >
                      <span class="material-icons-outlined text-lg">{{ (form.correctResponseIndexes || []).includes(idx) ? 'check_box' : 'check_box_outline_blank' }}</span>
                    </button>
                    <button 
                      v-else
                      type="button"
                      @click="form.correctResponseIndex = idx"
                      class="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-emerald-400"
                      :class="form.correctResponseIndex === idx ? 'text-emerald-500' : 'text-slate-300'"
                    >
                      <span class="material-icons-outlined text-lg">{{ form.correctResponseIndex === idx ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
                    </button>
                  </div>
                  <button type="button" @click="removeOption(idx)" class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <span class="material-icons-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button @click="showModal = false" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Annuler</button>
          <button form="questionForm" type="submit" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95">
            {{ editingQuestion ? "Enregistrer les modifications" : "Créer la question" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Duplicate Modal -->
    <div v-if="showDuplicateModal" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" @click="showDuplicateModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-md relative overflow-hidden animate-scale-up">
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-black text-slate-900">Dupliquer</h3>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{{ duplicateIds.length }} question(s) vers une cible</p>
          </div>
          <button @click="showDuplicateModal = false" class="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-xl transition-all">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="p-10 space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Formation cible</label>
            <select v-model="dupFormationId" @change="dupLevelId = ''" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm">
              <option value="">Global (Aucune formation)</option>
              <option v-for="f in formations" :key="f.id" :value="f.id">{{ f.label }}</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Niveau cible</label>
            <select v-model="dupLevelId" :disabled="!dupFormationId" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm disabled:opacity-30">
              <option value="">Aucun niveau</option>
              <option v-for="lvl in dupAvailableLevels" :key="lvl.id" :value="lvl.id">{{ lvl.label }}</option>
            </select>
          </div>
        </div>
        <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3">
          <button @click="showDuplicateModal = false" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Annuler</button>
          <button @click="confirmDuplicate" :disabled="duplicating" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95 disabled:opacity-50">
            {{ duplicating ? 'Duplication...' : 'Dupliquer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}

.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.animate-scale-up {
  animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

select {
  background-image: none;
}
</style>
