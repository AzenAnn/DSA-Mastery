import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";
import { loadLab } from "../tools/lab/core.mjs";

const root = path.resolve(import.meta.dirname, "..");
const directory = path.join(root, "labs/chapter-07/exercise");
// These are permanent identities; inserting an exercise must not renumber old Labs.
const sequence = [1, 5, 13, 14, 15, 16, 17, 18, 19, 20, 21, 4, 22, 23, 24,
  7, 8, 9, 11, 12, 10, 25, 26, 27, 28, 6, 29, 30, 31, 32];
const normalize = (text) => text.replace(/\r\n?/g, "\n");

it("Ch7 preserves identities and follows all thirty requested exercises", async () => {
  const folders = (await readdir(directory)).filter((name) => /^E-07-\d+-/.test(name));
  expect(folders.length).toBe(32);
  const seen = new Set();
  for (const folder of folders) {
    const labRoot = path.join(directory, folder);
    const lab = await loadLab(labRoot);
    expect(lab.manifest.type).toBe("program");
    const readme = normalize(await readFile(path.join(labRoot, "README.md"), "utf8"));
    const id = Number(/^labId: "07E(\d+)"/m.exec(readme)?.[1]);
    expect(seen.has(id)).toBe(false);
    seen.add(id);
    expect(Number(/^E-07-(\d+)-/.exec(folder)[1])).toBe(id);
    const order = Number(/^order: (\d+)/m.exec(readme)?.[1]);
    const expected = id === 2 ? 191 : id === 3 ? 192 : 101 + sequence.indexOf(id);
    expect(order, folder).toBe(expected);
    if (id < 13) continue;
    const title = /^title: "(.+)"$/m.exec(readme)[1];
    expect(title).toMatch(new RegExp(`^Lab 07-E-${id}：`));
    expect(readme.includes(`# ${title}\n`)).toBeTruthy();
    const cases = JSON.parse(await readFile(path.join(labRoot, "tests/cases.json"), "utf8"));
    expect(cases.length >= 20, folder).toBeTruthy();
    expect(cases.reduce((sum, item) => sum + item.points, 0)).toBe(100);
    const tags = new Set(cases.flatMap((item) => item.tags));
    for (const tag of ["sample", "normal", "boundary", "regression", "stress"]) {
      expect(tags.has(tag), `${folder}: missing ${tag}`).toBeTruthy();
    }
    for (const item of cases) {
      const output = await readFile(path.join(labRoot, item.expected));
      expect(output.includes(13), `${folder}: expected output must be LF`).toBe(false);
    }
    for (const [fence, key] of [["input", "input"], ["output", "expected"]]) {
      const sample = new RegExp(`\x60\x60\x60${fence}\\n([\\s\\S]*?)\x60\x60\x60`).exec(readme);
      expect(sample, `${folder}: missing sample ${fence}`).toBeTruthy();
      const expectedText = normalize(await readFile(path.join(labRoot, cases[0][key]), "utf8"));
      expect(sample[1].trim(), `${folder}: sample drift`).toBe(expectedText.trim());
    }
    expect(await readFile(path.join(labRoot, "student/main.cpp"), "utf8")).toMatch(/TODO/);
  }
  expect(seen.size).toBe(32);
});
