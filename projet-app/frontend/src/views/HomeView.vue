<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import AppLogo from '../components/AppLogo.vue';

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

const conseillers = ref(["Sélectionnez votre conseiller..."]);

async function fetchConseillers() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${apiBaseUrl}/contacts`);
    const data = await response.json();

    // Filter active contacts and extract names
    const activeNames = data
      .filter((c) => c.isActive !== false)
      .map((c) => `${c.prenom} ${c.nom}`);

    conseillers.value = ["Sélectionnez votre conseiller...", ...activeNames];
  } catch (error) {
    console.error("Failed to fetch conseillers:", error);
  }
}

onMounted(() => {
  fetchConseillers();
});

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
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex-shrink-0 flex items-center">
          <div class="h-8 w-auto flex items-center space-x-2">
            <div class="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-blue-400 font-bold text-lg">W</div>
            <AppLogo />
          </div>
        </div>

        <div class="flex items-center">
          <p class="text-sm text-gray-500 hidden sm:block">
            Besoin d'aide ?
            <a class="text-blue-600 hover:text-blue-500 font-medium" href="#">
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </header>

    <main class="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="mt-2 text-3xl font-extrabold text-gray-900">Identification</h2>
          <p class="mt-2 text-sm text-gray-600">Veuillez renseigner vos informations pour accéder à votre test de positionnement.</p>
        </div>

        <div class="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-100">
          <form @submit.prevent="startTest" class="space-y-6">
            <div>
              <span class="wizzy-label">Civilité</span>
              <div class="mt-2 flex space-x-6">
                <div class="flex items-center">
                  <input v-model="form.civilite" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" id="monsieur" name="civilite" type="radio" value="M." />
                  <label class="ml-3 block text-sm font-medium text-gray-700" for="monsieur">Monsieur</label>
                </div>
                <div class="flex items-center">
                  <input v-model="form.civilite" class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" id="madame" name="civilite" type="radio" value="Mme" />
                  <label class="ml-3 block text-sm font-medium text-gray-700" for="madame">Madame</label>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div class="col-span-1">
                <label class="wizzy-label" for="last-name">Nom</label>
                <input v-model="form.nom" autocomplete="family-name" class="wizzy-input" id="last-name" name="last-name" placeholder="Dupont" required type="text" />
              </div>
              <div class="col-span-1">
                <label class="wizzy-label" for="first-name">Prénom</label>
                <input v-model="form.prenom" autocomplete="given-name" class="wizzy-input" id="first-name" name="first-name" placeholder="Jean" required type="text" />
              </div>
            </div>

            <div>
              <label class="wizzy-label" for="phone">Téléphone</label>
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="material-icons-outlined text-gray-400 text-[20px]">call</span>
                </div>
                <input v-model="form.telephone" autocomplete="tel" class="wizzy-input pl-10" id="phone" name="phone" placeholder="06 12 34 56 78" required type="tel" />
              </div>
            </div>

            <div>
              <label class="wizzy-label" for="conseiller">Conseiller en formation</label>
              <select v-model="form.conseiller" class="wizzy-input bg-white" id="conseiller" name="conseiller">
                <option disabled value="">Sélectionnez votre conseiller</option>
                <option v-for="c in conseillers" :key="c" :value="c === 'Sélectionnez votre conseiller...' ? '' : c">{{ c }}</option>
              </select>
            </div>

            <div class="pt-4">
              <button type="submit" :disabled="loading" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out">
                Démarrer le test
                <span class="material-icons-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Sécurisé et confidentiel</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-3 pt-4 text-xs text-gray-400">
          <AppLogo />
          <div
            class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-bold uppercase tracking-widest"
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
        </div>
      </div>
    </main>

    <!-- decorative blobs -->
    <div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-50 opacity-50 blur-2xl"></div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
