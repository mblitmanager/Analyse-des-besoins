/**
 * Convertit le texte avec syntaxe markdown **text** en HTML <strong>text</strong>
 * et supprime le backslash avant = au début du texte
 * @param {string} text - Le texte à formater
 * @returns {string} Le texte formaté en HTML
 */
export function formatBoldText(text) {
  if (!text) return '';
  let result = String(text);
  
  // Supprimer le backslash avant = au début
  if (result.startsWith('\\=')) {
    result = result.substring(1); // Garde seulement =
  }
  
  // Convertir **texte** en <strong>texte</strong>
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  return result;
}

/**
 * Formate les réponses multiples en formatant chaque élément individuellement
 * @param {string|string[]} val - La ou les réponses
 * @returns {string} Les réponses formatées en HTML
 */
export function formatResponses(val) {
  if (Array.isArray(val)) {
    return val.map(v => formatBoldText(v)).join(', ');
  }
  return formatBoldText(val);
}
