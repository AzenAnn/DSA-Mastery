import { LabError } from "../errors.ts";

export type Version = readonly [number, number, number];

export const NODE_MINIMUM: Version = [22, 13, 0];

export const MINIMUMS = {
  node: NODE_MINIMUM,
  gcc: [11, 0, 0],
  clang: [14, 0, 0],
  msvc: [19, 30, 0],
  cmake: [3, 25, 0],
  make: [4, 0, 0],
} as const satisfies Record<string, Version>;

export type ToolName = keyof typeof MINIMUMS;

export interface Profile {
  name: string;
  requiresCompiler: boolean;
  requiresCmake: boolean;
}

export const PROFILES = {
  runtime: { name: "runtime", requiresCompiler: false, requiresCmake: false },
  basic: { name: "basic", requiresCompiler: true, requiresCmake: false },
  full: { name: "full", requiresCompiler: true, requiresCmake: true },
} as const satisfies Record<string, Profile>;

export type ProfileName = keyof typeof PROFILES;

export function parseVersion(source: unknown, pattern = /(\d+)\.(\d+)(?:\.(\d+))?/): Version | undefined {
  const match = String(source ?? "").match(pattern);

  return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : undefined;
}

export function compareVersion(actual: Version | undefined, minimum: Version | undefined): boolean {
  if (!actual || !minimum) return false;
  for (let index = 0; index < Math.max(actual.length, minimum.length); index += 1) {
    const difference = (actual[index] ?? 0) - (minimum[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }

  return true;
}

export function formatVersion(version: Version | undefined): string {
  return version?.join(".") ?? "unknown";
}

export function profileRequirements(profile: string): Profile {
  const result: Profile | undefined = PROFILES[profile as ProfileName];
  if (result === undefined) {
    throw new LabError("ARGUMENT_INVALID", `不支持的安装 profile：${profile}（可选 runtime、basic 或 full）`);
  }

  return result;
}
