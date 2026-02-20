import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useAppStore = defineStore('app', () => {
  const brand = ref('aopia') // Default brand

  function setBrand(newBrand) {
    if (['aopia', 'like'].includes(newBrand)) {
      brand.value = newBrand
    }
  }

  // Update HTML data-brand attribute for CSS targeting
  watch(brand, (newBrand) => {
    document.documentElement.setAttribute('data-brand', newBrand)
  }, { immediate: true })

  return { brand, setBrand }
})
