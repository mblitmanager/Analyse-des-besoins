<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import SiteHeader from "../../components/SiteHeader.vue";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const rules = ref([]);
const workflows = ref([]);
const questions = ref([]);
const formations = ref([]);
const loading = ref(true);

onMounted(async () => {
  await Promise.all([fetchRules(), fetchWorkflows(), fetchQuestions(), fetchFormations()]);
  loading.value = false;
});

async function fetchRules() {
  try {
    const res = await axios.get(`${apiBaseUrl}/question-rules`);
    rules.value = res.data;
  } catch (error) {
    console.error("Failed to fetch question rules:", error);
  }
}

async function fetchWorkflows() {
  try {
    const res = await axios.get(`${apiBaseUrl}/workflow`);
    workflows.value = res.data;
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
  }
}

async function fetchQuestions() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions`);
    questions.value = res.data;
  } catch (error) {
    console.error("Failed to fetch questions:", error);
  }
}

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`);
    formations.value = res.data;
  } catch (error) {
    console.error("Failed to fetch formations:", error);
  }
}

const selectedQuestion = computed(() => {
  if (!ruleForm.value.questionId) return null;
  return questions.value.find(q => q.id === ruleForm.value.questionId);
});

const isMultiSelectValue = ref(false);

const showAddModal = ref(false);
const showEditModal = ref(false);
const editingRule = ref(null);
const ruleForm = ref({
  workflow: "",
  questionId: null,
  expectedValue: "",
  operator: "EQUALS",
  resultType: "CUSTOM_MESSAGE",
  resultMessage: "",
  isActive: true,
  order: 0,
});

function openAddModal() {
  ruleForm.value = {
    workflow: "",
    questionId: null,
    expectedValue: "",
    operator: "EQUALS",
    resultType: "CUSTOM_MESSAGE",
    resultMessage: "",
    isActive: true,
    order: rules.value.length,
  };
  editingRule.value = null;
  showAddModal.value = true;
}

function openEditModal(rule) {
  editingRule.value = { ...rule };
  ruleForm.value = { ...rule };
  // Check if expectedValue looks like a comma-separated list
  isMultiSelectValue.value = String(rule.expectedValue || "").includes(",");
  showEditModal.value = true;
}

function closeModals() {
  showAddModal.value = false;
  showEditModal.value = false;
  editingRule.value = null;
}

async function saveRule() {
  try {
    // Format questionId if necessary
    const payload = { ...ruleForm.value };
    if (!payload.questionId) payload.questionId = null;

    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/question-rules/${editingRule.value.id}`, payload);
    } else {
      await axios.post(`${apiBaseUrl}/question-rules`, payload);
    }
    await fetchRules();
    closeModals();
  } catch (error) {
    console.error("Failed to save rule:", error);
    alert("Erreur lors de l'enregistrement de la règle.");
  }
}

async function deleteRule(id) {
  if (!confirm("Voulez-vous vraiment supprimer cette règle ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/question-rules/${id}`);
    await fetchRules();
  } catch (error) {
    console.error("Failed to delete rule:", error);
  }
}

async function toggleRuleActive(rule) {
  try {
    rule.isActive = !rule.isActive;
    await axios.patch(`${apiBaseUrl}/question-rules/${rule.id}`, {
      isActive: rule.isActive,
    });
  } catch (error) {
    console.error("Failed to toggle rule active status:", error);
    rule.isActive = !rule.isActive; // revert on failure
  }
}

// Helper to find question text
function getQuestionText(id) {
  if (!id) return "Toutes les questions";
  const q = questions.value.find((q) => q.id === id);
  return q ? q.text : `Question ID: ${id}`;
}
</script>

<template>
  <div class="min-h-screen bg-[#F0F4F8] font-outfit">
    <SiteHeader />

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-[#0d1b3e] mb-2">Gestion des Règles Questions</h1>
          <p class="text-gray-500">
            Créez des scénarios personnalisés (ex: afficher un message spécifique si la réponse de l'utilisateur à la question X est "Non").
          </p>
        </div>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
        >
          <span class="material-icons-outlined">add</span>
          Nouvelle Règle
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin border-4 border-gray-100 border-t-brand-primary rounded-full h-12 w-12"></div>
      </div>

      <div v-else class="bg-white rounded-4xl shadow-xl overflow-hidden border border-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Ordre</th>
                <th class="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Workflow</th>
                <th class="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Question</th>
                <th class="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Condition</th>
                <th class="p-6 text-xs font-black uppercase tracking-widest text-gray-400 w-1/4">Résultat</th>
                <th class="p-6 text-xs font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="rule in rules"
                :key="rule.id"
                class="hover:bg-gray-50/50 transition-colors"
                :class="{ 'opacity-50 grayscale': !rule.isActive }"
              >
                <td class="p-6 font-bold text-gray-800">{{ rule.order }}</td>
                <td class="p-6">
                  <span class="px-3 py-1 bg-blue-50 text-brand-primary rounded-lg text-xs font-bold font-mono">
                    {{ rule.workflow }}
                  </span>
                </td>
                <td class="p-6 text-sm text-gray-600">
                  <div class="line-clamp-2" :title="getQuestionText(rule.questionId)">
                    {{ getQuestionText(rule.questionId) }}
                  </div>
                </td>
                <td class="p-6">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs">
                    <span class="font-mono text-gray-500">{{ rule.operator }}</span>
                    <span class="font-bold text-gray-800 bg-white px-2 py-0.5 rounded shadow-sm">
                      "{{ rule.expectedValue }}"
                    </span>
                  </div>
                </td>
                <td class="p-6">
                  <div class="text-xs font-bold text-brand-primary mb-1">{{ rule.resultType }}</div>
                  <div class="text-sm text-gray-600 line-clamp-2" :title="rule.resultMessage">
                    {{ rule.resultMessage }}
                  </div>
                </td>
                <td class="p-6">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="toggleRuleActive(rule)"
                      class="p-2 rounded-lg transition-colors border"
                      :class="rule.isActive ? 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100' : 'text-gray-400 bg-gray-50 border-gray-100 hover:bg-gray-100'"
                      title="Activer/Désactiver"
                    >
                      <span class="material-icons-outlined text-sm">
                        {{ rule.isActive ? 'toggle_on' : 'toggle_off' }}
                      </span>
                    </button>
                    <button
                      @click="openEditModal(rule)"
                      class="p-2 text-brand-primary hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      title="Modifier"
                    >
                      <span class="material-icons-outlined text-sm">edit</span>
                    </button>
                    <button
                      @click="deleteRule(rule.id)"
                      class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Supprimer"
                    >
                      <span class="material-icons-outlined text-sm">delete_outline</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="rules.length === 0">
                <td colspan="6" class="p-12 text-center text-gray-400 font-medium">
                  Aucune règle configurée pour le moment.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Modal (Add/Edit) -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-[#0d1b3e]/40 backdrop-blur-sm" @click="closeModals"></div>
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 md:p-8 border-b border-gray-100 shrink-0">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-black heading-primary">
              {{ editingRule ? 'Modifier la règle' : 'Nouvelle règle' }}
            </h2>
            <button @click="closeModals" class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        <div class="p-6 md:p-8 overflow-y-auto">
          <form @submit.prevent="saveRule" class="space-y-6">
            <!-- Workflow & Ordre -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Workflow Cible</label>
                <select v-model="ruleForm.workflow" required class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-brand-primary focus:bg-white outline-none transition-colors text-sm font-bold text-gray-800">
                  <option value="" disabled>Sélectionner un workflow</option>
                  <option v-for="wf in workflows" :key="wf.id" :value="wf.code.toLowerCase()">{{ wf.name }} ({{ wf.code }})</option>
                  <option value="prerequis">Prérequis (Interne)</option>
                  <option value="mise_a_niveau">Mise à niveau (Interne)</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ordre de priorité</label>
                <input v-model.number="ruleForm.order" type="number" required class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-brand-primary focus:bg-white outline-none transition-colors text-sm font-bold text-gray-800" />
              </div>
            </div>

            <!-- Question Selection -->
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Question Concernée</label>
              <select v-model.number="ruleForm.questionId" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-brand-primary focus:bg-white outline-none transition-colors text-sm font-bold text-gray-800 max-h-40">
                <option :value="null">-- Toutes les questions du workflow (non recommandé pour les conditions spécifiques) --</option>
                <option v-for="q in questions.filter(q => (!ruleForm.workflow || q.type === ruleForm.workflow) && q.isActive !== false)" :key="q.id" :value="q.id">
                  ID: {{ q.id }} - {{ q.text }}
                </option>
              </select>
            </div>

            <!-- Condition -->
            <div class="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4 relative">
              <span class="absolute -top-2.5 -left-2.5 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">Si</span>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Opérateur</label>
                  <select v-model="ruleForm.operator" required class="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:border-brand-primary outline-none transition-colors text-sm font-bold text-gray-800 shadow-sm">
                    <option value="EQUALS">Est égal à (=)</option>
                    <option value="CONTAINS">Contient</option>
                    <option value="LESS_THAN">Est inférieur à (<)</option>
                    <option value="GREATER_THAN">Est supérieur à (>)</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400">Valeur Attendue</label>
                    <button 
                      v-if="selectedQuestion?.options?.length > 0"
                      type="button" 
                      @click="isMultiSelectValue = !isMultiSelectValue"
                      class="text-[9px] font-bold uppercase tracking-widest text-brand-primary hover:underline"
                    >
                      {{ isMultiSelectValue ? 'Valeur unique' : 'Plusieurs valeurs (OU)' }}
                    </button>
                  </div>

                  <!-- Multi-select for options -->
                  <div v-if="selectedQuestion?.options?.length > 0 && isMultiSelectValue" class="flex flex-wrap gap-2 p-3 bg-white border border-gray-100 rounded-xl max-h-32 overflow-y-auto">
                    <label 
                      v-for="opt in selectedQuestion.options" 
                      :key="opt"
                      class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      :class="ruleForm.expectedValue?.split(',').includes(opt) ? 'bg-brand-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'"
                    >
                      <input 
                        type="checkbox" 
                        class="hidden" 
                        :value="opt" 
                        :checked="ruleForm.expectedValue?.split(',').includes(opt)"
                        @change="(e) => {
                          let current = ruleForm.expectedValue ? ruleForm.expectedValue.split(',') : [];
                          if (e.target.checked) current.push(opt);
                          else current = current.filter(v => v !== opt);
                          ruleForm.expectedValue = current.filter(v => v).join(',');
                        }"
                      />
                      {{ opt }}
                    </label>
                  </div>

                  <!-- Single select for options -->
                  <select 
                    v-else-if="selectedQuestion?.options?.length > 0" 
                    v-model="ruleForm.expectedValue" 
                    required 
                    class="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:border-brand-primary outline-none transition-colors text-sm font-bold text-gray-800 shadow-sm"
                  >
                    <option value="" disabled>Choisir une option</option>
                    <option v-for="opt in selectedQuestion.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>

                  <!-- Direct input -->
                  <input v-else v-model="ruleForm.expectedValue" type="text" placeholder="Ex: Non" class="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:border-brand-primary outline-none transition-colors text-sm font-bold text-gray-800 shadow-sm" />
                </div>
              </div>
              <p v-if="isMultiSelectValue" class="text-[9px] text-blue-500 font-bold uppercase tracking-widest">
                💡 Plusieurs valeurs sélectionnées : la règle s'appliquera si la réponse est l'une d'entre elles.
              </p>
            </div>

            <!-- Résultat -->
            <div class="p-5 bg-orange-50/50 rounded-2xl border border-orange-100/50 space-y-4 relative">
              <span class="absolute -top-2.5 -left-2.5 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs material-icons-outlined text-[12px]!">arrow_forward</span>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Type de Résultat</label>
                <select v-model="ruleForm.resultType" required class="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:border-brand-primary outline-none transition-colors text-sm font-bold text-gray-800 shadow-sm">
                  <option value="CUSTOM_MESSAGE">Afficher un message spécifique</option>
                  <option value="FORMATION_RECOMMENDATION">Recommander une formation (ex: DigComp Initial)</option>
                  <option value="BLOCK">Bloquer la progression</option>
                </select>
                <p v-if="ruleForm.resultType === 'FORMATION_RECOMMENDATION'" class="mt-2 text-[10px] text-orange-600 font-bold uppercase tracking-wider">
                  ⚠️ Indiquez le label exact de la formation cible (ex: "DigComp Initial & Word Initial")
                </p>
              </div>
              <div v-if="ruleForm.resultType !== 'BLOCK'">
                <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  {{ ruleForm.resultType === 'FORMATION_RECOMMENDATION' ? 'Formation Recommandée' : 'Message personnalisé' }}
                </label>
                
                <select 
                  v-if="ruleForm.resultType === 'FORMATION_RECOMMENDATION'" 
                  v-model="ruleForm.resultMessage" 
                  required 
                  class="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:border-brand-primary outline-none transition-colors text-sm font-bold text-gray-800 shadow-sm"
                >
                  <option value="" disabled>Sélectionner une formation</option>
                  <option value="DigComp Initial & Word Initial">Parcours Initial Standard (DigComp Initial & Word Initial)</option>
                  <option v-for="f in formations" :key="f.id" :value="f.label">{{ f.label }}</option>
                </select>

                <textarea v-else v-model="ruleForm.resultMessage" rows="3" placeholder="Texte à afficher à l'utilisateur..." class="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:border-brand-primary outline-none transition-colors text-sm font-bold text-gray-800 shadow-sm"></textarea>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" v-model="ruleForm.isActive" class="w-4 h-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary" />
              <label for="isActive" class="text-sm font-bold text-gray-700 cursor-pointer">Activer cette règle immédiatement</label>
            </div>

            <div class="pt-6 border-t border-gray-100 flex gap-4">
              <button type="button" @click="closeModals" class="flex-1 px-6 py-4 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                Annuler
              </button>
              <button type="submit" class="flex-1 px-6 py-4 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all active:scale-95">
                Enregistrer la règle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}
.heading-primary {
  color: #0d1b3e;
}
</style>
