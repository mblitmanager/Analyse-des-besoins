<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

// Parcours map computed by the backend (GET /admin/parcours-map): per formation, the
// possible P1 + P2 parcours and, for each, the P3 choices. Also exported (Excel, PDF).
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002/api";

const map = ref([]);
const loading = ref(true);
const error = ref("");
const search = ref("");
const open = ref({});
const exporting = ref("");

onMounted(async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/admin/parcours-map`);
    map.value = res.data || [];
  } catch {
    error.value = "Impossible de charger la cartographie des parcours.";
  } finally {
    loading.value = false;
  }
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return map.value;
  return map.value.filter((f) => JSON.stringify(f).toLowerCase().includes(q));
});

const totals = computed(() => ({
  formations: map.value.length,
  parcours: map.value.reduce((n, f) => n + f.parcours.length, 0),
  orphans: map.value.reduce((n, f) => n + f.unmatchedP3Rules.length, 0),
  withoutParcours: map.value.filter((f) => !f.parcours.length).length,
}));

const sourceLabel = {
  override: "Imposé (P3 Override)",
  generic: "Règle sans condition P1/P2",
  libre: "Liste libre",
};

async function download(format) {
  exporting.value = format;
  try {
    const res = await axios.get(`${apiBaseUrl}/admin/parcours-map/export.${format}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cartographie-parcours-${new Date().toISOString().slice(0, 10)}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    error.value = "L'export a échoué.";
  } finally {
    exporting.value = "";
  }
}
</script>

<template>
  <section class="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-black text-slate-900">Cartographie des parcours</h3>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {{ totals.formations }} formations · {{ totals.parcours }} parcours P1 + P2
          <span v-if="totals.orphans" class="text-rose-500"> · {{ totals.orphans }} règle(s) P3 sans parcours</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="search"
          type="search"
          placeholder="Formation, parcours, certification…"
          class="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 w-56"
        />
        <button
          v-for="format in ['xlsx', 'pdf']"
          :key="format"
          @click="download(format)"
          :disabled="!!exporting"
          class="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1"
        >
          <span class="material-icons-outlined text-sm">{{ format === 'pdf' ? 'picture_as_pdf' : 'table_view' }}</span>
          {{ exporting === format ? '…' : format === 'pdf' ? 'PDF' : 'Excel' }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm font-bold text-slate-400">Chargement…</p>
    <p v-else-if="error" class="p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm font-bold">{{ error }}</p>

    <div v-else class="space-y-3">
      <div v-for="f in filtered" :key="f.id" class="border border-slate-100 rounded-2xl overflow-hidden">
        <button @click="open[f.id] = !open[f.id]" class="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50">
          <span class="material-icons-outlined text-slate-300 transition-transform" :class="{ 'rotate-90': open[f.id] }">chevron_right</span>
          <span class="flex-1">
            <span class="text-sm font-black text-slate-900">{{ f.label }}</span>
            <span class="block text-[10px] font-bold text-slate-400">{{ f.levels.join(' > ') }}</span>
          </span>
          <span class="text-[10px] font-black uppercase tracking-widest" :class="f.parcours.length ? 'text-slate-400' : 'text-rose-500'">
            {{ f.parcours.length ? `${f.parcours.length} parcours` : 'aucun parcours' }}
          </span>
          <span v-if="f.unmatchedP3Rules.length" class="material-icons-outlined text-rose-400 text-base" title="Règles P3 sans parcours correspondant">warning</span>
        </button>

        <div v-if="open[f.id]" class="border-t border-slate-100 overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Condition</th>
                <th class="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Parcours P1 + P2</th>
                <th class="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">P3 possibles</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-if="!f.parcours.length">
                <td colspan="3" class="px-4 py-3 font-bold text-rose-500">Aucune règle de parcours active pour cette formation.</td>
              </tr>
              <tr v-for="(p, i) in f.parcours" :key="i" class="align-top">
                <td class="px-4 py-3 font-bold text-slate-500 max-w-[180px]">{{ p.condition }}</td>
                <td class="px-4 py-3 max-w-[320px] space-y-1">
                  <p class="font-black text-slate-900">
                    {{ p.parcoursTitle }}
                    <span v-if="p.tooAdvanced" class="ml-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-black">niveau trop avancé</span>
                  </p>
                  <p class="text-slate-600"><span class="text-[9px] font-black text-sky-700">P1</span> {{ p.formation1 }}</p>
                  <p v-if="p.formation2" class="text-slate-600"><span class="text-[9px] font-black text-amber-700">P2</span> {{ p.formation2 }}</p>
                </td>
                <td class="px-4 py-3 max-w-[360px] space-y-1">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="proposal in p.p3.proposals"
                      :key="proposal.label"
                      class="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold"
                      :title="proposal.parcoursTitle"
                    >{{ proposal.label }}</span>
                  </div>
                  <p class="text-[10px] font-bold text-slate-400">{{ sourceLabel[p.p3.source] }}</p>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="f.unmatchedP3Rules.length" class="m-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1">
            <p class="font-black text-rose-700">Règles P3 Override sans parcours correspondant (jamais appliquées)</p>
            <p v-for="(o, i) in f.unmatchedP3Rules" :key="i" class="text-rose-800">
              P1 « {{ o.conditionP1 }} » + P2 « {{ o.conditionP2 }} » → {{ o.proposals.map((p) => p.label).join(' / ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
