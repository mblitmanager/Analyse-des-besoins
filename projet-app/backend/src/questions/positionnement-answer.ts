import { Question } from '../entities/question.entity';

type AnswerKey = Pick<
  Question,
  'responseType' | 'metadata' | 'options' | 'correctResponseIndex' | 'correctResponseIndexes'
>;

// Mirrors frontend/src/utils/positionnementAnswer.js: answers are option texts, not indexes.
export function isPositionnementAnswerCorrect(question: AnswerKey, answer: unknown): boolean {
  const options = question.options || [];
  if (question.responseType === 'checkbox' || question.metadata?.type === 'multi_select') {
    if (!Array.isArray(answer) || !Array.isArray(question.correctResponseIndexes)) return false;
    const correctOptions = question.correctResponseIndexes.map((index) => options[index]).sort();
    const selectedOptions = [...answer].sort();
    return (
      correctOptions.length === selectedOptions.length &&
      correctOptions.every((option, index) => option === selectedOptions[index])
    );
  }
  return answer !== undefined && answer === options[question.correctResponseIndex];
}

export function stripAnswerKey<T extends Partial<Question>>(question: T) {
  const { correctResponseIndex, correctResponseIndexes, ...rest } = question;
  return rest;
}
