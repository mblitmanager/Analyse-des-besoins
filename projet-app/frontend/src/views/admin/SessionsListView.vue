<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { formatBoldText } from "../../utils/formatText";
import * as XLSX from "xlsx";

const sessions = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const activeTab = ref("all");
const formationFilter = ref("all");
const selectedSession = ref(null);
const editableSession = ref(null);
const showModal = ref(false);
const savingSession = ref(false);
const expandedLevel = ref(null);
const questionsIndex = ref({});
const selectedSessionIds = ref(new Set());
const processedData = ref(null);
const loadingProcessed = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = localStorage.getItem("admin_token");
const headers = { Authorization: `Bearer ${token}` };

// Pagination
const page = ref(1);
const pageSize = ref(25);

// Reset page and selections when filters change
watch([searchQuery, activeTab, formationFilter], () => { 
  page.value = 1; 
  selectedSessionIds.value.clear();
});

async function viewSession(session) {
  selectedSession.value = session;
  editableSession.value = JSON.parse(JSON.stringify(session));
  processedData.value = null;
  showModal.value = true;
  
  loadingProcessed.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/sessions/${session.id}/processed`, { headers });
    processedData.value = res.data;
  } catch (error) {
    console.error("Failed to fetch processed session data:", error);
  } finally {
    loadingProcessed.value = false;
  }
}

const uniqueFormations = computed(() => {
  const forms = new Set(
    sessions.value.map((s) => s.formationChoisie).filter(Boolean),
  );
  return Array.from(forms).sort();
});

const filteredSessions = computed(() => {
  return sessions.value.filter((s) => {
    const name = `${s.prenom || s.stagiaire?.prenom || ""} ${s.nom || s.stagiaire?.nom || ""}`.toLowerCase();
    const email = (s.stagiaire?.email || s.email || "").toLowerCase();
    const q = (searchQuery.value || "").toLowerCase();
    const matchesSearch = !q || name.includes(q) || email.includes(q);

    const matchesStatus =
      activeTab.value === "all" ||
      (activeTab.value === "completed" ? s.isCompleted : !s.isCompleted);

    const matchesFormation =
      formationFilter.value === "all" ||
      s.formationChoisie === formationFilter.value;

    return matchesSearch && matchesStatus && matchesFormation;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSessions.value.length / pageSize.value)));
const paginatedSessions = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredSessions.value.slice(start, start + pageSize.value);
});

const isAllSelected = computed(() => {
  return paginatedSessions.value.length > 0 && paginatedSessions.value.every(s => selectedSessionIds.value.has(s.id));
});

function toggleAllSelection(event) {
  if (event.target.checked) {
    paginatedSessions.value.forEach(s => selectedSessionIds.value.add(s.id));
  } else {
    paginatedSessions.value.forEach(s => selectedSessionIds.value.delete(s.id));
  }
}

function toggleSelection(id) {
  if (selectedSessionIds.value.has(id)) {
    selectedSessionIds.value.delete(id);
  } else {
    selectedSessionIds.value.add(id);
  }
}

async function deleteSelectedSessions() {
  if (!selectedSessionIds.value.size) return;
  if (!confirm(`Supprimer définitivement les ${selectedSessionIds.value.size} sessions sélectionnées ?`)) return;

  try {
    await Promise.all(
      Array.from(selectedSessionIds.value).map(id => axios.delete(`${apiBaseUrl}/sessions/${id}`, { headers }))
    );
    selectedSessionIds.value.clear();
    await fetchSessions();
  } catch (error) {
    console.error("Failed to delete selected sessions:", error);
    alert("Erreur lors de la suppression groupée.");
  }
}

async function fetchSessions() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/sessions`, { headers });
    sessions.value = res.data;
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
  } finally {
    loading.value = false;
  }
}

async function fetchQuestionsIndex() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions`);
    const index = {};
    res.data.forEach((q) => {
      index[q.id] = { text: q.text, type: q.type };
    });
    questionsIndex.value = index;
  } catch (error) {
    console.error("Failed to fetch questions index:", error);
  }
}

async function saveSessionEdits() {
  if (!editableSession.value) return;
  savingSession.value = true;
  try {
    const payload = {
      conseiller: editableSession.value.conseiller,
      formationChoisie: editableSession.value.formationChoisie,
      scorePretest: editableSession.value.scorePretest,
      finalRecommendation: editableSession.value.finalRecommendation,
      lastValidatedLevel: editableSession.value.lastValidatedLevel,
      stopLevel: editableSession.value.stopLevel,
      prerequisiteScore: editableSession.value.prerequisiteScore,
      levelsScores: editableSession.value.levelsScores,
      positionnementAnswers: editableSession.value.positionnementAnswers,
      complementaryQuestions: editableSession.value.complementaryQuestions,
      availabilities: editableSession.value.availabilities,
    };

    await axios.patch(
      `${apiBaseUrl}/sessions/${editableSession.value.id}`,
      payload,
      { headers }
    );

    await fetchSessions();
    const updated = sessions.value.find(
      (s) => s.id === editableSession.value.id,
    );
    if (updated) {
      selectedSession.value = updated;
      editableSession.value = JSON.parse(JSON.stringify(updated));
    }
  } catch (error) {
    console.error("Failed to save session edits:", error);
    alert("Erreur lors de la sauvegarde de la session.");
  } finally {
    savingSession.value = false;
  }
}

async function deleteSession(session) {
  if (
    !confirm(
      `Supprimer définitivement la session de ${session.prenom || session.stagiaire?.prenom || ""} ${session.nom || session.stagiaire?.nom || ""} ?`,
    )
  ) {
    return;
  }
  try {
    await axios.delete(`${apiBaseUrl}/sessions/${session.id}`, { headers });
    await fetchSessions();
  } catch (error) {
    console.error("Failed to delete session:", error);
    alert("Erreur lors de la suppression de la session.");
  }
}

async function exportToExcel() {
  if (filteredSessions.value.length === 0) return;

  const confirmExport = confirm(`Exporter les ${filteredSessions.value.length} sessions filtrées ?\n\nNote: Les données seront filtrées pour correspondre exactement au PDF (questions masquées par la logique métier).`);
  if (!confirmExport) return;

  const allSessionsProcessed = await Promise.all(
    filteredSessions.value.map(s => 
      axios.get(`${apiBaseUrl}/sessions/${s.id}/processed`, { headers })
        .then(res => ({ ...s, processed: res.data }))
        .catch(() => ({ ...s, processed: null }))
    )
  );

  const questionIds = new Set();
  allSessionsProcessed.forEach(s => {
    if (!s.processed) return;
    if (s.processed.filteredPrerequis) Object.keys(s.processed.filteredPrerequis).forEach(k => questionIds.add(k));
    if (s.processed.filteredComplementaryAnswers) Object.keys(s.processed.filteredComplementaryAnswers).forEach(k => questionIds.add(k));
    if (s.processed.filteredAvailabilities) Object.keys(s.processed.filteredAvailabilities).forEach(k => questionIds.add(k));
    if (s.processed.filteredMiseAnswers) Object.keys(s.processed.filteredMiseAnswers).forEach(k => questionIds.add(k));
  });

  const qIdsArray = Array.from(questionIds);
  const questionHeaders = qIdsArray.map(id => getQuestionLabel(id).replace(/"/g, '""'));

  const baseHeaders = [
    "ID", "Stagiaire", "Email", "Téléphone", "Conseiller", "Parrain Nom", "Parrain Prénom", "Parrain Email", "Parrain Téléphone", "Marque", "Formation", "Date", "Statut", "Score %", "Dernier niveau validé", "Niveau d'arrêt", "Recommandation finale",
  ];

  const headers = [...baseHeaders, ...questionHeaders];

  const rows = allSessionsProcessed.map((s) => {
    const baseRow = [
      s.id,
      `${s.prenom || s.stagiaire?.prenom || ""} ${s.nom || s.stagiaire?.nom || ""}`,
      s.stagiaire?.email || s.email || "",
      s.telephone || "",
      s.conseiller || "",
      s.parrainNom || "",
      s.parrainPrenom || "",
      s.parrainEmail || "",
      s.parrainTelephone || "",
      s.brand || "",
      s.formationChoisie || "",
      new Date(s.createdAt).toLocaleString(),
      s.isCompleted ? "Terminé" : "En cours",
      s.processed ? s.processed.scorePretest : (s.scorePretest || 0),
      s.lastValidatedLevel || "",
      s.stopLevel || "",
      s.processed ? s.processed.recommendation : (s.finalRecommendation || ""),
    ];

    const questionRow = qIdsArray.map(id => {
      let ans = "";
      if (!s.processed) return "";
      
      if (s.processed.filteredPrerequis && s.processed.filteredPrerequis[id] !== undefined) ans = s.processed.filteredPrerequis[id];
      else if (s.processed.filteredComplementaryAnswers && s.processed.filteredComplementaryAnswers[id] !== undefined) ans = s.processed.filteredComplementaryAnswers[id];
      else if (s.processed.filteredAvailabilities && s.processed.filteredAvailabilities[id] !== undefined) ans = s.processed.filteredAvailabilities[id];
      else if (s.processed.filteredMiseAnswers && s.processed.filteredMiseAnswers[id] !== undefined) ans = s.processed.filteredMiseAnswers[id];
      
      return Array.isArray(ans) ? ans.join(", ") : ans;
    });

    return [...baseRow, ...questionRow];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sessions");

  XLSX.writeFile(workbook, `sessions_export_${new Date().toISOString().split("T")[0]}.xlsx`);
}

async function downloadPdf(session) {
  try {
    const res = await axios.get(`${apiBaseUrl}/sessions/${session.id}/pdf`, {
      responseType: 'blob',
      headers
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Analyse_des_besoins_${session.prenom}_${session.nom}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download PDF:", error);
    alert("Erreur lors du téléchargement du PDF.");
  }
}

function exportSessionDetails(session) {
  const payload = {
    ...session
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `session_${session.id}_${new Date(session.createdAt).toISOString().split("T")[0]}.json`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

onMounted(async () => {
  await Promise.all([fetchSessions(), fetchQuestionsIndex()]);
});

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getQuestionLabel(id) {
  const meta = questionsIndex.value[id];
  return meta?.text || `Question ${id}`;
}

const getBrandColor = (brand) => {
  if (brand?.toLowerCase() === 'aopia') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (brand?.toLowerCase() === 'inkrea') return 'bg-purple-100 text-purple-700 border-purple-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} h`;
  if (days < 7) return `${days} j`;
  return formatDate(date);
};

function toggleExpandedLevel(level) {
  expandedLevel.value = expandedLevel.value === level ? null : level;
}
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Gestion des Sessions</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          {{ filteredSessions.length }} session(s) • Monitoring en temps réel des dossiers candidats
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="exportToExcel"
          class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
        >
          <span class="material-icons-outlined text-sm">file_download</span>
          Exporter Excel
        </button>
        <button 
          v-if="selectedSessionIds.size > 0"
          @click="deleteSelectedSessions"
          class="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-2 shadow-xl shadow-rose-500/10"
        >
          <span class="material-icons-outlined text-sm">delete_sweep</span>
          Supprimer ({{ selectedSessionIds.size }})
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4">
      <div class="flex p-1 bg-slate-50 rounded-xl overflow-hidden shrink-0">
        <button
          v-for="tab in [
            { id: 'all', label: 'Toutes' },
            { id: 'pending', label: 'En cours' },
            { id: 'completed', label: 'Terminées' }
          ]"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg"
          :class="activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="flex-1 flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1 group">
          <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors text-sm">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par nom, email..."
            class="w-full pl-11 pr-6 py-3 bg-slate-50 border-none outline-none rounded-xl text-xs font-bold transition-all focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        <div class="relative min-w-[200px]">
          <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">school</span>
          <select 
            v-model="formationFilter"
            class="w-full pl-11 pr-10 py-3 bg-slate-50 border-none outline-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none transition-all cursor-pointer focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value="all">Toutes les formations</option>
            <option v-for="form in uniqueFormations" :key="form" :value="form">{{ form }}</option>
          </select>
          <span class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none">expand_more</span>
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto overflow-y-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-8 py-5 w-10">
                <input 
                  type="checkbox" 
                  :checked="isAllSelected"
                  @change="toggleAllSelection"
                  class="w-4 h-4 text-slate-900 bg-white border-slate-200 rounded-md focus:ring-0"
                >
              </th>
              <th class="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Candidat</th>
              <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Formation & Marque</th>
              <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Dernière Activité</th>
              <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Referral</th>
              <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
              <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <template v-if="loading">
              <tr v-for="i in 5" :key="i">
                <td colspan="7" class="px-8 py-6"><div class="h-12 bg-slate-50 animate-pulse rounded-2xl w-full"></div></td>
              </tr>
            </template>
            <template v-else-if="paginatedSessions.length > 0">
              <tr
                v-for="session in paginatedSessions"
                :key="session.id"
                class="group hover:bg-slate-50/70 transition-all cursor-default"
                @click="viewSession(session)"
              >
                <td class="px-8 py-5" @click.stop>
                  <input 
                    type="checkbox" 
                    :checked="selectedSessionIds.has(session.id)"
                    @change="toggleSelection(session.id)"
                    class="w-4 h-4 text-slate-900 bg-white border-slate-200 rounded-md focus:ring-0"
                  >
                </td>
                <td class="px-4 py-5">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 shrink-0 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform">
                      {{ (session.prenom || session.stagiaire?.prenom)?.[0] }}{{ (session.nom || session.stagiaire?.nom)?.[0] }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-[13px] font-black text-slate-900 truncate">
                        {{ session.civilite }} {{ session.prenom || session.stagiaire?.prenom }} {{ session.nom || session.stagiaire?.nom }}
                      </p>
                      <p class="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1">
                        <span class="material-icons-outlined text-[10px]">mail</span>
                        {{ session.stagiaire?.email || session.email }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <div class="space-y-1.5 flex flex-col items-start">
                    <span class="text-xs font-bold text-slate-700 truncate max-w-[200px]">{{ session.formationChoisie || 'Évaluation en cours' }}</span>
                    <span :class="['px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border', getBrandColor(session.brand)]">
                       {{ session.brand || 'PLATFORME' }}
                    </span>
                  </div>
                </td>
                <td class="px-8 py-5 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black text-slate-900">{{ getRelativeTime(session.updatedAt || session.createdAt) }}</span>
                    <span class="text-[9px] font-bold text-slate-400">{{ formatDate(session.createdAt) }}</span>
                  </div>
                </td>
                <td class="px-8 py-5 text-center">
                   <div v-if="session.parrainNom" class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm" title="Session parrainée">
                      <span class="material-icons-outlined text-sm">redeem</span>
                   </div>
                   <span v-else class="text-[10px] text-slate-200">—</span>
                </td>
                <td class="px-8 py-5">
                  <span
                    class="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5"
                    :class="session.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'"
                  >
                    {{ session.isCompleted ? "Terminé" : "Partiel" }}
                  </span>
                </td>
                <td class="px-8 py-5">
                  <div class="flex gap-2 justify-end">
                    <button
                      @click.stop="downloadPdf(session)"
                      class="w-9 h-9 rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center shadow-sm"
                    >
                      <span class="material-icons-outlined text-lg">picture_as_pdf</span>
                    </button>
                    <button
                      @click.stop="deleteSession(session)"
                      class="w-9 h-9 rounded-xl border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center shadow-sm"
                    >
                      <span class="material-icons-outlined text-lg">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="7" class="py-24 text-center">
                <div class="flex flex-col items-center gap-4 opacity-10">
                  <span class="material-icons-outlined text-7xl">folder_off</span>
                  <p class="font-black uppercase tracking-widest text-[11px]">Aucun dossier archivé</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="!loading && filteredSessions.length > 0" class="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Affichage par page</label>
          <select
            v-model.number="pageSize"
            @change="page = 1"
            class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none cursor-pointer"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </div>
        
        <div class="flex items-center gap-1.5">
          <button @click="page--" :disabled="page === 1" class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm disabled:opacity-30 transition-all"><span class="material-icons-outlined text-sm">chevron_left</span></button>
          <div class="flex items-center gap-1 mx-2">
             <span class="text-[10px] font-black text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-200">{{ page }}</span>
             <span class="text-[10px] font-black text-slate-300">/</span>
             <span class="text-[10px] font-black text-slate-400">{{ totalPages }}</span>
          </div>
          <button @click="page++" :disabled="page >= totalPages" class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm disabled:opacity-30 transition-all"><span class="material-icons-outlined text-sm">chevron_right</span></button>
        </div>
      </div>
    </div>

    <!-- Modal Dossier -->
    <div v-if="showModal && editableSession" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" @click="showModal = false"></div>
      <div class="bg-white rounded-[50px] shadow-2xl w-full max-w-5xl relative overflow-hidden animate-scale-up max-h-[95vh] flex flex-col">
        
        <!-- Modal Header -->
        <div class="px-10 py-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 rounded-[24px] bg-slate-900 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-slate-900/40 transform -rotate-3">
              {{ (editableSession.prenom || editableSession.stagiaire?.prenom)?.[0] }}{{ (editableSession.nom || editableSession.stagiaire?.nom)?.[0] }}
            </div>
            <div class="space-y-1">
              <h3 class="text-3xl font-black text-slate-900 tracking-tight leading-none">
                {{ editableSession.civilite }} {{ (editableSession.prenom || editableSession.stagiaire?.prenom) }} {{ (editableSession.nom || editableSession.stagiaire?.nom) }}
              </h3>
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <span class="material-icons-outlined text-[12px]">fingerprint</span>
                  #{{ editableSession.id.substring(0,8) }}
                </span>
                <span :class="['px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border', getBrandColor(editableSession.brand)]">
                   {{ editableSession.brand || 'STANDALONE' }}
                </span>
                <span class="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                   Email envoyé : {{ editableSession.emailSentAt ? formatDate(editableSession.emailSentAt) : 'NON' }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
             <button
              @click="saveSessionEdits"
              :disabled="savingSession"
              class="px-8 py-4 bg-slate-900 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span class="material-icons-outlined text-sm">published_with_changes</span>
              Modifier le Dossier
            </button>
            <button @click="showModal = false" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        <div class="p-12 overflow-y-auto space-y-12 flex-1 custom-scrollbar">
          
          <!-- Key Stats Cards -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
             <div class="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex flex-col justify-between">
                <p class="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Niveau Acquis</p>
                <p class="text-2xl font-black text-emerald-600 mt-2">{{ editableSession.lastValidatedLevel || 'INITIAL' }}</p>
             </div>
             <div class="p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex flex-col justify-between overflow-hidden relative">
                <p class="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Niveau d'Arrêt</p>
                <p class="text-2xl font-black text-blue-600 mt-2">{{ editableSession.stopLevel || 'EXPERT' }}</p>
                <span class="material-icons-outlined absolute -right-4 -bottom-4 text-6xl opacity-5 text-blue-900">flag</span>
             </div>
             <div class="p-6 bg-slate-900 rounded-[32px] border border-slate-900 flex flex-col justify-between shadow-2xl shadow-slate-900/20">
                <p class="text-[9px] font-black text-white/40 uppercase tracking-widest">Mode Système</p>
                <div class="flex items-center gap-2 mt-2">
                   <div :class="['w-2 h-2 rounded-full animate-pulse', editableSession.isP3Mode ? 'bg-amber-400' : 'bg-blue-400']"></div>
                   <p class="text-xs font-black text-white uppercase">{{ editableSession.isP3Mode ? 'Profil P3' : 'Standard' }}</p>
                </div>
             </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <!-- Left Side: Professional & Referral Info -->
            <div class="lg:col-span-1 space-y-10">
              <!-- Contact Detail -->
              <section class="space-y-6">
                <div class="flex items-center gap-2">
                   <div class="w-1.5 h-6 bg-brand-primary rounded-full"></div>
                   <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-tight">Coordonnées</h4>
                </div>
                <div class="space-y-4">
                  <div class="space-y-1">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone Direct</label>
                    <p class="p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 text-sm flex items-center gap-3">
                       <span class="material-icons-outlined text-slate-300 text-sm">phone</span>
                       {{ editableSession.telephone || "NON RENSEIGNÉ" }}
                    </p>
                  </div>
                  <div class="space-y-1">
                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Conseiller MBL</label>
                    <div class="relative">
                      <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm">support_agent</span>
                      <input v-model="editableSession.conseiller" class="w-full pl-11 pr-5 py-4 bg-white border border-slate-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-brand-primary/20 shadow-inner" placeholder="Aucun conseiller..." />
                    </div>
                  </div>
                </div>
              </section>

              <!-- Business Context -->
              <section class="space-y-6">
                 <div class="flex items-center gap-2">
                   <div class="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                   <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-tight">Profil métier</h4>
                </div>
                <div class="p-6 bg-white border border-slate-100 rounded-[32px] shadow-inner space-y-6">
                   <div class="space-y-2">
                      <p class="text-[9px] font-black text-slate-400 uppercase">Activité / Poste</p>
                      <p class="text-xs font-black text-slate-900 flex items-center gap-2">
                        <span class="material-icons-outlined text-sm opacity-30">work</span>
                        {{ editableSession.metier || 'NON DÉFINI' }}
                      </p>
                   </div>
                   <div class="space-y-2">
                      <p class="text-[9px] font-black text-slate-400 uppercase">Situation Actuelle</p>
                      <div class="flex flex-wrap gap-2">
                         <template v-if="editableSession.situation?.length">
                           <span v-for="s in editableSession.situation" :key="s" class="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase">{{ s }}</span>
                         </template>
                         <span v-else class="text-[10px] italic text-slate-300">Aucune précision...</span>
                      </div>
                   </div>
                </div>
              </section>

              <!-- Referral Section -->
              <section v-if="editableSession.parrainNom" class="space-y-6">
                <div class="flex items-center gap-2">
                   <div class="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                   <h4 class="text-[11px] font-black text-emerald-600 uppercase tracking-tight">Compte Partage (Referral)</h4>
                </div>
                <div class="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[32px] space-y-5">
                   <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                        {{ editableSession.parrainPrenom?.[0] }}{{ editableSession.parrainNom?.[0] }}
                      </div>
                      <div>
                        <p class="text-xs font-black text-emerald-700 leading-none">{{ editableSession.parrainPrenom }} {{ editableSession.parrainNom }}</p>
                        <p class="text-[9px] font-bold text-emerald-600/60 uppercase mt-0.5">Contact Référent</p>
                      </div>
                   </div>
                   <div class="space-y-2 text-[11px] font-black text-emerald-700/80 uppercase tracking-tighter">
                      <p class="flex items-center gap-2"><span class="material-icons-outlined text-sm opacity-40">alternate_email</span> {{ editableSession.parrainEmail }}</p>
                      <p class="flex items-center gap-2"><span class="material-icons-outlined text-sm opacity-40">phone_iphone</span> {{ editableSession.parrainTelephone }}</p>
                   </div>
                </div>
              </section>
            </div>

            <!-- Right Side: Assessment Details -->
            <div class="lg:col-span-2 space-y-10">
              <!-- Summary Recommandation -->
              <section class="p-8 bg-slate-900 border border-slate-900 rounded-[40px] shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                 <p class="text-[10px] font-black text-white/30 uppercase tracking-[.25em] mb-4">Recommandation Stratégique</p>
                 <div class="relative z-10">
                   <p class="text-xl font-black text-white leading-relaxed italic" v-html="formatBoldText(processedData ? processedData.recommendation : editableSession.finalRecommendation || 'Analyse en cours...')"></p>
                 </div>
                 <span class="material-icons-outlined absolute -right-8 -bottom-8 text-[160px] opacity-[.03] text-white">auto_awesome</span>
              </section>

              <!-- Evaluation Drilldown -->
              <section class="space-y-6">
                <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2">
                     <div class="w-1.5 h-6 bg-brand-primary rounded-full"></div>
                     <h4 class="text-[11px] font-black text-slate-900 uppercase tracking-tight">Audit des Épreuves</h4>
                   </div>
                   <span class="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase">Détails Interactifs</span>
                </div>

                <div class="space-y-4">
                  <!-- Prerequis Block -->
                  <div v-if="processedData?.filteredPrerequis" class="bg-white border border-slate-100 rounded-[32px] overflow-hidden">
                    <div class="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                       <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Étape 01 : Pré-requis Formation</p>
                       <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    </div>
                    <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div v-for="(ans, qid) in processedData.filteredPrerequis" :key="qid" class="p-5 p-5 bg-slate-50 rounded-[24px] border border-slate-100 transition-all hover:shadow-inner">
                          <p class="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tight line-clamp-2 min-h-[3.2em]">{{ getQuestionLabel(qid) }}</p>
                          <p class="text-xs font-black text-slate-900">{{ Array.isArray(ans) ? ans.join(', ') : ans }}</p>
                       </div>
                    </div>
                  </div>

                  <!-- Levels Block -->
                  <div v-if="editableSession.levelsScores" class="space-y-3">
                     <div v-for="(data, lv) in editableSession.levelsScores" :key="lv" class="bg-white border border-slate-100 rounded-[32px] overflow-hidden group">
                        <button @click="toggleExpandedLevel(lv)" class="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-all text-left">
                           <div class="flex items-center gap-5">
                              <div class="w-12 h-12 rounded-[18px] flex items-center justify-center font-black shadow-lg shadow-current/5 transition-all group-hover:scale-110" :class="data.validated ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'">
                                 <span class="material-icons-outlined text-xl">{{ data.validated ? 'verified' : 'cancel_schedule_send' }}</span>
                              </div>
                              <div class="space-y-0.5">
                                 <p class="text-sm font-black text-slate-900">{{ lv }}</p>
                                 <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score épreuve : {{ data.score }} / {{ data.total }}</p>
                              </div>
                           </div>
                           <div class="flex items-center gap-4">
                              <div :class="['px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', data.validated ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100']">
                                 {{ data.validated ? 'Validé' : 'Non Validé' }}
                              </div>
                              <span class="material-icons-outlined text-slate-200 group-hover:text-slate-900 transition-all" :class="{ 'rotate-180': expandedLevel === lv }">expand_more</span>
                           </div>
                        </button>
                        
                        <div v-if="expandedLevel === lv" class="px-8 pb-8 pt-0 animate-slide-in">
                           <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              <template v-if="editableSession.positionnementAnswers?.[lv]">
                                <div v-for="(ans, qid) in editableSession.positionnementAnswers[lv]" :key="qid" class="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                  <p class="text-[9px] font-black text-slate-400 uppercase mb-1 leading-tight">{{ getQuestionLabel(qid) }}</p>
                                  <p class="text-[11px] font-black text-slate-800">{{ Array.isArray(ans) ? ans.join(', ') : ans }}</p>
                                </div>
                              </template>
                              <div v-else class="col-span-2 py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                 <span class="material-icons-outlined text-gray-200 text-4xl mb-2">find_in_page</span>
                                 <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Détails de réponses non synchronisés</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Additional / Complementary Info Box -->
                  <div v-if="processedData?.filteredComplementaryAnswers || processedData?.filteredAvailabilities || editableSession.miseANiveauAnswers" class="bg-indigo-50/30 border border-indigo-100 rounded-[40px] p-10 space-y-10 shadow-sm shadow-indigo-500/5">
                     
                     <div v-if="processedData?.filteredComplementaryAnswers">
                        <div class="flex items-center gap-3 mb-6">
                           <span class="material-icons-outlined text-indigo-500 text-lg">psychology</span>
                           <p class="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Informations Complémentaires</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div v-for="(ans, qid) in processedData.filteredComplementaryAnswers" :key="qid" class="p-6 bg-white rounded-[24px] border border-indigo-100 shadow-sm shadow-indigo-200/10">
                              <p class="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-tight">{{ getQuestionLabel(qid) }}</p>
                              <p class="text-xs font-black text-indigo-900">{{ Array.isArray(ans) ? ans.join(', ') : ans }}</p>
                           </div>
                        </div>
                     </div>

                     <div v-if="editableSession.miseANiveauAnswers" class="pt-6 border-t border-indigo-100">
                        <div class="flex items-center gap-3 mb-6">
                           <span class="material-icons-outlined text-indigo-500 text-lg">trending_up</span>
                           <p class="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Données Mise à Niveau</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div v-for="(ans, qid) in editableSession.miseANiveauAnswers" :key="qid" class="p-6 bg-white rounded-[24px] border border-indigo-100 shadow-sm shadow-indigo-200/10">
                              <p class="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-tight">{{ getQuestionLabel(qid) }}</p>
                              <p class="text-xs font-black text-indigo-900">{{ Array.isArray(ans) ? ans.join(', ') : ans }}</p>
                           </div>
                        </div>
                     </div>

                  </div>
                </div>
              </section>
            </div>
          </div>

          <!-- Technical Footer -->
          <div class="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-6">
               <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Création : {{ formatDate(editableSession.createdAt) }}</p>
               </div>
               <button @click="exportSessionDetails(editableSession)" class="text-[10px] font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-2 group">
                 <span class="material-icons-outlined text-sm group-hover:rotate-12 transition-transform">terminal</span>
                 RAW JSON
               </button>
            </div>
            
            <div class="flex items-center gap-3">
               <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Export Rapide :</span>
               <button @click="downloadPdf(editableSession)" class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center shadow-sm">
                 <span class="material-icons-outlined text-lg">picture_as_pdf</span>
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
.animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.animate-slide-in { animation: slideIn 0.3s ease-out; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

select { background-image: none; }
</style>
