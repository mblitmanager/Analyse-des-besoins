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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
  saving.ref = true;
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
    <div>
      <h2 class="text-3xl font-black heading-primary">Configuration Système</h2>
      <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
        Gérez les réglages globaux de la plateforme
      </p>
    </div>

    <div class="bg-white rounded-[40px] shadow-sm p-10 max-w-2xl">
      <div v-if="loading" class="space-y-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-12 bg-gray-50 animate-pulse rounded-2xl"
        ></div>
      </div>

      <div v-else class="space-y-8">
        <div v-for="s in settings" :key="s.key" class="space-y-2">
          <label
            class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >{{ s.description || s.key }}</label
          >
          <div class="flex gap-3">
            <input
              v-model="s.value"
              type="text"
              class="flex-1 px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-sm font-bold transition-all"
            />
            <button
              @click="saveSetting(s.key, s.value)"
              class="px-6 py-4 btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- NOUVELLE SECTION WORKFLOW -->
    <div>
      <h2 class="text-3xl font-black heading-primary">Ordre du Workflow</h2>
      <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
        Gérez l'ordre des étapes que le candidat doit suivre
      </p>
    </div>

    <div class="bg-white rounded-[40px] shadow-sm overflow-hidden p-10 max-w-4xl">
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 5" :key="'w'+i" class="h-16 bg-gray-50 animate-pulse rounded-2xl"></div>
      </div>

      <div v-else class="space-y-4">
        <!-- List of Steps -->
        <div
          v-for="(step, index) in workflowSteps"
          :key="step.id"
          class="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-blue-100 transition-all group"
        >
          <!-- Order Controls -->
          <div class="flex flex-col gap-1 items-center justify-center">
            <button 
              @click="moveStep(index, -1)" 
              :disabled="index === 0"
              class="text-gray-400 hover:text-brand-primary disabled:opacity-20 disabled:hover:text-gray-400"
            >
              <span class="material-icons-outlined text-sm">expand_less</span>
            </button>
            <button 
              @click="moveStep(index, 1)" 
              :disabled="index === workflowSteps.length - 1"
              class="text-gray-400 hover:text-brand-primary disabled:opacity-20 disabled:hover:text-gray-400"
            >
              <span class="material-icons-outlined text-sm">expand_more</span>
            </button>
          </div>

          <div class="flex-1">
            <h3 class="font-black heading-primary text-base">{{ step.label }}</h3>
            <p class="text-[10px] font-bold text-gray-400">{{ step.route }}</p>
          </div>

          <div class="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            Numéro {{ index + 1 }}
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-6 flex justify-end">
          <button
            @click="saveWorkflowOrder"
            :disabled="savingWorkflow"
            class="px-8 py-4 btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl hover:bg-black transition-all disabled:opacity-50"
          >
            <span v-if="savingWorkflow" class="material-icons-outlined animate-spin text-sm">refresh</span>
            <span v-else class="material-icons-outlined text-sm">save</span>
            Sauvegarder l'Ordre
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
