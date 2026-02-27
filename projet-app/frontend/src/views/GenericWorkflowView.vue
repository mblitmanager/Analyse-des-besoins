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
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Contenu dynamique pour la route <strong>{{ route.path }}</strong></p>
  </div>
</template>
