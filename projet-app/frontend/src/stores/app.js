import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import axios from 'axios'
import router from '../router';

export const useAppStore = defineStore('app', () => {
  const brand = ref('aopia') // Default brand
  const isDirectLink = ref(true)
  const isP3Mode = ref(localStorage.getItem('is_p3_mode') === 'true')
  const workflowSteps = ref([]);

  function setP3Mode(active) {
    isP3Mode.value = active;
    if (active) localStorage.setItem('is_p3_mode', 'true');
    else localStorage.removeItem('is_p3_mode');
  }

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
      const response = await axios.get(`${apiBaseUrl}/workflow`);
      const allSteps = response.data;
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

  async function fetchSetting(key, options = {}) {
    const forceRefresh = options?.force === true;
    if (!forceRefresh && settings.value[key] !== undefined) return settings.value[key];
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await axios.get(`${apiBaseUrl}/settings/${key}`);
      const data = res.data;
      if (!data || data === 'null') {
        settings.value[key] = null;
        return null;
      }
      settings.value[key] = data?.value;
      return data?.value;
    } catch (e) {
      console.error(`Failed to fetch setting ${key}`, e);
    }
    return null;
  }

  function invalidateSetting(key) {
    if (key) {
      delete settings.value[key];
      return;
    }
    settings.value = {};
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
      const code = step.code.toUpperCase();
      const codeLower = code.toLowerCase();

      // POSITIONNEMENT is level-based, so the generic /questions/workflow/{code} check
      // can incorrectly return 0 even when questions exist for later levels.
      // We always allow navigation to the Positionnement step; PositionnementView handles the real skip logic.
      if (codeLower === 'positionnement') {
        break;
      }
      
      // Global and P3 skip logic
      let forceSkip = false;
      if (isP3Mode.value) {
        // In P3 mode, we skip P1 (PREREQUIS), Availabilities, and Complementary questions
        if (code === 'PREREQUIS' || code === 'AVAILABILITIES' || code === 'COMPLEMENTARY') {
          forceSkip = true;
        }
      }

      // Check global auto-skip settings (Skip unconditionally if 'true')
      // NOTE: We EXCLUDE MISE_A_NIVEAU and POSITIONNEMENT from unconditional skip
      // because they should only skip if QUESTIONS are missing (as per user UI).
      if (!forceSkip && !codeLower.includes('mise') && codeLower !== 'positionnement') {
        const skipSettingKey = `AUTO_SKIP_${code}`;
        const autoSkip = await fetchSetting(skipSettingKey);
        if (autoSkip === 'true') {
          forceSkip = true;
        }
      }

      if (forceSkip) {
        next = getNextRoute(next);
        continue;
      }

      try {
        // when checking for questions we need the same formation-aware filter
        let url = `${apiBaseUrl}/questions/workflow/${codeLower}`;
        let params = '';
        if (formationSlug) {
          params = `?formation=${formationSlug}&scope=auto`;
        } else {
          params = `?scope=global`;
        }
        const res = await axios.get(url + params);
        const questions = res.data;
        if (Array.isArray(questions)) {
            const NO_QUESTION_STEPS = ['identification', 'formation_selection', 'resultats', 'validation'];
            let skipThisStep = questions.length === 0 && !NO_QUESTION_STEPS.includes(codeLower);

            // Special logic for mise_a_niveau/positionnement:
            // They skip naturally if questions.length === 0.
            // BUT: if the setting is explicitly 'false', we FORCE them to show even if 0 questions.
            // (Note: The user UI says 'Allow skip if no questions', so if it's 'true' or missing, 
            // the questions.length === 0 will handle the skip. If 'false', we prevent the skip.)
            if (codeLower.includes('mise') || codeLower === 'positionnement') {
              const settingKey = codeLower.includes('mise') ? 'AUTO_SKIP_MISE_A_NIVEAU' : 'AUTO_SKIP_POSITIONNEMENT';
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
      } catch (e) {
        // if the fetch fails just stop skipping
        console.error('Error while checking questions for step', code, e);
        break;
      }
      break;
    }
    return next;
  }

  const actualWorkflowSteps = ref([]);
  const isUpdatingWorkflow = ref(false);

  async function updateActualWorkflow() {
    if (workflowSteps.value.length === 0) {
      await fetchWorkflow();
    }
    
    isUpdatingWorkflow.value = true;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const formationSlug = localStorage.getItem('selected_formation_slug');
    const actual = [];

    for (const step of workflowSteps.value) {
      const code = step.code.toUpperCase();
      const codeLower = code.toLowerCase();

      // Always include positionnement: question availability is level-based and checked in the view.
      if (codeLower === 'positionnement') {
        actual.push(step);
        continue;
      }
      
      // Global and P3 skip logic
      let forceSkip = false;
      if (isP3Mode.value) {
        if (code === 'PREREQUIS' || code === 'AVAILABILITIES' || code === 'COMPLEMENTARY') {
          forceSkip = true;
        }
      }

      if (!forceSkip && !codeLower.includes('mise') && codeLower !== 'positionnement') {
        const skipSettingKey = `AUTO_SKIP_${code}`;
        const autoSkip = await fetchSetting(skipSettingKey);
        if (autoSkip === 'true') {
          forceSkip = true;
        }
      }

      if (forceSkip) continue;

      // Check for questions
      try {
        let url = `${apiBaseUrl}/questions/workflow/${codeLower}`;
        let params = formationSlug ? `?formation=${formationSlug}&scope=auto` : `?scope=global`;
        
        const res = await axios.get(url + params);
        const questions = res.data;
        if (Array.isArray(questions)) {
            const NO_QUESTION_STEPS = ['identification', 'formation_selection', 'resultats', 'validation'];
            let skipThisStep = questions.length === 0 && !NO_QUESTION_STEPS.includes(codeLower);

            if (codeLower.includes('mise') || codeLower === 'positionnement') {
              const settingKey = codeLower.includes('mise') ? 'AUTO_SKIP_MISE_A_NIVEAU' : 'AUTO_SKIP_POSITIONNEMENT';
              const autoSkipValue = await fetchSetting(settingKey);
              if (autoSkipValue === 'false') {
                skipThisStep = false;
              }
            }

            if (!skipThisStep) {
              actual.push(step);
            }
          }
      } catch (e) {
        actual.push(step);
      }
    }
    
    actualWorkflowSteps.value = actual;
    isUpdatingWorkflow.value = false;
  }

  function getProgress(currentPath) {
    const list = actualWorkflowSteps.value.length > 0 ? actualWorkflowSteps.value : workflowSteps.value;
    
    let currentIndex = list.findIndex(s => s.route === currentPath);
    if (currentIndex === -1 && currentPath === '/') {
        currentIndex = list.findIndex(s => s.code === 'IDENTIFICATION');
    }

    if (currentIndex !== -1) {
      return {
        current: currentIndex + 1,
        total: list.length,
        percentage: ((currentIndex + 1) / list.length) * 100,
        label: list[currentIndex].label
      };
    }
    return { current: 1, total: Math.max(1, list.length), percentage: 0, label: '' };
  }

  return { 
    brand, 
    isDirectLink, 
    workflowSteps, 
    actualWorkflowSteps,
    isUpdatingWorkflow,
    setBrand, 
    isP3Mode,
    setP3Mode,
    fetchWorkflow, 
    updateActualWorkflow,
    fetchSetting,
    invalidateSetting,
    getNextRoute, 
    getNextRouteWithQuestions,
    getProgress 
  }
})
