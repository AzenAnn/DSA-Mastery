import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadLab } from "../tools/lab/core.mjs";

const root = path.resolve(import.meta.dirname, "..");
const directory = path.join(root, "labs/chapter-07/exercise");
// These are permanent identities; inserting an exercise must not renumber old Labs.
const sequence = [1, 5, 13, 14, 15, 16, 17, 18, 19, 20, 21, 4, 22, 23, 24,
  7, 8, 9, 11, 12, 10, 25, 26, 27, 28, 6, 29, 30, 31, 32];
const normalize = (text) => text.replace(/\r\n?/g, "\n");

test("Ch7 preserves identities and follows all thirty requested exercises", async () => {
  const folders = (await readdir(directory)).filter((name) => /^E-07-\d+-/.test(name));
  assert.equal(folders.length, 32);
  const seen = new Set();
  for (const folder of folders) {
    const labRoot = path.join(directory, folder);
    const lab = await loadLab(labRoot);
    assert.equal(lab.manifest.type, "program");
    const readme = normalize(await readFile(path.join(labRoot, "README.md"), "utf8"));
    const id = Number(/^labId: "07E(\d+)"/m.exec(readme)?.[1]);
    assert.equal(seen.has(id), false);
    seen.add(id);
    assert.equal(Number(/^E-07-(\d+)-/.exec(folder)[1]), id);
    const order = Number(/^order: (\d+)/m.exec(readme)?.[1]);
    const expected = id === 2 ? 191 : id === 3 ? 192 : 101 + sequence.indexOf(id);
    assert.equal(order, expected, folder);
    if (id < 13) continue;
    const title = /^title: "(.+)"$/m.exec(readme)[1];
    assert.match(title, new RegExp(`^Lab 07-E-${id}：`));
    assert.ok(readme.includes(`# ${title}\n`));
    const cases = JSON.parse(await readFile(path.join(labRoot, "tests/cases.json"), "utf8"));
    assert.ok(cases.length >= 20, folder);
    assert.equal(cases.reduce((sum, item) => sum + item.points, 0), 100);
    const tags = new Set(cases.flatMap((item) => item.tags));
    for (const tag of ["sample", "normal", "boundary", "regression", "stress"]) {
      assert.ok(tags.has(tag), `${folder}: missing ${tag}`);
    }
    for (const item of cases) {
      const output = await readFile(path.join(labRoot, item.expected));
      assert.equal(output.includes(13), false, `${folder}: expected output must be LF`);
    }
    for (const [fence, key] of [["input", "input"], ["output", "expected"]]) {
      const sample = new RegExp(`\x60\x60\x60${fence}\\n([\\s\\S]*?)\x60\x60\x60`).exec(readme);
      assert.ok(sample, `${folder}: missing sample ${fence}`);
      const expectedText = normalize(await readFile(path.join(labRoot, cases[0][key]), "utf8"));
      assert.equal(sample[1].trim(), expectedText.trim(), `${folder}: sample drift`);
    }
    assert.match(await readFile(path.join(labRoot, "student/main.cpp"), "utf8"), /TODO/);
  }
  assert.equal(seen.size, 32);
});
