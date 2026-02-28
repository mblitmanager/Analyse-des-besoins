<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';

const router = useRouter();
const route = useRoute();
const store = useAppStore();

// if desired you can redirect to a specific component based on the route
onMounted(() => {
  // the route name corresponds to step.code.toLowerCase()
  // if we know a mapping, we could redirect here; for now we just keep user on this generic page
});
</script>

<template>
  <div class="min-h-screen flex flex-col font-outfit bg-[#F0F4F8]">
    <SiteHeader />
    
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 pb-32 flex items-center justify-center">
      <div class="bg-white rounded-3xl shadow-xl p-10 border border-white text-center">
        <p class="text-gray-500 font-bold">Contenu dynamique pour la route <strong>{{ route.path }}</strong></p>
        <p class="text-xs text-gray-400 mt-2 uppercase tracking-widest">Cette étape est en cours de configuration</p>
      </div>
    </main>

    <!-- Bottom Actions Sticky -->
    <div class="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 z-40">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <button
          @click="router.push('/formations')"
          class="flex items-center gap-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
        >
          <span class="material-icons-outlined">arrow_back</span>
          Précédent
        </button>
        <button
          @click="router.push(route.path)"
          :disabled="false"
          class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          Continuer
        </button>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>
