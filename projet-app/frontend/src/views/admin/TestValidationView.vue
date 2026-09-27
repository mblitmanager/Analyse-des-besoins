<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";

// Campaigns are produced on the server by `npm run test:e2e:matrix`
// (scripts/run-e2e-screenshots.sh) and served read-only by /admin/test-runs.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002/api";
const REVIEW_KEY = "test_validation_reviews";

const runs = ref([]);
const selectedRunId = ref("");
const run = ref(null);
const loading = ref(true);
const loadingRun = ref(false);
const error = ref("");

const formationFilter = ref("");
const statusFilter = ref("");
const search = ref("");
const collapsed = ref({});
const openCase = ref(null);
const zoomed = ref(null);

// ─── Business review (per case title, kept across campaigns, per browser) ───
const reviews = ref({});
try {
  reviews.value = JSON.parse(localStorage.getItem(REVIEW_KEY) || "{}");
} catch {
  reviews.value = {};
}
watch(reviews, (val) => {
  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(val));
  } catch {
    /* storage unavailable: reviews stay in memory */
  }
}, { deep: true });

function cycleReview(title) {
  const current = reviews.value[title];
  const next = !current ? "ok" : current === "ok" ? "ko" : null;
  reviews.value = { ...reviews.value, [title]: next };
}

// ─── Data loading ───
async function loadRuns() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get(`${apiBaseUrl}/admin/test-runs`);
    runs.value = res.data || [];
    if (runs.value.length && !runs.value.some((r) => r.id === selectedRunId.value)) {
      selectedRunId.value = runs.value[0].id;
    }
  } catch (e) {
    error.value = "Impossible de charger les campagnes de test.";
  } finally {
    loading.value = false;
  }
}

watch(selectedRunId, async (id) => {
  if (!id) return;
  loadingRun.value = true;
  openCase.value = null;
  try {
    const res = await axios.get(`${apiBaseUrl}/admin/test-runs/${encodeURIComponent(id)}`);
    run.value = res.data;
  } catch {
    error.value = "Impossible de charger cette campagne.";
  } finally {
    loadingRun.value = false;
  }
});

onMounted(loadRuns);

// Screenshots need the admin token: fetched as blobs, shown through object URLs.
const imageUrls = ref({});
async function loadImage(c, shot) {
  const key = `${run.value.id}/${c.id}/${shot.file}`;
  if (imageUrls.value[key]) return;
  imageUrls.value = { ...imageUrls.value, [key]: "" };
  try {
    const res = await axios.get(
      `${apiBaseUrl}/admin/test-runs/${run.value.id}/files/${c.id}/${shot.file}`,
      { responseType: "blob" },
    );
    imageUrls.value = { ...imageUrls.value, [key]: URL.createObjectURL(res.data) };
  } catch {
    imageUrls.value = { ...imageUrls.value, [key]: null };
  }
}
function imageUrl(c, shot) {
  return imageUrls.value[`${run.value?.id}/${c.id}/${shot.file}`];
}
onBeforeUnmount(() => {
  Object.values(imageUrls.value).forEach((url) => url && URL.revokeObjectURL(url));
});

function showCase(c) {
  openCase.value = c;
  c.screenshots.forEach((shot) => loadImage(c, shot));
}

// ─── Derived views ───
const cases = computed(() => run.value?.cases || []);
const matrixCases = computed(() => cases.value.filter((c) => c.formation));

const formations = computed(() =>
  [...new Set(matrixCases.value.map((c) => c.formation))].sort((a, b) => a.localeCompare(b)),
);

const filteredCases = computed(() => {
  const q = search.value.trim().toLowerCase();
  return matrixCases.value.filter((c) => {
    if (formationFilter.value && c.formation !== formationFilter.value) return false;
    if (statusFilter.value === "annotated") return c.annotations?.length > 0;
    if (statusFilter.value === "review-ko") return reviews.value[c.title] === "ko";
    if (statusFilter.value && c.status !== statusFilter.value) return false;
    if (q && !`${c.title} ${JSON.stringify(c.details || {})}`.toLowerCase().includes(q)) return false;
    return true;
  });
});

const groups = computed(() => {
  const map = new Map();
  for (const c of filteredCases.value) {
    if (!map.has(c.formation)) map.set(c.formation, []);
    map.get(c.formation).push(c);
  }
  return [...map.entries()].map(([formation, items]) => ({
    formation,
    items,
    passed: items.filter((c) => c.status === "passed").length,
    failed: items.filter((c) => c.status === "failed").length,
  }));
});

const totals = computed(() => {
  const all = matrixCases.value;
  return {
    total: all.length,
    passed: all.filter((c) => c.status === "passed").length,
    failed: all.filter((c) => c.status === "failed").length,
    flaky: all.filter((c) => c.status === "flaky").length,
    annotated: all.filter((c) => c.annotations?.length).length,
    reviewed: all.filter((c) => reviews.value[c.title]).length,
  };
});

function caseLabel(c) {
  return c.title.split(" | ").slice(1).join(" · ");
}

function p3Summary(c) {
  const p3 = c.details?.p3;
  if (!p3) return "—";
  if (typeof p3 === "string") return p3;
  const target = p3.session?.parcoursTitle || p3.choix || "";
  return `${p3.type === "choix imposés" ? "Imposé" : "Liste"} → ${target}${p3.sansTest ? " (sans test)" : ""}`;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function formatDuration(ms) {
  const s = Math.round((ms || 0) / 1000);
  return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
}

const statusStyle = {
  passed: { label: "Réussi", cls: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: "check_circle" },
  failed: { label: "Échec", cls: "bg-rose-50 text-rose-600 border-rose-100", icon: "error" },
  flaky: { label: "Instable", cls: "bg-amber-50 text-amber-600 border-amber-100", icon: "sync_problem" },
  skipped: { label: "Ignoré", cls: "bg-slate-50 text-slate-400 border-slate-100", icon: "remove_circle" },
};

const screenshotLabels = {
  "p1-01-positionnement": "P1/P2 · Positionnement",
  "p1-02-resultats": "P1/P2 · Résultats",
  "p1-02-validation-finale": "P1/P2 · Validation finale",
  "p3-00-choix-imposes": "P3 · Choix imposés",
  "p3-00-liste": "P3 · Liste des formations",
  "p3-01-positionnement": "P3 · Positionnement",
  "p3-02-resultats": "P3 · Résultats",
  "p3-03-validation-finale": "P3 · Validation finale",
};
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Recette automatisée</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Parcours formation × niveau × P3 joués par Playwright
        </p>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedRunId"
          :disabled="!runs.length"
          class="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 shadow-sm"
        >
          <option v-for="r in runs" :key="r.id" :value="r.id">
            {{ formatDate(r.startedAt) }} — {{ r.totals.passed }}/{{ r.totals.total }} réussis
          </option>
        </select>
        <button
          @click="loadRuns"
          class="w-11 h-11 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900"
          title="Actualiser"
        >
          <span class="material-icons-outlined">refresh</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-20 text-center text-slate-400 text-sm font-bold">Chargement…</div>

    <div v-else-if="error" class="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-700 text-sm font-bold">
      {{ error }}
    </div>

    <!-- No campaign yet -->
    <div v-else-if="!runs.length" class="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-4">
      <h3 class="text-lg font-black text-slate-900">Aucune campagne publiée</h3>
      <p class="text-sm text-slate-500 leading-relaxed">
        Les campagnes sont lancées sur le serveur, sur une base de test isolée, puis publiées ici
        automatiquement avec leurs captures d'écran.
      </p>
      <pre class="p-4 bg-slate-900 text-emerald-300 rounded-2xl text-xs overflow-x-auto">cd projet-app/frontend
npm run test:e2e:matrix
# une formation : E2E_FORMATIONS=word npm run test:e2e:matrix</pre>
    </div>

    <template v-else-if="run">
      <!-- Summary -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cas joués</p>
          <p class="text-2xl font-black text-slate-900">{{ totals.total }}</p>
          <p class="text-[10px] font-bold text-slate-400">{{ formatDuration(run.duration) }}</p>
        </div>
        <button @click="statusFilter = statusFilter === 'passed' ? '' : 'passed'" class="text-left bg-white rounded-3xl p-5 border shadow-sm" :class="statusFilter === 'passed' ? 'border-emerald-300' : 'border-slate-100'">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Réussis</p>
          <p class="text-2xl font-black text-emerald-500">{{ totals.passed }}</p>
        </button>
        <button @click="statusFilter = statusFilter === 'failed' ? '' : 'failed'" class="text-left bg-white rounded-3xl p-5 border shadow-sm" :class="statusFilter === 'failed' ? 'border-rose-300' : 'border-slate-100'">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Échecs</p>
          <p class="text-2xl font-black text-rose-500">{{ totals.failed + totals.flaky }}</p>
          <p v-if="totals.flaky" class="text-[10px] font-bold text-amber-500">dont {{ totals.flaky }} instable(s)</p>
        </button>
        <button @click="statusFilter = statusFilter === 'annotated' ? '' : 'annotated'" class="text-left bg-white rounded-3xl p-5 border shadow-sm" :class="statusFilter === 'annotated' ? 'border-amber-300' : 'border-slate-100'">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remarques</p>
          <p class="text-2xl font-black text-amber-500">{{ totals.annotated }}</p>
        </button>
        <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validés métier</p>
          <p class="text-2xl font-black text-slate-900">{{ totals.reviewed }}<span class="text-sm text-slate-300"> / {{ totals.total }}</span></p>
        </div>
      </div>

      <div class="w-full h-3 bg-slate-50 rounded-full overflow-hidden flex">
        <div class="h-full bg-emerald-500" :style="{ width: (totals.passed / (totals.total || 1)) * 100 + '%' }"></div>
        <div class="h-full bg-amber-400" :style="{ width: (totals.flaky / (totals.total || 1)) * 100 + '%' }"></div>
        <div class="h-full bg-rose-500" :style="{ width: (totals.failed / (totals.total || 1)) * 100 + '%' }"></div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-3">
        <select v-model="formationFilter" class="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700">
          <option value="">Toutes les formations</option>
          <option v-for="f in formations" :key="f" :value="f">{{ f }}</option>
        </select>
        <select v-model="statusFilter" class="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700">
          <option value="">Tous les statuts</option>
          <option value="passed">Réussis</option>
          <option value="failed">Échecs</option>
          <option value="flaky">Instables</option>
          <option value="annotated">Avec remarque</option>
          <option value="review-ko">Refusés métier</option>
        </select>
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher un parcours, un niveau, une formation P3…"
          class="flex-1 px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700"
        />
      </div>

      <div v-if="loadingRun" class="py-10 text-center text-slate-400 text-sm font-bold">Chargement de la campagne…</div>

      <!-- Cases grouped by formation -->
      <div v-else class="grid grid-cols-1 gap-4">
        <p v-if="!groups.length" class="py-10 text-center text-slate-400 text-sm font-bold">Aucun cas ne correspond aux filtres.</p>
        <div v-for="g in groups" :key="g.formation" class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <button @click="collapsed[g.formation] = !collapsed[g.formation]" class="w-full p-6 flex items-center gap-4 text-left hover:bg-slate-50/50">
            <div class="flex-1">
              <h4 class="text-lg font-black text-slate-900 tracking-tight">{{ g.formation }}</h4>
              <p class="text-[10px] font-black uppercase tracking-widest" :class="g.failed ? 'text-rose-500' : 'text-emerald-500'">
                {{ g.passed }} / {{ g.items.length }} réussis<span v-if="g.failed"> · {{ g.failed }} échec(s)</span>
              </p>
            </div>
            <span class="material-icons-outlined text-slate-300 transition-transform" :class="{ 'rotate-180': !collapsed[g.formation] }">expand_more</span>
          </button>

          <div v-if="!collapsed[g.formation]" class="border-t border-slate-50 overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-slate-50/50">
                  <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cas</th>
                  <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                  <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Parcours P1/P2 attendu → obtenu</th>
                  <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">P3</th>
                  <th class="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Métier</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="c in g.items" :key="c.id" class="hover:bg-slate-50/50 cursor-pointer" @click="showCase(c)">
                  <td class="px-6 py-4 max-w-[260px]">
                    <p class="text-xs font-black text-slate-900">{{ caseLabel(c) }}</p>
                    <p v-if="c.details?.niveauxReussis" class="text-[10px] font-bold text-slate-400">
                      Niveaux réussis : {{ c.details.niveauxReussis.length ? c.details.niveauxReussis.join(", ") : "aucun" }}
                    </p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border" :class="statusStyle[c.status]?.cls">
                      <span class="material-icons-outlined text-xs">{{ statusStyle[c.status]?.icon }}</span>
                      {{ statusStyle[c.status]?.label }}
                    </span>
                    <span v-if="c.annotations?.length" class="ml-1 material-icons-outlined text-amber-500 text-sm align-middle" :title="c.annotations.map((a) => a.description).join('\n')">info</span>
                  </td>
                  <td class="px-6 py-4 max-w-[320px]">
                    <p class="text-[11px] font-bold text-slate-500">{{ c.details?.choix || "Aucune règle" }}</p>
                    <p v-if="c.details?.sessionP1" class="text-[11px] font-black" :class="c.details.sessionP1.parcoursTitle?.trim() === c.details.choix?.trim() ? 'text-emerald-600' : 'text-rose-600'">
                      → {{ c.details.sessionP1.parcoursTitle }}
                    </p>
                  </td>
                  <td class="px-6 py-4 max-w-[280px] text-[11px] font-bold text-slate-600">{{ p3Summary(c) }}</td>
                  <td class="px-6 py-4 text-center" @click.stop>
                    <button
                      @click="cycleReview(c.title)"
                      class="w-9 h-9 rounded-xl flex items-center justify-center mx-auto border-2"
                      :class="{
                        'bg-white border-slate-100 text-slate-200': !reviews[c.title],
                        'bg-emerald-500 border-emerald-500 text-white': reviews[c.title] === 'ok',
                        'bg-rose-500 border-rose-500 text-white': reviews[c.title] === 'ko',
                      }"
                      :title="reviews[c.title] === 'ok' ? 'Validé métier' : reviews[c.title] === 'ko' ? 'Refusé métier' : 'À valider'"
                    >
                      <span class="material-icons-outlined text-sm">{{ reviews[c.title] === 'ko' ? 'close' : 'check' }}</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Case detail -->
    <div v-if="openCase" class="fixed inset-0 z-50 flex justify-end bg-slate-900/40" @click.self="openCase = null">
      <div class="w-full max-w-3xl h-full bg-white shadow-2xl overflow-y-auto p-8 space-y-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ openCase.formation }}</p>
            <h3 class="text-xl font-black text-slate-900">{{ caseLabel(openCase) }}</h3>
            <span class="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border" :class="statusStyle[openCase.status]?.cls">
              {{ statusStyle[openCase.status]?.label }} · {{ formatDuration(openCase.duration) }}
            </span>
          </div>
          <button @click="openCase = null" class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 flex items-center justify-center">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div v-if="openCase.errors?.length" class="space-y-2">
          <h4 class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Écarts détectés</h4>
          <pre v-for="(err, i) in openCase.errors" :key="i" class="p-4 bg-rose-50 text-rose-800 rounded-2xl text-[11px] whitespace-pre-wrap">{{ err }}</pre>
        </div>

        <div v-if="openCase.annotations?.length" class="space-y-2">
          <h4 class="text-[10px] font-black text-amber-500 uppercase tracking-widest">Remarques</h4>
          <p v-for="(a, i) in openCase.annotations" :key="i" class="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold">{{ a.description || a.type }}</p>
        </div>

        <div v-if="openCase.details" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-4 bg-slate-50 rounded-2xl space-y-1">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">P1 / P2</h4>
            <p><b>Niveaux vus :</b> {{ (openCase.details.niveauxVus || []).join(", ") }}</p>
            <p><b>Règles attendues :</b> {{ (openCase.details.reglesAttendues || []).join(" / ") || "aucune" }}</p>
            <p v-if="openCase.details.sessionP1"><b>Parcours enregistré :</b> {{ openCase.details.sessionP1.parcoursTitle }}</p>
            <p v-if="openCase.details.sessionP1"><b>Recommandation :</b> {{ openCase.details.sessionP1.finalRecommendation }}</p>
            <p v-if="openCase.details.sessionP1"><b>Niveau d'arrêt :</b> {{ openCase.details.sessionP1.stopLevel }}</p>
          </div>
          <div class="p-4 bg-slate-50 rounded-2xl space-y-1">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">P3</h4>
            <template v-if="openCase.details.p3 && typeof openCase.details.p3 === 'object'">
              <p><b>Type :</b> {{ openCase.details.p3.type }}<span v-if="openCase.details.p3.sansTest"> (validé sans test)</span></p>
              <p><b>Propositions :</b> {{ (openCase.details.p3.options || []).join(" / ") }}</p>
              <p><b>Choix :</b> {{ openCase.details.p3.choix }}</p>
              <p v-if="openCase.details.p3.session"><b>Parcours P3 :</b> {{ openCase.details.p3.session.parcoursTitle }}</p>
              <p v-if="openCase.details.p3.session"><b>Recommandation P3 :</b> {{ openCase.details.p3.session.finalRecommendation }}</p>
            </template>
            <p v-else>{{ openCase.details.p3 || "—" }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Captures ({{ openCase.screenshots.length }})</h4>
          <div class="grid grid-cols-2 gap-3">
            <button v-for="shot in openCase.screenshots" :key="shot.file" @click="zoomed = imageUrl(openCase, shot)" class="text-left space-y-1">
              <div class="aspect-[4/3] bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
                <img v-if="imageUrl(openCase, shot)" :src="imageUrl(openCase, shot)" :alt="shot.name" class="w-full h-full object-cover object-top" />
                <span v-else-if="imageUrl(openCase, shot) === null" class="text-[10px] text-rose-400 font-bold">Indisponible</span>
                <span v-else class="text-[10px] text-slate-300 font-bold">Chargement…</span>
              </div>
              <p class="text-[10px] font-black text-slate-500">{{ screenshotLabels[shot.name] || shot.name }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Zoom -->
    <div v-if="zoomed" class="fixed inset-0 z-[60] bg-slate-900/80 overflow-y-auto p-6" @click="zoomed = null">
      <img :src="zoomed" alt="Capture" class="mx-auto max-w-5xl w-full rounded-xl shadow-2xl" />
    </div>
  </div>
</template>
