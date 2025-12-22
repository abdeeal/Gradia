export type Grade = "A" | "B" | "C" | "INVALID";

export function getGrade(score: number): Grade {
  if (typeof score !== "number" || Number.isNaN(score)) return "INVALID";
  if (score < 0 || score > 100) return "INVALID";

  if (score >= 80) return "A";
  if (score >= 60) return "B";
  return "C";
}