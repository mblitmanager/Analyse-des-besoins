<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import AppLogo from '../components/AppLogo.vue'

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const session = ref(null);
const loading = ref(true);
const pdfContent = ref(null);
const downloadingPDF = ref(false);

async function loadResultats() {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(`${apiBaseUrl}/sessions/${sessionId}`);
    session.value = response.data;
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

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      ignoreElements: (node) => {
        return node.nodeName === "BUTTON"; // Exclude buttons from PDF
      }
    });

    document.body.removeChild(element);

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
      `Bilan_WizzyLearn_${session.value.prenom}_${session.value.nom}.pdf`
    );
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("Erreur lors de la génération du PDF.");
  } finally {
    downloadingPDF.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl">
          W
        </div>
        <AppLogo />
      </div>

      <div v-if="session" class="flex items-center gap-4">
        <button
          @click="downloadPDF"
          :disabled="downloadingPDF"
          class="flex items-center gap-2 px-4 py-2 btn-primary rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50"
        >
          <span class="material-icons-outlined text-sm">{{
            downloadingPDF ? "sync" : "picture_as_pdf"
          }}</span>
          {{ downloadingPDF ? "Génération..." : "Télécharger PDF" }}
        </button>
        <div
          class="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100"
        >
          <div
            class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm"
          >
            <img
              src="https://ui-avatars.com/api/?name=Alex+Dupont&background=0D8ABC&color=fff"
              alt="Avatar"
            />
          </div>
          <span class="text-sm font-bold text-gray-800"
            >{{ session.prenom }} {{ session.nom }}</span
          >
        </div>
        <button class="text-gray-400 hover:text-gray-600 transition-colors">
          <span class="material-icons-outlined text-xl">logout</span>
        </button>
      </div>
    </header>

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

        <div
          class="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <!-- Pack Header -->
          <div
            class="bg-brand-primary p-8 md:p-10 text-blue-400 relative overflow-hidden"
          >
            <div class="relative z-10">
              <span
                class="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
                >Offre Duo</span
              >
              <h3 class="text-2xl md:text-3xl font-bold mb-3">
                Parcours {{ session.formationChoisie }} : Immersion Totale
              </h3>
              <p class="opacity-80 text-base md:text-lg max-w-xl">
                Une solution complète combinant deux formations complémentaires
                pour garantir votre montée en compétence.
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
                class="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0 font-bold text-sm relative z-10"
              >
                1
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2"
                >
                  <h4 class="text-lg font-bold heading-primary">
                    {{ session.formationChoisie }} - Niveau
                    {{ session.stopLevel || "A2" }} (Intermédiaire)
                  </h4>
                </div>
                <p class="text-gray-400 mb-4 font-medium text-sm">
                  Renforcez vos bases et commencez à échanger avec fluidité dans
                  des situations quotidiennes.
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

            <!-- Step 2 in Path -->
            <div class="flex items-start gap-6">
              <div
                class="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0 font-bold text-sm"
              >
                2
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2"
                >
                  <h4 class="text-lg font-bold heading-primary">
                    {{ session.formationChoisie }} - Niveau B1 (Avancé)
                  </h4>
                </div>
                <p class="text-gray-400 mb-4 font-medium text-sm">
                  Maîtrisez le vocabulaire professionnel et devenez autonome
                  pour vos futures missions.
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

            <!-- Financement Box -->
            <div
              class="bg-white p-5 rounded-xl flex items-center gap-4 heading-primary border border-blue-50"
            >
              <div
                class="flex-shrink-0 w-9 h-9 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center text-sm"
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

      <!-- Page Footer -->
      <footer class="mt-20 text-center text-gray-400">
        <div class="flex items-center justify-center gap-2 mb-3">
          <span class="material-icons-outlined text-brand-primary text-lg"
            >school</span
          >
          <span class="font-bold heading-primary tracking-tight text-base"
            >Wizzy Learn</span
          >
        </div>
        <p class="text-xs font-bold uppercase tracking-widest">
          <AppLogo />
        </p>
        <div
          class="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest"
        >
          <a
            href="https://ns-conseil.com/reglement-interieur/"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-brand-primary"
          >
            Règlement intérieur
          </a>
          <a
            href="https://ns-conseil.com/cgv/"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-brand-primary"
          >
            CGV
          </a>
          <router-link
            to="/mentions-legales"
            class="hover:text-brand-primary"
          >
            Mentions légales
          </router-link>
          <router-link
            to="/respect-vie-privee"
            class="hover:text-brand-primary"
          >
            Respect de la vie privée
          </router-link>
          <router-link
            to="/politique-confidentialite"
            class="hover:text-brand-primary"
          >
            Politique de confidentialité
          </router-link>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

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
