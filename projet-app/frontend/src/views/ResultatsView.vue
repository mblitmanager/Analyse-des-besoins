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

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const session = ref(null);
const loading = ref(true);
const pdfContent = ref(null);
const downloadingPDF = ref(false);
const levels = ref([]);

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const recommendedLabel = computed(() => {
  if (!session.value) return "";
  if (session.value.finalRecommendation)
    return session.value.finalRecommendation;

  const level =
    session.value.lastValidatedLevel || session.value.stopLevel || "";

  if (!session.value.formationChoisie && !level) return "Parcours personnalisé";

  return `${session.value.formationChoisie || ""}${
    level ? " - " + level : ""
  }`.trim();
});

const recommendedLevel1 = computed(() => {
  if (!session.value || !levels.value.length) return null;
  const rec = session.value.finalRecommendation || "";
  if (!rec.includes("&")) {
    const label = session.value.lastValidatedLevel || session.value.stopLevel;
    return levels.value.find(l => l.label === label) || null;
  }
  // Format: "Formation - Level1 & Level2"
  const parts = rec.split("-")[1]?.trim().split("&");
  if (!parts) return null;
  const l1Label = parts[0].trim();
  return levels.value.find(l => l.label === l1Label) || null;
});

const recommendedLevel2 = computed(() => {
  if (!session.value || !levels.value.length) return null;
  const rec = session.value.finalRecommendation || "";
  if (!rec.includes("&")) return null;
  
  const parts = rec.split("-")[1]?.trim().split("&");
  if (!parts || parts.length < 2) return null;
  const l2Label = parts[1].trim();
  return levels.value.find(l => l.label === l2Label) || null;
});

const parcoursOptions = computed(() => {
  if (!session.value) return [];
  if (Array.isArray(session.value.recommendations) && session.value.recommendations.length)
    return session.value.recommendations.map(r => String(r));

  const rec = session.value.finalRecommendation || "";
  if (!rec) return [];
  // Try to split older format "Formation - Level1 & Level2"
  if (rec.includes("&")) {
    const parts = rec.split("-")[1]?.trim().split("&");
    if (parts && parts.length >= 2) {
      return [
        `${session.value.formationChoisie || ""} - ${parts[0].trim()}`.trim(),
        `${session.value.formationChoisie || ""} - ${parts[1].trim()}`.trim(),
      ];
    }
  }
  return [rec];
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

const goNext = () => {
  const nextRoute = store.getNextRoute("/resultats");
  router.push(nextRoute || "/complementary");
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
  <div class="min-h-screen flex flex-col font-outfit">
    <SiteHeader>
      <template #actions>
        <div v-if="session" class="flex items-center gap-4">
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
        </div>
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
        <div
          class="w-14 h-14 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce shadow-sm"
        >
          <span class="material-icons-outlined text-2xl">celebration</span>
        </div>
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

      <!-- Progress Bar -->
      <div
        class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8"
      >
        <div class="flex items-center justify-between mb-2 px-1">
          <span
            class="text-xs font-bold section-title uppercase tracking-widest"
            >Bilan Personnel</span
          >
          <span
            class="text-xs font-bold text-brand-primary uppercase tracking-widest"
            >Étape {{ store.getProgress("/resultats").current }} sur
            {{ store.getProgress("/resultats").total }}</span
          >
        </div>
        <div
          class="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-50"
        >
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            :style="{ width: store.getProgress('/resultats').percentage + '%' }"
          ></div>
        </div>
      </div>

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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
          >
            <div class="flex items-start justify-between mb-5">
              <div
                class="w-9 h-9 bg-indigo-600/10 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-blue-400 transition-all text-sm"
              >
                <span class="material-icons-outlined">menu_book</span>
              </div>
              <span
                class="px-3 py-1 bg-success-soft text-success rounded-full text-[10px] font-bold uppercase tracking-widest"
                >Déjà Acquis</span
              >
            </div>
            <h3 class="text-base font-bold heading-primary mb-2">
              Bases Informatiques
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Vous maîtrisez déjà les outils de base. C'est un excellent socle
              pour vous concentrer sur vos nouveaux apprentissages.
            </p>
          </div>

          <div
            v-if="session.stopLevel"
            class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
          >
            <div class="flex items-start justify-between mb-5">
              <div
                class="w-9 h-9 bg-orange-600/10 text-orange-600 rounded-lg flex items-center justify-center group-hover:bg-orange-600 group-hover:text-blue-400 transition-all text-sm"
              >
                <span class="material-icons-outlined">translate</span>
              </div>
              <span
                class="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest"
                >Niveau {{ session.stopLevel }}</span
              >
            </div>
            <h3 class="text-base font-bold heading-primary mb-2">
              Niveau d'{{ session.formationChoisie }}
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Vous avez des bases solides. Le parcours choisi va vous permettre
              d'atteindre le niveau supérieur pour votre vie professionnelle.
            </p>
          </div>
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
            Votre Parcours Personnalisé
          </h2>
        </div>

        <div v-if="parcoursOptions.length <= 1"
          class="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <!-- Pack Header -->
          <div
            class="bg-brand-primary p-8 md:p-10 text-blue-400 relative overflow-hidden"
          >
            <div class="relative z-10">
              <span
                class="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
              >
                {{ recommendedLevel2 ? "Programme Pack Duo" : "Niveau recommandé" }} :
              </span>
              <h3 class="text-2xl md:text-3xl font-bold mb-3">
                {{ recommendedLabel || 'Parcours personnalisé' }}
              </h3>
              <p class="opacity-80 text-base md:text-lg max-w-xl">
                Ce parcours est construit à partir de vos réponses aux
                prérequis, au test de positionnement et aux questions
                complémentaires, afin d'adapter la formation à votre niveau
                actuel.
              </p>
            </div>

            <!-- Decorative Elements -->
            <div
              class="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            ></div>
            <div class="absolute right-12 top-12 opacity-20 scale-[3]">
              <span class="material-icons-outlined text-9xl">bolt</span>
            </div>
          </div>

          <div class="p-6 md:p-8 space-y-10">
            <!-- Step 1 in Path -->
            <div class="flex items-start gap-6 relative">
              <div
                class="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 font-bold text-sm relative z-10"
              >
                1
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2"
                >
                  <h4 class="text-lg font-bold heading-primary">
                    {{ recommendedLevel1 ? (session.formationChoisie + ' - ' + recommendedLevel1.label) : recommendedLabel }}
                  </h4>
                </div>
                <p class="text-gray-400 mb-4 font-medium text-sm">
                  {{ recommendedLevel1?.metadata?.subtitle || "Développement des compétences fondamentales." }}
                </p>
                <div class="flex items-center gap-6">
                  <div
                    class="flex items-center gap-2 text-xs font-medium text-gray-400"
                  >
                    <span class="material-icons-outlined text-sm"
                      >schedule</span
                    >
                    35h
                  </div>
                  <div
                    class="flex items-center gap-2 text-xs font-medium text-gray-400"
                  >
                    <span class="material-icons-outlined text-sm"
                      >person_outline</span
                    >
                    Coach dédié
                  </div>
                </div>
              </div>

              <!-- Connector Line -->
              <div
                class="absolute left-[18px] top-9 bottom-[-2.2rem] w-px bg-gray-100"
              ></div>
            </div>

            <!-- Blue Plus -->
            <div class="ml-5 flex items-center justify-center">
              <div
                class="w-7 h-7 rounded-full bg-brand-primary text-blue-400 flex items-center justify-center shadow-lg shadow-brand-primary/30 relative z-10 text-sm"
              >
                <span class="material-icons-outlined text-sm">add</span>
              </div>
            </div>

            <!-- Step 2 in Path : niveau suivant dans l'ordre de la formation -->
            <div v-if="nextLevel" class="flex items-start gap-6">
              <div
                class="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 font-bold text-sm"
              >
                2
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2"
                >
                  <h4 class="text-lg font-bold heading-primary">
                    {{ session.formationChoisie }} - {{ recommendedLevel2?.label }}
                  </h4>
                </div>
                <p class="text-gray-400 mb-4 font-medium text-sm">
                  {{ recommendedLevel2?.metadata?.subtitle || "Approfondissement et maîtrise avancée." }}
                </p>
                <div class="flex items-center gap-6">
                  <div
                    class="flex items-center gap-2 text-xs font-medium text-gray-400"
                  >
                    <span class="material-icons-outlined text-sm"
                      >schedule</span
                    >
                    40h
                  </div>
                  <div
                    class="flex items-center gap-2 text-xs font-medium text-gray-400"
                  >
                    <span class="material-icons-outlined text-sm"
                      >verified_user</span
                    >
                    Certification incluse
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Fallback if only 1 level (unlikely with Pack Duo but safer) -->
            <div v-else class="text-center py-4 text-gray-400 italic text-sm">
              Parcours de formation complet.
            </div>

            <!-- Financement Box -->
            <div
              class="bg-white p-5 rounded-xl flex items-center gap-4 heading-primary border border-blue-50"
            >
              <div
                class="shrink-0 w-9 h-9 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center text-sm"
              >
                <span class="material-icons-outlined">info</span>
              </div>
              <p class="text-sm font-medium">
                Ce parcours "Pack Duo" est entièrement finançable par votre CPF
                (Mon Compte Formation).
              </p>
            </div>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(p, idx) in parcoursOptions" :key="idx" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="bg-brand-primary p-6 text-blue-400 relative overflow-hidden">
              <div class="relative z-10">
                <h3 class="text-xl font-bold mb-1">Parcours proposé {{ idx + 1 }}</h3>
                <p class="opacity-80 text-sm">{{ p }}</p>
              </div>
            </div>
            <div class="p-6">
              <p class="text-gray-500 text-sm mb-4">Ce parcours est calculé à partir de vos réponses et peut être validé ou discuté avec un conseiller.</p>
            </div>
          </div>
        </div>

        <!-- Final CTA -->
        <div class="mt-12 text-center space-y-6">
          <p
            class="text-gray-400 font-medium max-w-lg mx-auto leading-relaxed text-sm"
          >
            Ce parcours vous semble idéal ? Cliquez sur le bouton ci-dessous
            pour le valider. Un conseiller vous accompagnera pour les démarches
            administratives.
          </p>

          <button
            @click="goNext"
            class="px-12 py-4 btn-primary font-bold shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto text-base"
          >
            <span>Valider ce parcours et continuer</span>
            <span class="material-icons-outlined text-lg">arrow_forward</span>
          </button>

          <p
            class="text-xs font-medium text-gray-400 uppercase tracking-widest italic"
          >
            C'est gratuit et sans engagement de votre part à ce stade.
          </p>
        </div>
      </section>

    </main>

    <SiteFooter />
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
