<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useAppStore } from "../../stores/app";
import { useToastStore } from "../../stores/toast";
import RuleCard from "../../components/RuleCard.vue";
import FormationSelector from "../../components/FormationSelector.vue";

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
const allParcoursRules = ref([]);

// Form state for creating/editing rules
const showForm = ref(false);
const editingRule = ref(null);

// Refs pour les 3 champs de formation1 et formation2
const f1Formation = ref("");
const f1Level = ref("");
const f1Certification = ref("");
const f1Manual = ref(false);
const f2Formation = ref("");
const f2Level = ref("");
const f2Certification = ref("");
const f2Manual = ref(false);

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
  requireTest: false,
  forceChoice: true,
  certification: "",
  explanationMessage: "",
  parcoursTitle: "",
});

// Dynamic helpers for form building
const selectedFormationLevels = ref([]);
const conditionLevel = ref("");
const conditionOperator = ref("=");

const parcoursConditionOptions = computed(() => {
  const values = [];
  const seen = new Set();
  const add = (value) => {
    const label = String(value || "").trim();
    const key = label.toLowerCase();
    if (!label || seen.has(key)) return;
    seen.add(key);
    values.push(label);
  };

  allParcoursRules.value
    .filter((rule) => rule.isActive !== false)
    .forEach((rule) => {
      add(rule.formation1);
      add(rule.formation2);
    });

  return values.sort((a, b) => a.localeCompare(b, "fr"));
});

// Filter rules by selected formation
const currentFormation = ref(null);
const showInactiveRules = ref(true);

const filteredRules = computed(() => {
  const allFilteredRules = allRules.value.filter(r => {
    if (!currentFormation.value) return true;
    return r.formation === currentFormation.value.label ||
      (r.formationId && r.formationId === currentFormation.value.id);
  });
  if (showInactiveRules.value) return allFilteredRules;
  return allFilteredRules.filter(r => r.isActive !== false);
});

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`, { 
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
    const [enabledRes, rulesRes, parcoursRes] = await Promise.all([
      appStore.fetchSetting('P3_OVERRIDE_ENABLED', { force: true }),
      axios.get(`${apiBaseUrl}/p3-override?activeOnly=true`, { headers: { Authorization: `Bearer ${token()}` } }),
      axios.get(`${apiBaseUrl}/parcours?activeOnly=true`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    
    overrideEnabled.value = enabledRes === 'true';
    allRules.value = rulesRes.data || [];
    allParcoursRules.value = (parcoursRes.data || []).filter(rule => rule.isActive !== false);
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

async function deleteRule(rule) {
  if (!confirm("Supprimer cette règle ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/p3-override/${rule.id}`, { 
      headers: { Authorization: `Bearer ${token()}` } 
    });
    toast.success("Règle supprimée");
    await fetchRules();
  } catch (e) {
    toast.error("Erreur lors de la suppression");
  }
}

async function toggleRuleActive(rule) {
  try {
    const newState = !(rule.isActive !== false);
    await axios.patch(`${apiBaseUrl}/p3-override/${rule.id}`, { isActive: newState }, { headers: { Authorization: `******` } });
    rule.isActive = newState;
    toast.success(newState ? 'Règle activée' : 'Règle désactivée');
  } catch (e) {
    console.error('Failed to toggle p3 rule active state', e);
    toast.error('Erreur lors de la mise à jour');
  }
}

// ── Helpers 3 champs formation ──
const buildTargetString = (form, level, cert = '') => {
  if (!form && !level) return '';
  const base = form && level ? `${form} ${level}` : (form || level || '');
  if (cert && cert.trim()) return `${base} (${cert.trim()})`;
  return base;
};

function parseCertificationString(value) {
  if (!value) return { formation: '', level: '', certification: '' };
  const certMatch = value.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (certMatch) {
    const beforeParen = certMatch[1].trim();
    const certification = certMatch[2].trim();
    return { formation: beforeParen, level: '', certification };
  }
  return { formation: value, level: '', certification: '' };
}

let isInitializingForm = false;

watch([f1Formation, f1Level, f1Certification], ([form, level, cert]) => {
  if (isInitializingForm || f1Manual.value) return;
  newRule.value.formation1 = buildTargetString(form, level, cert);
});

watch([f2Formation, f2Level, f2Certification], ([form, level, cert]) => {
  if (isInitializingForm || f2Manual.value) return;
  newRule.value.formation2 = buildTargetString(form, level, cert);
});

function openNewForm() {
  editingRule.value = null;
  f1Formation.value = ""; f1Level.value = ""; f1Certification.value = ""; f1Manual.value = false;
  f2Formation.value = ""; f2Level.value = ""; f2Certification.value = ""; f2Manual.value = false;
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
    requireTest: false,
    forceChoice: true,
    certification: "",
    explanationMessage: "",
    parcoursTitle: "",
  };
  conditionOperator.value = "=";
  conditionLevel.value = "";
  showForm.value = true;
  if (currentFormation.value) {
    fetchLevelsForFormation(currentFormation.value.label);
  }
}

async function openEditForm(rule) {
  isInitializingForm = true;
  editingRule.value = rule;
  newRule.value = { 
    ...rule,
    isActive: rule.isActive !== false,
    requireTest: !!rule.requireTest,
    forceChoice: rule.forceChoice !== false,
  };

  // Parser formation1 et formation2
  const p1 = parseCertificationString(rule.formation1);
  f1Formation.value = p1.formation;
  f1Level.value = p1.level;
  f1Certification.value = p1.certification;

  const p2 = parseCertificationString(rule.formation2 || '');
  f2Formation.value = p2.formation;
  f2Level.value = p2.level;
  f2Certification.value = p2.certification;
  // Parse condition
  const condMatch = String(rule.condition || "").match(/(=|<|<=|≤|>|>=|≥)\s+(.*)$/);
  if (condMatch) {
    conditionOperator.value = condMatch[1].replace('<=', '≤').replace('>=', '≥');
    conditionLevel.value = condMatch[2];
  } else {
    conditionOperator.value = "=";
    conditionLevel.value = "";
  }
  
  // Load levels for the formation
  if (rule.formation) {
    await fetchLevelsForFormation(rule.formation);
  }
  
  showForm.value = true;
  setTimeout(() => { isInitializingForm = false; }, 100);
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

watch(currentFormation, async (formation) => {
  if (!formation) {
    selectedFormationLevels.value = [];
    return;
  }
  await fetchLevelsForFormation(formation.label);
});

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
        <div>
          <FormationSelector :formations="allFormations" mode="single" :selected-id="currentFormation?.id" @update:selectedId="(id) => { currentFormation = allFormations.find(f => f.id === id) }" @select="(f) => { currentFormation = f }" />
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
          <div class="flex items-center gap-3">
            <button
              @click="showInactiveRules = !showInactiveRules"
              class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 shrink-0"
              :class="showInactiveRules
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'"
            >
              <span class="material-icons-outlined text-sm">{{ showInactiveRules ? 'visibility_off' : 'visibility' }}</span>
              {{ showInactiveRules ? 'Masquer inactifs' : 'Voir inactifs' }}
            </button>
            <button 
              @click="openNewForm"
              class="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
            >
              <span class="material-icons-outlined text-sm">add</span>
              Nouvelle règle
            </button>
          </div>
        </div>

        <div v-if="filteredRules.length === 0" class="py-24 bg-white flex flex-col items-center justify-center text-slate-300">
           <span class="material-icons-outlined text-6xl mb-4 opacity-10">rule</span>
           <p class="text-xs font-black uppercase tracking-widest">Aucune règle définie pour {{ currentFormation.label }}</p>
        </div>

        <div v-else class="p-6 space-y-4">
          <div v-for="rule in filteredRules.sort((a,b) => (a.order||0) - (b.order||0))" :key="rule.id">
            <RuleCard :rule="rule" @edit="openEditForm" @delete="deleteRule" @toggle-active="toggleRuleActive" />
          </div>
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
              <select
                v-model="newRule.conditionP1"
                class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
              >
                <option value="">Aucune condition P1</option>
                <option
                  v-for="option in parcoursConditionOptions"
                  :key="`p1-${option}`"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Condition P2</label>
              <select
                v-model="newRule.conditionP2"
                class="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
              >
                <option value="">Aucune condition P2</option>
                <option
                  v-for="option in parcoursConditionOptions"
                  :key="`p2-${option}`"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>
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
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center justify-between">
              Formation P3 proposée (Cible 1)
            </label>
            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-3">
                <select v-model="f1Formation" class="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500">
                  <option value="">Formation...</option>
                  <option v-for="f in allFormations" :key="f.id" :value="f.label">{{ f.label }}</option>
                </select>
                <input v-model="f1Level" placeholder="Parcours (ex: Basique, Opérationnel...)" class="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
              </div>
              <input v-model="f1Certification" placeholder="Certification (ex: TOSA, ICDL, INKREA...)" class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
              <p v-if="newRule.formation1" class="text-[10px] text-slate-400 font-bold px-1">→ <span class="text-slate-700">{{ newRule.formation1 }}</span></p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              Formation alternative (Cible 2 — optionnel)
            </label>
            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-3">
                <select v-model="f2Formation" class="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500">
                  <option value="">Formation...</option>
                  <option v-for="f in allFormations" :key="f.id" :value="f.label">{{ f.label }}</option>
                </select>
                <input v-model="f2Level" placeholder="Parcours (ex: Basique, Opérationnel...)" class="px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
              </div>
              <input v-model="f2Certification" placeholder="Certification (ex: TOSA, ICDL, INKREA...)" class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all" />
              <p v-if="newRule.formation2" class="text-[10px] text-slate-400 font-bold px-1">→ <span class="text-slate-700">{{ newRule.formation2 }}</span></p>
            </div>
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

          <div class="flex items-center justify-between p-4 bg-violet-50 rounded-2xl border border-violet-100">
            <div>
              <h4 class="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <span class="material-icons-outlined text-violet-500 text-sm">quiz</span>
                Obliger le test de positionnement
              </h4>
              <p class="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                Si activé, l'apprenant passera le test QCM pour ce parcours avant la validation. Le résultat du test est enregistré mais le parcours reste celui imposé ici.
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input type="checkbox" v-model="newRule.requireTest" class="sr-only peer" />
              <div class="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
            </label>
          </div>

          <!-- forceChoice : visible seulement si requireTest est actif -->
          <div v-if="newRule.requireTest" class="flex items-start justify-between p-4 bg-rose-50/60 rounded-2xl border border-rose-100 gap-4">
            <div>
              <h4 class="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <span class="material-icons-outlined text-rose-500 text-sm">lock</span>
                Imposer le choix P3 (ignorer le résultat du test)
              </h4>
              <p class="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                <strong>Activé</strong> : le parcours choisi ici est toujours affiché, peu importe le résultat du QCM.<br/>
                <strong>Désactivé</strong> : le résultat du test détermine le parcours + message indiquant que le niveau est supérieur au choix initial.
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input type="checkbox" v-model="newRule.forceChoice" class="sr-only peer" />
              <div class="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
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
