<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
);

const stats = ref([
  {
    label: "Sessions Totales",
    value: "0",
    icon: "groups",
    color: "brand",
    key: "totalSessions",
    trend: "+12.5%",
    trendUp: true
  },
  {
    label: "Score Moyen",
    value: "0%",
    icon: "analytics",
    color: "emerald",
    key: "avgScore",
    trend: "+3.2%",
    trendUp: true
  },
  {
    label: "Questions",
    value: "0",
    icon: "quiz",
    color: "violet",
    key: "totalQuestions",
    trend: "-1",
    trendUp: false
  },
  {
    label: "Formations",
    value: "0",
    icon: "school",
    color: "orange",
    key: "totalFormations",
    trend: "Stable",
    trendUp: true
  },
]);

const recentSessions = ref([]);
const sessionsData = ref([]);
const loading = ref(true);

const formationDistribution = computed(() => {
  const counts = {};
  sessionsData.value.forEach((s) => {
    const name = s.formationChoisie || "Non défini";
    counts[name] = (counts[name] || 0) + 1;
  });

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        backgroundColor: [
          "#ebb973",
          "#10b981",
          "#8b5cf6",
          "#f59e0b",
          "#ef4444",
          "#06b6d4",
          "#f43f5e",
          "#6366f1",
        ],
        borderWidth: 0,
        hoverOffset: 20,
        data: Object.values(counts),
      },
    ],
  };
});

const scoresTrend = computed(() => {
  const last7Days = [...Array(7)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    })
    .reverse();

  const dayCounts = last7Days.map((date) => {
    return sessionsData.value.filter((s) => s.createdAt.startsWith(date))
      .length;
  });

  return {
    labels: last7Days.map((d) =>
      new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    ),
    datasets: [
      {
        label: "Sessions",
        backgroundColor: "#ebb973",
        borderRadius: 8,
        data: dayCounts,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 12,
      bodyFont: { family: 'Outfit', weight: 'bold' },
      titleFont: { family: 'Outfit', weight: 'black' }
    }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { font: { family: 'Outfit' } } },
    x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Outfit' } } }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: { family: 'Outfit', size: 10, weight: 'bold' }
      }
    }
  }
};

async function fetchStats() {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const [statsRes, sessionsRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/admin/stats`),
      axios.get(`${apiBaseUrl}/sessions`),
    ]);

    stats.value = stats.value.map((s) => ({
      ...s,
      value: statsRes.data[s.key],
    }));

    sessionsData.value = sessionsRes.data;
    recentSessions.value = sessionsRes.data.slice(0, 5);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchStats);

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
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Bonjour, Admin 👋</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Voici l'état actuel de votre plateforme aujourd'hui
        </p>
      </div>
      <div class="flex gap-2">
        <button class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
          <span class="material-icons-outlined text-sm">calendar_today</span>
          Derniers 30 jours
        </button>
        <button class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
          <span class="material-icons-outlined text-sm">download</span>
          Rapport
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
      >
        <div class="flex items-start justify-between mb-4">
          <div :class="`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`" :style="`background-color: var(--${stat.color}-50); color: var(--${stat.color}-600);`" class="stat-icon-container">
            <span class="material-icons-outlined text-2xl">{{ stat.icon }}</span>
          </div>
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter" :class="stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
            <span class="material-icons-outlined text-[12px]">{{ stat.trendUp ? 'trending_up' : 'trending_down' }}</span>
            {{ stat.trend }}
          </div>
        </div>
        <div class="space-y-0.5">
          <p class="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
            {{ stat.label }}
          </p>
          <p class="text-3xl font-black text-slate-900">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-lg font-black text-slate-900">Activité hebdomadaire</h3>
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sessions / jour</span>
        </div>
        <div class="h-[280px]">
          <Bar :data="scoresTrend" :options="chartOptions" />
        </div>
      </div>
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-lg font-black text-slate-900">Répartition</h3>
          <span class="material-icons-outlined text-slate-300">pie_chart</span>
        </div>
        <div class="h-[280px]">
          <Pie :data="formationDistribution" :options="pieOptions" />
        </div>
      </div>
    </div>

    <!-- Recent Activity Section -->
    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
        <h3 class="text-lg font-black text-slate-900">Sessions Récentes</h3>
        <router-link
          to="/admin/sessions"
          class="text-brand-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
        >
          Voir tout <span class="material-icons-outlined text-sm">east</span>
        </router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
              <th class="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Formation</th>
              <th class="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th class="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <template v-if="loading">
              <tr v-for="i in 3" :key="i">
                <td colspan="4" class="px-8 py-6"><div class="h-6 bg-slate-50 animate-pulse rounded-lg"></div></td>
              </tr>
            </template>
            <tr
              v-else-if="recentSessions.length > 0"
              v-for="session in recentSessions"
              :key="session.id"
              class="group hover:bg-slate-50/70 transition-all"
            >
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-slate-200">
                    {{ (session.stagiaire?.prenom?.[0] || 'U') }}{{ (session.stagiaire?.nom?.[0] || '') }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black text-slate-900 truncate">
                      {{ session.stagiaire?.prenom }} {{ session.stagiaire?.nom }}
                    </p>
                    <p class="text-[10px] font-bold text-slate-400 truncate">
                      {{ session.stagiaire?.email }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                  <span class="text-xs font-bold text-slate-600">{{ session.formationChoisie }}</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <span class="text-[10px] font-bold text-slate-400">{{ formatDate(session.createdAt) }}</span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex flex-col items-end gap-1">
                  <span class="text-[11px] font-black text-slate-900">{{ session.scorePretest || 0 }}%</span>
                  <div class="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-brand-primary rounded-full transition-all duration-1000" :style="`width: ${session.scorePretest || 0}%`"></div>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-else>
              <td colspan="4" class="py-20 text-center">
                <span class="material-icons-outlined text-4xl text-slate-200 mb-2">history_toggle_off</span>
                <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune donnée récente</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-icon-container {
  /* Using standard tailwind colors via custom properties for group logic */
  --brand-50: rgba(235, 185, 115, 0.1);
  --brand-600: #ebb973;
  --blue-50: #eff6ff;
  --blue-600: #2563eb;
  --emerald-50: #ecfdf5;
  --emerald-600: #059669;
  --violet-50: #f5f3ff;
  --violet-600: #7c3aed;
  --orange-50: #fff7ed;
  --orange-600: #ea580c;
}

::-webkit-scrollbar {
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
