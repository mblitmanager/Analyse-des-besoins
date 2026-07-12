<script setup>
import { defineEmits, defineProps } from 'vue';

const props = defineProps({
  rule: { type: Object, required: true },
  showOrder: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
});

const emits = defineEmits(['edit', 'delete', 'toggle-active']);

function onEdit() { emits('edit', props.rule); }
function onDelete() { emits('delete', props.rule); }
function onToggleActive() { emits('toggle-active', props.rule); }
</script>

<template>
  <div :class="['bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6', compact ? 'py-3 px-4' : '']" :aria-disabled="props.rule.isActive === false">
    <div v-if="showOrder" class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-black text-xs">{{ (rule.order || 0) + 1 }}</div>
    <div class="flex-1 space-y-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition : {{ rule.condition }}</p>
      <p class="text-xs font-black text-slate-900 leading-tight">
        <span class="text-slate-400">P1: {{ rule.conditionP1 || '-' }}</span>
        <span class="mx-2 text-slate-300">|</span>
        <span class="text-slate-400">P2: {{ rule.conditionP2 || '-' }}</span>
      </p>
      <div class="mt-2 flex items-center gap-2">
        <span class="px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg w-fit shadow-sm">{{ rule.formation1 }}</span>
        <span v-if="rule.formation2" class="px-2.5 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-lg">{{ rule.formation2 }}</span>
      </div>
      <p v-if="rule.parcoursTitle" class="text-[11px] text-slate-500 mt-1 font-bold">{{ rule.parcoursTitle }}</p>
      <p v-if="rule.explanationMessage" class="text-[12px] text-slate-600 mt-1">{{ rule.explanationMessage }}</p>
    </div>

    <div class="flex items-center gap-2 md:ml-4">
      <span v-if="rule.requireTest" class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1">
        <span class="material-icons-outlined text-[10px]">quiz</span>
        Test requis
      </span>
      <button @click="onEdit" class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white flex items-center justify-center transition-all">
        <span class="material-icons-outlined text-sm">edit</span>
      </button>
      <button @click="onDelete" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
        <span class="material-icons-outlined text-sm">delete</span>
      </button>
      <button @click="onToggleActive" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all" title="Activer / Désactiver">
        <span class="material-icons-outlined text-sm">{{ rule.isActive !== false ? 'visibility' : 'visibility_off' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>
