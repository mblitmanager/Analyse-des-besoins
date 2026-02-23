<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const contacts = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingContact = ref(null);
const form = ref({
  civilite: "Mr.",
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  conseiller: "Conseiller en formation",
  isActive: true,
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const token = localStorage.getItem("admin_token");

async function fetchContacts() {
  try {
    const response = await axios.get(`${apiBaseUrl}/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    contacts.value = response.data;
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editingContact.value = null;
  form.value = {
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    conseiller: "Conseiller en formation",
    isActive: true,
  };
  showModal.value = true;
}

function openEditModal(contact) {
  editingContact.value = contact;
  form.value = {
    prenom: contact.prenom || "",
    nom: contact.nom || "",
    email: contact.email || "",
    telephone: contact.telephone || "",
    conseiller: contact.conseiller || "Conseiller en formation",
    isActive: contact.isActive !== false,
  };
  showModal.value = true;
}

async function saveContact() {
  try {
    if (editingContact.value) {
      await axios.patch(
        `${apiBaseUrl}/contacts/${editingContact.value.id}`,
        form.value,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } else {
      await axios.post(`${apiBaseUrl}/contacts`, form.value, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    showModal.value = false;
    await fetchContacts();
  } catch (error) {
    alert("Erreur lors de l'enregistrement");
    console.error(error);
  }
}

async function deleteContact(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce conseiller ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/contacts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchContacts();
  } catch (error) {
    alert("Erreur lors de la suppression");
    console.error(error);
  }
}

async function toggleStatus(contact) {
  try {
    const newStatus = !contact.isActive;
    await axios.patch(
      `${apiBaseUrl}/contacts/${contact.id}`,
      { isActive: newStatus },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    contact.isActive = newStatus;
  } catch (error) {
    console.error("Failed to update contact status:", error);
    alert("Erreur lors de la mise à jour du statut.");
  }
}

onMounted(fetchContacts);
</script>

<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto font-outfit">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
    >
      <div>
        <h1 class="text-3xl font-extrabold heading-primary mb-2 tracking-tight">
          Gestion des Conseillers
        </h1>
        <p class="text-gray-400">
          Gérez la liste des conseillers en formation et leur visibilité.
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-8 py-4 bg-brand-primary text-blue-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
      >
        <span class="material-icons-outlined">add</span>
        Nouveau Conseiller
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div
        class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
      ></div>
    </div>

    <div
      v-else
      class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th
                class="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Conseiller
              </th>
              <th
                class="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Email / Tel
              </th>
              <th
                class="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center"
              >
                Statut
              </th>
              <th
                class="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="contact in contacts"
              :key="contact.id"
              class="hover:bg-gray-50 transition-colors group"
            >
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm"
                  >
                    {{ contact.prenom?.[0] }}{{ contact.nom?.[0] }}
                  </div>
                  <div>
                    <div class="text-sm font-bold heading-primary">
                      {{ contact.prenom }} {{ contact.nom }}
                    </div>
                    <div
                      class="text-[10px] font-bold text-gray-300 uppercase tracking-widest"
                    >
                      {{ contact.conseiller || "CONSEILLER" }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="text-sm font-medium text-gray-600">
                  {{ contact.email || "N/A" }}
                </div>
                <div class="text-xs text-gray-300">
                  {{ contact.telephone || "N/A" }}
                </div>
              </td>
              <td class="px-6 py-5 text-center">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  :class="
                    contact.isActive !== false
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600'
                  "
                >
                  {{ contact.isActive !== false ? "Actif" : "Inactif" }}
                </span>
              </td>
              <td
                class="px-6 py-5 text-right flex items-center justify-end gap-2"
              >
                <button
                  @click="toggleStatus(contact)"
                  class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
                  :class="
                    contact.isActive !== false
                      ? 'border-red-100 text-red-500 hover:bg-red-50'
                      : 'border-green-100 text-green-600 hover:bg-green-50'
                  "
                >
                  {{ contact.isActive !== false ? "Désactiver" : "Activer" }}
                </button>
                <div
                  class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    @click="openEditModal(contact)"
                    class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    <span class="material-icons-outlined text-sm">edit</span>
                  </button>
                  <button
                    @click="deleteContact(contact.id)"
                    class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <span class="material-icons-outlined text-sm">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
      <div
        class="absolute inset-0 overlay-dark backdrop-blur-sm"
        @click="showModal = false"
      ></div>
      <div
        class="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden animate-scale-up"
      >
        <div class="p-10 space-y-8">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black heading-primary">
                {{ editingContact ? "Modifier" : "Ajouter" }} un Conseiller
              </h3>
              <p
                class="text-gray-400 text-xs font-bold uppercase tracking-widest"
              >
                Informations du conseiller en formation
              </p>
            </div>
            <button
              @click="showModal = false"
              class="text-gray-300 hover:text-gray-600 transition-colors"
            >
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveContact" class="space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Prénom</label
                >
                <input
                  v-model="form.prenom"
                  placeholder="Prénom"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  required
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Nom</label
                >
                <input
                  v-model="form.nom"
                  placeholder="Nom"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Email</label
                >
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="email@exemple.com"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Téléphone</label
                >
                <input
                  v-model="form.telephone"
                  placeholder="06..."
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label
                class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                >Titre / Rôle</label
              >
              <input
                v-model="form.conseiller"
                placeholder="Conseiller en formation"
                class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
              />
            </div>

            <div class="pt-4">
              <button
                type="submit"
                class="w-full py-5 bg-brand-primary text-blue-400 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Enregistrer le Conseiller
              </button>
            </div>
          </form>
        </div>
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

.animate-scale-up {
  animation: scaleUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
