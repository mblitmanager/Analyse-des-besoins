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
        <!-- <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          Étape {{ progressData.current }} sur {{ progressData.total }}
        </span> -->
        <!-- <span class="text-sm font-bold text-blue-900">
          {{ progressData.label || 'En cours...' }}
        </span> -->
      </div>
      <!-- <span class="text-xs font-black text-brand-primary">{{ Math.round(progressData.percentage) }}%</span> -->
    </div>
   <div class="w-full">
  <!-- Barre -->
  <div class="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
    
    <!-- Progress -->
    <div
      class="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-md"
      :style="{ width: progressData.percentage + '%' }"
    ></div>

    <!-- Pourcentage -->
    <span 
      class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700"
    >
      <!-- {{ progressData.percentage }}% -->
    </span>

  </div>
</div>
  </div>
</template>
