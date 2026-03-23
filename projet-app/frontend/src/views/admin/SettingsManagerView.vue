<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAppStore } from "../../stores/app";

const appStore = useAppStore();
const settings = ref([]);
const loading = ref(true);
const saving = ref(false);
const workflowSteps = ref([]);
const savingWorkflow = ref(false);
const newStep = ref({ code: '', label: '', route: '' });
const token = localStorage.getItem("admin_token");
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const getSettingIcon = (key) => {
  if (key.includes('AUTO_SKIP')) return 'fast_forward';
  if (key.includes('EMAIL')) return 'mail';
  if (key.includes('PHONE')) return 'phone';
  if (key.includes('PLATFORM')) return 'branding_watermark';
  if (key.includes('PAGINATED')) return 'auto_stories';
  if (key === 'ENABLE_P3') return 'add_circle';
  if (key === 'ENABLE_REFERRAL') return 'group_add';
  return 'settings';
};

const getSettingColor = (key) => {
  if (key.includes('AUTO_SKIP')) return 'bg-amber-100 text-amber-600';
  if (key.includes('EMAIL')) return 'bg-blue-100 text-blue-600';
  if (key.includes('PHONE')) return 'bg-emerald-100 text-emerald-600';
  if (key.includes('PLATFORM')) return 'bg-purple-100 text-purple-600';
  if (key.includes('PAGINATED')) return 'bg-indigo-100 text-indigo-600';
  if (key === 'ENABLE_P3') return 'bg-emerald-100 text-emerald-600';
  if (key === 'ENABLE_REFERRAL') return 'bg-sky-100 text-sky-600';
  return 'bg-slate-100 text-slate-600';
};

const isBoolean = (value) => value === 'true' || value === 'false';

async function toggleSetting(setting) {
  const newValue = setting.value === 'true' ? 'false' : 'true';
  setting.value = newValue; 
  await saveSetting(setting.key, newValue);
}

async function fetchSettings() {
  try {
    const [settingsRes, workflowRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/settings`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${apiBaseUrl}/workflow?all=true`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    settings.value = settingsRes.data;
    workflowSteps.value = workflowRes.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
  } finally {
    loading.value = false;
  }
}

async function saveSetting(key, value) {
  saving.value = true;
  try {
    await axios.patch(
      `${apiBaseUrl}/settings/${key}`,
      { value },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (error) {
    alert("Erreur lors de l'enregistrement");
  } finally {
    saving.value = false;
  }
}

async function saveWorkflowOrder() {
  savingWorkflow.value = true;
  try {
    const payload = workflowSteps.value.map((step, index) => ({
      id: step.id,
      order: index
    }));
    await axios.put(`${apiBaseUrl}/workflow/order`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await appStore.fetchWorkflow(); 
    alert("Configuration du workflow enregistrée !");
  } catch (error) {
    console.error("Erreur workflow", error);
    alert("Erreur lors de la mise à jour.");
  } finally {
    savingWorkflow.value = false;
  }
}

async function createWorkflowStep() {
  if (!newStep.value.label || !newStep.value.route) {
    alert('Informations manquantes');
    return;
  }
  try {
    const payload = { ...newStep.value };
    await axios.post(`${apiBaseUrl}/workflow`, payload, { headers: { Authorization: `Bearer ${token}` } });
    await fetchSettings();
    await appStore.fetchWorkflow();
    newStep.value = { code: '', label: '', route: '' };
  } catch (error) {
    console.error('Erreur création étape', error);
  }
}

async function deleteWorkflowStep(step) {
  const isHardDelete = step.isActive === false;
  if (!confirm(isHardDelete ? 'Supprimer définitivement ?' : 'Désactiver ?')) return;
  try {
    await axios.delete(`${apiBaseUrl}/workflow/${step.id}`, { headers: { Authorization: `Bearer ${token}` } });
    await fetchSettings();
    await appStore.fetchWorkflow();
  } catch (error) {
    console.error('Erreur suppression étape', error);
  }
}

async function toggleStepActive(step) {
  try {
    const newStatus = !step.isActive;
    await axios.put(`${apiBaseUrl}/workflow/${step.id}`, { isActive: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
    step.isActive = newStatus;
    await appStore.fetchWorkflow();
  } catch (error) {
    console.error('Erreur toggle étape', error);
  }
}

function moveStep(index, direction) {
  if (direction === -1 && index > 0) {
    const temp = workflowSteps.value[index];
    workflowSteps.value[index] = workflowSteps.value[index - 1];
    workflowSteps.value[index - 1] = temp;
  } else if (direction === 1 && index < workflowSteps.value.length - 1) {
    const temp = workflowSteps.value[index];
    workflowSteps.value[index] = workflowSteps.value[index + 1];
    workflowSteps.value[index + 1] = temp;
  }
}

onMounted(fetchSettings);
</script>

<template>
  <div class="space-y-12 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="space-y-1">
      <h2 class="text-3xl font-black text-slate-900 tracking-tight">Configuration Système</h2>
      <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
        Paramètres globaux et Orchestration du Workflow Candidat
      </p>
    </div>

    <!-- Settings Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="loading" class="contents">
        <div v-for="i in 6" :key="i" class="h-48 bg-white border border-slate-100 rounded-[32px] animate-pulse"></div>
      </div>

      <div 
        v-else 
        v-for="s in settings" 
        :key="s.key"
        class="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group relative overflow-hidden"
      >
        <div class="space-y-6">
          <div class="flex items-start justify-between">
            <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg shadow-current/10', getSettingColor(s.key)]">
              <span class="material-icons-outlined text-2xl">{{ getSettingIcon(s.key) }}</span>
            </div>
            
            <div v-if="isBoolean(s.value)" @click="toggleSetting(s)" class="cursor-pointer">
              <div :class="['w-12 h-6.5 rounded-full p-1 transition-colors duration-300', s.value === 'true' ? 'bg-slate-900' : 'bg-slate-200']">
                <div :class="['w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-300 transform', s.value === 'true' ? 'translate-x-5.5' : 'translate-x-0']"></div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-relaxed">{{ s.description || s.key }}</h3>
            <p class="text-[9px] text-slate-400 font-bold mt-1 opacity-60">{{ s.key }}</p>
          </div>
        </div>

        <div class="pt-8">
          <div v-if="!isBoolean(s.value)" class="space-y-3">
            <input
              v-model="s.value"
              type="text"
              class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-inner"
              placeholder="Valeur du réglage..."
            />
            <button
              @click="saveSetting(s.key, s.value)"
              class="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              Enregistrer
            </button>
          </div>
          <div v-else class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full animate-pulse" :class="s.value === 'true' ? 'bg-emerald-500' : 'bg-slate-300'"></div>
            <p class="text-[9px] font-black uppercase tracking-widest" :class="s.value === 'true' ? 'text-emerald-500' : 'text-slate-400'">
              {{ s.value === 'true' ? 'Service Actif' : 'Désactivé' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Section -->
    <div class="pt-8 space-y-8">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Orchestration Automate</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Séquençage dynamique des étapes du parcours utilisateur
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Step Creator -->
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6 sticky top-8">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Injecter une étape</h3>
            
            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Code Unique</label>
                <input v-model="newStep.code" placeholder="ex: FINAL_TEST" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-[11px] uppercase outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Libellé Affiché</label>
                <input v-model="newStep.label" placeholder="ex: Validation Finale" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-[11px] uppercase outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div class="space-y-2">
                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Route Frontend</label>
                <input v-model="newStep.route" placeholder="ex: /final-validation" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-[11px] outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              
              <button @click="createWorkflowStep" class="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                <span class="material-icons-outlined text-sm">add_circle</span>
                Ajouter au pool
              </button>
            </div>
          </div>
        </div>

        <!-- Step List -->
        <div class="lg:col-span-8 space-y-6">
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 5" :key="i" class="h-20 bg-white border border-slate-100 rounded-3xl animate-pulse"></div>
          </div>

          <div v-else class="space-y-4 relative">
            <!-- Vertical Line -->
            <div class="absolute left-[29px] top-10 bottom-10 w-px bg-slate-100 hidden md:block"></div>

            <div
              v-for="(step, index) in workflowSteps"
              :key="step.id"
              class="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all duration-500 group relative"
              :class="!step.isActive ? 'opacity-40 grayscale' : 'hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1'"
            >
              <!-- Index Circle -->
              <div class="w-15 h-15 rounded-full bg-slate-50 border-4 border-white shadow-md flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shrink-0 z-10">
                0{{ index + 1 }}
              </div>

              <div class="flex-1 text-center md:text-left">
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight">{{ step.label }}</h3>
                  <span v-if="index === 0" class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-md">Entrée</span>
                  <span v-if="index === workflowSteps.length - 1" class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-md">Sortie</span>
                </div>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                  <span class="material-icons-outlined text-[12px]">subdirectory_arrow_right</span>
                  {{ step.route }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button @click="toggleStepActive(step)" class="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm">
                  <span class="material-icons-outlined text-lg">{{ step.isActive ? 'visibility' : 'visibility_off' }}</span>
                </button>
                <div class="flex flex-col gap-1">
                  <button @click="moveStep(index, -1)" :disabled="index === 0" class="w-10 h-7 rounded-lg bg-slate-50 text-slate-300 hover:text-slate-900 disabled:opacity-20 transition-all flex items-center justify-center"><span class="material-icons-outlined text-sm">expand_less</span></button>
                  <button @click="moveStep(index, 1)" :disabled="index === workflowSteps.length - 1" class="w-10 h-7 rounded-lg bg-slate-50 text-slate-300 hover:text-slate-900 disabled:opacity-20 transition-all flex items-center justify-center"><span class="material-icons-outlined text-sm">expand_more</span></button>
                </div>
                <button @click="deleteWorkflowStep(step)" class="w-10 h-10 rounded-2xl bg-slate-50 text-slate-300 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm">
                  <span class="material-icons-outlined text-lg">delete_outline</span>
                </button>
              </div>
            </div>
            
            <div class="pt-10 flex justify-center">
              <button
                @click="saveWorkflowOrder"
                :disabled="savingWorkflow"
                class="px-12 py-5 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <span class="material-icons-outlined text-sm">save_as</span>
                {{ savingWorkflow ? 'Synchro en cours...' : 'Appliquer la nouvelle séquence' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.shadow-current\/10 { --tw-shadow: 0 10px 15px -3px rgb(var(--tw-shadow-color) / 0.1); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
</style>
