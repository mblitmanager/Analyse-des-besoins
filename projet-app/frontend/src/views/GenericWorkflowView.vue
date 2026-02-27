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
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 py-10 flex items-center justify-center">
      <div class="bg-white rounded-3xl shadow-xl p-10 border border-white text-center">
        <p class="text-gray-500 font-bold">Contenu dynamique pour la route <strong>{{ route.path }}</strong></p>
        <p class="text-xs text-gray-400 mt-2 uppercase tracking-widest">Cette étape est en cours de configuration</p>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>
