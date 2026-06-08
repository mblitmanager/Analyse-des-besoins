import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Custom TipTap extension that renders {{variable}} placeholders
 * as inline non-editable chips/badges in the editor.
 * This prevents accidental corruption of template variables.
 */
export const TemplatePlaceholder = Node.create({
  name: "templatePlaceholder",
  group: "inline",
  inline: true,
  atom: true, // non-editable as a whole unit

  addAttributes() {
    return {
      variable: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable"),
        renderHTML: (attributes) => ({
          "data-variable": attributes.variable,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="template-placeholder"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "template-placeholder",
        class: "template-placeholder",
        contenteditable: "false",
      }),
      `{{${HTMLAttributes["data-variable"]}}}`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");
      dom.classList.add("template-placeholder");
      dom.setAttribute("data-type", "template-placeholder");
      dom.setAttribute("data-variable", node.attrs.variable);
      dom.contentEditable = "false";
      dom.textContent = `{{${node.attrs.variable}}}`;
      return { dom };
    };
  },
});

/**
 * Input rule that converts typed {{variable}} into a placeholder node.
 * This is applied via addInputRules on the extension.
 */
export const TemplatePlaceholderWithInputRules = TemplatePlaceholder.extend({
  addInputRules() {
    return [
      {
        // Match {{variableName}} patterns as the user types
        find: /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}$/,
        handler: ({ state, range, match }) => {
          const variable = match[1];
          const { tr } = state;
          const node = this.type.create({ variable });
          tr.replaceWith(range.from, range.to, node);
        },
      },
    ];
  },
});

/**
 * Converts raw HTML containing {{variable}} text patterns
 * into HTML with proper placeholder node spans.
 * Used when loading template content into the editor.
 */
export function htmlWithPlaceholderNodes(html) {
  if (!html) return html;
  return html.replace(
    /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g,
    '<span data-type="template-placeholder" data-variable="$1" class="template-placeholder" contenteditable="false">{{$1}}</span>'
  );
}

/**
 * Converts editor HTML back to raw HTML with plain {{variable}} text.
 * Used when saving template content from the editor.
 */
export function htmlWithPlainPlaceholders(html) {
  if (!html) return html;
  return html.replace(
    /<span[^>]*data-type="template-placeholder"[^>]*data-variable="([^"]*)"[^>]*>[^<]*<\/span>/g,
    "{{$1}}"
  );
}
