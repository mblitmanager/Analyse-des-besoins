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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const getHeader = () => {
  const token = localStorage.getItem("admin_token");
  if (!token) return null;
  return { headers: { Authorization: `Bearer ${token}` } };
};

async function fetchContacts() {
  const header = getHeader();
  if (!header) return;
  try {
    const response = await axios.get(`${apiBaseUrl}/contacts`, header);
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
    civilite: "Mr.",
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
    civilite: contact.civilite || "Mr.",
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
  const header = getHeader();
  if (!header) return;
  try {
    if (editingContact.value) {
      await axios.patch(
        `${apiBaseUrl}/contacts/${editingContact.value.id}`,
        form.value,
        header,
      );
    } else {
      await axios.post(`${apiBaseUrl}/contacts`, form.value, header);
    }
    showModal.value = false;
    await fetchContacts();
  } catch (error) {
    alert("Erreur lors de l'enregistrement");
  }
}

async function deleteContact(id) {
  if (!confirm("Supprimer ce conseiller ?")) return;
  const header = getHeader();
  if (!header) return;
  try {
    await axios.delete(`${apiBaseUrl}/contacts/${id}`, header);
    await fetchContacts();
  } catch (error) {
    alert("Erreur lors de la suppression");
  }
}

async function toggleStatus(contact) {
  const header = getHeader();
  if (!header) return;
  try {
    const newStatus = !contact.isActive;
    await axios.patch(
      `${apiBaseUrl}/contacts/${contact.id}`,
      { isActive: newStatus },
      header,
    );
    contact.isActive = newStatus;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

const getInitials = (contact) => {
  return `${contact.prenom?.[0] || ''}${contact.nom?.[0] || ''}`.toUpperCase();
};

onMounted(fetchContacts);
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Conseillers Formation</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Gestion des contacts et conseillers référents de la plateforme
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 transform active:scale-95"
      >
        <span class="material-icons-outlined text-sm">person_add_alt</span>
        Nouveau Conseiller
      </button>
    </div>

    <!-- Main Table -->
    <div v-if="loading" class="py-24 flex justify-center"><div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-brand-primary animate-spin"></div></div>

    <div v-else class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-50">
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identité du Conseiller</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordonnées Directes</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">État</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="contact in contacts" :key="contact.id" class="group hover:bg-slate-50/50 transition-all" :class="!contact.isActive ? 'opacity-40 grayscale' : ''">
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                    {{ getInitials(contact) }}
                  </div>
                  <div class="space-y-0.5">
                    <p class="text-[13px] font-black text-slate-900 leading-tight">{{ contact.civilite }} {{ contact.prenom }} {{ contact.nom }}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ contact.conseiller || 'Conseiller' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="space-y-1">
                   <div class="flex items-center gap-2 text-slate-600">
                     <span class="material-icons-outlined text-[14px] opacity-40">mail</span>
                     <span class="text-xs font-bold">{{ contact.email || '—' }}</span>
                   </div>
                   <div class="flex items-center gap-2 text-slate-400">
                     <span class="material-icons-outlined text-[14px] opacity-40">phone</span>
                     <span class="text-[11px] font-bold">{{ contact.telephone || '—' }}</span>
                   </div>
                </div>
              </td>
              <td class="px-8 py-6 text-center">
                 <span class="inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all" :class="contact.isActive !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'">
                    {{ contact.isActive !== false ? 'Actif' : 'Inactif' }}
                 </span>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center justify-end gap-2 pr-2">
                   <button @click="toggleStatus(contact)" class="w-10 h-10 rounded-2xl border border-slate-100 text-slate-300 hover:text-slate-900 hover:bg-white transition-all flex items-center justify-center shrink-0">
                     <span class="material-icons-outlined text-sm">{{ contact.isActive ? 'visibility' : 'visibility_off' }}</span>
                   </button>
                   <button @click="openEditModal(contact)" class="w-10 h-10 rounded-2xl border border-slate-100 text-slate-300 hover:text-brand-primary hover:bg-white transition-all flex items-center justify-center shrink-0">
                     <span class="material-icons-outlined text-sm">edit</span>
                   </button>
                   <button @click="deleteContact(contact.id)" class="w-10 h-10 rounded-2xl border border-slate-100 text-slate-300 hover:text-rose-600 hover:bg-white transition-all flex items-center justify-center shrink-0">
                     <span class="material-icons-outlined text-sm">delete_outline</span>
                   </button>
                </div>
              </td>
            </tr>
            <tr v-if="contacts.length === 0">
               <td colspan="4" class="py-24 text-center">
                  <div class="flex flex-col items-center justify-center text-slate-300">
                     <span class="material-icons-outlined text-5xl mb-3 opacity-10">sensor_occupied</span>
                     <p class="text-[10px] font-black uppercase tracking-widest">Aucun conseiller référencé</p>
                  </div>
               </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form (Unified Refinement) -->
    <div v-if="showModal" class="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" @click="showModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden animate-scale-up">
        
        <div class="px-10 py-10 border-b border-slate-50 text-center">
          <div class="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 mb-4">
             <span class="material-icons-outlined text-2xl">badge</span>
          </div>
          <h3 class="text-2xl font-black text-slate-900 tracking-tight">{{ editingContact ? "Édition du Profil" : "Nouveau Conseiller" }}</h3>
          <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Informations de contact référent</p>
        </div>

        <div class="p-10">
          <form @submit.prevent="saveContact" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Civilité</label>
                <select v-model="form.civilite" required class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner">
                  <option value="Mr.">Monsieur</option>
                  <option value="Mme.">Madame</option>
                </select>
              </div>
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Titre Professionnel</label>
                <input v-model="form.conseiller" placeholder="ex: Responsable Pédagogique" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prénom</label>
                <input v-model="form.prenom" required placeholder="Jean" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom</label>
                <input v-model="form.nom" required placeholder="DUPONT" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                <input v-model="form.email" type="email" placeholder="jean.dupont@mbl.com" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone</label>
                <input v-model="form.telephone" placeholder="06 00 00 00 00" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-inner" />
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button type="button" @click="showModal = false" class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">Annuler</button>
              <button type="submit" class="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all transform active:scale-95">Valider le Profil</button>
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
