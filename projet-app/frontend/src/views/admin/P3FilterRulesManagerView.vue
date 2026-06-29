<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";

const toast = useToastStore();

const rules = ref([]);
const loading = ref(true);
const saving = ref(false);
const formations = ref([]);

const isModalOpen = ref(false);
const editingRule = ref(null);
const formError = ref("");

// Tabs in the modal for better UX
const activeTab = ref("source"); // 'source' | 'target'

const form = ref({
  name: "",
  sourceCategory: "",
  sourceSlugs: [],
  maxLevelOrder: null,
  levelOperator: "lte",
  filterMode: "EXCLUDE",
  targetSlugs: [],
  targetCategories: [],
  isActive: true,
  order: 0,
});

// ── Data Fetching ──────────────────────────────────────────────────────────────

async function fetchRules() {
  loading.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/p3-filter-rules`);
    rules.value = res.data;
  } catch (err) {
    console.error("Failed to fetch P3 rules:", err);
    toast.error("Erreur lors du chargement des règles P3");
  } finally {
    loading.value = false;
  }
}

async function fetchFormations() {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);
    formations.value = res.data || [];
  } catch (err) {
    console.error("Failed to fetch formations:", err);
    formations.value = [];
  }
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchRules(), fetchFormations()]);
  loading.value = false;
});

// ── Computed helpers ───────────────────────────────────────────────────────────

// Formations grouped by category
const formationsByCategory = computed(() => {
  const map = {};
  for (const f of formations.value || []) {
    const cat = (f.category || "Autre").trim();
    if (!map[cat]) map[cat] = [];
    map[cat].push(f);
  }
  return map;
});

const categoryOptions = computed(() =>
  Array.from(new Set((formations.value || []).map((f) => String(f.category || "").trim().toLowerCase()).filter(Boolean))).sort()
);

const slugOptions = computed(() =>
  Array.from(new Set((formations.value || []).map((f) => String(f.slug || "").trim().toLowerCase()).filter(Boolean))).sort()
);

// All levels flattened, with formation info attached, sorted by formation then level order
const allLevels = computed(() => {
  const levels = [];
  for (const f of formations.value || []) {
    if (f.levels && f.levels.length > 0) {
      const sorted = [...f.levels].sort((a, b) => a.order - b.order);
      for (const lv of sorted) {
        levels.push({ ...lv, formationSlug: f.slug, formationLabel: f.label, formationCategory: f.category, formationIcon: f.icon, formationColor: f.color });
      }
    }
  }
  return levels;
});

// Unique level orders from all formations (for the level threshold picker)
const levelOrderOptions = computed(() => {
  const orders = new Set();
  for (const lv of allLevels.value) {
    if (lv.order != null) orders.add(lv.order);
  }
  return Array.from(orders).sort((a, b) => a - b);
});

// Get label for a level order (first match across formations)
function getLevelLabel(order) {
  const found = allLevels.value.find((lv) => lv.order === order);
  if (found) return found.label;
  const mapping = { 1: "Initial", 2: "Basique", 3: "Opérationnel", 4: "Avancé", 5: "Expert" };
  return mapping[order] || `Niveau ${order}`;
}

// Get exact level label based on rule's specific source formations
function getExactLevelLabel(order, sourceSlugs = [], sourceCategory = "") {
  if (!order) return "";
  
  const slugs = (sourceSlugs || []).map(s => s.toLowerCase());
  const category = (sourceCategory || "").toLowerCase().trim();

  // 1. Try matching with exact source slugs
  if (slugs.length > 0) {
    const matches = allLevels.value.filter(
      (lv) => lv.order === order && slugs.includes(lv.formationSlug?.toLowerCase())
    );
    if (matches.length > 0) {
      // Return list of matching levels (e.g. "Anglais : A2")
      return matches.map(m => `${m.formationLabel} : ${m.label}`).join(" / ");
    }
  }

  // 2. Try matching with source category
  if (category) {
    const matches = allLevels.value.filter(
      (lv) => lv.order === order && lv.formationCategory?.toLowerCase() === category
    );
    if (matches.length > 0) {
      return matches.map(m => `${m.formationLabel} : ${m.label}`).join(" / ");
    }
  }

  // 3. Fallback to any first matching level order across all formations
  const found = allLevels.value.find((lv) => lv.order === order);
  if (found) return `${found.formationLabel} : ${found.label}`;

  const mapping = { 1: "Initial", 2: "Basique", 3: "Opérationnel", 4: "Avancé", 5: "Expert" };
  return mapping[order] || `Niveau ${order}`;
}

// Dynamically filter levels belonging to selected source formations/categories
const availableSourceLevels = computed(() => {
  const selectedSlugs = (form.value.sourceSlugs || []).map(s => s.toLowerCase());
  const selectedCategory = (form.value.sourceCategory || "").toLowerCase().trim();

  if (selectedSlugs.length === 0 && !selectedCategory) {
    // Fallback: if no source is selected, return all levels
    return allLevels.value;
  }

  return allLevels.value.filter((lv) => {
    const slugMatches = selectedSlugs.length > 0 && selectedSlugs.includes(lv.formationSlug?.toLowerCase());
    const categoryMatches = selectedCategory && lv.formationCategory?.toLowerCase() === selectedCategory;
    return slugMatches || categoryMatches;
  });
});

// Dynamic level orders based on filtered levels
const availableLevelOrderOptions = computed(() => {
  const orders = new Set();
  for (const lv of availableSourceLevels.value) {
    if (lv.order != null) orders.add(lv.order);
  }
  return Array.from(orders).sort((a, b) => a - b);
});


function getFormationBySlug(slug) {
  return (formations.value || []).find((f) => f.slug?.toLowerCase() === slug?.toLowerCase());
}

function getFormationIcon(slug) {
  const f = getFormationBySlug(slug);
  return f?.icon || "school";
}

function getFormationColor(slug) {
  const f = getFormationBySlug(slug);
  return f?.color || "#6b7280";
}

function getFormationLabel(slug) {
  const f = getFormationBySlug(slug);
  return f?.label || slug;
}

// ── Form helpers ───────────────────────────────────────────────────────────────

const isFormValid = computed(() => {
  const hasName = !!form.value.name?.trim();
  const hasSource = !!form.value.sourceCategory?.trim() || form.value.sourceSlugs.length > 0;
  const hasTarget = form.value.targetSlugs.length > 0 || form.value.targetCategories.length > 0;
  return hasName && hasSource && hasTarget;
});

const submitLabel = computed(() => (editingRule.value ? "Enregistrer les modifications" : "Créer la règle"));

function normalizeList(value) {
  const source = Array.isArray(value) ? value : [];
  return Array.from(new Set(source.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean)));
}

function toggleListValue(field, value) {
  const normalized = String(value || "").trim().toLowerCase();
  const current = new Set(normalizeList(form.value[field]));
  if (current.has(normalized)) current.delete(normalized);
  else current.add(normalized);
  form.value[field] = Array.from(current);
}

function isInList(field, value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalizeList(form.value[field]).includes(normalized);
}

function buildPayload() {
  const maxLevel =
    form.value.maxLevelOrder === null || form.value.maxLevelOrder === undefined || form.value.maxLevelOrder === ""
      ? null
      : Number(form.value.maxLevelOrder);
  const order =
    form.value.order === null || form.value.order === undefined || form.value.order === ""
      ? 0
      : Number(form.value.order);

  if (!form.value.name?.trim()) throw new Error("Le nom de la règle est obligatoire.");
  if (!form.value.sourceCategory?.trim() && form.value.sourceSlugs.length === 0)
    throw new Error("Ajoutez au moins une condition source (catégorie ou formations).");
  if (form.value.targetCategories.length === 0 && form.value.targetSlugs.length === 0)
    throw new Error("Ajoutez au moins une cible (catégories ou formations).");
  if (maxLevel !== null && (!Number.isFinite(maxLevel) || maxLevel < 0))
    throw new Error("Le seuil de niveau max doit être un nombre positif.");
  if (!Number.isFinite(order) || order < 0) throw new Error("La priorité doit être un nombre positif.");

  return {
    name: form.value.name.trim(),
    sourceCategory: form.value.sourceCategory?.trim().toLowerCase() || null,
    sourceSlugs: normalizeList(form.value.sourceSlugs),
    maxLevelOrder: maxLevel,
    levelOperator: form.value.levelOperator || "lte",
    filterMode: form.value.filterMode === "ALLOW_ONLY" ? "ALLOW_ONLY" : "EXCLUDE",
    targetSlugs: normalizeList(form.value.targetSlugs),
    targetCategories: normalizeList(form.value.targetCategories),
    isActive: form.value.isActive !== false,
    order,
  };
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function openModal(rule = null) {
  formError.value = "";
  activeTab.value = "source";
  if (rule) {
    editingRule.value = rule;
    form.value = {
      ...rule,
      sourceSlugs: rule.sourceSlugs || [],
      targetSlugs: rule.targetSlugs || [],
      targetCategories: rule.targetCategories || [],
      levelOperator: rule.levelOperator || "lte",
    };
  } else {
    editingRule.value = null;
    form.value = {
      name: "",
      sourceCategory: "",
      sourceSlugs: [],
      maxLevelOrder: null,
      levelOperator: "lte",
      filterMode: "EXCLUDE",
      targetSlugs: [],
      targetCategories: [],
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

// ── CRUD ───────────────────────────────────────────────────────────────────────

async function saveRule() {
  formError.value = "";
  saving.value = true;
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const token = localStorage.getItem("admin_token");
    if (!token) throw new Error("Session admin expirée. Reconnectez-vous.");
    const headers = { Authorization: `Bearer ${token}` };
    const payload = buildPayload();

    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/p3-filter-rules/${editingRule.value.id}`, payload, { headers });
    } else {
      await axios.post(`${apiBaseUrl}/p3-filter-rules`, payload, { headers });
    }

    closeModal();
    toast.success(editingRule.value ? "Règle mise à jour !" : "Règle créée !");
    await fetchRules();
  } catch (err) {
    console.error("Save failed:", err);
    formError.value = err?.response?.data?.message || err?.message || "Erreur lors de l'enregistrement";
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
    toast.success("Règle supprimée.");
    await fetchRules();
  } catch (err) {
    console.error("Delete failed", err);
    toast.error("Erreur lors de la suppression");
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
    toast.error("Erreur lors de la mise à jour");
  }
}

// ── Stats ──────────────────────────────────────────────────────────────────────

const activeRulesCount = computed(() => rules.value.filter((r) => r.isActive).length);
const allowOnlyCount = computed(() => rules.value.filter((r) => r.filterMode === "ALLOW_ONLY").length);
const excludeCount = computed(() => rules.value.filter((r) => r.filterMode === "EXCLUDE").length);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-slate-800">Règles de filtrage P3</h1>
        <p class="text-slate-500 text-sm mt-1">
          Configurez le filtrage des formations selon la formation et le niveau précédemment validés.
        </p>
      </div>
      <button
        @click="openModal()"
        class="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-colors"
      >
        <span class="material-icons-outlined text-sm">add</span>
        Nouvelle règle
      </button>
    </div>

    <!-- Stats bar -->
    <div v-if="!loading && rules.length > 0" class="grid grid-cols-3 gap-3">
      <div class="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <span class="material-icons-outlined text-slate-600 text-lg">rule</span>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-widest">Total</p>
          <p class="text-xl font-black text-slate-800">{{ rules.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
          <span class="material-icons-outlined text-green-600 text-lg">check_circle</span>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-widest">Actives</p>
          <p class="text-xl font-black text-slate-800">{{ activeRulesCount }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <span class="material-icons-outlined text-blue-600 text-lg">filter_alt</span>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-widest">Modes</p>
          <p class="text-xs font-bold text-slate-600 mt-0.5">
            <span class="text-blue-600">{{ allowOnlyCount }} Allow</span> /
            <span class="text-red-500">{{ excludeCount }} Exclude</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <span class="material-icons-outlined animate-spin text-3xl text-slate-300">sync</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="rules.length === 0" class="bg-white p-12 rounded-2xl text-center shadow-sm border border-slate-100">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
        <span class="material-icons-outlined text-3xl">filter_alt</span>
      </div>
      <p class="text-slate-700 font-bold text-lg">Aucune règle P3 définie</p>
      <p class="text-slate-400 text-sm mt-1 mb-6 max-w-sm mx-auto">
        Les règles P3 permettent de filtrer les formations proposées selon le parcours antérieur du candidat.
      </p>
      <button
        type="button"
        @click="openModal()"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
      >
        <span class="material-icons-outlined text-sm">add</span>
        Créer ma première règle
      </button>
    </div>

    <!-- Rules list -->
    <div v-else class="space-y-3">
      <div
        v-for="rule in rules"
        :key="rule.id"
        class="bg-white rounded-2xl shadow-sm border transition-all duration-200"
        :class="rule.isActive ? 'border-slate-100 hover:border-slate-200' : 'border-slate-100 opacity-60'"
      >
        <!-- Rule card header -->
        <div class="flex items-center gap-4 p-4 border-b border-slate-50">
          <!-- Priority badge -->
          <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span class="text-xs font-black text-slate-500">#{{ rule.order }}</span>
          </div>

          <!-- Name & status -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-black text-slate-800 truncate">{{ rule.name }}</h3>
              <span
                class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full"
                :class="rule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ rule.isActive ? "Actif" : "Inactif" }}
              </span>
              <span
                class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border"
                :class="rule.filterMode === 'ALLOW_ONLY' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'"
              >
                {{ rule.filterMode === "ALLOW_ONLY" ? "ALLOW ONLY" : "EXCLUDE" }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              @click="toggleActive(rule)"
              class="p-2 rounded-lg transition-colors"
              :class="rule.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'"
              :title="rule.isActive ? 'Désactiver' : 'Activer'"
            >
              <span class="material-icons-outlined text-xl">{{ rule.isActive ? "toggle_on" : "toggle_off" }}</span>
            </button>
            <button @click="openModal(rule)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
              <span class="material-icons-outlined text-sm">edit</span>
            </button>
            <button @click="deleteRule(rule.id)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
              <span class="material-icons-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

        <!-- Rule body: condition → action -->
        <div class="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <!-- Source condition -->
          <div class="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
            <p class="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">SI le candidat vient de...</p>
            <div class="space-y-1.5">
              <!-- Source category -->
              <div v-if="rule.sourceCategory" class="flex items-center gap-2">
                <span class="material-icons-outlined text-blue-400 text-sm">category</span>
                <span class="text-xs font-bold text-blue-900">Catégorie: <span class="capitalize">{{ rule.sourceCategory }}</span></span>
              </div>
              <!-- Source slugs -->
              <div v-if="rule.sourceSlugs?.length" class="flex flex-wrap gap-1 mt-1">
                <div
                  v-for="slug in rule.sourceSlugs"
                  :key="slug"
                  class="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-blue-100 shadow-sm"
                >
                  <span class="material-icons-outlined text-xs" :style="{ color: getFormationColor(slug) }">
                    {{ getFormationIcon(slug) || 'school' }}
                  </span>
                  <span class="text-[11px] font-bold text-slate-700">{{ getFormationLabel(slug) }}</span>
                </div>
              </div>
              <!-- Level condition -->
              <div v-if="rule.maxLevelOrder != null" class="flex items-center gap-1.5 mt-1">
                <span class="material-icons-outlined text-blue-400 text-sm">trending_flat</span>
                <span class="text-xs text-blue-800">
                  Niveau
                  <span class="font-black">{{ rule.levelOperator === "gte" ? "≥" : "≤" }}</span>
                  <span class="inline-flex items-center gap-1 ml-1 px-2 py-0.5 bg-white rounded-md border border-blue-100 font-bold text-blue-900 text-[11px] whitespace-normal">
                    {{ getExactLevelLabel(rule.maxLevelOrder, rule.sourceSlugs, rule.sourceCategory) }}
                    <span class="text-slate-400">({{ rule.maxLevelOrder }})</span>
                  </span>
                </span>
              </div>
              <div v-if="!rule.sourceCategory && !rule.sourceSlugs?.length" class="text-xs text-slate-400 italic">
                Aucune condition source définie
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flex flex-col items-center gap-1">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              :class="rule.filterMode === 'ALLOW_ONLY' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'"
            >
              <span class="material-icons-outlined text-base">{{ rule.filterMode === 'ALLOW_ONLY' ? 'done_all' : 'block' }}</span>
            </div>
            <span class="text-[9px] font-black uppercase tracking-widest" :class="rule.filterMode === 'ALLOW_ONLY' ? 'text-blue-600' : 'text-red-500'">
              {{ rule.filterMode === 'ALLOW_ONLY' ? 'Afficher' : 'Exclure' }}
            </span>
          </div>

          <!-- Target -->
          <div
            class="rounded-xl p-3 border"
            :class="rule.filterMode === 'ALLOW_ONLY' ? 'bg-blue-50/40 border-blue-100' : 'bg-red-50/40 border-red-100'"
          >
            <p
              class="text-[10px] font-black uppercase tracking-widest mb-2"
              :class="rule.filterMode === 'ALLOW_ONLY' ? 'text-blue-500' : 'text-red-500'"
            >
              {{ rule.filterMode === 'ALLOW_ONLY' ? 'UNIQUEMENT ces formations...' : 'Ces formations cachées...' }}
            </p>
            <div class="space-y-1.5">
              <!-- Target categories -->
              <div v-if="rule.targetCategories?.length" class="flex flex-wrap gap-1">
                <div
                  v-for="cat in rule.targetCategories"
                  :key="cat"
                  class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                  :class="rule.filterMode === 'ALLOW_ONLY' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-red-100 text-red-800 border-red-200'"
                >
                  <span class="material-icons-outlined text-xs">category</span>
                  <span class="capitalize">{{ cat }}</span>
                </div>
              </div>
              <!-- Target slugs -->
              <div v-if="rule.targetSlugs?.length" class="flex flex-wrap gap-1">
                <div
                  v-for="slug in rule.targetSlugs"
                  :key="slug"
                  class="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border shadow-sm"
                  :class="rule.filterMode === 'ALLOW_ONLY' ? 'border-blue-100' : 'border-red-100'"
                >
                  <span class="material-icons-outlined text-xs" :style="{ color: getFormationColor(slug) }">
                    {{ getFormationIcon(slug) || 'school' }}
                  </span>
                  <span class="text-[11px] font-bold text-slate-700">{{ getFormationLabel(slug) }}</span>
                </div>
              </div>
              <div v-if="!rule.targetCategories?.length && !rule.targetSlugs?.length" class="text-xs text-slate-400 italic">
                Aucune cible définie
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL ─────────────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
          <!-- Modal header -->
          <div class="border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 class="text-lg font-black text-slate-800">{{ editingRule ? "Modifier la règle" : "Nouvelle règle P3" }}</h2>
              <p class="text-xs text-slate-400 mt-0.5">Définissez la condition source, le seuil de niveau, et l'action à appliquer</p>
            </div>
            <button @click="closeModal" class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>

          <!-- Error banner -->
          <div v-if="formError" class="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2 flex-shrink-0">
            <span class="material-icons-outlined text-sm">error_outline</span>
            {{ formError }}
          </div>

          <form @submit.prevent="saveRule" class="flex-1 overflow-y-auto">
            <div class="px-6 py-5 space-y-6">

              <!-- Rule name & priority row -->
              <div class="grid grid-cols-3 gap-4">
                <div class="col-span-2 space-y-1">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Nom de la règle <span class="text-red-400">*</span></label>
                  <input
                    v-model="form.name"
                    required
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-semibold"
                    placeholder="Ex: Bloquer niveaux initiaux Word après Excel"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Priorité</label>
                  <input
                    type="number"
                    v-model="form.order"
                    min="0"
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <p class="text-[10px] text-slate-400">0 = traité en premier</p>
                </div>
              </div>

              <!-- Filter mode -->
              <div class="space-y-1">
                <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Mode de filtrage</label>
                <div class="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    @click="form.filterMode = 'ALLOW_ONLY'"
                    class="relative p-4 rounded-xl border-2 text-left transition-all"
                    :class="form.filterMode === 'ALLOW_ONLY' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <span class="material-icons-outlined text-lg" :class="form.filterMode === 'ALLOW_ONLY' ? 'text-blue-600' : 'text-slate-400'">done_all</span>
                      <span class="font-black text-sm" :class="form.filterMode === 'ALLOW_ONLY' ? 'text-blue-900' : 'text-slate-600'">ALLOW ONLY</span>
                    </div>
                    <p class="text-[11px] text-slate-500 leading-tight">Afficher <strong>uniquement</strong> les formations cibles</p>
                    <div v-if="form.filterMode === 'ALLOW_ONLY'" class="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span class="material-icons-outlined text-white text-[10px]">check</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    @click="form.filterMode = 'EXCLUDE'"
                    class="relative p-4 rounded-xl border-2 text-left transition-all"
                    :class="form.filterMode === 'EXCLUDE' ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <span class="material-icons-outlined text-lg" :class="form.filterMode === 'EXCLUDE' ? 'text-red-500' : 'text-slate-400'">block</span>
                      <span class="font-black text-sm" :class="form.filterMode === 'EXCLUDE' ? 'text-red-900' : 'text-slate-600'">EXCLUDE</span>
                    </div>
                    <p class="text-[11px] text-slate-500 leading-tight"><strong>Masquer</strong> les formations cibles</p>
                    <div v-if="form.filterMode === 'EXCLUDE'" class="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span class="material-icons-outlined text-white text-[10px]">check</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Tabs: Source / Target -->
              <div>
                <div class="flex border-b border-slate-200 mb-4">
                  <button
                    type="button"
                    @click="activeTab = 'source'"
                    class="px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px"
                    :class="activeTab === 'source' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
                  >
                    <span class="flex items-center gap-1.5">
                      <span class="material-icons-outlined text-sm">login</span>
                      Condition source
                      <span v-if="form.sourceSlugs.length > 0 || form.sourceCategory" class="w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">
                        {{ form.sourceSlugs.length + (form.sourceCategory ? 1 : 0) }}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    @click="activeTab = 'target'"
                    class="px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px"
                    :class="activeTab === 'target' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
                  >
                    <span class="flex items-center gap-1.5">
                      <span class="material-icons-outlined text-sm">filter_alt</span>
                      Formations cibles
                      <span v-if="form.targetSlugs.length > 0 || form.targetCategories.length > 0" class="w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">
                        {{ form.targetSlugs.length + form.targetCategories.length }}
                      </span>
                    </span>
                  </button>
                </div>

                <!-- SOURCE TAB -->
                <div v-if="activeTab === 'source'" class="space-y-5">
                  <!-- Source by category -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Par catégorie de formation</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="cat in categoryOptions"
                        :key="cat"
                        type="button"
                        @click="form.sourceCategory = form.sourceCategory === cat ? '' : cat"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                        :class="form.sourceCategory === cat
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                      >
                        <span class="material-icons-outlined text-xs">category</span>
                        <span class="capitalize">{{ cat }}</span>
                        <span v-if="form.sourceCategory === cat" class="material-icons-outlined text-xs">check</span>
                      </button>
                      <button
                        v-if="form.sourceCategory"
                        type="button"
                        @click="form.sourceCategory = ''"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-dashed border-slate-200 hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        Effacer
                      </button>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 text-xs text-slate-400">
                    <div class="flex-1 h-px bg-slate-100"></div>
                    <span class="font-bold">OU par formations spécifiques</span>
                    <div class="flex-1 h-px bg-slate-100"></div>
                  </div>

                  <!-- Source by formations (grouped) -->
                  <div class="space-y-3">
                    <div v-for="(fList, catName) in formationsByCategory" :key="catName">
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 capitalize">{{ catName }}</p>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <button
                          v-for="f in fList"
                          :key="f.slug"
                          type="button"
                          @click="toggleListValue('sourceSlugs', f.slug)"
                          class="flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-xs font-semibold"
                          :class="isInList('sourceSlugs', f.slug)
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'"
                        >
                          <span class="material-icons-outlined text-sm flex-shrink-0" :style="isInList('sourceSlugs', f.slug) ? {} : { color: f.color || '#94a3b8' }">
                            {{ f.icon || 'school' }}
                          </span>
                          <div class="min-w-0">
                            <span class="block truncate font-bold">{{ f.label }}</span>
                            <span class="text-[10px] opacity-60">{{ f.slug }}</span>
                          </div>
                          <span v-if="isInList('sourceSlugs', f.slug)" class="material-icons-outlined text-sm ml-auto flex-shrink-0">check</span>
                        </button>
                      </div>
                    </div>
                    <p v-if="Object.keys(formationsByCategory).length === 0" class="text-sm text-slate-400 italic text-center py-4">
                      Aucune formation chargée
                    </p>
                  </div>

                  <!-- Level threshold -->
                  <div class="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-3">
                    <p class="text-xs font-black uppercase tracking-widest text-amber-700">Seuil de niveau (optionnel)</p>
                    <p class="text-[11px] text-amber-600">
                      Si renseigné, la règle ne s'applique que si le niveau atteint par le candidat satisfait la condition.
                    </p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="text-xs font-bold text-slate-500 block mb-1">Opérateur</label>
                        <select
                          v-model="form.levelOperator"
                          class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          :disabled="form.maxLevelOrder === null"
                        >
                          <option value="lte">≤ Inférieur ou égal</option>
                          <option value="gte">≥ Supérieur ou égal</option>
                        </select>
                      </div>
                      <div>
                        <label class="text-xs font-bold text-slate-500 block mb-1">Niveau seuil</label>
                        <select
                          v-model="form.maxLevelOrder"
                          class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                        >
                          <option :value="null">-- Tous les niveaux --</option>
                          <option v-for="order in availableLevelOrderOptions" :key="order" :value="order">
                            Niveau {{ order }} — {{ getExactLevelLabel(order, form.sourceSlugs, form.sourceCategory) }}
                          </option>
                        </select>
                      </div>
                    </div>
                    <!-- Visual level selector pills -->
                    <div class="space-y-1.5">
                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sélection rapide :</p>
                      <div v-if="availableLevelOrderOptions.length > 0" class="flex flex-wrap gap-2 pt-1">
                        <button
                          v-for="order in availableLevelOrderOptions"
                          :key="order"
                          type="button"
                          @click="form.maxLevelOrder = form.maxLevelOrder === order ? null : order"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                          :class="form.maxLevelOrder === order
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'"
                        >
                          <span class="w-4 h-4 rounded-full bg-current opacity-20 flex-shrink-0 text-center leading-4 text-[9px] font-black">{{ order }}</span>
                          {{ getExactLevelLabel(order, form.sourceSlugs, form.sourceCategory) }}
                        </button>
                      </div>
                      <p v-else class="text-xs text-amber-600 italic">
                        Sélectionnez d'abord une catégorie ou une formation source pour filtrer les niveaux correspondants.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- TARGET TAB -->
                <div v-if="activeTab === 'target'" class="space-y-5">
                  <!-- Target by category -->
                  <div class="space-y-2">
                    <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Par catégorie</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="cat in categoryOptions"
                        :key="cat"
                        type="button"
                        @click="toggleListValue('targetCategories', cat)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                        :class="isInList('targetCategories', cat)
                          ? (form.filterMode === 'ALLOW_ONLY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-red-500 text-white border-red-500')
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                      >
                        <span class="material-icons-outlined text-xs">category</span>
                        <span class="capitalize">{{ cat }}</span>
                        <span v-if="isInList('targetCategories', cat)" class="material-icons-outlined text-xs">check</span>
                      </button>
                    </div>
                    <p class="text-[10px] text-slate-400">
                      Toutes les formations de la catégorie seront {{ form.filterMode === 'ALLOW_ONLY' ? 'affichées' : 'masquées' }}.
                    </p>
                  </div>

                  <div class="flex items-center gap-3 text-xs text-slate-400">
                    <div class="flex-1 h-px bg-slate-100"></div>
                    <span class="font-bold">ET/OU formations individuelles</span>
                    <div class="flex-1 h-px bg-slate-100"></div>
                  </div>

                  <!-- Target by formations (grouped) -->
                  <div class="space-y-3">
                    <div v-for="(fList, catName) in formationsByCategory" :key="catName">
                      <div class="flex items-center gap-2 mb-1.5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 capitalize">{{ catName }}</p>
                        <!-- Select all in category -->
                        <button
                          type="button"
                          @click="fList.forEach(f => { if (!isInList('targetSlugs', f.slug)) toggleListValue('targetSlugs', f.slug) })"
                          class="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          Tout sélectionner
                        </button>
                      </div>
                      <!-- Levels grid for each formation -->
                      <div v-for="f in fList" :key="f.slug" class="mb-2">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="material-icons-outlined text-sm flex-shrink-0" :style="{ color: f.color || '#94a3b8' }">
                            {{ f.icon || 'school' }}
                          </span>
                          <span class="text-xs font-bold text-slate-600">{{ f.label }}</span>
                        </div>
                        <!-- If formation has levels, show each level as a selectable slug -->
                        <div v-if="f.levels && f.levels.length > 0" class="flex flex-wrap gap-1.5 ml-6">
                          <button
                            v-for="lv in [...f.levels].sort((a, b) => a.order - b.order)"
                            :key="lv.id"
                            type="button"
                            @click="toggleListValue('targetSlugs', f.slug)"
                            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all"
                            :class="isInList('targetSlugs', f.slug)
                              ? (form.filterMode === 'ALLOW_ONLY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-red-500 text-white border-red-500')
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                          >
                            <span class="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
                              :class="isInList('targetSlugs', f.slug) ? 'bg-white/20' : 'bg-slate-100'">
                              {{ lv.order }}
                            </span>
                            {{ lv.label }}
                          </button>
                        </div>
                        <!-- No levels: select the formation slug directly -->
                        <div v-else class="ml-6">
                          <button
                            type="button"
                            @click="toggleListValue('targetSlugs', f.slug)"
                            class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
                            :class="isInList('targetSlugs', f.slug)
                              ? (form.filterMode === 'ALLOW_ONLY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-red-500 text-white border-red-500')
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
                          >
                            {{ f.slug }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Selected summary -->
                  <div v-if="form.targetSlugs.length > 0 || form.targetCategories.length > 0" class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Récapitulatif des cibles sélectionnées</p>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="cat in form.targetCategories"
                        :key="'cat-' + cat"
                        class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                        :class="form.filterMode === 'ALLOW_ONLY' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-red-100 text-red-800 border-red-200'"
                      >
                        <span class="material-icons-outlined text-xs">category</span>
                        <span class="capitalize">{{ cat }}</span>
                        <button type="button" @click="toggleListValue('targetCategories', cat)" class="ml-0.5 opacity-60 hover:opacity-100">
                          <span class="material-icons-outlined text-xs">close</span>
                        </button>
                      </span>
                      <span
                        v-for="slug in form.targetSlugs"
                        :key="'slug-' + slug"
                        class="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                        :class="form.filterMode === 'ALLOW_ONLY' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-red-100 text-red-800 border-red-200'"
                      >
                        <span class="material-icons-outlined text-xs" :style="{ color: getFormationColor(slug) }">{{ getFormationIcon(slug) || 'school' }}</span>
                        {{ getFormationLabel(slug) }}
                        <button type="button" @click="toggleListValue('targetSlugs', slug)" class="ml-0.5 opacity-60 hover:opacity-100">
                          <span class="material-icons-outlined text-xs">close</span>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Active toggle -->
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="form.isActive" class="sr-only peer" />
                  <div class="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
                <div>
                  <p class="text-sm font-bold text-slate-700">Règle active</p>
                  <p class="text-xs text-slate-400">{{ form.isActive ? "La règle sera appliquée immédiatement" : "La règle est désactivée et ignorée" }}</p>
                </div>
              </div>
            </div>

            <!-- Modal footer -->
            <div class="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end bg-slate-50 rounded-b-2xl flex-shrink-0">
              <button
                type="button"
                @click="closeModal"
                class="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="saving || !isFormValid"
                class="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                <span v-if="saving" class="material-icons-outlined animate-spin text-sm">sync</span>
                <span class="material-icons-outlined text-sm">save</span>
                {{ submitLabel }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
