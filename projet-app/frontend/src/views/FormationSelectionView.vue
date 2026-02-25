<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const selectedFormation = ref(null);
const selectedSuite = ref(localStorage.getItem('selected_suite') || '');

const formations = ref([]);

async function fetchFormations() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);

    formations.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  fetchFormations();
});

async function selectFormation() {
  if (!selectedFormation.value) return;
  // For bureautique formations require a suite choice
  if ((selectedFormation.value.category || '').toLowerCase() === 'bureautique' && !selectedSuite.value) {
    alert('Veuillez choisir : Google Workspace ou Microsoft Office');
    return;
  }

  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const payload = {
      formationChoisie: selectedFormation.value.label,
    };
    if ((selectedFormation.value.category || '').toLowerCase() === 'bureautique') {
      payload.bureautiqueSuite = selectedSuite.value;
    }

    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);
    localStorage.setItem(
      "selected_formation_slug",
      selectedFormation.value.slug,
    );
    localStorage.setItem(
      "selected_formation_label",
      selectedFormation.value.label,
    );
    if (selectedSuite.value) localStorage.setItem('selected_suite', selectedSuite.value);
    const nextRoute = store.getNextRoute("/formations");
    router.push(nextRoute || "/positionnement");
  } catch (error) {
    console.error("Failed to select formation:", error);
    alert("Erreur lors de la sélection de la formation.");
  } finally {
    submitting.value = false;
  }
}

// Grouping rules and preferred order
const categoryGroupsOrder = [
  'anglais-francais',
  'bureautique',
  'illustration',
  'ia-generative',
  'digcomp-google-wordpress',
  'autres',
];

function detectGroupForFormation(f) {
  const cat = (f.category || '').toLowerCase();
  const label = (f.label || '').toLowerCase();
  if (cat.includes('anglais') || cat.includes('langu') || label.includes('anglais') || cat.includes('francais') || label.includes('francais')) return 'anglais-francais';
  if (cat.includes('bureautique') || label.includes('bureautique') || label.includes('google') || label.includes('microsoft') || label.includes('office')) return 'bureautique';
  if (label.includes('illustrator') || label.includes('photoshop') || label.includes('sketchup')) return 'illustration';
  if (label.includes('intelligence') || label.includes('ia') || label.includes('générative') || label.includes('generative')) return 'ia-generative';
  if (label.includes('digcomp') || label.includes('wordpress') || label.includes('google workspace')) return 'digcomp-google-wordpress';
  return 'autres';
}

const groupedFormations = computed(() => {
  const map = new Map();
  (formations.value || []).forEach((f) => {
    const group = detectGroupForFormation(f);
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(f);
  });
  const groups = Array.from(map.entries()).map(([group, items]) => ({
    category: group,
    items: items.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
  }));
  groups.sort((a, b) => {
    const ai = categoryGroupsOrder.indexOf(a.category);
    const bi = categoryGroupsOrder.indexOf(b.category);
    if (ai === -1 && bi === -1) return a.category.localeCompare(b.category);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return groups;
});

// Modal & helpers for Bureautique choice between Google Workspace and Microsoft Office
const showBureauModal = ref(false);
const bureauGoogle = computed(() => {
  const list = formations.value.filter((f) => {
    const cat = (f.category || '').toLowerCase();
    const label = (f.label || '').toLowerCase();
    return (
      cat.includes('google') ||
      label.includes('google workspace') ||
      label.includes('google') ||
      (cat.includes('bureautique') && label.includes('google'))
    );
  });
  // fallback: if empty, include all bureautique
  if (list.length === 0) return formations.value.filter((f) => (f.category || '').toLowerCase().includes('bureautique'));
  return list;
});
const bureauMicrosoft = computed(() => {
  const list = formations.value.filter((f) => {
    const cat = (f.category || '').toLowerCase();
    const label = (f.label || '').toLowerCase();
    return (
      cat.includes('microsoft') ||
      label.includes('microsoft') ||
      label.includes('office') ||
      (cat.includes('bureautique') && (label.includes('microsoft') || label.includes('office')))
    );
  });
  if (list.length === 0) return formations.value.filter((f) => (f.category || '').toLowerCase().includes('bureautique'));
  return list;
});

function openBureautiqueModal() {
  showBureauModal.value = true;
}

function chooseBureauFormation(f) {
  selectedFormation.value = f;
  // set suite based on label/category heuristic
  const l = (f.label || '').toLowerCase();
  if (l.includes('google')) selectedSuite.value = 'google';
  else if (l.includes('microsoft') || l.includes('office')) selectedSuite.value = 'microsoft';
  showBureauModal.value = false;
}

// Build explicit sections per requested layout
const sections = computed(() => {
  const map = new Map(groupedFormations.value.map((g) => [g.category, g.items]));

  const langs = map.get('anglais-francais') || [];
  const creation = map.get('illustration') || [];
  const ia = map.get('ia-generative') || [];
  const digcompGroup = map.get('digcomp-google-wordpress') || [];

  // also include any formations explicitly matching google workspace/digcomp/wordpress
  const extraDigcomp = formations.value.filter((f) => {
    const l = (f.label || '').toLowerCase();
    return l.includes('digcomp') || l.includes('google workspace') || l.includes('wordpress');
  });

  const combinedDigcomp = [...digcompGroup, ...extraDigcomp].reduce((acc, f) => {
    if (!acc.find((x) => x.id === f.id)) acc.push(f);
    return acc;
  }, []);

  return [
    { key: 'langues', title: 'Langues — Anglais / Français', items: langs },
    { key: 'bureautique', title: 'Bureautique', items: [], modal: true },
    { key: 'creation', title: 'Création et Internet', items: creation },
    { key: 'ia', title: 'Intelligence Artificielle Générative', items: ia },
    { key: 'digcomp', title: 'Digcomp, Google Workspace et Wordpress', items: combinedDigcomp },
  ];
});

// Layout parts: put Bureautique and IA side-by-side
const sectionParts = computed(() => {
  const langs = sections.value.find((s) => s.key === 'langues') || null;
  const bureau = sections.value.find((s) => s.key === 'bureautique') || null;
  const ia = sections.value.find((s) => s.key === 'ia') || null;
  const rest = sections.value.filter((s) => !['langues', 'bureautique', 'ia'].includes(s.key));
  return { langs, bureau, ia, rest };
});
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col font-outfit">
    <SiteHeader>
      <template #actions>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-bold text-sm text-blue-900 border border-white/30"
        >
          <span class="material-icons-outlined text-lg">save</span>
          Sauvegarder et quitter
        </button>
      </template>
    </SiteHeader>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10">
      <div class="text-center mb-10">
        <div class="flex flex-col items-center gap-4 mb-6">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="text-xs text-gray-400 font-bold uppercase tracking-widest"
              >Étape {{ store.getProgress("/formations").current }} sur
              {{ store.getProgress("/formations").total }}</span
            >
            <span
              class="text-xs text-brand-primary font-bold uppercase tracking-widest"
              >{{
                Math.round(store.getProgress("/formations").percentage)
              }}%</span
            >
          </div>
          <div
            class="w-full max-w-md h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100"
          >
            <div
              class="h-full bg-brand-primary transition-all duration-700"
              :style="{
                width: store.getProgress('/formations').percentage + '%',
              }"
            ></div>
          </div>
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-3">
          Quelle formation souhaitez-vous suivre ?
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Sélectionnez votre programme de formation.
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div
          class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
        ></div>
      </div>

      <div v-else class="pb-32">
        <div class="space-y-12">
          <!-- Langues -->
          <div v-if="sectionParts.langs && sectionParts.langs.items.length">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-3">
              <span class="w-8 h-px bg-gray-100"></span>
              {{ sectionParts.langs.title }}
            </h3>
            <div class="formations-grid">
              <button
                v-for="form in sectionParts.langs.items"
                :key="form.id"
                @click="selectedFormation = form"
                class="formation-card"
                :class="selectedFormation?.id === form.id ? 'formation-card--selected' : 'formation-card--default'"
              >
                <div class="flex items-center gap-4">
                   <div :class="selectedFormation?.id === form.id ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
                      <span class="material-icons-outlined text-xl">{{ form.icon || 'translate' }}</span>
                   </div>
                   <span class="formation-card__label">{{ form.label }}</span>
                </div>
                <div class="formation-card__radio" :class="selectedFormation?.id === form.id ? 'formation-card__radio--selected' : 'formation-card__radio--default'">
                  <div v-if="selectedFormation?.id === form.id" class="formation-card__radio-dot"></div>
                </div>
              </button>
            </div>
          </div>

          <!-- Bureautique + IA side-by-side -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div v-if="sectionParts.bureau">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-3">
                <span class="w-8 h-px bg-gray-100"></span>
                {{ sectionParts.bureau.title }}
              </h3>
              <button 
                @click="openBureautiqueModal" 
                class="formation-card w-full"
                :class="selectedFormation && (selectedFormation.category || '').toLowerCase() === 'bureautique' ? 'formation-card--selected' : 'formation-card--default'"
              >
                <div class="flex items-center gap-4">
                   <div :class="selectedFormation && (selectedFormation.category || '').toLowerCase() === 'bureautique' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                      <span class="material-icons-outlined text-xl">desktop_windows</span>
                   </div>
                   <div class="flex flex-col items-start">
                     <span class="formation-card__label">{{ selectedFormation && (selectedFormation.category || '').toLowerCase() === 'bureautique' ? selectedFormation.label : 'Choisir votre logiciel' }}</span>
                     <span v-if="selectedSuite && selectedFormation && (selectedFormation.category || '').toLowerCase() === 'bureautique'" class="text-[9px] font-black uppercase text-brand-primary tracking-widest mt-0.5">
                       {{ selectedSuite === 'google' ? 'Google Workspace' : 'Microsoft Office' }}
                     </span>
                   </div>
                </div>
                <span class="material-icons-outlined text-gray-300">expand_more</span>
              </button>
            </div>

            <div v-if="sectionParts.ia && sectionParts.ia.items.length">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-3">
                <span class="w-8 h-px bg-gray-100"></span>
                {{ sectionParts.ia.title }}
              </h3>
              <div class="space-y-3">
                <button
                  v-for="form in sectionParts.ia.items"
                  :key="form.id"
                  @click="selectedFormation = form"
                  class="formation-card w-full"
                  :class="selectedFormation?.id === form.id ? 'formation-card--selected' : 'formation-card--default'"
                >
                  <div class="flex items-center gap-4">
                     <div :class="selectedFormation?.id === form.id ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                        <span class="material-icons-outlined text-xl">psychology</span>
                     </div>
                     <span class="formation-card__label">{{ form.label }}</span>
                  </div>
                  <div class="formation-card__radio" :class="selectedFormation?.id === form.id ? 'formation-card__radio--selected' : 'formation-card__radio--default'">
                    <div v-if="selectedFormation?.id === form.id" class="formation-card__radio-dot"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Other sections -->
          <div v-for="section in sectionParts.rest" :key="section.key">
            <h3 v-if="section.items.length" class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-3">
              <span class="w-8 h-px bg-gray-100"></span>
              {{ section.title }}
            </h3>
            <div class="formations-grid">
              <button
                v-for="form in section.items"
                :key="form.id"
                @click="selectedFormation = form"
                class="formation-card"
                :class="selectedFormation?.id === form.id ? 'formation-card--selected' : 'formation-card--default'"
              >
                <div class="flex items-center gap-4">
                   <div :class="selectedFormation?.id === form.id ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center">
                      <span class="material-icons-outlined text-xl">{{ form.icon || 'star' }}</span>
                   </div>
                   <span class="formation-card__label">{{ form.label }}</span>
                </div>
                <div class="formation-card__radio" :class="selectedFormation?.id === form.id ? 'formation-card__radio--selected' : 'formation-card__radio--default'">
                  <div v-if="selectedFormation?.id === form.id" class="formation-card__radio-dot"></div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Suite choice helper (visible if bureautique selected) -->
        <transition name="fade-slide">
          <div v-if="selectedFormation && (selectedFormation.category || '').toLowerCase() === 'bureautique'" class="mt-10 p-8 bg-blue-50/50 rounded-[40px] border border-blue-100/50 relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 opacity-5">
              <span class="material-icons-outlined text-8xl text-brand-primary">info</span>
            </div>
            
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary mb-4">Aide à la décision</p>
            <h4 class="text-xl font-bold text-blue-900 mb-2">Quelle suite logicielle utilisez-vous ?</h4>
            <p class="text-sm text-blue-800/60 mb-6">Votre évaluation sera adaptée à l'environnement que vous choisissez.</p>
            
            <div class="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                @click="selectedSuite = 'google'"
                :class="selectedSuite === 'google' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 bg-blue-500!' : 'bg-white text-gray-700 hover:bg-gray-50'"
                class="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-gray-100 transition-all flex items-center justify-center gap-3"
              >
                <img v-if="selectedSuite !== 'google'" src="https://www.google.com/favicon.ico" class="w-4 h-4" />
                <span>Google Workspace</span>
                <span v-if="selectedSuite === 'google'" class="material-icons-outlined text-sm">check_circle</span>
              </button>
              <button
                type="button"
                @click="selectedSuite = 'microsoft'"
                :class="selectedSuite === 'microsoft' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 bg-blue-500!' : 'bg-white text-gray-700 hover:bg-gray-50'"
                class="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-gray-100 transition-all flex items-center justify-center gap-3"
              >
                <img v-if="selectedSuite !== 'microsoft'" src="https://www.microsoft.com/favicon.ico" class="w-4 h-4" />
                <span>Microsoft Office</span>
                <span v-if="selectedSuite === 'microsoft'" class="material-icons-outlined text-sm">check_circle</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </main>

    <!-- Bottom Actions Sticky -->
    <div
      class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-40"
    >
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button
          @click="router.push('/prerequis')"
          class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors"
        >
          <span class="material-icons-outlined text-lg">arrow_back</span>
          Retour
        </button>

        <button
          @click="selectFormation"
          :disabled="submitting || !selectedFormation"
          class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-blue-500 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
        >
          <span>Continuer</span>
          <span v-if="!submitting" class="material-icons-outlined text-lg"
            >arrow_forward</span
          >
          <div
            v-else
            class="animate-spin border-2 border-white/60 border-t-white rounded-full h-4 w-4"
          ></div>
        </button>
      </div>
    </div>
    <SiteFooter />

    <!-- Bureautique Modal -->
    <transition name="modal">
      <div v-if="showBureauModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#0d1b3e]/40 backdrop-blur-sm" @click="showBureauModal = false"></div>
        <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl relative overflow-hidden animate-scale-up border border-white/20">
          <!-- Header -->
          <div class="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 class="text-2xl font-black heading-primary italic uppercase tracking-tight">Logiciels Bureautique</h3>
              <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Sélectionnez votre programme</p>
            </div>
            <button 
              @click="showBureauModal = false" 
              class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
            >
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <!-- Content -->
          <div class="p-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
              <!-- Google -->
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                   <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                      <img src="https://www.google.com/favicon.ico" class="w-6 h-6" />
                   </div>
                   <div>
                     <h4 class="font-black heading-primary uppercase tracking-tight italic">Google Workspace</h4>
                     <p class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Outils collaboratifs</p>
                   </div>
                </div>
                
                <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <button 
                    v-for="f in bureauGoogle" 
                    :key="f.id" 
                    @click="chooseBureauFormation(f)" 
                    class="w-full group text-left px-6 py-4 bg-gray-50 hover:bg-brand-primary/5 rounded-2xl border-2 border-transparent hover:border-brand-primary/20 transition-all flex items-center justify-between"
                  >
                    <span class="font-bold text-gray-700 group-hover:text-brand-primary transition-colors">{{ f.label }}</span>
                    <span class="material-icons-outlined text-gray-300 group-hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                  </button>
                  <div v-if="bureauGoogle.length===0" class="py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <span class="material-icons-outlined text-gray-300 text-3xl mb-2">search_off</span>
                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Aucune formation trouvée</p>
                  </div>
                </div>
              </div>

              <!-- Microsoft -->
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                   <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                      <img src="https://www.microsoft.com/favicon.ico" class="w-6 h-6" />
                   </div>
                   <div>
                     <h2 class="font-black heading-primary uppercase tracking-tight italic">Microsoft Office</h2>
                     <p class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Standard industriel</p>
                   </div>
                </div>
                
                <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <button 
                    v-for="f in bureauMicrosoft" 
                    :key="f.id" 
                    @click="chooseBureauFormation(f)" 
                    class="w-full group text-left px-6 py-4 bg-gray-50 hover:bg-brand-primary/5 rounded-2xl border-2 border-transparent hover:border-brand-primary/20 transition-all flex items-center justify-between"
                  >
                    <span class="font-bold text-gray-700 group-hover:text-brand-primary transition-colors">{{ f.label }}</span>
                    <span class="material-icons-outlined text-gray-300 group-hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                  </button>
                  <div v-if="bureauMicrosoft.length===0" class="py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <span class="material-icons-outlined text-gray-300 text-3xl mb-2">search_off</span>
                    <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Aucune formation trouvée</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-6 bg-gray-50/50 border-t border-gray-50 text-center">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Sélectionnez une formation pour continuer vers l'évaluation</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>

/* CSS variables and animations */
:root {
  --color-brand-primary: #3b82f6;
  --color-brand-secondary: #2563eb;
  --title-color: #0d1b3e;
}

.heading-primary {
  color: var(--title-color);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.animate-scale-up {
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.5s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-20px); }

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.formations-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .formations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .formations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Formation card */
.formation-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  min-height: 5rem;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.formation-card:hover {
  background: white;
  border-color: #E2E8F0;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.04);
}

.formation-card:active {
  transform: translateY(0) scale(0.98);
}

.formation-card--selected {
  border-color: var(--color-brand-primary);
  background: white;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
}

.formation-card__label {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--title-color);
  text-align: left;
  line-height: 1.25;
}

.formation-card__radio {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.formation-card__radio--selected {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-primary);
}

.formation-card__radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: white;
}
</style>
