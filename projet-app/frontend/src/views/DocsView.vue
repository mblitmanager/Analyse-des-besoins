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
  <div class="max-w-3xl mx-auto p-6">
    <div v-html="marked.parse(content)" />
  </div>
</template>

<style scoped>
/* simple styling */
.max-w-3xl img { max-width: 100%; }
</style>
