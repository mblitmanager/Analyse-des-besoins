<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const sessions = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("all");
const formationFilter = ref("all");

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

function exportToCSV() {
  if (filteredSessions.value.length === 0) return;

  const headers = [
    "ID",
    "Stagiaire",
    "Email",
    "Formation",
    "Date",
    "Statut",
    "Score %",
  ];
  const rows = filteredSessions.value.map((s) => [
    s.id,
    `${s.stagiaire?.prenom} ${s.stagiaire?.nom}`,
    s.stagiaire?.email,
    s.formationChoisie,
    new Date(s.createdAt).toLocaleString(),
    s.isCompleted ? "Terminé" : "En cours",
    s.scorePretest || 0,
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
            <td class="px-8 py-6 text-right">
              <button
                class="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center"
              >
                <span class="material-icons-outlined text-sm">visibility</span>
              </button>
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
