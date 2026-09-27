<script setup>
import { useAppStore } from './stores/app'
import ToastNotification from './components/ToastNotification.vue'
import GlobalLoader from './components/GlobalLoader.vue'

const store = useAppStore()
</script>

<template>
  <div id="app" :data-brand="store.brand" class="bg-gray-50 min-h-screen font-sans">
    <GlobalLoader />
    <router-view />
    <ToastNotification />
  </div>
</template>

<style>
/* Global resets or simple utilities if needed beyond tailwind */
</style>
