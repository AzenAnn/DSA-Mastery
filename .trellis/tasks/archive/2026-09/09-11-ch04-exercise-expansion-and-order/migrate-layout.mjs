import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, rename, access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
const { createLab } = await import(pathToFileURL(path.resolve("tools/lab/scaffold.mjs")));

const root = process.cwd();
const task = path.resolve(import.meta.dirname);
const parent = path.join(root, "labs/chapter-04/exercise");
const mapping = JSON.parse(await readFile(path.join(task, "mapping.json"), "utf8"));
const pad = (n) => String(n).padStart(2, "0");
const directory = (n, slug) => `E-04-${pad(n)}-${slug}`;
const exists = (p) => access(p).then(() => true, () => false);
assert.equal(mapping.length, 34);
assert.equal(new Set(mapping.map((m) => m.number)).size, 34);
assert.equal(mapping.filter((m) => m.old).length, 20);

async function fingerprint(labPath) {
  const entries = (await readdir(labPath, { recursive: true, withFileTypes: true }))
    .filter((e) => e.isFile() && e.name !== "README.md" && !e.parentPath.includes(".lab-cache"))
    .map((e) => path.relative(labPath, path.join(e.parentPath, e.name)).replaceAll("\\", "/"))
    .sort();
  const hash = createHash("sha256");
  for (const name of entries) hash.update(name).update("\0").update(await readFile(path.join(labPath, name)));
  return { files: entries.length, sha256: hash.digest("hex") };
}

if (process.argv.includes("--verify")) {
  const before = JSON.parse(await readFile(path.join(task, "old-files.json"), "utf8"));
  for (const row of mapping.filter((m) => m.old)) {
    assert.deepEqual(await fingerprint(path.join(parent, directory(row.number, row.slug))), before[row.old]);
  }
  console.log("PASS: all 20 original Labs retain identical code, manifests and test files.");
} else {
  const plan = mapping.map((row) => ({ ...row, from: row.old ? path.join(parent, directory(row.old, row.slug)) : "scaffold", to: path.join(parent, directory(row.number, row.slug)) }));
  for (const row of plan) {
    assert.ok(row.to.startsWith(`${parent}${path.sep}`));
    if (row.old) {
      assert.ok(row.from.startsWith(`${parent}${path.sep}`));
      assert.ok(await exists(row.from), `Missing source: ${row.from}`);
    }
    assert.ok(!(await exists(row.to)), `Target exists: ${row.to}`);
    console.log(JSON.stringify({ from: row.from, to: row.to }));
  }
  if (!process.argv.includes("--write")) {
    console.log("Dry run; pass --write to scaffold and migrate these validated paths.");
  } else {
    const before = {};
    for (const row of plan.filter((m) => m.old)) before[row.old] = await fingerprint(row.from);
    await writeFile(path.join(task, "old-files.json"), `${JSON.stringify(before, null, 2)}\n`);
    for (const row of plan.filter((m) => !m.old)) {
      const scaffold = await createLab({ type: "program", chapter: 4, slug: row.slug }, root);
      row.from = scaffold.labRoot;
    }
    for (const row of plan) {
      assert.ok(path.resolve(row.from).startsWith(`${parent}${path.sep}`));
      assert.ok(!(await exists(row.to)));
      await rename(row.from, row.to);
    }
    // Match whole directory tokens once so overlapping old/new numbers never cascade.
    const names = new Map(plan.map((row) => [path.basename(row.from), path.basename(row.to)]));
    for (const row of plan) {
      const file = path.join(row.to, "README.md");
      let source = await readFile(file, "utf8");
      const parsed = matter(source);
      const id = `04E${pad(row.number)}`;
      const oldPrefix = /^Lab\s+\d{2}-E-\d{2}[：:]\s*/;
      const title = `Lab 04-E-${pad(row.number)}：${row.old ? parsed.data.title.replace(oldPrefix, "") : row.title}`;
      // Preserve the existing frontmatter's quote style, ordering and line endings.
      const fields = { title: JSON.stringify(title), labId: JSON.stringify(id), order: String(row.number + 8) };
      for (const [key, value] of Object.entries(fields)) {
        assert.ok(Object.hasOwn(parsed.data, key));
        source = source.replace(new RegExp(`^${key}:[^\\r\\n]*`, "m"), `${key}: ${value}`);
      }
      source = source.replace(/^# Lab[^\r\n]*/m, `# ${title}`);
      source = source.replace(/E-04-\d{2}-[a-z0-9-]+/g, (name) => names.get(name) ?? name);
      const result = matter(source).data;
      assert.equal(result.labId, id);
      assert.equal(result.title, title);
      assert.equal(result.order, row.number + 8);
      await writeFile(file, source);
    }
    console.log("Migrated 20 original Labs and created 14 standard Program scaffolds.");
  }
}
