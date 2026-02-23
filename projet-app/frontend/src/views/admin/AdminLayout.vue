<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push("/admin/login");
}

const navItems = [
  { label: "Dashboard", icon: "dashboard", route: "/admin/dashboard" },
  { label: "Sessions", icon: "assignment", route: "/admin/sessions" },
  { label: "Questions", icon: "quiz", route: "/admin/questions" },
  { label: "Conseillers", icon: "badge", route: "/admin/contacts" },
  { label: "Formations", icon: "school", route: "/admin/formations" },
  { label: "Administrateurs", icon: "group", route: "/admin/users" },
  { label: "Paramètres", icon: "settings", route: "/admin/settings" },
];
</script>

<template>
  <div class="flex min-h-screen font-outfit">
    <!-- Sidebar -->
    <aside
      class="w-72 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 shadow-lg shadow-blue-900/5"
    >
      <div class="p-8">
        <div class="flex items-center gap-3 mb-10">
          <div
            class="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20"
          >
            <span class="material-icons-outlined text-blue-500 text-xl">bolt</span>
          </div>
          <div>
            <h1 class="text-xl font-black heading-primary">
              WIZY<span class="text-brand-primary">ADMIN</span>
            </h1>
            <p
              class="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]"
            >
              Management System
            </p>
          </div>
        </div>

        <nav class="space-y-2">
          <router-link
            v-for="item in navItems"
            :key="item.route"
            :to="item.route"
            class="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all group"
            :class="
              $route.path === item.route
                ? 'bg-brand-primary text-blue-500 shadow-lg shadow-brand-primary/30'
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
    <main class="flex-1 ml-72 p-10">
      <router-view></router-view>
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
