<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'

const route = useRoute()
const docKey = route.query.file || 'Presentation'
const content = ref('Chargement...')

onMounted(async () => {
  try {
    const file = docKey === 'USER_MANUAL' ? '/docs/USER_MANUAL.md' : '/docs/Presentation.md'
    const res = await fetch(file)
    content.value = await res.text()
  } catch (e) {
    content.value = 'Impossible de charger le document.'
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F0F4F8] font-outfit">
    <SiteHeader />
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-10 md:py-14">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">Documentation</h1>
        <p class="text-gray-400 text-sm font-bold uppercase tracking-widest">Informations et manuels utiles</p>
      </div>
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white p-8">
        <div v-html="marked.parse(content)" class="space-y-4 text-gray-700" />
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
/* simple styling */
.max-w-3xl img { max-width: 100%; }
</style>
