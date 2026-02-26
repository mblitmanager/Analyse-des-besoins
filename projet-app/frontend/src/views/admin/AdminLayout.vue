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
  // { label: "Conseillers", icon: "badge", route: "/admin/contacts" },
  { label: "Formations", icon: "school", route: "/admin/formations" },
  { label: "Administrateurs", icon: "group", route: "/admin/users" },
  { label: "Paramètres", icon: "settings", route: "/admin/settings" },
];
</script>

<template>
  <div class="flex min-h-screen font-outfit">
    <!-- Backdrop for mobile -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      class="w-72 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 shadow-lg shadow-blue-900/5 transition-transform duration-300 z-50 lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="p-8">
        <div class="flex items-center justify-between mb-10">
          <div class="flex items-center gap-3">
            <AppLogo class="w-10 h-10" />
          </div>
          <button @click="isSidebarOpen = false" class="lg:hidden text-gray-400 hover:text-gray-600">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <nav class="space-y-2">
          <router-link
            v-for="item in navItems"
            :key="item.route"
            :to="item.route"
            class="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all group"
            :class="
              $route.path === item.route
                ? 'bg-brand-primary text-[#428496] shadow-lg shadow-brand-primary/30'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            "
          >
            <span class="material-icons-outlined">{{ item.icon }}</span>
            <span class="text-sm tracking-wide">{{ item.label }}</span>
          </router-link>
        </nav>
      </div>

      <div class="mt-auto p-8">
        <div class="bg-gray-50 rounded-3xl p-6 mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
            >
              <span class="material-icons-outlined text-blue-600">person</span>
            </div>
              <div>
              <p
                class="text-xs font-black heading-primary truncate max-w-[120px]"
              >
                {{ auth.user?.email }}
              </p>
              <p
                class="text-[8px] font-black text-gray-400 uppercase tracking-widest"
              >
                Administrator
              </p>
            </div>
          </div>
          <button
            @click="logout"
            class="w-full py-3 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 lg:ml-72 p-6 lg:p-10 min-h-screen">
      <!-- Top header for mobile -->
      <header class="flex lg:hidden items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-4 z-30">
        <div class="flex items-center gap-3">
          <AppLogo class="w-8 h-8" />
          <span class="font-black text-xs uppercase tracking-widest text-[#428496]">WiziLearn</span>
        </div>
        <button @click="isSidebarOpen = true" class="p-2 bg-gray-50 rounded-xl text-gray-500 hover:bg-brand-primary hover:text-[#428496] transition-all">
          <span class="material-icons-outlined">menu</span>
        </button>
      </header>

      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
