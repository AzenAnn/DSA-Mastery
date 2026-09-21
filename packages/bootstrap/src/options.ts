import { LabError } from "@dsa/lab-core";

const DEFAULT_REPO_URL = "https://github.com/AzenAnn/DSA-Mastery.git";

export type UiPreference = "auto" | "tui" | "plain";

export interface SetupOptions {
  profile?: "runtime" | "basic" | "full";
  repoDir?: string;
  repoUrl: string;
  checkOnly: boolean;
  ui: UiPreference;
  skipVscode: boolean;
  installVscode: boolean;
  updateRepo: boolean;
  nonInteractive: boolean;
  json: boolean;
  help?: boolean;
  // 交互式选择界面回填的字段
  installCppExtension?: boolean;
  installCmakeExtension?: boolean;
  selection?: string[];
  cancelled?: boolean;
}

const VALUE_OPTIONS = new Set(["profile", "repo-dir", "repo-url", "ui"]);
const VALUE_KEYS: Record<string, keyof SetupOptions> = {
  profile: "profile",
  "repo-dir": "repoDir",
  "repo-url": "repoUrl",
  ui: "ui",
};
const BOOLEAN_OPTIONS = new Map<string, keyof SetupOptions | "noUi">([
  ["check-only", "checkOnly"],
  ["skip-vscode", "skipVscode"],
  ["install-vscode", "installVscode"],
  ["update-repo", "updateRepo"],
  ["non-interactive", "nonInteractive"],
  ["json", "json"],
  ["no-ui", "noUi"],
  ["help", "help"],
]);

function invalid(message: string): LabError {
  return new LabError("ARGUMENT_INVALID", message);
}

function assignValue(result: SetupOptions, key: string, value: string): void {
  if (key === "profile" && !["runtime", "basic", "full"].includes(value)) {
    throw invalid(`--profile 必须是 runtime、basic 或 full，收到：${value}`);
  }
  if (key === "ui" && !["auto", "tui", "plain"].includes(value)) {
    throw invalid(`--ui 必须是 auto、tui 或 plain，收到：${value}`);
  }
  (result as unknown as Record<string, unknown>)[VALUE_KEYS[key]] = value;
}

export function parseSetupArgs(argv: readonly unknown[] = []): SetupOptions {
  const result: SetupOptions = {
    profile: undefined,
    repoDir: undefined,
    repoUrl: DEFAULT_REPO_URL,
    checkOnly: false,
    ui: "auto",
    skipVscode: false,
    installVscode: false,
    updateRepo: false,
    nonInteractive: false,
    json: false,
  };
  let noUi = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index]);
    if (token === "--") continue;
    if (!token.startsWith("--")) throw invalid(`不支持的位置参数：${token}`);
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const booleanKey = BOOLEAN_OPTIONS.get(rawKey);
    if (booleanKey) {
      if (inlineValue !== undefined && !["true", "false"].includes(inlineValue)) {
        throw invalid(`--${rawKey} 只接受 true 或 false`);
      }
      const value = inlineValue === undefined ? true : inlineValue === "true";
      if (booleanKey === "noUi") noUi = value;
      else (result as unknown as Record<string, unknown>)[booleanKey] = value;
      continue;
    }
    if (!VALUE_OPTIONS.has(rawKey)) throw invalid(`未知选项：--${rawKey}`);
    const value = inlineValue ?? argv[++index];
    if (value === undefined || String(value).startsWith("--")) throw invalid(`--${rawKey} 缺少值`);
    assignValue(result, rawKey, String(value));
  }

  if (noUi && result.ui !== "auto") throw invalid("--ui 与 --no-ui 不能同时指定");
  if (noUi) result.ui = "plain";
  if (result.json || result.nonInteractive) result.ui = "plain";

  return result;
}
