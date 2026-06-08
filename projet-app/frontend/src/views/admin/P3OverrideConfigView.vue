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
const overrideFormations = ref(["", ""]);

// Available formations for autocomplete
const allFormations = ref([]);
const allParcoursRules = ref([]);

// Quick-add from parcours rules
const availableLabels = computed(() => {
  const labels = new Set();
  allParcoursRules.value.forEach(r => {
    if (r.formation1) labels.add(r.formation1);
    if (r.formation2) labels.add(r.formation2);
  });
  allFormations.value.forEach(f => {
    if (f.label) labels.add(f.label);
    if (f.levels) {
      f.levels.forEach(l => {
        labels.add(`${f.label} ${l.label}`);
      });
    }
  });
  return [...labels].sort();
});

async function fetchConfig() {
  loading.value = true;
  try {
    const [enabledRes, formationsRes, allFormsRes, rulesRes] = await Promise.all([
      appStore.fetchSetting('P3_OVERRIDE_ENABLED', { force: true }),
      appStore.fetchSetting('P3_OVERRIDE_FORMATIONS', { force: true }),
      axios.get(`${apiBaseUrl}/formations`, { headers: { Authorization: `Bearer ${token()}` } }),
      axios.get(`${apiBaseUrl}/parcours`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    
    overrideEnabled.value = enabledRes === 'true';
    
    if (formationsRes) {
      try {
        const parsed = JSON.parse(formationsRes);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          overrideFormations.value = parsed;
        }
      } catch (e) {
        // Invalid JSON, keep defaults
      }
    }
    
    allFormations.value = allFormsRes.data || [];
    allParcoursRules.value = rulesRes.data || [];
  } catch (e) {
    console.error("Failed to load P3 override config:", e);
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
    
    // Save formations array (filter empty entries, keep at least the non-empty ones)
    const validFormations = overrideFormations.value.filter(f => f.trim() !== '');
    await axios.patch(`${apiBaseUrl}/settings/P3_OVERRIDE_FORMATIONS`, 
      { value: JSON.stringify(validFormations) }, 
      { headers }
    );
    
    appStore.invalidateSetting('P3_OVERRIDE_ENABLED');
    appStore.invalidateSetting('P3_OVERRIDE_FORMATIONS');
    
    toast.success("Configuration P3 Override sauvegardée");
  } catch (e) {
    toast.error("Erreur lors de la sauvegarde: " + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
}

function addFormationChoice() {
  overrideFormations.value.push("");
}

function removeFormationChoice(index) {
  if (overrideFormations.value.length <= 2) {
    toast.error("Minimum 2 formations requises");
    return;
  }
  overrideFormations.value.splice(index, 1);
}

onMounted(fetchConfig);
</script>

<template>
  <div class="space-y-10 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">P3 Override — Formations Forcées</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Configurer les formations proposées au choix lors du 3ème parcours
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
                ? 'Les utilisateurs verront un choix forcé entre les formations ci-dessous en P3' 
                : 'Le comportement P3 standard est utilisé (logique automatique)'
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
      <!-- Formations Choices -->
      <div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span class="material-icons-outlined text-sm">format_list_numbered</span>
            </div>
            <div>
              <h3 class="text-sm font-black text-slate-900">Formations au choix</h3>
              <p class="text-[10px] text-slate-400">L'utilisateur choisira parmi ces options en P3</p>
            </div>
          </div>
          <button @click="addFormationChoice" class="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-1.5">
            <span class="material-icons-outlined text-sm">add</span>
            Ajouter
          </button>
        </div>

        <div class="space-y-4">
          <div v-for="(choice, idx) in overrideFormations" :key="idx" class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <span class="text-[11px] font-black text-slate-500">{{ idx + 1 }}</span>
            </div>
            <div class="flex-1 relative">
              <input 
                v-model="overrideFormations[idx]"
                type="text"
                :placeholder="`Formation ${idx + 1} (ex: TOSA Excel Basique)`"
                class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                list="formation-suggestions"
              />
            </div>
            <button 
              v-if="overrideFormations.length > 2"
              @click="removeFormationChoice(idx)" 
              class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shrink-0"
            >
              <span class="material-icons-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Datalist for autocomplete -->
        <datalist id="formation-suggestions">
          <option v-for="label in availableLabels" :key="label" :value="label" />
        </datalist>

        <!-- Help Text -->
        <div class="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <div class="flex items-start gap-3">
            <span class="material-icons-outlined text-amber-500 text-lg mt-0.5">info</span>
            <div class="text-[11px] text-amber-700 leading-relaxed space-y-1">
              <p class="font-bold">Comment ça marche :</p>
              <ul class="list-disc pl-4 space-y-1">
                <li>Quand l'override est <strong>activé</strong>, l'utilisateur en P3 voit un modal avec ces choix au lieu de la grille de formations</li>
                <li>Il sélectionne l'une des formations → la session est finalisée directement (pas de quiz)</li>
                <li>Le bouton "Choisir manuellement" permet quand même de voir la grille normale si besoin</li>
                <li>Quand l'override est <strong>désactivé</strong>, la logique P3 standard s'applique (filtres, niveaux, quiz...)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="overrideFormations.filter(f => f.trim()).length >= 2" class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <span class="material-icons-outlined text-sm">preview</span>
          </div>
          <h3 class="text-sm font-black text-slate-900">Aperçu du choix utilisateur</h3>
        </div>
        
        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <p class="text-center text-sm text-slate-500 mb-4 font-medium">Choisissez la formation pour votre 3ème parcours :</p>
          <div class="space-y-3 max-w-sm mx-auto">
            <div 
              v-for="(choice, idx) in overrideFormations.filter(f => f.trim())" 
              :key="idx"
              class="flex items-center gap-3 p-4 rounded-xl border-2 border-indigo-200 bg-white"
            >
              <div class="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                <div v-if="idx === 0" class="w-3 h-3 rounded-full bg-indigo-500"></div>
              </div>
              <span class="text-sm font-bold text-slate-800">{{ choice }}</span>
            </div>
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
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>
