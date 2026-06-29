<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAppStore } from "../../stores/app";
import { useToastStore } from "../../stores/toast";

const appStore = useAppStore();
const toast = useToastStore();

const workflowSteps = ref([]);
const loading = ref(true);
const savingWorkflow = ref(false);
const newStep = ref({ code: '', label: '', route: '' });
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function fetchWorkflowSteps() {
  loading.value = true;
  try {
    const token = localStorage.getItem("admin_token");
    const response = await axios.get(`${apiBaseUrl}/workflow?all=true`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    workflowSteps.value = response.data || [];
  } catch (error) {
    console.error("Failed to fetch workflow steps:", error);
    toast.error("Erreur lors du chargement des étapes");
  } finally {
    loading.value = false;
  }
}

async function saveWorkflowOrder() {
  savingWorkflow.value = true;
  try {
    const token = localStorage.getItem("admin_token");
    const payload = workflowSteps.value.map((step, index) => ({
      id: step.id,
      order: index
    }));
    await axios.put(`${apiBaseUrl}/workflow/order`, payload, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    await appStore.fetchWorkflow(); 
    toast.success("Séquence du workflow enregistrée !");
  } catch (error) {
    console.error("Erreur workflow", error);
    toast.error("Erreur lors de la mise à jour de la séquence.");
  } finally {
    savingWorkflow.value = false;
  }
}

async function createWorkflowStep() {
  if (!newStep.value.label || !newStep.value.route) {
    toast.error('Informations manquantes pour créer l\'étape');
    return;
  }
  try {
    const token = localStorage.getItem("admin_token");
    const payload = { ...newStep.value };
    await axios.post(`${apiBaseUrl}/workflow`, payload, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    newStep.value = { code: '', label: '', route: '' };
    toast.success("Nouvelle étape ajoutée au pool !");
    await fetchWorkflowSteps();
    await appStore.fetchWorkflow();
  } catch (error) {
    console.error('Erreur création étape', error);
    toast.error("Erreur lors de l'injection de l'étape");
  }
}

async function deleteWorkflowStep(step) {
  const isHardDelete = step.isActive === false;
  if (!confirm(isHardDelete ? 'Supprimer définitivement cette étape ?' : 'Désactiver cette étape ?')) return;
  try {
    const token = localStorage.getItem("admin_token");
    await axios.delete(`${apiBaseUrl}/workflow/${step.id}`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    toast.success(isHardDelete ? "Étape supprimée." : "Étape désactivée.");
    await fetchWorkflowSteps();
    await appStore.fetchWorkflow();
  } catch (error) {
    console.error('Erreur suppression étape', error);
    toast.error("Erreur lors de la suppression");
  }
}

async function toggleStepActive(step) {
  try {
    const token = localStorage.getItem("admin_token");
    const newStatus = !step.isActive;
    await axios.put(`${apiBaseUrl}/workflow/${step.id}`, { isActive: newStatus }, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    step.isActive = newStatus;
    await appStore.fetchWorkflow();
    toast.success(newStatus ? "Étape activée !" : "Étape désactivée.");
  } catch (error) {
    console.error('Erreur toggle étape', error);
    toast.error("Erreur de modification du statut");
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

onMounted(fetchWorkflowSteps);
</script>

<template>
  <div class="space-y-6 font-outfit">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-800 tracking-tight">Workflow Automate</h2>
        <p class="text-slate-500 text-sm">
          Gérez l'ordre des étapes du parcours candidat, injectez des étapes personnalisées et activez/désactivez des modules.
        </p>
      </div>
    </div>

    <!-- Workflow Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Step Creator -->
      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 sticky top-8">
          <div>
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider">Injecter une étape</h3>
            <p class="text-xs text-slate-400 mt-1">Créez une nouvelle étape de parcours personnalisée</p>
          </div>
          
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Code Unique</label>
              <input 
                v-model="newStep.code" 
                placeholder="ex: FINAL_TEST" 
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900/20" 
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Libellé Affiché</label>
              <input 
                v-model="newStep.label" 
                placeholder="ex: Validation Finale" 
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-slate-900/20" 
              />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Route Frontend</label>
              <input 
                v-model="newStep.route" 
                placeholder="ex: /final-validation" 
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-slate-900/20" 
              />
            </div>
            
            <button 
              @click="createWorkflowStep" 
              class="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span class="material-icons-outlined text-sm">add_circle</span>
              Ajouter au pool
            </button>
          </div>
        </div>
      </div>

      <!-- Step List -->
      <div class="lg:col-span-8 space-y-6">
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse"></div>
        </div>

        <div v-else class="space-y-4 relative">
          <!-- Vertical Line -->
          <div class="absolute left-[29px] top-10 bottom-10 w-px bg-slate-100 hidden md:block"></div>

          <div
            v-for="(step, index) in workflowSteps"
            :key="step.id"
            class="flex flex-col md:flex-row items-center gap-6 p-5 md:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 group relative overflow-hidden"
            :class="!step.isActive ? 'opacity-40 grayscale' : 'hover:shadow-md hover:border-slate-200 bg-gradient-to-br from-white to-slate-50/50'"
          >
            <!-- Glass Accent -->
            <div v-if="step.isActive" class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-100/20 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-slate-200/40 transition-all"></div>

            <!-- Index Circle with connector -->
            <div class="relative z-10">
              <div class="w-14 h-14 rounded-2xl bg-slate-900 border-4 border-white shadow-md flex flex-col items-center justify-center group-hover:scale-105 transition-all">
                <span class="text-xs font-black text-white leading-none">0{{ index + 1 }}</span>
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Étape</span>
              </div>
            </div>

            <div class="flex-1 text-center md:text-left z-10">
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                <h3 class="text-sm font-black text-slate-800 tracking-tight">{{ step.label }}</h3>
                <div class="flex gap-1">
                  <span v-if="index === 0" class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-full">Départ</span>
                  <span v-if="index === workflowSteps.length - 1" class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-full">Bilan</span>
                </div>
              </div>
              <div class="flex items-center justify-center md:justify-start gap-3">
                <div class="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-white shadow-sm">
                  <span class="material-icons-outlined text-[10px] text-slate-400">code</span>
                  <span class="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{{ step.code }}</span>
                </div>
                <div class="flex items-center gap-1 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/55 shadow-sm">
                  <span class="material-icons-outlined text-[10px] text-blue-500">link</span>
                  <span class="text-[9px] font-bold text-blue-600 tracking-wider">{{ step.route }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0 z-10">
              <button 
                @click="toggleStepActive(step)" 
                class="w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-95 cursor-pointer"
                :class="step.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-150 border border-slate-200'"
                :title="step.isActive ? 'Désactiver' : 'Activer'"
              >
                <span class="material-icons-outlined text-base">{{ step.isActive ? 'visibility' : 'visibility_off' }}</span>
              </button>
              <div class="flex flex-col gap-1">
                <button 
                  @click="moveStep(index, -1)" 
                  :disabled="index === 0" 
                  class="w-10 h-6 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span class="material-icons-outlined text-sm">expand_less</span>
                </button>
                <button 
                  @click="moveStep(index, 1)" 
                  :disabled="index === workflowSteps.length - 1" 
                  class="w-10 h-6 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span class="material-icons-outlined text-sm">expand_more</span>
                </button>
              </div>
              <div class="w-px h-8 bg-slate-100 mx-1"></div>
              <button 
                @click="deleteWorkflowStep(step)" 
                class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-100 active:scale-95 cursor-pointer"
                title="Supprimer"
              >
                <span class="material-icons-outlined text-base">delete_outline</span>
              </button>
            </div>
          </div>
          
          <div class="pt-6 flex justify-center">
            <button
              @click="saveWorkflowOrder"
              :disabled="savingWorkflow"
              class="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-md hover:bg-slate-800 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span class="material-icons-outlined text-sm">save_as</span>
              {{ savingWorkflow ? 'Synchro en cours...' : 'Appliquer la séquence' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
</style>
