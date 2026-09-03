import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          excel: ['exceljs'],
          charts: ['chart.js', 'vue-chartjs'],
          pdf: ['jspdf', 'html2canvas']
        }
      }
    }
  }
})
