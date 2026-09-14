import { spawn, execFileSync } from "node:child_process";
import path from "node:path";

const WINDOWS_SCRIPT_EXT = /\.(cmd|bat|com)$/i;

function resolveWindowsCommand(command, env) {
  if (path.isAbsolute(command)) return command;
  if (/\.(exe|cmd|bat|com|ps1|msi|vbs|js|wsh)$/i.test(command)) return command;
  try {
    const found = execFileSync("where.exe", [command], {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
      env: env ?? process.env,
    });
    const candidates = found.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    // Prefer Windows-executable extensions over extension-less shell scripts
    const withExt = candidates.find((c) => /\.(exe|cmd|bat|com)$/i.test(c));
    if (withExt) return withExt;
    if (candidates[0]) return candidates[0];
  } catch {
    /* where.exe failed; fall through and let spawn report the error */
  }
  return command;
}

function buildSpawnTarget(command, args, env) {
  if (process.platform !== "win32") return { command, args };
  const resolved = resolveWindowsCommand(command, env);
  if (WINDOWS_SCRIPT_EXT.test(resolved)) {
    // Quote the script path, then quote any args containing spaces,
    // and pass the whole line as a single /c argument so cmd.exe
    // preserves spaces inside the path correctly.
    const quotedCommand = `"${resolved}"`;
    const argString = args.map((a) => {
      const value = String(a);
      return /[\s"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
    }).join(" ");
    const fullCommand = argString ? `${quotedCommand} ${argString}` : quotedCommand;
    return {
      command: "cmd.exe",
      args: ["/c", fullCommand],
      windowsVerbatimArguments: true,
    };
  }
  if (/cmd(?:\.exe)?$/i.test(resolved)) {
    return { command: resolved, args, windowsVerbatimArguments: true };
  }
  return { command: resolved, args };
}

export function runCommand(command, args = [], options = {}) {
  const {
    cwd,
    env,
    input = "",
    timeoutMs = 30_000,
    outputLimitKb = 4096,
    inherit = false,
  } = options;
  const childEnvironment = env === undefined ? process.env : { ...process.env, ...env };
  const target = buildSpawnTarget(command, args, childEnvironment);

  if (inherit) {
    return new Promise((resolve, reject) => {
      const started = performance.now();
      const child = spawn(target.command, target.args, {
        cwd,
        env: childEnvironment,
        shell: false,
        windowsHide: true,
        windowsVerbatimArguments: target.windowsVerbatimArguments,
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({
        code,
        signal,
        durationMs: performance.now() - started,
      }));
    });
  }

  return new Promise((resolve) => {
    const started = performance.now();
    const limitBytes = outputLimitKb * 1024;
    const child = spawn(target.command, target.args, {
      cwd,
      env: childEnvironment,
      shell: false,
      windowsHide: true,
      windowsVerbatimArguments: target.windowsVerbatimArguments,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let outputExceeded = false;
    let spawnError;
    let settled = false;

    const stop = () => {
      if (!child.killed) child.kill("SIGKILL");
    };
    const collect = (bucket, chunk, stream) => {
      const size = Buffer.byteLength(chunk);
      if (stream === "stdout") stdoutBytes += size;
      else stderrBytes += size;
      if ((stream === "stdout" ? stdoutBytes : stderrBytes) <= limitBytes) bucket.push(Buffer.from(chunk));
      if (stdoutBytes + stderrBytes > limitBytes) {
        outputExceeded = true;
        stop();
      }
    };

    child.stdout.on("data", (chunk) => collect(stdout, chunk, "stdout"));
    child.stderr.on("data", (chunk) => collect(stderr, chunk, "stderr"));
    child.once("error", (error) => {
      spawnError = error;
    });
    const timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    child.once("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        code,
        signal,
        timedOut,
        outputExceeded,
        spawnError,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdoutBytes,
        stderrBytes,
        durationMs: performance.now() - started,
      });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

export async function commandExists(command, options = {}) {
  const result = await runCommand(command, options.args ?? ["--version"], {
    ...options,
    timeoutMs: options.timeoutMs ?? 5000,
    outputLimitKb: options.outputLimitKb ?? 256,
  });
  return !result.spawnError && result.code === 0;
}

export function commandText(command, args = []) {
  return [command, ...args].map((part) => {
    const value = String(part);
    return /[\s"']/u.test(value) ? JSON.stringify(value) : value;
  }).join(" ");
}
