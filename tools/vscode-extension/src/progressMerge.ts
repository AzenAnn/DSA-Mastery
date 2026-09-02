import type { LabProgress, QuizProgress } from "./progress";

export function mergeLabProgress(stable: LabProgress, legacy: LabProgress): LabProgress {
  const history = [...stable.history, ...legacy.history]
    .filter((entry, index, entries) =>
      entries.findIndex((candidate) => candidate.id === entry.id && candidate.snapshot === entry.snapshot) === index,
    )
    .sort((left, right) => right.at.localeCompare(left.at));
  const latest = [stable.lastSubmission, legacy.lastSubmission]
    .filter((entry): entry is NonNullable<LabProgress["lastSubmission"]> => Boolean(entry))
    .sort((left, right) => right.at.localeCompare(left.at))[0];
  const firstPassedAt = [stable.firstPassedAt, legacy.firstPassedAt]
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  return {
    passed: stable.passed || legacy.passed,
    firstPassedAt,
    bestScore: Math.max(stable.bestScore, legacy.bestScore),
    maxScore: Math.max(stable.maxScore, legacy.maxScore),
    submissionCount: Math.max(stable.submissionCount, legacy.submissionCount, history.length),
    lastSubmission: latest,
    history,
  };
}

export function mergeQuizProgress(stable: QuizProgress, legacy: QuizProgress): QuizProgress {
  const answers = { ...legacy.answers, ...stable.answers };
  for (const [id, answer] of Object.entries(legacy.answers)) {
    const current = answers[id];
    if (
      !current ||
      answer.answeredAt > current.answeredAt ||
      (answer.answeredAt === current.answeredAt && answer.attempts > current.attempts)
    ) {
      answers[id] = answer;
    }
  }

  return {
    passed: stable.passed || legacy.passed,
    bestScore: Math.max(stable.bestScore, legacy.bestScore),
    maxScore: Math.max(stable.maxScore, legacy.maxScore),
    answers,
  };
}
