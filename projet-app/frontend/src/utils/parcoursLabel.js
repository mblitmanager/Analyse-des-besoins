export function normalizeParcoursLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isMeaningfulParcoursTitle(title, formationLabel) {
  const cleanTitle = normalizeParcoursLabel(title);
  if (!cleanTitle) return false;
  if (
    cleanTitle === "parcours" ||
    cleanTitle === "parcours personnalise" ||
    cleanTitle === "parcours de formation"
  ) {
    return false;
  }

  const cleanFormation = normalizeParcoursLabel(formationLabel);
  return !cleanFormation || cleanTitle !== cleanFormation;
}

export function getSessionParcoursTitle(session, fallbackFormationLabel = "") {
  if (!session) return "";
  const title = String(session.parcoursTitle || "").trim();
  const formationLabel = fallbackFormationLabel || session.formationChoisie || "";
  return isMeaningfulParcoursTitle(title, formationLabel) ? title : "";
}
