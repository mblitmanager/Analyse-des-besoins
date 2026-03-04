<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";

const rules = ref([]);
const formationsList = ref([]);
const loading = ref(true);
const activeFormation = ref("");
const searchTerm = ref("");
const editingRule = ref(null);
const showForm = ref(false);

const newRule = ref({
  formation: "",
  condition: "",
  formation1: "",
  formation2: "",
  order: 0,
});

// Dynamic helpers for form building
const selectedFormationLevels = ref([]);
const conditionLevel = ref("");
const f1Formation = ref("");
const f1Level = ref("");
const f2Formation = ref("");
const f2Level = ref("");

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const uniqueFormations = computed(() => {
  const set = new Set(rules.value.map((r) => r.formation));
  return Array.from(set).sort();
});

const filteredRules = computed(() => {
  return rules.value.filter((r) => {
    const matchesFormation = !activeFormation.value || r.formation === activeFormation.value;
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
    // Auto-select first formation
    if (!activeFormation.value && uniqueFormations.value.length > 0) {
      activeFormation.value = uniqueFormations.value[0];
    }
  } catch (error) {
    console.error("Failed to fetch parcours rules:", error);
  } finally {
    loading.value = false;
  }
}

function openNewForm() {
  editingRule.value = null;
  newRule.value = {
    formation: activeFormation.value || "",
    condition: "",
    formation1: "",
    formation2: "",
    order: filteredRules.value.length,
  };
  showForm.value = true;
}

function openEditForm(rule) {
  editingRule.value = rule;
  newRule.value = { ...rule };
  // Try to parse existing values back into the helper refs
  conditionLevel.value = "";
  f1Formation.value = "";
  f1Level.value = "";
  f2Formation.value = "";
  f2Level.value = "";
  showForm.value = true;
  // Fetch levels for the formation being edited
  if (rule.formation) {
    fetchLevelsForFormation(rule.formation);
  }
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

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`);
    formationsList.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  }
}

async function fetchLevelsForFormation(label) {
  // Find the formation slug from the label
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

// Watch the formation field to auto-fetch levels
watch(() => newRule.value.formation, async (val) => {
  if (val) {
    await fetchLevelsForFormation(val);
  } else {
    selectedFormationLevels.value = [];
  }
  // Reset dependent fields
  conditionLevel.value = "";
  f1Level.value = "";
  f2Level.value = "";
});

// Auto-build condition string when conditionLevel changes
watch(conditionLevel, (val) => {
  if (val) {
    newRule.value.condition = `Si résultat du test = ${val}`;
  }
});

// Auto-build formation1 string
watch([f1Formation, f1Level], ([form, level]) => {
  if (form && level) {
    newRule.value.formation1 = `${form} ${level}`;
  } else if (form) {
    newRule.value.formation1 = form;
  }
});

// Auto-build formation2 string
watch([f2Formation, f2Level], ([form, level]) => {
  if (form && level) {
    newRule.value.formation2 = `${form} ${level}`;
  } else if (form) {
    newRule.value.formation2 = form;
  }
});

onMounted(async () => {
  await Promise.all([fetchRules(), fetchFormations()]);
});
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl md:text-3xl font-black heading-primary">Gestion des Parcours</h2>
        <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Configurez les cheminements de formation en fonction des résultats
        </p>
      </div>
      <button
        @click="openNewForm"
        class="px-6 py-3 btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg hover:bg-black transition-all w-full md:w-auto justify-center"
      >
        <span class="material-icons-outlined text-sm">add</span>
        Nouvelle règle
      </button>
    </div>

    <!-- Filters: Select + Search -->
    <div class="flex flex-wrap gap-3 items-center">
      <select
        v-model="activeFormation"
        class="px-4 py-2.5 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm min-w-[200px]"
      >
        <option value="">Toutes les formations</option>
        <option v-for="form in uniqueFormations" :key="form" :value="form">{{ form }}</option>
      </select>
      <div class="relative flex-1 min-w-[200px]">
        <span class="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Rechercher par condition ou formation..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 focus:border-brand-primary outline-none rounded-xl text-xs font-bold transition-all shadow-sm"
        />
      </div>
      <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
        {{ filteredRules.length }} règle(s)
      </span>
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
            <th class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="(rule, idx) in filteredRules"
            :key="rule.id"
            class="hover:bg-blue-50/30 transition-colors"
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
              <div class="flex gap-2 justify-end">
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
      class="flex flex-col items-center justify-center py-20 text-gray-300"
    >
      <span class="material-icons-outlined text-6xl mb-4 opacity-20">route</span>
      <p class="font-bold uppercase tracking-widest text-xs">
        Aucune règle de parcours configurée
      </p>
      <p class="text-xs text-gray-400 mt-2">
        Cliquez sur "Nouvelle règle" pour commencer
      </p>
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
  </div>
</template>
