<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import axios from "axios";
import { useToastStore } from "../../stores/toast";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  TemplatePlaceholderWithInputRules,
  htmlWithPlaceholderNodes,
  htmlWithPlainPlaceholders,
} from "./tiptap/TemplatePlaceholderExtension.js";

const toast = useToastStore();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const token = () => localStorage.getItem("admin_token");
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const templates = ref([]);
const loading = ref(true);
const selectedTemplate = ref(null);
const loadingContent = ref(false);
const saving = ref(false);
const validationError = ref("");

const formatVar = (v) => `\u007B\u007B${v}\u007D\u007D`;

// Sample values for preview placeholder rendering
const sampleValues = {
  firstName: "Jean",
  lastName: "Dupont",
  email: "exemple@email.com",
  name: "Jean Dupont",
  username: "jean.dupont",
  password: "••••••••",
  resetLink: "https://example.com/reset?token=abc123",
  confirmLink: "https://example.com/confirm?token=xyz789",
  link: "https://example.com",
  date: new Date().toLocaleDateString("fr-FR"),
  company: "Analyses des Besoins",
  phone: "+33 1 23 45 67 89",
  address: "123 Rue Exemple, 75001 Paris",
  subject: "Sujet exemple",
  message: "Ceci est un message d'exemple.",
  amount: "99,00 €",
  courseName: "Formation Exemple",
  trainerName: "Marie Martin",
};

/**
 * Replace {{variable}} placeholders with sample values for preview rendering.
 */
function renderPreview(html) {
  if (!html) return "";
  let rendered = html;
  // Replace known placeholders with sample values
  for (const [key, value] of Object.entries(sampleValues)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    rendered = rendered.replace(regex, value);
  }
  // For any remaining unknown placeholders, use a generic sample
  rendered = rendered.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, varName) => {
    return `[${varName}]`;
  });
  return rendered;
}

// Computed preview HTML that updates in real-time
const previewHtml = computed(() => {
  if (!selectedTemplate.value) return "";
  return renderPreview(selectedTemplate.value.htmlContent || "");
});

// Computed preview subject
const previewSubject = computed(() => {
  if (!selectedTemplate.value) return "";
  return renderPreview(selectedTemplate.value.subject || "");
});

// TipTap Editor instance
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "text-purple-600 underline" },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Placeholder.configure({
      placeholder: "Commencez à éditer le contenu du template...",
    }),
    Underline,
    TemplatePlaceholderWithInputRules,
  ],
  editable: false,
  content: "",
  onUpdate: ({ editor: ed }) => {
    // Sync content back to selectedTemplate
    if (selectedTemplate.value) {
      const rawHtml = htmlWithPlainPlaceholders(ed.getHTML());
      selectedTemplate.value.htmlContent = rawHtml;
    }
  },
});

// Watch selectedTemplate to update editor content
watch(selectedTemplate, (tpl) => {
  if (editor.value) {
    if (tpl) {
      editor.value.setEditable(true);
      const content = htmlWithPlaceholderNodes(tpl.htmlContent || "");
      editor.value.commands.setContent(content);
    } else {
      editor.value.setEditable(false);
      editor.value.commands.setContent("");
    }
  }
});

// Editor active state helpers
const isActive = (name, attrs) => {
  if (!editor.value) return false;
  return editor.value.isActive(name, attrs);
};

async function fetchTemplates() {
  loading.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/email-templates`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    templates.value = res.data;
  } catch (e) {
    toast.error("Erreur lors du chargement des templates");
  } finally {
    loading.value = false;
  }
}

async function selectTemplate(tpl) {
  loadingContent.value = true;
  try {
    const res = await axios.get(`${apiBaseUrl}/email-templates/${tpl.id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    selectedTemplate.value = res.data;
  } catch (e) {
    toast.error("Erreur lors du chargement du template");
  } finally {
    loadingContent.value = false;
  }
}

function deselectTemplate() {
  selectedTemplate.value = null;
}

// Toolbar actions
function toggleBold() {
  editor.value?.chain().focus().toggleBold().run();
}
function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run();
}
function toggleUnderline() {
  editor.value?.chain().focus().toggleUnderline().run();
}
function setHeading(level) {
  editor.value?.chain().focus().toggleHeading({ level }).run();
}
function setParagraph() {
  editor.value?.chain().focus().setParagraph().run();
}
function setTextAlign(align) {
  editor.value?.chain().focus().setTextAlign(align).run();
}
function toggleLink() {
  if (editor.value?.isActive("link")) {
    editor.value.chain().focus().unsetLink().run();
    return;
  }
  const url = window.prompt("URL du lien :");
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run();
  }
}
function addImage() {
  const url = window.prompt("URL de l'image :");
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run();
  }
}
function insertPlaceholder(variable) {
  editor.value
    ?.chain()
    .focus()
    .insertContent({
      type: "templatePlaceholder",
      attrs: { variable },
    })
    .run();
}

/**
 * Get the current editor HTML content with plain placeholders.
 * Exposed for parent components or save operations.
 */
function getEditorContent() {
  if (!editor.value) return "";
  return htmlWithPlainPlaceholders(editor.value.getHTML());
}

/**
 * Save the current template via PATCH /email-templates/:id
 * Validates that htmlContent is not empty before saving.
 */
async function saveTemplate() {
  if (!selectedTemplate.value) return;

  const content = getEditorContent();
  // Validation: empêcher la sauvegarde si htmlContent est vide
  const strippedContent = content.replace(/<[^>]*>/g, "").trim();
  if (!content || !strippedContent) {
    validationError.value = "Le contenu du template ne peut pas être vide";
    toast.error("Le contenu du template ne peut pas être vide");
    return;
  }

  validationError.value = "";
  saving.value = true;

  try {
    await axios.patch(
      `${apiBaseUrl}/email-templates/${selectedTemplate.value.id}`,
      {
        htmlContent: content,
        subject: selectedTemplate.value.subject,
      },
      getAuthHeaders()
    );
    toast.success("Template enregistré avec succès");
  } catch (error) {
    const message =
      error.response?.data?.message || "Erreur lors de l'enregistrement du template";
    toast.error(Array.isArray(message) ? message.join(", ") : message);
  } finally {
    saving.value = false;
  }
}

// Expose for parent usage
defineExpose({ getEditorContent, saveTemplate });

onMounted(fetchTemplates);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Layout: List + Editor -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Template List (left panel) -->
      <div class="w-full lg:w-1/3 space-y-3">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Liste des templates
          </h4>
          <span class="text-[9px] font-bold text-slate-400">
            {{ templates.length }} template{{ templates.length > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="h-20 bg-slate-50 rounded-2xl animate-pulse"
          ></div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="templates.length === 0"
          class="text-center py-12 text-slate-300"
        >
          <span class="material-icons-outlined text-4xl mb-2">drafts</span>
          <p class="text-xs font-bold text-slate-400">Aucun template disponible</p>
        </div>

        <!-- Template items -->
        <div v-else class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          <button
            v-for="tpl in templates"
            :key="tpl.id"
            @click="selectTemplate(tpl)"
            class="w-full text-left p-4 rounded-2xl border transition-all duration-200 group"
            :class="
              selectedTemplate?.id === tpl.id
                ? 'bg-purple-50 border-purple-200 shadow-md shadow-purple-500/5'
                : 'bg-white border-slate-100 hover:border-purple-100 hover:shadow-sm'
            "
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-black truncate"
                  :class="
                    selectedTemplate?.id === tpl.id
                      ? 'text-purple-900'
                      : 'text-slate-900'
                  "
                >
                  {{ tpl.name }}
                </p>
                <p class="text-[10px] text-slate-400 font-bold mt-0.5 truncate">
                  {{ tpl.slug }}
                </p>
              </div>
              <span
                class="shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest"
                :class="
                  tpl.isActive
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                "
              >
                {{ tpl.isActive ? "Actif" : "Inactif" }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Editor Panel (right panel) -->
      <div class="w-full lg:w-2/3">
        <!-- No template selected -->
        <div
          v-if="!selectedTemplate && !loadingContent"
          class="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 rounded-2xl border border-dashed border-slate-200"
        >
          <span class="material-icons-outlined text-5xl text-slate-200 mb-3">
            touch_app
          </span>
          <p class="text-xs font-bold text-slate-400">
            Sélectionnez un template pour éditer son contenu
          </p>
        </div>

        <!-- Loading content -->
        <div
          v-else-if="loadingContent"
          class="flex items-center justify-center h-full min-h-[400px] bg-slate-50 rounded-2xl"
        >
          <div class="flex items-center gap-3">
            <span class="material-icons-outlined text-purple-400 animate-spin text-xl">
              autorenew
            </span>
            <span class="text-xs font-bold text-slate-400">
              Chargement du template...
            </span>
          </div>
        </div>

        <!-- Template content editor -->
        <div v-else class="space-y-4">
          <!-- Editor header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <span class="material-icons-outlined text-sm">edit_note</span>
              </div>
              <div>
                <p class="text-xs font-black text-slate-900">
                  {{ selectedTemplate.name }}
                </p>
                <p class="text-[9px] text-slate-400 font-bold">
                  {{ selectedTemplate.slug }}
                </p>
              </div>
            </div>
            <button
              @click="deselectTemplate"
              class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-all"
            >
              <span class="material-icons-outlined text-sm">close</span>
            </button>
          </div>

          <!-- Subject field -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Sujet
            </label>
            <input
              v-model="selectedTemplate.subject"
              class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
              placeholder="Sujet de l'email..."
            />
          </div>

          <!-- WYSIWYG Toolbar -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Contenu HTML
            </label>

            <!-- Toolbar -->
            <div class="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-xl">
              <!-- Text formatting -->
              <button
                @click="toggleBold"
                :class="isActive('bold') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                title="Gras"
              >
                B
              </button>
              <button
                @click="toggleItalic"
                :class="isActive('italic') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm italic transition-all"
                title="Italique"
              >
                I
              </button>
              <button
                @click="toggleUnderline"
                :class="isActive('underline') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm underline transition-all"
                title="Souligné"
              >
                U
              </button>

              <!-- Separator -->
              <div class="w-px h-5 bg-slate-200 mx-1"></div>

              <!-- Headings -->
              <button
                @click="setParagraph"
                :class="isActive('paragraph') && !isActive('heading') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                title="Paragraphe"
              >
                P
              </button>
              <button
                @click="setHeading(1)"
                :class="isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                title="Titre 1"
              >
                H1
              </button>
              <button
                @click="setHeading(2)"
                :class="isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                title="Titre 2"
              >
                H2
              </button>
              <button
                @click="setHeading(3)"
                :class="isActive('heading', { level: 3 }) ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="h-8 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
                title="Titre 3"
              >
                H3
              </button>

              <!-- Separator -->
              <div class="w-px h-5 bg-slate-200 mx-1"></div>

              <!-- Text alignment -->
              <button
                @click="setTextAlign('left')"
                :class="isActive({ textAlign: 'left' }) ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                title="Aligner à gauche"
              >
                <span class="material-icons-outlined text-sm">format_align_left</span>
              </button>
              <button
                @click="setTextAlign('center')"
                :class="isActive({ textAlign: 'center' }) ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                title="Centrer"
              >
                <span class="material-icons-outlined text-sm">format_align_center</span>
              </button>
              <button
                @click="setTextAlign('right')"
                :class="isActive({ textAlign: 'right' }) ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                title="Aligner à droite"
              >
                <span class="material-icons-outlined text-sm">format_align_right</span>
              </button>

              <!-- Separator -->
              <div class="w-px h-5 bg-slate-200 mx-1"></div>

              <!-- Link & Image -->
              <button
                @click="toggleLink"
                :class="isActive('link') ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'"
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                title="Lien"
              >
                <span class="material-icons-outlined text-sm">link</span>
              </button>
              <button
                @click="addImage"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"
                title="Image"
              >
                <span class="material-icons-outlined text-sm">image</span>
              </button>
            </div>

            <!-- Editor Content Area -->
            <div class="border border-t-0 border-slate-200 rounded-b-xl bg-white min-h-[320px] overflow-y-auto">
              <EditorContent :editor="editor" class="tiptap-editor" />
            </div>
          </div>

          <!-- Available variables (clickable to insert) -->
          <div
            v-if="selectedTemplate.availableVariables && selectedTemplate.availableVariables.length"
            class="space-y-1.5"
          >
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Variables disponibles (cliquer pour insérer)
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="v in selectedTemplate.availableVariables"
                :key="v"
                @click="insertPlaceholder(v)"
                class="px-2.5 py-1 bg-purple-50 text-purple-600 text-[9px] font-bold rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
              >
                {{ formatVar(v) }}
              </button>
            </div>
          </div>

          <!-- Validation error message -->
          <p v-if="validationError" class="text-[10px] font-bold text-red-500">
            {{ validationError }}
          </p>

          <!-- Save button -->
          <div class="flex items-center justify-end pt-2">
            <button
              @click="saveTemplate"
              :disabled="saving"
              class="px-6 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <span v-if="saving" class="material-icons-outlined text-sm animate-spin">autorenew</span>
              <span v-else class="material-icons-outlined text-sm">save</span>
              {{ saving ? "Enregistrement..." : "Enregistrer" }}
            </button>
          </div>

          <!-- Preview Panel -->
          <div class="space-y-3 mt-4">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <span class="material-icons-outlined text-xs">visibility</span>
              </div>
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Prévisualisation
              </label>
            </div>

            <!-- Preview subject -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Sujet (preview)
              </p>
              <p class="text-xs font-bold text-slate-700">
                {{ previewSubject || "Aucun sujet défini" }}
              </p>
            </div>

            <!-- Preview rendered HTML -->
            <div class="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <span class="material-icons-outlined text-xs text-slate-400">email</span>
                <span class="text-[9px] font-bold text-slate-400">Aperçu de l'email rendu</span>
              </div>
              <div
                v-if="previewHtml"
                class="p-4 min-h-[200px] max-h-[400px] overflow-y-auto text-sm text-slate-700 template-preview-content"
                v-html="previewHtml"
              ></div>
              <div
                v-else
                class="p-4 min-h-[200px] flex items-center justify-center"
              >
                <p class="text-xs text-slate-300 font-bold">
                  Le preview apparaîtra ici lors de l'édition
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* TipTap Editor Styles */
.tiptap-editor .tiptap {
  padding: 1rem;
  min-height: 300px;
  outline: none;
}

.tiptap-editor .tiptap p {
  margin: 0.5rem 0;
}

.tiptap-editor .tiptap h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.75rem 0;
}

.tiptap-editor .tiptap h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.6rem 0;
}

.tiptap-editor .tiptap h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

.tiptap-editor .tiptap h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.4rem 0;
}

.tiptap-editor .tiptap ul,
.tiptap-editor .tiptap ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.tiptap-editor .tiptap a {
  color: #7c3aed;
  text-decoration: underline;
}

.tiptap-editor .tiptap img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.tiptap-editor .tiptap blockquote {
  border-left: 3px solid #e2e8f0;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #64748b;
}

/* Template placeholder chip styles */
.tiptap-editor .tiptap .template-placeholder,
.template-placeholder {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  margin: 0 0.125rem;
  background-color: #f3e8ff;
  color: #7c3aed;
  border: 1px solid #e9d5ff;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: ui-monospace, monospace;
  user-select: none;
  white-space: nowrap;
  vertical-align: baseline;
}

/* Placeholder text when editor is empty */
.tiptap-editor .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
  font-size: 0.75rem;
}

/* Preview panel styles */
.template-preview-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.75rem 0;
}

.template-preview-content h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.6rem 0;
}

.template-preview-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

.template-preview-content h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.4rem 0;
}

.template-preview-content p {
  margin: 0.5rem 0;
}

.template-preview-content ul,
.template-preview-content ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.template-preview-content a {
  color: #7c3aed;
  text-decoration: underline;
}

.template-preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.template-preview-content blockquote {
  border-left: 3px solid #e2e8f0;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #64748b;
}
</style>
