<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  formation: String,
  level: String,
  customMessage: { type: String, default: '' },
  suggestedFormations: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'changeFormation', 'continue']);

const title = computed(() => `Félicitations pour votre niveau ${props.level || ''} !`);

function handleContinue() {
  emit('continue');
}

function handleChangeFormation(formation) {
  emit('changeFormation', formation);
}
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-100 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-[#0d1b3e]/60 backdrop-blur-md" @click="$emit('close')"></div>
      
      <!-- Modal Container -->
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden animate-scale-up border border-white/20">
        <!-- Top accent gradient -->
        <div class="h-2 bg-blue-200"></div>
        
        <div class="p-8 md:p-12">
          <!-- Icon Header -->
          
          <h3 class="text-2xl md:text-3xl font-black heading-primary text-center mb-4 leading-tight">
            {{ title }}
          </h3>
          
          <div class="space-y-4 mb-10">
            <p class="text-gray-500 text-center leading-relaxed text-lg">
              {{ customMessage || `Vous avez validé le niveau` }} <strong class="text-blue-900">{{ level }}</strong>{{ customMessage ? '' : `, qui est déjà supérieur au niveau cible de notre formation` }} <strong v-if="!customMessage" class="text-blue-900">{{ formation }}</strong>.
            </p>
            <p v-if="suggestedFormations.length > 0" class="text-gray-500 text-center leading-relaxed font-medium">
              Choix de parcours disponibles :
            </p>
          </div>
          
          <!-- Suggested Formations -->
          <div v-if="suggestedFormations.length > 0" class="space-y-3 mb-8">
            <button
              v-for="suggestedFormation in suggestedFormations"
              :key="suggestedFormation.id"
              @click="handleChangeFormation(suggestedFormation)"
              class="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-2xl transition-all text-left flex items-center gap-4"
            >
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <span class="material-icons-outlined text-blue-600">school</span>
              </div>
              <div class="flex-1">
                <h4 class="font-black text-gray-900 text-sm">{{ suggestedFormation.label || suggestedFormation.title }}</h4>
                <p class="text-xs text-gray-500 mt-1">Niveau adapté à votre profil</p>
              </div>
              <span class="material-icons-outlined text-gray-400">arrow_forward</span>
            </button>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col gap-4">
            
            <button 
              @click="handleContinue"
              class="px-12 py-5 bg-[#ebb872] text-[#305364] rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#ebb872]/20 hover:brightness-105 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:translate-y-0 cursor-pointer"
            >
              <span>Continuer avec {{ formation }}</span>
              <span class="material-icons-outlined text-sm">arrow_forward</span>
            </button>
            <button
              @click="handleChangeFormation()"
              class="w-full py-4-5 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span class="material-icons-outlined text-lg">grid_view</span>
              <span>Découvrir d'autres formations</span>
            </button>
          </div>
          
        </div>
        
        <!-- Footer Info -->
        <div class="bg-gray-50 p-4 border-t border-gray-100/50 text-center">
           <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
             <span class="material-icons-outlined text-[10px]">info</span>
             Ce conseil est basé sur vos excellents résultats au test
           </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}

.heading-primary {
  color: #0d1b3e;
}

.animate-scale-up {
  animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.4s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.py-4-5 {
  padding-top: 1.125rem;
  padding-bottom: 1.125rem;
}
</style>
