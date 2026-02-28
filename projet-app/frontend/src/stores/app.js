import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import router from '../router';

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
      const allSteps = await response.json();
      // only keep active steps for navigation/progress
      workflowSteps.value = allSteps.filter(s => s.isActive !== false);

      // register dynamic routes for each active step so router.push() works
      workflowSteps.value.forEach((step) => {
        const name = step.code.toLowerCase();
        // do not override existing admin/static routes
        if (!router.hasRoute(name) && !step.route.startsWith('/admin')) {
          // generic component which will render questions based on step code
          router.addRoute({
            path: step.route,
            name,
            component: () => import('../views/GenericWorkflowView.vue'),
          });
        }
      });
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

  const settings = ref({});

  async function fetchSetting(key) {
    if (settings.value[key] !== undefined) return settings.value[key];
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${apiBaseUrl}/settings/${key}`);
      if (res.ok) {
        const text = await res.text();
        if (!text || text === 'null') {
          settings.value[key] = null;
          return null;
        }
        try {
          const data = JSON.parse(text);
          settings.value[key] = data?.value;
          return data?.value;
        } catch (parseError) {
          console.error(`Invalid JSON for setting ${key}:`, text);
          return null;
        }
      }
    } catch (e) {
      console.error(`Failed to fetch setting ${key}`, e);
    }
    return null;
  }

  // Returns the next route skipping any workflow steps that currently have zero questions.
  // This performs an HTTP request for each candidate step so it is async.
  async function getNextRouteWithQuestions(currentPath) {
    // make sure we know the workflow steps, even if called from a view that didn't
    // fetch them yet (e.g. user reloaded mid-parcours)
    if (workflowSteps.value.length === 0) {
      await fetchWorkflow();
    }

    let next = getNextRoute(currentPath);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const formationSlug = localStorage.getItem('selected_formation_slug');
    while (next) {
      const step = workflowSteps.value.find(s => s.route === next);
      if (!step) break;
      const code = step.code.toLowerCase();
      try {
        // when checking for questions we need the same formation-aware filter
        let url = `${apiBaseUrl}/questions/workflow/${code}`;
        let params = '';
        if (formationSlug) {
          params = `?formation=${formationSlug}&scope=auto`;
        } else {
          params = `?scope=global`;
        }
      const res = await fetch(url + params);
      if (res.ok) {
        const text = await res.text();
        if (!text) return [];
        const questions = JSON.parse(text);
        if (Array.isArray(questions)) {
          let skipThisStep = questions.length === 0;

          // Special logic for mise_a_niveau/positionnement:
          // We unified the logic: default to true (skip if 0 questions),
          // but if AUTO_SKIP_XXX is explicitly 'false', we do NOT skip.
          if (code.includes('mise') || code === 'positionnement') {
            const settingKey = code.includes('mise') ? 'AUTO_SKIP_MISE_A_NIVEAU' : 'AUTO_SKIP_POSITIONNEMENT';
            const autoSkipValue = await fetchSetting(settingKey);
            if (autoSkipValue === 'false') {
              skipThisStep = false;
            }
          }

          if (skipThisStep) {
            next = getNextRoute(next);
            continue;
          }
        }
      }
      } catch (e) {
        // if the fetch fails just stop skipping
        console.error('Error while checking questions for step', code, e);
        break;
      }
      break;
    }
    return next;
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
    fetchSetting,
    getNextRoute, 
    getNextRouteWithQuestions,
    getProgress 
  }
})
