<script setup>
import { defineProps } from 'vue';
import QuestionItem from './QuestionItem.vue';

const props = defineProps({
  group: Object,
  responses: Object,
  unanswered: Boolean,
});
</script>

<template>
  <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white">
    <!-- <div class="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-indigo-600/5 flex items-center justify-center">
        <span class="material-icons-outlined text-indigo-600 text-lg">{{ props.group.icon }}</span>
      </div>
      <h2 class="text-base font-bold text-gray-800">{{ props.group.title }}</h2>
    </div> -->
    <div class="p-6 md:p-8 space-y-8">
      <QuestionItem
        v-for="q in props.group.questions"
        :key="q.id"
        :question="q"
        :responses="props.responses"
        :unanswered="props.unanswered"
      />
    </div>
  </div>
</template>
