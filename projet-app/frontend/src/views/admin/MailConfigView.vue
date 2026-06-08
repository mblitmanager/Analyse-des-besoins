<script setup>
import { ref } from "vue";
import SmtpConfigSection from "../../components/admin/SmtpConfigSection.vue";
import TemplateEditorSection from "../../components/admin/TemplateEditorSection.vue";
import TestEmailSection from "../../components/admin/TestEmailSection.vue";

const activeTab = ref("smtp");

const tabs = [
  { id: "smtp", label: "SMTP", icon: "dns" },
  { id: "templates", label: "Templates", icon: "drafts" },
  { id: "test", label: "Test Email", icon: "send" },
];
</script>

<template>
  <div class="space-y-12 animate-fade-in font-outfit">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Configuration Email</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          SMTP, Templates et Test d'envoi
        </p>
      </div>
      <div class="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-2xl">
        <span class="material-icons-outlined text-emerald-500 text-sm">verified</span>
        <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Page dédiée</span>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center p-1 bg-slate-100 rounded-[24px] w-fit mx-auto md:mx-0 shadow-inner">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-8 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
        :class="
          activeTab === tab.id
            ? 'bg-white text-slate-900 shadow-md'
            : 'text-slate-400 hover:text-slate-600'
        "
      >
        <span class="material-icons-outlined text-sm">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="animate-slide-up">
      <!-- SMTP Section -->
      <div v-if="activeTab === 'smtp'" key="smtp-tab">
        <div class="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <span class="material-icons-outlined text-sm">dns</span>
            </div>
            <div>
              <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Configuration SMTP</h3>
              <p class="text-[9px] text-slate-400 font-bold mt-0.5">Paramètres du serveur de messagerie</p>
            </div>
          </div>
          <SmtpConfigSection />
        </div>
      </div>

      <!-- Templates Section -->
      <div v-if="activeTab === 'templates'" key="templates-tab">
        <div class="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <span class="material-icons-outlined text-sm">drafts</span>
            </div>
            <div>
              <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Templates Email</h3>
              <p class="text-[9px] text-slate-400 font-bold mt-0.5">Éditeur visuel WYSIWYG avec prévisualisation</p>
            </div>
          </div>
          <TemplateEditorSection />
        </div>
      </div>

      <!-- Test Email Section -->
      <div v-if="activeTab === 'test'" key="test-tab">
        <div class="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <span class="material-icons-outlined text-sm">send</span>
            </div>
            <div>
              <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Test Email</h3>
              <p class="text-[9px] text-slate-400 font-bold mt-0.5">Envoyer un email de test pour vérifier la configuration</p>
            </div>
          </div>
          <TestEmailSection />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-outfit {
  font-family: "Outfit", sans-serif;
}
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
