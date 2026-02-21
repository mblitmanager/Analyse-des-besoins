<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";

const store = useAppStore();
const router = useRouter();
const sessionId = localStorage.getItem("session_id");

const questions = ref([]);
const responses = ref({});
const loading = ref(true);
const submitting = ref(false);

onMounted(async () => {
  if (!sessionId) {
    router.push("/");
    return;
  }
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${apiBaseUrl}/questions/workflow/availabilities`);
    questions.value = await res.json();

    // Initialize responses
    questions.value.forEach((q) => {
      if (q.metadata?.type === "multi_select") {
        responses.value[q.text] = [];
      } else {
        responses.value[q.text] = "";
      }
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
  } finally {
    loading.value = false;
  }
});

function toggleMultiSelect(qText, option) {
  const index = responses.value[qText].indexOf(option);
  if (index > -1) responses.value[qText].splice(index, 1);
  else responses.value[qText].push(option);
}

async function nextStep() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await fetch(`${apiBaseUrl}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilities: responses.value }),
    });
    const nextRoute = store.getNextRoute("/availabilities");
    router.push(nextRoute || "/validation");
  } catch (error) {
    console.error("Failed to save availabilities:", error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit p-8">
    <div class="max-w-2xl mx-auto w-full">
      <div class="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <h1
          class="text-3xl font-black text-[#0D1B3E] mb-2 text-center italic uppercase tracking-tight"
        >
          Vos Disponibilités
        </h1>
        <div class="flex items-center justify-between mb-2 px-1">
          <span
            class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
            >Progression</span
          >
          <span class="text-[10px] text-brand-primary font-bold"
            >Étape {{ store.getProgress("/availabilities").current }}/{{
              store.getProgress("/availabilities").total
            }}</span
          >
        </div>
        <div
          class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-10"
        >
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            :style="{
              width: store.getProgress('/availabilities').percentage + '%',
            }"
          ></div>
        </div>
        <p
          class="text-gray-400 text-center mb-10 font-bold uppercase tracking-widest text-xs"
        >
          Planifions votre parcours ensemble
        </p>

        <div v-if="loading" class="flex justify-center py-20">
          <div
            class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
          ></div>
        </div>

        <div v-else class="space-y-8">
          <div v-for="q in questions" :key="q.id" class="space-y-3">
            <div class="flex items-center gap-2 mb-1">
              <span
                v-if="q.icon"
                class="material-icons-outlined text-brand-primary text-sm"
                >{{ q.icon }}</span
              >
              <label
                class="block text-sm font-black text-gray-700 uppercase tracking-wider"
                >{{ q.text }}</label
              >
            </div>

            <!-- Multi-Select Type (Slots) -->
            <div
              v-if="q.metadata?.type === 'multi_select'"
              class="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <button
                v-for="(opt, idx) in q.options"
                :key="opt"
                @click="toggleMultiSelect(q.text, opt)"
                :class="
                  responses[q.text].includes(opt)
                    ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20'
                    : 'bg-gray-50 text-gray-400 border-transparent'
                "
                class="py-4 px-2 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group"
              >
                <span
                  v-if="q.metadata.icons?.[idx]"
                  class="material-icons-outlined text-2xl"
                  :class="
                    responses[q.text].includes(opt)
                      ? 'text-white'
                      : 'text-gray-300 group-hover:text-brand-primary'
                  "
                >
                  {{ q.metadata.icons[idx] }}
                </span>
                <span
                  class="font-black uppercase tracking-widest text-[10px]"
                  >{{ opt }}</span
                >
              </button>
            </div>

            <!-- Textarea Type -->
            <textarea
              v-else-if="q.metadata?.type === 'textarea'"
              v-model="responses[q.text]"
              :rows="q.metadata.rows || 3"
              :placeholder="q.metadata.placeholder"
              class="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-gray-700 shadow-sm"
            ></textarea>

            <!-- Default Text Type -->
            <input
              v-else
              v-model="responses[q.text]"
              type="text"
              :placeholder="q.metadata?.placeholder || ''"
              class="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-gray-700 shadow-sm"
            />
          </div>

          <button
            @click="nextStep"
            :disabled="submitting"
            class="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <span v-if="!submitting">Valider mes disponibilités</span>
            <span
              v-else
              class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
            ></span>
            <span v-if="!submitting" class="material-icons-outlined text-xl"
              >event_available</span
            >
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
