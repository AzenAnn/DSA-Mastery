import { spawn } from "node:child_process";

export function runProcess(command, args, options = {}) {
  const {
    cwd,
    input = "",
    timeMs = 30_000,
    outputKb = 4096,
    inherit = false,
  } = options;
  if (inherit) {
    return new Promise((resolve, reject) => {
      const started = performance.now();
      const child = spawn(command, args, { cwd, shell: false, windowsHide: true, stdio: "inherit" });
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({ code, signal, durationMs: performance.now() - started }));
    });
  }
  return new Promise((resolve) => {
    const started = performance.now();
    const limitBytes = outputKb * 1024;
    const child = spawn(command, args, { cwd, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
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
      const used = stream === "stdout" ? stdoutBytes : stderrBytes;
      if (used <= limitBytes) bucket.push(Buffer.from(chunk));
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
    }, timeMs);
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
