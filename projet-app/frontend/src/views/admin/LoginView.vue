<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AppLogo from '../../components/AppLogo.vue';

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
  <div class="min-h-screen flex font-outfit bg-white">
    <!-- Left Panel: Branding (Hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
      <!-- Abstract Background Elements -->
      <div class="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-primary/10 blur-[120px]"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]"></div>
      
      <div class="relative z-10 text-center p-12 max-w-lg">
        <div class="mb-10 flex justify-center">
          <div class="w-24 h-24 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
            <AppLogo class="w-14 h-14" />
          </div>
        </div>
        <h1 class="text-5xl font-black text-white mb-6 leading-tight">WiziLearn <span class="text-brand-primary">Admin</span></h1>
        <p class="text-slate-400 text-lg font-medium leading-relaxed">
          Gérez votre plateforme de formation avec une interface intuitive, puissante et hautement personnalisable.
        </p>
        
        <div class="mt-16 grid grid-cols-3 gap-6">
          <div class="text-center">
            <p class="text-white font-black text-2xl">100%</p>
            <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Sécurisé</p>
          </div>
          <div class="text-center">
            <p class="text-white font-black text-2xl">24/7</p>
            <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Monitoring</p>
          </div>
          <div class="text-center">
            <p class="text-white font-black text-2xl">Live</p>
            <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Analytics</p>
          </div>
        </div>
      </div>
      
      <!-- Footer Info -->
      <div class="absolute bottom-10 left-0 right-0 text-center">
        <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest">© 2024 WiziLearn • Propulsé par l'IA</p>
      </div>
    </div>

    <!-- Right Panel: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-slate-50 lg:bg-white">
      <div class="w-full max-w-md space-y-10 animate-fade-in">
        <!-- Mobile Logo (visible only on small screens) -->
        <div class="lg:hidden flex justify-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
            <AppLogo class="w-10 h-10" />
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-4xl font-black text-slate-900 tracking-tight">Connexion</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Espace d'administration Wizy-Learn</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-4 bg-red-50 text-red-500 rounded-2xl text-sm font-bold border border-red-100 animate-shake flex items-center gap-3">
            <span class="material-icons-outlined text-lg">error_outline</span>
            {{ error }}
          </div>

          <div class="space-y-2">
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email professionnel</label>
            <div class="group relative">
              <span class="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">mail</span>
              <input
                v-model="email"
                type="email"
                required
                placeholder="nom@wizylearn.fr"
                class="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-sm"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mot de passe</label>
              <a href="#" class="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline">Oublié ?</a>
            </div>
            <div class="group relative">
              <span class="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors">lock</span>
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-sm"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 transform active:scale-95 disabled:opacity-50"
            >
              <span v-if="!loading">Accéder au Dashboard</span>
              <div v-else class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"></div>
              <span v-if="!loading" class="material-icons-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </form>

        <div class="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button @click="router.push('/')" class="text-slate-400 hover:text-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span class="material-icons-outlined text-sm">west</span>
            Retour au site
          </button>
          <p class="text-[10px] font-bold text-slate-300">V. 2.4.0-PRO</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
