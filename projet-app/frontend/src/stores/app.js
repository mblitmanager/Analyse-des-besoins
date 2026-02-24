import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  const brand = ref('aopia') // Default brand
  const isDirectLink = ref(true)
  const workflowSteps = ref([]);

  function setBrand(newBrand) {
    if (['aopia', 'like', 'nsconseil'].includes(newBrand)) {
      brand.value = newBrand
      isDirectLink.value = false
    }
  }

  // Update HTML data-brand attribute for CSS targeting
  watch(brand, (newBrand) => {
    document.documentElement.setAttribute('data-brand', newBrand)
  }, { immediate: true })

  async function fetchWorkflow() {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/workflow`);
      workflowSteps.value = await response.json();
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
    }
  }

  function getNextRoute(currentPath) {
    // Exact match
    let currentIndex = workflowSteps.value.findIndex(s => s.route === currentPath);
    
    // If no exact match (e.g. root '/' matching Home), try some logic
    if (currentIndex === -1 && currentPath === '/') {
        currentIndex = workflowSteps.value.findIndex(s => s.code === 'IDENTIFICATION');
    }

    if (currentIndex !== -1 && currentIndex < workflowSteps.value.length - 1) {
      return workflowSteps.value[currentIndex + 1].route;
    }
    return null;
  }

  function getProgress(currentPath) {
    let currentIndex = workflowSteps.value.findIndex(s => s.route === currentPath);
    if (currentIndex === -1 && currentPath === '/') {
        currentIndex = workflowSteps.value.findIndex(s => s.code === 'IDENTIFICATION');
    }

    if (currentIndex !== -1) {
      return {
        current: currentIndex + 1,
        total: workflowSteps.value.length,
        percentage: ((currentIndex + 1) / workflowSteps.value.length) * 100,
        label: workflowSteps.value[currentIndex].label
      };
    }
    return { current: 1, total: 1, percentage: 0, label: '' };
  }

  return { 
    brand, 
    isDirectLink, 
    workflowSteps, 
    setBrand, 
    fetchWorkflow, 
    getNextRoute, 
    getProgress 
  }
})
