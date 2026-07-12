<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";

const rules = ref([]);
const formationsList = ref([]);
const loading = ref(true);
const activeFormationId = ref(null);
const searchTerm = ref("");
const selectedCategory = ref("all");
const showInactive = ref(true); // Affiche les règles désactivées par défaut côté admin
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
  isActive: true,
  isHiddenResult: false,
  hiddenResultType: null,
  requirePrerequisiteFailure: false,
  certification: "",
  prerequisiteConditions: [],
  prerequisiteLogic: "OR",
  selectionConditions: [],
  selectionConditionLogic: "AND",
  explanationMessage: "",
  parcoursTitle: "",
});

// Dynamic helpers for form building
const selectedFormationLevels = ref([]);
const prereqQuestions = ref([]); 
const conditionQuestions = ref([]);
const conditionLevel = ref("");
const conditionOperator = ref("=");
const f1Formation = ref("");
const f1Level = ref("");
const f1Certification = ref("");
const f2Formation = ref("");
const f2Level = ref("");
const f2Certification = ref("");
const f1Manual = ref(false);
const f2Manual = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

const toast = useToastStore();

const workflowLabels = {
  prerequis: "Pré-requis",
  complementary: "Complémentaires",
  availabilities: "Disponibilités",
  mise_a_niveau: "Mise à niveau",
  "mise-a-niveau": "Mise à niveau",
};

const selectableConditionQuestions = computed(() => {
  const allowedTypes = [
    "prerequis",
    "complementary",
    "availabilities",
    "mise_a_niveau",
    "mise-a-niveau",
  ];
  return conditionQuestions.value.filter(
    (question) => allowedTypes.includes(question.type) && question.isActive !== false,
  );
});


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
    // Priorité absolue à l'ID de formation
    const matchesFormation = (r.formationId && Number(r.formationId) === Number(currentFormation.value.id)) ||
                              r.formation === currentFormation.value.label;
    const passesActiveFilter = showInactive.value || r.isActive !== false;
    const q = searchTerm.value.toLowerCase().trim();
    const matchesSearch = !q || 
      (r.condition || "").toLowerCase().includes(q) || 
      (r.formation1 || "").toLowerCase().includes(q) || 
      (r.formation2 || "").toLowerCase().includes(q);
    
    return passesActiveFilter && matchesFormation && matchesSearch;
  });
});

const inactiveRulesCount = computed(() => {
  if (!currentFormation.value) return 0;
  return rules.value.filter(r => 
    ((r.formationId && Number(r.formationId) === Number(currentFormation.value.id)) || 
     r.formation === currentFormation.value.label) && 
    r.isActive === false
  ).length;
});

async function fetchRules() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/parcours`, { headers: getAuthHeaders() });
    rules.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch parcours rules:", error);
  } finally {
    loading.value = false;
  }
}

function selectFormation(f) {
  activeFormationId.value = f.id;
  formationForm.value = { 
    ...f, 
    levels: f.levels ? [...f.levels] : [],
    color: f.color || "#3B82F6" // Fallback to avoid color input warning
  };
  fetchConditionQuestions(f.slug);
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
    isActive: true,
    isHiddenResult: false,
    hiddenResultType: null,
    requirePrerequisiteFailure: false,
    certification: "",
    prerequisiteConditions: [],
    prerequisiteLogic: "OR",
    selectionConditions: [],
    selectionConditionLogic: "AND",
    explanationMessage: "",
    parcoursTitle: "",
  };
  conditionOperator.value = "=";
  f1Formation.value = "";
  f1Level.value = "";
  f1Certification.value = "";
  f2Formation.value = "";
  f2Level.value = "";
  f2Certification.value = "";
  f1Manual.value = false;
  f2Manual.value = false;
  showForm.value = true;
}

let isInitializingForm = false;

async function openEditForm(rule) {
  isInitializingForm = true;
  editingRule.value = rule;
  newRule.value = { 
    ...rule,
    requirePrerequisiteFailure: !!rule.requirePrerequisiteFailure,
    isHiddenResult: !!rule.isHiddenResult,
    hiddenResultType: rule.hiddenResultType || null,
    certification: rule.certification || "",
    prerequisiteConditions: rule.prerequisiteConditions || [],
    prerequisiteLogic: rule.prerequisiteLogic || "OR",
    selectionConditions: rule.selectionConditions || [],
    selectionConditionLogic: rule.selectionConditionLogic || "AND",
    explanationMessage: rule.explanationMessage || "",
    parcoursTitle: rule.parcoursTitle || "",
  };
  
  if (rule.formation) {
    await fetchLevelsForFormation(rule.formation);
  }

  const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (condMatch) {
    conditionOperator.value = condMatch[1].replace('<=', '≤').replace('>=', '≥');
    conditionLevel.value = condMatch[2];
  } else {
    conditionOperator.value = "=";
    conditionLevel.value = rule.condition.replace(/Si résultat du test( =)?( )?/, "").trim();
  }

  // Parser formation1 et formation2 en 3 parties : FORMATION + Parcours + (Certification)
  const p1 = parseCertificationString(rule.formation1);
  if (p1.formation) {
    f1Formation.value = p1.formation;
    f1Level.value = p1.level;
    f1Certification.value = p1.certification;
    f1Manual.value = false;
  } else if (rule.formation1) {
    f1Formation.value = "";
    f1Level.value = "";
    f1Certification.value = "";
    f1Manual.value = true;
  } else {
    f1Formation.value = "";
    f1Level.value = "";
    f1Certification.value = "";
    f1Manual.value = false;
  }

  const p2 = parseCertificationString(rule.formation2);
  if (p2.formation) {
    f2Formation.value = p2.formation;
    f2Level.value = p2.level;
    f2Certification.value = p2.certification;
    f2Manual.value = false;
  } else if (rule.formation2) {
    f2Formation.value = "";
    f2Level.value = "";
    f2Certification.value = "";
    f2Manual.value = true;
  } else {
    f2Formation.value = "";
    f2Level.value = "";
    f2Certification.value = "";
    f2Manual.value = false;
  }

  showForm.value = true;
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
  if (idx === -1) cond.responseIndexes.push(optIndex);
  else cond.responseIndexes.splice(idx, 1);
}

function isPrereqOptionSelected(questionId, optIndex) {
  const cond = (newRule.value.prerequisiteConditions || []).find(c => c.questionId === questionId);
  return cond ? cond.responseIndexes.includes(optIndex) : false;
}

function toggleSelectionQuestion(question) {
  if (!newRule.value.selectionConditions) newRule.value.selectionConditions = [];
  const index = newRule.value.selectionConditions.findIndex(c => c.questionId === question.id);
  if (index === -1) {
    newRule.value.selectionConditions.push({
      workflow: question.type === "mise-a-niveau" ? "mise_a_niveau" : question.type,
      questionId: question.id,
      responseIndexes: [],
      expectedValue: "",
      operator: "IN",
    });
  } else {
    newRule.value.selectionConditions.splice(index, 1);
  }
}

function getSelectionCondition(questionId) {
  return (newRule.value.selectionConditions || []).find(c => c.questionId === questionId);
}

function isSelectionQuestionSelected(questionId) {
  return !!getSelectionCondition(questionId);
}

function toggleSelectionOption(questionId, optIndex) {
  const cond = getSelectionCondition(questionId);
  if (!cond) return;
  if (!cond.responseIndexes) cond.responseIndexes = [];
  const idx = cond.responseIndexes.indexOf(optIndex);
  if (idx === -1) cond.responseIndexes.push(optIndex);
  else cond.responseIndexes.splice(idx, 1);
}

function isSelectionOptionSelected(questionId, optIndex) {
  const cond = getSelectionCondition(questionId);
  return cond?.responseIndexes?.includes(optIndex) || false;
}

function setSelectionExpectedValue(questionId, value) {
  const cond = getSelectionCondition(questionId);
  if (!cond) return;
  cond.expectedValue = value;
}

async function saveRule() {
  try {
    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/parcours/${editingRule.value.id}`, newRule.value, { headers: getAuthHeaders() });
    } else {
      await axios.post(`${apiBaseUrl}/parcours`, newRule.value, { headers: getAuthHeaders() });
    }
    showForm.value = false;
    editingRule.value = null;
    toast.success("Règle enregistrée !");
    await fetchRules();
  } catch (error) {
    console.error("Failed to save rule:", error);
    toast.error("Erreur lors de la sauvegarde.");
  }
}

async function deleteRule(rule) {
  if (!confirm(`Supprimer cette règle de parcours ?`)) return;
  try {
    await axios.delete(`${apiBaseUrl}/parcours/${rule.id}`, { headers: getAuthHeaders() });
    toast.success("Règle supprimée.");
    await fetchRules();
  } catch (error) {
    console.error("Failed to delete rule:", error);
    toast.error("Erreur lors de la suppression.");
  }
}

async function toggleRuleActive(rule) {
  try {
    const newState = !(rule.isActive !== false);
    await axios.patch(`${apiBaseUrl}/parcours/${rule.id}`, { isActive: newState }, { headers: getAuthHeaders() });
    rule.isActive = newState;
    toast.success(newState ? "Règle activée" : "Règle désactivée");
  } catch (error) {
    console.error("Failed to toggle rule:", error);
    toast.error("Erreur lors de la mise à jour.");
  }
}

async function duplicateRule(rule) {
  try {
    const payload = { 
      ...rule, 
      id: undefined,
      order: filteredRules.value.length,
      parcoursTitle: rule.parcoursTitle ? `${rule.parcoursTitle} (copie)` : '',
    };
    await axios.post(`${apiBaseUrl}/parcours`, payload, { headers: getAuthHeaders() });
    toast.success("Règle dupliquée");
    await fetchRules();
  } catch (error) {
    console.error("Failed to duplicate rule:", error);
    toast.error("Erreur lors de la duplication.");
  }
}

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`, { headers: getAuthHeaders() });
    formationsList.value = (res.data || []).filter(formation => formation.isActive !== false);
    if (formationsList.value.length > 0 && !activeFormationId.value) {
      const savedId = localStorage.getItem('admin_parcours_activeFormationId');
      if (savedId) {
        const found = formationsList.value.find(f => f.id === Number(savedId));
        if (found) selectFormation(found);
        else selectFormation(formationsList.value[0]);
      } else {
        selectFormation(formationsList.value[0]);
      }
    }
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  }
}

async function saveFormationSettings() {
  try {
    const payload = { ...formationForm.value };
    delete payload.questions;
    
    await axios.patch(`${apiBaseUrl}/formations/${activeFormationId.value}`, payload, { headers: getAuthHeaders() });
    await fetchFormations();
    toast.success("Paramètres enregistrés.");
  } catch (error) {
    console.error("Failed to save formation settings:", error);
    toast.error("Erreur lors de l'enregistrement des paramètres.");
  }
}

async function fetchLevelsForFormation(label) {
  const formation = formationsList.value.find(f => f.label === label);
  if (!formation) {
    selectedFormationLevels.value = [];
    return;
  }
  try {
    const res = await axios.get(`${apiBaseUrl}/formations/${formation.slug}/levels`, { headers: getAuthHeaders() });
    selectedFormationLevels.value = (res.data || []).filter(level => level.isActive !== false);
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    selectedFormationLevels.value = [];
  }
}

async function fetchPrereqQuestions() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions/prerequisites`, {
      params: { scope: "global" },
      headers: getAuthHeaders()
    });
    prereqQuestions.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch prereq questions:", error);
  }
}

async function fetchConditionQuestions(formationSlug) {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions`, {
      params: formationSlug ? { formation: formationSlug } : {},
      headers: getAuthHeaders()
    });
    conditionQuestions.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch condition questions:", error);
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

watch(activeFormationId, (val) => {
  if (val) localStorage.setItem('admin_parcours_activeFormationId', val);
});

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
  if (!isInitializingForm) {
    conditionLevel.value = "";
    f1Level.value = "";
    f2Level.value = "";
  }
});

watch([conditionLevel, conditionOperator], ([val, op]) => {
  if (val && !isInitializingForm) {
    newRule.value.condition = `Si résultat du test ${op} ${val}`;
  }
});

/**
 * Construit la valeur finale au format "FORMATION Parcours (Certification)"
 * Si pas de certification, retourne "FORMATION Parcours"
 */
const buildTargetString = (form, level, cert = '') => {
  if (!form && !level) return '';
  const base = form && level ? `${form} ${level}` : (form || level || '');
  if (cert && cert.trim()) return `${base} (${cert.trim()})`;
  return base;
};

/**
 * Parse une valeur "FORMATION Parcours (Certification)" en 3 parties
 */
function parseCertificationString(value) {
  if (!value) return { formation: '', level: '', certification: '' };
  const certMatch = value.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (certMatch) {
    const beforeParen = certMatch[1].trim();
    const certification = certMatch[2].trim();
    // Essayer de trouver la formation dans la liste
    const matched = formationsList.value.find(f => beforeParen.startsWith(f.label));
    if (matched) {
      return {
        formation: matched.label,
        level: beforeParen.replace(matched.label, '').trim(),
        certification,
      };
    }
    // Pas de formation connue : tout avant parenthèse = formation+level, cert = certification
    return { formation: beforeParen, level: '', certification };
  }
  // Pas de parenthèse : parser comme avant
  const matched = formationsList.value.find(f => value.startsWith(f.label));
  if (matched) {
    return {
      formation: matched.label,
      level: value.replace(matched.label, '').trim(),
      certification: '',
    };
  }
  return { formation: value, level: '', certification: '' };
}

watch([f1Formation, f1Level], ([form, level]) => {
  if (isInitializingForm || f1Manual.value) return;
  if (form === "Parcours Libre") f1Level.value = "";
  newRule.value.formation1 = buildTargetString(form, level, f1Certification.value);
  if (form && form !== "Parcours Libre") {
    const matched = formationsList.value.find(f => f.label === form);
    if (matched) fetchLevelsForFormation(form);
  }
});

watch(f1Certification, (cert) => {
  if (isInitializingForm || f1Manual.value) return;
  newRule.value.formation1 = buildTargetString(f1Formation.value, f1Level.value, cert);
});

watch([f2Formation, f2Level], ([form, level]) => {
  if (isInitializingForm || f2Manual.value) return;
  if (form === "Parcours Libre") f2Level.value = "";
  newRule.value.formation2 = buildTargetString(form, level, f2Certification.value);
  if (form && form !== "Parcours Libre") {
    const matched = formationsList.value.find(f => f.label === form);
    if (matched) fetchLevelsForFormation(form);
  }
});

watch(f2Certification, (cert) => {
  if (isInitializingForm || f2Manual.value) return;
  newRule.value.formation2 = buildTargetString(f2Formation.value, f2Level.value, cert);
});

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
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header with Formation Selector -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Configuration des Parcours</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Fiches catalogues et Logique de Redirection Intelligente
        </p>
      </div>

      <!-- Compact Selectors -->
      <div class="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="relative min-w-[140px]">
          <select 
            v-model="selectedCategory"
            class="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option value="all">Toutes</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <span class="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 text-[14px]">expand_more</span>
        </div>
        
        <div class="h-6 w-px bg-slate-100"></div>

        <div class="relative min-w-[200px]">
          <select 
            v-model="activeFormationId"
            @change="(e) => selectFormation(formationsList.find(f => f.id === Number(e.target.value)))"
            class="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-[9px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option v-for="form in filteredFormationsDropdown" :key="form.id" :value="form.id">{{ form.label }}</option>
          </select>
          <span class="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 text-[14px]">expand_more</span>
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <div v-if="currentFormation" class="space-y-8 animate-fade-in">
      <!-- Tabs Navigation -->
      <div class="flex items-center gap-2 p-1.5 bg-slate-100 rounded-3xl w-fit">
        <button
          @click="activeTab = 'details'"
          class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          :class="activeTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
        >
          <span class="material-icons-outlined text-sm">settings</span>
          Paramètres Fiche
        </button>
        <button
          @click="activeTab = 'rules'"
          class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          :class="activeTab === 'rules' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
        >
          <span class="material-icons-outlined text-sm">route</span>
          Logique Parcours
        </button>
      </div>

      <!-- Tab: Parameters -->
      <div v-if="activeTab === 'details'" class="animate-fade-in bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-10 space-y-10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
               <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" :style="{ backgroundColor: formationForm.color || '#000' }">
                  <span class="material-icons-outlined">{{ formationForm.icon || 'school' }}</span>
               </div>
               <div>
                 <h3 class="text-xl font-black text-slate-900 leading-none">Contenu Catalogue</h3>
                 <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Édition des métadonnées et paliers</p>
               </div>
            </div>
            <button @click="saveFormationSettings" class="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
              Enregistrer les modifications
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Titre de la Formation</label>
              <input v-model="formationForm.label" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Catégorie</label>
              <input v-model="formationForm.category" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Colorimétrie (Hex)</label>
              <div class="flex gap-2">
                <input v-model="formationForm.color" class="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-brand-primary rounded-xl font-bold text-xs uppercase" />
                <input type="color" v-model="formationForm.color" class="w-10 h-10 rounded-lg border-none cursor-pointer shrink-0" />
              </div>
            </div>
          </div>

          <!-- Levels Section -->
          <div class="space-y-6 pt-6 border-t border-slate-50">
             <div class="flex items-center justify-between">
               <h4 class="text-xs font-black text-slate-900 uppercase tracking-widest">Niveaux & Seuils de Réussite</h4>
               <button @click="addFormationLevel" class="text-[10px] font-black text-brand-primary hover:underline transition-all">Ajouter un niveau</button>
             </div>
             
             <div class="grid grid-cols-1 gap-4">
                <div v-for="(lvl, idx) in formationForm.levels" :key="idx" class="flex items-center gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 animate-slide-in">
                   <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">{{ lvl.order + 1 }}</div>
                   <input v-model="lvl.label" placeholder="Nom du niveau..." class="flex-1 bg-white px-4 py-2.5 rounded-xl border-none font-bold text-xs ring-1 ring-slate-100 focus:ring-brand-primary outline-none" />
                   <div class="w-24 relative">
                      <input type="number" v-model="lvl.successThreshold" class="w-full pl-3 pr-8 py-2.5 bg-white rounded-xl border-none font-bold text-xs ring-1 ring-slate-100 focus:ring-brand-primary outline-none" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">%</span>
                   </div>
                   <button @click="removeFormationLevel(idx)" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"><span class="material-icons-outlined text-sm">close</span></button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Tab: Logic -->
      <div v-if="activeTab === 'rules'" class="animate-fade-in space-y-6">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px] max-w-md group">
            <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors text-sm">search</span>
            <input v-model="searchTerm" type="search" placeholder="Rechercher une règle..." class="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm" />
          </div>

          <!-- Toggle règles désactivées -->
          <button
            @click="showInactive = !showInactive"
            class="relative px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 shrink-0"
            :class="showInactive
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'"
          >
            <span class="material-icons-outlined text-sm">{{ showInactive ? 'visibility_off' : 'visibility' }}</span>
            <span>{{ showInactive ? 'Masquer inactifs' : 'Voir inactifs' }}</span>
            <span
              v-if="inactiveRulesCount > 0"
              class="px-1.5 py-0.5 rounded-full text-[8px] font-black"
              :class="showInactive ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-500'"
            >{{ inactiveRulesCount }}</span>
          </button>

          <button @click="openNewForm" class="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 shrink-0">
            <span class="material-icons-outlined text-sm">add_road</span> Nouvelle Règle
          </button>
        </div>

        <div v-if="loading" class="py-24 flex justify-center"><div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-brand-primary animate-spin"></div></div>
        
        <div v-else-if="filteredRules.length === 0" class="py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-slate-300">
           <span class="material-icons-outlined text-6xl mb-4 opacity-10">route</span>
           <p class="text-xs font-black uppercase tracking-widest">Aucune règle définie pour {{ currentFormation.label }}</p>
           <button v-if="!showInactive && inactiveRulesCount > 0" @click="showInactive = true" class="mt-4 text-[10px] font-black text-amber-600 hover:underline flex items-center gap-1">
             <span class="material-icons-outlined text-sm">visibility</span>
             Voir {{ inactiveRulesCount }} règle(s) désactivée(s)
           </button>
        </div>

        <div v-else class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
           <table class="w-full text-left">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-50">
                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordre</th>
                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Intitulé</th>
                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition Score</th>
                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Redirection Principale</th>
                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Réussite Pré-requis</th>
	                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conditions</th>
	                  <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="rule in filteredRules.sort((a,b) => (a.order||0) - (b.order||0))" :key="rule.id" class="group hover:bg-slate-50/50 transition-all" :class="rule.isActive === false ? 'opacity-50 bg-slate-50/30' : ''">
                  <td class="px-8 py-6">
	                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{{ rule.order ?? 0 }}</div>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs font-black text-slate-900">{{ rule.parcoursTitle || '-' }}</span>
                      <span v-if="rule.isActive === false" class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest w-fit">
                        <span class="material-icons-outlined text-[10px]">visibility_off</span>
                        Désactivée
                      </span>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-xs font-black text-slate-900">{{ rule.condition }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex flex-col gap-1">
                      <span class="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg w-fit shadow-sm">{{ rule.formation1 }}</span>
                      <span v-if="rule.formation2" class="px-2.5 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg w-fit">ou {{ rule.formation2 }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                     <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest" :class="rule.requirePrerequisiteFailure ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'">
                       {{ rule.requirePrerequisiteFailure ? 'Obligatoire' : 'Ignoré' }}
                     </span>
                     <span v-if="rule.isHiddenResult" class="ml-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit mt-1">
                       <span class="material-icons-outlined text-[10px]">visibility_off</span>
                       Masqué
                     </span>
                  </td>
	                  <td class="px-8 py-6">
	                     <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest" :class="(rule.selectionConditions || []).length ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100'">
	                       {{ (rule.selectionConditions || []).length ? `${(rule.selectionConditions || []).length} condition(s)` : 'Aucune' }}
	                     </span>
	                  </td>
	                  <td class="px-8 py-6">
	                    <div class="flex items-center justify-end gap-2 pr-4">
                       <button @click="duplicateRule(rule)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-emerald-600 transition-all" title="Dupliquer">
                         <span class="material-icons-outlined text-sm">content_copy</span>
                       </button>
                       <button @click="toggleRuleActive(rule)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all">
                         <span class="material-icons-outlined text-sm">{{ rule.isActive !== false ? 'visibility' : 'visibility_off' }}</span>
                       </button>
                       <button @click="openEditForm(rule)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-brand-primary transition-all">
                         <span class="material-icons-outlined text-sm">edit</span>
                       </button>
                       <button @click="deleteRule(rule)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 transition-all">
                         <span class="material-icons-outlined text-sm">delete_outline</span>
                       </button>
                    </div>
                  </td>
                </tr>
              </tbody>
           </table>
        </div>
      </div>
    </div>

    <!-- Modal Form (Unified Refinement) -->
    <div v-if="showForm" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" @click="showForm = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div>
            <h3 class="text-2xl font-black text-slate-900">{{ editingRule ? "Modifier" : "Nouvelle" }} Règle</h3>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuration de la logique automate</p>
          </div>
          <button @click="showForm = false" class="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-xl transition-all">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div class="space-y-6">
            <div class="space-y-3">
               <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Seuil de Déclenchement (Score)</label>
               <div class="flex items-center gap-3">
                  <select v-model="conditionOperator" class="w-20 px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-brand-primary/20">
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value="≤">≤</option>
                    <option value=">">&gt;</option>
                    <option value="≥">≥</option>
                  </select>
                  <select v-model="conditionLevel" class="flex-1 px-5 py-3 bg-slate-50 border-none rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-brand-primary/20">
                    <option value="">Sélectionner un niveau...</option>
                    <option v-for="lvl in formationForm.levels" :key="lvl.id" :value="lvl.label">{{ lvl.label }}</option>
                  </select>
	               </div>
	            </div>

	            <div class="space-y-2">
	              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priorité</label>
	              <input
	                type="number"
	                v-model.number="newRule.order"
	                class="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20"
	              />
	              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">
	                Plus le nombre est petit, plus la règle est évaluée tôt.
	              </p>
	            </div>

	            <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black text-slate-900 uppercase">Échec Pré-requis</h4>
                <p class="text-[10px] font-bold text-slate-400">Règle conditionnée par l'échec aux pré-requis</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="newRule.requirePrerequisiteFailure" class="sr-only peer" />
                <div class="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
	              </label>
	            </div>

            <!-- isHiddenResult -->
            <div class="p-6 bg-rose-50/60 rounded-3xl border border-rose-100 space-y-3">
              <h4 class="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <span class="material-icons-outlined text-rose-500 text-sm">visibility_off</span>
                Résultat masqué
              </h4>
              <p class="text-[10px] font-bold text-slate-400 leading-relaxed">
                Si activé, ce parcours ne sera <strong>jamais affiché</strong> à l'apprenant, même si sa condition de niveau est atteinte.
              </p>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/50 transition-all"
                  :class="!newRule.isHiddenResult ? 'bg-white shadow-sm' : ''">
                  <input type="radio" :value="null" v-model="newRule.hiddenResultType"
                    @change="newRule.isHiddenResult = false"
                    class="w-4 h-4 text-slate-500" />
                  <span class="text-xs font-bold text-slate-700">Affiché normalement</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/50 transition-all"
                  :class="newRule.hiddenResultType === 'too_advanced' ? 'bg-white shadow-sm' : ''">
                  <input type="radio" :value="'too_advanced'" v-model="newRule.hiddenResultType"
                    @change="newRule.isHiddenResult = true"
                    class="w-4 h-4 text-orange-500" />
                  <div>
                    <span class="text-xs font-bold text-slate-700">Niveau trop avancé</span>
                    <p class="text-[10px] text-slate-400">Le test QCM révèle un niveau supérieur à cette formation</p>
                  </div>
                </label>
                <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/50 transition-all"
                  :class="newRule.hiddenResultType === 'too_weak' ? 'bg-white shadow-sm' : ''">
                  <input type="radio" :value="'too_weak'" v-model="newRule.hiddenResultType"
                    @change="newRule.isHiddenResult = true"
                    class="w-4 h-4 text-red-500" />
                  <div>
                    <span class="text-xs font-bold text-slate-700">Niveau insuffisant</span>
                    <p class="text-[10px] text-slate-400">Le niveau de l'apprenant est trop faible pour cette formation</p>
                  </div>
                </label>
              </div>
            </div>

	            <div class="p-6 bg-indigo-50/40 rounded-3xl border border-indigo-100 space-y-4">
	              <div class="flex items-start justify-between gap-4">
	                <div>
	                  <h4 class="text-xs font-black text-slate-900 uppercase">Conditions de sélection</h4>
	                  <p class="text-[10px] font-bold text-slate-400 leading-relaxed">
	                    Utilisé pour départager plusieurs parcours ayant le même résultat de test.
	                  </p>
	                </div>
	                <select v-model="newRule.selectionConditionLogic" class="px-3 py-2 bg-white border border-indigo-100 rounded-xl font-black text-[10px] text-indigo-700 outline-none">
	                  <option value="AND">ET</option>
	                  <option value="OR">OU</option>
	                </select>
	              </div>

	              <div v-if="selectableConditionQuestions.length === 0" class="text-[10px] font-bold text-slate-400">
	                Aucune question prérequis/complémentaire/disponibilité disponible.
	              </div>
	              <div v-else class="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
	                <div
	                  v-for="question in selectableConditionQuestions"
	                  :key="question.id"
	                  class="bg-white rounded-2xl border border-indigo-50 p-4 space-y-3"
	                >
	                  <label class="flex items-start gap-3 cursor-pointer">
	                    <input
	                      type="checkbox"
	                      class="mt-1"
	                      :checked="isSelectionQuestionSelected(question.id)"
	                      @change="toggleSelectionQuestion(question)"
	                    />
	                    <div class="min-w-0">
	                      <div class="text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-1">
	                        {{ workflowLabels[question.type] || question.type }}
	                      </div>
	                      <div class="text-xs font-black text-slate-800 leading-snug">
	                        {{ question.text }}
	                      </div>
	                    </div>
	                  </label>

	                  <div v-if="isSelectionQuestionSelected(question.id)" class="pl-7">
	                    <div v-if="question.options && question.options.length" class="flex flex-wrap gap-2">
	                      <button
	                        v-for="(option, optIdx) in question.options"
	                        :key="optIdx"
	                        type="button"
	                        @click="toggleSelectionOption(question.id, optIdx)"
	                        class="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all"
	                        :class="isSelectionOptionSelected(question.id, optIdx) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200'"
	                      >
	                        {{ option }}
	                      </button>
	                    </div>
	                    <input
	                      v-else
	                      :value="getSelectionCondition(question.id)?.expectedValue || ''"
	                      @input="setSelectionExpectedValue(question.id, $event.target.value)"
	                      placeholder="Valeur attendue..."
	                      class="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-300"
	                    />
	                  </div>
	                </div>
	              </div>
	            </div>

	            <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
                    Redirection Principale (Cible 1)
                    <button type="button" @click="f1Manual = !f1Manual" class="text-slate-300 hover:text-brand-primary transition-all p-1" :title="f1Manual ? 'Passer en sélection assistée' : 'Passer en édition libre'">
                      <span class="material-icons-outlined text-[14px]">{{ f1Manual ? 'settings_suggest' : 'edit_note' }}</span>
                    </button>
                  </label>
                  <div v-if="!f1Manual" class="space-y-2">
                    <!-- Ligne 1 : Formation + Niveau -->
                    <div class="grid grid-cols-2 gap-3">
                      <select v-model="f1Formation" class="px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none">
                        <option value="">Formation...</option>
                        <option value="Parcours Libre">Parcours Libre</option>
                        <option v-for="f in formationsList" :key="f.id" :value="f.label">{{ f.label }}</option>
                      </select>
                      <select v-model="f1Level" :disabled="!f1Formation || f1Formation === 'Parcours Libre'" class="px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none disabled:opacity-30">
                        <option value="">Parcours...</option>
                        <option v-for="lv in selectedFormationLevels" :key="lv.id" :value="lv.label">{{ lv.label }}</option>
                      </select>
                    </div>
                    <!-- Ligne 2 : Certification -->
                    <input v-model="f1Certification" placeholder="Certification (ex: TOSA, ICDL, VOLTAIRE...)" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20" />
                    <!-- Aperçu -->
                    <p v-if="newRule.formation1" class="text-[10px] text-slate-400 font-bold px-1">→ <span class="text-slate-700">{{ newRule.formation1 }}</span></p>
                  </div>
                  <div v-else class="space-y-4">
                    <input v-model="newRule.formation1" placeholder="ex: Parcours personnalisé" class="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                </div>
                              <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
                    Redirection Alternative (Optionnelle)
                    <button type="button" @click="f2Manual = !f2Manual" class="text-slate-300 hover:text-brand-primary transition-all p-1" :title="f2Manual ? 'Passer en sélection assistée' : 'Passer en édition libre'">
                      <span class="material-icons-outlined text-[14px]">{{ f2Manual ? 'settings_suggest' : 'edit_note' }}</span>
                    </button>
                  </label>
                  <div v-if="!f2Manual" class="space-y-2">
                    <div class="grid grid-cols-2 gap-3">
                      <select v-model="f2Formation" class="px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none">
                        <option value="">Formation...</option>
                        <option value="Parcours Libre">Parcours Libre</option>
                        <option v-for="f in formationsList" :key="f.id" :value="f.label">{{ f.label }}</option>
                      </select>
                      <select v-model="f2Level" :disabled="!f2Formation || f2Formation === 'Parcours Libre'" class="px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none disabled:opacity-30">
                        <option value="">Parcours...</option>
                        <option v-for="lv in selectedFormationLevels" :key="lv.id" :value="lv.label">{{ lv.label }}</option>
                      </select>
                    </div>
                    <input v-model="f2Certification" placeholder="Certification (ex: TOSA, ICDL, VOLTAIRE...)" class="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20" />
                    <p v-if="newRule.formation2" class="text-[10px] text-slate-400 font-bold px-1">→ <span class="text-slate-700">{{ newRule.formation2 }}</span></p>
                  </div>
                  <div v-else class="space-y-4">
                    <input v-model="newRule.formation2" placeholder="ex: Parcours alternative" class="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20" />
                  </div>
                </div>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Certification délivrée</label>
                <input v-model="newRule.certification" placeholder="ex: RS5432 - TOEIC Listening & Reading" class="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Intitulé du parcours</label>
              <input v-model="newRule.parcoursTitle" placeholder="ex: Parcours Anglais Professionnel" class="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20" />
              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">Titre affiché en grand sur la page de résultats.</p>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <span class="material-icons-outlined text-[14px] text-amber-500">info</span>
                Message explicatif (optionnel)
              </label>
              <textarea
                v-model="newRule.explanationMessage"
                rows="4"
                placeholder="Ex: Vous avez validé le niveau Basique. Ce parcours vous permettra de consolider vos acquis et d'atteindre le niveau Opérationnel..."
                class="w-full px-5 py-3 bg-amber-50 border-2 border-amber-100 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 leading-relaxed resize-none text-slate-700"
              ></textarea>
              <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">Affiché à la fin du test de positionnement et sur la page de résultats pour expliquer ce parcours recommandé.</p>
            </div>
          </div>
        </div>

        <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button @click="showForm = false" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Annuler</button>
          <button @click="saveRule" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95">
            {{ editingRule ? "Enregistrer" : "Créer la règle" }}
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
select { background-image: none; }
</style>
