<script setup>
import AppLogo from './AppLogo.vue';
</script>

<template>
  <header class="site-header border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
    <div class="w-24 md:w-48"></div> <!-- Spacer for balance -->
    <div class="flex-1 flex justify-center">
      <AppLogo />
    </div>
    <div class="w-24 md:w-48 flex justify-end">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  /* Using the background color from style.css if needed, but the user explicitly changed it in style.css to #eae2d6 */
  background-color: #eae2d6; /* Matching user's latest change in style.css */
}
</style>
