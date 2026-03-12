<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import AppLogo from '../components/AppLogo.vue';
import HighLevelAlertModal from '../components/HighLevelAlertModal.vue';
import WorkflowProgressBar from '../components/WorkflowProgressBar.vue';

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const session = ref(null);
const loading = ref(true);
const pdfContent = ref(null);
const downloadingPDF = ref(false);
const levels = ref([]);

// High level alert settings
const alertSettings = ref({
  formations: [],
  thresholdOrder: 2
});
const showHighLevelAlert = ref(false);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const recommendedLabel = computed(() => {
  if (!session.value) return "";
  
  // If a rule override is present, use its specific recommendation
  if (session.value.isQuestionRuleOverride && session.value.recommendation) {
    return session.value.recommendation;
  }

  const rec = session.value.finalRecommendation || "";
  
  // If we have a combined path (multiple levels), use the specific label requested by the user
  if (rec.includes("&") || rec.includes(" et ") || rec.includes(" | ") || (Array.isArray(session.value.recommendations) && session.value.recommendations.length > 1)) {
    return "Consolider les bases et développer votre autonomie";
  }

  if (rec) return rec;

  const level =
    session.value.lastValidatedLevel || session.value.stopLevel || "";

  if (!session.value.formationChoisie && !level) return "Parcours personnalisé";

  let displayLevel = level;
  if (displayLevel && !displayLevel.toLowerCase().includes("niveau")) {
      displayLevel = `Niveau ${displayLevel}`;
  }

  return `${session.value.formationChoisie || ""} - ${displayLevel}`.trim();
});

// helper for adapting messaging when prereq shows insuffisant
const hasInsufficientPrereq = computed(() => {
  if (!session.value || !session.value.prerequisiteScore) return false;
  return Object.values(session.value.prerequisiteScore).some(
    (v) => String(v).toLowerCase() === "insuffisant"
  );
});

const recommendedLevel1 = computed(() => {
  if (!session.value || !levels.value.length) return null;
  const opts = parcoursOptions.value;
  if (!opts.length) return null;
  
  const label = opts[0]?.trim();
  if (!label) return null;

  // Try exact match first
  let level = levels.value.find(l => l.label === label);
  if (level) return level;

  // Try to find if label contains any level label (matching from longest to shortest to avoid partial match issues like A1 in A11)
  const sortedLevels = [...levels.value].sort((a, b) => b.label.length - a.label.length);
  return sortedLevels.find(l => label.toLowerCase().includes(l.label.toLowerCase())) || null;
});

const recommendedLevel2 = computed(() => {
  if (!session.value || !levels.value.length) return null;
  const opts = parcoursOptions.value;
  if (opts.length < 2) return null;

  const label = opts[1]?.trim();
  if (!label) return null;

  let level = levels.value.find(l => l.label === label);
  if (level) return level;

  const sortedLevels = [...levels.value].sort((a, b) => b.label.length - a.label.length);
  return sortedLevels.find(l => label.toLowerCase().includes(l.label.toLowerCase())) || null;
});

function getStepTitle(index) {
  const opt = parcoursOptions.value[index];
  if (!opt) return "";
  
  const level = index === 0 ? recommendedLevel1.value : recommendedLevel2.value;
  
  // If we found a level, and the option is NOT already exactly that level title
  // we try to format it as "Formation - Level" for consistency
  if (level && session.value.formationChoisie) {
     const standardTitle = `${session.value.formationChoisie} - ${level.label}`;
     // If the manual option is just the level, or even just the level name without formation
     if (opt.toLowerCase() === level.label.toLowerCase() || standardTitle.toLowerCase().includes(opt.toLowerCase())) {
        return standardTitle;
     }
  }
  
  return opt;
}

const parcoursOptions = computed(() => {
  if (!session.value) return [];
  
  // If we have an explicit list of recommendations from backend rules/logic
  let rawOptions = [];
  if (Array.isArray(session.value.recommendations) && session.value.recommendations.length) {
    rawOptions = session.value.recommendations.map(r => String(r));
  } else {
    const rec = session.value.finalRecommendation || "";
    if (rec) rawOptions = [rec];
  }

  if (rawOptions.length === 0) return [];

  // Flatten and split all options by separators: " | ", " & ", " et "
  const finalOpts = [];
  rawOptions.forEach(opt => {
    const parts = opt.split(/ \| | & | et /);
    parts.forEach(p => {
      const trimmed = p.trim();
      if (trimmed) finalOpts.push(trimmed);
    });
  });

  return finalOpts;
});

// display options based on calculated parcoursOr explicit recommendations
const displayOptions = computed(() => {
  if (!session.value) return [];
  return parcoursOptions.value;
});

const nextLevel = computed(() => recommendedLevel2.value);

const isBlocked = computed(() => {
  return session.value?.isQuestionRuleOverride && session.value?.ruleResultType === 'BLOCK';
});

async function loadLevelsForFormation() {
  try {
    const formationSlug = localStorage.getItem("selected_formation_slug");
    if (!formationSlug) return;
    const res = await axios.get(
      `${apiBaseUrl}/formations/${formationSlug}/levels`,
    );
    levels.value = (res.data || []).slice().sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Failed to load levels for result view:", error);
  }
}

async function loadResultats() {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const response = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    session.value = response.data;
    await loadLevelsForFormation();
    await fetchAlertSettings();
  } catch (error) {
    console.error("Failed to load results:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(loadResultats);

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// French grammar: "d'" before vowels/h, "de " before consonants
function niveauDe(text) {
  if (!text) return 'de ';
  const first = text.trim()[0].toLowerCase();
  return 'aeiouyàâéèêëïîôùûüh'.includes(first) ? "d'" : 'de ';
}

async function fetchAlertSettings() {
  try {
    const [formsRes, thresholdRes] = await Promise.all([
      axios.get(`${apiBaseUrl}/settings/HIGH_LEVEL_ALERT_FORMATIONS`),
      axios.get(`${apiBaseUrl}/settings/HIGH_LEVEL_THRESHOLD_ORDER`)
    ]);
    
    if (formsRes.data?.value) {
      alertSettings.value.formations = formsRes.data.value.split(',').map(s => s.trim());
    }
    if (thresholdRes.data?.value) {
      alertSettings.value.thresholdOrder = parseInt(thresholdRes.data.value) || 2;
    }
  } catch (error) {
    console.warn("Failed to fetch high level alert settings:", error);
  }
}

const goNext = () => {
  if (shouldShowAlert.value && !showHighLevelAlert.value) {
    showHighLevelAlert.value = true;
    return;
  }
  const nextRoute = store.getNextRoute("/resultats");
  router.push(nextRoute || "/complementary");
};

const shouldShowAlert = computed(() => {
  if (!session.value || !alertSettings.value.formations.length) return false;
  
  // 1. Check if current formation is in alert list
  const isTargetFormation = alertSettings.value.formations.some(f => 
    session.value.formationChoisie?.toLowerCase().includes(f.toLowerCase())
  );
  if (!isTargetFormation) return false;

  // 2. Check achievement level
  const currentLevel = levels.value.find(l => l.label === session.value.stopLevel);
  if (!currentLevel) return false;

  return currentLevel.order >= alertSettings.value.thresholdOrder;
});

const handleContinueAlert = async () => {
  try {
    await axios.patch(`${apiBaseUrl}/sessions/${sessionId}`, {
      highLevelContinue: true
    });
  } catch (error) {
    console.error("Failed to update session with highLevelContinue flag", error);
  }
  showHighLevelAlert.value = false;
  const nextRoute = store.getNextRoute("/resultats");
  router.push(nextRoute || "/complementary");
};

const handleChangeFormation = () => {
  showHighLevelAlert.value = false;
  router.push("/formations");
};

const generateSimplePdf = () => {
  if (!session.value) return;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 20;
  pdf.setFontSize(16);
  pdf.text("Bilan de positionnement", 105, y, { align: "center" });
  y += 10;

  pdf.setFontSize(12);
  pdf.text(
    `Bénéficiaire : ${session.value.civilite || ""} ${session.value.prenom} ${session.value.nom}`.trim(),
    20,
    y,
  );
  y += 7;
  pdf.text(`Formation : ${session.value.formationChoisie || ""}`, 20, y);
  y += 7;
  if (session.value.finalRecommendation) {
    pdf.text(
      `Recommandation : ${session.value.finalRecommendation}`,
      20,
      y,
    );
    y += 7;
  }

  if (session.value.levelsScores) {
    y += 5;
    pdf.setFontSize(13);
    pdf.text("Scores par niveau", 20, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.text("Niveau", 20, y);
    pdf.text("Score", 70, y);
    pdf.text("Seuil", 100, y);
    pdf.text("Validé", 130, y);
    y += 4;
    pdf.line(20, y, 180, y);
    y += 4;

    Object.entries(session.value.levelsScores).forEach(([level, e]) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      const entry = e || {};
      pdf.text(String(level), 20, y);
      pdf.text(
        `${entry.score || 0}/${entry.total || 0}`,
        70,
        y,
      );
      pdf.text(
        `${entry.requiredCorrect ?? "-"}`,
        100,
        y,
      );
      pdf.text(
        entry.validated ? "Oui" : "Non",
        130,
        y,
      );
      y += 5;
    });
  }

  pdf.save(
    `Bilan_WiziLearn_${session.value.prenom}_${session.value.nom}.pdf`,
  );
};

const downloadPDF = async () => {
  if (!pdfContent.value) return;
  downloadingPDF.value = true;
  try {
    const element = document.createElement("div");
    element.innerHTML = pdfContent.value.outerHTML;
    // Copy the original styles to the cloned element to ensure rendering is precise
    element.style.width = pdfContent.value.offsetWidth + "px";
    element.style.padding = "20px";
    element.style.background = "#ffffff";
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";
    document.body.appendChild(element);

    // Certains styles Tailwind utilisent oklch(), non supporté par html2canvas.
    // On désactive temporairement les feuilles de style qui contiennent "oklch("
    // pour éviter l'erreur, puis on les réactive après la capture.
    const disabledSheets = [];
    const styleSheets = Array.from(document.styleSheets || []);
    styleSheets.forEach((sheet) => {
      try {
        const rules = sheet.cssRules;
        if (!rules) return;
        for (let i = 0; i < rules.length; i++) {
          const cssText = rules[i].cssText || "";
          if (cssText.includes("oklch(")) {
            sheet.disabled = true;
            disabledSheets.push(sheet);
            break;
          }
        }
      } catch (e) {
        // Certaines feuilles peuvent être cross-origin : on les ignore
      }
    });

    let canvas;
    try {
      canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        ignoreElements: (node) => {
          return node.nodeName === "BUTTON"; // Exclure les boutons du PDF
        }
      });
    } finally {
      disabledSheets.forEach((sheet) => (sheet.disabled = false));
      document.body.removeChild(element);
    }

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add white background specifically for JS PDF (helps with transparent pngs if any creep in)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(
      `Bilan_WiziLearn_${session.value.prenom}_${session.value.nom}.pdf`
    );
  } catch (err) {
    console.error("PDF generation failed (html2canvas):", err);
    try {
      generateSimplePdf();
    } catch (fallbackError) {
      console.error("Fallback PDF generation failed:", fallbackError);
      alert("Erreur lors de la génération du PDF.");
    }
  } finally {
    downloadingPDF.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader>
      <template #actions>
        <!-- <div v-if="session" class="flex items-center gap-4"><div v-if="session" class="flex items-center gap-4">
          <button
            @click="downloadPDF"
            :disabled="downloadingPDF"
            class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all font-bold text-sm text-blue-900 border border-white/30 disabled:opacity-50"
          >
            <span class="material-icons-outlined text-sm">{{
              downloadingPDF ? "sync" : "picture_as_pdf"
            }}</span>
            {{ downloadingPDF ? "PDF" : "Télécharger PDF" }}
          </button>
          <div
            class="hidden md:flex items-center gap-3 bg-white/40 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/30"
          >
            <div
              class="w-7 h-7 rounded-full overflow-hidden border-2 border-white/50 shadow-sm"
            >
              <img
                src="https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff"
                :alt="session.prenom"
              />
            </div>
            <span class="text-xs font-bold text-blue-900"
              >{{ session.prenom }} {{ session.nom }}</span
            >
          </div>
        </div> -->
      </template>
    </SiteHeader>

    <main
      v-if="loading"
      class="flex-1 flex flex-col items-center justify-center py-20 gap-4"
    >
      <div
        class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
      ></div>
      <p class="text-gray-400 font-bold italic">
        Calcul de votre parcours personnalisé...
      </p>
    </main>

    <main
      v-else-if="session"
      class="flex-1 max-w-4xl w-full mx-auto p-4 py-12 md:py-16"
      ref="pdfContent"
    >
      <!-- Success Banner -->
      <div class="text-center mb-14 relative">
        <!-- <div
          class="w-14 h-14 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce shadow-sm"
        >
          <span class="material-icons-outlined text-2xl">celebration</span>
        </div> -->
        <h1
          class="text-3xl md:text-4xl font-extrabold heading-primary mb-4 tracking-tight"
        >
          Bravo {{ session.prenom }} !
        </h1>
        <p
          class="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8"
        >
          Félicitations, vous avez franchi la première étape vers votre nouvelle
          carrière. Nous avons analysé votre profil pour vous construire un
          parcours sur-mesure, simple et efficace.
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <div
            class="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-500"
          >
            <span class="material-icons-outlined text-sm text-gray-400"
              >calendar_today</span
            >
            Bilan du {{ formatDate(session.createdAt) }}
          </div>
          <div
            class="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-500"
          >
            <span class="material-icons-outlined text-sm text-success"
              >verified</span
            >
            Évaluation complétée
          </div>
        </div>
      </div>

      <!-- Profile Summary Section -->
      <section class="mb-14">
        <div class="flex items-center gap-3 mb-6">
          <span class="material-icons-outlined text-brand-primary text-lg">person_search</span>
          <h2 class="text-base font-bold section-title uppercase tracking-widest">Votre Profil</h2>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-8">
          <div class="flex-1 space-y-2">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Métier / Poste</p>
            <p class="text-lg font-bold text-blue-900">{{ session.metier || 'Non renseigné' }}</p>
          </div>
          <div class="flex-1 space-y-2">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Situation</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="sit in (session.situation || [])" :key="sit" 
                    class="px-3 py-1 bg-blue-50 text-brand-primary rounded-lg text-xs font-bold border border-blue-100">
                {{ sit }}
              </span>
              <span v-if="!session.situation?.length" class="text-gray-400 text-sm italic">Non renseignée</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Progress Bar -->
      <WorkflowProgressBar customPath="/resultats" />

      <!-- Strengths Section -->
      <section class="mb-14">
        <div class="flex items-center gap-3 mb-6">
          <span class="material-icons-outlined text-brand-primary text-lg"
            >auto_graph</span
          >
          <h2
            class="text-base font-bold section-title uppercase tracking-widest"
          >
            Vos points forts
          </h2>
        </div>

        <div class="grid grid-cols-1 gap-5">
          <div
            class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
          >
            <div class="flex items-start justify-between mb-5">
              <!-- <div
                class="w-9 h-9 bg-indigo-600/10 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-blue-400 transition-all text-sm"
              >
                <span class="material-icons-outlined">menu_book</span>
              </div> -->
              <!-- <span
                class="px-3 py-1 bg-success-soft text-success rounded-full text-[10px] font-bold uppercase tracking-widest"
                >Déjà Acquis</span
              > -->
            </div>
            <h3 class="text-base font-bold heading-primary mb-2">
              Bases Informatiques
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              <template v-if="hasInsufficientPrereq">
                Certaines compétences de base sont insuffisantes. Le parcours choisi
                vous aidera à les renforcer avant de poursuivre.
              </template>
              <template v-else>
                Vous maîtrisez déjà les outils de base. C'est un excellent socle
                pour vous concentrer sur vos nouveaux apprentissages.
              </template>
            </p>
          </div>

          <!-- <div
            v-if="session.stopLevel && session.scorePretest !== -1"
            class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
          >
            <div class="flex items-start justify-between mb-5">
              <span
                class="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest"
                >Niveau {{ session.stopLevel }}</span
              >
            </div>
            <h3 class="text-base font-bold heading-primary mb-2">
              Niveau {{ niveauDe(session.formationChoisie) }}{{ session.formationChoisie }}
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Le parcours choisi vous permettra de valider le niveau {{ session.stopLevel }}.
            </p>
          </div>
          <div
            v-else-if="session.scorePretest === -1"
            class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
          >
             <div class="flex items-start justify-between mb-5">
              <div
                class="w-9 h-9 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center group-hover:bg-brand-primary group-hover:text-blue-400 transition-all text-sm"
              >
                <span class="material-icons-outlined">history_edu</span>
              </div>
              <span
                class="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest"
                >Bilan Initial</span
              >
            </div>
            <h3 class="text-base font-bold heading-primary mb-2">
              Évaluation Initiale
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Ce parcours correspond à un démarrage pour acquérir les bases fondamentales.
            </p>
          </div> -->
        </div>
      </section>

      <!-- Recommendation Section -->
      <section class="mb-14">
        <div class="flex items-center gap-3 mb-6">
          <span class="material-icons-outlined text-brand-primary text-lg"
            >map</span
          >
          <h2
            class="text-base font-bold section-title uppercase tracking-widest"
          >
            Le parcours personnalisé que nous vous proposons
          </h2>
        </div>

        <div v-if="parcoursOptions.length > 0"
          class="relative bg-white rounded-3xl shadow-xl border border-white overflow-hidden"
        >
          <!-- Compact Header -->
          <div
            class="bg-brand-primary/5 p-6 md:p-8 border-b border-brand-primary/10 relative overflow-hidden"
          >
            <div class="relative z-10">
              <span
                class="inline-block px-3 py-1 bg-brand-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-2"
              >
                Nous vous proposons le parcours :
              </span>
              <h3 class="text-xl md:text-2xl font-extrabold text-brand-primary">
                {{ recommendedLabel }}
              </h3>
              <p class="text-gray-500 text-sm mt-2 max-w-2xl leading-relaxed">
                {{ isBlocked 
                   ? "Votre profil nécessite un accompagnement spécifique basé sur vos réponses."
                   : "Ce parcours est optimisé selon vos compétences pour vous garantir une progression efficace." 
                }}
              </p>
            </div>
            <!-- Subtle decoration -->
            <div class="absolute right-6 top-1/2 -translate-y-1/2 opacity-5">
              <span class="material-icons-outlined text-7xl">auto_awesome</span>
            </div>
          </div>

          <div class="p-6 md:p-8 space-y-6">
            <!-- Step 1 in Path -->
            <div class="flex items-start gap-5 relative">
              <!-- <div
                class="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0 font-bold text-xs relative z-10 shadow-sm"
              >
                1
              </div> -->
              <div class="flex-1">
                <h4 class="text-base font-bold text-gray-800">
                  {{ getStepTitle(0) || recommendedLabel }}
                </h4>
                <p class="text-gray-400 font-medium text-xs mt-1">
                  {{ recommendedLevel1?.metadata?.subtitle || "Développement des compétences fondamentales." }}
                </p>
              </div>

              <!-- Connector Line -->
              <div v-if="parcoursOptions.length > 1 || nextLevel"
                class="absolute left-[15px] top-8 -bottom-6 w-px bg-brand-primary/10"
              ></div>
            </div>

            <!-- Optimized Separator -->
            <div v-if="parcoursOptions.length > 1 || nextLevel" class="ml-4 flex items-center">
              <div
                class="w-6 h-6 rounded-full bg-white border border-brand-primary/20 text-brand-primary flex items-center justify-center relative z-10 shadow-sm"
              >
                <span class="material-icons-outlined text-xs">add</span>
              </div>
            </div>

            <!-- Step 2 in Path -->
            <div v-if="nextLevel || (parcoursOptions.length > 1)" class="flex items-start gap-5">
              <!-- <div
                class="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0 font-bold text-xs relative z-10"
              >
                2
              </div> -->
              <div class="flex-1">
                <h4 class="text-base font-bold text-gray-800">
                  {{ getStepTitle(1) || 'Niveau Suivant' }}
                </h4>
                <p class="text-gray-400 font-medium text-xs mt-1">
                  {{ recommendedLevel2?.metadata?.subtitle || "Approfondissement et maîtrise avancée." }}
                </p>
              </div>
            </div>
            
            <div v-if="parcoursOptions.length <= 1 && !nextLevel" class="text-center py-3 text-gray-400 italic text-xs border-t border-gray-50 mt-4">
              Parcours de formation complet.
            </div>

            <!-- Compact Financement Box -->
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-3">
              <span class="material-icons-outlined text-brand-primary text-lg">verified</span>
              <p class="text-[11px] font-semibold text-gray-600">
                Parcours certifiant et 100% finançable (CPF, Employeur).
              </p>
            </div>
          </div>
        </div>

        <div class="pt-12 flex flex-col items-center gap-8 border-t border-gray-50 mt-12 w-full">
          <div class="flex flex-col items-center justify-center w-full">
            <!-- Final CTA -->
            <div class="flex flex-col items-center gap-6">
              <p
                class="text-gray-400 font-medium max-w-lg mx-auto leading-relaxed text-sm text-center"
              >
                Ce parcours vous semble idéal ? Cliquez sur le bouton ci-dessous
                pour le valider.
              </p>

              <button
                v-if="!isBlocked"
                @click="goNext"
                class="px-12 py-4 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
              >
                <span>Valider ce parcours et continuer</span>
                <span class="material-icons-outlined text-lg">arrow_forward</span>
              </button>
              
              <button
                v-else
                @click="handleChangeFormation"
                class="px-12 py-4 bg-white border-2 border-brand-primary text-brand-primary font-bold rounded-2xl shadow-lg hover:bg-brand-primary/10 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto text-base"
              >
                <span>Changer de formation</span>
                <span class="material-icons-outlined text-lg">grid_view</span>
              </button>
            </div>

            <!-- Placeholder for alignment -->
            <div class="hidden sm:block w-24"></div>
          </div>

          <p
            class="text-xs font-medium text-gray-400 uppercase tracking-widest italic"
          >
            C'est gratuit et sans engagement de votre part à ce stade.
          </p>
        </div>
      </section>

    </main>

    <SiteFooter />

    <HighLevelAlertModal 
      :show="showHighLevelAlert"
      :formation="session?.formationChoisie"
      :level="session?.stopLevel"
      @close="showHighLevelAlert = false"
      @continue="handleContinueAlert"
      @changeFormation="handleChangeFormation"
    />
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}

.bg-dashed {
  background-image: linear-gradient(
    to bottom,
    #e2e8f0 60%,
    rgba(255, 255, 255, 0) 0%
  );
  background-position: left;
  background-size: 1px 12px;
  background-repeat: repeat-y;
}
</style>
