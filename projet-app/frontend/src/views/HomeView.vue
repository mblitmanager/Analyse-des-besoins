<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();

const form = ref({
  civilite: "M.",
  nom: "",
  prenom: "",
  telephone: "",
  conseiller: "",
});

const loading = ref(false);

const conseillers = [
  "Sélectionnez votre conseiller...",
  "Jean Dupont",
  "Marie Curie",
  "Albert Einstein",
];

async function startTest() {
  if (!form.value.nom || !form.value.prenom || !form.value.telephone) {
    alert("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  loading.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${apiBaseUrl}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form.value,
        brand: store.brand,
      }),
    });
    const session = await response.json();
    if (session.id) {
      localStorage.setItem("session_id", session.id);
      const nextRoute = store.getNextRoute("/");
      router.push(nextRoute || "/prerequis");
    } else {
      throw new Error("Session ID missing from response");
    }
  } catch (error) {
    console.error("Failed to create session:", error);
    alert("Erreur lors de l’initialisation de la session.");
  } finally {
    loading.value = false;
  }
}

const testingDb = ref(false);

async function testDbConnection() {
  testingDb.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${apiBaseUrl}/health/db`);
    const data = await response.json();
    if (data.status === "ok") {
      alert("✅ " + data.message);
    } else {
      alert("❌ " + data.message + (data.error ? ": " + data.error : ""));
    }
  } catch (error) {
    console.error("Health check failed:", error);
    alert(
      "❌ Erreur lors du test de connexion. Vérifiez que le backend est lancé.",
    );
  } finally {
    testingDb.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit">
    <!-- Header -->
    <header
      class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-brand-primary/20"
        >
          W
        </div>
        <span class="font-bold text-gray-800 text-xl tracking-tight"
          >Wizzy Learn</span
        >
      </div>

      <!-- Brand Logos Container -->
      <div class="flex items-center gap-8">
        <div
          v-if="store.isDirectLink || store.brand === 'aopia'"
          class="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <div class="w-2 h-2 rounded-full bg-blue-600"></div>
          <span
            class="text-xs font-black uppercase tracking-widest text-slate-400"
            >Aopia</span
          >
        </div>
        <div
          v-if="store.isDirectLink || store.brand === 'like'"
          class="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <div class="w-2 h-2 rounded-full bg-red-500"></div>
          <span
            class="text-xs font-black uppercase tracking-widest text-slate-400"
            >Like</span
          >
        </div>
        <div
          v-if="store.isDirectLink || store.brand === 'nsconseil'"
          class="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <span
            class="text-xs font-black uppercase tracking-widest text-slate-400"
            >NS Conseil</span
          >
        </div>
      </div>

      <div
        class="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100"
      >
        <span class="material-icons-outlined text-gray-400"
          >account_circle</span
        >
        <span class="text-sm font-bold text-gray-500">Invité</span>
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center p-4 py-12">
      <div class="max-w-2xl w-full">
        <!-- Progress Info -->
        <div class="flex items-center justify-between mb-6 px-2">
          <span
            class="text-xs font-bold text-brand-primary uppercase tracking-widest"
            >Étape {{ store.getProgress("/").current }} sur
            {{ store.getProgress("/").total }}</span
          >
          <span
            class="text-xs font-bold text-gray-400 uppercase tracking-widest"
            >{{ store.getProgress("/").label }}</span
          >
        </div>
        <div
          class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-16"
        >
          <div
            class="h-full bg-brand-primary transition-all duration-500"
            :style="{ width: store.getProgress('/').percentage + '%' }"
          ></div>
        </div>

        <div
          class="bg-white rounded-2xl shadow-md border border-gray-100 p-10 md:p-14 relative"
        >
          <h1 class="text-3xl md:text-4xl font-extrabold text-[#0D1B3E] mb-3">
            Identification du bénéficiaire
          </h1>
          <p class="text-gray-400 text-base md:text-lg mb-10">
            Veuillez renseigner vos informations pour commencer le test de
            positionnement.
          </p>

          <div class="space-y-6">
            <!-- Civilité -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-gray-800"
                >Civilité</label
              >
              <div class="flex gap-3">
                <button
                  @click="form.civilite = 'M.'"
                  class="flex-1 py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm"
                  :class="
                    form.civilite === 'M.'
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-50 bg-[#F8FAFC] text-gray-500 hover:border-gray-200'
                  "
                >
                  <span>M.</span>
                  <div
                    v-if="form.civilite === 'M.'"
                    class="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white"
                  >
                    <span class="material-icons-outlined text-xs">check</span>
                  </div>
                </button>
                <button
                  @click="form.civilite = 'Mme'"
                  class="flex-1 py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm"
                  :class="
                    form.civilite === 'Mme'
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-gray-50 bg-[#F8FAFC] text-gray-500 hover:border-gray-200'
                  "
                >
                  <span>Mme</span>
                  <div
                    v-if="form.civilite === 'Mme'"
                    class="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white"
                  >
                    <span class="material-icons-outlined text-xs">check</span>
                  </div>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nom -->
              <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-800">Nom</label>
                <input
                  v-model="form.nom"
                  type="text"
                  placeholder="Votre nom"
                  class="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-50 rounded-2xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 text-sm"
                />
              </div>
              <!-- Prénom -->
              <div class="space-y-2">
                <label class="block text-sm font-bold text-gray-800"
                  >Prénom</label
                >
                <input
                  v-model="form.prenom"
                  type="text"
                  placeholder="Votre prénom"
                  class="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-50 rounded-2xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 text-sm"
                />
              </div>
            </div>

            <!-- Téléphone -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-gray-800"
                >Téléphone</label
              >
              <div class="relative group">
                <span
                  class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors text-xl"
                  >phone</span
                >
                <input
                  v-model="form.telephone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  class="w-full pl-14 pr-4 py-3 bg-[#F8FAFC] border border-gray-50 rounded-2xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 text-sm"
                />
              </div>
            </div>

            <!-- Conseiller -->
            <div class="space-y-2">
              <label class="block text-sm font-bold text-gray-800"
                >Conseiller en formation</label
              >
              <div class="relative group">
                <span
                  class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-primary transition-colors text-xl"
                  >badge</span
                >
                <select
                  v-model="form.conseiller"
                  class="w-full pl-14 pr-10 py-3 bg-[#F8FAFC] border border-gray-50 rounded-2xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-medium text-gray-700 appearance-none cursor-pointer text-sm"
                >
                  <option
                    v-for="c in conseillers"
                    :key="c"
                    :value="c === 'Sélectionnez votre conseiller...' ? '' : c"
                  >
                    {{ c }}
                  </option>
                </select>
                <span
                  class="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none text-xl"
                  >expand_more</span
                >
              </div>
            </div>

            <div class="pt-6">
              <button
                @click="startTest"
                :disabled="loading"
                class="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-base"
              >
                <span>Démarrer le test</span>
                <span v-if="!loading" class="material-icons-outlined text-2xl"
                  >arrow_forward</span
                >
                <div
                  v-else
                  class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
                ></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer
          class="mt-12 text-center text-xs text-gray-400 font-bold uppercase tracking-widest pb-8"
        >
          Wizzy Learn © 2024. Tous droits réservés. <br />
          Besoin d'aide ?
          <a href="#" class="text-brand-primary hover:underline"
            >Contactez le support</a
          >.
        </footer>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
