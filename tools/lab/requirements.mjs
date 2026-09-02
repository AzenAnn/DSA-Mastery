export const NODE_MINIMUM = Object.freeze([22, 13, 0]);
export const PNPM_VERSION = "11.1.1";

export const MINIMUMS = Object.freeze({
  node: NODE_MINIMUM,
  gcc: Object.freeze([11, 0, 0]),
  clang: Object.freeze([14, 0, 0]),
  msvc: Object.freeze([19, 30, 0]),
  cmake: Object.freeze([3, 25, 0]),
  make: Object.freeze([4, 0, 0]),
});

export const PROFILES = Object.freeze({
  basic: Object.freeze({ name: "basic", requiresCompiler: true, requiresCmake: false }),
  full: Object.freeze({ name: "full", requiresCompiler: true, requiresCmake: true }),
});

export function parseVersion(source, pattern = /(\d+)\.(\d+)(?:\.(\d+))?/) {
  const match = String(source ?? "").match(pattern);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : undefined;
}

export function compareVersion(actual, minimum) {
  if (!actual || !minimum) return false;
  for (let index = 0; index < Math.max(actual.length, minimum.length); index += 1) {
    const difference = (actual[index] ?? 0) - (minimum[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return true;
}

export function formatVersion(version) {
  return version?.join(".") ?? "unknown";
}

export function profileRequirements(profile) {
  const result = PROFILES[profile];
  if (!result) {
    const error = new Error(`不支持的安装 profile：${profile}（可选 basic 或 full）`);
    error.code = "ARGUMENT_INVALID";
    throw error;
  }
  return result;
}
