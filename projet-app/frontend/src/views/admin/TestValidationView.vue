<script setup>
import { ref, computed, watch } from "vue";

const STORAGE_KEY = "test_validation_results";

// ─── Test Scenarios Data ───
const formations = ref([
  {
    key: "word", title: "Word", icon: "description", color: "#3B82F6",
    scenarios: [
      { id: "word-1", label: "Prérequis KO", prereq: '"Non" ou "Jamais"', stopLevel: "—", expected: "DigComp Initial & Word Initial" },
      { id: "word-2", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Word Initial & Word Basique" },
      { id: "word-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Word Basique & Word Opérationnel" },
      { id: "word-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Word Opérationnel & Word Avancé" },
      { id: "word-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Word Avancé & Word Expert" },
    ],
  },
  {
    key: "excel", title: "Excel", icon: "table_chart", color: "#10B981",
    scenarios: [
      { id: "excel-1", label: "Prérequis KO", prereq: '"Non"/"Jamais"', stopLevel: "—", expected: "DigComp Initial & Excel Initial" },
      { id: "excel-2", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Excel Initial & Excel Basique" },
      { id: "excel-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Excel Basique & Excel Opérationnel" },
      { id: "excel-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Excel Opérationnel & Excel Avancé" },
      { id: "excel-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Excel Avancé & Excel Expert" },
    ],
  },
  {
    key: "ppt", title: "PowerPoint", icon: "slideshow", color: "#F59E0B",
    scenarios: [
      { id: "ppt-1", label: "Prérequis KO", prereq: '"Non"/"Jamais"', stopLevel: "—", expected: "DigComp Initial & PPT Initial" },
      { id: "ppt-2", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "PPT Initial & PPT Basique" },
      { id: "ppt-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "PPT Basique & PPT Opérationnel" },
      { id: "ppt-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "PPT Opérationnel & PPT Avancé" },
      { id: "ppt-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "PPT Avancé & PPT Expert" },
    ],
  },
  {
    key: "digcomp", title: "DigComp", icon: "computer", color: "#8B5CF6",
    scenarios: [
      { id: "dig-1", label: "Test < Initial", prereq: "OK", stopLevel: "—", expected: "DigComp Initial & Word/Excel/PPT Initial" },
      { id: "dig-2", label: "Test = Initial", prereq: "OK", stopLevel: "Initial", expected: "DigComp Initial & DigComp Basique" },
      { id: "dig-3", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "DigComp Basique & DigComp Opérationnel" },
      { id: "dig-4", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "DigComp Opérationnel & DigComp Avancé" },
      { id: "dig-5", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "DigComp Avancé & DigComp Expert" },
    ],
  },
  {
    key: "anglais", title: "Anglais", icon: "translate", color: "#EC4899",
    scenarios: [
      { id: "ang-1", label: "Test = A1", prereq: "—", stopLevel: "A1", expected: "A2 & B1" },
      { id: "ang-2", label: "Test = A2", prereq: "—", stopLevel: "A2", expected: "A2 & B1" },
      { id: "ang-3", label: "Test = B1", prereq: "—", stopLevel: "B1", expected: "A2 & B1" },
      { id: "ang-4", label: "Test = B2", prereq: "—", stopLevel: "B2", expected: "B1 & B2" },
      { id: "ang-5", label: "Test = C1", prereq: "—", stopLevel: "C1", expected: "B2 & C1" },
    ],
  },
  {
    key: "outlook", title: "Outlook", icon: "alternate_email", color: "#3B82F6",
    scenarios: [
      { id: "out-1", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Outlook Initial & Outlook Basique" },
      { id: "out-2", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Outlook Basique & Outlook Opérationnel" },
      { id: "out-3", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Outlook Opérationnel & Outlook Avancé" },
      { id: "out-4", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Outlook Avancé & Outlook Expert" },
    ],
  },
  {
    key: "photoshop", title: "Photoshop", icon: "photo_library", color: "#06B6D4",
    scenarios: [
      { id: "ps-1", label: "Test ≤ Initial", prereq: "OK", stopLevel: "Initial", expected: "Photoshop Initial & Photoshop Basique" },
      { id: "ps-2", label: "Test = Basique", prereq: "OK", stopLevel: "Basique", expected: "Photoshop Basique & Photoshop Opérationnel" },
      { id: "ps-3", label: "Test = Opérationnel", prereq: "OK", stopLevel: "Opérationnel", expected: "Photoshop Opérationnel & Photoshop Avancé" },
      { id: "ps-4", label: "Test = Avancé/Expert", prereq: "OK", stopLevel: "Avancé", expected: "Photoshop Avancé & Photoshop Expert" },
    ],
  },
  {
    key: "francais", title: "Français", icon: "auto_stories", color: "#6366F1",
    scenarios: [
      { id: "fr-1", label: "Test = Découverte", prereq: "OK", stopLevel: "Découverte", expected: "Voltaire Découverte & Voltaire Technique" },
      { id: "fr-2", label: "Test = Technique", prereq: "OK", stopLevel: "Technique", expected: "Voltaire Technique & Voltaire Professionnel" },
      { id: "fr-3", label: "Test = Professionnel/Affaires", prereq: "OK", stopLevel: "Professionnel", expected: "Voltaire Professionnel & Voltaire Affaires" },
    ],
  },
  {
    key: "ia-inkrea", title: "IA Inkrea", icon: "psychology", color: "#6D28D9",
    scenarios: [
      { id: "ia-1", label: "Test prérequis technique", prereq: "OK", stopLevel: "—", expected: "Inkrea IA & Inkrea IA" },
    ],
  },
]);

const results = ref({});
const collapsed = ref({});

function loadResults() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) results.value = JSON.parse(saved);
  } catch {
    results.value = {};
  }
}
loadResults();

watch(results, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}, { deep: true });

function cycleStatus(scenarioId) {
  const current = results.value[scenarioId] || null;
  if (current === null) results.value[scenarioId] = "pass";
  else if (current === "pass") results.value[scenarioId] = "fail";
  else results.value[scenarioId] = null;
  results.value = { ...results.value };
}

function resetAll() {
  if (!confirm("Effacer tous les pointages de validation ?")) return;
  results.value = {};
}

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
  return { 
    total, 
    passed, 
    failed, 
    pending: total - passed - failed,
    percent: Math.round((passed / total) * 100)
  };
}

function toggleCollapse(key) {
  collapsed.value[key] = !collapsed.value[key];
  collapsed.value = { ...collapsed.value };
}
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header with Stats Summary -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Cahier de Recette Automate</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Validation manuelle des scénarios de redirection par formation
        </p>
      </div>
      
      <div class="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div class="px-4 py-2 text-center border-r border-slate-50">
           <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validés</p>
           <p class="text-lg font-black text-emerald-500">{{ passedCount }}</p>
        </div>
        <div class="px-4 py-2 text-center border-r border-slate-50">
           <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Échecs</p>
           <p class="text-lg font-black text-rose-500">{{ failedCount }}</p>
        </div>
        <button @click="resetAll" class="px-4 py-2 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center">
          <span class="material-icons-outlined">restart_alt</span>
        </button>
      </div>
    </div>

    <!-- Global Progress Bar -->
    <div class="bg-white rounded-[40px] p-8 md:p-10 border border-slate-100 shadow-sm space-y-6">
       <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h3 class="text-sm font-black text-slate-900 uppercase">Progression de la Recette</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Couverture totale des scénarios catalogues</p>
          </div>
          <p class="text-4xl font-black text-slate-900">{{ progressPercent }}<span class="text-xl opacity-20">%</span></p>
       </div>
       <div class="w-full h-4 bg-slate-50 rounded-full overflow-hidden shadow-inner flex">
          <div class="h-full bg-emerald-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]" :style="{ width: ((passedCount / totalScenarios) * 100) + '%' }"></div>
          <div class="h-full bg-rose-500 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(244,63,94,0.3)]" :style="{ width: ((failedCount / totalScenarios) * 100) + '%' }"></div>
       </div>
       <div class="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>0 (Début)</span>
          <span>{{ passedCount + failedCount }} / {{ totalScenarios }} Scénarios Audités</span>
          <span>100 (Fin)</span>
       </div>
    </div>

    <!-- Formations List -->
    <div class="grid grid-cols-1 gap-4">
      <div v-for="f in formations" :key="f.key" class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
         <!-- Card Header -->
         <button @click="toggleCollapse(f.key)" class="w-full p-6 md:p-8 flex items-center gap-6 text-left hover:bg-slate-50/50 transition-all">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" :style="{ backgroundColor: f.color }">
               <span class="material-icons-outlined text-2xl">{{ f.icon }}</span>
            </div>
            
            <div class="flex-1 space-y-1">
               <h4 class="text-lg font-black text-slate-900 tracking-tight leading-none">{{ f.title }}</h4>
               <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full" :class="formationStats(f).passed === formationStats(f).total ? 'bg-emerald-500' : 'bg-slate-300'"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest" :class="formationStats(f).passed === formationStats(f).total ? 'text-emerald-500' : 'text-slate-400'">{{ formationStats(f).passed }} / {{ formationStats(f).total }} Validés</span>
                  </div>
                  <span v-if="formationStats(f).failed > 0" class="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[8px] font-black uppercase">! {{ formationStats(f).failed }} Erreur(s)</span>
               </div>
            </div>

            <!-- Mini Spark Bar -->
            <div class="hidden md:flex w-24 h-2 bg-slate-50 rounded-full overflow-hidden shrink-0">
               <div class="h-full bg-slate-900 transition-all duration-500" :style="{ width: formationStats(f).percent + '%', backgroundColor: f.color }"></div>
            </div>

            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 transition-all" :class="{ 'rotate-180 text-slate-900 bg-slate-50': !collapsed[f.key] }">
               <span class="material-icons-outlined text-sm">expand_more</span>
            </div>
         </button>

         <!-- Details (Scenarios) -->
         <div v-if="!collapsed[f.key]" class="border-t border-slate-50 animate-slide-in">
            <div class="overflow-x-auto custom-scrollbar">
               <table class="w-full text-left">
                  <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-50">
                      <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Label Scénario</th>
                      <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Prérequis</th>
                      <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Seuil Arrêt</th>
                      <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Output Attendu</th>
                      <th class="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Audit</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    <tr v-for="s in f.scenarios" :key="s.id" class="group hover:bg-slate-50/50 transition-colors">
                      <td class="px-8 py-5">
                         <p class="text-xs font-black text-slate-900 tracking-tight">{{ s.label }}</p>
                      </td>
                      <td class="px-8 py-5">
                         <span class="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border" :class="s.prereq === 'OK' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : s.prereq === '—' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-rose-50 text-rose-600 border-rose-100/50'">{{ s.prereq }}</span>
                      </td>
                      <td class="px-8 py-5">
                         <span class="text-[10px] font-mono font-bold text-slate-400">{{ s.stopLevel }}</span>
                      </td>
                      <td class="px-8 py-5">
                         <span class="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-md">{{ s.expected }}</span>
                      </td>
                      <td class="px-8 py-5">
                        <button
                          @click="cycleStatus(s.id)"
                          class="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto transition-all transform active:scale-90 border-2"
                          :class="{
                            'bg-white border-slate-50 text-slate-200 hover:border-slate-100': !results[s.id],
                            'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20': results[s.id] === 'pass',
                            'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20': results[s.id] === 'fail',
                          }"
                        >
                          <span class="material-icons-outlined text-sm">
                            {{ !results[s.id] ? 'trip_origin' : results[s.id] === 'pass' ? 'check_circle' : 'error_outline' }}
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
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.animate-slide-in { animation: slideIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
