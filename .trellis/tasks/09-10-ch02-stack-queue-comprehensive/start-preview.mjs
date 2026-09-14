import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import { createServer } from "node:net";

let port = 4173;
while (true) {
  const available = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => error.code === "EADDRINUSE" ? resolve(false) : reject(error));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
  if (available) break;
  port += 1;
}
const output = "outputs/ch02-stack-queue-preview";
mkdirSync(output, { recursive: true });
const stdout = openSync(`${output}/server.log`, "a");
const stderr = openSync(`${output}/server-error.log`, "a");
const child = spawn(process.execPath, [
  "node_modules/vitepress/bin/vitepress.js", "preview", ".",
  "--host", "127.0.0.1", "--port", String(port),
], {
  cwd: process.cwd(),
  env: { ...process.env, GITHUB_PAGES_BASE_PATH: "/DSA-Mastery" },
  detached: true,
  windowsHide: true,
  stdio: ["ignore", stdout, stderr],
});
child.unref();
closeSync(stdout);
closeSync(stderr);
console.log(JSON.stringify({ pid: child.pid, url: `http://127.0.0.1:${port}/DSA-Mastery/` }));
