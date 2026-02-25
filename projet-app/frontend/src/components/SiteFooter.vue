<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <footer class="bg-white border-t border-gray-100 px-8 py-8 mt-auto">
    <div class="max-w-5xl mx-auto flex flex-col items-center gap-6">
      
      

      <!-- Legal Links -->
      <nav class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        <a
          href="https://ns-conseil.com/reglement-interieur/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-brand-primary"
        >
          Règlement intérieur
        </a>
        <a
          href="https://ns-conseil.com/cgv/"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-brand-primary"
        >
          CGV
        </a>
        <router-link
          to="/mentions-legales"
          class="hover:text-brand-primary"
        >
          Mentions légales
        </router-link>
        <router-link
          to="/respect-vie-privee"
          class="hover:text-brand-primary"
        >
          Respect de la vie privée
        </router-link>
        <router-link
          to="/politique-confidentialite"
          class="hover:text-brand-primary"
        >
          Politique de confidentialité
        </router-link>
      </nav>
<!-- Support / Assistance -->
      <div class="text-center">
        <p class="text-sm text-gray-500">
          Besoin d'aide ? 
          <a href="mailto:contact@ns-conseil.com" class="text-brand-primary font-bold hover:underline ml-1">
            Contactez le support
          </a>
        </p>
      </div>
      <div class="text-[10px] text-gray-800 font-medium">
        &copy; {{ new Date().getFullYear() }} NS Conseil. Tous droits réservés.
      </div>
    </div>
  </footer>
</template>

<style scoped>
.text-brand-primary {
  color: #3b82f6; /* Ensure it uses the primary blue */
}
</style>
