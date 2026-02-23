<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goHome() {
  router.push('/')
}

function cancel() {
  if (confirm('Voulez-vous annuler et revenir en arrière ?')) {
    router.back()
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex gap-3">
    <button @click="goHome" class="btn-primary px-4 py-2">Accueil</button>
    <button @click="cancel" class="btn btn-outline px-4 py-2">Annuler</button>
  </div>
</template>

<style scoped>
.btn-outline { background: rgba(255,255,255,0.9); }
</style>
