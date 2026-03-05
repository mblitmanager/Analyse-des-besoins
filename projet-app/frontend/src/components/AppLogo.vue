<script setup>
import { reactive } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

// Track which logos exist (images placed in public/logos/...)
const logosVisible = reactive({ aopia: true, like: true })
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- AOPIA logo: shown when brand is 'aopia' or not set -->
    <img
      v-if="logosVisible.aopia && (store.brand === 'aopia' || store.brand === 'nsconseil')"
      src="/logos/Logo-AOPIA.png"
      alt="AOPIA"
      @error="logosVisible.aopia = false"
      class="h-8 object-contain"
    />
    <!-- LIKE logo: shown when brand is 'like' or not set -->
    <img
      v-if="logosVisible.like && (store.brand === 'like' || store.brand === 'nsconseil')"
      src="/logos/Logo_Like_Formation.png"
      alt="Like Formation"
      @error="logosVisible.like = false"
      class="h-8 object-contain"
    />
  </div>
</template>

<style scoped>
/* ensure logos align nicely */
</style>
