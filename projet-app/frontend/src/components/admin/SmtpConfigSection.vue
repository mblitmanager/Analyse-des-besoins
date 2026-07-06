<script setup>
import { ref, reactive, onMounted } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";

const toast = useToastStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// ── SMTP form ──────────────────────────────────────────────────────────────────
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

// ── Recipients ─────────────────────────────────────────────────────────────────
const recipients = reactive({
  adminEmail: "",
  ccAdv: "",
});
const savingRecipients = ref(false);
const newCcInput = ref("");

// ── Auto Send Email ─────────────────────────────────────────────────────────────
const autoSendEmail = ref(false);
const savingAutoSend = ref(false);

// Parsed CC list for display
function parseCcList(value) {
  return (value || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

function addCcEmail() {
  const email = newCcInput.value.trim();
  if (!email) return;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error("Adresse email invalide");
    return;
  }
  const current = parseCcList(recipients.ccAdv);
  if (current.includes(email)) {
    toast.error("Cette adresse est déjà dans la liste");
    return;
  }
  current.push(email);
  recipients.ccAdv = current.join(", ");
  newCcInput.value = "";
}

function removeCcEmail(email) {
  const current = parseCcList(recipients.ccAdv).filter((e) => e !== email);
  recipients.ccAdv = current.join(", ");
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Fetch ──────────────────────────────────────────────────────────────────────
async function fetchConfig() {
  loading.value = true;
  try {
    const [smtpRes, adminEmailRes, ccAdvRes, autoSendRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/mail-config/smtp`, getAuthHeaders()).catch(() => ({ data: {} })),
      axios.get(`${apiBaseUrl}/settings/ADMIN_EMAIL`, getAuthHeaders()).catch(() => ({ data: { value: "" } })),
      axios.get(`${apiBaseUrl}/settings/EMAIL_CC_ADV`, getAuthHeaders()).catch(() => ({ data: { value: "" } })),
      axios.get(`${apiBaseUrl}/settings/AUTO_SEND_EMAIL`, getAuthHeaders()).catch(() => ({ data: { value: "false" } })),
    ]);

    const data = smtpRes.data;
    form.host = data.host || "";
    form.port = data.port || 587;
    form.username = data.username || "";
    form.password = "";
    form.encryption = data.encryption || "tls";
    hasExistingPassword.value = data.hasPassword || false;

    recipients.adminEmail = adminEmailRes.data?.value || "";
    recipients.ccAdv = ccAdvRes.data?.value || "";
    autoSendEmail.value = autoSendRes.data?.value === "true";
  } catch (error) {
    toast.error("Erreur lors du chargement de la configuration");
  } finally {
    loading.value = false;
  }
}

// ── Save SMTP ──────────────────────────────────────────────────────────────────
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

    await axios.put(`${apiBaseUrl}/mail-config/smtp`, payload, getAuthHeaders());
    toast.success("Configuration SMTP enregistrée avec succès");
    hasExistingPassword.value = true;
  } catch (error) {
    const message = error.response?.data?.message || "Erreur lors de l'enregistrement";
    toast.error(Array.isArray(message) ? message.join(", ") : message);
  } finally {
    saving.value = false;
  }
}

// ── Save Recipients ────────────────────────────────────────────────────────────
async function saveRecipients() {
  if (!recipients.adminEmail.trim()) {
    toast.error("L'adresse email de l'administrateur est requise");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipients.adminEmail.trim())) {
    toast.error("Adresse email administrateur invalide");
    return;
  }

  savingRecipients.value = true;
  try {
    const token = localStorage.getItem("admin_token");
    const headers = { Authorization: `Bearer ${token}` };
    await Promise.all([
      axios.patch(`${apiBaseUrl}/settings/ADMIN_EMAIL`, { value: recipients.adminEmail.trim() }, { headers }),
      axios.patch(`${apiBaseUrl}/settings/EMAIL_CC_ADV`, { value: recipients.ccAdv.trim() }, { headers }),
    ]);
    toast.success("Destinataires enregistrés !");
  } catch (error) {
    toast.error("Erreur lors de l'enregistrement des destinataires");
  } finally {
    savingRecipients.value = false;
  }
}

// ── Save Auto Send Email ────────────────────────────────────────────────────────
async function saveAutoSendEmail() {
  savingAutoSend.value = true;
  try {
    const token = localStorage.getItem("admin_token");
    const headers = { Authorization: `Bearer ${token}` };
    await axios.patch(`${apiBaseUrl}/settings/AUTO_SEND_EMAIL`, { value: autoSendEmail.value ? "true" : "false" }, { headers });
    toast.success("Paramètre d'envoi automatique mis à jour");
  } catch (error) {
    toast.error("Erreur lors de la mise à jour du paramètre");
  } finally {
    savingAutoSend.value = false;
  }
}

// ── Test connection ────────────────────────────────────────────────────────────
async function testConnection() {
  testing.value = true;
  try {
    const response = await axios.post(`${apiBaseUrl}/mail-config/smtp/test`, {}, getAuthHeaders());
    if (response.data.success) {
      toast.success("Connexion SMTP réussie !");
    } else {
      toast.error("Échec de la connexion SMTP : " + (response.data.error || "Erreur inconnue"));
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Erreur lors du test";
    toast.error("Échec du test de connexion : " + message);
  } finally {
    testing.value = false;
  }
}

onMounted(fetchConfig);
</script>

<template>
  <div class="space-y-8">
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 7" :key="i" class="h-14 bg-slate-50 rounded-2xl animate-pulse"></div>
    </div>

    <template v-else>
      <!-- ── Section 1: Destinataires ───────────────────────────────────── -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <span class="material-icons-outlined text-sm">people</span>
          </div>
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">Destinataires des bilans</h4>
          <div class="flex-1 h-px bg-slate-100"></div>
        </div>

        <!-- Admin email (main recipient) -->
        <div class="space-y-2">
          <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            Destinataire principal (admin)
            <span class="text-rose-400 ml-1">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-300 text-lg">alternate_email</span>
            <input
              v-model="recipients.adminEmail"
              type="email"
              placeholder="admin@entreprise.fr"
              class="w-full pl-11 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          <p class="text-[9px] font-bold text-slate-400 px-1">
            Reçoit tous les bilans. Si un conseiller est associé à la session, l'email est envoyé à ce conseiller à la place.
          </p>
        </div>

        <!-- CC ADV emails -->
        <div class="space-y-3">
          <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            Copie (CC) — ADV / autres destinataires
          </label>

          <!-- Tag list -->
          <div v-if="parseCcList(recipients.ccAdv).length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="email in parseCcList(recipients.ccAdv)"
              :key="email"
              class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800"
            >
              <span class="material-icons-outlined text-xs text-blue-400">mail</span>
              {{ email }}
              <button
                type="button"
                @click="removeCcEmail(email)"
                class="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <span class="material-icons-outlined text-xs">close</span>
              </button>
            </div>
          </div>
          <p v-else class="text-[10px] text-slate-400 italic px-1">Aucune adresse CC configurée</p>

          <!-- Add CC input -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-300 text-lg">add</span>
              <input
                v-model="newCcInput"
                type="email"
                placeholder="cc@exemple.fr"
                @keydown.enter.prevent="addCcEmail"
                class="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="button"
              @click="addCcEmail"
              class="px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              Ajouter
            </button>
          </div>
          <p class="text-[9px] font-bold text-slate-400 px-1">
            Ces adresses reçoivent une copie de tous les bilans envoyés.
          </p>
        </div>

        <!-- Save recipients button -->
        <button
          type="button"
          @click="saveRecipients"
          :disabled="savingRecipients"
          class="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <span class="material-icons-outlined text-sm" :class="savingRecipients ? 'animate-spin' : ''">
            {{ savingRecipients ? 'autorenew' : 'save' }}
          </span>
          {{ savingRecipients ? 'Enregistrement...' : 'Enregistrer les destinataires' }}
        </button>

        <!-- Auto Send Email Toggle -->
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <span class="material-icons-outlined text-sm">auto_mode</span>
            </div>
            <div>
              <h4 class="text-xs font-black text-slate-800">Envoyer automatiquement les bilans</h4>
              <p class="text-[9px] text-slate-400 font-bold">Les bilans sont envoyés automatiquement par email à la fin du parcours</p>
            </div>
          </div>
          <button
            type="button"
            @click="saveAutoSendEmail"
            :disabled="savingAutoSend"
            class="relative w-12 h-6 rounded-full transition-colors duration-200"
            :class="autoSendEmail ? 'bg-emerald-500' : 'bg-slate-200'"
          >
            <div
              class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
              :class="autoSendEmail ? 'translate-x-6' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <div class="h-px bg-slate-100"></div>

      <!-- ── Section 2: SMTP ────────────────────────────────────────────── -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <span class="material-icons-outlined text-sm">dns</span>
          </div>
          <h4 class="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">Serveur SMTP</h4>
          <div class="flex-1 h-px bg-slate-100"></div>
        </div>

        <form @submit.prevent="saveConfig" class="space-y-5">
          <!-- Host + Port row -->
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 space-y-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hôte SMTP</label>
              <input
                v-model="form.host"
                type="text"
                placeholder="smtp.example.com"
                class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                :class="errors.host ? 'border-rose-400 bg-rose-50/50' : ''"
              />
              <p v-if="errors.host" class="text-[10px] font-bold text-rose-500 px-1">{{ errors.host }}</p>
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Port</label>
              <input
                v-model.number="form.port"
                type="number"
                min="1"
                max="65535"
                placeholder="587"
                class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
                :class="errors.port ? 'border-rose-400 bg-rose-50/50' : ''"
              />
              <p v-if="errors.port" class="text-[10px] font-bold text-rose-500 px-1">{{ errors.port }}</p>
            </div>
          </div>

          <!-- Username -->
          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nom d'utilisateur</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="user@example.com"
              class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
              :class="errors.username ? 'border-rose-400 bg-rose-50/50' : ''"
            />
            <p v-if="errors.username" class="text-[10px] font-bold text-rose-500 px-1">{{ errors.username }}</p>
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
                <span class="material-icons-outlined text-lg">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <p v-if="errors.password" class="text-[10px] font-bold text-rose-500 px-1">{{ errors.password }}</p>
            <p v-if="hasExistingPassword && !form.password" class="text-[9px] font-bold text-slate-400 px-1">
              Laissez vide pour conserver le mot de passe actuel
            </p>
          </div>

          <!-- Encryption -->
          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Chiffrement</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="enc in [{ value: 'tls', label: 'TLS', desc: 'Port 587' }, { value: 'ssl', label: 'SSL', desc: 'Port 465' }, { value: 'none', label: 'Aucun', desc: 'Non sécurisé' }]"
                :key="enc.value"
                type="button"
                @click="form.encryption = enc.value"
                class="flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-center"
                :class="form.encryption === enc.value
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'"
              >
                <span class="material-icons-outlined text-lg mb-1">{{ enc.value === 'none' ? 'lock_open' : 'lock' }}</span>
                <span class="text-xs font-black">{{ enc.label }}</span>
                <span class="text-[9px] font-bold opacity-70">{{ enc.desc }}</span>
              </button>
            </div>
            <p v-if="errors.encryption" class="text-[10px] font-bold text-rose-500 px-1">{{ errors.encryption }}</p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span class="material-icons-outlined text-sm" :class="saving ? 'animate-spin' : ''">
                {{ saving ? 'autorenew' : 'save' }}
              </span>
              {{ saving ? 'Enregistrement...' : 'Enregistrer SMTP' }}
            </button>

            <button
              type="button"
              @click="testConnection"
              :disabled="testing"
              class="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span class="material-icons-outlined text-sm" :class="testing ? 'animate-spin' : ''">
                {{ testing ? 'autorenew' : 'wifi_tethering' }}
              </span>
              {{ testing ? 'Test en cours...' : 'Tester la connexion' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>
