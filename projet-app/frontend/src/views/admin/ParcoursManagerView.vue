<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";

const rules = ref([]);
const formationsList = ref([]);
const loading = ref(true);
const activeFormationId = ref(null);
const searchTerm = ref("");
const selectedCategory = ref("all");
const editingRule = ref(null);
const showForm = ref(false);
const activeTab = ref("details"); // 'details' or 'rules'

// Local state for formation settings
const formationForm = ref({
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
  prerequisQuestionsScope: "global",
  complementaryQuestionsScope: "global",
  availabilitiesQuestionsScope: "global",
  miseANiveauQuestionsScope: "global",
  levels: [],
});

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

// Dynamic helpers for form building
const selectedFormationLevels = ref([]);
const prereqQuestions = ref([]); // List of all prerequisite questions for selection
const conditionLevel = ref("");
const conditionOperator = ref("=");
const f1Formation = ref("");
const f1Level = ref("");
const f2Formation = ref("");
const f2Level = ref("");

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const categories = computed(() => {
  const cats = new Set(formationsList.value.map(f => f.category).filter(Boolean));
  return Array.from(cats).sort();
});

const filteredFormationsDropdown = computed(() => {
  if (selectedCategory.value === "all") return formationsList.value;
  return formationsList.value.filter(f => f.category === selectedCategory.value);
});

const currentFormation = computed(() => {
  return formationsList.value.find(f => f.id === activeFormationId.value) || null;
});

const filteredRules = computed(() => {
  if (!currentFormation.value) return [];
  return rules.value.filter((r) => {
    const matchesFormation = r.formation === currentFormation.value.label;
    const q = searchTerm.value.toLowerCase().trim();
    const matchesSearch = !q || 
      (r.condition || "").toLowerCase().includes(q) || 
      (r.formation1 || "").toLowerCase().includes(q) || 
      (r.formation2 || "").toLowerCase().includes(q);
    
    return matchesFormation && matchesSearch;
  });
});

async function fetchRules() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/parcours`);
    rules.value = res.data;
  } catch (error) {
    console.error("Failed to fetch parcours rules:", error);
  } finally {
    loading.value = false;
  }
}

function selectFormation(f) {
  activeFormationId.value = f.id;
  formationForm.value = { ...f, levels: f.levels ? [...f.levels] : [] };
}

function openNewForm() {
  editingRule.value = null;
  newRule.value = {
    formation: currentFormation.value?.label || "",
    formationId: currentFormation.value?.id || null,
    condition: "",
    formation1: "",
    formation2: "",
    order: filteredRules.value.length,
    requirePrerequisiteFailure: false,
    certification: "",
    prerequisiteConditions: [],
    prerequisiteLogic: "OR",
  };
  conditionOperator.value = "=";
  showForm.value = true;
}

// Flag to prevent watches from resetting values during modal initialization
let isInitializingForm = false;

async function openEditForm(rule) {
  isInitializingForm = true;
  editingRule.value = rule;
  newRule.value = { 
    ...rule,
    requirePrerequisiteFailure: !!rule.requirePrerequisiteFailure,
    certification: rule.certification || "",
    prerequisiteConditions: rule.prerequisiteConditions || [],
    prerequisiteLogic: rule.prerequisiteLogic || "OR"
  };
  
  // Fetch levels first so dropdowns are populated and enabled
  if (rule.formation) {
    await fetchLevelsForFormation(rule.formation);
  }

  // Parse condition
  const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (condMatch) {
    conditionOperator.value = condMatch[1].replace('<=', '≤').replace('>=', '≥');
    conditionLevel.value = condMatch[2];
  } else {
    conditionOperator.value = "=";
    conditionLevel.value = rule.condition.replace(/Si résultat du test( =)?( )?/, "").trim(); // Fallback for old rules
  }

  // Parse formation 1
  const f1 = formationsList.value.find(f => rule.formation1?.startsWith(f.label));
  if (f1) {
    f1Formation.value = f1.label;
    f1Level.value = rule.formation1.replace(f1.label, "").trim();
  } else {
    f1Formation.value = "";
    f1Level.value = "";
  }

  // Parse formation 2
  const f2 = formationsList.value.find(f => rule.formation2?.startsWith(f.label));
  if (f2) {
    f2Formation.value = f2.label;
    f2Level.value = rule.formation2.replace(f2.label, "").trim();
  } else {
    f2Formation.value = "";
    f2Level.value = "";
  }

  showForm.value = true;
  // Small delay to ensure DOM updates before clearing flag if needed, 
  // but here we can just do it after.
  setTimeout(() => { isInitializingForm = false; }, 100);
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
  if (idx === -1) {
    cond.responseIndexes.push(optIndex);
  } else {
    cond.responseIndexes.splice(idx, 1);
  }
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
    showForm.value = false;
    editingRule.value = null;
    await fetchRules();
  } catch (error) {
    console.error("Failed to save rule:", error);
    alert("Erreur lors de la sauvegarde.");
  }
}

async function deleteRule(rule) {
  if (!confirm(`Supprimer cette règle de parcours ?`)) return;
  try {
    await axios.delete(`${apiBaseUrl}/parcours/${rule.id}`);
    await fetchRules();
  } catch (error) {
    console.error("Failed to delete rule:", error);
    alert("Erreur lors de la suppression.");
  }
}

async function toggleRuleActive(rule) {
  try {
    const newState = !(rule.isActive !== false);
    await axios.patch(`${apiBaseUrl}/parcours/${rule.id}`, { isActive: newState });
    rule.isActive = newState;
  } catch (error) {
    console.error("Failed to toggle rule:", error);
    alert("Erreur lors de la mise à jour.");
  }
}

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`);
    formationsList.value = res.data;
    if (formationsList.value.length > 0 && !activeFormationId.value) {
      selectFormation(formationsList.value[0]);
    }
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  }
}

async function saveFormationSettings() {
  try {
    const payload = { ...formationForm.value };
    delete payload.questions;
    
    await axios.patch(`${apiBaseUrl}/formations/${activeFormationId.value}`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
    });
    await fetchFormations();
    alert("Paramètres enregistrés.");
  } catch (error) {
    console.error("Failed to save formation settings:", error);
  }
}

async function fetchLevelsForFormation(label) {
  const formation = formationsList.value.find(f => f.label === label);
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

// Questions management
async function fetchPrereqQuestions() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: { scope: "global" },
    });
    console.log("Prereq questions fetched:", res.data);
    prereqQuestions.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch prereq questions:", error);
  }
}

function addFormationLevel() {
  formationForm.value.levels.push({
    label: "",
    order: formationForm.value.levels.length,
    successThreshold: 0,
    isActive: true,
  });
}

function removeFormationLevel(index) {
  formationForm.value.levels.splice(index, 1);
}

// Watch the formation field to auto-fetch levels
watch(() => newRule.value.formation, async (val) => {
  if (val) {
    const matched = formationsList.value.find(f => f.label === val);
    if (matched) {
      newRule.value.formationId = matched.id;
      await fetchLevelsForFormation(val);
    }
  } else {
    newRule.value.formationId = null;
    selectedFormationLevels.value = [];
  }
  // Reset dependent fields ONLY if we are not initializing the form (editing)
  if (!isInitializingForm) {
    conditionLevel.value = "";
    f1Level.value = "";
    f2Level.value = "";
  }
});

// Auto-build condition string when conditionLevel or conditionOperator changes
watch([conditionLevel, conditionOperator], ([val, op]) => {
  if (val && !isInitializingForm) {
    newRule.value.condition = `Si résultat du test ${op} ${val}`;
  }
});

// Helper to build formation string (Formation + Level)
const buildTargetString = (form, level) => {
  if (form && level) return `${form} ${level}`;
  return form || "";
};

// Auto-build formation1 string
watch([f1Formation, f1Level], ([form, level]) => {
  if (isInitializingForm) return;
  newRule.value.formation1 = buildTargetString(form, level);
  
  // If formation matches a known one, fetch its levels
  if (form) {
    const matched = formationsList.value.find(f => f.label === form);
    if (matched) fetchLevelsForFormation(form);
  }
});

// Auto-build formation2 string
watch([f2Formation, f2Level], ([form, level]) => {
  if (isInitializingForm) return;
  newRule.value.formation2 = buildTargetString(form, level);
  
  // If formation matches a known one, fetch its levels
  if (form) {
    const matched = formationsList.value.find(f => f.label === form);
    if (matched) fetchLevelsForFormation(form);
  }
});

// Watch category to auto-select first formation
watch(selectedCategory, (newCat) => {
  if (filteredFormationsDropdown.value.length > 0) {
    const alreadyVisible = filteredFormationsDropdown.value.find(f => f.id === activeFormationId.value);
    if (!alreadyVisible) {
      selectFormation(filteredFormationsDropdown.value[0]);
    }
  }
});

onMounted(async () => {
  await Promise.all([fetchFormations(), fetchRules(), fetchPrereqQuestions()]);
});
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl md:text-3xl font-black heading-primary uppercase tracking-tight">Gestion du Catalogue</h2>
        <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Fiche formation & Règles de parcours associées
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <!-- Category Filter -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Catégorie</span>
          <select 
            v-model="selectedCategory"
            class="w-full sm:w-auto px-4 py-3 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            <option value="all">Toutes</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Formation Selector -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Formation</span>
          <select 
            v-model="activeFormationId"
            @change="(e) => selectFormation(formationsList.find(f => f.id === Number(e.target.value)))"
            class="w-full sm:w-[250px] px-4 py-3 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            <option v-for="form in filteredFormationsDropdown" :key="form.id" :value="form.id">{{ form.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="w-full">
      <!-- Content Area/Details -->
      <div v-if="currentFormation" class="w-full space-y-8">
        <!-- Tab Bar -->
        <div class="flex items-center gap-2 bg-white p-2 rounded-[32px] shadow-sm border border-gray-50 w-full sm:w-fit">
          <button
            @click="activeTab = 'details'"
            class="flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all"
            :class="activeTab === 'details' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50 font-bold'"
          >
            Paramètres Fiche
          </button>
          <button
            @click="activeTab = 'rules'"
            class="flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all"
            :class="activeTab === 'rules' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50 font-bold'"
          >
            Règles Parcours
          </button>
        </div>

        <!-- Details Tab Content -->
        <div v-if="activeTab === 'details'" class="animate-fade-in">
          <div class="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
            <div class="p-6 sm:p-10 space-y-8 sm:space-y-10">
               <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                    :style="{ backgroundColor: formationForm.color + '20', color: formationForm.color }">
                    <span class="material-icons-outlined text-2xl">settings</span>
                  </div>
                  <div>
                    <h3 class="text-xl font-black heading-primary uppercase tracking-tight">Configuration de la Fiche</h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Éditez les infos catalogue pour {{ formationForm.label }}</p>
                  </div>
                </div>
                <button @click="saveFormationSettings" class="w-full sm:w-auto px-6 py-3 bg-brand-primary text-[#428496] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                  Sauvegarder Fiche
                </button>
               </div>

               <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Titre Catalogue</label>
                    <input v-model="formationForm.label" class="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Catégorie</label>
                    <input v-model="formationForm.category" class="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all" />
                  </div>
                   <div class="sm:col-span-2 md:col-span-1 space-y-2">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Couleur & Icône</label>
                    <div class="flex gap-3">
                      <input type="color" v-model="formationForm.color" class="w-12 h-12 rounded-xl border-none cursor-pointer shrink-0" />
                      <input v-model="formationForm.icon" class="flex-1 px-5 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="Icône Material" />
                    </div>
                  </div>
               </div>

               <!-- Levels in Details Tab -->
               <div class="space-y-6 pt-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-black uppercase tracking-widest text-gray-700">Paliers de Compétence</h4>
                    <button @click="addFormationLevel" class="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl transition-all hover:bg-brand-primary hover:text-white">Ajouter niveau</button>
                  </div>
                  <div class="grid grid-cols-1 gap-4">
                    <div v-for="(lvl, idx) in formationForm.levels" :key="idx" class="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-6 sm:p-4 rounded-3xl border border-gray-100 group transition-all relative" :class="!lvl.isActive ? 'opacity-50 grayscale' : ''">
                      <div class="grid grid-cols-4 sm:flex sm:items-center gap-3 flex-1">
                        <div class="col-span-1">
                          <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-1 lg:hidden">Ordre</label>
                          <input type="number" v-model="lvl.order" class="w-full sm:w-12 h-10 bg-white rounded-xl text-center font-bold text-xs border border-transparent focus:border-brand-primary outline-none transition-all" title="Ordre" />
                        </div>
                        <div class="col-span-2">
                          <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-1 lg:hidden">Label</label>
                          <input type="text" v-model="lvl.label" class="w-full sm:flex-1 h-10 bg-white rounded-xl px-4 font-bold text-xs border border-transparent focus:border-brand-primary outline-none transition-all" placeholder="Label" />
                        </div>
                        <div class="col-span-1">
                          <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1 block mb-1 lg:hidden">Seuil</label>
                          <input type="number" v-model="lvl.successThreshold" class="w-full sm:w-16 h-10 bg-white rounded-xl text-center font-bold text-xs border border-transparent focus:border-brand-primary outline-none transition-all" title="Seuil" />
                        </div>
                      </div>
                      <div class="flex items-center gap-4 justify-between sm:justify-end">
                        <label class="flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm hover:border-brand-primary/30 transition-all">
                          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ lvl.isActive !== false ? 'Actif' : 'Inactif' }}</span>
                          <div class="relative inline-block w-8 h-4 rounded-full transition-colors duration-200" :class="lvl.isActive !== false ? 'bg-green-400' : 'bg-gray-300'">
                            <input type="checkbox" v-model="lvl.isActive" class="opacity-0 w-0 h-0" />
                            <span class="absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform duration-200" :class="lvl.isActive !== false ? 'transform translate-x-4' : ''"></span>
                          </div>
                        </label>
                        <button @click="removeFormationLevel(idx)" class="absolute top-4 right-4 sm:static w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                          <span class="material-icons-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <!-- Rules Tab Content -->
        <div v-if="activeTab === 'rules'" class="animate-fade-in space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 class="text-xl font-black heading-primary uppercase tracking-tight">Règles de Redirection</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Définissez où envoyer l'utilisateur selon son score à {{ currentFormation.label }}</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="relative w-full sm:min-w-[250px]">
                <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input
                  v-model="searchTerm"
                  type="search"
                  placeholder="Chercher une règle..."
                  class="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-bold transition-all shadow-sm uppercase tracking-widest"
                />
              </div>
              <button
                @click="openNewForm"
                class="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition-all"
              >
                <span class="material-icons-outlined text-sm">add</span>
                Nouvelle règle
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
          </div>

          <!-- Rules Table -->
          <div v-else-if="filteredRules.length" class="bg-white rounded-[40px] shadow-sm overflow-hidden border border-gray-50">
            <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full min-w-max text-left">
                <thead>
                  <tr class="border-b border-gray-50 bg-gray-50/50">
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">ID</th>
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Condition</th>
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Formation 1</th>
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Formation 2</th>
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Certif.</th>
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Prérequis (échec)</th>
                    <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr
                    v-for="(rule, idx) in filteredRules"
                    :key="rule.id"
                    class="hover:bg-blue-50/30 transition-colors"
                    :class="rule.isActive === false ? 'opacity-40 grayscale' : ''"
                  >
                    <td class="px-8 py-5 text-xs font-black text-gray-300">{{ rule.id }}</td>
                    <td class="px-8 py-5">
                      <span class="text-xs font-bold text-gray-700">{{ rule.condition }}</span>
                    </td>
                    <td class="px-8 py-5">
                      <span class="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {{ rule.formation1 }}
                      </span>
                    </td>
                    <td class="px-8 py-5">
                      <span class="inline-block px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {{ rule.formation2 }}
                      </span>
                    </td>
                    <td class="px-8 py-5">
                      <span v-if="rule.certification" class="text-xs font-bold text-brand-primary uppercase">{{ rule.certification }}</span>
                      <span v-else class="text-[10px] text-gray-300 italic">Aucune</span>
                    </td>
                    <td class="px-8 py-5 max-w-[280px]">
                      <div class="flex flex-col gap-2">
                        <span v-if="rule.requirePrerequisiteFailure" class="text-[10px] font-black text-red-500 uppercase">OUI</span>
                        <span v-else class="text-[10px] font-bold text-gray-300 uppercase">NON</span>
        
                        <div v-if="rule.requirePrerequisiteFailure && rule.prerequisiteConditions && rule.prerequisiteConditions.length > 0" class="flex flex-col gap-2 mt-1">
                          <!-- Logique ET / OU -->
                          <div v-if="rule.prerequisiteConditions.length > 1" class="flex items-center gap-1.5">
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
                              :class="rule.prerequisiteLogic === 'AND' 
                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                : 'bg-blue-100 text-blue-700 border-blue-200'">
                              {{ rule.prerequisiteLogic === 'AND' ? 'TOUTES (ET)' : 'AU MOINS UNE (OU)' }}
                            </span>
                          </div>
        
                          <!-- Liste des questions avec leurs réponses -->
                          <div class="flex flex-col gap-1.5">
                            <div
                              v-for="(cond, ci) in rule.prerequisiteConditions"
                              :key="cond.questionId"
                              class="bg-red-50 border border-red-100 rounded-xl p-2 text-[9px]"
                            >
                              <!-- Séparateur ET/OU entre questions -->
                              <div v-if="ci > 0" class="text-[8px] font-black text-center mb-1"
                                :class="rule.prerequisiteLogic === 'AND' ? 'text-purple-400' : 'text-blue-400'">
                                {{ rule.prerequisiteLogic === 'AND' ? '— ET —' : '— OU —' }}
                              </div>
        
                              <!-- Texte de la question -->
                              <div class="font-bold text-gray-600 leading-tight mb-1">
                                {{ prereqQuestions.find(q => q.id === cond.questionId)?.text || `Question #${cond.questionId}` }}
                              </div>
        
                              <!-- Réponses sélectionnées -->
                              <div v-if="cond.responseIndexes && cond.responseIndexes.length > 0" class="flex flex-wrap gap-1 mt-1">
                                <span class="text-[7px] text-gray-400 font-medium w-full">Réponses :</span>
                                <span
                                  v-for="rIdx in cond.responseIndexes"
                                  :key="rIdx"
                                  class="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[8px] font-bold"
                                >
                                  {{ prereqQuestions.find(q => q.id === cond.questionId)?.options?.[rIdx] || `Rép. ${rIdx + 1}` }}
                                </span>
                              </div>
                              <div v-else class="text-[8px] text-gray-400 italic mt-0.5">Tout échec</div>
                            </div>
                          </div>
                        </div>
        
                        <!-- Aucune condition spécifique = tout échec déclenche -->
                        <div v-else-if="rule.requirePrerequisiteFailure" class="text-[8px] text-gray-400 italic">
                          Tout échec prérequis
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-5">
                      <div class="flex gap-2 justify-end items-center">
                        <label class="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm" :title="rule.isActive !== false ? 'Actif' : 'Inactif'">
                          <div class="relative inline-block w-7 h-3.5 rounded-full transition-colors duration-200" :class="rule.isActive !== false ? 'bg-green-400' : 'bg-gray-300'" @click.prevent="toggleRuleActive(rule)">
                            <span class="absolute left-0.5 top-0.5 bg-white w-2.5 h-2.5 rounded-full transition-transform duration-200" :class="rule.isActive !== false ? 'transform translate-x-3' : ''"></span>
                          </div>
                        </label>
                        <button
                          @click="openEditForm(rule)"
                          class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center"
                          title="Modifier"
                        >
                          <span class="material-icons-outlined text-sm">edit</span>
                        </button>
                        <button
                          @click="deleteRule(rule)"
                          class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center"
                          title="Supprimer"
                        >
                          <span class="material-icons-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        
          <div
            v-else-if="!loading"
            class="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200 text-gray-300"
          >
            <span class="material-icons-outlined text-6xl mb-4 opacity-20">route</span>
            <p class="font-bold uppercase tracking-widest text-xs">
              Aucune règle de parcours configurée
            </p>
            <p class="text-xs text-gray-400 mt-2">
              Cliquez sur "Nouvelle règle" pour commencer
            </p>
          </div>
        </div>
      </div>
</div>
</div>

    <!-- Modal Form -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showForm = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-[95%] sm:w-full max-w-lg relative flex flex-col animate-scale-up max-h-[90vh]">
        <div class="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 class="text-xl font-black heading-primary">
            {{ editingRule ? "Modifier la règle" : "Nouvelle règle de parcours" }}
          </h3>
          <button @click="showForm = false" class="text-gray-300 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl p-2">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Formation concernée</label>
            <input
              v-model="newRule.formation"
              list="formations-list"
              placeholder="Sélectionnez ou saisissez une formation"
              class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
            />
          </div>

          <div>
            <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Condition (Niveau du test)</label>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <span class="text-xs font-bold text-gray-500 whitespace-nowrap">Si résultat du test</span>
              <div class="flex gap-2 flex-1">
                <select
                  v-model="conditionOperator"
                  class="w-20 px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white text-center cursor-pointer"
                >
                  <option value="=">=</option>
                  <option value="<"><</option>
                  <option value="≤">≤</option>
                  <option value=">">></option>
                  <option value="≥">≥</option>
                </select>
                <input
                  v-model="conditionLevel"
                  list="levels-list-main"
                  placeholder="Choisir un niveau"
                  class="flex-1 px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
                />
              </div>
            </div>
            <input
              v-model="newRule.condition"
              type="text"
              class="w-full mt-2 px-4 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 outline-none focus:border-brand-primary"
              placeholder="Condition générée automatiquement (modifiable)"
            />
          </div>

          <div class="space-y-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative inline-block w-10 h-5 rounded-full transition-colors duration-200" :class="newRule.requirePrerequisiteFailure ? 'bg-red-500' : 'bg-gray-300'">
                <input type="checkbox" v-model="newRule.requirePrerequisiteFailure" class="opacity-0 w-0 h-0" />
                <span class="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-200" :class="newRule.requirePrerequisiteFailure ? 'transform translate-x-5' : ''"></span>
              </div>
              <div>
                <span class="text-xs font-black text-gray-700 uppercase tracking-widest block leading-none mb-1">Condition de Prérequis</span>
                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Activer si cette règle ne s'applique qu'en cas d'échec aux prérequis</span>
              </div>
            </label>

            <!-- Granular Prereq Selection -->
            <transition name="fade">
              <div v-if="newRule.requirePrerequisiteFailure" class="space-y-4 pt-3 border-t border-red-100/50">

                <!-- Logique ET / OU — visible dès que 2+ questions cochées -->
                <transition name="fade">
                  <div v-if="newRule.prerequisiteConditions.length > 1" class="flex flex-col gap-1.5">
                    <label class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Logique entre les questions</label>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="newRule.prerequisiteLogic = 'OR'"
                        class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border-2"
                        :class="newRule.prerequisiteLogic === 'OR'
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                          : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'"
                      >
                        <span class="text-base leading-none">∪</span> Au moins une (OU)
                      </button>
                      <button
                        type="button"
                        @click="newRule.prerequisiteLogic = 'AND'"
                        class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border-2"
                        :class="newRule.prerequisiteLogic === 'AND'
                          ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                          : 'bg-white text-gray-400 border-gray-100 hover:border-purple-200'"
                      >
                        <span class="text-base leading-none">∩</span> Toutes (ET)
                      </button>
                    </div>
                  </div>
                </transition>

                <!-- Liste des questions -->
                <div>
                  <label class="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Questions cibles</label>
                  <div class="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    <div
                      v-for="(q, qIdx) in prereqQuestions"
                      :key="q.id"
                      class="rounded-xl border-2 transition-all overflow-hidden"
                      :class="isPrereqQuestionSelected(q.id)
                        ? 'border-red-300 bg-white shadow-sm'
                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'"
                    >
                      <!-- Séparateur ET/OU entre questions sélectionnées -->
                      <div
                        v-if="qIdx > 0 && isPrereqQuestionSelected(q.id) && newRule.prerequisiteConditions.length > 1"
                        class="text-center text-[8px] font-black py-0.5"
                        :class="newRule.prerequisiteLogic === 'AND' ? 'bg-purple-50 text-purple-400' : 'bg-blue-50 text-blue-400'"
                      >
                        {{ newRule.prerequisiteLogic === 'AND' ? '— ET —' : '— OU —' }}
                      </div>

                      <!-- En-tête question + checkbox -->
                      <div
                        class="flex items-start gap-3 p-3 cursor-pointer"
                        @click="togglePrereqQuestion(q.id)"
                      >
                        <!-- Checkbox stylisée -->
                        <div
                          class="mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                          :class="isPrereqQuestionSelected(q.id)
                            ? 'bg-red-500 border-red-500'
                            : 'bg-white border-gray-300'"
                        >
                          <span v-if="isPrereqQuestionSelected(q.id)" class="text-white text-[8px] font-black leading-none">✓</span>
                        </div>

                        <div class="flex-1 min-w-0">
                          <span
                            class="text-[10px] font-bold leading-tight block"
                            :class="isPrereqQuestionSelected(q.id) ? 'text-gray-800' : 'text-gray-500'"
                          >{{ q.text }}</span>

                          <!-- Résumé des réponses cochées (question sélectionnée mais options fermées) -->
                          <div
                            v-if="isPrereqQuestionSelected(q.id)"
                            class="flex flex-wrap gap-1 mt-1.5"
                          >
                            <span
                              v-if="!newRule.prerequisiteConditions.find(c => c.questionId === q.id)?.responseIndexes?.length"
                              class="text-[8px] text-red-400 italic"
                            >Tout échec déclenche</span>
                            <span
                              v-for="rIdx in (newRule.prerequisiteConditions.find(c => c.questionId === q.id)?.responseIndexes || [])"
                              :key="rIdx"
                              class="px-1.5 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded-full text-[8px] font-bold"
                            >{{ q.options?.[rIdx] ?? `Rép. ${rIdx + 1}` }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Options de réponse (déployées si la question est cochée) -->
                      <transition name="fade">
                        <div
                          v-if="isPrereqQuestionSelected(q.id) && q.options && q.options.length"
                          class="px-3 pb-3 border-t border-red-100"
                        >
                          <span class="text-[8px] text-gray-400 font-bold uppercase tracking-widest block mt-2 mb-1.5">Réponses déclenchant la règle :</span>
                          <div class="flex flex-wrap gap-1.5">
                            <button
                              v-for="(opt, optIdx) in q.options"
                              :key="optIdx"
                              type="button"
                              @click.stop="togglePrereqOption(q.id, optIdx)"
                              class="px-2.5 py-1 rounded-full text-[9px] font-bold transition-all border-2"
                              :class="isPrereqOptionSelected(q.id, optIdx)
                                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-red-200 hover:text-red-400'"
                            >
                              {{ opt }}
                            </button>
                          </div>
                        </div>
                      </transition>
                    </div>
                  </div>
                  <p class="text-[8px] text-gray-400 mt-2 font-medium italic leading-relaxed">
                    Si aucune question n'est cochée → tout échec prérequis déclenche la règle.<br>
                    Si aucune réponse n'est cochée pour une question → tout échec sur cette question déclenche.
                  </p>
                </div>
              </div>
            </transition>
          </div>

          <div>
            <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Certification associée</label>
            <input
              v-model="newRule.certification"
              placeholder="Ex : ICDL, TOSA, RS..."
              class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Formation 1</label>
              <input
                v-model="f1Formation"
                list="formations-list"
                placeholder="Formation"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
              />
              <input
                v-model="f1Level"
                list="levels-list-f1"
                placeholder="Niveau"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
              />
              <input
                v-model="newRule.formation1"
                type="text"
                class="w-full px-3 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 outline-none focus:border-brand-primary"
                placeholder="Valeur générée"
              />
            </div>
            <div class="space-y-3">
              <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Formation 2</label>
              <input
                v-model="f2Formation"
                list="formations-list"
                placeholder="Formation"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
              />
              <input
                v-model="f2Level"
                list="levels-list-f2"
                placeholder="Niveau"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
              />
              <input
                v-model="newRule.formation2"
                type="text"
                class="w-full px-3 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 outline-none focus:border-brand-primary"
                placeholder="Valeur générée"
              />
            </div>
          </div>

          <!-- Datalists for custom inputs -->
          <datalist id="formations-list">
            <option v-for="f in formationsList" :key="f.id" :value="f.label" />
          </datalist>
          <datalist id="levels-list-main">
            <option v-for="lvl in selectedFormationLevels" :key="lvl.id" :value="lvl.label" />
          </datalist>
          <datalist id="levels-list-f1">
            <option v-for="lvl in selectedFormationLevels" :key="lvl.id" :value="lvl.label" />
          </datalist>
          <datalist id="levels-list-f2">
            <option v-for="lvl in selectedFormationLevels" :key="lvl.id" :value="lvl.label" />
          </datalist>
        </div>
        <div class="p-6 sm:p-8 border-t border-gray-100">
          <!-- Form Actions -->
          <button
            @click="saveRule"
            class="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-gray-800 transition-all"
          >
            {{ editingRule ? "Enregistrer les modifications" : "Ajouter la règle" }}
          </button>
        </div>
      </div>
    </div>
 
</template>

<style scoped>
.btn-primary {
  background: black;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.heading-primary {
  color: #1e3a8a;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes scale-up {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-scale-up {
  animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>