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

// Section styles configuration
const sectionStyles = {
  bureautique: { color: '#a4c2f4', bg: '#a4c2f415' },
  langues: { color: '#f5cece', bg: '#f5cece15' },
  creation: { color: '#d9ebd3', bg: '#d9ebd315' },
  internet: { color: '#ebd1dc', bg: '#ebd1dc15' }
};

// Build explicit sections per requested layout
const sections = computed(() => {
  const map = new Map(groupedFormations.value.map((g) => [g.category, g.items]));

  const bureauItems = map.get('bureautique') || [];
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
      ]
    },
    { key: 'langues', title: 'Langues', items: langs, style: sectionStyles.langues },
    { key: 'creation', title: 'Création', items: [...creation, ...ia], style: sectionStyles.creation },
    { key: 'internet', title: 'Internet', items: digcompGroup, style: sectionStyles.internet },
  ];
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
      <div class="text-center mb-10">
        <h2 class="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2">Etape 1/5</h2>
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-3">
          Quelle formation souhaitez-vous suivre ?
        </h1>
        <p class="text-gray-400 text-base md:text-lg">
          Faites votre choix ci-dessous :
        </p>
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
                  >
                    <div class="flex items-center gap-4">
                       <div :class="selectedFormation?.id === form.id ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'bg-white text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm">
                          <span class="material-icons-outlined text-xl">{{ sub.suite === 'microsoft' ? 'description' : 'cloud' }}</span>
                       </div>
                       <span class="formation-card__label" :class="{'text-[#2563eb]': selectedFormation?.id === form.id}">{{ form.label }}</span>
                    </div>

                    <!-- Selected badge -->
                    <div v-if="selectedFormation?.id === form.id" class="absolute -top-2 -right-2 w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10 animate-scale-up">
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
              >
                <div class="flex items-center gap-4">
                   <div :class="selectedFormation?.id === form.id ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'bg-white text-gray-400'" class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm">
                      <span class="material-icons-outlined text-xl">{{ form.icon || 'star' }}</span>
                   </div>
                   <span class="formation-card__label" :class="{'text-[#2563eb]': selectedFormation?.id === form.id}">{{ form.label }}</span>
                </div>

                <!-- Selected badge -->
                <div v-if="selectedFormation?.id === form.id" class="absolute -top-2 -right-2 w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white scale-110 z-10 animate-scale-up">
                  <span class="material-icons-outlined text-[14px] font-bold">check</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Actions -->
        <div class="pt-12 flex items-center justify-between border-t border-gray-50 mt-12">
          <button
            @click="router.push('/prerequis')"
            class="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-all"
          >
            <span class="material-icons-outlined text-lg">arrow_back</span>
            Retour
          </button>

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
