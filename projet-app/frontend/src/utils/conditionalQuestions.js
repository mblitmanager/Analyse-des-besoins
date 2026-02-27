/**
 * Filter questions based on conditional display rules.
 * 
 * A question displays only if:
 * - It has no conditional rules (showIfQuestionId is null/empty), OR
 * - Its parent question exists, and the current response matches the condition
 * 
 * @param {Array} questions - All questions available
 * @param {Object} responses - Current user responses { questionId: answer }
 * @returns {Array} Filtered questions that should be displayed
 */
export function filterConditionalQuestions(questions, responses) {
  return questions.filter((q) => {
    // If there are no modern rules and no legacy fields, always display
    const hasRules = Array.isArray(q.showIfRules) && q.showIfRules.length > 0;
    const legacy = q.showIfQuestionId || (Array.isArray(q.showIfResponseIndexes) && q.showIfResponseIndexes.length > 0) || (q.showIfResponseValue && String(q.showIfResponseValue).trim());
    if (!hasRules && !legacy) return true;

    // Helper to evaluate a single rule against current responses
    const evalRule = (rule) => {
      if (!rule || !rule.questionId) return false;
      const parent = questions.find((pq) => pq.id === rule.questionId);
      if (!parent) return false;
      const parentResponse = responses[rule.questionId];

      if (parent.responseType === 'text') {
        if (!rule.responseValue) return false;
        return String(parentResponse || "").toLowerCase().trim() === String(rule.responseValue || "").toLowerCase().trim();
      }

      if (Array.isArray(rule.responseIndexes) && rule.responseIndexes.length > 0) {
        const triggering = rule.responseIndexes.map((idx) => parent.options[idx]);
        return triggering.includes(parentResponse);
      }

      return false;
    };

    // Evaluate modern rules (OR semantics): show if ANY rule matches
    if (hasRules) {
      return q.showIfRules.some((r) => evalRule(r));
    }

    // Fallback to legacy single-parent handling (backwards compatibility)
    const parentQuestion = questions.find((pq) => pq.id === q.showIfQuestionId);
    if (!parentQuestion) return false;
    const parentResponse = responses[q.showIfQuestionId];
    if (parentQuestion.responseType === 'text') {
      return (
        !!q.showIfResponseValue &&
        String(parentResponse || "").toLowerCase().trim() === String(q.showIfResponseValue || "").toLowerCase().trim()
      );
    }
    if (Array.isArray(q.showIfResponseIndexes) && q.showIfResponseIndexes.length > 0) {
      const triggeringOptions = q.showIfResponseIndexes.map((idx) => parentQuestion.options[idx]);
      return triggeringOptions.includes(parentResponse);
    }
    return false;
  });
}

