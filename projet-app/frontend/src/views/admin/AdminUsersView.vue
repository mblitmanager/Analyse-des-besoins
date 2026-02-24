<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const users = ref([]);
const loading = ref(true);
const showAddModal = ref(false);

const newUser = ref({
  email: "",
  password: "",
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const token = localStorage.getItem("admin_token");

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
    alert("Failed to create user");
    console.error(error);
  }
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this admin?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  } catch (error) {
    alert("Failed to delete user");
  }
}

onMounted(fetchUsers);
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-black heading-primary tracking-tight">
          Gestion des Administrateurs
        </h2>
        <p class="text-gray-400 font-medium">
          Gérez les accès à la plateforme WiziAdmin.
        </p>
      </div>
      <button
        @click="showAddModal = true"
        class="flex items-center gap-2 px-6 py-3 bg-brand-primary text-blue-400 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/30 transition-all active:scale-95"
      >
        <span class="material-icons-outlined">add</span>
        Nouvel Admin
      </button>
    </div>

    <!-- Users List -->
    <div
      class="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
    >
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50">
            <th
              class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"
            >
              Email
            </th>
            <th
              class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"
            >
              Rôle
            </th>
            <th
              class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100"
            >
              Créé le
            </th>
            <th
              class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td
              colspan="4"
              class="px-8 py-10 text-center text-gray-400 italic font-medium"
            >
              Chargement des utilisateurs...
            </td>
          </tr>
          <tr v-else-if="users.length === 0">
            <td
              colspan="4"
              class="px-8 py-10 text-center text-gray-400 italic font-medium"
            >
              Aucun administrateur trouvé.
            </td>
          </tr>
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-gray-50/50 transition-colors group"
          >
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"
                >
                  <span class="material-icons-outlined text-blue-500 text-sm"
                    >person</span
                  >
                </div>
                <span class="font-bold heading-primary">{{ user.email }}</span>
              </div>
            </td>
            <td class="px-8 py-6">
              <span
                class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest"
              >
                {{ user.role }}
              </span>
            </td>
            <td class="px-8 py-6 text-sm text-gray-400 font-medium">
              {{ new Date(user.createdAt).toLocaleDateString("fr-FR") }}
            </td>
            <td class="px-8 py-6 text-right">
              <button
                @click="deleteUser(user.id)"
                class="p-2 text-gray-300 hover:text-red-500 transition-colors"
                title="Supprimer"
              >
                <span class="material-icons-outlined text-sm">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 overlay-dark backdrop-blur-sm"
        @click="showAddModal = false"
      ></div>
      <div
        class="bg-white rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl animate-in fade-in zoom-in duration-300"
      >
        <h3 class="text-2xl font-black heading-primary mb-2">
          Créer un administrateur
        </h3>
        <p class="text-gray-400 font-medium mb-8">
          Renseignez les accès pour le nouveau membre.
        </p>

        <form @submit.prevent="createUser" class="space-y-6">
          <div class="space-y-2">
            <label class="Wizi-label">Email</label>
            <input
              v-model="newUser.email"
              type="email"
              required
              class="Wizi-input"
              placeholder="ex: jean@wizy-learn.com"
            />
          </div>
          <div class="space-y-2">
            <label class="Wizi-label">Mot de passe</label>
            <input
              v-model="newUser.password"
              type="password"
              required
              class="Wizi-input"
              placeholder="••••••••"
            />
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 py-4 border border-gray-100 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="flex-1 py-4 bg-brand-primary text-blue-400 font-bold rounded-2xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all active:scale-95"
            >
              Créer le compte
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
