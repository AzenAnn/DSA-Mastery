import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { compareOutput } = await import(pathToFileURL(path.resolve("tools/lab/compare.mjs")));
const mutations = {
  "1": [
    "if (!node->firstChild) ++leaves;",
    "if (!node->firstChild && !node->nextSibling) ++leaves;",
    "mistakes siblings for children"
  ],
  "2": [
    "int height = -1;",
    "int height = 0;",
    "counts nodes instead of edges"
  ],
  "4": [
    "if (!node->left && !node->right) return depth;",
    "if (!node->left || !node->right) return depth;",
    "accepts missing child as leaf"
  ],
  "5": [
    "if (!a && !b) continue;",
    "if (!a || !b) continue;",
    "drops nonoverlapping subtrees"
  ],
  "6": [
    "if (!node->left->left && !node->left->right) total += node->left->val;",
    "if (node->left) total += node->left->val;",
    "adds internal left children"
  ],
  "8": [
    "    return result;",
    "    std::sort(result.begin(), result.end());\n    return result;",
    "sorts arbitrary tree values"
  ],
  "11": [
    "static_cast<double>(sum) / static_cast<double>(count)",
    "static_cast<double>(sum / static_cast<long long>(count))",
    "uses integer division"
  ],
  "12": [
    "return a == nullptr && b == nullptr;",
    "return true;",
    "accepts matching prefix with different lengths"
  ],
  "15": [
    "previous->rtag = 1;\n    }\n}",
    "previous->rtag = 0;\n    }\n}",
    "forgets last successor tag"
  ],
  "16": [
    "if (node->rtag == 1) return node->right;",
    "return node->right;",
    "uses right child as successor"
  ],
  "17": [
    "output[roots[i]->id].right = i + 1 < roots.size() ? &output[roots[i + 1]->id] : nullptr;",
    "output[roots[i]->id].right = nullptr;",
    "omits forest root chain"
  ],
  "18": [
    "    if (!root) return roots;",
    "    if (roots.size() > 1) roots.resize(1);\n    if (!root) return roots;",
    "keeps only first forest root"
  ],
  "19": [
    "const Node* child = stack.back().nextChild;\n            stack.back().nextChild = child->nextSibling;",
    "const Node* child = stack.back().nextChild;\n            stack.back().nextChild = nullptr;",
    "visits first child only"
  ],
  "24": [
    "const long long sum = top.node->val + top.left + top.right;",
    "const long long sum = top.node->val;",
    "returns root value instead of subtree sum"
  ]
};
const mapping = JSON.parse(await readFile(new URL("mapping.json", import.meta.url), "utf8"));
const root = await mkdtemp(path.join(tmpdir(), "dsa-ch04-mutants-"));
const reports = [];
try {
  for (const row of mapping.filter((r) => !r.old)) {
    const dir = path.resolve(`labs/chapter-04/exercise/E-04-${String(row.number).padStart(2,"0")}-${row.slug}`);
    const temporary = path.join(root, row.slug);
    await cp(path.join(dir, "support"), path.join(temporary, "support"), { recursive: true });
    await cp(path.join(dir, "solution"), path.join(temporary, "solution"), { recursive: true });
    const source = await readFile(path.join(dir, "solution/main.cpp"), "utf8");
    const [before, after, description] = mutations[row.number];
    assert(source.includes(before), row.slug);
    await writeFile(path.join(temporary, "solution/main.cpp"), source.replace(before, after));
    const executable = path.join(temporary, "mutant.exe");
    const compiled = spawnSync("g++", ["-std=c++17", "-O2", "-I", path.join(temporary,"support"), path.join(temporary,"solution/main.cpp"), path.join(temporary,"support/runner.cpp"), "-o", executable], { encoding: "utf8" });
    assert.equal(compiled.status, 0, compiled.stderr);
    const cases = JSON.parse(await readFile(path.join(dir,"tests/cases.json"), "utf8"));
    const rejected = [];
    for (const testCase of cases) {
      const input = await readFile(path.join(dir, testCase.input), "utf8");
      const expected = await readFile(path.join(dir, testCase.expected), "utf8");
      const run = spawnSync(executable, [], { input, encoding: "utf8", timeout: 3000, maxBuffer: 2 * 1024 * 1024 });
      if (run.status !== 0 || !compareOutput(expected, run.stdout, testCase.compare).equal) rejected.push(testCase.id);
    }
    assert(rejected.length > 0, `Surviving mutant: ${row.slug}`);
    reports.push({ number: row.number, description, rejected });
    console.log(`${row.number}: rejected by ${rejected.length}/20 tests (${description})`);
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
await writeFile(new URL("mutation-results.json", import.meta.url), JSON.stringify(reports,null,2)+"\n");
