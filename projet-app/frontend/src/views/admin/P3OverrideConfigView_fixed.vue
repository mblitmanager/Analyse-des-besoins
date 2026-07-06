<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useAppStore } from "../../stores/app";
import { useToastStore } from "../../stores/toast";

const appStore = useAppStore();
const toast = useToastStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = () => localStorage.getItem("admin_token");

const loading = ref(true);
const saving = ref(false);

// P3 Override state
const overrideEnabled = ref(false);
const allRules = ref([]);
const allFormations = ref([]);

// Form state for creating/editing rules
const showForm = ref(false);
const editingRule = ref(null);
const newRule = ref({
  formation: "",
  formationId: null,
  condition: "",
  conditionP1: "",
  conditionP2: "",
  formation1: "",
  formation2: "",
  order: 0,
  isActive: true,
  certification: "",
  explanationMessage: "",
  parcoursTitle: "",
});

// Dynamic helpers for form building
const selectedFormationLevels = ref([]);
const conditionLevel = ref("");
const conditionOperator = ref("=");

// Filter rules by selected formation
const currentFormation = ref(null);
const filteredRules = computed(() => {
  const activeRules = allRules.value.filter(rule => rule.isActive !== false);
  if (!currentFormation.value) return activeRules;
  return activeRules.filter(r =>
    r.formation === currentFormation.value.label ||
    (currentFormation.value.id && r.formationId === currentFormation.value.id)
  );
});

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`, { 
      headers: { Authorization: `Bearer ${token()}` } 
    });
    allFormations.value = (res.data || []).filter(f => f.isActive !== false);
    if (allFormations.value.length > 0) {
      currentFormation.value = allFormations.value[0];
    }
  } catch (error) {
    console.error("Failed to load formations:", error);
  }
}

async function fetchRules() {
  loading.value = true;
  try {
    const [enabledRes, rulesRes] = await Promise.all([
      appStore.fetchSetting('P3_OVERRIDE_ENABLED', { force: true }),
      axios.get(`${apiBaseUrl}/p3-override?activeOnly=true`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    
    overrideEnabled.value = enabledRes === 'true';
    allRules.value = (rulesRes.data || []).filter(rule => rule.isActive !== false);
  } catch (e) {
    console.error("Failed to load P3 override rules:", e);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  saving.value = true;
  try {
    const headers = { Authorization: `Bearer ${token()}` };
    
    // Save enabled state
    await axios.patch(`${apiBaseUrl}/settings/P3_OVERRIDE_ENABLED`, 
      { value: overrideEnabled.value ? 'true' : 'false' }, 
      { headers }
    );
    
    appStore.invalidateSetting('P3_OVERRIDE_ENABLED');
    toast.success("Configuration P3 Override sauvegardée");
  } catch (e) {
    toast.error("Erreur lors de la sauvegarde: " + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
}

async function saveRule() {
  saving.value = true;
  try {
    const headers = { Authorization: `Bearer ${token()}` };
    const payload = { ...newRule.value };
    
    // Build condition string from operator and level
    if (conditionLevel.value) {
      payload.condition = `${conditionOperator.value} ${conditionLevel.value}`;
    }
    
    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/p3-override/${editingRule.value.id}`, payload, { headers });
      toast.success("Règle mise à jour");
    } else {
      await axios.post(`${apiBaseUrl}/p3-override`, payload, { headers });
      toast.success("Règle créée");
    }
    
    showForm.value = false;
    editingRule.value = null;
    await fetchRules();
  } catch (e) {
    toast.error("Erreur lors de la sauvegarde: " + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
}

async function deleteRule(id) {
  if (!confirm("Supprimer cette règle ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/p3-override/${id}`, { 
      headers: { Authorization: `Bearer ${token()}` } 
    });
    toast.success("Règle supprimée");
    await fetchRules();
  } catch (e) {
    toast.error("Erreur lors de la suppression");
  }
}

function openNewForm() {
  editingRule.value = null;
  newRule.value = {
    formation: currentFormation.value?.label || "",
    formationId: currentFormation.value?.id || null,
    condition: "",
    conditionP1: "",
    conditionP2: "",
    formation1: "",
    formation2: "",
    order: filteredRules.value.length,
    isActive: true,
    certification: "",
    explanationMessage: "",
    parcoursTitle: "",
  };
  conditionOperator.value = "=";
  conditionLevel.value = "";
  showForm.value = true;
  // Load levels for the selected formation
  if (currentFormation.value) {
    fetchLevelsForFormation(currentFormation.value.label);
  }
}

async function openEditForm(rule) {
  editingRule.value = rule;
  newRule.value = { 
    ...rule,
    isActive: rule.isActive !== false,
  };
  
  // Parse condition
  const condMatch = rule.condition.match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (condMatch) {
    conditionOperator.value = condMatch[1].replace('<=', '≤').replace('>=', '≥');
    conditionLevel.value = condMatch[2];
  }
  
  // Load levels for the formation
  if (rule.formation) {
    await fetchLevelsForFormation(rule.formation);
  }
  
  showForm.value = true;
}

async function fetchLevelsForFormation(formationLabel) {
  try {
    const formation = allFormations.value.find(f => f.label === formationLabel);
    if (!formation) return;
    
    const res = await axios.get(`${apiBaseUrl}/formations/${formation.slug}/levels`, { 
      headers: { Authorization: `Bearer ${token()}` } 
    });
    selectedFormationLevels.value = (res.data || []).filter(l => l.isActive !== false);
  } catch (error) {
    console.error("Failed to load levels:", error);
  }
}

onMounted(async () => {
  await fetchFormations();
  await fetchRules();
});
</script>

<template>
  <div class="space-y-10 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">P3 Override — Règles par Formation</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Configurer les formations proposées en P3 selon le niveau validé
        </p>
      </div>
    </div>

    <!-- Status Banner -->
    <div :class="['rounded-3xl p-6 border transition-all', overrideEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200']">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center', overrideEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400']">
            <span class="material-icons-outlined text-xl">{{ overrideEnabled ? 'check_circle' : 'toggle_off' }}</span>
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">{{ overrideEnabled ? 'Override actif' : 'Override désactivé' }}</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">
              {{ overrideEnabled 
                ? 'Les règles P3 override sont appliquées pour forcer les choix de formation' 
                : 'Le comportement P3 standard est utilisé'
              }}
            </p>
          </div>
        </div>
        <button @click="overrideEnabled = !overrideEnabled" 
          :class="['w-14 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer', overrideEnabled ? 'bg-emerald-500' : 'bg-slate-300']">
          <div :class="['w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300', overrideEnabled ? 'translate-x-7' : 'translate-x-0']"></div>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin border-4 border-slate-200 border-t-slate-900 rounded-full h-10 w-10"></div>
    </div>

    <!-- Configuration Panel -->
    <div v-else class="space-y-8">
      <!-- Formation Selector -->
      <div class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span class="material-icons-outlined text-sm">school</span>
          </div>
          <div>
            <h3 class="text-sm font-black text-slate-900">Sélectionner une formation</h3>
            <p class="text-[10px] text-slate-400">Afficher les règles P3 override pour cette formation</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="formation in allFormations" 
            :key="formation.id"
            @click="currentFormation = formation"
            :class="[
              'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              currentFormation?.id === formation.id 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            {{ formation.label }}
          </button>
        </div>
      </div>

      <!-- Rules Table -->
      <div v-if="currentFormation" class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <span class="material-icons-outlined text-sm">rule</span>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900">Règles P3 Override — {{ currentFormation.label }}</h3>
              <p class="text-[10px] text-slate-400">{{ filteredRules.length }} règle(s) configurée(s)</p>
            </div>
          </div>
          <button 
            @click="openNewForm"
            class="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <span class="material-icons-outlined text-sm">add</span>
            Nouvelle règle
          </button>
        </div>

        <div v-if="filteredRules.length === 0" class="py-24 bg-white flex flex-col items-center justify-center text-slate-300">
           <span class="material-icons-outlined text-6xl mb-4 opacity-10">rule</span>
           <p class="text-xs font-black uppercase tracking-widest">Aucune règle définie pour {{ currentFormation.label }}</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-50">
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordre</th>
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition Niveau</th>
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">P1</th>
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">P2</th>
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Formation P3</th>
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternative</th>
                <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="rule in filteredRules.sort((a,b) => (a.order||0) - (b.order||0))" :key="rule.id" class="group hover:bg-slate-50/50 transition-all" :class="rule.isActive === false ? 'opacity-40 grayscale' : ''">
                <td class="px-8 py-6">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{{ rule.order }}</div>
                </td>
                <td class="px-8 py-6">
                  <span class="text-xs font-black text-slate-900">{{ rule.condition }}</span>
                </td>
                <td class="px-8 py-6">
                  <span class="text-xs font-black text-slate-700">{{ rule.conditionP1 || '-' }}</span>
                </td>
                <td class="px-8 py-6">
                  <span class="text-xs font-black text-slate-700">{{ rule.conditionP2 || '-' }}</span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex flex-col gap-1">
                    <span class="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg w-fit shadow-sm">{{ rule.formation1 }}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span v-if="rule.formation2" class="px-2.5 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg">{{ rule.formation2 }}</span>
                  <span v-else class="text-slate-300 text-[8px] italic">-</span>
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button @click="openEditForm(rule)" class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white flex items-center justify-center transition-all">
                      <span class="material-icons-outlined text-sm">edit</span>
                    </button>
                    <button @click="deleteRule(rule.id)" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                      <span class="material-icons-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button 
          @click="saveConfig" 
          :disabled="saving"
          class="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50"
        >
          <span class="material-icons-outlined text-sm">{{ saving ? 'autorenew' : 'save' }}</span>
          {{ saving ? 'Enregistrement...' : 'Sauvegarder la configuration' }}
        </button>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-black text-slate-900">{{ editingRule ? 'Modifier la règle' : 'Nouvelle règle P3 Override' }}</h3>
          <button @click="showForm = false" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
            <span class="material-icons-outlined text-sm">close</span>
          </button>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Formation</label>
            <input v-model="newRule.formation" disabled class="w-full px-5 py-3 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-500" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Condition P1</label>
              <input
                v-model="newRule.conditionP1"
                placeholder="ex: Renforcement WORD"
                class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Condition P2</label>
              <input
                v-model="newRule.conditionP2"
                placeholder="ex: Essentiels WORD + EXCEL"
                class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Opérateur</label>
              <select v-model="conditionOperator" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all">
                <option value="=">=</option>
                <option value="<"><</option>
                <option value="<=">≤</option>
                <option value=">">></option>
                <option value=">=">≥</option>
              </select>
            </div>
            <div class="col-span-2 space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Niveau</label>
              <select v-model="conditionLevel" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all">
                <option value="">Sélectionner un niveau...</option>
                <option v-for="level in selectedFormationLevels" :key="level.id" :value="level.label">{{ level.label }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Formation P3 proposée</label>
            <input v-model="newRule.formation1" placeholder="ex: TOSA Word Opérationnel" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Formation alternative (optionnel)</label>
            <input v-model="newRule.formation2" placeholder="ex: TOSA Word Avancé" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Intitulé du parcours</label>
            <input v-model="newRule.parcoursTitle" placeholder="ex: Parcours Word Avancé" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Certification délivrée</label>
            <input v-model="newRule.certification" placeholder="ex: RS5432 - TOEIC Listening & Reading" class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <span class="material-icons-outlined text-[14px] text-amber-500">info</span>
              Message explicatif (optionnel)
            </label>
            <textarea
              v-model="newRule.explanationMessage"
              rows="3"
              placeholder="Ex: Ce parcours vous permettra de consolider vos compétences..."
              class="w-full px-5 py-3 bg-amber-50 border-2 border-amber-100 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 leading-relaxed resize-none text-slate-700"
            ></textarea>
          </div>

          <div class="flex items-center gap-3">
            <input type="checkbox" v-model="newRule.isActive" id="isActive" class="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label for="isActive" class="text-sm font-bold text-slate-700">Règle active</label>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="showForm = false" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
            Annuler
          </button>
          <button @click="saveRule" :disabled="saving" class="px-6 py-3 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all disabled:opacity-50">
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>
