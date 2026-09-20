import { access, readFile } from "node:fs/promises";
import { LabError } from "./errors.ts";

export type Json = Record<string, unknown>;

export function isRecord(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);

    return true;
  } catch {
    return false;
  }
}

export async function readJson(file: string, label = file): Promise<unknown> {
  let source: string;
  try {
    source = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") throw new LabError("FILE_NOT_FOUND", `${label} 不存在`);
    throw error;
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new LabError("JSON_INVALID", `${label} JSON 解析失败：${(error as Error).message}`);
  }
}

export function requireRecord(value: unknown, label: string): Json {
  if (!isRecord(value)) throw new LabError("SCHEMA_INVALID", `${label} 必须是对象`);

  return value;
}

export function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new LabError("SCHEMA_INVALID", `${label} 必须是非空字符串`);

  return value;
}

export function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) throw new LabError("SCHEMA_INVALID", `${label} 必须是正整数`);

  return value as number;
}

export function assertKnownKeys(value: Json, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new LabError("SCHEMA_INVALID", `${label} 含未知字段：${unknown.join(", ")}`);
}

export function requireStringArray(value: unknown, label: string, code = "SCHEMA_INVALID"): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new LabError(code, `${label} 必须是非空字符串数组`);
  }

  return value as string[];
}
