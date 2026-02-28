/**
 * Filters a list of questions based on response-driven conditional logic.
 * 
 * @param {Array} questions - The list of questions to filter.
 * @param {Object} responses - The current responses in the form { questionId: value }.
 * @returns {Array} - The filtered list of questions.
 */
export function filterConditionalQuestions(questions, responses) {
  if (!questions) return [];
  
  return questions.filter(q => {
    // If no visibility rules, the question is always visible
    if (!q.metadata?.visibility) return true;
    
    const { dependsOn, value } = q.metadata.visibility;
    const relatedResponse = responses[dependsOn];
    
    // If the dependency is a multi-select (array)
    if (Array.isArray(relatedResponse)) {
      return relatedResponse.includes(value);
    }
    
    // Standard equality check
    return relatedResponse === value;
  });
}
