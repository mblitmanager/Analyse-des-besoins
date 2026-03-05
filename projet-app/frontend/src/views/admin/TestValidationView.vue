<script setup>
import { ref, computed, watch } from "vue";

const STORAGE_KEY = "test_validation_results";

// ─── Test Scenarios Data ───
const formations = ref([
  {
    key: "word", title: "Word", icon: "description", color: "#a4c2f4",
    scenarios: [
      { id: "word-1", label: "Prérequis KO", prereq: '"Non" ou "Jamais"', stopLevel: "—", expected: "DigComp Initial & Word Initial" },
      { id: "word-2", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Word Initial & Word Basique" },
      { id: "word-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Word Basique & Word Opérationnel" },
      { id: "word-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Word Opérationnel & Word Avancé" },
      { id: "word-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Word Avancé & Word Expert" },
    ],
  },
  {
    key: "excel", title: "Excel", icon: "table_chart", color: "#4caf50",
    scenarios: [
      { id: "excel-1", label: "Prérequis KO", prereq: '"Non"/"Jamais"', stopLevel: "—", expected: "DigComp Initial & Excel Initial" },
      { id: "excel-2", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Excel Initial & Excel Basique" },
      { id: "excel-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Excel Basique & Excel Opérationnel" },
      { id: "excel-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Excel Opérationnel & Excel Avancé" },
      { id: "excel-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Excel Avancé & Excel Expert" },
    ],
  },
  {
    key: "ppt", title: "PowerPoint", icon: "slideshow", color: "#ff9800",
    scenarios: [
      { id: "ppt-1", label: "Prérequis KO", prereq: '"Non"/"Jamais"', stopLevel: "—", expected: "DigComp Initial & PPT Initial" },
      { id: "ppt-2", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "PPT Initial & PPT Basique" },
      { id: "ppt-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "PPT Basique & PPT Opérationnel" },
      { id: "ppt-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "PPT Opérationnel & PPT Avancé" },
      { id: "ppt-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "PPT Avancé & PPT Expert" },
    ],
  },
  {
    key: "digcomp", title: "DigComp", icon: "computer", color: "#9c27b0",
    scenarios: [
      { id: "dig-1", label: "Test < Initial", prereq: "OK", stopLevel: "—", expected: "DigComp Initial & Word/Excel/PPT Initial" },
      { id: "dig-2", label: "Test = Initial", prereq: "OK", stopLevel: "Initial", expected: "DigComp Initial & DigComp Basique" },
      { id: "dig-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "DigComp Basique & DigComp Opérationnel" },
      { id: "dig-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "DigComp Opérationnel & DigComp Avancé" },
      { id: "dig-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "DigComp Avancé & DigComp Expert" },
    ],
  },
  {
    key: "anglais", title: "Anglais", icon: "translate", color: "#e91e63",
    scenarios: [
      { id: "ang-1", label: "Test = A1", prereq: "—", stopLevel: "A1", expected: "A2 & B1" },
      { id: "ang-2", label: "Test = A2", prereq: "—", stopLevel: "A2", expected: "A2 & B1" },
      { id: "ang-3", label: "Test = B1", prereq: "—", stopLevel: "B1", expected: "A2 & B1" },
      { id: "ang-4", label: "Test = B2", prereq: "—", stopLevel: "B2", expected: "B1 & B2" },
      { id: "ang-5", label: "Test = C1", prereq: "—", stopLevel: "C1", expected: "B2 & C1" },
    ],
  },
  {
    key: "outlook", title: "Outlook", icon: "email", color: "#2196f3",
    scenarios: [
      { id: "out-1", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Outlook Initial & Outlook Basique" },
      { id: "out-2", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Outlook Basique & Outlook Opérationnel" },
      { id: "out-3", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Outlook Opérationnel & Outlook Avancé" },
      { id: "out-4", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Outlook Avancé & Outlook Expert" },
    ],
  },
  {
    key: "photoshop", title: "Photoshop", icon: "photo_camera", color: "#00bcd4",
    scenarios: [
      { id: "ps-1", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Photoshop Initial & Photoshop Basique" },
      { id: "ps-2", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Photoshop Basique & Photoshop Opérationnel" },
      { id: "ps-3", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Photoshop Opérationnel & Photoshop Avancé" },
      { id: "ps-4", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Photoshop Avancé & Photoshop Expert" },
    ],
  },
  {
    key: "gimp", title: "GIMP", icon: "brush", color: "#795548",
    scenarios: [
      { id: "gimp-1", label: "Test = Initial", prereq: "OK", stopLevel: "Initial", expected: "GIMP Initial & GIMP Basique" },
      { id: "gimp-2", label: "Test = Basique/Opérationnel", prereq: "OK", stopLevel: "Basique", expected: "GIMP Basique & GIMP Opérationnel" },
      { id: "gimp-3", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "GIMP Opérationnel & GIMP Avancé" },
    ],
  },
  {
    key: "wordpress", title: "WordPress", icon: "web", color: "#607d8b",
    scenarios: [
      { id: "wp-1", label: "Test = Initial", prereq: "OK", stopLevel: "Initial", expected: "WordPress Initial & WordPress Basique" },
      { id: "wp-2", label: "Test = Basique/Opérationnel", prereq: "OK", stopLevel: "Basique", expected: "WordPress Basique & WordPress Opérationnel" },
    ],
  },
  {
    key: "sketchup", title: "SketchUp", icon: "architecture", color: "#ff5722",
    scenarios: [
      { id: "sk-1", label: "Test = Initial", prereq: "OK", stopLevel: "Initial", expected: "SketchUp Initial & SketchUp Basique" },
      { id: "sk-2", label: "Test = Basique/Opérationnel", prereq: "OK", stopLevel: "Basique", expected: "SketchUp Basique & SketchUp Opérationnel" },
      { id: "sk-3", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "SketchUp Opérationnel & SketchUp Avancé" },
    ],
  },
  {
    key: "francais", title: "Français", icon: "menu_book", color: "#3f51b5",
    scenarios: [
      { id: "fr-1", label: "Test = Découverte", prereq: "OK", stopLevel: "Découverte", expected: "Voltaire Découverte & Voltaire Technique" },
      { id: "fr-2", label: "Test = Technique", prereq: "OK", stopLevel: "Technique", expected: "Voltaire Technique & Voltaire Professionnel" },
      { id: "fr-3", label: "Test = Professionnel/Affaires", prereq: "OK", stopLevel: "Professionnel", expected: "Voltaire Professionnel & Voltaire Affaires" },
    ],
  },
  {
    key: "outils-coll", title: "Outils Collaboratifs", icon: "groups", color: "#009688",
    scenarios: [
      { id: "oc-1", label: "Test < Initial", prereq: "OK", stopLevel: "—", expected: "Outils Coll & Outils Coll" },
      { id: "oc-2", label: "Test = Initial/Basique/Opérationnel", prereq: "OK", stopLevel: "Initial", expected: "Outils Coll & Docs/Sheets/Slides" },
      { id: "oc-3", label: "Test ≥ dernier niveau", prereq: "OK", stopLevel: "Expert", expected: "Outils Coll & Docs/Sheets/Slides" },
    ],
  },
  {
    key: "illustrator", title: "Illustrator", icon: "palette", color: "#ff4081",
    scenarios: [
      { id: "ill-1", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Illustrator Initial & Illustrator Basique" },
      { id: "ill-2", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Illustrator Basique & Illustrator Opérationnel" },
      { id: "ill-3", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Illustrator Opérationnel & Illustrator Avancé" },
      { id: "ill-4", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Illustrator Avancé & Illustrator Expert" },
    ],
  },
  {
    key: "ia-inkrea", title: "IA Inkrea", icon: "smart_toy", color: "#6c63ff",
    scenarios: [
      { id: "ia-1", label: "Test prérequis technique", prereq: "OK", stopLevel: "—", expected: "Inkrea IA & Inkrea IA" },
    ],
  },
]);

// States: null = untested, 'pass' = validated, 'fail' = failed
const results = ref({});

// Load from localStorage
function loadResults() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) results.value = JSON.parse(saved);
  } catch {
    results.value = {};
  }
}
loadResults();

// Persist on change
watch(results, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}, { deep: true });

function cycleStatus(scenarioId) {
  const current = results.value[scenarioId] || null;
  if (current === null) results.value[scenarioId] = "pass";
  else if (current === "pass") results.value[scenarioId] = "fail";
  else results.value[scenarioId] = null;
  // trigger reactivity
  results.value = { ...results.value };
}

function resetAll() {
  if (!confirm("Réinitialiser tous les résultats de test ?")) return;
  results.value = {};
}

// Stats
const totalScenarios = computed(() =>
  formations.value.reduce((acc, f) => acc + f.scenarios.length, 0)
);
const passedCount = computed(() =>
  Object.values(results.value).filter((v) => v === "pass").length
);
const failedCount = computed(() =>
  Object.values(results.value).filter((v) => v === "fail").length
);
const progressPercent = computed(() =>
  totalScenarios.value ? Math.round(((passedCount.value + failedCount.value) / totalScenarios.value) * 100) : 0
);

function formationStats(f) {
  const total = f.scenarios.length;
  const passed = f.scenarios.filter((s) => results.value[s.id] === "pass").length;
  const failed = f.scenarios.filter((s) => results.value[s.id] === "fail").length;
  return { total, passed, failed, pending: total - passed - failed };
}

// Collapse control
const collapsed = ref({});
function toggleCollapse(key) {
  collapsed.value[key] = !collapsed.value[key];
  collapsed.value = { ...collapsed.value };
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-[#0d1b3e] mb-2">Validation des Scénarios</h1>
        <p class="text-gray-500 text-sm">Testez chaque formation et validez les résultats attendus.</p>
      </div>
      <button
        @click="resetAll"
        class="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 border border-red-100 transition-all active:scale-95"
      >
        <span class="material-icons-outlined text-sm">restart_alt</span>
        Réinitialiser
      </button>
    </div>

    <!-- Global Progress -->
    <div class="bg-white rounded-3xl shadow-xl border border-white p-6 md:p-8">
      <div class="flex flex-wrap items-center gap-6 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-400"></div>
          <span class="text-xs font-bold text-gray-500">Validés : <span class="text-green-600">{{ passedCount }}</span></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-400"></div>
          <span class="text-xs font-bold text-gray-500">Échoués : <span class="text-red-600">{{ failedCount }}</span></span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-gray-300"></div>
          <span class="text-xs font-bold text-gray-500">Restants : <span class="text-gray-600">{{ totalScenarios - passedCount - failedCount }}</span></span>
        </div>
        <span class="ml-auto text-2xl font-black text-[#0d1b3e]">{{ progressPercent }}%</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :style="{
            width: progressPercent + '%',
            background: failedCount > 0
              ? 'linear-gradient(90deg, #22c55e ' + (passedCount / (passedCount + failedCount) * 100) + '%, #ef4444 100%)'
              : '#22c55e'
          }"
        ></div>
      </div>
    </div>

    <!-- Formation Cards -->
    <div class="space-y-4">
      <div
        v-for="formation in formations"
        :key="formation.key"
        class="bg-white rounded-3xl shadow-lg border border-white overflow-hidden transition-all"
      >
        <!-- Formation Header -->
        <button
          @click="toggleCollapse(formation.key)"
          class="w-full flex items-center gap-4 p-5 md:p-6 hover:bg-gray-50/50 transition-colors text-left"
        >
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            :style="{ backgroundColor: formation.color + '20', color: formation.color }"
          >
            <span class="material-icons-outlined">{{ formation.icon }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-black text-[#0d1b3e]">{{ formation.title }}</h3>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-[10px] font-bold uppercase tracking-widest" :class="formationStats(formation).passed === formationStats(formation).total ? 'text-green-500' : formationStats(formation).failed > 0 ? 'text-red-500' : 'text-gray-400'">
                {{ formationStats(formation).passed }}/{{ formationStats(formation).total }} validés
              </span>
              <span v-if="formationStats(formation).failed > 0" class="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                · {{ formationStats(formation).failed }} échoué(s)
              </span>
            </div>
          </div>
          <!-- Mini progress -->
          <div class="w-20 bg-gray-100 rounded-full h-2 shrink-0 hidden md:block">
            <div
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: (formationStats(formation).total ? (formationStats(formation).passed / formationStats(formation).total * 100) : 0) + '%', backgroundColor: formation.color }"
            ></div>
          </div>
          <span class="material-icons-outlined text-gray-300 transition-transform duration-200" :class="{ 'rotate-180': !collapsed[formation.key] }">expand_more</span>
        </button>

        <!-- Scenarios Table -->
        <div v-if="!collapsed[formation.key]" class="border-t border-gray-50">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Scénario</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Prérequis</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Niveau arrêt</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Parcours attendu</th>
                <th class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center w-24">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="s in formation.scenarios"
                :key="s.id"
                class="hover:bg-gray-50/50 transition-colors"
              >
                <td class="px-6 py-4 font-bold text-sm text-gray-800">{{ s.label }}</td>
                <td class="px-6 py-4 text-xs text-gray-500 hidden md:table-cell">
                  <span class="px-2 py-1 rounded-lg" :class="s.prereq === 'OK' ? 'bg-green-50 text-green-600' : s.prereq === '—' ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-500'">
                    {{ s.prereq }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-gray-500 font-mono hidden md:table-cell">{{ s.stopLevel }}</td>
                <td class="px-6 py-4">
                  <span class="text-xs font-bold text-[#0d1b3e] bg-blue-50 px-3 py-1.5 rounded-lg inline-block">{{ s.expected }}</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    @click="cycleStatus(s.id)"
                    class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all active:scale-90 border"
                    :class="{
                      'bg-gray-50 border-gray-100 text-gray-300 hover:bg-gray-100': !results[s.id],
                      'bg-green-50 border-green-200 text-green-500 shadow-sm shadow-green-100': results[s.id] === 'pass',
                      'bg-red-50 border-red-200 text-red-500 shadow-sm shadow-red-100': results[s.id] === 'fail',
                    }"
                    :title="!results[s.id] ? 'Non testé – Cliquer pour valider' : results[s.id] === 'pass' ? 'Validé – Cliquer pour marquer échoué' : 'Échoué – Cliquer pour réinitialiser'"
                  >
                    <span class="material-icons-outlined text-lg">
                      {{ !results[s.id] ? 'radio_button_unchecked' : results[s.id] === 'pass' ? 'check_circle' : 'cancel' }}
                    </span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
