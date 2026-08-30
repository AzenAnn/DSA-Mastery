import path from "node:path";
import * as vscode from "vscode";
import { CliError, runDoctor, type DoctorResult } from "./cli";
import type { ProgramLab } from "./labIndex";

/** 仓库内已有的环境准备指南，按平台选择。 */
function setupGuide(platform: string): { label: string; relativePath: string } {
  return platform === "win32"
    ? { label: "Windows 学生实验环境安装指南", relativePath: "docs/WINDOWS_STUDENT_SETUP_GUIDE.md" }
    : { label: "macOS 学生实验环境安装指南", relativePath: "docs/MACOS_STUDENT_SETUP_GUIDE.md" };
}

async function openGuide(repoRoot: string, relativePath: string): Promise<void> {
  const uri = vscode.Uri.file(path.join(repoRoot, relativePath));
  try {
    await vscode.commands.executeCommand("markdown.showPreview", uri);
  } catch {
    await vscode.window.showTextDocument(uri);
  }
}

/** 环境有问题时提示，并给出打开对应平台指南的入口。 */
export async function reportEnvironmentIssues(
  repoRoot: string,
  environment: DoctorResult,
): Promise<void> {
  const guide = setupGuide(environment.platform);
  const choice = await vscode.window.showWarningMessage(
    `实验环境尚未就绪：${environment.issues.join("；")}`,
    `打开${guide.label}`,
    "忽略",
  );
  if (choice && choice.startsWith("打开")) {
    await openGuide(repoRoot, guide.relativePath);
  }
}

/**
 * 提交前的环境守卫。
 *
 * 每个会话只在首次提交前检查一次 —— doctor 要探测编译器与 CMake，每次提交都跑
 * 一遍没有必要。检查失败时返回 false 阻止提交，并给出平台化的安装指引。
 */
export class EnvironmentGuard {
  private verified = false;

  constructor(private readonly repoRoot: string) {}

  async ensureReady(lab: ProgramLab): Promise<boolean> {
    if (this.verified) return true;

    let environment: DoctorResult;
    try {
      environment = await runDoctor(this.repoRoot, lab.relativePath);
    } catch (error) {
      // doctor 本身跑不起来（例如找不到 Node）时，把原因如实说出来，
      // 不要伪装成"环境正常"继续往下走。
      const message = error instanceof CliError ? error.message : String(error);
      // 不 await：这里只是报错，等用户关闭通知会一直占住提交锁。
      void vscode.window.showErrorMessage(`无法检查实验环境：${message}`);
      return false;
    }

    if (!environment.ok) {
      await reportEnvironmentIssues(this.repoRoot, environment);
      return false;
    }

    this.verified = true;
    return true;
  }

  /** 手动重跑检查，并把完整结果显示出来。 */
  async inspect(lab: ProgramLab): Promise<void> {
    const environment = await runDoctor(this.repoRoot, lab.relativePath);
    this.verified = environment.ok;

    if (environment.ok) {
      const compilers = environment.tools
        .filter((tool) => tool.available && tool.meetsMinimum)
        .map((tool) => `${tool.name} ${tool.version ?? ""}`.trim())
        .join("、");
      await vscode.window.showInformationMessage(
        `实验环境就绪。可用编译器：${compilers || "未知"}${
          environment.makeAvailable ? "；GNU Make 可用" : "；GNU Make 未安装（可选）"
        }`,
      );
      return;
    }
    await reportEnvironmentIssues(this.repoRoot, environment);
  }
}
