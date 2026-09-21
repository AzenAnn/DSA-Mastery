import type { SetupOptions } from "../options.ts";
import type { SetupContext } from "./context.ts";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import {
  commandAvailable,
  pathExists,
  prependPath,
  recordCommand,
  refreshPlatformEnvironment,
  resultFailed,
  runExternal,
  runWithRunner,
} from "./context.ts";
import { detectPackageManager, ensureHomebrew, wingetInstall } from "./toolchain.ts";

export function planIdeExtensions(options: Partial<SetupOptions> = {}, profile = "basic"): string[] {
  if (options.selection !== undefined) {
    return [
      ...(options.installCppExtension === true ? ["ms-vscode.cpptools"] : []),
      ...(options.installCmakeExtension === true ? ["ms-vscode.cmake-tools"] : []),
    ];
  }
  return [
    ...(profile === "runtime" ? [] : ["ms-vscode.cpptools"]),
    ...(profile === "full" ? ["ms-vscode.cmake-tools"] : []),
  ];
}

async function detectVSCode(context: SetupContext): Promise<{ found: boolean; inPath?: boolean; path?: string }> {
  const direct = await commandAvailable(context, "code", ["--version"]);
  if (direct) return { found: true, inPath: true };

  if (context.platform === "darwin") {
    for (const application of [
      "/Applications/Visual Studio Code.app",
      path.join(os.homedir(), "Applications/Visual Studio Code.app"),
    ]) {
      const binDir = path.join(application, "Contents/Resources/app/bin");
      if (!(await pathExists(path.join(binDir, "code")))) continue;
      context.env.PATH = prependPath(context.env.PATH, [binDir], ":");
      if (await commandAvailable(context, "code", ["--version"])) return { found: true, inPath: false, path: binDir };
    }
  }

  if (context.platform !== "win32") return { found: false };

  // Try where.exe against the live process PATH (may have entries lost by refresh)
  try {
    const { execFileSync } = await import("node:child_process");
    const found = execFileSync("where.exe", ["code"], {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
      env: process.env,
    });
    const candidates = found
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const codeCmd =
      candidates.find((p) => /\.cmd$/i.test(p)) ?? candidates.find((p) => /\.exe$/i.test(p)) ?? candidates[0];
    if (codeCmd !== undefined && (await pathExists(codeCmd))) {
      const binDir = path.dirname(codeCmd);
      context.env.PATH = prependPath(context.env.PATH, [binDir], ";");
      const retry = await commandAvailable(context, "code", ["--version"]);
      if (retry) return { found: true, inPath: false, path: binDir };
    }
  } catch {
    /* where.exe not available or code not found */
  }

  // Scan standard install directories
  const standardDirs: string[] = [];
  if (context.env.LOCALAPPDATA !== undefined)
    standardDirs.push(path.join(context.env.LOCALAPPDATA, "Programs", "Microsoft VS Code", "bin"));
  if (context.env.ProgramFiles !== undefined)
    standardDirs.push(path.join(context.env.ProgramFiles, "Microsoft VS Code", "bin"));
  if (context.env["ProgramFiles(x86)"] !== undefined)
    standardDirs.push(path.join(context.env["ProgramFiles(x86)"], "Microsoft VS Code", "bin"));
  for (const binDir of standardDirs) {
    if (await pathExists(path.join(binDir, "code.cmd"))) {
      context.env.PATH = prependPath(context.env.PATH, [binDir], ";");
      const retry = await commandAvailable(context, "code", ["--version"]);
      if (retry) return { found: true, inPath: false, path: binDir };
    }
  }
  return { found: false };
}

export async function installIde(context: SetupContext): Promise<Record<string, unknown>> {
  if (context.options.skipVscode || !context.options.installVscode)
    return { status: "skipped", message: "未选择 VS Code" };
  const detected = await detectVSCode(context);
  if (detected.found && !detected.inPath) {
    context.ui.update("ide", "running", `检测到已安装 VS Code：${detected.path}`);
  }
  let code = await commandAvailable(context, "code", ["--version"]);
  if (!code) {
    if (context.platform === "darwin") {
      await ensureHomebrew(context);
      await runExternal(context, context.packageManager!.command, ["install", "--cask", "visual-studio-code"], {
        stage: "ide",
        inherit: true,
        timeMs: 20 * 60_000,
      });
    } else if (context.platform === "win32") {
      if (!context.packageManager) context.packageManager = await detectPackageManager(context);
      if (!context.packageManager) return { status: "warning", message: "未找到 winget，跳过 VS Code" };
      const install = wingetInstall("Microsoft.VisualStudioCode");
      await runExternal(context, install.command, install.args, { stage: "ide", inherit: true, timeMs: 20 * 60_000 });
    }
    await refreshPlatformEnvironment(context);
    code = await commandAvailable(context, "code", ["--version"]);
  }
  if (!code) return { status: "warning", message: "VS Code 安装后当前终端仍找不到 code，请打开新终端" };
  const extensions = planIdeExtensions(context.options, context.profile);
  const failures = [];
  for (const extension of extensions) {
    const result = await runWithRunner(context, "code", ["--install-extension", extension, "--force"], {
      timeMs: 120_000,
      outputKb: 2048,
    });
    recordCommand(context, "code", ["--install-extension", extension, "--force"], result);
    if (resultFailed(result)) failures.push(extension);
  }
  return failures.length
    ? { status: "warning", message: `扩展安装失败：${failures.join(", ")}` }
    : { status: "success", message: extensions.length ? "VS Code 与所选扩展已准备" : "VS Code 已准备" };
}
