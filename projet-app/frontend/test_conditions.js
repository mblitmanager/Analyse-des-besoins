import fs from 'fs';
import { filterConditionalQuestions, clearHiddenResponses } from './src/utils/conditionalQuestions.js';

const questions = [
  { id: 1, text: 'Parent', type: 'radio', options: ['Oui', 'Non'] },
  { 
    id: 11, 
    text: 'Child', 
    showIfQuestionId: 1, 
    showIfResponseIndexes: [0] // "Oui" is index 0
  }
];

const responses = {
  1: 'Oui', // user chose 'Oui'
  11: 'Some answer' // user answered child
};

console.log("Running clearHiddenResponses...");
clearHiddenResponses(questions, responses);
console.log("After:", responses);
