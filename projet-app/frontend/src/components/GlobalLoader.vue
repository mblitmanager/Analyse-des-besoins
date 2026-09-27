<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { loadingState } from "../utils/loadingTracker";

// Indicators only appear when waiting lasts, so quick answers never flicker.
const BAR_DELAY_MS = 150;
const OVERLAY_DELAY_MS = 600;

const busy = computed(() => loadingState.reads + loadingState.writes > 0 || loadingState.navigating);
const saving = computed(() => loadingState.writes > 0);

const showBar = ref(false);
const showOverlay = ref(false);

function delayed(source, target, delay, timerRef) {
  watch(
    source,
    (active) => {
      clearTimeout(timerRef.timer);
      if (active) {
        timerRef.timer = setTimeout(() => {
          target.value = true;
        }, delay);
      } else {
        target.value = false;
      }
    },
    { immediate: true },
  );
}

const barTimerRef = { timer: null };
const overlayTimerRef = { timer: null };
delayed(busy, showBar, BAR_DELAY_MS, barTimerRef);
delayed(saving, showOverlay, OVERLAY_DELAY_MS, overlayTimerRef);

onBeforeUnmount(() => {
  clearTimeout(barTimerRef.timer);
  clearTimeout(overlayTimerRef.timer);
});
</script>

<template>
  <!-- Thin progress bar: any backend request or page change -->
  <div
    v-show="showBar"
    class="global-loader-bar"
    role="progressbar"
    aria-label="Chargement en cours"
    aria-busy="true"
  >
    <div class="global-loader-bar__indicator"></div>
  </div>

  <!-- Saving (submit, validation, PDF/email): blocks double clicks -->
  <transition name="global-loader-fade">
    <div
      v-if="showOverlay"
      class="global-loader-overlay"
      role="status"
      aria-live="polite"
      data-testid="global-loader-overlay"
    >
      <div class="global-loader-overlay__card">
        <div class="global-loader-overlay__spinner"></div>
        <p>Enregistrement en cours…</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.global-loader-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  overflow: hidden;
  background: color-mix(in srgb, var(--brand-primary, #ebb973) 25%, transparent);
  pointer-events: none;
}

.global-loader-bar__indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  background: var(--brand-primary, #ebb973);
  animation: global-loader-slide 1.1s ease-in-out infinite;
}

@keyframes global-loader-slide {
  from {
    left: -40%;
  }
  to {
    left: 100%;
  }
}

.global-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 27, 62, 0.25);
  backdrop-filter: blur(2px);
  cursor: progress;
}

.global-loader-overlay__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 40px -12px rgba(13, 27, 62, 0.3);
  font-weight: 700;
  font-size: 14px;
  color: #0d1b3e;
}

.global-loader-overlay__spinner {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--brand-primary, #ebb973);
  animation: global-loader-spin 0.8s linear infinite;
}

@keyframes global-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

.global-loader-fade-enter-active,
.global-loader-fade-leave-active {
  transition: opacity 0.15s ease;
}
.global-loader-fade-enter-from,
.global-loader-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .global-loader-bar__indicator,
  .global-loader-overlay__spinner {
    animation-duration: 3s;
  }
}
</style>
