<script setup>
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

// Ref attaché à la bannière inline
const inlineBannerRef = ref(null);
// Sticky visible quand la bannière inline est hors du viewport
const showStickyBar = ref(false);
let observer = null;

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const loading = ref(true);
const submitting = ref(false);
const selectedFormation = ref(null);
const selectedSuite = ref(localStorage.getItem('selected_suite') || '');

const formations = ref([]);
const currentSession = ref(null);

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
  
  // Fetch session data first for P3 filtering
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  axios.get(`${apiBaseUrl}/sessions/${sessionId}`).then(res => {
    currentSession.value = res.data;
  }).catch(err => console.error("Failed to fetch session for P3 filtering", err));

  fetchFormations();

  // IntersectionObserver : affiche la sticky quand la bannière inline sort du viewport
  observer = new IntersectionObserver(
    ([entry]) => {
      // Visible dans le viewport = pas sticky, sinon sticky
      showStickyBar.value = !entry.isIntersecting;
    },
    { threshold: 0.1 }
  );
  // On démarre l'observation après que la bannière soit montée
  setTimeout(() => {
    if (inlineBannerRef.value) observer.observe(inlineBannerRef.value);
  }, 300);
});

onUnmounted(() => {
  if (observer) observer.disconnect();
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
      isP3Mode: store.isP3Mode,
    };
    if ((selectedFormation.value.category || '').toLowerCase() === 'bureautique') {
      payload.bureautiqueSuite = selectedSuite.value;
    }

    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, payload);
    localStorage.setItem(
      "selected_formation_slug",
      selectedFormation.value.slug,
    );
    if (store.isP3Mode && currentSession.value) {
      localStorage.setItem('p3_prev_formation', currentSession.value.formationChoisie || "");
      localStorage.setItem('p3_prev_level_order', String(currentSession.value.stopLevelOrder || 0));
    }
    localStorage.setItem(
      "selected_formation_label",
      selectedFormation.value.label,
    );
    if (selectedSuite.value) localStorage.setItem('selected_suite', selectedSuite.value);
    
    // Update the real workflow path based on the selected formation
    await store.updateActualWorkflow();
    
    const nextRoute = await store.getNextRouteWithQuestions("/formations");
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
  'bureautique',
  'anglais-francais',
  'illustration',
  'ia-generative',
  'digcomp-google-wordpress',
  'autres',
];

function detectGroupForFormation(f) {
  const cat = (f.category || '').toLowerCase();
  const lab = (f.label || '').toLowerCase();
  
  if (cat.includes('langue')) return 'anglais-francais';
  if (cat.includes('bureautique')) return 'bureautique';
  if (cat.includes('ia') || cat.includes('intelligence') || lab.includes(' ia ')) return 'ia-generative';
  if (cat.includes('création') || cat.includes('creation') || cat.includes('design')) return 'illustration';
  if (cat.includes('digital') || cat.includes('internet') || cat.includes('compétence') || lab.includes('wordpress')) return 'digcomp-google-wordpress';
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

// Section styles configuration with accent colors
const sectionStyles = {
  bureautique: { color: '#a4c2f4', bg: '#a4c2f415', accent: '#3b82f6', accentBg: '#eff6ff' },
  langues :{
  color: '#FFA500',       // texte orange
  bg: '#FFA50015',        // fond très clair orange (15% opacity)
  accent: '#FF7F50',      // accent plus vif (corail/orange)
  accentBg: '#FFF5E5',    // fond accent clair
},
  creation: { color: '#d9ebd3', bg: '#d9ebd315', accent: '#16a34a', accentBg: '#f0fdf4' },
  internet: { color: '#ebd1dc', bg: '#ebd1dc15', accent: '#9333ea', accentBg: '#faf5ff' }
};

// Helper to get accent color for a given formation
function getSectionAccent(form) {
  if (!form) return { accent: '#3b82f6', accentBg: '#eff6ff' };
  for (const sec of sections.value) {
    if (sec.subSections) {
      for (const sub of sec.subSections) {
        if (sub.items.some(i => i.id === form.id)) return sec.style;
      }
    } else if (sec.items?.some(i => i.id === form.id)) {
      return sec.style;
    }
  }
  return { accent: '#3b82f6', accentBg: '#eff6ff' };
}

const selectedAccent = computed(() => getSectionAccent(selectedFormation.value));

// Build explicit sections per requested layout
const sections = computed(() => {
  const map = new Map(groupedFormations.value.map((g) => [g.category, g.items]));

  // P3 Filtering Logic
  const isP3 = store.isP3Mode;
  const lastFormation = currentSession.value?.formationChoisie || "";
  const lastLevel = (currentSession.value?.stopLevel || "").toLowerCase();
  const lastLevelOrder = currentSession.value?.stopLevelOrder || 0; // Backend should ideally provide this, but we can fall back

  // Dynamic level order from formation data
  const getLevelOrder = (formationLabel, levelLabel) => {
    const f = formations.value.find(form => form.label === formationLabel);
    if (!f || !f.levels) {
      // Fallback for legacy keywords if formation not found or has no levels in memory
      const lvl = levelLabel.toLowerCase();
      if (lvl.includes('initial')) return 1;
      if (lvl.includes('basique')) return 2;
      if (lvl.includes('opérationnel') || lvl.includes('operationnel')) return 3;
      if (lvl.includes('avancé') || lvl.includes('avance')) return 4;
      if (lvl.includes('expert')) return 5;
      return 0;
    }
    const clean = (s) => s.toLowerCase().replace(/^niveau\s+/i, '').trim();
    const target = clean(levelLabel);
    const l = f.levels.find(lvl => clean(lvl.label) === target);
    return l ? (l.order || 0) : 0;
  };

  const currentLevelOrder = lastLevelOrder || getLevelOrder(lastFormation, lastLevel);
  const isBureautiqueLast = lastFormation.toLowerCase().includes('word') || 
                            lastFormation.toLowerCase().includes('excel') || 
                            lastFormation.toLowerCase().includes('ppt') || 
                            lastFormation.toLowerCase().includes('powerpoint') || 
                            lastFormation.toLowerCase().includes('outlook');

  let filteredBureauItems = map.get('bureautique') || [];
  let filteredOtherCategories = true; // By default show others

  if (isP3 && isBureautiqueLast) {
    if (currentLevelOrder <= 2) { // Initial (1) or Basique (2)
      // Proposer: la suite dans la même formation (Niveau Opérationnel)
      // OU le niveau initial dans une autre formation bureautique
      // (On laisse les bureautique visibles pour l'instant, mais on pourrait affiner le texte)
    } else if (currentLevelOrder >= 3) { // Opérationnel (3) or more
      // Basique et opérationnel au minimum => Possibilité de choisir une formation dans une autre catégorie.
      // On bloque la catégorie Bureautique
      filteredBureauItems = [];
    }
  }

  const bureauItems = filteredBureauItems;
  const microsoft = bureauItems.filter(f => {
    const l = f.label.toLowerCase();
    return l.includes('microsoft') || l.includes('office') || l.includes('word') || l.includes('excel') || l.includes('ppt') || l.includes('powerpoint') || l.includes('outlook');
  });
  const google = bureauItems.filter(f => f.label.toLowerCase().includes('google'));

  const langs = map.get('anglais-francais') || [];
  const creation = map.get('illustration') || [];
  const ia = map.get('ia-generative') || [];
  const digcompGroup = map.get('digcomp-google-wordpress') || [];

  return [
    { 
      key: 'bureautique', 
      title: 'Bureautique', 
      style: sectionStyles.bureautique,
      subSections: [
        { title: '1. Microsoft Office', items: microsoft, suite: 'microsoft' },
        { title: '2. Google Workspace', items: google, suite: 'google' }
      ],
      hidden: bureauItems.length === 0
    },
    { key: 'langues', title: 'Langues', items: langs, style: sectionStyles.langues },
    { key: 'creation', title: 'Création', items: [...creation, ...ia], style: sectionStyles.creation },
    { key: 'internet', title: 'Internet', items: digcompGroup, style: sectionStyles.internet },
  ].filter(s => !s.hidden);
});

function selectBureau(form, suite) {
  selectedFormation.value = form;
  selectedSuite.value = suite;
  // If we want immediate selection like before:
  // selectFormation();
}

</script>

<template>
  <div class="min-h-screen bg-[#F0F4F8] flex flex-col font-outfit">
    <SiteHeader />

    <main class="flex-1 max-w-5xl w-full mx-auto p-4 py-10">
      <div class="max-w-3xl mx-auto mb-10">
        <!-- Progress Bar -->
        <div v-if="store.actualWorkflowSteps.length > 0" class="w-full h-2.5 bg-white rounded-full overflow-hidden mb-8 shadow-sm border border-gray-100">
          <div class="h-full bg-brand-primary transition-all duration-700" :style="{ width: store.getProgress('/formations').percentage + '%' }"></div>
        </div>
      
        <div class="text-center">
          <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-3">
            Quelle formation souhaitez-vous suivre ?
          </h1>
          <p class="text-gray-400 text-base md:text-lg">
            Faites votre choix ci-dessous :
          </p>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="bg-white rounded-4xl p-6 md:p-12 shadow-xl border border-white">
        <div class="space-y-12">
          <div v-for="section in sections" :key="section.key" class="space-y-6">
            <h3 
              class="inline-block px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest border"
              :style="{ 
                backgroundColor: section.style?.bg || '#eff6ff', 
                color: '#1f2937',
                borderColor: section.style?.color || '#3b82f6'
              }"
            >
              {{ section.title }}
            </h3>

            <!-- Subsections (Bureautique) -->
            <div v-if="section.subSections" class="space-y-10 pl-4">
              <div v-for="sub in section.subSections" :key="sub.title" class="space-y-4">
                <h4 class="text-sm font-bold text-gray-500 italic">{{ sub.title }}</h4>
                <div class="formations-grid">
                  <button
                    v-for="form in sub.items"
                    :key="form.id"
                    @click="selectBureau(form, sub.suite)"
                    class="formation-card relative"
                    :class="selectedFormation?.id === form.id ? 'formation-card--selected' : 'formation-card--default'"
                    :style="selectedFormation?.id === form.id ? { borderColor: selectedAccent.accent, boxShadow: `0 15px 30px -10px ${selectedAccent.accent}33` } : {}"
                  >
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm" :style="selectedFormation?.id === form.id ? { backgroundColor: selectedAccent.accent, color: 'white', boxShadow: `0 8px 16px -4px ${selectedAccent.accent}40` } : { backgroundColor: 'white', color: '#9ca3af' }">
                          <span class="material-icons-outlined text-xl">{{ sub.suite === 'microsoft' ? 'description' : 'cloud' }}</span>
                       </div>
                       <span class="formation-card__label" :style="selectedFormation?.id === form.id ? { color: selectedAccent.accent } : {}">{{ form.label }}</span>
                    </div>

                    <!-- Selected badge -->
                    <div v-if="selectedFormation?.id === form.id" class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10 animate-scale-up" :style="{ backgroundColor: selectedAccent.accent }">
                      <span class="material-icons-outlined text-[14px] font-bold">check</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Normal Sections -->
            <div v-else class="formations-grid">
              <button
                v-for="form in section.items"
                :key="form.id"
                @click="selectedFormation = form; if(section.key!=='bureautique') selectedSuite=''"
                class="formation-card relative"
                :class="selectedFormation?.id === form.id ? 'formation-card--selected' : 'formation-card--default'"
                :style="selectedFormation?.id === form.id ? { borderColor: selectedAccent.accent, boxShadow: `0 15px 30px -10px ${selectedAccent.accent}33` } : {}"
              >
                <div class="flex items-center gap-4">
                   <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm" :style="selectedFormation?.id === form.id ? { backgroundColor: selectedAccent.accent, color: 'white', boxShadow: `0 8px 16px -4px ${selectedAccent.accent}40` } : { backgroundColor: 'white', color: '#9ca3af' }">
                      <span class="material-icons-outlined text-xl">{{ form.icon || 'star' }}</span>
                   </div>
                   <span class="formation-card__label" :style="selectedFormation?.id === form.id ? { color: selectedAccent.accent } : {}">{{ form.label }}</span>
                </div>

                <!-- Selected badge -->
                <div v-if="selectedFormation?.id === form.id" class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10 animate-scale-up" :style="{ backgroundColor: selectedAccent.accent }">
                  <span class="material-icons-outlined text-[14px] font-bold">check</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Formation Feedback (prominent inline banner) -->
        <div ref="inlineBannerRef" class="mt-12">
          <transition name="fade-slide">
            <div v-if="selectedFormation" 
                 class="p-6 md:p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-6 animate-scale-up shadow-2xl relative overflow-hidden" 
                 :style="{ 
                   backgroundColor: 'white',
                   borderColor: selectedAccent.accent + '40',
                   boxShadow: `0 20px 50px -12px ${selectedAccent.accent}25`
                 }">
              <!-- Decorative background element -->
              <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 pointer-events-none" :style="{ backgroundColor: selectedAccent.accent }"></div>
              
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
                <span class="material-icons-outlined text-3xl">verified</span>
              </div>
              <div class="text-center md:text-left flex-1">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] mb-1" :style="{ color: selectedAccent.accent }">Formation sélectionnée</p>
                <h3 class="text-2xl md:text-3xl font-black text-[#0d1b3e] leading-tight">{{ selectedFormation.label }}</h3>
                <div v-if="selectedSuite" class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                   <span class="material-icons-outlined text-xs">{{ selectedSuite === 'microsoft' ? 'description' : 'cloud' }}</span>
                   {{ selectedSuite === 'microsoft' ? 'Microsoft Office' : 'Google Workspace' }}
                </div>
              </div>
              <div class="hidden lg:block h-12 w-px bg-gray-100 mx-4"></div>
              <div class="flex items-center gap-2 text-gray-400">
                <span class="material-icons-outlined text-sm">info</span>
                <span class="text-xs font-bold italic">Cliquez sur « Continuer » pour valider</span>
              </div>
            </div>
          </transition>
        </div>

        <!-- Bottom Actions -->
        <div class="pt-12 flex items-center justify-center border-t border-gray-50 mt-12">
          <button
            @click="selectFormation"
            :disabled="submitting || !selectedFormation"
            class="px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0"
          >
            <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
            <span>{{ submitting ? 'Chargement...' : 'Continuer' }}</span>
            <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>

    <SiteFooter />

    <!-- Sticky Bottom Bar - apparaît quand la bannière inline sort du viewport -->
    <transition name="sticky-slide">
      <div
        v-if="selectedFormation && showStickyBar"
        class="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 shadow-2xl"
        :style="{ backgroundColor: selectedAccent.accentBg || '#eff6ff', borderTop: `2px solid ${selectedAccent.accent}30` }"
      >
        <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg animate-pulse" :style="{ backgroundColor: selectedAccent.accent, color: 'white' }">
              <span class="material-icons-outlined text-xl">verified</span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.2em]" :style="{ color: selectedAccent.accent }">Formation sélectionnée</p>
              <p class="text-base md:text-lg font-black text-[#0d1b3e] leading-tight">{{ selectedFormation.label }}</p>
            </div>
          </div>
          <button
            @click="selectFormation"
            :disabled="submitting"
            class="px-8 py-3.5 font-black uppercase tracking-widest text-xs rounded-xl shadow-2xl transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-40 shrink-0"
            :style="{ backgroundColor: selectedAccent.accent, color: 'white', boxShadow: `0 12px 24px -6px ${selectedAccent.accent}60` }"
          >
            <span v-if="submitting" class="material-icons-outlined animate-spin text-lg">sync</span>
            <span class="hidden sm:inline">{{ submitting ? 'Chargement...' : 'Continuer' }}</span>
            <span class="sm:hidden">{{ submitting ? '...' : 'Continuer' }}</span>
            <span v-if="!submitting" class="material-icons-outlined text-lg">arrow_forward</span>
          </button>
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

/* Sticky bottom bar animation */
.sticky-slide-enter-active, .sticky-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.sticky-slide-enter-from { transform: translateY(100%); opacity: 0; }
.sticky-slide-leave-to { transform: translateY(100%); opacity: 0; }

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
  background: #f1f5f9;
  border: 1px solid #f1f5f9;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.formation-card:hover {
  background: #e2e8f0;
  border-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
}

.formation-card:active {
  transform: translateY(0) scale(0.98);
}

.formation-card--selected {
  border-color: #2563eb; /* blue-600 */
  border-width: 2px;
  background: white;
  box-shadow: 0 15px 30px -10px rgba(37, 99, 235, 0.25);
  transform: translateY(-4px) scale(1.02);
  z-index: 5;
}

.formation-card__label {
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--title-color);
  text-align: left;
  line-height: 1.25;
  transition: color 0.3s ease;
}

.formation-card--selected .formation-card__label {
  color: #60a5fa; /* blue-400 */
}

.formation-card__radio {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.formation-card__radio--selected {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-primary);
}

.formation-card--selected .formation-card__radio--selected {
  border-color: #60a5fa; /* blue-400 */
  background: white;
}

.formation-card--selected .formation-card__radio-dot {
  background: #60a5fa; /* blue-400 */
}

.formation-card__radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: white;
}

/* Bureau card styling for modal */
.bureau-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  min-height: 3rem;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

@media (min-width: 768px) {
  .bureau-card {
    gap: 1rem;
    padding: 1rem 1.25rem;
    min-height: 3.5rem;
    border-radius: 1.25rem;
  }
}

.bureau-card--google {
  color: #1f2937;
  border-color: #bfdbfe;
  background: #f0f9ff;
}

.bureau-card--google:hover {
  border-color: #3b82f6;
  background: #e0f2fe;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
}

.bureau-card--google-selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
}

.bureau-card--microsoft {
  color: #1f2937;
  border-color: #c7d2fe;
  background: #f5f3ff;
}

.bureau-card--microsoft:hover {
  border-color: #6366f1;
  background: #ede9fe;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
}

.bureau-card--microsoft-selected {
  border-color: #6366f1;
  background: #faf5ff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.15);
}
</style>
