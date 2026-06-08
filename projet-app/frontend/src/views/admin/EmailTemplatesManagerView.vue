<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";

const toast = useToastStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = () => localStorage.getItem("admin_token");

const templates = ref([]);
const loading = ref(true);
const showEditor = ref(false);
const showPreview = ref(false);
const previewHtml = ref("");
const saving = ref(false);

const editingTemplate = ref({
  id: null,
  slug: "",
  name: "",
  subject: "",
  htmlContent: "",
  description: "",
  availableVariables: [],
  isActive: true,
});

const formatVar = (v) => `\u007B\u007B${v}\u007D\u007D`;

const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f7fa; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0d1b3e, #1e3a5f); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; }
    .body { padding: 32px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{titre}}</h1>
    </div>
    <div class="body">
      <p>Bonjour {{prenom}} {{nom}},</p>
      <p>{{contenu}}</p>
    </div>
    <div class="footer">
      <p>© NS Conseil - Wizi Learn</p>
    </div>
  </div>
</body>
</html>`;

async function fetchTemplates() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/email-templates`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    templates.value = res.data;
  } catch (e) {
    toast.error("Erreur lors du chargement des templates");
  } finally {
    loading.value = false;
  }
}

function openNew() {
  editingTemplate.value = {
    id: null,
    slug: "",
    name: "",
    subject: "Analyse des besoins — {{civilite}} {{nom}} {{prenom}}",
    htmlContent: defaultTemplate,
    description: "",
    availableVariables: ["civilite", "nom", "prenom", "telephone", "formation", "recommandation", "score", "date", "titre", "contenu"],
    isActive: true,
  };
  showEditor.value = true;
}

function openEdit(tpl) {
  editingTemplate.value = { ...tpl };
  showEditor.value = true;
}

async function saveTemplate() {
  saving.value = true;
  try {
    const payload = { ...editingTemplate.value };
    if (payload.id) {
      await axios.patch(`${apiBaseUrl}/email-templates/${payload.id}`, payload, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      toast.success("Template mis à jour");
    } else {
      delete payload.id;
      await axios.post(`${apiBaseUrl}/email-templates`, payload, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      toast.success("Template créé");
    }
    showEditor.value = false;
    await fetchTemplates();
  } catch (e) {
    toast.error("Erreur: " + (e.response?.data?.message || e.message));
  } finally {
    saving.value = false;
  }
}

async function deleteTemplate(tpl) {
  if (!confirm(`Supprimer le template "${tpl.name}" ?`)) return;
  try {
    await axios.delete(`${apiBaseUrl}/email-templates/${tpl.id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    toast.success("Template supprimé");
    await fetchTemplates();
  } catch (e) {
    toast.error("Erreur lors de la suppression");
  }
}

async function previewTemplate() {
  try {
    const sampleVars = {};
    (editingTemplate.value.availableVariables || []).forEach((v) => {
      sampleVars[v] = `[${v}]`;
    });
    const res = await axios.post(
      `${apiBaseUrl}/email-templates/preview`,
      { htmlContent: editingTemplate.value.htmlContent, variables: sampleVars },
      { headers: { Authorization: `Bearer ${token()}` } }
    );
    previewHtml.value = res.data.html;
    showPreview.value = true;
  } catch (e) {
    toast.error("Erreur de prévisualisation");
  }
}

function addVariable() {
  const v = newVariable.value.trim().replace(/[^a-zA-Z0-9_]/g, "");
  if (v && !editingTemplate.value.availableVariables.includes(v)) {
    editingTemplate.value.availableVariables.push(v);
  }
  newVariable.value = "";
}

function removeVariable(v) {
  editingTemplate.value.availableVariables = editingTemplate.value.availableVariables.filter((x) => x !== v);
}

onMounted(fetchTemplates);
</script>

<template>
  <div class="space-y-10 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Templates Email</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Gestion des modèles d'emails envoyés par la plateforme
        </p>
      </div>
      <button @click="openNew" class="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
        <span class="material-icons-outlined text-sm">add</span>
        Nouveau Template
      </button>
    </div>

    <!-- Templates Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-56 bg-white border border-slate-100 rounded-[32px] animate-pulse"></div>
    </div>

    <div v-else-if="templates.length === 0" class="text-center py-20">
      <div class="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <span class="material-icons-outlined text-4xl text-slate-300">mail_outline</span>
      </div>
      <h3 class="text-lg font-black text-slate-900 mb-2">Aucun template</h3>
      <p class="text-slate-400 text-sm mb-6">Créez votre premier modèle d'email</p>
      <button @click="openNew" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
        Créer un template
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
      >
        <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all"></div>
        
        <div class="relative z-10 space-y-6">
          <div class="flex items-start justify-between">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
              <span class="material-icons-outlined text-2xl">email</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" :class="tpl.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></div>
              <span class="text-[9px] font-black uppercase tracking-widest" :class="tpl.isActive ? 'text-emerald-500' : 'text-slate-400'">
                {{ tpl.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-black text-slate-900 mb-1">{{ tpl.name }}</h3>
            <p class="text-[10px] text-slate-400 font-bold">{{ tpl.slug }}</p>
            <p v-if="tpl.description" class="text-[11px] text-slate-500 mt-2 line-clamp-2">{{ tpl.description }}</p>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="v in (tpl.availableVariables || []).slice(0, 4)"
              :key="v"
              class="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg"
            >
              {{ formatVar(v) }}
            </span>
            <span v-if="(tpl.availableVariables || []).length > 4" class="px-2.5 py-1 bg-slate-100 text-slate-400 text-[9px] font-bold rounded-lg">
              +{{ tpl.availableVariables.length - 4 }}
            </span>
          </div>

          <div class="flex gap-2 pt-2">
            <button @click="openEdit(tpl)" class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
              Modifier
            </button>
            <button @click="deleteTemplate(tpl)" class="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
              <span class="material-icons-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Modal -->
    <div v-if="showEditor" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-[32px] w-full max-w-4xl my-8 shadow-2xl">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-8 border-b border-slate-100">
          <h3 class="text-xl font-black text-slate-900">
            {{ editingTemplate.id ? 'Modifier le template' : 'Nouveau template' }}
          </h3>
          <button @click="showEditor = false" class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom</label>
              <input v-model="editingTemplate.name" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Rapport d'évaluation" />
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Slug (identifiant unique)</label>
              <input v-model="editingTemplate.slug" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="assessment-report" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sujet de l'email</label>
            <input v-model="editingTemplate.subject" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Analyse des besoins — {{civilite}} {{nom}}" />
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description (optionnel)</label>
            <input v-model="editingTemplate.description" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Template utilisé pour..." />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variables disponibles</label>
            </div>
            <div class="flex flex-wrap gap-2 mb-3">
              <span
                v-for="v in editingTemplate.availableVariables"
                :key="v"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-xl"
              >
                {{ formatVar(v) }}
                <button @click="removeVariable(v)" class="text-blue-400 hover:text-rose-500">×</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input v-model="newVariable" @keyup.enter="addVariable" class="flex-1 px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" placeholder="Ajouter une variable..." />
              <button @click="addVariable" class="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase">+</button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contenu HTML</label>
            <textarea
              v-model="editingTemplate.htmlContent"
              class="w-full h-80 px-5 py-4 bg-slate-50 border-none rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
              placeholder="<html>..."
            ></textarea>
          </div>

          <div class="flex items-center gap-3">
            <input type="checkbox" v-model="editingTemplate.isActive" id="tpl-active" class="w-4 h-4 rounded" />
            <label for="tpl-active" class="text-sm font-bold text-slate-700">Template actif</label>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between p-8 border-t border-slate-100">
          <button @click="previewTemplate" class="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2">
            <span class="material-icons-outlined text-sm">visibility</span>
            Prévisualiser
          </button>
          <div class="flex gap-3">
            <button @click="showEditor = false" class="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
              Annuler
            </button>
            <button @click="saveTemplate" :disabled="saving" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
              <span class="material-icons-outlined text-sm">{{ saving ? 'autorenew' : 'save' }}</span>
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div class="bg-white rounded-[32px] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 class="text-lg font-black text-slate-900">Prévisualisation</h3>
          <button @click="showPreview = false" class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <iframe :srcdoc="previewHtml" class="w-full h-[600px] border border-slate-200 rounded-2xl" sandbox="allow-same-origin"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
</style>
