<script setup>
import { computed } from 'vue';
import { formatBoldText } from '../utils/formatText';

const props = defineProps({
  question: Object,
  responses: Object,
  unanswered: Boolean,
});

const isEmpty = computed(() => {
  const ans = props.responses[props.question.id];
  return ans === null || ans === '' || ans === undefined;
});
</script>

<template>
  <div :class="['space-y-3', { 'border border-red-400 rounded-lg p-3': props.unanswered && isEmpty }]">
    <div class="flex items-center gap-2">
      <p class="text-base font-bold heading-primary leading-snug">{{ props.question.text }}</p>
    </div>

    <!-- TYPE: CHECKBOX (Multiple choices) -->
    <div v-if="props.question.responseType === 'checkbox' || props.question.metadata?.type === 'multi_select'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <label
        v-for="opt in props.question.options"
        :key="opt"
        class="option-card"
        :class="Array.isArray(props.responses[props.question.id]) && props.responses[props.question.id].includes(opt) ? 'option-card--selected' : 'option-card--default'"
      >
        <input
          type="checkbox"
          :value="opt"
          v-model="props.responses[props.question.id]"
          class="hidden"
        />
        <span class="option-card__label" v-html="formatBoldText(opt)"></span>
        <div
          class="option-card__radio"
          :class="Array.isArray(props.responses[props.question.id]) && props.responses[props.question.id].includes(opt) ? 'option-card__radio--selected' : 'option-card__radio--default'"
        >
          <span v-if="Array.isArray(props.responses[props.question.id]) && props.responses[props.question.id].includes(opt)" class="material-icons-outlined text-white text-[14px]">check</span>
        </div>
      </label>
    </div>

    <!-- TYPE: QCM or RADIO_TOGGLE (Single choice) -->
    <div v-else-if="props.question.responseType === 'qcm' || props.question.metadata?.type === 'radio_toggle' || props.question.metadata?.type === 'qcm' || (props.question.options && props.question.options.length > 0)" 
         class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <label
        v-for="opt in props.question.options"
        :key="opt"
        class="option-card"
        :class="props.responses[props.question.id] === opt ? 'option-card--selected' : 'option-card--default'"
      >
        <input
          type="radio"
          :name="'q-' + props.question.id"
          v-model="props.responses[props.question.id]"
          :value="opt"
          class="hidden"
        />
        <span class="option-card__label" v-html="formatBoldText(opt)"></span>
        <div
          class="option-card__radio"
          :class="props.responses[props.question.id] === opt ? 'option-card__radio--selected' : 'option-card__radio--default'"
        >
          <div v-if="props.responses[props.question.id] === opt" class="option-card__radio-dot"></div>
        </div>
      </label>
    </div>

    <!-- TYPE: TEXT (Free input) -->
    <div v-else-if="props.question.responseType === 'text'" class="mt-2">
      <textarea 
        v-model="props.responses[props.question.id]" 
        rows="3"
        class="Wizi-input min-h-[100px] resize-none focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
        placeholder="Saisissez votre réponse ici..."
      ></textarea>
    </div>

    <!-- FALLBACK (In case of weird type) -->
    <div v-else>
      <input v-model="props.responses[props.question.id]" type="text" class="Wizi-input" />
    </div>
  </div>
</template>

<style scoped>
.option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  min-height: 3.5rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card--default:hover {
  border-color: #d1d5db;
  background: #e9ebee;
}

.option-card--selected {
  border-color: var(--brand-primary, #3b82f6);
  background: #eef2ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.option-card__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  text-align: left;
  flex: 1;
}

.option-card--selected .option-card__label {
  color: var(--brand-primary, #3b82f6);
}

.option-card__radio {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.option-card__radio--selected {
  border-color: var(--brand-primary, #3b82f6);
  background: var(--brand-primary, #3b82f6);
}

.option-card__radio-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: white;
}
</style>
