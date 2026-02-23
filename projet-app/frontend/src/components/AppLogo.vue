<script setup>
import { reactive } from 'vue'

// Track which logos exist (images placed in public/logos/...)
const logosVisible = reactive({ aopia: true, like: true, nsconseil: true })
</script>

<template>
  <div class="flex items-center gap-3">
    <img
      v-if="logosVisible.aopia"
      src="/logos/Logo-AOPIA.png"
      alt="AOPIA"
      @error="logosVisible.aopia=false"
      class="h-8 object-contain"
    />
    <img
      v-if="logosVisible.like"
      src="/logos/Logo_Like_Formation.png"
      alt="Like Formation"
      @error="logosVisible.like=false"
      class="h-8 object-contain"
    />
    <img
      v-if="logosVisible.nsconseil"
      src="/logos/logo_nsconseil.png"
      alt="NS Conseil"
      @error="logosVisible.nsconseil=false"
      class="h-8 object-contain"
    />
  </div>
</template>

<style scoped>
/* ensure logos align nicely */
</style>
