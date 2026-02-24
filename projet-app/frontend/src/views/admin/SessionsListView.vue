<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const sessions = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("all");
const formationFilter = ref("all");
const selectedSession = ref(null);
const editableSession = ref(null);
const showModal = ref(false);
const savingSession = ref(false);

function viewSession(session) {
  selectedSession.value = session;
  // Deep copy pour édition locale sans toucher la liste tant que ce n'est pas sauvegardé
  editableSession.value = JSON.parse(JSON.stringify(session));
  showModal.value = true;
}

const uniqueFormations = computed(() => {
  const forms = new Set(
    sessions.value.map((s) => s.formationChoisie).filter(Boolean),
  );
  return Array.from(forms).sort();
});

const filteredSessions = computed(() => {
  return sessions.value.filter((s) => {
    const matchesSearch =
      !searchQuery.value ||
      `${s.stagiaire?.prenom} ${s.stagiaire?.nom}`
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      s.stagiaire?.email
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "completed" ? s.isCompleted : !s.isCompleted);

    const matchesFormation =
      formationFilter.value === "all" ||
      s.formationChoisie === formationFilter.value;

    return matchesSearch && matchesStatus && matchesFormation;
  });
});

async function fetchSessions() {
  loading.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const res = await axios.get(`${apiBaseUrl}/sessions`);
    sessions.value = res.data;
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
  } finally {
    loading.value = false;
  }
}

async function saveSessionEdits() {
  if (!editableSession.value) return;
  savingSession.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

    const payload = {
      // Champs administratifs modifiables
      conseiller: editableSession.value.conseiller,
      formationChoisie: editableSession.value.formationChoisie,
      scorePretest: editableSession.value.scorePretest,
      finalRecommendation: editableSession.value.finalRecommendation,
      lastValidatedLevel: editableSession.value.lastValidatedLevel,
      stopLevel: editableSession.value.stopLevel,
      // Au besoin, l'admin peut aussi corriger les blocs JSON complets
      prerequisiteScore: editableSession.value.prerequisiteScore,
      levelsScores: editableSession.value.levelsScores,
      complementaryQuestions: editableSession.value.complementaryQuestions,
      availabilities: editableSession.value.availabilities,
    };

    await axios.patch(
      `${apiBaseUrl}/sessions/${editableSession.value.id}`,
      payload,
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
      `Supprimer définitivement la session de ${session.stagiaire?.prenom || ""} ${session.stagiaire?.nom || ""} ?`,
    )
  ) {
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await axios.delete(`${apiBaseUrl}/sessions/${session.id}`);
    await fetchSessions();
  } catch (error) {
    console.error("Failed to delete session:", error);
    alert("Erreur lors de la suppression de la session.");
  }
}

function exportToCSV() {
  if (filteredSessions.value.length === 0) return;

  const headers = [
    "ID",
    "Stagiaire",
    "Email",
    "Téléphone",
    "Conseiller",
    "Marque",
    "Formation",
    "Date",
    "Statut",
    "Score %",
    "Dernier niveau validé",
    "Niveau d'arrêt",
    "Recommandation finale",
  ];
  const rows = filteredSessions.value.map((s) => [
    s.id,
    `${s.stagiaire?.prenom} ${s.stagiaire?.nom}`,
    s.stagiaire?.email,
    s.telephone,
    s.conseiller,
    s.brand,
    s.formationChoisie,
    new Date(s.createdAt).toLocaleString(),
    s.isCompleted ? "Terminé" : "En cours",
    s.scorePretest || 0,
    s.lastValidatedLevel || "",
    s.stopLevel || "",
    s.finalRecommendation || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `sessions_export_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportSessionDetails(session) {
  const payload = {
    id: session.id,
    createdAt: session.createdAt,
    emailSentAt: session.emailSentAt,
    brand: session.brand,
    civilite: session.civilite,
    nom: session.nom,
    prenom: session.prenom,
    telephone: session.telephone,
    conseiller: session.conseiller,
    formationChoisie: session.formationChoisie,
    isCompleted: session.isCompleted,
    scorePretest: session.scorePretest,
    stopLevel: session.stopLevel,
    lastValidatedLevel: session.lastValidatedLevel,
    finalRecommendation: session.finalRecommendation,
    prerequisiteScore: session.prerequisiteScore,
    levelsScores: session.levelsScores,
    complementaryQuestions: session.complementaryQuestions,
    availabilities: session.availabilities,
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

onMounted(fetchSessions);

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="space-y-10 animate-fade-in">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Export Button -->
        <button
          @click="exportToCSV"
          class="px-6 py-3 btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg hover:bg-black transition-all"
        >
          <span class="material-icons-outlined text-sm">download</span>
          CSV
        </button>

        <!-- Search -->
        <div class="relative min-w-[200px]">
          <span
            class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            >search</span
          >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Nom ou Email..."
            class="w-full pl-12 pr-6 py-3 bg-white border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-xs font-bold transition-all shadow-sm"
          />
        </div>

        <!-- Formation Filter -->
        <select 
          v-model="formationFilter"
          class="px-4 py-3 bg-white border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          <option value="all">Toutes Formations</option>
          <option v-for="form in uniqueFormations" :key="form" :value="form">{{ form }}</option>
        </select>

        <!-- Status Filter -->
        <select 
          v-model="statusFilter"
          class="px-4 py-3 bg-white border-2 border-transparent focus:border-brand-primary outline-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          <option value="all">Tous Statuts</option>
          <option value="completed">Terminé</option>
          <option value="pending">En cours</option>
        </select>
      </div>

    <div class="bg-white rounded-[40px] shadow-sm overflow-hidden">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-gray-50 bg-gray-50/50">
            <th
              class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Stagiaire
            </th>
            <th
              class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Formation
            </th>
            <th
              class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Date
            </th>
            <th
              class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Statut
            </th>
            <th
              class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest"
            >
              Score Global
            </th>
            <th
              class="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
            <td v-for="j in 6" :key="j" class="px-8 py-6">
              <div class="h-4 bg-gray-100 rounded w-full"></div>
            </td>
          </tr>

          <tr
            v-else
            v-for="session in filteredSessions"
            :key="session.id"
            class="hover:bg-blue-50/30 transition-colors group"
          >
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-[10px]"
                >
                  {{ session.stagiaire?.prenom?.[0]
                  }}{{ session.stagiaire?.nom?.[0] }}
                </div>
                <div>
                  <p class="text-sm font-black heading-primary">
                    {{ session.stagiaire?.prenom }} {{ session.stagiaire?.nom }}
                  </p>
                  <p class="text-[10px] font-bold text-gray-400">
                    {{ session.stagiaire?.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6">
              <span class="text-xs font-bold text-gray-600">{{
                session.formationChoisie
              }}</span>
            </td>
            <td class="px-8 py-6">
              <span class="text-xs font-bold text-gray-400">{{
                formatDate(session.createdAt)
              }}</span>
            </td>
            <td class="px-8 py-6">
              <span
                class="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest"
                :class="
                  session.isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-orange-100 text-orange-600'
                "
              >
                {{ session.isCompleted ? "Terminé" : "En cours" }}
              </span>
            </td>
            <td class="px-8 py-6">
              <div class="flex items-center gap-2">
                <div
                  class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]"
                >
                  <div
                    class="h-full bg-brand-primary rounded-full transition-all"
                    :style="{ width: `${session.scorePretest || 0}%` }"
                  ></div>
                </div>
                <span class="text-xs font-black heading-primary"
                  >{{ session.scorePretest || 0 }}%</span
                >
              </div>
            </td>
            <td class="px-8 py-6">
              <div class="flex gap-2 justify-end">
                <button
                  @click="viewSession(session)"
                  class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center"
                  title="Voir le dossier"
                >
                  <span class="material-icons-outlined text-sm">visibility</span>
                </button>
                <button
                  @click="exportSessionDetails(session)"
                  class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 hover:border-emerald-200 hover:text-emerald-500 transition-all flex items-center justify-center"
                  title="Exporter en JSON"
                >
                  <span class="material-icons-outlined text-sm">download</span>
                </button>
                <button
                  @click="deleteSession(session)"
                  class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center"
                  title="Supprimer la session"
                >
                  <span class="material-icons-outlined text-sm">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="!loading && sessions.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-300"
      >
        <span class="material-icons-outlined text-6xl mb-4 opacity-20"
          >inventory_2</span
        >
        <p class="font-bold uppercase tracking-widest text-xs">
          Aucune session enregistrée
        </p>
      </div>
    </div>

    <!-- Modal Détails Session -->
    <div v-if="showModal && editableSession" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl relative overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        <div class="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 class="text-2xl font-black heading-primary">
              Dossier de {{ editableSession.stagiaire?.prenom }} {{ editableSession.stagiaire?.nom }}
            </h3>
            <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              Formation : {{ editableSession.formationChoisie }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="saveSessionEdits"
              :disabled="savingSession"
              class="px-4 py-2 mr-2 bg-brand-primary text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-brand-secondary disabled:opacity-60 flex items-center gap-2"
            >
              <span class="material-icons-outlined text-sm">save</span>
              {{ savingSession ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
            <button @click="showModal = false" class="text-gray-300 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl p-2">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        <div class="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
          <!-- Infos Candidat -->
          <section>
            <h4 class="text-brand-primary font-black uppercase tracking-widest text-[10px] mb-4">Informations Candidat</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-6 rounded-[24px]">
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email</p>
                <p class="font-bold text-sm">{{ editableSession.stagiaire?.email }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Téléphone</p>
                <p class="font-bold text-sm">{{ editableSession.telephone || "N/A" }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date de création</p>
                <p class="font-bold text-sm">{{ formatDate(editableSession.createdAt) }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Conseiller</p>
                <input
                  v-model="editableSession.conseiller"
                  class="w-full px-3 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none"
                />
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Marque</p>
                <p class="font-bold text-sm">{{ editableSession.brand || "N/A" }}</p>
              </div>
              <div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Formation choisie</p>
                <input
                  v-model="editableSession.formationChoisie"
                  class="w-full px-3 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none"
                />
              </div>
            </div>
          </section>

          <!-- Bilan Niveau -->
          <section>
            <h4 class="text-brand-primary font-black uppercase tracking-widest text-[10px] mb-4">Résultats du Bilan</h4>
            <div class="bg-blue-50/50 p-6 rounded-[24px] border border-blue-50 flex items-center justify-between">
              <div>
                <p class="font-black text-xl text-blue-900 mb-1">
                  Score Global :
                  <input
                    v-model.number="editableSession.scorePretest"
                    type="number"
                    min="0"
                    max="100"
                    class="w-20 inline-block ml-2 px-2 py-1 text-sm font-black rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-brand-primary"
                  />%
                </p>
                <p class="text-xs font-bold text-blue-600">
                  Statut : {{ editableSession.isCompleted ? "Terminé" : "En cours" }}
                </p>
              </div>
              <div class="text-right space-y-2">
                 <p class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Niveau Atteint</p>
                 <input
                   v-model="editableSession.stopLevel"
                   class="inline-block mt-1 px-4 py-2 bg-white text-brand-primary font-black rounded-xl shadow-sm border border-blue-100 focus:outline-none focus:border-brand-primary"
                 />
                 <p class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-3">Dernier niveau validé</p>
                 <input
                   v-model="editableSession.lastValidatedLevel"
                   class="inline-block mt-1 px-4 py-2 bg-white text-blue-900 font-black rounded-xl shadow-sm border border-blue-100 focus:outline-none focus:border-brand-primary"
                 />
              </div>
            </div>
            <div class="mt-4">
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Recommandation finale</p>
              <input
                v-model="editableSession.finalRecommendation"
                class="w-full px-3 py-2 text-sm font-bold rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none"
              />
            </div>
          </section>

          <!-- Détails additionnels JSON -->
          <section
            v-if="editableSession.prerequisiteScore || editableSession.levelsScores || editableSession.complementaryQuestions || editableSession.availabilities"
          >
            <h4 class="text-brand-primary font-black uppercase tracking-widest text-[10px] mb-4">Données Complémentaires</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div v-if="editableSession.prerequisiteScore" class="bg-gray-50 p-6 rounded-[24px]">
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Score Pré-requis</p>
                  <pre class="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 overflow-x-auto">{{ JSON.stringify(editableSession.prerequisiteScore, null, 2) }}</pre>
               </div>
               <div v-if="editableSession.levelsScores" class="bg-gray-50 p-6 rounded-[24px]">
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Scores par niveau</p>
                  <pre class="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 overflow-x-auto">{{ JSON.stringify(editableSession.levelsScores, null, 2) }}</pre>
               </div>
               <div v-if="editableSession.complementaryQuestions" class="bg-gray-50 p-6 rounded-[24px]">
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Questions Complémentaires</p>
                  <pre class="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 overflow-x-auto">{{ JSON.stringify(editableSession.complementaryQuestions, null, 2) }}</pre>
               </div>
               <div v-if="editableSession.availabilities" class="bg-gray-50 p-6 rounded-[24px]">
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Disponibilités</p>
                  <pre class="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100 overflow-x-auto">{{ JSON.stringify(editableSession.availabilities, null, 2) }}</pre>
               </div>
            </div>
          </section>

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
