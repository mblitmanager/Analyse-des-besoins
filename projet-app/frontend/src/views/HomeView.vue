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
      router.push("/prerequis");
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
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- Header / Logo Area -->
      <div class="bg-brand-primary p-8 text-center">
        <div
          class="bg-white/20 inline-block p-4 rounded-xl backdrop-blur-sm mb-4"
        >
          <h1 class="text-white text-3xl font-bold italic tracking-tighter">
            {{ store.brand === "aopia" ? "AOPIA" : "LIKE FORMATION" }}
          </h1>
        </div>
        <p class="text-white/80 text-sm">
          Analyse des besoins & Positionnement
        </p>
      </div>

      <!-- Form Area -->
      <div class="p-8">
        <h2 class="text-2xl font-semibold mb-6 text-gray-800">
          Votre Identification
        </h2>

        <div class="space-y-4">
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="form.civilite"
                value="M."
                class="text-brand-primary focus:ring-brand-primary"
              />
              <span>M.</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                v-model="form.civilite"
                value="Mme"
                class="text-brand-primary focus:ring-brand-primary"
              />
              <span>Mme</span>
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Nom *</label
            >
            <input
              v-model="form.nom"
              type="text"
              placeholder="Votre nom"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Prénom *</label
            >
            <input
              v-model="form.prenom"
              type="text"
              placeholder="Votre prénom"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Téléphone *</label
            >
            <input
              v-model="form.telephone"
              type="tel"
              placeholder="06 00 00 00 00"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Conseiller en formation</label
            >
            <input
              v-model="form.conseiller"
              type="text"
              placeholder="Nom de votre conseiller"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <button
            @click="startTest"
            :disabled="loading"
            class="w-full mt-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Démarrer le test</span>
            <svg
              v-if="!loading"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
            <span
              v-else
              class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
