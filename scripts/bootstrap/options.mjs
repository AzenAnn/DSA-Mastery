export const DEFAULT_REPO_URL = "https://github.com/AzenAnn/DSA-Mastery.git";

const VALUE_OPTIONS = new Set(["profile", "repo-dir", "repo-url", "ui"]);
const BOOLEAN_OPTIONS = new Map([
  ["check-only", "checkOnly"],
  ["skip-vscode", "skipVscode"],
  ["install-vscode", "installVscode"],
  ["update-repo", "updateRepo"],
  ["non-interactive", "nonInteractive"],
  ["json", "json"],
  ["no-ui", "noUi"],
  ["help", "help"],
]);

function invalid(message) {
  const error = new Error(message);
  error.code = "ARGUMENT_INVALID";
  return error;
}

function assignValue(result, key, value) {
  if (key === "profile" && !["runtime", "basic", "full"].includes(value)) {
    throw invalid(`--profile 必须是 runtime、basic 或 full，收到：${value}`);
  }
  if (key === "ui" && !["auto", "tui", "plain"].includes(value)) {
    throw invalid(`--ui 必须是 auto、tui 或 plain，收到：${value}`);
  }
  result[{ "repo-dir": "repoDir", "repo-url": "repoUrl" }[key] ?? key] = value;
}

export function parseSetupArgs(argv = []) {
  const result = {
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
      else result[booleanKey] = value;
      continue;
    }
    if (!VALUE_OPTIONS.has(rawKey)) throw invalid(`未知选项：--${rawKey}`);
    const value = inlineValue ?? argv[++index];
    if (value === undefined || String(value).startsWith("--")) throw invalid(`--${rawKey} 缺少值`);
    assignValue(result, rawKey, String(value));
  }

  if (noUi && result.ui !== "auto") throw invalid("--ui 与 --no-ui 不能同时指定");
  if (noUi) result.ui = "plain";
  if (result.json) result.ui = "plain";
  if (result.nonInteractive) result.ui = "plain";
  return result;
}
