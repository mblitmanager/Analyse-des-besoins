<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    await auth.login(email.value, password.value);
    router.push("/admin/dashboard");
  } catch (err) {
    error.value = "Identifiants invalides ou erreur serveur.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-6 font-outfit"
  >
    <div
      class="w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 p-10 space-y-8 animate-fade-in"
    >
      <div class="text-center space-y-2">
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/30"
          >
            <span class="material-icons-outlined text-white text-3xl"
              >admin_panel_settings</span
            >
          </div>
        </div>
        <h1 class="text-3xl font-black heading-primary">Administration</h1>
        <p
          class="text-gray-400 font-bold uppercase tracking-widest text-[10px]"
        >
          Accès réservé au personnel autorisé
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div
          v-if="error"
          class="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-bold border border-red-100 animate-shake"
        >
          {{ error }}
        </div>

        <div class="space-y-2">
          <label
            class="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1"
            >Email professionnel</label
          >
          <div class="relative">
            <span
              class="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
              >mail</span
            >
            <input
              v-model="email"
              type="email"
              required
              placeholder="admin@wizy-learn.com"
              class="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-gray-700 shadow-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label
            class="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1"
            >Mot de passe</label
          >
          <div class="relative">
            <span
              class="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
              >lock</span
            >
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-gray-700 shadow-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-5 btn-primary hover:brightness-95 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-95 disabled:opacity-50"
        >
          <span v-if="!loading">Connexion sécurisée</span>
          <div
            v-else
            class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
          ></div>
          <span v-if="!loading" class="material-icons-outlined">login</span>
        </button>
      </form>

      <div class="text-center">
        <button
          @click="router.push('/')"
          class="text-gray-400 hover:text-brand-primary transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
        >
          <span class="material-icons-outlined text-sm">arrow_back</span>
          Retour au site
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");
@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Outlined");

.font-outfit {
  font-family: "Outfit", sans-serif;
}

.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
