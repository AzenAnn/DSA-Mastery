import type { LabTag, ParsedLabId } from "./lab-id.ts";
import { LabError } from "./errors.ts";
import { formatLabId, parseLabId } from "./lab-id.ts";

export type LabType = "quiz" | "program" | "project";
export type LabCategory = "theory" | "exercise" | "project";

export const LAB_TYPES: ReadonlySet<string> = new Set<LabType>(["quiz", "program", "project"]);
export const LAB_CATEGORIES = ["theory", "exercise", "project"] as const satisfies readonly LabCategory[];

export const LAB_TYPE_TO_TAG = { quiz: "T", program: "E", project: "P" } as const satisfies Record<LabType, LabTag>;
export const LAB_TYPE_TO_CATEGORY = {
  quiz: "theory",
  program: "exercise",
  project: "project",
} as const satisfies Record<LabType, LabCategory>;
export const LAB_CATEGORY_TO_TAG = { theory: "T", exercise: "E", project: "P" } as const satisfies Record<
  LabCategory,
  LabTag
>;

export const LAB_DIRECTORY_PATTERN = /^([TEP])-(\d{2})-(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
export const LAB_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CHAPTER_DIRECTORY_PATTERN = /^chapter-(\d{2})$/;

export interface LabDirectoryIdentity extends ParsedLabId {
  slug: string;
  directoryName: string;
}

export function isLabType(value: unknown): value is LabType {
  return typeof value === "string" && LAB_TYPES.has(value);
}

export function tagForType(type: unknown): LabTag {
  if (!isLabType(type)) throw new LabError("ARGUMENT_INVALID", "--type 必须是 quiz、program 或 project");

  return LAB_TYPE_TO_TAG[type];
}

export function categoryForType(type: LabType): LabCategory {
  return LAB_TYPE_TO_CATEGORY[type];
}

export function tagForCategory(category: unknown): LabTag | undefined {
  return LAB_CATEGORY_TO_TAG[category as LabCategory];
}

export function categoryForTag(tag: unknown): LabCategory | undefined {
  const normalized = String(tag ?? "").toUpperCase();

  return LAB_CATEGORIES.find((category) => LAB_CATEGORY_TO_TAG[category] === normalized);
}

export function formatLabDirectoryName(value: unknown, slug: unknown): string {
  const identity = parseLabId(value);
  const normalizedSlug = String(slug ?? "").trim();
  if (!LAB_SLUG_PATTERN.test(normalizedSlug)) {
    throw new LabError("ARGUMENT_INVALID", "Lab slug 必须是小写 kebab-case");
  }

  return `${identity.tag}-${String(identity.chapter).padStart(2, "0")}-${String(identity.sequence).padStart(2, "0")}-${normalizedSlug}`;
}

export function parseLabDirectoryName(value: unknown): LabDirectoryIdentity {
  const source = String(value ?? "").trim();
  const match = source.match(LAB_DIRECTORY_PATTERN);
  if (!match) {
    throw new LabError("LAB_PATH_INVALID", `Lab 目录格式无效：${source || "(empty)"}；应为 X-CC-SS-kebab-slug`);
  }

  return {
    ...parseLabId(formatLabId(Number(match[2]), match[1], Number(match[3]))),
    slug: match[4],
    directoryName: source,
  };
}
