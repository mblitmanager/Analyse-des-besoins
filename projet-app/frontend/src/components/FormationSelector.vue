<script setup>
import { computed } from 'vue';
const props = defineProps({
  formations: { type: Array, default: () => [] },
  mode: { type: String, default: 'single' }, // 'single' | 'multi'
  selectedId: { type: [String, Number, null], default: null },
  selectedIds: { type: Array, default: () => [] },
  selectedCategory: { type: String, default: '' },
});
const emit = defineEmits(['update:selectedId','update:selectedIds','update:selectedCategory','select']);

const categories = computed(() => {
  const cats = new Set();
  for (const f of props.formations || []) if (f.category) cats.add(f.category);
  return Array.from(cats).sort();
});

const formationsByCategory = computed(() => {
  const map = {};
  for (const f of props.formations || []) {
    const cat = (f.category || 'Autre').trim();
    if (!map[cat]) map[cat] = [];
    map[cat].push(f);
  }
  return map;
});

const selId = computed(() => props.selectedId);
const selIds = computed(() => props.selectedIds);
const selCat = computed(() => props.selectedCategory);
const forms = computed(() => props.formations || []);

const filteredForms = computed(() => {
  if (!selCat.value) return forms.value;
  return forms.value.filter(f => (f.category || '').toLowerCase() === (selCat.value || '').toLowerCase());
});


function onSelectSingle(e) {
  const id = Number(e.target.value);
  emit('update:selectedId', id);
  const formation = (props.formations || []).find(f => f.id === id) || null;
  if (formation) emit('select', formation);
}

function onToggleMulti(slug) {
  const arr = Array.isArray(props.selectedIds) ? [...props.selectedIds] : [];
  const idx = arr.indexOf(slug);
  if (idx === -1) arr.push(slug); else arr.splice(idx, 1);
  emit('update:selectedIds', arr);
}

function onCategoryChangeSingle(e) {
  const cat = e.target.value;
  emit('update:selectedCategory', cat);
}

function onCategoryToggleMulti(cat) {
  const newVal = props.selectedCategory === cat ? '' : cat;
  emit('update:selectedCategory', newVal);
}
</script>

<template>
  <div>
    <template v-if="mode === 'single'">
      <!-- Mirror Parcours design: compact pills with rounded white background -->
      <div class="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="relative min-w-[140px]">
          <select :value="selCat" @change="onCategoryChangeSingle" class="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-primary">
                      <option value="">Toutes</option>
                      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <span class="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 text-[14px]">expand_more</span>
        </div>

        <div class="h-6 w-px bg-slate-100"></div>

        <div class="relative min-w-[200px] flex-1">
          <select :value="selId" @change="onSelectSingle" class="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-1 focus:ring-brand-primary"> 
                      <option v-for="form in filteredForms" :key="form.id" :value="form.id">{{ form.label }}</option>
          </select>
          <span class="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 text-[14px]">expand_more</span>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- multi mode: category pills + grid of formations (toggle) -->
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            @click="onCategoryToggleMulti(cat)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
            :class="selCat === cat ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
          >
            <span class="material-icons-outlined text-xs">category</span>
            <span class="capitalize">{{ cat }}</span>
            <span v-if="selCat === cat" class="material-icons-outlined text-xs">check</span>
          </button>
          <button v-if="selCat" type="button" @click="onCategoryToggleMulti(selCat)" class="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 border border-dashed border-slate-200 hover:text-red-500 hover:border-red-200 transition-colors">Effacer</button>
        </div>

        <div v-for="(list, cat) in formationsByCategory" :key="cat">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 capitalize">{{ cat }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              v-for="f in list"
              :key="f.slug"
              type="button"
              @click="onToggleMulti(f.slug)"
              class="flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-xs font-semibold"
              :class="(selIds || []).includes(f.slug) ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'"
            >
              <span class="material-icons-outlined text-sm flex-shrink-0" :style="(selIds || []).includes(f.slug) ? {} : { color: f.color || '#94a3b8' }">{{ f.icon || 'school' }}</span>
              <div class="min-w-0">
                <span class="block truncate font-bold">{{ f.label }}</span>
                <span class="text-[10px] opacity-60">{{ f.slug }}</span>
              </div>
              <span v-if="(selIds || []).includes(f.slug)" class="material-icons-outlined text-sm ml-auto flex-shrink-0">check</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* minimal local styles to resemble existing admin controls */
</style>