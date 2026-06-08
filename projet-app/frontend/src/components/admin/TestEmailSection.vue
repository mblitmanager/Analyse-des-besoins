<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";

const toast = useToastStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = () => localStorage.getItem("admin_token");

const email = ref("");
const loading = ref(false);
const emailError = ref("");

const isValidEmail = computed(() => {
  if (!email.value) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value.trim());
});

function validateEmail() {
  emailError.value = "";
  if (!email.value.trim()) {
    emailError.value = "L'adresse email est requise";
    return false;
  }
  if (!isValidEmail.value) {
    emailError.value = "Format d'adresse email invalide";
    return false;
  }
  return true;
}

async function sendTestEmail() {
  if (!validateEmail()) return;

  loading.value = true;
  emailError.value = "";

  try {
    const res = await axios.post(
      `${apiBaseUrl}/mail-config/test-email`,
      { to: email.value.trim() },
      { headers: { Authorization: `Bearer ${token()}` } }
    );

    if (res.data.success) {
      toast.success(`Email de test envoyé avec succès à ${email.value.trim()}`);
    } else {
      toast.error(`Échec de l'envoi : ${res.data.error || "Erreur inconnue"}`);
    }
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Erreur réseau";
    toast.error(`Échec de l'envoi de l'email de test : ${message}`);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Description -->
    <div class="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
      <div class="flex items-start gap-3">
        <span class="material-icons-outlined text-amber-500 text-lg mt-0.5">info</span>
        <div>
          <p class="text-xs font-bold text-slate-700">
            Envoyez un email de test pour vérifier que la configuration SMTP fonctionne correctement.
          </p>
          <p class="text-[10px] text-slate-400 mt-1">
            L'email sera envoyé avec la configuration SMTP actuellement enregistrée.
          </p>
        </div>
      </div>
    </div>

    <!-- Email Input + Send Button -->
    <div class="space-y-4">
      <div>
        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
          Adresse email destinataire
        </label>
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <input
              v-model="email"
              type="email"
              placeholder="exemple@domaine.com"
              :disabled="loading"
              @keyup.enter="sendTestEmail"
              @input="emailError = ''"
              class="w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none"
              :class="
                emailError
                  ? 'border-red-300 bg-red-50/50 text-red-700 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 bg-white text-slate-700 focus:border-blue-300 focus:ring-2 focus:ring-blue-100'
              "
            />
            <p v-if="emailError" class="mt-1.5 text-[10px] font-bold text-red-500">
              {{ emailError }}
            </p>
          </div>
          <button
            @click="sendTestEmail"
            :disabled="loading"
            class="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg"
            :class="
              loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20 hover:shadow-amber-500/30'
            "
          >
            <span v-if="loading" class="material-icons-outlined text-sm animate-spin">autorenew</span>
            <span v-else class="material-icons-outlined text-sm">send</span>
            {{ loading ? "Envoi en cours..." : "Envoyer" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
