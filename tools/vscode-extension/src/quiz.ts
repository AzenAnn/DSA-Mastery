export interface QuizQuestion {
  id: string;
  title?: string;
  source?: string;
  difficulty?: string;
  topics?: string[];
  targetId?: string;
  stem: string;
  code?: string;
  options: string[];
  answer: number;
  explanation: string;
  hint?: string;
  points: number;
}

export interface QuizScore {
  score: number;
  maxScore: number;
  correctCount: number;
  answeredCount: number;
  completed: boolean;
}

export function parseQuizQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("quiz.json 顶层必须是非空题目数组");
  }

  const ids = new Set<string>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`quiz.json: 第 ${index + 1} 题必须是对象`);
    }
    const question = raw as Record<string, unknown>;
    const label = `quiz.json: 第 ${index + 1} 题`;
    const id = requiredString(question.id, `${label}.id`);
    if (ids.has(id)) throw new Error(`${label}: id ${id} 重复`);
    ids.add(id);
    const stem = requiredString(question.stem, `${label}.stem`);
    const explanation = requiredString(question.explanation, `${label}.explanation`);
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`${label}.options 必须恰好包含 4 项`);
    }
    const options = question.options.map((option, optionIndex) => {
      const text = requiredString(option, `${label}.options[${optionIndex}]`);
      if (/^[A-DＡ-Ｄ][.．、:：)）]\s*/i.test(text)) {
        throw new Error(`${label}.options[${optionIndex}] 不要手写 A、B、C、D 前缀`);
      }
      return text;
    });
    if (!Number.isInteger(question.answer) || Number(question.answer) < 0 || Number(question.answer) > 3) {
      throw new Error(`${label}.answer 必须是 0～3 的整数`);
    }
    const points = question.points === undefined ? 1 : question.points;
    if (!Number.isInteger(points) || Number(points) <= 0) {
      throw new Error(`${label}.points 必须是正整数`);
    }

    return {
      id,
      title: optionalString(question.title, `${label}.title`),
      source: optionalString(question.source, `${label}.source`),
      difficulty: optionalString(question.difficulty, `${label}.difficulty`),
      topics: optionalTopics(question.topics, label),
      targetId: optionalString(question.targetId, `${label}.targetId`),
      stem,
      code: optionalString(question.code, `${label}.code`),
      options,
      answer: Number(question.answer),
      explanation,
      hint: optionalString(question.hint, `${label}.hint`),
      points: Number(points),
    };
  });
}

export function scoreQuiz(
  questions: QuizQuestion[],
  selections: Record<string, number | null | undefined>,
): QuizScore {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let answeredCount = 0;
  for (const question of questions) {
    maxScore += question.points;
    const selected = selections[question.id];
    if (selected === null || selected === undefined) continue;
    answeredCount += 1;
    if (selected === question.answer) {
      correctCount += 1;
      score += question.points;
    }
  }
  return {
    score,
    maxScore,
    correctCount,
    answeredCount,
    completed: questions.length > 0 && correctCount === questions.length,
  };
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} 必须是非空字符串`);
  return value;
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, label);
}

function optionalTopics(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((topic) => typeof topic !== "string" || !topic.trim())) {
    throw new Error(`${label}.topics 必须是非空字符串数组`);
  }
  return value as string[];
}
