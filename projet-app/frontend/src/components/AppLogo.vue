<script setup>
import { reactive } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

// Track which logos exist (images placed in public/logos/...)
const logosVisible = reactive({ aopia: true, like: true })
</script>

<template>
  <div class="flex items-center gap-3">
    <img
      v-if="logosVisible.aopia"
      src="/logos/Logo-AOPIA.png"
      alt="AOPIA"
      @error="logosVisible.aopia = false"
      class="h-8 md:h-10 object-contain"
    />
    <div v-if="logosVisible.aopia && logosVisible.like" class="w-px h-6 bg-gray-200 mx-1"></div>
    <img
      v-if="logosVisible.like"
      src="/logos/Logo_Like_Formation.png"
      alt="Like Formation"
      @error="logosVisible.like = false"
      class="h-8 md:h-10 object-contain"
    />
  </div>
</template>

<style scoped>
/* ensure logos align nicely */
</style>
