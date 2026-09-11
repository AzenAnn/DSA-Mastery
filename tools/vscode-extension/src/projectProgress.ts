import type { ProjectCurrentState, ProjectScoreResult, ProjectStatus, ProjectTaskResult, Verdict } from "./cli";

export interface ProjectCaseSummary {
  id: string;
  verdict: Verdict;
  points: number;
  maxPoints: number;
  durationMs: number;
  stderr?: string;
  comparison?: {
    equal: boolean;
    difference?: {
      kind: "token" | "line";
      index?: number;
      line?: number;
      column?: number;
      expected: string;
      actual: string;
    };
  };
}

export interface ProjectTestSummary {
  name: string;
  verdict: Verdict;
  points: number;
  maxPoints: number;
  durationMs: number;
  output?: string;
}

export interface ProjectTaskSubmissionSummary {
  id: string;
  kind: "stdio" | "ctest" | "manual";
  status: ProjectStatus;
  weight: number;
  weightedScore: number;
  score?: number;
  maxScore?: number;
  cases?: ProjectCaseSummary[];
  tests?: ProjectTestSummary[];
  checklist?: string[];
  buildFailed?: boolean;
  buildPhase?: "configure" | "build";
  diagnostic?: string;
  blockedBy?: string[];
  historicalScore?: number;
  previousStatus?: ProjectStatus;
  inputFingerprint?: string;
}

export interface ProjectSubmissionSummary {
  at: string;
  target: "student" | "solution";
  automatedScore: number;
  automatedMax: number;
  manualPending: number;
  provisionalTotal: number;
  total: number;
  automatedFull: boolean;
  internalError: boolean;
  tasks: ProjectTaskSubmissionSummary[];
}

export interface ProjectProgress {
  current?: ProjectCurrentState;
  currentUnknown?: boolean;
  submissionCount: number;
  automatedScore: number;
  automatedMax: number;
  manualPending: number;
  provisionalTotal: number;
  total: number;
  automatedFull: boolean;
  internalError: boolean;
  lastSubmission?: ProjectSubmissionSummary;
}

export function summarizeProjectSubmission(result: ProjectScoreResult, at: string): ProjectSubmissionSummary {
  return {
    at,
    target: result.target,
    automatedScore: result.automatedScore,
    automatedMax: result.automatedMax,
    manualPending: result.manualPending,
    provisionalTotal: result.provisionalTotal,
    total: result.total,
    automatedFull: result.automatedFull,
    internalError: result.internalError,
    tasks: result.tasks.map(summarizeTask),
  };
}

export function projectProgressPassed(
  progress: Pick<ProjectProgress, "automatedFull" | "manualPending" | "internalError" | "current" | "currentUnknown">,
): boolean {
  return !progress.currentUnknown && (progress.current ? progress.current.complete : progress.automatedFull && progress.manualPending === 0 && !progress.internalError);
}

function summarizeTask(task: ProjectTaskResult): ProjectTaskSubmissionSummary {
  const common = {
    id: task.id,
    kind: task.kind,
    status: task.status,
    weight: task.weight,
    weightedScore: task.weightedScore,
    inputFingerprint: task.inputFingerprint,
    blockedBy: task.blockedBy,
  };

  if (task.kind === "manual") return { ...common, checklist: [...task.checklist] };
  if (task.kind === "stdio") {
    return {
      ...common,
      score: task.score,
      maxScore: task.maxScore,
      cases: task.judge.cases.map((testCase) => ({
        id: testCase.id,
        verdict: testCase.verdict,
        points: testCase.points,
        maxPoints: testCase.maxPoints,
        durationMs: testCase.durationMs,
        stderr: testCase.stderr?.slice(0, 4000),
        comparison: testCase.comparison,
      })),
      diagnostic: (task.judge.compilation.stderr || task.judge.compilation.stdout).slice(0, 8000),
    };
  }

  return {
    ...common,
    score: task.score,
    maxScore: task.maxScore,
    tests: task.tests.map((test) => ({
      name: test.name,
      verdict: test.verdict,
      points: test.points,
      maxPoints: test.maxPoints,
      durationMs: test.durationMs,
      output: test.output?.slice(0, 8000),
    })),
    buildFailed: task.build ? !task.build.ok : undefined,
    buildPhase: task.build?.phase,
    diagnostic: task.build && !task.build.ok ? `${task.build.build?.stdout ?? task.build.configure?.stdout ?? ""}\n${task.build.build?.stderr ?? task.build.configure?.stderr ?? ""}`.slice(0, 16000) : undefined,
  };
}
