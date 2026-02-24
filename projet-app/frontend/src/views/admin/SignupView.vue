<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const error = ref('')

async function handleSignup() {
  error.value = ''
  loading.value = true
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${apiBaseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value, name: name.value })
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'Signup failed')
    }
    // On success go to login
    router.push('/admin/login')
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'inscription'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 font-outfit">
    <div class="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-extrabold heading-primary">Créer un compte administrateur</h1>
        <p class="text-gray-400 text-xs mt-1">Accès réservé au personnel autorisé</p>
      </div>

      <form @submit.prevent="handleSignup" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Nom complet</label>
          <input v-model="name" required placeholder="Jean Dupont" class="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Email</label>
          <input v-model="email" type="email" required placeholder="admin@example.com" class="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1">Mot de passe</label>
          <input v-model="password" type="password" required placeholder="••••••••" class="w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none" />
        </div>

        <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{{ error }}</div>

        <button type="submit" :disabled="loading" class="w-full btn-primary py-3 font-bold rounded-xl">
          <span v-if="!loading">S'inscrire</span>
          <span v-else class="animate-spin inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full"></span>
        </button>
      </form>

      <div class="text-center text-sm text-gray-500">
        <button @click="router.push('/admin/login')" class="underline">J'ai déjà un compte — Se connecter</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
.font-outfit { font-family: 'Outfit', sans-serif; }
</style>
