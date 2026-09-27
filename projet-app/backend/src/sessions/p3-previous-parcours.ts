/**
 * P1 and P2 formations validated before a P3, for the P3 report (PDF). Same sources as
 * the results page (frontend utils/p3PreviousParcours.js): the P3 explanation
 * "P1 + P2 -> P3", then the candidate's earlier completed sessions.
 */

type SessionLike = {
  id?: string;
  explanationMessage?: string | null;
  finalRecommendation?: string | null;
  createdAt?: Date | string;
};

const normalize = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const splitRecommendation = (value?: string | null) =>
  String(value || '')
    .split(/\s*&\s*|\s*\|\s*|\s+et\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

function fromExplanation(message?: string | null): string[] {
  const source = String(message || '');
  if (!source.includes('->')) return [];
  return source
    .split('->')[0]
    .split(/\s+\+\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getP3PreviousParcours(
  session: SessionLike,
  previousSessions: SessionLike[] = [],
  currentRecommendations: string[] = [],
): string[] {
  const exclude = new Set(currentRecommendations.map(normalize));
  const labels: string[] = [];
  const add = (label: string) => {
    const clean = normalize(label);
    if (!clean || exclude.has(clean) || labels.some((item) => normalize(item) === clean)) return;
    labels.push(label);
  };

  fromExplanation(session.explanationMessage).forEach(add);
  [...previousSessions]
    .filter((item) => item?.id !== session.id)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
    .forEach((item) => splitRecommendation(item.finalRecommendation).forEach(add));

  return labels.slice(0, 2);
}
