import { spawn } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import { createServer } from "node:net";

let port = 4173;
while (true) {
  const available = await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => error.code === "EADDRINUSE" ? resolve(false) : reject(error));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
  if (available) break;
  port++;
}
const output = "outputs/ch01-linear-list-preview";
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
closeSync(stdout); closeSync(stderr);
const url = `http://127.0.0.1:${port}/DSA-Mastery/`;
let ready = false;
for (let attempt = 0; attempt < 40; attempt++) {
  if (child.exitCode !== null) throw new Error(`Preview exited with code ${child.exitCode}; inspect ${output}/server-error.log`);
  await new Promise((resolve) => setTimeout(resolve, 250));
  try {
    const response = await fetch(`${url}labs/chapter-01/theory/T-01-06-linear-list-written/`, { signal: AbortSignal.timeout(1000) });
    if (response.ok && (await response.text()).includes("01-T-06")) {
      ready = true;
      break;
    }
  } catch {}
}
if (!ready) throw new Error(`Preview did not become ready; inspect ${output}/server-error.log`);
console.log(JSON.stringify({ pid: child.pid, url }));
