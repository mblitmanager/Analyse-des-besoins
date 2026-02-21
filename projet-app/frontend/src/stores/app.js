import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  const brand = ref('aopia') // Default brand
  const isDirectLink = ref(true)

  function setBrand(newBrand) {
    if (['aopia', 'like', 'nsconseil'].includes(newBrand)) {
      brand.value = newBrand
      isDirectLink.value = false
    }
  }

  // Update HTML data-brand attribute for CSS targeting
  watch(brand, (newBrand) => {
    document.documentElement.setAttribute('data-brand', newBrand)
  }, { immediate: true })

  return { brand, isDirectLink, setBrand }
})
