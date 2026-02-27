<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F0F4F8] font-outfit">
    <SiteHeader />
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-10 md:py-14">
      <div class="text-center mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary mb-2">À Propos</h1>
        <p class="text-gray-400 text-sm font-bold uppercase tracking-widest">Qui sommes-nous</p>
      </div>
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white p-8">
        <section class="space-y-6 text-sm leading-relaxed text-gray-700">
           <p>Informations sur notre organisme.</p>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>
