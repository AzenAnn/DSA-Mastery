export const EXIT = {
  OK: 0,
  SCORE_NOT_FULL: 1,
  TOOL_ERROR: 2,
} as const;

export class LabError extends Error {
  readonly code: string;
  readonly details: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "LabError";
    this.code = code;
    this.details = details;
  }
}

export function asLabError(error: unknown): LabError {
  if (error instanceof LabError) return error;

  return new LabError("LAB_INTERNAL", error instanceof Error ? error.message : String(error));
}
