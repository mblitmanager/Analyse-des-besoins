<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const settings = ref([]);
const loading = ref(true);
const saving = ref(false);
const token = localStorage.getItem("admin_token");

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function fetchSettings() {
  try {
    const res = await axios.get(`${apiBaseUrl}/settings`);
    settings.value = res.data;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
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
