/**
 * Filters a list of questions based on response-driven conditional logic.
 * Supports:
 * - showIfQuestionId + showIfResponseIndexes
 * - showIfQuestionId + showIfResponseValue
 * - showIfRules (array of dependencies)
 * - Legacy metadata.visibility
 * 
 * @param {Array} questions - The list of questions to filter.
 * @param {Object} responses - The current responses in the form { questionId: value }.
 * @returns {Array} - The filtered list of questions.
 */
/**
 * Filters a list of questions based on response-driven conditional logic.
 * Supports:
 * - showIfQuestionId + showIfResponseIndexes
 * - showIfQuestionId + showIfResponseValue
 * - showIfRules (array of dependencies)
 * - Legacy metadata.visibility
 * 
 * @param {Array} questions - The list of questions to filter.
 * @param {Object} responses - The current responses in the form { questionId: value }.
 * @returns {Array} - The filtered list of questions.
 */
export function filterConditionalQuestions(questions, responses) {
  if (!questions) return [];

  return questions.filter(q => {
    // 1. Check showIfRules (Advanced logic)
    if (q.showIfRules && Array.isArray(q.showIfRules) && q.showIfRules.length > 0) {
      // Typically, all rules must be met (AND logic)
      return q.showIfRules.every(rule => isConditionMet(rule, responses, questions));
    }

    // 2. Check showIfQuestionId (Direct dependency)
    if (q.showIfQuestionId) {
      const rule = {
        questionId: q.showIfQuestionId,
        responseIndexes: q.showIfResponseIndexes,
        responseValue: q.showIfResponseValue
      };
      return isConditionMet(rule, responses, questions);
    }

    // 3. Check legacy metadata.visibility
    if (q.metadata?.visibility) {
      const { dependsOn, value } = q.metadata.visibility;
      const relatedResponse = responses[dependsOn];
      if (Array.isArray(relatedResponse)) {
        return relatedResponse.includes(value);
      }
      return relatedResponse === value;
    }

    // Default: visible if no rules defined
    return true;
  });
}

/**
 * Helper to check if a single condition is met.
 */
function isConditionMet(rule, responses, allQuestions) {
  const depId = rule.questionId;
  const depResponse = responses[depId];

  if (depResponse === undefined || depResponse === null || depResponse === "") {
    return false;
  }

  // Find the dependency question to get its options (for index-based matching)
  const depQuestion = allQuestions.find(q => q.id === depId);

  // Case A: Match by indexes (showIfResponseIndexes)
  if (rule.responseIndexes && Array.isArray(rule.responseIndexes) && depQuestion && depQuestion.options) {
    const selectedValues = Array.isArray(depResponse) ? depResponse : [depResponse];
    
    // Check if any of the selected values' indices are in the allowed responseIndexes
    return selectedValues.some(val => {
      const valIndex = depQuestion.options.indexOf(val);
      return valIndex !== -1 && rule.responseIndexes.includes(valIndex);
    });
  }

  // Case B: Match by value (showIfResponseValue)
  if (rule.showIfResponseValue !== undefined && rule.showIfResponseValue !== null) {
      const ruleVal = rule.showIfResponseValue;
      if (Array.isArray(depResponse)) {
        return depResponse.includes(ruleVal);
      }
      return depResponse === ruleVal;
  }
  
  // Case C: Simple presence check if no specific value/index is required but rule exists
  // (Or if rule.responseValue was used in the JSON instead of showIfResponseValue)
  const directValue = rule.responseValue ?? rule.showIfResponseValue;
  if (directValue !== undefined && directValue !== null) {
    if (Array.isArray(depResponse)) {
      return depResponse.includes(directValue);
    }
    return depResponse === directValue;
  }

  return true; 
}
