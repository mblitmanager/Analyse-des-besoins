<script setup>
import { ref, reactive, onMounted } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";

const toast = useToastStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const form = reactive({
  host: "",
  port: 587,
  username: "",
  password: "",
  encryption: "tls",
});

const errors = reactive({
  host: "",
  port: "",
  username: "",
  password: "",
  encryption: "",
});

const showPassword = ref(false);
const saving = ref(false);
const testing = ref(false);
const loading = ref(true);
const hasExistingPassword = ref(false);

function clearErrors() {
  errors.host = "";
  errors.port = "";
  errors.username = "";
  errors.password = "";
  errors.encryption = "";
}

function validate() {
  clearErrors();
  let valid = true;

  if (!form.host.trim()) {
    errors.host = "L'hôte SMTP est requis";
    valid = false;
  }

  if (!form.port || form.port < 1 || form.port > 65535) {
    errors.port = "Le port doit être compris entre 1 et 65535";
    valid = false;
  }

  if (!form.username.trim()) {
    errors.username = "Le nom d'utilisateur est requis";
    valid = false;
  }

  if (!hasExistingPassword.value && !form.password) {
    errors.password = "Le mot de passe est requis";
    valid = false;
  }

  if (!form.encryption) {
    errors.encryption = "La méthode de chiffrement est requise";
    valid = false;
  }

  return valid;
}

function getAuthHeaders() {
  const token = localStorage.getItem("admin_token");
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function fetchConfig() {
  loading.value = true;
  try {
    const response = await axios.get(
      `${apiBaseUrl}/mail-config/smtp`,
      getAuthHeaders()
    );
    const data = response.data;
    form.host = data.host || "";
    form.port = data.port || 587;
    form.username = data.username || "";
    form.password = "";
    form.encryption = data.encryption || "tls";
    hasExistingPassword.value = data.hasPassword || false;
  } catch (error) {
    if (error.response?.status !== 404) {
      toast.error("Erreur lors du chargement de la configuration SMTP");
    }
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  if (!validate()) return;

  saving.value = true;
  try {
    const payload = {
      host: form.host.trim(),
      port: Number(form.port),
      username: form.username.trim(),
      encryption: form.encryption,
    };

    if (form.password) {
      payload.password = form.password;
    }

    await axios.put(
      `${apiBaseUrl}/mail-config/smtp`,
      payload,
      getAuthHeaders()
    );
    toast.success("Configuration SMTP enregistrée avec succès");
    hasExistingPassword.value = true;
  } catch (error) {
    const message =
      error.response?.data?.message || "Erreur lors de l'enregistrement";
    toast.error(
      Array.isArray(message) ? message.join(", ") : message
    );
  } finally {
    saving.value = false;
  }
}

async function testConnection() {
  testing.value = true;
  try {
    const response = await axios.post(
      `${apiBaseUrl}/mail-config/smtp/test`,
      {},
      getAuthHeaders()
    );
    if (response.data.success) {
      toast.success("Connexion SMTP réussie !");
    } else {
      toast.error(
        "Échec de la connexion SMTP : " + (response.data.error || "Erreur inconnue")
      );
    }
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Erreur lors du test";
    toast.error("Échec du test de connexion : " + message);
  } finally {
    testing.value = false;
  }
}

onMounted(fetchConfig);
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-14 bg-slate-50 rounded-2xl animate-pulse"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="saveConfig" class="space-y-6">
      <!-- Host -->
      <div class="space-y-2">
        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
          Hôte SMTP
        </label>
        <input
          v-model="form.host"
          type="text"
          placeholder="smtp.example.com"
          class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
          :class="errors.host ? 'border-rose-400 bg-rose-50/50' : ''"
        />
        <p v-if="errors.host" class="text-[10px] font-bold text-rose-500 px-1">
          {{ errors.host }}
        </p>
      </div>

      <!-- Port -->
      <div class="space-y-2">
        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
          Port
        </label>
        <input
          v-model.number="form.port"
          type="number"
          min="1"
          max="65535"
          placeholder="587"
          class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
          :class="errors.port ? 'border-rose-400 bg-rose-50/50' : ''"
        />
        <p v-if="errors.port" class="text-[10px] font-bold text-rose-500 px-1">
          {{ errors.port }}
        </p>
      </div>

      <!-- Username -->
      <div class="space-y-2">
        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
          Nom d'utilisateur
        </label>
        <input
          v-model="form.username"
          type="text"
          placeholder="user@example.com"
          class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
          :class="errors.username ? 'border-rose-400 bg-rose-50/50' : ''"
        />
        <p v-if="errors.username" class="text-[10px] font-bold text-rose-500 px-1">
          {{ errors.username }}
        </p>
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
          Mot de passe
          <span v-if="hasExistingPassword" class="text-emerald-500 ml-2">(configuré)</span>
        </label>
        <div class="relative">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="hasExistingPassword ? '••••••••' : 'Entrez le mot de passe'"
            class="w-full px-5 py-3.5 pr-14 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
            :class="errors.password ? 'border-rose-400 bg-rose-50/50' : ''"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span class="material-icons-outlined text-lg">
              {{ showPassword ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
        <p v-if="errors.password" class="text-[10px] font-bold text-rose-500 px-1">
          {{ errors.password }}
        </p>
        <p v-if="hasExistingPassword && !form.password" class="text-[9px] font-bold text-slate-400 px-1">
          Laissez vide pour conserver le mot de passe actuel
        </p>
      </div>

      <!-- Encryption -->
      <div class="space-y-2">
        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
          Chiffrement
        </label>
        <select
          v-model="form.encryption"
          class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
          :class="errors.encryption ? 'border-rose-400 bg-rose-50/50' : ''"
        >
          <option value="tls">TLS</option>
          <option value="ssl">SSL</option>
          <option value="none">Aucun</option>
        </select>
        <p v-if="errors.encryption" class="text-[10px] font-bold text-rose-500 px-1">
          {{ errors.encryption }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span class="material-icons-outlined text-sm">
            {{ saving ? 'autorenew' : 'save' }}
          </span>
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>

        <button
          type="button"
          @click="testConnection"
          :disabled="testing"
          class="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span
            class="material-icons-outlined text-sm"
            :class="testing ? 'animate-spin' : ''"
          >
            {{ testing ? 'autorenew' : 'wifi_tethering' }}
          </span>
          {{ testing ? 'Test en cours...' : 'Tester la connexion' }}
        </button>
      </div>
    </form>
  </div>
</template>
