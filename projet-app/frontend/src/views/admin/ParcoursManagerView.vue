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
  condition: "",
  formation1: "",
  formation2: "",
  order: 0,
  requirePrerequisiteFailure: false,
});

// Dynamic helpers for form building
const selectedFormationLevels = ref([]);
const conditionLevel = ref("");
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
    condition: "",
    formation1: "",
    formation2: "",
    order: filteredRules.value.length,
    requirePrerequisiteFailure: false,
  };
  showForm.value = true;
}

// Flag to prevent watches from resetting values during modal initialization
let isInitializingForm = false;

async function openEditForm(rule) {
  isInitializingForm = true;
  editingRule.value = rule;
  newRule.value = { 
    ...rule,
    requirePrerequisiteFailure: !!rule.requirePrerequisiteFailure
  };
  
  // Fetch levels first so dropdowns are populated and enabled
  if (rule.formation) {
    await fetchLevelsForFormation(rule.formation);
  }

  // Parse condition
  const condMatch = rule.condition.match(/[=≤<] (.*)$/);
  conditionLevel.value = condMatch ? condMatch[1] : "";

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
    await fetchLevelsForFormation(val);
  } else {
    selectedFormationLevels.value = [];
  }
  // Reset dependent fields ONLY if we are not initializing the form (editing)
  if (!isInitializingForm) {
    conditionLevel.value = "";
    f1Level.value = "";
    f2Level.value = "";
  }
});

// Auto-build condition string when conditionLevel changes
watch(conditionLevel, (val) => {
  if (val && !isInitializingForm) {
    newRule.value.condition = `Si résultat du test = ${val}`;
  }
});

// Auto-build formation1 string
watch([f1Formation, f1Level], ([form, level]) => {
  if (isInitializingForm) return;
  if (form && level) {
    newRule.value.formation1 = `${form} ${level}`;
  } else if (form) {
    newRule.value.formation1 = form;
  }
});

// Auto-build formation2 string
watch([f2Formation, f2Level], ([form, level]) => {
  if (isInitializingForm) return;
  if (form && level) {
    newRule.value.formation2 = `${form} ${level}`;
  } else if (form) {
    newRule.value.formation2 = form;
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
  await Promise.all([fetchFormations(), fetchRules()]);
});
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl md:text-3xl font-black heading-primary uppercase">Gestion du Catalogue</h2>
        <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Fiche formation & Règles de parcours associées
        </p>
      </div>

      <div class="flex flex-wrap gap-4 items-center">
        <!-- Category Filter -->
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</span>
          <select 
            v-model="selectedCategory"
            class="px-4 py-3 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            <option value="all">Toutes</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Formation Selector -->
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Formation</span>
          <select 
            v-model="activeFormationId"
            @change="(e) => selectFormation(formationsList.find(f => f.id === Number(e.target.value)))"
            class="px-4 py-3 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-w-[200px]"
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
        <div class="flex items-center gap-2 bg-white p-2 rounded-[32px] shadow-sm border border-gray-50 w-fit">
          <button
            @click="activeTab = 'details'"
            class="px-8 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all"
            :class="activeTab === 'details' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50 font-bold'"
          >
            Paramètres Fiche
          </button>
          <button
            @click="activeTab = 'rules'"
            class="px-8 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all"
            :class="activeTab === 'rules' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50 font-bold'"
          >
            Règles Parcours
          </button>
        </div>

        <div v-if="activeTab === 'details'" class="animate-fade-in">
          <div class="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
            <div class="p-10 space-y-10">
               <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    :style="{ backgroundColor: formationForm.color + '20', color: formationForm.color }">
                    <span class="material-icons-outlined text-2xl">settings</span>
                  </div>
                  <div>
                    <h3 class="text-xl font-black heading-primary uppercase tracking-tight">Configuration de la Fiche</h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Éditez les infos catalogue pour {{ formationForm.label }}</p>
                  </div>
                </div>
                <button @click="saveFormationSettings" class="px-6 py-3 bg-brand-primary text-[#428496] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                  Sauvegarder Fiche
                </button>
               </div>

               <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Titre Catalogue</label>
                    <input v-model="formationForm.label" class="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Catégorie</label>
                    <input v-model="formationForm.category" class="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm" />
                  </div>
                   <div class="space-y-2">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Couleur & Icône</label>
                    <div class="flex gap-3">
                      <input type="color" v-model="formationForm.color" class="w-12 h-12 rounded-xl border-none cursor-pointer" />
                      <input v-model="formationForm.icon" class="flex-1 px-5 py-3.5 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm" placeholder="Icône Material" />
                    </div>
                  </div>
               </div>

               <!-- Levels in Details Tab -->
               <div class="space-y-6 pt-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-black uppercase tracking-widest text-gray-700">Paliers de Compétence</h4>
                    <button @click="addFormationLevel" class="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl transition-all">Ajouter niveau</button>
                  </div>
                  <div class="grid grid-cols-1 gap-4">
                    <div v-for="(lvl, idx) in formationForm.levels" :key="idx" class="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100 group transition-all" :class="!lvl.isActive ? 'opacity-50 grayscale' : ''">
                      <div class="flex items-center gap-3 flex-1">
                        <input type="number" v-model="lvl.order" class="w-12 h-10 bg-white rounded-xl text-center font-bold text-xs" title="Ordre" />
                        <input type="text" v-model="lvl.label" class="flex-1 h-10 bg-white rounded-xl px-4 font-bold text-xs" placeholder="Label" />
                        <input type="number" v-model="lvl.successThreshold" class="w-16 h-10 bg-white rounded-xl text-center font-bold text-xs" title="Seuil" />
                      </div>
                      <div class="flex items-center gap-4 justify-between sm:justify-end">
                        <label class="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                          <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ lvl.isActive !== false ? 'Actif' : 'Inactif' }}</span>
                          <div class="relative inline-block w-8 h-4 rounded-full transition-colors duration-200" :class="lvl.isActive !== false ? 'bg-green-400' : 'bg-gray-300'">
                            <input type="checkbox" v-model="lvl.isActive" class="opacity-0 w-0 h-0" />
                            <span class="absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform duration-200" :class="lvl.isActive !== false ? 'transform translate-x-4' : ''"></span>
                          </div>
                        </label>
                        <button @click="removeFormationLevel(idx)" class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                          <span class="material-icons-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'rules'" class="animate-fade-in space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-black heading-primary uppercase tracking-tight">Règles de Redirection</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Définissez où envoyer l'utilisateur selon son score à {{ currentFormation.label }}</p>
            </div>
            <div class="flex gap-3">
              <div class="relative min-w-[200px]">
                <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input
                  v-model="searchTerm"
                  type="search"
                  placeholder="Chercher..."
                  class="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-2xl text-[10px] font-bold transition-all shadow-sm uppercase tracking-widest"
                />
              </div>
              <button
                @click="openNewForm"
                class="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all"
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
    <div v-else-if="filteredRules.length" class="bg-white rounded-[40px] shadow-sm overflow-x-auto">
      <table class="w-full min-w-max text-left">
        <thead>
          <tr class="border-b border-gray-50 bg-gray-50/50">
            <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">#</th>
            <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Condition</th>
            <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Formation 1</th>
            <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Formation 2</th>
            <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fail Prereq?</th>
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
            <td class="px-8 py-5 text-xs font-black text-gray-300">{{ idx + 1 }}</td>
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
              <span v-if="rule.requirePrerequisiteFailure" class="text-[10px] font-black text-red-500 uppercase">OUI</span>
              <span v-else class="text-[10px] font-bold text-gray-300 uppercase">NON</span>
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

    <!-- Empty State -->
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
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative overflow-hidden animate-scale-up">
        <div class="p-8 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-xl font-black heading-primary">
            {{ editingRule ? "Modifier la règle" : "Nouvelle règle de parcours" }}
          </h3>
          <button @click="showForm = false" class="text-gray-300 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl p-2">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="p-8 space-y-6">
          <div>
            <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Formation concernée</label>
            <select
              v-model="newRule.formation"
              class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
            >
              <option value="" disabled>Sélectionnez une formation</option>
              <option v-for="f in formationsList" :key="f.id" :value="f.label">{{ f.label }}</option>
            </select>
          </div>

          <div>
            <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Condition (Niveau du test)</label>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-gray-500 whitespace-nowrap">Si résultat =</span>
              <select
                v-model="conditionLevel"
                class="flex-1 px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
                :disabled="!selectedFormationLevels.length"
              >
                <option value="" disabled>Choisir un niveau</option>
                <option v-for="lvl in selectedFormationLevels" :key="lvl.id" :value="lvl.label">{{ lvl.label }}</option>
              </select>
            </div>
            <input
              v-model="newRule.condition"
              type="text"
              class="w-full mt-2 px-4 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 outline-none focus:border-brand-primary"
              placeholder="Condition générée automatiquement (modifiable)"
            />
          </div>

          <div class="flex items-center gap-3 p-4 bg-red-50/50 rounded-2xl border border-red-100">
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
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Formation 1</label>
              <select
                v-model="f1Formation"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
              >
                <option value="" disabled>Formation</option>
                <option v-for="f in formationsList" :key="f.id" :value="f.label">{{ f.label }}</option>
              </select>
              <select
                v-model="f1Level"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
                :disabled="!selectedFormationLevels.length"
              >
                <option value="" disabled>Niveau</option>
                <option v-for="lvl in selectedFormationLevels" :key="lvl.id" :value="lvl.label">{{ lvl.label }}</option>
              </select>
              <input
                v-model="newRule.formation1"
                type="text"
                class="w-full px-3 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 outline-none focus:border-brand-primary"
                placeholder="Valeur générée"
              />
            </div>
            <div class="space-y-3">
              <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Formation 2</label>
              <select
                v-model="f2Formation"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
              >
                <option value="" disabled>Formation</option>
                <option v-for="f in formationsList" :key="f.id" :value="f.label">{{ f.label }}</option>
              </select>
              <select
                v-model="f2Level"
                class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all bg-white"
                :disabled="!selectedFormationLevels.length"
              >
                <option value="" disabled>Niveau</option>
                <option v-for="lvl in selectedFormationLevels" :key="lvl.id" :value="lvl.label">{{ lvl.label }}</option>
              </select>
              <input
                v-model="newRule.formation2"
                type="text"
                class="w-full px-3 py-2 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 outline-none focus:border-brand-primary"
                placeholder="Valeur générée"
              />
            </div>
          </div>
          <div>
            <label class="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2">Ordre d'affichage</label>
            <input
              v-model.number="newRule.order"
              type="number"
              class="w-24 px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-primary transition-all"
            />
          </div>
          <button
            @click="saveRule"
            class="w-full py-4 btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all"
          >
            {{ editingRule ? "Enregistrer les modifications" : "Ajouter la règle" }}
          </button>
      </div>
    </div>
  </div>
</template>
