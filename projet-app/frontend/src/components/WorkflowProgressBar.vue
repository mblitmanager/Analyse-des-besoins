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
  <div v-if="store.actualWorkflowSteps.length > 0" class="w-full mb-10">
 
    
    <div class="relative">
      <!-- Background Bar -->
      <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-white">
        <!-- Progress Fill -->
        <div
          class="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative shadow-lg shadow-[#305364]/20"
          :style="{ width: progressData.percentage + '%', backgroundColor: '#305364' }"
        >
          <!-- Shine effect -->
          <div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
          
          <!-- Animated pulse marker at the end -->
          <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md flex items-center justify-center transform translate-x-1/2 border border-gray-100">
            <div class="w-2 h-2 bg-[#305364] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <!-- Step markers (dots without labels) -->
      <div class="absolute top-1/2 left-0 w-full -translate-y-1/2 flex justify-between px-1 pointer-events-none">
        <div v-for="n in store.actualWorkflowSteps.length" :key="n" 
             class="w-1 h-1 rounded-full bg-white/40"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}
</style>
