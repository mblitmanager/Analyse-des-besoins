<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';

const props = defineProps({
  customPath: {
    type: String,
    default: null
  }
});

const route = useRoute();
const store = useAppStore();

const progressData = computed(() => {
  const path = props.customPath || (route ? route.path : '/');
  return store.getProgress(path);
});
</script>

<template>
  <div v-if="store.actualWorkflowSteps.length > 0" class="w-full mb-8">
    <div class="flex justify-between items-end mb-2">
      <div class="flex flex-col">
        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          Étape {{ progressData.current }} sur {{ progressData.total }}
        </span>
        <span class="text-sm font-bold text-blue-900">
          {{ progressData.label || 'En cours...' }}
        </span>
      </div>
      <span class="text-xs font-black text-brand-primary">{{ Math.round(progressData.percentage) }}%</span>
    </div>
    <div class="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-sm border border-gray-100">
      <div 
        class="h-full transition-all duration-700 ease-out" 
        :style="{ width: progressData.percentage + '%', backgroundColor: 'var(--brand-primary, #005A9C)' }"
      ></div>
    </div>
  </div>
</template>
