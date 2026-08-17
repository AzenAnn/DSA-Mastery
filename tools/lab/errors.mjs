export const EXIT = Object.freeze({
  OK: 0,
  SCORE_NOT_FULL: 1,
  TOOL_ERROR: 2,
});

export class LabError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "LabError";
    this.code = code;
    this.details = details;
  }
}

export function asLabError(error) {
  if (error instanceof LabError) return error;
  return new LabError("LAB_INTERNAL", error instanceof Error ? error.message : String(error));
}
