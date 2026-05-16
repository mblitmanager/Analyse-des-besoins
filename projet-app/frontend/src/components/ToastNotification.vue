<script setup>
import { useToastStore } from '../stores/toast';

const toastStore = useToastStore();
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id"
        class="pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-md animate-slide-in"
        :class="{
          'bg-white/90 border-slate-100 text-slate-900': toast.type === 'info',
          'bg-emerald-50/90 border-emerald-100 text-emerald-900': toast.type === 'success',
          'bg-rose-50/90 border-rose-100 text-rose-900': toast.type === 'error'
        }"
      >
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="{
            'bg-slate-900 text-white': toast.type === 'info',
            'bg-emerald-500 text-white': toast.type === 'success',
            'bg-rose-500 text-white': toast.type === 'error'
          }"
        >
          <span class="material-icons-outlined text-xl">
            {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}
          </span>
        </div>
        
        <div class="flex-1">
          <p class="text-sm font-black leading-tight">{{ toast.message }}</p>
        </div>

        <button 
          @click="toastStore.remove(toast.id)"
          class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors text-slate-400"
        >
          <span class="material-icons-outlined text-sm">close</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(30px) translateY(10px); }
  to { opacity: 1; transform: translateX(0) translateY(0); }
}
</style>
