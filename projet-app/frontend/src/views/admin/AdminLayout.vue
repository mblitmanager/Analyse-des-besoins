<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AppLogo from '../../components/AppLogo.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const isSidebarOpen = ref(false);   // mobile drawer
const isCollapsed = ref(false);     // desktop collapsed mode
const isUserMenuOpen = ref(false);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function logout() {
  auth.logout();
  router.push("/admin/login");
}

// Navigation groupée
const navGroups = [
  {
    label: "Aperçu",
    items: [
      { label: "Dashboard", icon: "dashboard", route: "/admin/dashboard" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { label: "Sessions", icon: "assignment", route: "/admin/sessions" },
      { label: "Conseillers", icon: "contacts", route: "/admin/contacts" },
      { label: "Administrateurs", icon: "manage_accounts", route: "/admin/users" },
    ],
  },
  {
    label: "Contenu",
    items: [
      { label: "Formations", icon: "school", route: "/admin/formations" },
      { label: "Questions", icon: "quiz", route: "/admin/questions" },
      { label: "Parcours", icon: "route", route: "/admin/parcours" },
    ],
  },
  {
    label: "Règles",
    items: [
      { label: "Règles Questions", icon: "rule", route: "/admin/question-rules" },
      { label: "Règles P3", icon: "filter_alt", route: "/admin/p3-rules" },
      { label: "P3 Override", icon: "swap_horiz", route: "/admin/p3-override" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Templates Email", icon: "drafts", route: "/admin/email-templates" },
      { label: "Config. Email", icon: "mail_outline", route: "/admin/mail-config" },
    ],
  },
  {
    label: "Système",
    items: [
      { label: "Tests", icon: "checklist", route: "/admin/test-validation" },
      { label: "Paramètres", icon: "settings", route: "/admin/settings" },
    ],
  },
];

// Breadcrumb dynamique
const currentNavItem = computed(() => {
  for (const group of navGroups) {
    const found = group.items.find(i => i.route === route.path);
    if (found) return { group: group.label, item: found };
  }
  return null;
});
</script>

<template>
  <div class="admin-root">
    <!-- ===== MOBILE BACKDROP ===== -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="mobile-backdrop"
    ></div>

    <!-- ===== SIDEBAR ===== -->
    <aside
      class="sidebar"
      :class="{
        'sidebar--open': isSidebarOpen,
        'sidebar--collapsed': isCollapsed,
      }"
    >
      <!-- Logo / Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo">
          <AppLogo class="logo-svg" />
        </div>
        <transition name="fade-label">
          <span v-if="!isCollapsed" class="brand-name">WiziLearn</span>
        </transition>
        <button @click="isSidebarOpen = false" class="sidebar-close-btn">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div
          v-for="group in navGroups"
          :key="group.label"
          class="nav-group"
        >
          <!-- Group label -->
          <transition name="fade-label">
            <p v-if="!isCollapsed" class="nav-group-label">{{ group.label }}</p>
          </transition>
          <div v-if="isCollapsed" class="nav-group-divider"></div>

          <!-- Nav items -->
          <router-link
            v-for="item in group.items"
            :key="item.route"
            :to="item.route"
            class="nav-item"
            :class="{ 'nav-item--active': route.path === item.route }"
            :title="isCollapsed ? item.label : undefined"
            @click="isSidebarOpen = false"
          >
            <span class="material-icons-outlined nav-item-icon">{{ item.icon }}</span>
            <transition name="fade-label">
              <span v-if="!isCollapsed" class="nav-item-label">{{ item.label }}</span>
            </transition>
            <span v-if="!isCollapsed && route.path === item.route" class="nav-item-dot"></span>
          </router-link>
        </div>
      </nav>

      <!-- User zone -->
      <div class="sidebar-user">
        <div class="user-card" :class="{ 'user-card--collapsed': isCollapsed }">
          <div class="user-avatar">
            {{ auth.user?.email?.[0]?.toUpperCase() ?? 'A' }}
          </div>
          <transition name="fade-label">
            <div v-if="!isCollapsed" class="user-info">
              <p class="user-email">{{ auth.user?.email }}</p>
              <p class="user-role">Administrateur</p>
            </div>
          </transition>
        </div>
        <button
          @click="logout"
          class="logout-btn"
          :class="{ 'logout-btn--collapsed': isCollapsed }"
          :title="isCollapsed ? 'Déconnexion' : undefined"
        >
          <span class="material-icons-outlined">logout</span>
          <transition name="fade-label">
            <span v-if="!isCollapsed">Déconnexion</span>
          </transition>
        </button>
      </div>

      <!-- Collapse toggle (desktop only) -->
      <button class="collapse-btn" @click="toggleCollapse" title="Réduire la sidebar">
        <span class="material-icons-outlined collapse-icon" :class="{ 'collapse-icon--rotated': isCollapsed }">
          chevron_left
        </span>
      </button>
    </aside>

    <!-- ===== MAIN CONTENT ===== -->
    <main class="main-content" :class="{ 'main-content--collapsed': isCollapsed }">

      <!-- TOP BAR -->
      <header class="topbar">
        <!-- Left: mobile hamburger + breadcrumb -->
        <div class="topbar-left">
          <button class="hamburger-btn" @click="toggleSidebar">
            <span class="material-icons-outlined">menu</span>
          </button>

          <!-- Breadcrumb -->
          <nav class="breadcrumb" v-if="currentNavItem">
            <span class="breadcrumb-group">{{ currentNavItem.group }}</span>
            <span class="material-icons-outlined breadcrumb-sep">chevron_right</span>
            <span class="breadcrumb-page">{{ currentNavItem.item.label }}</span>
          </nav>
          <div v-else class="breadcrumb">
            <span class="breadcrumb-page">Administration</span>
          </div>
        </div>

        <!-- Right: status + user -->
        <div class="topbar-right">
          <!-- System status -->
          <div class="system-status">
            <span class="status-dot"></span>
            <span class="status-label">Système actif</span>
          </div>

          <!-- User menu -->
          <div class="user-menu-wrapper">
            <button class="user-menu-btn" @click="isUserMenuOpen = !isUserMenuOpen">
              <div class="user-menu-avatar">
                {{ auth.user?.email?.[0]?.toUpperCase() ?? 'A' }}
              </div>
              <span class="material-icons-outlined user-menu-chevron">expand_more</span>
            </button>
            <transition name="dropdown">
              <div v-if="isUserMenuOpen" class="user-dropdown" v-click-outside="() => isUserMenuOpen = false">
                <div class="user-dropdown-header">
                  <p class="dropdown-email">{{ auth.user?.email }}</p>
                  <p class="dropdown-role">Administrateur</p>
                </div>
                <div class="user-dropdown-divider"></div>
                <button class="dropdown-item dropdown-item--danger" @click="logout">
                  <span class="material-icons-outlined">logout</span>
                  Déconnexion
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <!-- PAGE CONTENT -->
      <div class="page-body">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ============================================================
   ROOT
   ============================================================ */
.admin-root {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: "Outfit", sans-serif;
}

/* ============================================================
   MOBILE BACKDROP
   ============================================================ */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 40;
}

/* ============================================================
   SIDEBAR
   ============================================================ */
.sidebar {
  position: fixed;
  inset-y: 0;
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: 256px;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* Mobile: hidden by default */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar--open {
    transform: translateX(0);
  }
}

/* Desktop collapsed */
@media (min-width: 1024px) {
  .sidebar--collapsed {
    width: 72px;
  }
}

/* ---- Brand ---- */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 72px;
  position: relative;
}

.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(235, 185, 115, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-svg {
  width: 20px;
  height: 20px;
}

.brand-name {
  font-size: 14px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.sidebar-close-btn {
  display: none;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.15s;
}
.sidebar-close-btn:hover { color: #fff; }

@media (max-width: 1023px) {
  .sidebar-close-btn { display: flex; }
}

/* ---- Nav ---- */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-label {
  font-size: 9px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 12px 12px 4px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-group-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 8px 8px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  position: relative;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
}

.nav-item--active {
  background: rgba(235, 185, 115, 0.12);
  color: #ebb973;
  box-shadow: inset 3px 0 0 #ebb973;
}

.nav-item-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.nav-item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ebb973;
  flex-shrink: 0;
}

/* ---- User zone ---- */
.sidebar-user {
  padding: 12px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 6px;
  overflow: hidden;
}

.user-card--collapsed {
  justify-content: center;
  padding: 10px 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(235, 185, 115, 0.2);
  color: #ebb973;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-email {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #f87171;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.logout-btn:hover {
  background: rgba(248, 113, 113, 0.1);
}

.logout-btn--collapsed {
  padding: 8px;
  width: auto;
  margin: 0 auto;
}

/* ---- Collapse button (desktop) ---- */
.collapse-btn {
  display: none;
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #1e293b;
  border: 2px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  z-index: 10;
}

.collapse-btn:hover {
  background: #334155;
  color: #fff;
}

.collapse-icon {
  font-size: 16px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-icon--rotated {
  transform: rotate(180deg);
}

@media (min-width: 1024px) {
  .collapse-btn {
    display: flex;
  }
}

/* ============================================================
   MAIN CONTENT
   ============================================================ */
.main-content {
  flex: 1;
  margin-left: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 1024px) {
  .main-content {
    margin-left: 256px;
  }
  .main-content--collapsed {
    margin-left: 72px;
  }
}

/* ============================================================
   TOP BAR
   ============================================================ */
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.hamburger-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

@media (min-width: 1024px) {
  .hamburger-btn { display: none; }
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-group {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.breadcrumb-sep {
  font-size: 16px;
  color: #cbd5e1;
}

.breadcrumb-page {
  font-size: 13px;
  font-weight: 900;
  color: #0f172a;
}

/* Right zone */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* System status */
.system-status {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

@media (min-width: 640px) {
  .system-status { display: flex; }
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.08); }
}

.status-label {
  font-size: 10px;
  font-weight: 800;
  color: #16a34a;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* User menu */
.user-menu-wrapper {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 4px;
  border-radius: 50px;
  background: #fff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.user-menu-btn:hover {
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.user-menu-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ebb973, #f59e0b);
  color: #7c3700;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-menu-chevron {
  font-size: 18px;
  color: #94a3b8;
  padding-right: 4px;
}

/* Dropdown */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
  overflow: hidden;
  z-index: 100;
}

.user-dropdown-header {
  padding: 14px 16px;
}

.dropdown-email {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-role {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: 2px;
}

.user-dropdown-divider {
  height: 1px;
  background: #f1f5f9;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  transition: background 0.15s;
  text-align: left;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item--danger {
  color: #ef4444;
}

.dropdown-item--danger:hover {
  background: #fef2f2;
}

/* ============================================================
   PAGE BODY
   ============================================================ */
.page-body {
  flex: 1;
  padding: 32px;
}

@media (max-width: 767px) {
  .page-body { padding: 16px; }
}

/* ============================================================
   TRANSITIONS
   ============================================================ */
.fade-label-enter-active,
.fade-label-leave-active {
  transition: opacity 0.2s ease, width 0.3s ease;
  overflow: hidden;
}
.fade-label-enter-from,
.fade-label-leave-to {
  opacity: 0;
  width: 0;
}

.dropdown-enter-active {
  animation: dropdown-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dropdown-leave-active {
  animation: dropdown-in 0.12s ease reverse;
}

@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
