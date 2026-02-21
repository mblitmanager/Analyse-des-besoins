<script setup>
import { ref, onMounted } from "vue";
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
    const res = await fetch(`${apiBaseUrl}/questions/workflow/complementary`);
    questions.value = await res.json();

    // Initialize responses
    questions.value.forEach((q) => {
      if (q.metadata?.type === "radio_toggle") {
        responses.value[q.text] = "Non";
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

async function nextStep() {
  submitting.value = true;
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    await fetch(`${apiBaseUrl}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complementaryQuestions: responses.value }),
    });
    const nextRoute = store.getNextRoute("/complementary");
    router.push(nextRoute || "/availabilities");
  } catch (error) {
    console.error("Failed to save complementary questions:", error);
  } finally {
    submitting.value = false;
  }
}

function shouldShowQuestion(q) {
  if (!q.metadata?.condition) return True;

  // Basic support for "handicap == 'Oui'"
  if (q.metadata.condition === "handicap == 'Oui'") {
    // Search for handicap question response
    const handicapQ = questions.value.find((item) =>
      item.text.includes("handicap"),
    );
    return handicapQ && responses.value[handicapQ.text] === "Oui";
  }
  return true;
}
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] flex flex-col font-outfit p-8">
    <div class="max-w-2xl mx-auto w-full">
      <div class="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <h1
          class="text-3xl font-black text-[#0D1B3E] mb-2 text-center italic uppercase tracking-tight"
        >
          Questions Complémentaires
        </h1>
        <div class="flex items-center justify-between mb-2 px-1">
          <span
            class="text-[10px] text-gray-400 font-bold uppercase tracking-widest"
            >Progression</span
          >
          <span class="text-[10px] text-brand-primary font-bold"
            >Étape {{ store.getProgress("/complementary").current }}/{{
              store.getProgress("/complementary").total
            }}</span
          >
        </div>
        <div
          class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-10"
        >
          <div
            class="h-full bg-brand-primary transition-all duration-700"
            :style="{
              width: store.getProgress('/complementary').percentage + '%',
            }"
          ></div>
        </div>
        <div v-if="loading" class="flex justify-center py-20">
          <div
            class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"
          ></div>
        </div>

        <div v-else class="space-y-8">
          <div v-for="q in questions" :key="q.id">
            <div v-if="shouldShowQuestion(q)" class="space-y-3 animate-fade-in">
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

              <!-- Textarea Type -->
              <textarea
                v-if="q.metadata?.type === 'textarea'"
                v-model="responses[q.text]"
                :rows="q.metadata.rows || 3"
                :placeholder="q.metadata.placeholder"
                class="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-gray-700 shadow-sm"
              ></textarea>

              <!-- Radio Toggle Type (Oui/Non) -->
              <div
                v-elif="q.metadata?.type === 'radio_toggle'"
                class="flex gap-4"
              >
                <button
                  v-for="opt in q.options"
                  :key="opt"
                  @click="responses[q.text] = opt"
                  :class="
                    responses[q.text] === opt
                      ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30'
                      : 'bg-gray-100 text-gray-400'
                  "
                  class="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  {{ opt }}
                </button>
              </div>

              <!-- Default Text Type -->
              <input
                v-else
                v-model="responses[q.text]"
                type="text"
                :placeholder="q.metadata?.placeholder || ''"
                class="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-brand-primary focus:bg-white outline-none transition-all font-bold text-gray-700 shadow-sm"
              />
            </div>
          </div>

          <button
            @click="nextStep"
            :disabled="submitting"
            class="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <span v-if="!submitting">Continuer</span>
            <span
              v-else
              class="animate-spin border-2 border-white/30 border-t-white rounded-full h-5 w-5"
            ></span>
            <span v-if="!submitting" class="material-icons-outlined"
              >arrow_forward</span
            >
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
