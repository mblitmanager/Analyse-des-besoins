<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AppLogo from '../../components/AppLogo.vue';

const auth = useAuthStore();
const router = useRouter();
const isSidebarOpen = ref(false);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function logout() {
  auth.logout();
  router.push("/admin/login");
}

const navItems = [
  { label: "Dashboard", icon: "dashboard", route: "/admin/dashboard" },
  { label: "Sessions", icon: "assignment", route: "/admin/sessions" },
  { label: "Questions", icon: "quiz", route: "/admin/questions" },
  { label: "Formations", icon: "school", route: "/admin/formations" },
  { label: "Parcours", icon: "route", route: "/admin/parcours" },
  { label: "Règles Questions", icon: "rule", route: "/admin/question-rules" },
  { label: "Tests", icon: "checklist", route: "/admin/test-validation" },
  { label: "Administrateurs", icon: "group", route: "/admin/users" },
  { label: "Paramètres", icon: "settings", route: "/admin/settings" },
];
</script>

<template>
  <div class="flex min-h-screen font-outfit bg-slate-50">
    <!-- Backdrop for mobile -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      class="sidebar w-64 flex flex-col fixed inset-y-0 z-50 transition-transform duration-300 lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo Area -->
      <div class="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center">
            <AppLogo class="w-5 h-5" />
          </div>
          <span class="text-white font-black text-sm tracking-wide">WiziLearn</span>
        </div>
        <button @click="isSidebarOpen = false" class="lg:hidden text-white/40 hover:text-white transition-colors">
          <span class="material-icons-outlined text-sm">close</span>
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div class="px-3 mb-3">
          <p class="text-[9px] font-black text-white/30 uppercase tracking-widest">Navigation</p>
        </div>
        <router-link
          v-for="item in navItems"
          :key="item.route"
          :to="item.route"
          class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all"
          :class="
            $route.path === item.route
              ? 'nav-item-active'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          "
        >
          <span class="material-icons-outlined text-[20px]">{{ item.icon }}</span>
          <span class="tracking-wide">{{ item.label }}</span>
          <span v-if="$route.path === item.route" class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
        </router-link>
      </nav>

      <!-- User area -->
      <div class="p-4 border-t border-white/5">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
          <div class="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-xs shrink-0">
            {{ auth.user?.email?.[0]?.toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-xs font-black truncate">{{ auth.user?.email }}</p>
            <p class="text-white/30 text-[9px] font-bold uppercase tracking-widest">Administrateur</p>
          </div>
        </div>
        <button
          @click="logout"
          class="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-red-400 hover:bg-red-400/10 flex items-center justify-center gap-2"
        >
          <span class="material-icons-outlined text-sm">logout</span>
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 lg:ml-64 min-h-screen">
      <!-- Mobile top bar -->
      <header class="flex lg:hidden items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div class="flex items-center gap-3">
          <AppLogo class="w-7 h-7" />
          <span class="font-black text-xs uppercase tracking-widest text-slate-700">WiziLearn</span>
        </div>
        <button @click="isSidebarOpen = true" class="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-all">
          <span class="material-icons-outlined">menu</span>
        </button>
      </header>

      <div class="p-6 lg:p-8">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}

.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-right: 1px solid rgba(255,255,255,0.05);
}

.nav-item-active {
  background: rgba(235, 185, 115, 0.12);
  color: #ebb973;
  box-shadow: inset 3px 0 0 #ebb973;
}
</style>
