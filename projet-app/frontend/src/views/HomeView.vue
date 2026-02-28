<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';

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

onMounted(() => {
  // fetchConseillers supprimé car on utilise désormais un champ libre
});

async function startTest() {
  // conseiller is optional, only check the required fields
  if (!form.value.nom || !form.value.prenom || !form.value.telephone) {
    alert("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  loading.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
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
      // ensure workflow steps are loaded so dynamic routes exist
      await store.fetchWorkflow();
      const nextRoute = await store.getNextRouteWithQuestions("/");
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
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
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
  <div class="min-h-screen flex flex-col bg-[#F0F4F8] font-outfit">
    <SiteHeader />

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 md:py-14 flex items-center justify-center">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">Identification</h2>
          <p class="text-gray-400 text-sm font-bold uppercase tracking-widest">Veuillez renseigner vos informations pour accéder à notre test de positionnement.</p>
        </div>

        <div class="bg-white py-8 px-6 shadow-xl rounded-3xl border border-white">
          <div class="mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">Date de complétude</span>
            <span class="text-sm font-bold text-blue-900">{{ new Date().toLocaleDateString('fr-FR') }}</span>
          </div>

          <form @submit.prevent="startTest" class="space-y-6">
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div class="col-span-2">
                <span class="Wizi-label">Civilité</span>
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

              <div class="col-span-1">
                <label class="Wizi-label" for="last-name">Nom</label>
                <input v-model="form.nom" autocomplete="family-name" class="Wizi-input" id="last-name" name="last-name" placeholder="Nom" required type="text" />
              </div>
              <div class="col-span-1">
                <label class="Wizi-label" for="first-name">Prénom</label>
                <input v-model="form.prenom" autocomplete="given-name" class="Wizi-input" id="first-name" name="first-name" placeholder="Prénom" required type="text" />
              </div>
            </div>

            <div>
              <label class="Wizi-label" for="phone">Téléphone</label>
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="material-icons-outlined text-gray-400 text-[20px]">call</span>
                </div>
                <input v-model="form.telephone" autocomplete="tel" class="Wizi-input pl-10" id="phone" name="phone" placeholder="06 12 34 56 78" required type="tel" />
              </div>
            </div>

            <div>
              <label class="Wizi-label" for="conseiller">Conseiller commercial (facultatif)</label>
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="material-icons-outlined text-gray-400 text-[20px]">person</span>
                </div>
                <!-- field is optional, user may leave blank -->
                <input v-model="form.conseiller" class="Wizi-input pl-10" id="conseiller" name="conseiller" placeholder="Nom de votre conseiller" type="text" />
              </div>
            </div>

            <div class="pt-4">
              <button type="submit" :disabled="loading" class="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black uppercase tracking-widest text-[#428496] bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <span>Démarrer le parcours</span>
                <span class="material-icons-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>

          <div class="mt-6">
            <div class="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
              <span class="material-icons-outlined text-sm">lock</span>
              Sécurisé et confidentiel
            </div>
          </div>
        </div>
      </div>
    </main>

    <SiteFooter />

    <!-- decorative blobs -->
    <div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-50 opacity-50 blur-2xl"></div>
    </div>
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
