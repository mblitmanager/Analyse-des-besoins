<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  formation: String,
  level: String
});

const emit = defineEmits(['close', 'changeFormation', 'continue']);

const title = computed(() => `Félicitations pour votre niveau ${props.level || ''} !`);

function handleContinue() {
  emit('continue');
}

function handleChangeFormation() {
  emit('changeFormation');
}
</script>

<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-[#0d1b3e]/60 backdrop-blur-md" @click="$emit('close')"></div>
      
      <!-- Modal Container -->
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-xl relative overflow-hidden animate-scale-up border border-white/20">
        <!-- Top accent gradient -->
        <div class="h-2 bg-gradient-to-r from-blue-400 via-brand-primary to-indigo-500"></div>
        
        <div class="p-8 md:p-12">
          <!-- Icon Header -->
          <div class="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner transform rotate-3">
             <span class="material-icons-outlined text-4xl transform -rotate-3">auto_awesome</span>
          </div>
          
          <h3 class="text-2xl md:text-3xl font-black heading-primary text-center mb-4 leading-tight">
            {{ title }}
          </h3>
          
          <div class="space-y-4 mb-10">
            <p class="text-gray-500 text-center leading-relaxed">
              Il semble que vous maîtrisez déjà très bien la formation <span class="font-black text-blue-900">{{ formation }}</span>. 
            </p>
            <p class="text-gray-500 text-center leading-relaxed font-medium">
              Nous vous suggérons d'explorer une <span class="text-brand-primary font-bold">nouvelle thématique</span> pour enrichir encore plus vos compétences, mais le choix vous appartient !
            </p>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col gap-4">
            <button 
              @click="handleChangeFormation"
              class="w-full py-4-5 bg-brand-primary hover:bg-brand-secondary text-[#428496] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-primary/20 transform hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span class="material-icons-outlined text-lg">grid_view</span>
              <span>Découvrir d'autres formations</span>
            </button>
            
            <button 
              @click="handleContinue"
              class="w-full py-4 text-gray-400 hover:text-gray-600 font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2"
            >
              <span>Continuer avec {{ formation }}</span>
              <span class="material-icons-outlined text-sm">arrow_forward</span>
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
