export function isPositionnementAnswerCorrect(question, answer) {
  if (question.responseType === 'checkbox' || question.metadata?.type === 'multi_select') {
    if (!Array.isArray(answer) || !Array.isArray(question.correctResponseIndexes)) return false;

    const correctOptions = question.correctResponseIndexes.map((index) => question.options[index]).sort();
    const selectedOptions = [...answer].sort();
    return correctOptions.length === selectedOptions.length &&
      correctOptions.every((option, index) => option === selectedOptions[index]);
  }

  return answer === question.options[question.correctResponseIndex];
}