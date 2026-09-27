import { getSessionParcoursTitle, normalizeParcoursLabel } from "./parcoursLabel";

export function splitRecommendation(value) {
  return String(value || "")
    .split(/\s*&\s*|\s*\|\s*|\s+et\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function sessionRecommendationItems(sourceSession) {
  if (!sourceSession) return [];
  const labels = [];
  const title = getSessionParcoursTitle(sourceSession);
  const add = (label) => {
    const clean = normalizeParcoursLabel(label);
    if (!clean || clean === normalizeParcoursLabel(title)) return;
    if (!labels.some((item) => normalizeParcoursLabel(item) === clean)) {
      labels.push(label);
    }
  };

  if (Array.isArray(sourceSession.recommendations)) {
    sourceSession.recommendations.forEach(add);
  }
  splitRecommendation(sourceSession.finalRecommendation).forEach(add);
  if (labels.length === 0 && title) labels.push(title);
  return labels;
}

function previousItemsFromExplanation(message) {
  const source = String(message || "");
  if (!source.includes("->")) return [];
  const [leftSide] = source.split("->");
  return leftSide
    .split(/\s+\+\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * P1 and P2 formations that preceded a P3 session, from the P3 explanation message,
 * the values saved when P3 started (localStorage) and the candidate's previous sessions.
 */
export function getP3PreviousParcours(session) {
  if (!session) return [];
  const previousLabels = [];
  const addPrevious = (label) => {
    const clean = normalizeParcoursLabel(label);
    if (!clean) return;
    if (!previousLabels.some((item) => normalizeParcoursLabel(item) === clean)) {
      previousLabels.push(label);
    }
  };

  previousItemsFromExplanation(session.explanationMessage).forEach(addPrevious);

  [
    localStorage.getItem("p3_prev_p1") || "",
    localStorage.getItem("p3_prev_p2") || "",
  ].forEach(addPrevious);

  const previousSessions = Array.isArray(session.previousSessions)
    ? session.previousSessions
        .filter((item) => item?.id !== session.id)
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    : [];
  previousSessions.forEach((item) => {
    sessionRecommendationItems(item).forEach(addPrevious);
  });

  if (previousLabels.length < 2) {
    splitRecommendation(localStorage.getItem("p3_prev_recommendations")).forEach(addPrevious);
  }

  return previousLabels.slice(0, 2);
}

/** Badge styles shared by the P1/P2/P3 recaps. */
export const PARCOURS_BADGE_CLASSES = [
  "border-[#EAE2D6] bg-[#EAE2D6]/50 text-[#315264]",
  "border-[#315264] bg-[#315264]/10 text-[#315264]",
];
