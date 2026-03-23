<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";

const formations = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingFormation = ref(null);

// Search & filter state
const searchTerm = ref("");
const categoryFilter = ref("");
const statusFilter = ref("all");

// Parcours Rules State
const activeTab = ref("details"); // 'details', 'levels', or 'rules'
const rules = ref([]);
const rulesLoading = ref(false);
const editingRule = ref(null);
const showRuleForm = ref(false);
const prereqQuestions = ref([]);
const conditionLevel = ref("");
const conditionOperator = ref("=");
const f1Formation = ref("");
const f1Level = ref("");
const f2Formation = ref("");
const f2Level = ref("");
const f1Manual = ref(false);
const f2Manual = ref(false);
const selectedFormationLevels = ref([]);
const isInitializingRuleForm = ref(false);

const newRule = ref({
  formation: "",
  formationId: null,
  condition: "",
  formation1: "",
  formation2: "",
  order: 0,
  requirePrerequisiteFailure: false,
  certification: "",
  prerequisiteConditions: [],
  prerequisiteLogic: "OR",
});

const uniqueCategories = computed(() => {
  const set = new Set();
  for (const f of formations.value) if (f.category) set.add(f.category);
  return Array.from(set).sort();
});

const filteredFormations = computed(() => {
  const q = (searchTerm.value || "").toLowerCase().trim();
  return formations.value.filter((f) => {
    if (statusFilter.value === "active" && !f.isActive) return false;
    if (statusFilter.value === "draft" && f.isActive) return false;
    if (categoryFilter.value && f.category !== categoryFilter.value) return false;
    if (!q) return true;
    return (
      (f.label || "").toLowerCase().includes(q) ||
      (f.slug || "").toLowerCase().includes(q) ||
      (f.category || "").toLowerCase().includes(q)
    );
  }).sort((a, b) => (a.label || "").localeCompare(b.label || ""));
});

const form = ref({
  label: "",
  slug: "",
  category: "",
  icon: "school",
  color: "#3B82F6",
  objectifs: "",
  prequis: "",
  modaliteDuree: "",
  dateEnregistrement: "",
  certificateur: "",
  programme: "",
  isActive: true,
  prerequisQuestionsScope: "both",
  complementaryQuestionsScope: "both",
  availabilitiesQuestionsScope: "both",
  miseANiveauQuestionsScope: "both",
  enableLowScoreWarning: true,
  levels: [],
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = localStorage.getItem("admin_token");

async function fetchFormations() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    formations.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editingFormation.value = null;
  form.value = {
    label: "",
    slug: "",
    category: "",
    icon: "school",
    color: "#3B82F6",
    objectifs: "",
    prequis: "",
    modaliteDuree: "",
    dateEnregistrement: "",
    certificateur: "",
    programme: "",
    isActive: true,
    prerequisQuestionsScope: "both",
    complementaryQuestionsScope: "both",
    availabilitiesQuestionsScope: "both",
    miseANiveauQuestionsScope: "both",
    enableLowScoreWarning: true,
    levels: [],
  };
  showModal.value = true;
}

function addLevel() {
  form.value.levels.push({
    label: "",
    order: form.value.levels.length,
    successThreshold: 0,
  });
}

function moveLevel(index, direction) {
  if (index + direction < 0 || index + direction >= form.value.levels.length) return;
  const temp = form.value.levels[index];
  form.value.levels[index] = form.value.levels[index + direction];
  form.value.levels[index + direction] = temp;
  
  // Update order logic based on array position
  form.value.levels.forEach((lvl, i) => {
    lvl.order = i;
  });
}

function removeLevel(index) {
  form.value.levels.splice(index, 1);
}

function openEditModal(f, tab = 'details') {
  editingFormation.value = f;
  form.value = { ...f, levels: f.levels ? [...f.levels] : [] };
  activeTab.value = tab;
  showModal.value = true;
  fetchRulesForFormation(f.id);
}

async function fetchRulesForFormation(formationId) {
  rulesLoading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/parcours`);
    const formation = formations.value.find(f => f.id === formationId);
    if (formation) {
      rules.value = res.data.filter(r => r.formation === formation.label);
    }
  } catch (error) {
    console.error("Failed to fetch rules:", error);
  } finally {
    rulesLoading.value = false;
  }
}

async function fetchPrereqQuestions() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: { scope: "global" },
      headers: { Authorization: `Bearer ${token}` }
    });
    prereqQuestions.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch prereq questions:", error);
  }
}

async function fetchLevelsForFormation(label) {
  const formation = formations.value.find(f => f.label === label);
  if (!formation) {
    selectedFormationLevels.value = [];
    return;
  }
  try {
    const res = await axios.get(`${apiBaseUrl}/formations/${formation.slug}/levels`);
    selectedFormationLevels.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    selectedFormationLevels.value = [];
  }
}

function openNewRuleForm() {
  editingRule.value = null;
  newRule.value = {
    formation: editingFormation.value?.label || "",
    formationId: editingFormation.value?.id || null,
    condition: "",
    formation1: "",
    formation2: "",
    order: rules.value.length,
    requirePrerequisiteFailure: false,
    certification: "",
    prerequisiteConditions: [],
    prerequisiteLogic: "OR",
  };
  conditionOperator.value = "=";
  f1Formation.value = "";
  f1Level.value = "";
  f2Formation.value = "";
  f2Level.value = "";
  f1Manual.value = false;
  f2Manual.value = false;
  showRuleForm.value = true;
}

async function openEditRuleForm(rule) {
  isInitializingRuleForm.value = true;
  editingRule.value = rule;
  newRule.value = { 
    ...rule,
    requirePrerequisiteFailure: !!rule.requirePrerequisiteFailure,
    certification: rule.certification || "",
    prerequisiteConditions: rule.prerequisiteConditions || [],
    prerequisiteLogic: rule.prerequisiteLogic || "OR"
  };
  
  if (rule.formation) await fetchLevelsForFormation(rule.formation);

  const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (condMatch) {
    conditionOperator.value = condMatch[1].replace('<=', '≤').replace('>=', '≥');
    conditionLevel.value = condMatch[2];
  } else {
    conditionOperator.value = "=";
    conditionLevel.value = rule.condition.replace(/Si résultat du test( =)?( )?/, "").trim();
  }

  const f1 = formations.value.find(f => rule.formation1?.startsWith(f.label));
  if (f1) {
    f1Formation.value = f1.label;
    f1Level.value = rule.formation1.replace(f1.label, "").trim();
    f1Manual.value = false;
  } else if (rule.formation1) {
    f1Formation.value = "";
    f1Level.value = "";
    f1Manual.value = true;
  } else {
    f1Manual.value = false;
  }

  const f2 = formations.value.find(f => rule.formation2?.startsWith(f.label));
  if (f2) {
    f2Formation.value = f2.label;
    f2Level.value = rule.formation2.replace(f2.label, "").trim();
    f2Manual.value = false;
  } else if (rule.formation2) {
    f2Formation.value = "";
    f2Level.value = "";
    f2Manual.value = true;
  } else {
    f2Manual.value = false;
  }

  showRuleForm.value = true;
  setTimeout(() => { isInitializingRuleForm.value = false; }, 100);
}

function togglePrereqQuestion(questionId) {
  const index = newRule.value.prerequisiteConditions.findIndex(c => c.questionId === questionId);
  if (index === -1) {
    newRule.value.prerequisiteConditions.push({ questionId, responseIndexes: [] });
  } else {
    newRule.value.prerequisiteConditions.splice(index, 1);
  }
}

function isPrereqQuestionSelected(questionId) {
  return (newRule.value.prerequisiteConditions || []).some(c => c.questionId === questionId);
}

function togglePrereqOption(questionId, optIndex) {
  const cond = newRule.value.prerequisiteConditions.find(c => c.questionId === questionId);
  if (!cond) return;
  const idx = cond.responseIndexes.indexOf(optIndex);
  if (idx === -1) cond.responseIndexes.push(optIndex);
  else cond.responseIndexes.splice(idx, 1);
}

function isPrereqOptionSelected(questionId, optIndex) {
  const cond = (newRule.value.prerequisiteConditions || []).find(c => c.questionId === questionId);
  return cond ? cond.responseIndexes.includes(optIndex) : false;
}

async function saveRule() {
  try {
    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/parcours/${editingRule.value.id}`, newRule.value);
    } else {
      await axios.post(`${apiBaseUrl}/parcours`, newRule.value);
    }
    showRuleForm.value = false;
    editingRule.value = null;
    await fetchRulesForFormation(editingFormation.value.id);
  } catch (error) {
    console.error("Failed to save rule:", error);
  }
}

async function deleteRule(rule) {
  if (!confirm(`Supprimer cette règle ?`)) return;
  try {
    await axios.delete(`${apiBaseUrl}/parcours/${rule.id}`);
    await fetchRulesForFormation(editingFormation.value.id);
  } catch (error) {
    console.error("Failed to delete rule:", error);
  }
}

async function toggleRuleActive(rule) {
  try {
    const newState = !(rule.isActive !== false);
    await axios.patch(`${apiBaseUrl}/parcours/${rule.id}`, { isActive: newState });
    rule.isActive = newState;
  } catch (error) {
    console.error("Failed to toggle rule:", error);
  }
}

const buildTargetString = (form, level) => {
  if (form && level) return `${form} ${level}`;
  return form || "";
};

watch(() => newRule.value.formation, async (val) => {
  if (val) {
    const matched = formations.value.find(f => f.label === val);
    if (matched) {
      newRule.value.formationId = matched.id;
      await fetchLevelsForFormation(val);
    }
  }
  if (!isInitializingRuleForm.value) {
    conditionLevel.value = "";
    f1Level.value = "";
    f2Level.value = "";
  }
});

watch([conditionLevel, conditionOperator], ([val, op]) => {
  if (val && !isInitializingRuleForm.value) {
    newRule.value.condition = `Si résultat du test ${op} ${val}`;
  }
});

watch([f1Formation, f1Level], ([form, level]) => {
  if (isInitializingRuleForm.value || f1Manual.value) return;
  if (form === "Parcours Libre") f1Level.value = "";
  newRule.value.formation1 = buildTargetString(form, level);
  if (form) fetchLevelsForFormation(form);
});

watch([f2Formation, f2Level], ([form, level]) => {
  if (isInitializingRuleForm.value || f2Manual.value) return;
  if (form === "Parcours Libre") f2Level.value = "";
  newRule.value.formation2 = buildTargetString(form, level);
  if (form) fetchLevelsForFormation(form);
});

async function saveFormation() {
  try {
    if (!form.value.slug) {
      form.value.slug = form.value.label
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
    }

    const sanitizedLevels = (form.value.levels || []).map((lvl, index) => {
      return {
        ...(lvl.id ? { id: lvl.id } : {}),
        label: lvl.label,
        order:
          typeof lvl.order === "number" && !isNaN(lvl.order)
            ? lvl.order
            : index + 1,
        successThreshold: Number(lvl.successThreshold) || 0,
      };
    });

    const payload = { ...form.value, levels: sanitizedLevels };
    delete payload.questions;

    if (editingFormation.value) {
      await axios.patch(
        `${apiBaseUrl}/formations/${editingFormation.value.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } else {
      await axios.post(`${apiBaseUrl}/formations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    showModal.value = false;
    await fetchFormations();
  } catch (error) {
    alert("Erreur lors de l'enregistrement. Vérifiez que le slug est unique.");
    console.error(error);
  }
}

async function deleteFormation(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/formations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchFormations();
  } catch (error) {
    alert("Erreur lors de la suppression");
    console.error(error);
  }
}

async function toggleStatus(formation) {
  try {
    const newStatus = !formation.isActive;
    await axios.patch(
      `${apiBaseUrl}/formations/${formation.id}`,
      { isActive: newStatus },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    formation.isActive = newStatus;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

async function toggleLowScoreWarning(formation) {
  try {
    const newValue = !formation.enableLowScoreWarning;
    await axios.patch(
      `${apiBaseUrl}/formations/${formation.id}`,
      { enableLowScoreWarning: newValue },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    formation.enableLowScoreWarning = newValue;
  } catch (error) {
    console.error("Failed to update warning status:", error);
  }
}

onMounted(() => {
  fetchFormations();
  fetchPrereqQuestions();
});
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Catalogue de Formations</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Gérez vos programmes, paliers de compétences et parcours automatisés
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95"
      >
        <span class="material-icons-outlined text-sm">add_circle</span>
        Nouvelle Formation
      </button>
    </div>

    <!-- Toolbar -->
    <div class="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
      <div class="relative flex-1 group">
        <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors text-sm">search</span>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Rechercher par titre, catégorie ou slug..."
          class="w-full pl-11 pr-6 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none rounded-xl text-xs font-bold transition-all shadow-inner"
        />
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-[180px]">
          <span class="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">category</span>
          <select
            v-model="categoryFilter"
            class="w-full pl-10 pr-8 py-2.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none transition-all cursor-pointer"
          >
            <option value="">Toutes catégories</option>
            <option v-for="cat in uniqueCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">expand_more</span>
        </div>

        <div class="relative min-w-[150px]">
          <span class="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">toggle_on</span>
          <select
            v-model="statusFilter"
            class="w-full pl-10 pr-8 py-2.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary outline-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none transition-all cursor-pointer"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actives</option>
            <option value="draft">Brouillons</option>
          </select>
          <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">expand_more</span>
        </div>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="loading" v-for="i in 3" :key="i" class="h-64 bg-slate-50 rounded-[32px] animate-pulse"></div>

      <div
        v-else-if="filteredFormations.length === 0"
        class="col-span-full py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-300"
      >
        <span class="material-icons-outlined text-6xl mb-4 opacity-10">school</span>
        <p class="text-xs font-black uppercase tracking-widest">Aucune formation trouvée</p>
      </div>

      <div
        v-else
        v-for="f in filteredFormations"
        :key="f.id"
        class="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative"
      >
        <!-- Icon & Status -->
        <div class="flex items-start justify-between mb-6">
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
            :style="{ backgroundColor: f.color + '15', color: f.color }"
          >
            <span class="material-icons-outlined text-2xl font-bold">{{ f.icon || "school" }}</span>
          </div>
          <div class="flex flex-col items-end gap-2">
            <button
              @click.stop="toggleStatus(f)"
              class="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 border"
              :class="f.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'"
              :title="f.isActive ? 'Désactiver la formation' : 'Activer la formation'"
            >
              <span class="w-1 h-1 rounded-full bg-current"></span>
              {{ f.isActive ? "En ligne" : "Brouillon" }}
            </button>
            <button
              @click.stop="toggleLowScoreWarning(f)"
              class="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border transition-all hover:scale-105 active:scale-95 shadow-sm"
              :class="f.enableLowScoreWarning ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-300 bg-slate-50 border-slate-100'"
              :title="f.enableLowScoreWarning ? 'Désactiver l\'alerte' : 'Activer l\'alerte'"
            >
               <span class="material-icons-outlined text-[10px]">{{ f.enableLowScoreWarning ? 'warning' : 'notifications_off' }}</span>
               Alerte
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="space-y-4">
          <div class="space-y-1">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ f.category || 'Non classée' }}</p>
            <h3 class="text-xl font-black text-slate-900 leading-tight group-hover:text-brand-primary transition-colors">
              {{ f.label }}
            </h3>
          </div>
          
          <div class="flex items-center gap-4 text-slate-400">
            <div class="flex items-center gap-1">
              <span class="material-icons-outlined text-sm">layers</span>
              <span class="text-[10px] font-black uppercase tracking-widest">{{ f.levels?.length || 0 }} paliers</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-icons-outlined text-sm">route</span>
              <span class="text-[10px] font-black uppercase tracking-widest">Parcours actif</span>
            </div>
          </div>
        </div>

        <!-- Hover Actions -->
        <div class="mt-8 flex items-center gap-2">
           <button
            @click="openEditModal(f, 'details')"
            class="flex-1 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
          >
            Modifier
          </button>
          <button
            @click="openEditModal(f, 'rules')"
            class="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-sm"
            title="Règles de parcours"
          >
            <span class="material-icons-outlined text-[18px]">route</span>
          </button>
          <button
            @click="deleteFormation(f.id)"
            class="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <span class="material-icons-outlined text-[18px]">delete_outline</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form (Premium Refinement) -->
    <div v-if="showModal && form" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" @click="showModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl relative overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        
        <!-- Modal Header -->
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl" :style="{ backgroundColor: form.color || '#000' }">
              <span class="material-icons-outlined text-2xl">{{ form.icon || 'school' }}</span>
            </div>
            <div class="space-y-1">
              <h3 class="text-2xl font-black text-slate-900">
                {{ editingFormation ? "Paramètres Formation" : "Nouvelle Formation" }}
              </h3>
              <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                {{ activeTab === 'details' ? 'Informations Catalogue' : activeTab === 'levels' ? 'Paliers & Seuils' : 'Logique de Navigation' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
             <button
              @click="saveFormation"
              class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95"
            >
              Enregistrer
            </button>
            <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 transition-colors p-3 bg-slate-50 rounded-2xl">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        <div class="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 scroll-smooth">
          <!-- Tab Bar -->
          <div class="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
            <button
              v-for="tab in [{id:'details', label:'Général', icon:'info'}, {id:'levels', label:'Paliers', icon:'layers'}, {id:'rules', label:'Parcours', icon:'route'}]"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              :class="activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
            >
              <span class="material-icons-outlined text-sm">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab: Details -->
          <div v-show="activeTab === 'details'" class="animate-fade-in space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Titre du Programme</label>
                <input v-model="form.label" required placeholder="ex: English Business Certificate" class="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 shadow-inner" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identifiant Unique (Slug)</label>
                <input v-model="form.slug" placeholder="ex: business-english" class="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Catégorie</label>
                <input v-model="form.category" placeholder="ex: Langues" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl outline-none font-bold text-xs" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Icone (Material)</label>
                <input v-model="form.icon" placeholder="ex: translate" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl outline-none font-bold text-xs" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Couleur</label>
                <div class="flex gap-2">
                  <input v-model="form.color" class="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl font-bold text-xs uppercase" />
                  <input type="color" v-model="form.color" class="w-10 h-10 rounded-lg border-none cursor-pointer shrink-0" />
                </div>
              </div>
              <div class="space-y-3">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Paramètres d'Affichage</label>
                 <div class="flex flex-col gap-3 pt-1">
                   <div class="flex items-center justify-between group/toggle">
                     <span class="text-[9px] font-black text-slate-500 uppercase">Formation Active</span>
                     <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="form.isActive" class="sr-only peer">
                        <div class="w-11 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                     </label>
                   </div>
                   <div class="flex items-center justify-between group/toggle">
                     <span class="text-[9px] font-black text-slate-500 uppercase">Alerte Score Faible</span>
                     <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="form.enableLowScoreWarning" class="sr-only peer">
                        <div class="w-11 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                     </label>
                   </div>
                 </div>
              </div>
            </div>

            <!-- Scopes Selection Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prérequis • Source</label>
                <div class="relative">
                  <select v-model="form.prerequisQuestionsScope" class="w-full pl-5 pr-8 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer">
                    <option value="both">Global & Formation</option>
                    <option value="global">Global Uniquement</option>
                    <option value="formation">Formation Uniquement</option>
                  </select>
                  <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[14px] pointer-events-none">expand_more</span>
                </div>
              </div>
              
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Complément • Source</label>
                <div class="relative">
                  <select v-model="form.complementaryQuestionsScope" class="w-full pl-5 pr-8 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer">
                    <option value="both">Global & Formation</option>
                    <option value="global">Global Uniquement</option>
                    <option value="formation">Formation Uniquement</option>
                  </select>
                  <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[14px] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dispo • Source</label>
                <div class="relative">
                  <select v-model="form.availabilitiesQuestionsScope" class="w-full pl-5 pr-8 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer">
                    <option value="both">Global & Formation</option>
                    <option value="global">Global Uniquement</option>
                    <option value="formation">Formation Uniquement</option>
                  </select>
                  <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[14px] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MÀN • Source</label>
                <div class="relative">
                  <select v-model="form.miseANiveauQuestionsScope" class="w-full pl-5 pr-8 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl outline-none font-bold text-[10px] uppercase tracking-widest appearance-none transition-all cursor-pointer">
                    <option value="both">Global & Formation</option>
                    <option value="global">Global Uniquement</option>
                    <option value="formation">Formation Uniquement</option>
                  </select>
                  <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[14px] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Objectifs Pédagogiques</label>
                <textarea v-model="form.objectifs" rows="4" placeholder="Décrivez les résultats attendus..." class="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 shadow-inner scrollbar-hide"></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descriptif Programme</label>
                <textarea v-model="form.programme" rows="4" placeholder="Détaillez le contenu..." class="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 shadow-inner scrollbar-hide"></textarea>
              </div>
            </div>
          </div>

          <!-- Tab: Levels -->
          <div v-show="activeTab === 'levels'" class="animate-fade-in space-y-8">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-black text-slate-900 uppercase tracking-widest">Paliers de progression</h4>
              <button type="button" @click="addLevel" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 flex items-center gap-1.5 transition-all">
                <span class="material-icons-outlined text-xs">add</span> Ajouter un Niveau
              </button>
            </div>
            
            <div class="space-y-4">
              <div
                v-for="(lvl, idx) in form.levels"
                :key="idx"
                class="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-end gap-6 relative group animate-slide-in"
              >
                <div class="flex-1 space-y-2 w-full">
                  <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nom du Niveau</label>
                  <input v-model="lvl.label" placeholder="ex: Niveau A1" class="w-full px-5 py-3 bg-white border border-slate-200 focus:border-brand-primary rounded-xl outline-none font-bold text-sm" />
                </div>
                <div class="w-full md:w-32 space-y-2">
                  <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Seuil Réussite</label>
                  <div class="relative">
                    <input type="number" v-model.number="lvl.successThreshold" min="0" max="100" class="w-full pl-5 pr-10 py-3 bg-white border border-slate-200 focus:border-brand-primary rounded-xl outline-none font-bold text-sm" />
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1 mb-0.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                  <button type="button" @click="moveLevel(idx, -1)" :disabled="idx === 0" class="w-7 h-5 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors">
                    <span class="material-icons-outlined text-[14px]">expand_less</span>
                  </button>
                  <button type="button" @click="moveLevel(idx, 1)" :disabled="idx === form.levels.length - 1" class="w-7 h-5 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors">
                    <span class="material-icons-outlined text-[14px]">expand_more</span>
                  </button>
                </div>
                <button type="button" @click="removeLevel(idx)" class="w-11 h-11 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all mb-0.5 shrink-0">
                  <span class="material-icons-outlined text-[20px]">delete_outline</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Rules (Complex View) -->
          <div v-show="activeTab === 'rules'" class="animate-fade-in space-y-8">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black text-slate-900 uppercase tracking-widest">Règles de Direction</h4>
              <button v-if="!showRuleForm" @click="openNewRuleForm" class="px-5 py-2.5 bg-brand-primary text-[#428496] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:brightness-105 transition-all flex items-center gap-2">
                <span class="material-icons-outlined text-sm">add_road</span> Nouvelle Règle
              </button>
            </div>

            <!-- Rule List -->
            <div v-if="!showRuleForm" class="space-y-4">
              <div v-if="rulesLoading" class="py-12 flex justify-center"><div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-brand-primary animate-spin"></div></div>
              <div v-else-if="rules.length === 0" class="py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center">
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune règle définie pour cette formation</p>
              </div>
              <div v-for="rule in rules.sort((a,b) => (a.order||0) - (b.order||0))" :key="rule.id" class="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group">
                <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 font-black text-xs">{{ rule.order + 1 }}</div>
                <div class="flex-1 space-y-1">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition : {{ rule.condition }}</p>
                  <p class="text-xs font-black text-slate-900 leading-tight">
                    Cible : <span class="text-slate-400">{{ rule.formation1 }}</span> 
                    <span v-if="rule.formation2" class="mx-2 text-slate-300">ou</span> 
                    <span v-if="rule.formation2" class="text-slate-400">{{ rule.formation2 }}</span>
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="toggleRuleActive(rule)" class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all" :class="rule.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
                    {{ rule.isActive !== false ? 'Active' : 'Désactivée' }}
                  </button>
                  <button @click="openEditRuleForm(rule)" class="w-9 h-9 rounded-lg border border-slate-100 text-slate-400 hover:text-brand-primary hover:border-brand-primary transition-all flex items-center justify-center"><span class="material-icons-outlined text-sm">edit</span></button>
                  <button @click="deleteRule(rule)" class="w-9 h-9 rounded-lg border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center"><span class="material-icons-outlined text-sm">delete_outline</span></button>
                </div>
              </div>
            </div>

            <!-- Rule Form -->
            <div v-else class="bg-slate-50 p-10 rounded-[40px] border border-slate-100 space-y-10 animate-scale-up">
              <div class="flex items-center justify-between mb-4">
                <h5 class="text-sm font-black text-slate-900 uppercase tracking-widest">{{ editingRule ? 'Modifier' : 'Créer' }} la règle</h5>
                <button @click="showRuleForm = false" class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Retour à la liste</button>
              </div>

              <!-- Prerequisite Failure Option -->
              <div class="p-6 bg-white rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h6 class="text-xs font-black text-slate-900 uppercase tracking-widest">Échec des Pré-requis</h6>
                  <p class="text-[10px] font-bold text-slate-400 mt-1">Appliquer cette règle seulement si le score pré-requis est insuffisant</p>
                </div>
                <label class="cursor-pointer relative inline-flex items-center">
                  <input type="checkbox" v-model="newRule.requirePrerequisiteFailure" class="sr-only peer" />
                  <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                </label>
              </div>

              <!-- Main Condition (Score) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div class="space-y-3">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Condition Score Global</label>
                  <div class="flex items-center gap-2">
                    <select v-model="conditionOperator" class="w-20 px-3 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-brand-primary">
                      <option value="=">=</option>
                      <option value="<">&lt;</option>
                      <option value="≤">≤</option>
                      <option value=">">&gt;</option>
                      <option value="≥">≥</option>
                    </select>
                    <input v-model="conditionLevel" placeholder="ex: 80%" class="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-brand-primary" />
                  </div>
                </div>
                <div class="space-y-3">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Certification Cible</label>
                  <input v-model="newRule.certification" placeholder="ex: RNCP / RS" class="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>

              <!-- Target Redirection -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="p-6 bg-white rounded-3xl border border-slate-100 space-y-5">
                   <h6 class="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <span class="w-2 h-2 rounded-full bg-brand-primary"></span> Cible Principale
                     <button type="button" @click="f1Manual = !f1Manual" class="ml-auto text-slate-300 hover:text-brand-primary transition-all p-1" :title="f1Manual ? 'Passer en sélection assistée' : 'Passer en édition libre'">
                       <span class="material-icons-outlined text-[14px]">{{ f1Manual ? 'settings_suggest' : 'edit_note' }}</span>
                     </button>
                   </h6>
                   <div v-if="!f1Manual" class="space-y-4">
                     <div>
                       <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Formation</label>
                        <select v-model="f1Formation" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black shadow-inner">
                          <option value="">Sélectionner</option>
                          <option value="Parcours Libre">Parcours Libre</option>
                          <option v-for="f in formations" :key="f.id" :value="f.label">{{ f.label }}</option>
                        </select>
                     </div>
                     <div>
                       <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Niveau</label>
                        <select v-model="f1Level" :disabled="!f1Formation || f1Formation === 'Parcours Libre'" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black shadow-inner disabled:opacity-30">
                         <option value="">Sélectionner</option>
                         <option v-for="lv in selectedFormationLevels" :key="lv.id" :value="lv.label">{{ lv.label }}</option>
                       </select>
                     </div>
                   </div>
                   <div v-else class="space-y-4">
                     <div>
                       <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Libellé du parcours (Manuel)</label>
                       <input v-model="newRule.formation1" placeholder="ex: Parcours principal" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black shadow-inner outline-none focus:ring-1 focus:ring-brand-primary" />
                     </div>
                   </div>
                </div>

                <div class="p-6 bg-white rounded-3xl border border-slate-100 space-y-5">
                   <h6 class="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <span class="w-2 h-2 rounded-full bg-slate-300"></span> Cible Secondaire (Optionnelle)
                     <button type="button" @click="f2Manual = !f2Manual" class="ml-auto text-slate-300 hover:text-brand-primary transition-all p-1" :title="f2Manual ? 'Passer en sélection assistée' : 'Passer en édition libre'">
                       <span class="material-icons-outlined text-[14px]">{{ f2Manual ? 'settings_suggest' : 'edit_note' }}</span>
                     </button>
                   </h6>
                   <div v-if="!f2Manual" class="space-y-4">
                     <div>
                       <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Formation</label>
                        <select v-model="f2Formation" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black shadow-inner">
                          <option value="">Aucune</option>
                          <option value="Parcours Libre">Parcours Libre</option>
                          <option v-for="f in formations" :key="f.id" :value="f.label">{{ f.label }}</option>
                        </select>
                     </div>
                     <div>
                       <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Niveau</label>
                        <select v-model="f2Level" :disabled="!f2Formation || f2Formation === 'Parcours Libre'" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black shadow-inner disabled:opacity-30">
                         <option value="">Sélectionner</option>
                         <option v-for="lv in selectedFormationLevels" :key="lv.id" :value="lv.label">{{ lv.label }}</option>
                       </select>
                     </div>
                   </div>
                   <div v-else class="space-y-4">
                     <div>
                       <label class="text-[9px] font-bold text-slate-400 uppercase block mb-1">Libellé du parcours (Manuel)</label>
                       <input v-model="newRule.formation2" placeholder="ex: Parcours alternative" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black shadow-inner outline-none focus:ring-1 focus:ring-brand-primary" />
                     </div>
                   </div>
                </div>
              </div>

              <!-- Detailed Prerequisite Conditions -->
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <h6 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Conditions sur les Pré-requis</h6>
                  <div class="flex p-1 bg-white border border-slate-100 rounded-lg">
                    <button type="button" @click="newRule.prerequisiteLogic = 'OR'" class="px-3 py-1 rounded text-[9px] font-black transition-all" :class="newRule.prerequisiteLogic === 'OR' ? 'bg-brand-primary text-[#428496]' : 'text-slate-400'">OU</button>
                    <button type="button" @click="newRule.prerequisiteLogic = 'AND'" class="px-3 py-1 rounded text-[9px] font-black transition-all" :class="newRule.prerequisiteLogic === 'AND' ? 'bg-brand-primary text-[#428496]' : 'text-slate-400'">ET</button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="q in prereqQuestions"
                    :key="q.id"
                    class="p-5 bg-white rounded-[28px] border-2 transition-all cursor-pointer"
                    :class="isPrereqQuestionSelected(q.id) ? 'border-brand-primary shadow-lg shadow-brand-primary/10' : 'border-slate-50 hover:border-slate-200'"
                    @click="togglePrereqQuestion(q.id)"
                  >
                    <div class="flex items-start gap-4">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors" :class="isPrereqQuestionSelected(q.id) ? 'bg-brand-primary text-white' : 'bg-slate-50 text-slate-300'">
                        <span class="material-icons-outlined text-sm">check</span>
                      </div>
                      <div class="space-y-4 flex-1">
                        <p class="text-[11px] font-black text-slate-800 leading-tight">{{ q.text }}</p>
                        
                        <!-- Options Drilldown -->
                        <div v-if="isPrereqQuestionSelected(q.id)" class="flex flex-wrap gap-2 pt-2 animate-fade-in" @click.stop>
                          <button
                            v-for="(opt, oIdx) in (q.options || [])"
                            :key="oIdx"
                            type="button"
                            @click="togglePrereqOption(q.id, oIdx)"
                            class="px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all"
                            :class="isPrereqOptionSelected(q.id, oIdx) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'"
                          >
                            {{ typeof opt === 'string' ? opt : opt.label }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4">
                <button type="button" @click="showRuleForm = false" class="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">Annuler</button>
                <button type="button" @click="saveRule" class="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:brightness-110 active:scale-95 transition-all">Valider la règle</button>
              </div>
            </div>
          </div>
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
