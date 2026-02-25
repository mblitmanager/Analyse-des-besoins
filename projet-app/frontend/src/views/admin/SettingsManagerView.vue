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

const token = localStorage.getItem("admin_token");

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const getSettingIcon = (key) => {
  if (key.includes('EMAIL')) return 'mail';
  if (key.includes('PHONE')) return 'phone';
  if (key.includes('PLATFORM')) return 'branding_watermark';
  if (key.includes('PAGINATED')) return 'auto_stories';
  return 'settings';
};

const getSettingColor = (key) => {
  if (key.includes('EMAIL')) return 'text-blue-500 bg-blue-50';
  if (key.includes('PHONE')) return 'text-green-500 bg-green-50';
  if (key.includes('PLATFORM')) return 'text-purple-500 bg-purple-50';
  if (key.includes('PAGINATED')) {
    return key.includes('PREREQUIS') ? 'text-orange-500 bg-orange-50' : 'text-indigo-500 bg-indigo-50';
  }
  return 'text-gray-500 bg-gray-50';
};

const isBoolean = (value) => value === 'true' || value === 'false';

async function toggleSetting(setting) {
  const newValue = setting.value === 'true' ? 'false' : 'true';
  setting.value = newValue; // Optimistic update
  await saveSetting(setting.key, newValue);
}

async function fetchSettings() {
  try {
    const [settingsRes, workflowRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/settings`),
      axios.get(`${apiBaseUrl}/workflow`)
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
      {
        headers: { Authorization: `Bearer ${token}` },
      },
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
    await appStore.fetchWorkflow(); // Refresh global store order
    alert("Ordre du workflow mis à jour avec succès !");
  } catch (error) {
    console.error("Erreur workflow", error);
    alert("Erreur lors de la mise à jour de l'ordre du workflow.");
  } finally {
    savingWorkflow.value = false;
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
  <div class="space-y-10 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="loading" class="contents">
        <div v-for="i in 3" :key="i" class="h-48 bg-white border border-gray-100 rounded-[32px] animate-pulse"></div>
      </div>

      <div 
        v-else 
        v-for="s in settings" 
        :key="s.key"
        class="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
      >
        <div class="space-y-4">
          <div class="flex items-start justify-between">
            <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110', getSettingColor(s.key)]">
              <span class="material-icons-outlined text-2xl">{{ getSettingIcon(s.key) }}</span>
            </div>
            <div v-if="isBoolean(s.value)" @click="toggleSetting(s)" class="cursor-pointer">
              <div :class="['w-11 h-6 rounded-full p-1 transition-colors duration-200', s.value === 'true' ? 'bg-brand-primary' : 'bg-gray-200']">
                <div :class="['w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 transform', s.value === 'true' ? 'translate-x-5' : 'translate-x-0']"></div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">{{ s.description || s.key }}</h3>
            <p class="text-[10px] text-gray-400 font-bold mb-3">{{ s.key }}</p>
          </div>
        </div>

        <div v-if="!isBoolean(s.value)" class="space-y-3 pt-4">
          <input
            v-model="s.value"
            type="text"
            class="w-full px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-brand-primary focus:bg-white outline-none rounded-xl text-sm font-bold transition-all"
            placeholder="Valeur du réglage..."
          />
          <button
            @click="saveSetting(s.key, s.value)"
            class="w-full py-3 btn-primary rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-black transition-all shadow-sm"
          >
            Mettre à jour
          </button>
        </div>
        <div v-else class="pt-4">
          <p class="text-[10px] font-bold" :class="s.value === 'true' ? 'text-brand-primary' : 'text-gray-400'">
            {{ s.value === 'true' ? 'Option activée' : 'Option désactivée' }}
          </p>
        </div>
      </div>
    </div>

    <!-- NOUVELLE SECTION WORKFLOW -->
    <div class="pt-10">
      <h2 class="text-3xl font-black heading-primary">Architecture du Workflow</h2>
      <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
        Séquençage des étapes du parcours candidat
      </p>
    </div>

    <div class="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden p-8 max-w-4xl">
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 5" :key="'w'+i" class="h-16 bg-gray-50 animate-pulse rounded-2xl"></div>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(step, index) in workflowSteps"
          :key="step.id"
          class="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5 transition-all group"
        >
          <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 font-black text-xs group-hover:bg-brand-primary group-hover:text-[#428496] transition-colors">
            {{ index + 1 }}
          </div>

          <div class="flex-1">
            <h3 class="font-black heading-primary text-base flex items-center gap-2">
              {{ step.label }}
              <span v-if="index === 0" class="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full uppercase">Début</span>
              <span v-if="index === workflowSteps.length - 1" class="text-[9px] bg-green-50 text-green-500 px-2 py-0.5 rounded-full uppercase">Fin</span>
            </h3>
            <p class="text-[10px] font-bold text-gray-400 flex items-center gap-1">
              <span class="material-icons-outlined text-[12px]">link</span>
              {{ step.route }}
            </p>
          </div>

          <div class="flex gap-2">
            <button 
              @click="moveStep(index, -1)" 
              :disabled="index === 0"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-[#428496] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all border border-gray-50"
            >
              <span class="material-icons-outlined text-lg">arrow_upward</span>
            </button>
            <button 
              @click="moveStep(index, 1)" 
              :disabled="index === workflowSteps.length - 1"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-[#428496] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all border border-gray-50"
            >
              <span class="material-icons-outlined text-lg">arrow_downward</span>
            </button>
          </div>
        </div>

        <div class="pt-8 flex justify-end">
          <button
            @click="saveWorkflowOrder"
            :disabled="savingWorkflow"
            class="px-10 py-5 bg-black text-[#428496] rounded-[24px] font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-2xl hover:bg-brand-primary ring-offset-2 focus:ring-2 focus:ring-brand-primary transition-all disabled:opacity-50"
          >
            <span v-if="savingWorkflow" class="material-icons-outlined animate-spin text-sm">refresh</span>
            <span v-else class="material-icons-outlined text-sm">auto_fix_high</span>
            Appliquer les changements
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
