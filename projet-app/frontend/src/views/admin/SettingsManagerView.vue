<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useAppStore } from "../../stores/app";
import { useToastStore } from "../../stores/toast";

const appStore = useAppStore();
const toast = useToastStore();
const settings = ref([]);
const loading = ref(true);
const saving = ref(false);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const searchQuery = ref('');

const categories = [
  { id: 'general', label: 'Général', icon: 'settings', patterns: ['ENABLE_', 'PLATFORM_', 'SUPPORT_'] },
  { id: 'automation', label: 'Automatisme', icon: 'auto_mode', patterns: ['AUTO_SKIP', 'PAGINATED'] },
  { id: 'p3', label: 'P3', icon: 'add_circle', patterns: ['P3_'] },
  { id: 'prerequis', label: 'Prérequis', icon: 'checklist', patterns: ['PREREQUISITE_', 'PREREQUIS_'] },
];

const filteredSettings = computed(() => {
  let filtered = settings.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s => 
      s.key.toLowerCase().includes(q) || 
      (s.description && s.description.toLowerCase().includes(q))
    );
  }
  // Exclude email-related settings (managed in MailConfigView)
  filtered = filtered.filter(s => 
    !s.key.includes('EMAIL') && 
    !s.key.includes('ADMIN_EMAIL') &&
    !s.key.includes('AUTO_SEND_EMAIL')
  );
  return filtered;
});

const settingsByCategory = computed(() => {
  const result = {};
  categories.forEach(cat => result[cat.id] = []);
  result['other'] = [];

  filteredSettings.value.forEach(s => {
    const category = categories.find(cat => cat.patterns.some(p => s.key.includes(p)));
    if (category) {
      result[category.id].push(s);
    } else {
      result['other'].push(s);
    }
  });
  return result;
});

const getSettingIcon = (key) => {
  if (key.includes('AUTO_SKIP')) return 'fast_forward';
  if (key.includes('EMAIL')) return 'mail';
  if (key.includes('PHONE')) return 'phone';
  if (key.includes('PLATFORM')) return 'branding_watermark';
  if (key.includes('PAGINATED')) return 'auto_stories';
  if (key === 'ENABLE_P3') return 'add_circle';
  if (key === 'ENABLE_REFERRAL') return 'group_add';
  if (key.includes('ALERT')) return 'notification_important';
  if (key.includes('THRESHOLD')) return 'trending_up';
  if (key === 'P3_SAME_FORMATION_TEST') return 'school';
  if (key === 'P3_OTHER_FORMATION_TEST') return 'compare_arrows';
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
  if (key.includes('ALERT')) return 'bg-rose-100 text-rose-600';
  if (key.includes('THRESHOLD')) return 'bg-orange-100 text-orange-600';
  if (key === 'P3_SAME_FORMATION_TEST') return 'bg-teal-100 text-teal-600';
  if (key === 'P3_OTHER_FORMATION_TEST') return 'bg-cyan-100 text-cyan-600';
  return 'bg-slate-100 text-slate-600';
};

const isBoolean = (value) => value === 'true' || value === 'false';

async function toggleSetting(setting) {
  const newValue = setting.value === 'true' ? 'false' : 'true';
  setting.value = newValue; 
  await saveSetting(setting.key, newValue);
}

async function fetchSettings() {
  loading.value = true;
  try {
    const token = localStorage.getItem("admin_token");
    const settingsRes = await axios.get(`${apiBaseUrl}/settings`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    settings.value = settingsRes.data || [];
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    toast.error("Erreur lors du chargement des réglages");
  } finally {
    loading.value = false;
  }
}

async function saveSetting(key, value) {
  saving.value = true;
  try {
    const token = localStorage.getItem("admin_token");
    await axios.patch(
      `${apiBaseUrl}/settings/${key}`,
      { value },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    appStore.invalidateSetting(key);
    toast.success("Paramètre mis à jour");
  } catch (error) {
    toast.error("Erreur lors de l'enregistrement");
  } finally {
    saving.value = false;
  }
}

onMounted(fetchSettings);
</script>

<template>
  <div class="space-y-6 font-outfit">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h2 class="text-2xl font-black text-slate-800 tracking-tight">Configuration Système</h2>
        <p class="text-slate-500 text-sm">
          Ajustez les paramètres globaux de la plateforme, les automatisations et les comportements généraux.
        </p>
      </div>
    </div>

    <div class="space-y-8">
      <!-- Search Bar -->
      <div class="max-w-md">
        <div class="relative group">
          <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher un paramètre..."
            class="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400 shadow-sm transition-all"
          >
        </div>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="h-44 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse"></div>
      </div>

      <!-- Settings by Category -->
      <div v-else v-for="cat in [...categories, { id: 'other', label: 'Autres', icon: 'more_horiz' }]" :key="cat.id" class="space-y-6">
        <div v-if="settingsByCategory[cat.id]?.length > 0" class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <span class="material-icons-outlined text-sm">{{ cat.icon }}</span>
            </div>
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">{{ cat.label }}</h3>
            <div class="flex-1 h-px bg-slate-100"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div 
              v-for="s in settingsByCategory[cat.id]" 
              :key="s.key"
              class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition-all group relative"
            >
              <div class="space-y-4">
                <div class="flex items-start justify-between">
                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', getSettingColor(s.key)]">
                    <span class="material-icons-outlined text-xl">{{ getSettingIcon(s.key) }}</span>
                  </div>
                  
                  <div v-if="isBoolean(s.value)" @click="toggleSetting(s)" class="cursor-pointer">
                    <div :class="['w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200', s.value === 'true' ? 'bg-slate-900' : 'bg-slate-200']">
                      <div :class="['w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 transform', s.value === 'true' ? 'translate-x-4.5' : 'translate-x-0']"></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 class="text-xs font-bold text-slate-800 leading-normal">{{ s.description || s.key }}</h3>
                  <p class="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{{ s.key }}</p>
                </div>
              </div>

              <div class="pt-5 border-t border-slate-50 mt-4">
                <div v-if="!isBoolean(s.value)" class="space-y-2">
                  <input
                    v-model="s.value"
                    type="text"
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-400 focus:bg-white transition-all shadow-inner"
                    placeholder="Valeur..."
                  />
                  <button
                    @click="saveSetting(s.key, s.value)"
                    class="w-full py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
                <div v-else class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full animate-pulse" :class="s.value === 'true' ? 'bg-emerald-500' : 'bg-slate-300'"></div>
                  <p class="text-[9px] font-black uppercase tracking-widest" :class="s.value === 'true' ? 'text-emerald-500' : 'text-slate-400'">
                    {{ s.value === 'true' ? 'Activé' : 'Désactivé' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
</style>
