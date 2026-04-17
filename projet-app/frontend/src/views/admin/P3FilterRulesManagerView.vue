<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const rules = ref([]);
const loading = ref(true);
const saving = ref(false);

const isModalOpen = ref(false);
const editingRule = ref(null);
const formError = ref("");

const form = ref({
  name: "",
  sourceCategory: "",
  sourceSlugs: "",
  maxLevelOrder: null,
  filterMode: "EXCLUDE",
  targetSlugs: "",
  targetCategories: "",
  isActive: true,
  order: 0,
});

async function fetchRules() {
  loading.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/p3-filter-rules`);
    rules.value = res.data;
  } catch (err) {
    console.error("Failed to fetch P3 rules:", err);
    alert("Erreur lors du chargement des règles P3");
  } finally {
    loading.value = false;
  }
}

onMounted(fetchRules);

const isFormValid = computed(() => {
  const hasName = !!form.value.name?.trim();
  const hasSource =
    !!form.value.sourceCategory?.trim() || !!form.value.sourceSlugs?.trim();
  const hasTarget =
    !!form.value.targetSlugs?.trim() || !!form.value.targetCategories?.trim();
  return hasName && hasSource && hasTarget;
});

function parseCsv(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function buildPayload() {
  const maxLevel =
    form.value.maxLevelOrder === null ||
    form.value.maxLevelOrder === undefined ||
    form.value.maxLevelOrder === ""
      ? null
      : Number(form.value.maxLevelOrder);
  const order =
    form.value.order === null ||
    form.value.order === undefined ||
    form.value.order === ""
      ? 0
      : Number(form.value.order);

  if (!form.value.name?.trim()) {
    throw new Error("Le nom de la règle est obligatoire.");
  }
  if (!form.value.sourceCategory?.trim() && !form.value.sourceSlugs?.trim()) {
    throw new Error("Ajoutez au moins une condition source (catégorie ou slugs).");
  }
  if (!form.value.targetCategories?.trim() && !form.value.targetSlugs?.trim()) {
    throw new Error("Ajoutez au moins une cible (catégories ou slugs).");
  }
  if (maxLevel !== null && (!Number.isFinite(maxLevel) || maxLevel < 0)) {
    throw new Error("Le seuil de niveau max doit être un nombre positif.");
  }
  if (!Number.isFinite(order) || order < 0) {
    throw new Error("La priorité doit être un nombre positif.");
  }

  return {
    name: form.value.name.trim(),
    sourceCategory: form.value.sourceCategory?.trim().toLowerCase() || null,
    sourceSlugs: parseCsv(form.value.sourceSlugs),
    maxLevelOrder: maxLevel,
    filterMode: form.value.filterMode === "ALLOW_ONLY" ? "ALLOW_ONLY" : "EXCLUDE",
    targetSlugs: parseCsv(form.value.targetSlugs),
    targetCategories: parseCsv(form.value.targetCategories),
    isActive: form.value.isActive !== false,
    order,
  };
}

function openModal(rule = null) {
  formError.value = "";
  if (rule) {
    editingRule.value = rule;
    form.value = {
      ...rule,
      sourceSlugs: rule.sourceSlugs ? rule.sourceSlugs.join(", ") : "",
      targetSlugs: rule.targetSlugs ? rule.targetSlugs.join(", ") : "",
      targetCategories: rule.targetCategories ? rule.targetCategories.join(", ") : "",
    };
  } else {
    editingRule.value = null;
    form.value = {
      name: "",
      sourceCategory: "",
      sourceSlugs: "",
      maxLevelOrder: null,
      filterMode: "EXCLUDE",
      targetSlugs: "",
      targetCategories: "",
      isActive: true,
      order: 0,
    };
  }
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingRule.value = null;
}

async function saveRule() {
  formError.value = "";
  saving.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const token = localStorage.getItem("admin_token");
    if (!token) {
      throw new Error("Session admin expirée. Reconnectez-vous.");
    }
    const headers = { Authorization: `Bearer ${token}` };

    const payload = buildPayload();

    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/p3-filter-rules/${editingRule.value.id}`, payload, { headers });
    } else {
      await axios.post(`${apiBaseUrl}/p3-filter-rules`, payload, { headers });
    }

    closeModal();
    await fetchRules();
  } catch (err) {
    console.error("Save failed:", err);
    formError.value =
      err?.response?.data?.message ||
      err?.message ||
      "Erreur lors de l'enregistrement de la règle";
  } finally {
    saving.value = false;
  }
}

async function deleteRule(id) {
  if (!confirm("Voulez-vous vraiment supprimer cette règle ?")) return;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const token = localStorage.getItem("admin_token");
    const headers = { Authorization: `Bearer ${token}` };
    await axios.delete(`${apiBaseUrl}/p3-filter-rules/${id}`, { headers });
    await fetchRules();
  } catch (err) {
    console.error("Delete failed", err);
    alert("Erreur lors de la suppression");
  }
}

async function toggleActive(rule) {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const token = localStorage.getItem("admin_token");
    await axios.patch(
      `${apiBaseUrl}/p3-filter-rules/${rule.id}`,
      { isActive: !rule.isActive },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    rule.isActive = !rule.isActive;
  } catch (err) {
    console.error("Toggle failed", err);
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-800">Règles de filtrage P3</h1>
        <p class="text-slate-500 text-sm mt-1">Configurez les restrictions de formations selon le parcours précédent.</p>
      </div>
      <button @click="openModal()" class="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg hover:brightness-95 flex items-center gap-2">
        <span class="material-icons-outlined text-sm">add</span> Ajouter une règle
      </button>
    </div>

    <!-- Active rules block -->
    <div v-if="loading" class="text-center py-10"><span class="material-icons-outlined animate-spin text-2xl text-slate-400">sync</span></div>
    
    <div v-else class="grid grid-cols-1 gap-4">
      <div v-if="rules.length === 0" class="bg-white p-8 rounded-xl text-center shadow-sm">
        <p class="text-slate-500">Aucune règle définie.</p>
      </div>
      <div v-for="rule in rules" :key="rule.id" class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="font-bold text-slate-800 text-lg">{{ rule.name }}</h3>
            <span v-if="rule.isActive" class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Actif</span>
            <span v-else class="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">Inactif</span>
            <span class="px-2 py-0.5 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full">Ordre: {{ rule.order }}</span>
          </div>
          
          <div class="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100 mb-3 space-y-1">
             <p><span class="text-slate-400 font-bold uppercase text-[10px] tracking-widest mr-2">SI Précédent:</span>
               <span v-if="rule.sourceCategory">Cat="<span class="font-bold">{{rule.sourceCategory}}</span>"</span>
               <span v-if="rule.sourceCategory && rule.sourceSlugs?.length"> OU </span>
               <span v-if="rule.sourceSlugs?.length">Slugs IN [<span class="font-bold">{{rule.sourceSlugs.join(', ')}}</span>]</span>
               <span v-if="rule.maxLevelOrder"> AVEC Niveau &le; <span class="font-bold">{{rule.maxLevelOrder}}</span></span>
             </p>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="material-icons-outlined text-brand-primary">arrow_forward</span>
            <span class="font-bold" :class="rule.filterMode === 'ALLOW_ONLY' ? 'text-blue-600' : 'text-red-600'">
              {{ rule.filterMode === 'ALLOW_ONLY' ? 'N\'AUTORISER QUE' : 'EXCLURE' }}
            </span>
            <span v-if="rule.targetCategories?.length">Catégories: {{rule.targetCategories.join(', ')}}</span>
            <span v-if="rule.targetCategories?.length && rule.targetSlugs?.length"> - ET - </span>
            <span v-if="rule.targetSlugs?.length">Formations: {{rule.targetSlugs.join(', ')}}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2 border-l border-slate-100 pl-4">
           <button @click="toggleActive(rule)" class="p-2 rounded-lg transition-colors" :class="rule.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'" title="Activer/Désactiver">
             <span class="material-icons-outlined">{{ rule.isActive ? 'toggle_on' : 'toggle_off' }}</span>
           </button>
           <button @click="openModal(rule)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
             <span class="material-icons-outlined text-sm">edit</span>
           </button>
           <button @click="deleteRule(rule.id)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
             <span class="material-icons-outlined text-sm">delete</span>
           </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="border-b border-gray-100 p-6 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 class="text-xl font-black text-slate-800">{{ editingRule ? 'Modifier' : 'Ajouter' }} une règle P3</h2>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600"><span class="material-icons-outlined">close</span></button>
        </div>
        
        <form @submit.prevent="saveRule" class="p-6 space-y-6">
          <div v-if="formError" class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {{ formError }}
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">Nom de la règle</label>
            <input v-model="form.name" required class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-primary" placeholder="Description claire" />
          </div>

          <div class="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div class="col-span-2"><h4 class="font-bold text-blue-900 text-sm">Condition: L'utilisateur sort de...</h4></div>
            
            <div>
              <label class="text-xs font-bold text-slate-500">Catégorie source (si applicable)</label>
              <input v-model="form.sourceCategory" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg" placeholder="ex: bureautique" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500">Slugs sources (séparés par des virgules)</label>
              <input v-model="form.sourceSlugs" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg" placeholder="ex: microsoft-word, microsoft-excel" />
            </div>
            <div class="col-span-2">
              <label class="text-xs font-bold text-slate-500">Seuil Ordre Niveau Max (optionnel)</label>
              <input type="number" v-model="form.maxLevelOrder" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg" placeholder="ex: 2" />
              <p class="text-[10px] text-slate-400 mt-1">Si renseigné, la règle ne s'applique que si le niveau est <= à cette valeur (ex: 2 = Initial/Basique).</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
            <div class="col-span-2"><h4 class="font-bold text-orange-900 text-sm">Action: On filtre P3...</h4></div>
            
            <div class="col-span-2">
              <label class="text-xs font-bold text-slate-500">Mode de filtre</label>
              <select v-model="form.filterMode" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg font-bold">
                <option value="ALLOW_ONLY">ALLOW_ONLY (Afficher UNIQUEMENT ces cibles !)</option>
                <option value="EXCLUDE">EXCLUDE (Cacher ces cibles !)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500">Catégories cibles</label>
              <input v-model="form.targetCategories" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg" placeholder="ex: création, réseaux-sociaux" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-500">Slugs cibles (séparés par des virgules)</label>
              <input v-model="form.targetSlugs" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg" placeholder="ex: wordpress, photoshop" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
                <label class="text-xs font-bold text-slate-500">Priorité (0-99)</label>
                <input type="number" v-model="form.order" class="w-full px-4 py-2 mt-1 border border-slate-200 rounded-lg" />
             </div>
             <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.isActive" class="w-5 h-5 rounded border-slate-300 text-brand-primary" />
                  <span class="font-bold text-slate-700">Règle active</span>
                </label>
             </div>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button type="button" @click="closeModal" class="px-6 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
            <button type="submit" :disabled="saving || !isFormValid" class="px-6 py-2 bg-brand-primary text-white font-bold rounded-xl hover:brightness-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="saving" class="material-icons-outlined animate-spin text-sm">sync</span>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
