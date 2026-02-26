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
    label: "Total Sessions",
    value: "0",
    icon: "people",
    color: "blue",
    key: "totalSessions",
  },
  {
    label: "Avg. Score",
    value: "0%",
    icon: "trending_up",
    color: "green",
    key: "avgScore",
  },
  {
    label: "Questions",
    value: "0",
    icon: "quiz",
    color: "purple",
    key: "totalQuestions",
  },
  {
    label: "Formations",
    value: "0",
    icon: "school",
    color: "orange",
    key: "totalFormations",
  },
]);

const recentSessions = ref([]);
const sessionsData = ref([]);
const loading = ref(true);

const formationDistribution = computed(() => {
  const counts = {};
  sessionsData.value.forEach((s) => {
    const name = s.formationChoisie || "N/A";
    counts[name] = (counts[name] || 0) + 1;
  });

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#9333ea",
          "#ea580c",
          "#3b82f6",
          "#10b981",
          "#a855f7",
          "#f97316",
        ],
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
        backgroundColor: "#2563eb",
        data: dayCounts,
      },
    ],
  };
});

async function fetchStats() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const [statsRes, sessionsRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/admin/stats`),
      axios.get(`${apiBaseUrl}/sessions`),
    ]);

    // Update stats values
    stats.value = stats.value.map((s) => ({
      ...s,
      value: statsRes.data[s.key],
    }));

    sessionsData.value = sessionsRes.data;
    // Get 5 most recent sessions
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
  <div class="space-y-10 animate-fade-in">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <h2 class="text-3xl font-black heading-primary">Tableau de Bord</h2>
        <p
          class="text-gray-400 font-bold uppercase tracking-widest text-[10px]"
        >
          Aperçu global de l'activité Wizy-Learn
        </p>
      </div>
      <button
        class="w-full md:w-auto px-6 py-3 btn-primary rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg transition-all"
      >
        <span class="material-icons-outlined text-sm">download</span>
        Exporter Rapport
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            :class="`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`"
          >
            <span class="material-icons-outlined text-2xl">{{
              stat.icon
            }}</span>
          </div>
          <span
            class="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full"
            >+12%</span
          >
        </div>
        <p
          class="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1"
        >
          {{ stat.label }}
        </p>
        <p class="text-3xl font-black heading-primary">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white rounded-[40px] shadow-sm p-10">
        <h3 class="text-xl font-black section-title mb-8">
          Activité des 7 derniers jours
        </h3>
        <div class="h-[300px]">
          <Bar
            :data="scoresTrend"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
            }"
          />
        </div>
      </div>
      <div class="bg-white rounded-[40px] shadow-sm p-10">
        <h3 class="text-xl font-black section-title mb-8">
          Répartition par Formation
        </h3>
        <div class="h-[300px] flex justify-center">
          <Pie
            :data="formationDistribution"
            :options="{ responsive: true, maintainAspectRatio: false }"
          />
        </div>
      </div>
    </div>

    <!-- Recent Activity Section -->
    <div class="bg-white rounded-[40px] shadow-sm p-10">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-xl font-black section-title">Sessions Récentes</h3>
        <router-link
          to="/admin/sessions"
          class="text-brand-primary font-black uppercase tracking-widest text-[10px] hover:underline"
          >Voir tout</router-link
        >
      </div>

      <div v-if="loading" class="flex flex-col gap-4">
        <div
          v-for="i in 3"
          :key="i"
          class="h-16 bg-gray-50 animate-pulse rounded-2xl"
        ></div>
      </div>

      <div v-else-if="recentSessions.length > 0" class="overflow-x-auto -mx-10 px-10">
        <table class="w-full min-w-max text-left">
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="session in recentSessions"
              :key="session.id"
              class="group hover:bg-blue-50/30 transition-all"
            >
              <td class="py-6 pr-6">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-[10px]"
                  >
                    {{ session.stagiaire?.prenom?.[0]
                    }}{{ session.stagiaire?.nom?.[0] }}
                  </div>
                  <div>
                    <p class="text-sm font-black heading-primary">
                      {{ session.stagiaire?.prenom }}
                      {{ session.stagiaire?.nom }}
                    </p>
                    <p class="text-[10px] font-bold text-gray-400">
                      {{ session.stagiaire?.email }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-6 px-6">
                <span class="text-xs font-bold text-gray-600">{{
                  session.formationChoisie
                }}</span>
              </td>
              <td class="py-6 px-6">
                <span class="text-xs font-bold text-gray-400">{{
                  formatDate(session.createdAt)
                }}</span>
              </td>
              <td class="py-6 pl-6 text-right">
                <span class="text-xs font-black heading-primary"
                  >{{ session.scorePretest || 0 }}%</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center py-20 text-gray-300"
      >
        <span class="material-icons-outlined text-6xl mb-4 opacity-20"
          >history</span
        >
        <p class="font-bold uppercase tracking-widest text-xs">
          Aucune activité récente à afficher
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

/* Tailwind Safelist for dynamic colors if needed, but here they are static classes */
.bg-blue-50 {
  background-color: #eff6ff;
}
.text-blue-600 {
  color: #2563eb;
}
.bg-green-50 {
  background-color: #f0fdf4;
}
.text-green-600 {
  color: #16a34a;
}
.bg-purple-50 {
  background-color: #faf5ff;
}
.text-purple-600 {
  color: #9333ea;
}
.bg-orange-50 {
  background-color: #fff7ed;
}
.text-orange-600 {
  color: #ea580c;
}
</style>
