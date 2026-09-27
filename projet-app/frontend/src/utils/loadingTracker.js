import { reactive } from "vue";

/**
 * Global activity tracker behind the loading indicators (GlobalLoader.vue):
 * backend requests (reads and writes counted apart) and page navigations.
 */
export const loadingState = reactive({
  reads: 0,
  writes: 0,
  navigating: false,
});

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export function isWriteMethod(method) {
  return WRITE_METHODS.includes(String(method || "GET").toUpperCase());
}

/** Registers a request; returns the function to call once it has settled. */
export function trackRequest(method) {
  const kind = isWriteMethod(method) ? "writes" : "reads";
  loadingState[kind] += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    loadingState[kind] = Math.max(0, loadingState[kind] - 1);
  };
}

/** Axios: every request is tracked unless its config has `silent: true`. */
export function installAxiosTracking(axios) {
  axios.interceptors.request.use((config) => {
    if (!config.silent) config.__endTracking = trackRequest(config.method);
    return config;
  });
  axios.interceptors.response.use(
    (response) => {
      response.config?.__endTracking?.();
      return response;
    },
    (error) => {
      error?.config?.__endTracking?.();
      return Promise.reject(error);
    },
  );
}

/** fetch: only calls to the backend API are tracked (not documents, assets...). */
export function installFetchTracking(apiBaseUrl) {
  if (typeof window === "undefined" || !window.fetch || window.fetch.__tracked) return;
  const originalFetch = window.fetch.bind(window);
  const apiPrefix = String(apiBaseUrl || "").replace(/\/$/, "");
  const trackedFetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!apiPrefix || !url.startsWith(apiPrefix)) return originalFetch(input, init);
    const end = trackRequest(init.method || (typeof input === "object" && input?.method) || "GET");
    return originalFetch(input, init).finally(end);
  };
  trackedFetch.__tracked = true;
  window.fetch = trackedFetch;
}

/** Router: page changes, including lazy-loaded page chunks. */
export function installRouterTracking(router) {
  router.beforeEach(() => {
    loadingState.navigating = true;
  });
  router.afterEach(() => {
    loadingState.navigating = false;
  });
  router.onError(() => {
    loadingState.navigating = false;
  });
}
