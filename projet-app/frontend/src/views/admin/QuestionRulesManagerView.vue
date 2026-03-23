<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const rules = ref([]);
const workflows = ref([]);
const questions = ref([]);
const formations = ref([]);
const loading = ref(true);
const token = localStorage.getItem("admin_token");

onMounted(async () => {
  await Promise.all([fetchRules(), fetchWorkflows(), fetchQuestions(), fetchFormations()]);
  loading.value = false;
});

async function fetchRules() {
  try {
    const res = await axios.get(`${apiBaseUrl}/question-rules`, { headers: { Authorization: `Bearer ${token}` } });
    rules.value = res.data;
  } catch (error) {
    console.error("Failed to fetch question rules:", error);
  }
}

async function fetchWorkflows() {
  try {
    const res = await axios.get(`${apiBaseUrl}/workflow`, { headers: { Authorization: `Bearer ${token}` } });
    workflows.value = res.data;
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
  }
}

async function fetchQuestions() {
  try {
    const res = await axios.get(`${apiBaseUrl}/questions`, { headers: { Authorization: `Bearer ${token}` } });
    questions.value = res.data;
  } catch (error) {
    console.error("Failed to fetch questions:", error);
  }
}

async function fetchFormations() {
  try {
    const res = await axios.get(`${apiBaseUrl}/formations?activeOnly=true`, { headers: { Authorization: `Bearer ${token}` } });
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
const showModal = ref(false);
const editingRule = ref(null);
const ruleForm = ref({
  workflow: "",
  questionId: null,
  formation: "",
  formationId: null,
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
    formation: "",
    formationId: null,
    expectedValue: "",
    operator: "EQUALS",
    resultType: "CUSTOM_MESSAGE",
    resultMessage: "",
    isActive: true,
    order: rules.value.length,
  };
  editingRule.value = null;
  isMultiSelectValue.value = false;
  showModal.value = true;
}

function openEditModal(rule) {
  editingRule.value = { ...rule };
  ruleForm.value = { ...rule };
  isMultiSelectValue.value = String(rule.expectedValue || "").includes(",");
  showModal.value = true;
}

async function saveRule() {
  try {
    const payload = { ...ruleForm.value };
    if (!payload.questionId) payload.questionId = null;

    if (editingRule.value) {
      await axios.patch(`${apiBaseUrl}/question-rules/${editingRule.value.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post(`${apiBaseUrl}/question-rules`, payload, { headers: { Authorization: `Bearer ${token}` } });
    }
    await fetchRules();
    showModal.value = false;
  } catch (error) {
    console.error("Failed to save rule:", error);
    alert("Erreur lors de l'enregistrement.");
  }
}

async function deleteRule(id) {
  if (!confirm("Supprimer cette règle ?")) return;
  try {
    await axios.delete(`${apiBaseUrl}/question-rules/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    await fetchRules();
  } catch (error) {
    console.error("Failed to delete rule:", error);
  }
}

async function toggleRuleActive(rule) {
  try {
    const newState = !rule.isActive;
    await axios.patch(`${apiBaseUrl}/question-rules/${rule.id}`, { isActive: newState }, { headers: { Authorization: `Bearer ${token}` } });
    rule.isActive = newState;
  } catch (error) {
    console.error("Failed to toggle rule active status:", error);
  }
}

function getQuestionText(id) {
  if (!id) return "Toutes les questions";
  const q = questions.value.find((q) => q.id === id);
  return q ? q.text : `ID: ${id}`;
}
</script>

<template>
  <div class="space-y-8 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Règles Conditionnelles</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Personnalisez l'expérience utilisateur selon les réponses aux questions
        </p>
      </div>
      <button
        @click="openAddModal"
        class="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95"
      >
        <span class="material-icons-outlined text-sm">add_circle</span>
        Nouvelle Règle
      </button>
    </div>

    <!-- Main Content -->
    <div v-if="loading" class="py-24 flex justify-center"><div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-brand-primary animate-spin"></div></div>

    <div v-else class="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-50">
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Ordre</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scope</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Cible</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Déclencheur</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Résultat Automate</th>
              <th class="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="rule in rules.sort((a,b) => (a.order||0) - (b.order||0))" :key="rule.id" class="group hover:bg-slate-50/50 transition-all" :class="!rule.isActive ? 'opacity-40 grayscale' : ''">
              <td class="px-8 py-6">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{{ rule.order }}</div>
              </td>
              <td class="px-8 py-6">
                 <div class="flex flex-col gap-1">
                   <span class="px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-md w-fit shadow-inner">{{ rule.workflow }}</span>
                   <span v-if="rule.formation" class="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[120px]" :title="rule.formation">{{ rule.formation }}</span>
                 </div>
              </td>
              <td class="px-8 py-6 max-w-xs">
                 <div class="text-[11px] font-bold text-slate-900 leading-tight line-clamp-2" :title="getQuestionText(rule.questionId)">
                   {{ getQuestionText(rule.questionId) }}
                 </div>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded-md">{{ rule.operator }}</span>
                  <span class="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black rounded-lg">"{{ rule.expectedValue }}"</span>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="space-y-1">
                  <span class="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black uppercase rounded-lg">{{ rule.resultType }}</span>
                  <p class="text-[10px] font-bold text-slate-500 line-clamp-1" :title="rule.resultMessage">{{ rule.resultMessage }}</p>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center justify-end gap-2 shrink-0">
                  <button @click="toggleRuleActive(rule)" class="w-9 h-9 rounded-xl border border-slate-100 text-slate-300 hover:text-slate-900 hover:bg-white transition-all flex items-center justify-center">
                    <span class="material-icons-outlined text-sm">{{ rule.isActive ? 'visibility' : 'visibility_off' }}</span>
                  </button>
                  <button @click="openEditModal(rule)" class="w-9 h-9 rounded-xl border border-slate-100 text-slate-300 hover:text-brand-primary hover:bg-white transition-all flex items-center justify-center">
                    <span class="material-icons-outlined text-sm">edit</span>
                  </button>
                  <button @click="deleteRule(rule.id)" class="w-9 h-9 rounded-xl border border-slate-100 text-slate-300 hover:text-rose-600 hover:bg-white transition-all flex items-center justify-center">
                    <span class="material-icons-outlined text-sm">delete_outline</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="rules.length === 0">
              <td colspan="6" class="py-24 text-center">
                 <div class="flex flex-col items-center justify-center text-slate-300">
                   <span class="material-icons-outlined text-5xl mb-3 opacity-10">rule</span>
                   <p class="text-[10px] font-black uppercase tracking-widest">Aucune règle définie</p>
                 </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" @click="showModal = false"></div>
      <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl relative overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        
        <div class="px-10 py-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div>
            <h3 class="text-2xl font-black text-slate-900">{{ editingRule ? "Modifier" : "Nouvelle" }} Règle</h3>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Actions conditionnelles sur questions</p>
          </div>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-xl transition-all">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>

        <div class="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <form @submit.prevent="saveRule" id="ruleForm" class="space-y-8">
            <!-- Basic info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scope du Workflow</label>
                <select v-model="ruleForm.workflow" required class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm capitalize">
                  <option value="" disabled>Choisir...</option>
                  <option v-for="wf in workflows" :key="wf.id" :value="wf.code.toLowerCase()">{{ wf.name }}</option>
                  <option value="prerequis">Prérequis (Interne)</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Priorité (Ordre)</label>
                <input v-model.number="ruleForm.order" type="number" required class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm shadow-sm" />
              </div>
            </div>

            <!-- Formation filter -->
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Limiter à une formation</label>
              <select 
                v-model.number="ruleForm.formationId" 
                @change="(e) => {
                  const f = formations.find(f => f.id === Number(e.target.value));
                  ruleForm.formation = f ? f.label : '';
                }"
                class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm"
              >
                <option :value="null">-- Règle Globale (Toutes formations) --</option>
                <option v-for="f in formations" :key="f.id" :value="f.id">{{ f.label }}</option>
              </select>
            </div>

            <!-- Question selection -->
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Question déclencheur</label>
              <select v-model.number="ruleForm.questionId" class="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-brand-primary focus:bg-white rounded-xl outline-none transition-all font-bold text-sm appearance-none shadow-sm">
                <option :value="null">-- Toutes les questions du scope --</option>
                <option v-for="q in questions.filter(q => (!ruleForm.workflow || q.type === ruleForm.workflow) && q.isActive !== false)" :key="q.id" :value="q.id">
                  ID: {{ q.id }} — {{ q.text.substring(0, 80) }}...
                </option>
              </select>
            </div>

            <!-- Condition Details -->
            <div class="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
               <h5 class="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-blue-500"></span> Déclencheur Conditionnel
               </h5>
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="space-y-1">
                   <label class="text-[9px] font-bold text-slate-400 uppercase px-1">Opération</label>
                   <select v-model="ruleForm.operator" required class="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none">
                     <option value="EQUALS">Strictement égal à</option>
                     <option value="CONTAINS">Contient la valeur</option>
                     <option value="LESS_THAN">Inférieur à</option>
                     <option value="GREATER_THAN">Supérieur à</option>
                   </select>
                 </div>
                 <div class="space-y-1">
                    <div class="flex items-center justify-between px-1">
                      <label class="text-[9px] font-bold text-slate-400 uppercase">Valeur cible</label>
                      <button v-if="selectedQuestion?.options?.length" type="button" @click="isMultiSelectValue = !isMultiSelectValue" class="text-[8px] font-black text-brand-primary uppercase underline">Modale multiple</button>
                    </div>
                    
                    <div v-if="selectedQuestion?.options?.length && isMultiSelectValue" class="space-y-2 mt-2">
                       <div class="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                          <label v-for="opt in selectedQuestion.options" :key="opt" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer" :class="String(ruleForm.expectedValue).split(',').includes(opt) ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'">
                             <input type="checkbox" class="hidden" :value="opt" :checked="String(ruleForm.expectedValue).split(',').includes(opt)" @change="(e) => {
                                let cur = ruleForm.expectedValue ? String(ruleForm.expectedValue).split(',') : [];
                                if (e.target.checked) cur.push(opt);
                                else cur = cur.filter(v => v !== opt);
                                ruleForm.expectedValue = cur.filter(v=>v).join(',');
                             }" />
                             {{ opt }}
                          </label>
                       </div>
                    </div>
                    <select v-else-if="selectedQuestion?.options?.length" v-model="ruleForm.expectedValue" required class="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none">
                      <option v-for="opt in selectedQuestion.options" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <input v-else v-model="ruleForm.expectedValue" required placeholder="Valeur brute..." class="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none" />
                 </div>
               </div>
            </div>

            <!-- Result Actions -->
            <div class="p-6 bg-amber-50/50 rounded-[32px] border border-amber-100 space-y-6">
               <h5 class="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-amber-500"></span> Action en sortie
               </h5>
               <div class="space-y-4">
                  <div class="space-y-1">
                    <label class="text-[9px] font-bold text-slate-400 uppercase px-1">Type d'action</label>
                    <select v-model="ruleForm.resultType" required class="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none">
                      <option value="CUSTOM_MESSAGE">Afficher un message (Toast/Modal)</option>
                      <option value="FORMATION_RECOMMENDATION">Recommander une formation spécifique</option>
                      <option value="BLOCK">Bloquer la progression immédiate</option>
                    </select>
                  </div>
                  <div v-if="ruleForm.resultType !== 'BLOCK'" class="space-y-1">
                    <label class="text-[9px] font-bold text-slate-400 uppercase px-1">Contenu de l'action (Valeur / Texte)</label>
                    <div v-if="ruleForm.resultType === 'FORMATION_RECOMMENDATION' && formations.length">
                       <select v-model="ruleForm.resultMessage" required class="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none">
                         <option value="DigComp Initial & Word Initial">Standard Initial (DigComp & Word)</option>
                         <option v-for="f in formations" :key="f.id" :value="f.label">{{ f.label }}</option>
                       </select>
                    </div>
                    <textarea v-else v-model="ruleForm.resultMessage" rows="3" placeholder="Informations transmises à l'automate..." class="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs outline-none shadow-sm"></textarea>
                  </div>
               </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-10 py-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button @click="showModal = false" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Annuler</button>
          <button form="ruleForm" type="submit" class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all transform active:scale-95">
            {{ editingRule ? "Sauvegarder" : "Créer la règle" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit { font-family: "Outfit", sans-serif; }
.animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
.animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
select { background-image: none; }
</style>
