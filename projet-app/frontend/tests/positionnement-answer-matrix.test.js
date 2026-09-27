import assert from 'node:assert/strict';
import test from 'node:test';
import { isPositionnementAnswerCorrect } from '../src/utils/positionnementAnswer.js';

const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error('Définir API_BASE_URL vers une API locale de test (ex. http://localhost:3001/api).');
}

// Les corrigés ne sont plus exposés par l'endpoint public : un token admin est requis pour les lire.
const apiToken = process.env.API_TOKEN;
if (!apiToken) {
  throw new Error('Définir API_TOKEN (token JWT admin de l\'API locale) pour lire les corrigés.');
}

const apiUrl = new URL(apiBaseUrl);
if (!['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname)) {
  throw new Error('La matrice est en lecture seule et refuse toute API hors localhost.');
}

async function getJson(path, { auth = false } = {}) {
  const response = await fetch(
    new URL(path.replace(/^\/+/, ''), `${apiUrl.href.replace(/\/$/, '')}/`),
    auth ? { headers: { Authorization: `Bearer ${apiToken}` } } : undefined,
  );
  assert.equal(response.ok, true, `${path} doit répondre avec un statut HTTP réussi`);
  return response.json();
}

test('matrice exhaustive des réponses de positionnement par formation, niveau et question', async () => {
  const formations = (await getJson('/formations')).filter((formation) => formation.isActive);
  assert.ok(formations.length > 0, 'Au moins une formation active est requise');

  const totals = { formations: formations.length, levels: 0, questions: 0, answerCases: 0 };
  const issues = [];
  const record = (condition, message) => {
    if (!condition) issues.push(message);
  };

  for (const formation of formations) {
    const answerKeys = new Map(
      (await getJson(`/questions?formation=${encodeURIComponent(formation.slug)}`, { auth: true }))
        .map((question) => [
          question.id,
          {
            correctResponseIndex: question.correctResponseIndex,
            correctResponseIndexes: question.correctResponseIndexes,
          },
        ]),
    );
    const levels = (await getJson(`/formations/${encodeURIComponent(formation.slug)}/levels`))
      .filter((level) => level.isActive);
    totals.levels += levels.length;

    for (const level of levels) {
      const publicQuestions = await getJson(
        `/questions/positionnement?formation=${encodeURIComponent(formation.slug)}&niveau=${encodeURIComponent(level.label)}`,
      );
      const questions = publicQuestions.map((question) => {
        record(
          question.correctResponseIndex === undefined && question.correctResponseIndexes === undefined,
          `${formation.slug} / ${level.label} / question ${question.id}: corrigé exposé par l'endpoint public`,
        );
        return { ...question, ...answerKeys.get(question.id) };
      });
      const seenIds = new Set();

      for (const question of questions) {
        const scenario = `${formation.slug} / ${level.label} / question ${question.id}`;
        totals.questions++;

        record(Boolean(question.id), `${scenario}: identifiant manquant`);
        record(!seenIds.has(question.id), `${scenario}: question dupliquée dans ce niveau`);
        seenIds.add(question.id);
        const hasValidOptions = Array.isArray(question.options) &&
          question.options.length > 0 &&
          question.options.every((option) => typeof option === 'string' && option.trim());
        record(hasValidOptions, `${scenario}: choix manquants ou vides`);
        if (!hasValidOptions) continue;
        record(
          new Set(question.options).size === question.options.length,
          `${scenario}: choix dupliqués (${question.options.map((option, index) => `${index + 1}=${JSON.stringify(option)}`).join(', ')})`,
        );

        const responseType = question.responseType || 'qcm';
        if (responseType === 'checkbox' || question.metadata?.type === 'multi_select') {
          const correctIndexes = question.correctResponseIndexes;
          const hasValidCorrectIndexes = Array.isArray(correctIndexes) &&
            correctIndexes.length > 0 &&
            correctIndexes.every((index) => Number.isInteger(index) && index >= 0 && index < question.options.length);
          record(hasValidCorrectIndexes, `${scenario}: corrigé multiple manquant ou invalide`);
          if (!hasValidCorrectIndexes) continue;

          const combinationCount = 2 ** question.options.length;
          record(combinationCount <= 1_048_576, `${scenario}: trop de combinaisons pour une exécution exhaustive`);
          if (combinationCount > 1_048_576) continue;
          for (let mask = 0; mask < combinationCount; mask++) {
            const selectedIndexes = question.options
              .map((_, index) => index)
              .filter((index) => mask & (2 ** index));
            const answer = selectedIndexes.map((index) => question.options[index]);
            const expected = selectedIndexes.length === correctIndexes.length &&
              selectedIndexes.every((index) => correctIndexes.includes(index));
            record(
              isPositionnementAnswerCorrect(question, answer) === expected,
              `${scenario} / combinaison ${mask.toString(2).padStart(question.options.length, '0')}`,
            );
            totals.answerCases++;
          }
        } else {
          record(['qcm', 'text'].includes(responseType), `${scenario}: type de réponse non couvert (${responseType})`);
          if (!['qcm', 'text'].includes(responseType)) continue;
          const correctIndex = question.correctResponseIndex;
          const hasValidCorrectIndex = Number.isInteger(correctIndex) &&
            correctIndex >= 0 && correctIndex < question.options.length;
          record(hasValidCorrectIndex, `${scenario}: index de bonne réponse invalide`);
          if (!hasValidCorrectIndex) continue;

          for (let index = 0; index < question.options.length; index++) {
            const expected = index === correctIndex;
            record(
              isPositionnementAnswerCorrect(question, question.options[index]) === expected,
              `${scenario} / réponse ${index + 1}/${question.options.length} (${JSON.stringify(question.options[index])}) attendue ${expected ? 'correcte' : 'incorrecte'}`,
            );
            totals.answerCases++;
          }

          if (responseType === 'text') {
            record(!isPositionnementAnswerCorrect(question, ''), `${scenario} / texte vide`);
            const unknownAnswer = '__reponse_non_proposee__';
            record(!question.options.includes(unknownAnswer), `${scenario}: sentinelle présente parmi les choix`);
            record(!isPositionnementAnswerCorrect(question, unknownAnswer), `${scenario} / texte inconnu`);
            totals.answerCases += 2;
          }
        }
      }
    }
  }

  console.log(`Matrice vérifiée: ${totals.formations} formations, ${totals.levels} niveaux, ${totals.questions} questions, ${totals.answerCases} cas de réponse.`);
  if (issues.length > 0) {
    const report = issues.slice(0, 50).map((issue) => `- ${issue}`).join('\n');
    assert.fail(`${issues.length} anomalie(s) détectée(s).${issues.length > 50 ? ' Premières 50 :' : ''}\n${report}`);
  }
});