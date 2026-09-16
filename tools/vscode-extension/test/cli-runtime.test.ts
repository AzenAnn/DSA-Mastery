import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { expect, it } from "vitest";

it("CLI checks trust and explicit Node paths and falls back when PATH has no Node", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa runtime with spaces "));
  const oldPath = process.env.PATH;
  let nodePath = "";
  const fake = { workspace: { isTrusted: true, getConfiguration: () => ({ get: () => nodePath }) } };
  (globalThis as unknown as { runtimeFixture: unknown }).runtimeFixture = fake;
  try {
    const output = path.join(root, "adapter.cjs");
    await build({ entryPoints: [path.resolve("src/cli.ts")], outfile: output, bundle: true, platform: "node", format: "cjs",
      define: { __LAB_NODE_MINIMUM__: "[22,13,0]" },
      plugins: [{ name: "runtime-fixture", setup(builder) {
        builder.onResolve({ filter: /^vscode$/ }, () => ({ path: "vscode", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "module.exports = globalThis.runtimeFixture;" }));
      } }],
    });
    await mkdir(path.join(root, "tools/lab"), { recursive: true });
    await writeFile(path.join(root, "tools/lab/cli.mjs"), 'console.log(JSON.stringify({reportVersion:1,command:"project-status",ok:true,result:{tasks:[],complete:false}}));');
    const { readProjectCurrent } = createRequire(import.meta.url)(output);
    fake.workspace.isTrusted = false;
    await expect(readProjectCurrent(root, ".")).rejects.toThrow(expect.objectContaining({ code: "WORKSPACE_UNTRUSTED" }));
    fake.workspace.isTrusted = true;
    nodePath = path.join(root, "missing-node.exe");
    await expect(readProjectCurrent(root, ".")).rejects.toThrow(expect.objectContaining({ code: "NODE_VERSION" }));
    nodePath = process.execPath;
    expect((await readProjectCurrent(root, ".")).complete).toBe(false);
    nodePath = "";
    process.env.PATH = "";
    expect((await readProjectCurrent(root, ".")).complete).toBe(false);
  } finally {
    if (oldPath === undefined) delete process.env.PATH;
    else process.env.PATH = oldPath;
    delete (globalThis as unknown as { runtimeFixture?: unknown }).runtimeFixture;
    await rm(root, { recursive: true, force: true });
  }
});
