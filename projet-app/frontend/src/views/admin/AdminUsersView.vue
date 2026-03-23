<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";

const users = ref([]);
const loading = ref(true);
const showAddModal = ref(false);
const searchTerm = ref("");
const filterRole = ref("");
const page = ref(1);
const pageSize = ref(10);
const newUser = ref({ email: "", password: "" });
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = localStorage.getItem("admin_token");

const uniqueRoles = computed(() => {
  const set = new Set();
  for (const u of users.value || []) if (u?.role) set.add(u.role);
  return Array.from(set).sort();
});

const filteredUsers = computed(() => {
  if (!users.value) return [];
  const q = (searchTerm.value || "").toLowerCase().trim();
  return users.value.filter((u) => {
    if (filterRole.value && u.role !== filterRole.value) return false;
    if (!q) return true;
    return (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)));
const paginatedUsers = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const current = page.value;
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
});

watch([searchTerm, filterRole, pageSize], () => (page.value = 1));

async function fetchUsers() {
  try {
    const response = await axios.get(`${apiBaseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    users.value = response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  try {
    await axios.post(`${apiBaseUrl}/admin/users`, newUser.value, {
      headers: { Authorization: `Bearer ${token}` },
    });
    showAddModal.value = false;
    newUser.value = { email: "", password: "" };
    fetchUsers();
  } catch (error) {
    alert("Erreur lors de la création.");
  }
}

async function deleteUser(id) {
  if (!confirm("Supprimer définitivement cet accès administrateur ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  } catch (error) {
    alert("Erreur lors de la suppression.");
  }
}

const getInitials = (email) => {
  if (!email) return '??';
  return email.split('@')[0].substring(0, 2).toUpperCase();
};

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Accès Administratifs</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Contrôle de sécurité et gestion des privilèges plateforme
        </p>
      </div>
      <button
        @click="showAddModal = true"
        class="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 transform active:scale-95"
      >
        <span class="material-icons-outlined text-sm">person_add</span>
        Nouvel Accès
      </button>
    </div>

    <!-- Stats Row (Optional Refinement) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
             <span class="material-icons-outlined">people</span>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Admins</p>
            <p class="text-xl font-black text-slate-900">{{ users.length }}</p>
          </div>
       </div>
       <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
             <span class="material-icons-outlined">verified_user</span>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Administrateurs</p>
            <p class="text-xl font-black text-slate-900">{{ users.filter(u => u.role === 'admin').length }}</p>
          </div>
       </div>
       <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
             <span class="material-icons-outlined">shield</span>
          </div>
          <div>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Dernier Ajout</p>
            <p class="text-sm font-black text-slate-900">{{ users.length ? new Date(Math.max(...users.map(u => new Date(u.createdAt)))).toLocaleDateString('fr-FR') : '--' }}</p>
          </div>
       </div>
    </div>

    <!-- Main List View -->
    <div class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <!-- Toolbar -->
      <div class="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1 max-w-xl">
          <div class="relative flex-1 group">
            <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors text-sm">search</span>
            <input v-model="searchTerm" type="search" placeholder="Rechercher par email..." class="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all" />
          </div>
          <select v-model="filterRole" class="px-4 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all appearance-none cursor-pointer">
            <option value="">Tous rôles</option>
            <option v-for="r in uniqueRoles" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vue</label>
          <select v-model.number="pageSize" class="px-4 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-black outline-none focus:bg-white transition-all appearance-none cursor-pointer">
            <option :value="5">05</option>
            <option :value="10">10</option>
            <option :value="25">25</option>
          </select>
        </div>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/30 border-b border-slate-50">
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Niveau d'accès</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Création</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading"><td colspan="4" class="py-20 text-center"><div class="inline-block w-8 h-8 rounded-full border-2 border-slate-100 border-t-brand-primary animate-spin"></div></td></tr>
            <tr v-else-if="filteredUsers.length === 0"><td colspan="4" class="py-20 text-center"><p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun administrateur trouvé</p></td></tr>
            <tr v-for="user in paginatedUsers" :key="user.id" class="group hover:bg-slate-50/50 transition-all">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px] shadow-lg group-hover:scale-110 transition-transform">
                    {{ getInitials(user.email) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs font-black text-slate-900 tracking-tight">{{ user.email }}</span>
                    <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">ID: {{ user.id }}</span>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-inner border border-blue-100/50">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-tighter">{{ new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }}</span>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center justify-end">
                   <button @click="deleteUser(user.id)" class="w-10 h-10 rounded-2xl border border-slate-100 text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center shrink-0">
                     <span class="material-icons-outlined text-sm">delete_outline</span>
                   </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredUsers.length > 0" class="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-auto">
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
           {{ (page - 1) * pageSize + 1 }} - {{ Math.min(filteredUsers.length, page * pageSize) }} <span class="mx-2 opacity-30">|</span> Total {{ filteredUsers.length }}
        </div>
        
        <div class="flex items-center gap-1.5">
          <button @click="page--" :disabled="page === 1" class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm disabled:opacity-30 transition-all"><span class="material-icons-outlined text-sm">chevron_left</span></button>
          <div class="flex items-center gap-1 mx-1">
             <template v-for="p in pageNumbers" :key="p">
               <button v-if="p !== '...'" @click="page = p" class="w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all" :class="page === p ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'">{{ p }}</button>
               <span v-else class="w-10 text-center text-slate-300 font-black">•••</span>
             </template>
          </div>
          <button @click="page++" :disabled="page === totalPages" class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm disabled:opacity-30 transition-all"><span class="material-icons-outlined text-sm">chevron_right</span></button>
        </div>
      </div>
    </div>

    <!-- Modals (Secured Refinement) -->
    <div v-if="showAddModal" class="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" @click="showAddModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative overflow-hidden animate-scale-up">
        
        <div class="px-10 py-10 text-center space-y-2 border-b border-slate-50">
           <div class="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 mb-4">
              <span class="material-icons-outlined text-2xl">admin_panel_settings</span>
           </div>
           <h3 class="text-2xl font-black text-slate-900 tracking-tight">Nouveaux Identifiants</h3>
           <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest">Création d'un accès administrateur plateforme</p>
        </div>

        <div class="p-10">
          <form @submit.prevent="createUser" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Professionnel</label>
              <input v-model="newUser.email" type="email" required placeholder="contact@mbl-expertise.com" class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mot de passe temporaire</label>
              <input v-model="newUser.password" type="password" required placeholder="••••••••" class="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
            </div>

            <div class="flex gap-4 pt-4">
              <button type="button" @click="showAddModal = false" class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Annuler</button>
              <button type="submit" class="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all transform active:scale-95">Valider l'Accès</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
select { background-image: none; }
</style>
