<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const formations = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingFormation = ref(null);
const form = ref({
  label: "",
  slug: "",
  category: "",
  icon: "school",
  color: "#3B82F6",
  objectifs: "",
  prequis: "",
  modaliteDuree: "",
  dateEnregistrement: "",
  certificateur: "",
  programme: "",
  isActive: true,
});

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const token = localStorage.getItem("admin_token");

async function fetchFormations() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/formations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    formations.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editingFormation.value = null;
  form.value = {
    label: "",
    slug: "",
    category: "",
    icon: "school",
    color: "#3B82F6",
    objectifs: "",
    prequis: "",
    modaliteDuree: "",
    dateEnregistrement: "",
    certificateur: "",
    programme: "",
    isActive: true,
  };
  showModal.value = true;
}

function openEditModal(f) {
  editingFormation.value = f;
  form.value = { ...f };
  showModal.value = true;
}

async function saveFormation() {
  try {
    // Basic slug generation if empty
    if (!form.value.slug) {
      form.value.slug = form.value.label
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
    }

    if (editingFormation.value) {
      await axios.patch(
        `${apiBaseUrl}/formations/${editingFormation.value.id}`,
        form.value,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } else {
      await axios.post(`${apiBaseUrl}/formations`, form.value, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    showModal.value = false;
    await fetchFormations();
  } catch (error) {
    alert("Erreur lors de l'enregistrement. Vérifiez que le slug est unique.");
    console.error(error);
  }
}

async function deleteFormation(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/formations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchFormations();
  } catch (error) {
    alert("Erreur lors de la suppression");
    console.error(error);
  }
}

async function toggleStatus(formation) {
  try {
    const newStatus = !formation.isActive;
    await axios.patch(
      `${apiBaseUrl}/formations/${formation.id}`,
      { isActive: newStatus },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    formation.isActive = newStatus;
  } catch (error) {
    console.error("Failed to update status:", error);
  }
}

onMounted(fetchFormations);
</script>

<template>
  <div class="space-y-10 animate-fade-in p-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-black heading-primary">
          Gestion des Formations
        </h2>
        <p
          class="text-gray-400 font-bold uppercase tracking-widest text-[10px]"
        >
          Gérez votre catalogue de formations et leurs détails
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
      >
        <span class="material-icons-outlined">add</span>
        Nouvelle Formation
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-if="loading"
        v-for="i in 3"
        :key="i"
        class="h-64 bg-white rounded-[32px] animate-pulse"
      ></div>

      <div
        v-else
        v-for="f in formations"
        :key="f.id"
        class="bg-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-blue-50 group"
      >
        <div class="flex items-start justify-between mb-6">
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            :style="{ backgroundColor: f.color + '10', color: f.color }"
          >
            <span class="material-icons-outlined text-2xl">{{
              f.icon || "school"
            }}</span>
          </div>
          <div
            class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              @click="openEditModal(f)"
              class="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
            >
              <span class="material-icons-outlined text-sm">edit</span>
            </button>
            <button
              @click="deleteFormation(f.id)"
              class="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center"
            >
              <span class="material-icons-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <span
              class="px-3 py-1 bg-gray-50 text-[8px] font-black uppercase tracking-widest text-gray-400 rounded-full border border-gray-100 mb-2 inline-block"
              >{{ f.category }}</span
            >
            <h3 class="text-xl font-black heading-primary leading-tight">
              {{ f.label }}
            </h3>
            <p class="text-[10px] font-bold text-gray-300 mt-1">
              Slug: {{ f.slug }}
            </p>
          </div>

          <div
            class="flex items-center justify-between pt-4 border-t border-gray-50"
          >
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              :class="
                f.isActive
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              "
            >
              {{ f.isActive ? "En ligne" : "Brouillon" }}
            </span>
            <button
              @click="toggleStatus(f)"
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary transition-colors"
            >
              {{ f.isActive ? "Désactiver" : "Activer" }}
            </button>
          </div>
        </div>
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
        class="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl relative overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div class="p-10 space-y-8">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-black heading-primary">
                {{ editingFormation ? "Modifier" : "Ajouter" }} une Formation
              </h3>
              <p
                class="text-gray-400 text-xs font-bold uppercase tracking-widest"
              >
                Détails de l'offre de formation
              </p>
            </div>
            <button
              @click="showModal = false"
              class="text-gray-300 hover:text-gray-600 transition-colors"
            >
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <form @submit.prevent="saveFormation" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-2 space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Titre de la Formation</label
                >
                <input
                  v-model="form.label"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: Pack Anglais TOEIC"
                  required
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Slug (Unique)</label
                >
                <input
                  v-model="form.slug"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: anglais-toeic"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Catégorie</label
                >
                <input
                  v-model="form.category"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: Langues"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Icone Material</label
                >
                <input
                  v-model="form.icon"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: translate"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Couleur (Hex)</label
                >
                <div class="flex gap-2">
                  <input
                    v-model="form.color"
                    class="flex-1 px-4 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  />
                  <input
                    type="color"
                    v-model="form.color"
                    class="w-12 h-12 rounded-xl border-none cursor-pointer"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >En Ligne ?</label
                >
                <div
                  @click="form.isActive = !form.isActive"
                  class="w-full px-6 py-4 rounded-2xl cursor-pointer transition-all font-bold text-sm text-center border"
                  :class="
                    form.isActive
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  "
                >
                  {{ form.isActive ? "OUI" : "NON" }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Objectifs</label
                >
                <textarea
                  v-model="form.objectifs"
                  rows="4"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm scrollbar-hide"
                  placeholder="Décrivez les objectifs..."
                ></textarea>
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Pré-requis</label
                >
                <textarea
                  v-model="form.prequis"
                  rows="4"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm scrollbar-hide"
                  placeholder="Pré-requis nécessaires..."
                ></textarea>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Modalité & Durée</label
                >
                <input
                  v-model="form.modaliteDuree"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: 35h - 100% Distanciel"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Certificateur</label
                >
                <input
                  v-model="form.certificateur"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: ETS Global"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                  >Date Enregistrement</label
                >
                <input
                  v-model="form.dateEnregistrement"
                  class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  placeholder="ex: 12/01/2024"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label
                class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
                >Programme (HTML accepté)</label
              >
              <textarea
                v-model="form.programme"
                rows="6"
                class="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-brand-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm scrollbar-hide"
                placeholder="Déroulé de la formation..."
              ></textarea>
            </div>

            <div class="pt-4">
              <button
                type="submit"
                class="w-full py-5 bg-brand-primary text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Enregistrer la Formation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.animate-scale-up {
  animation: scaleUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
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

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f1f5f9;
  border-radius: 10px;
}
</style>
