<script setup>
import { useAppStore } from './stores/app'
const store = useAppStore()
</script>

<template>
  <div id="app" :data-brand="store.brand" class="bg-gray-50 min-h-screen font-sans">
    <router-view />
  </div>
</template>

<style>
/* Global resets or simple utilities if needed beyond tailwind */
</style>
