export const SECURITY_QUESTIONS = [
  {
    id: "pet",
    label: "Jak miało na imię Twoje pierwsze zwierzę?",
  },
  {
    id: "city",
    label: "W jakim mieście się urodziłeś/urodziłaś?",
  },
  {
    id: "school",
    label: "Jak nazywała się Twoja pierwsza szkoła?",
  },
  {
    id: "nickname",
    label: "Jaki był Twój dziecięcy przydomek?",
  },
  {
    id: "car",
    label: "Jaka była marka Twojego pierwszego samochodu?",
  },
] as const;

export type SecurityQuestionId = (typeof SECURITY_QUESTIONS)[number]["id"];

export function getSecurityQuestionLabel(id: string): string | null {
  return SECURITY_QUESTIONS.find((question) => question.id === id)?.label ?? null;
}

export function isSecurityQuestionId(id: string): id is SecurityQuestionId {
  return SECURITY_QUESTIONS.some((question) => question.id === id);
}

export function normalizeSecurityAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/\s+/g, " ");
}
