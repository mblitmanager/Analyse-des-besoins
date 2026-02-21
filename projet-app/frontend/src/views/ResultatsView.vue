<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const session = ref(null);
const loading = ref(true);

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
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-50"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black italic text-xl"
        >
          W
        </div>
        <span class="font-bold text-gray-800 text-xl tracking-tight"
          >Wizzy Learn</span
        >
      </div>

      <div v-if="session" class="flex items-center gap-4">
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
      class="flex-1 max-w-4xl w-full mx-auto p-4 py-12 md:py-20"
    >
      <!-- Success Banner -->
      <div class="text-center mb-16 relative">
        <div
          class="w-16 h-16 bg-[#E1F9EB] text-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-sm"
        >
          <span class="material-icons-outlined text-3xl">celebration</span>
        </div>
        <h1 class="text-5xl font-black text-[#0D1B3E] mb-6 tracking-tight">
          Bravo {{ session.prenom }} !
        </h1>
        <p
          class="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Félicitations, vous avez franchi la première étape vers votre nouvelle
          carrière. Nous avons analysé votre profil pour vous construire un
          parcours sur-mesure, simple et efficace.
        </p>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <div
            class="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-500"
          >
            <span class="material-icons-outlined text-sm text-gray-400"
              >calendar_today</span
            >
            Bilan du {{ formatDate(session.createdAt) }}
          </div>
          <div
            class="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-500"
          >
            <span class="material-icons-outlined text-sm text-[#22C55E]"
              >verified</span
            >
            Évaluation complétée
          </div>
        </div>
      </div>

      <!-- Strengths Section -->
      <section class="mb-16">
        <div class="flex items-center gap-3 mb-8">
          <span class="material-icons-outlined text-brand-primary"
            >auto_graph</span
          >
          <h2
            class="text-xl font-black text-[#0D1B3E] uppercase tracking-widest"
          >
            Vos points forts
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            class="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div class="flex items-start justify-between mb-6">
              <div
                class="w-10 h-10 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"
              >
                <span class="material-icons-outlined">menu_book</span>
              </div>
              <span
                class="px-3 py-1 bg-[#E1F9EB] text-[#22C55E] rounded-full text-[10px] font-black uppercase tracking-widest"
                >Déjà Acquis</span
              >
            </div>
            <h3 class="text-lg font-bold text-[#0D1B3E] mb-2">
              Bases Informatiques
            </h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Vous maîtrisez déjà les outils de base. C'est un excellent socle
              pour vous concentrer sur vos nouveaux apprentissages.
            </p>
          </div>

          <div
            v-if="session.stopLevel"
            class="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div class="flex items-start justify-between mb-6">
              <div
                class="w-10 h-10 bg-orange-600/10 text-orange-600 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all"
              >
                <span class="material-icons-outlined">translate</span>
              </div>
              <span
                class="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest"
                >Niveau {{ session.stopLevel }}</span
              >
            </div>
            <h3 class="text-lg font-bold text-[#0D1B3E] mb-2">
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
      <section class="mb-16">
        <div class="flex items-center gap-3 mb-8">
          <span class="material-icons-outlined text-brand-primary">map</span>
          <h2
            class="text-xl font-black text-[#0D1B3E] uppercase tracking-widest"
          >
            Votre Parcours Personnalisé
          </h2>
        </div>

        <div
          class="relative bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
        >
          <!-- Pack Header -->
          <div
            class="bg-brand-primary p-12 text-white relative overflow-hidden"
          >
            <div class="relative z-10">
              <span
                class="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
                >Offre Duo</span
              >
              <h3 class="text-4xl font-black mb-4">
                Parcours {{ session.formationChoisie }} : Immersion Totale
              </h3>
              <p class="opacity-80 text-lg max-w-xl">
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

          <div class="p-8 md:p-12 space-y-12">
            <!-- Step 1 in Path -->
            <div class="flex items-start gap-8 relative">
              <div
                class="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 font-black relative z-10"
              >
                1
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2"
                >
                  <h4 class="text-xl font-extrabold text-[#0D1B3E]">
                    {{ session.formationChoisie }} - Niveau
                    {{ session.stopLevel || "A2" }} (Intermédiaire)
                  </h4>
                </div>
                <p class="text-gray-400 mb-6 font-medium">
                  Renforcez vos bases et commencez à échanger avec fluidité dans
                  des situations quotidiennes.
                </p>
                <div class="flex items-center gap-6">
                  <div
                    class="flex items-center gap-2 text-xs font-bold text-gray-400"
                  >
                    <span class="material-icons-outlined text-sm"
                      >schedule</span
                    >
                    35h
                  </div>
                  <div
                    class="flex items-center gap-2 text-xs font-bold text-gray-400"
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
                class="absolute left-5 top-10 bottom-[-2.5rem] w-px bg-dashed border-l border-dashed border-gray-200"
              ></div>
            </div>

            <!-- Blue Plus -->
            <div class="ml-5 flex items-center justify-center">
              <div
                class="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30 relative z-10"
              >
                <span class="material-icons-outlined text-lg">add</span>
              </div>
            </div>

            <!-- Step 2 in Path -->
            <div class="flex items-start gap-8">
              <div
                class="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 font-black"
              >
                2
              </div>
              <div class="flex-1">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2"
                >
                  <h4 class="text-xl font-extrabold text-[#0D1B3E]">
                    {{ session.formationChoisie }} - Niveau B1 (Avancé)
                  </h4>
                </div>
                <p class="text-gray-400 mb-6 font-medium">
                  Maîtrisez le vocabulaire professionnel et devenez autonome
                  pour vos futures missions.
                </p>
                <div class="flex items-center gap-6">
                  <div
                    class="flex items-center gap-2 text-xs font-bold text-gray-400"
                  >
                    <span class="material-icons-outlined text-sm"
                      >schedule</span
                    >
                    40h
                  </div>
                  <div
                    class="flex items-center gap-2 text-xs font-bold text-gray-400"
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
              class="bg-[#F8FAFC] p-6 rounded-2xl flex items-center gap-4 text-[#0D1B3E] border border-blue-50"
            >
              <div
                class="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0"
              >
                <span class="material-icons-outlined">info</span>
              </div>
              <p class="text-sm font-bold">
                Ce parcours "Pack Duo" est entièrement finançable par votre CPF
                (Mon Compte Formation).
              </p>
            </div>
          </div>
        </div>

        <!-- Final CTA -->
        <div class="mt-16 text-center space-y-8">
          <p class="text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
            Ce parcours vous semble idéal ? Cliquez sur le bouton ci-dessous
            pour le valider. Un conseiller vous accompagnera pour les démarches
            administratives.
          </p>

          <button
            class="px-16 py-6 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-2xl shadow-brand-primary/30 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 mx-auto"
          >
            <span>Valider ce parcours de formation</span>
            <span class="material-icons-outlined text-xl">arrow_forward</span>
          </button>

          <p
            class="text-xs font-bold text-gray-300 uppercase tracking-widest italic"
          >
            C'est gratuit et sans engagement de votre part à ce stade.
          </p>
        </div>
      </section>

      <!-- Page Footer -->
      <footer class="mt-32 text-center text-gray-400">
        <div class="flex items-center justify-center gap-2 mb-4">
          <span class="material-icons-outlined text-brand-primary">school</span>
          <span class="font-black text-[#0D1B3E] tracking-tight"
            >Wizzy Learn</span
          >
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em]">
          © 2026 Wizzy Learn — Votre partenaire réussite.
        </p>
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
