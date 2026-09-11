import assert from 'node:assert/strict'
import fs from 'node:fs'
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'
import { loadLab } from '../tools/lab/core.mjs'
import { compileTarget } from '../tools/lab/compiler.mjs'
import { compareOutput } from '../tools/lab/compare.mjs'
import { packStudent, verifyProgram } from '../tools/lab/operations.mjs'
import { runProcess } from '../tools/lab/process.mjs'
import { catalog, labName, labPath } from './chapter-06/catalog.mjs'
import { adjacency, closure, edgeKey, isDirected, labelsClosure, labelsDsu, labelsTarjan, oracle, parseInput, serialize } from './chapter-06/contracts.mjs'
import { randomEdges, rng } from './chapter-06/fixtures.mjs'

const root = path.resolve(import.meta.dirname, '..')
const sampleAnswers = {
  4: '2\n', 5: '3\n', 6: '0 1 0\n1 0 1\n0 1 0\n1\n0\n0\n1\n',
  7: '2 2 3\n2 1 3\n4 1 2 4 5\n1 3\n1 3\n', 8: '1 2\n3 0 0 1\n0\n',
  9: 'MATRIX\n0 1 1\n1 0 0\n1 0 0\nLIST\n2 1 2\n1 0\n1 0\nEDGES 2\n0 1\n0 2\n',
  10: '1\n1\n0\n1\n0\n0\n0\n', 11: '4\n', 12: '1\n', 13: '1\n', 14: '2\n',
  15: '3\n1 2 1 2 1 3\n', 16: '3\n4 2 2\n', 17: '3\n1 1 1 2 2 3\n', 18: '14\n',
  19: '3\n', 20: '2\n1 2\n1 5\n', 21: 'NO\n2 1\n', 22: '3\n1 2 1 2 3\n', 23: '3 2\n1 2 1 2 3\n1 2\n2 3\n'
}
const read = (file) => fs.readFileSync(file, 'utf8')
const tokens = (text) => text.trim().split(/\s+/).filter(Boolean)
const countLabels = (labels) => new Set(labels).size

function checkSmallGraph(id, data) {
  if (data.n > 80 || id === 10) return
  const directed = id === 9 ? data.type === 'D' : isDirected(id)
  const a = closure(data.n, data.edges, directed)
  if ([8, 17, 21, 22, 23].includes(id)) assert.deepEqual(labelsTarjan(data.n, data.edges), labelsClosure(closure(data.n, data.edges)))
  if (!directed || id === 17) assert.deepEqual(labelsDsu(data.n, data.edges), labelsClosure(closure(data.n, data.edges, false)))
  if (id === 12) assert.equal(Number(oracle(id, data)), Number(a[data.source][data.destination]))
  if (id === 13) assert.equal(Number(oracle(id, data)), Number(a[0].every(Boolean)))
  if (id === 18) {
    let unreachable = 0
    for (let u = 0; u < data.n; ++u) for (let v = u + 1; v < data.n; ++v) if (!a[u][v]) ++unreachable
    assert.equal(Number(oracle(id, data)), unreachable)
  }
  if (id === 21) {
    const result = tokens(oracle(id, data))
    if (result[0] === 'YES') assert(a.every((row) => row.every(Boolean)))
    else assert.equal(a[Number(result[1]) - 1][Number(result[2]) - 1], false)
  }
}

function checkCondensation(data, expected) {
  const values = tokens(expected).map(Number), [k, m] = values, labels = values.slice(2, 2 + data.n)
  assert.equal(values.length, 2 + data.n + 2 * m)
  assert.equal(countLabels(labels), k)
  assert(labels.every((value) => value >= 1 && value <= k))
  const edges = []
  for (let i = 2 + data.n; i < values.length; i += 2) edges.push([values[i], values[i + 1]])
  const expectedEdges = new Set(data.edges.filter(([u, v]) => labels[u] !== labels[v]).map(([u, v]) => edgeKey(labels[u], labels[v])))
  assert.deepEqual(new Set(edges.map(([u, v]) => edgeKey(u, v))), expectedEdges)
  assert.equal(edges.length, expectedEdges.size)
  assert(edges.every(([u, v]) => u !== v))
  assert.deepEqual(edges, edges.slice().sort(([a, b], [c, d]) => a - c || b - d))
  const graph = adjacency(k, edges.map(([u, v]) => [u - 1, v - 1]), true), indegree = Array(k).fill(0)
  for (const [, v] of edges) ++indegree[v - 1]
  const queue = []
  for (let v = 0; v < k; ++v) if (!indegree[v]) queue.push(v)
  for (let cursor = 0; cursor < queue.length; ++cursor) for (const v of graph[queue[cursor]]) if (--indegree[v] === 0) queue.push(v)
  assert.equal(queue.length, k, 'condensation must be acyclic')
}

function invalidInputChecks() {
  for (const [id, input] of [
    [4, '2\n1 2\n'], [5, '2 1\n1 1\n'], [7, '2 2\n1 2\n2 1\n'],
    [9, 'U M 2\n0 1\n0 0\n'], [9, 'U L 2\n1 1\n0\n'], [10, 'U 2 1\nADD 0 0\n'],
    [11, '1 0\n'], [12, '1 0\n0 0\n9\n'], [13, '2\n0\n0\n'], [13, '2\n2 1 1\n0\n'],
    [14, '1\n0\n'], [23, '2 1\n0 2\n']
  ]) assert.throws(() => parseInput(id, input), `invalid input accepted for ${id}`)
}

function randomData(id, iteration) {
  const next = rng(id * 100003 + iteration * 997), n = (id === 4 ? 3 : [10, 11, 13].includes(id) ? 2 : 1) + next(10)
  const type = iteration % 2 ? 'D' : 'U', directed = id === 9 ? type === 'D' : isDirected(id)
  const loops = [8, 13, 17, 21, 22, 23].includes(id)
  let edges = randomEdges(n, next(n * n), id * 9973 + iteration, directed, loops)
  const data = { n, edges, type, format: ['E', 'M', 'L'][Math.floor(iteration / 2) % 3] }
  if (id === 4) {
    const center = next(n)
    data.edges = Array.from({ length: n }, (_, v) => v).filter((v) => v !== center).map((v) => next(2) ? [center, v] : [v, center]).reverse()
  }
  if (id === 5 && iteration % 2 === 0) {
    const judge = next(n)
    data.edges = edges.filter(([u, v]) => u !== judge && v !== judge)
    for (let u = 0; u < n; ++u) if (u !== judge) data.edges.push([u, judge])
  }
  if (id === 6) data.queries = Array.from({ length: 10 }, () => [next(n), next(n)])
  if (id === 10) {
    data.edges = []
    data.operations = Array.from({ length: 50 }, () => { const u = next(n), v = (u + 1 + next(n - 1)) % n; return [['ADD', 'DEL', 'HAS'][next(3)], u, v] })
  }
  if (id === 12) { data.source = next(n); data.destination = next(n) }
  if (id === 13 && !edges.length) data.edges = [[0, 0]]
  if ([8, 17, 21, 22, 23].includes(id) && iteration % 3 === 0 && edges.length) { edges = [...edges, ...edges.slice(0, 3)]; data.edges = edges }
  return data
}

async function differential(item, lab, existingCompilation) {
  const compilation = existingCompilation ?? await compileTarget(lab, 'solution')
  assert(compilation.ok, compilation.stderr || 'reference compilation failed')
  const iterations = 50
  for (let i = 0; i < iterations; ++i) {
    const input = serialize(item.id, randomData(item.id, i)), data = parseInput(item.id, input)
    checkSmallGraph(item.id, data)
    const expected = oracle(item.id, data)
    if (item.id === 23) checkCondensation(data, expected)
    const execution = await runProcess(compilation.executable, [], { cwd: lab.labRoot, input, timeMs: 3000, outputKb: 16384 })
    assert(!execution.spawnError && !execution.timedOut && !execution.outputExceeded && execution.code === 0, `${lab.labId} random ${i}: execution failed: ${execution.stderr}`)
    assert(compareOutput(expected, execution.stdout, { mode: 'tokens' }).equal, `${lab.labId} random ${i}\n${input}\nExpected:\n${expected}\nActual:\n${execution.stdout}`)
  }
  return iterations
}

async function checkPack(lab) {
  const { packageRoot } = await packStudent(lab)
  const detachedParent = await mkdtemp(path.join(os.tmpdir(), 'dsa-ch06-pack-'))
  const detached = path.join(detachedParent, 'student lab')
  try {
    await cp(packageRoot, detached, { recursive: true })
    async function inspect(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        assert(!['solution', '.lab-cache', 'node_modules'].includes(entry.name))
        assert(!/\.(exe|o|obj|lib|dll|pdb)$/i.test(entry.name))
        if (entry.isDirectory()) await inspect(path.join(directory, entry.name))
      }
    }
    await inspect(detached)
    for (const command of ['validate', 'score']) {
      const execution = await runProcess(process.execPath, ['tools/lab/cli.mjs', command, '.', '--json'], { cwd: detached, timeMs: 120000, outputKb: 16384 })
      assert.equal(execution.code, command === 'validate' ? 0 : 1, `${lab.labId} detached ${command}: ${execution.stderr}`)
      const report = JSON.parse(execution.stdout)
      assert.equal(report.ok, true)
      if (command === 'score') { assert(report.result.compilation.ok); assert(report.result.score < report.result.maxScore) }
    }
  } finally {
    assert(path.dirname(detached) === detachedParent && path.basename(detachedParent).startsWith('dsa-ch06-pack-'))
    await rm(detachedParent, { recursive: true, force: true })
  }
}

invalidInputChecks()
assert.deepEqual(catalog.map((item) => item.id), Array.from({ length: 20 }, (_, i) => i + 4))
const flags = new Set(process.argv.slice(2))
const selectedText = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7)
const selected = selectedText ? selectedText.split(',').map(Number) : catalog.map((item) => item.id)
assert(selected.every((id) => catalog.some((item) => item.id === id)), 'unknown Lab in --only')
const summary = { compiler: process.env.CXX ?? 'default', labs: [], cases: 0, differentialCases: 0, detachedPacks: [] }

for (const item of catalog.filter((item) => selected.includes(item.id))) {
  const directory = path.join(root, labPath(item)), lab = await loadLab(directory), number = String(item.id).padStart(2, '0')
  assert.equal(lab.labId, `06E${number}`)
  assert.equal(path.basename(directory), labName(item))
  const readme = read(path.join(directory, 'README.md')), frontmatter = matter(readme).data
  assert.equal(frontmatter.title, `Lab 06-E-${number}：${item.title}`)
  assert(readme.includes(`# ${frontmatter.title}\n`))
  assert.equal(frontmatter.order, item.id + 4)
  assert.equal(frontmatter.chapter, 6)
  assert.equal(lab.cases.length, 20)
  assert.equal(lab.cases.reduce((sum, entry) => sum + entry.points, 0), 100)
  assert(read(path.join(directory, 'student/main.cpp')).includes('TODO'))
  assert(!read(path.join(directory, 'solution/main.cpp')).includes('TODO'))
  const sampleInput = readme.match(/### 样例输入\s+```text\n([\s\S]*?)\n```/)
  const sampleOutput = readme.match(/### 样例输出\s+```text\n([\s\S]*?)\n```/)
  assert(sampleInput && sampleOutput, `${lab.labId}: missing sample blocks`)
  let maximumOutputBytes = 0
  for (const testCase of lab.cases) {
    const input = read(path.join(directory, testCase.input)), expected = read(path.join(directory, testCase.expected))
    const data = parseInput(item.id, input), computed = oracle(item.id, data)
    assert.equal(expected.includes('\r'), false, `${lab.labId}/${testCase.id}: expected output must be LF`)
    assert.equal(expected, computed, `${lab.labId}/${testCase.id}: independent oracle mismatch`)
    checkSmallGraph(item.id, data)
    if (item.id === 23) checkCondensation(data, expected)
    maximumOutputBytes = Math.max(maximumOutputBytes, Buffer.byteLength(expected))
    if (testCase.id === '001-sample') {
      assert.equal(sampleInput[1].trimEnd(), input.trimEnd())
      assert.equal(sampleOutput[1].trimEnd(), expected.trimEnd())
      assert.equal(expected, sampleAnswers[item.id], `${lab.labId}: hand-checked sample`)
    }
    ++summary.cases
  }
  assert(maximumOutputBytes <= lab.manifest.judge.limits.outputKb * 1024, `${lab.labId}: output limit too small`)
  let compilation
  const record = { id: lab.labId, cases: 20, maximumOutputBytes }
  if (flags.has('--verify')) {
    const result = await verifyProgram(lab)
    assert(result.ok, `${lab.labId}: ${JSON.stringify({ checks: result.checks, drift: result.drift, failed: result.solution.cases.filter((entry) => entry.verdict !== 'AC') })}`)
    assert(result.student.compilation.ok && result.solution.compilation.ok)
    record.checks = result.checks
    record.solutionScore = result.solution.score
    record.studentScore = result.student.score
    compilation = result.solution.compilation
  }
  if (flags.has('--differential')) {
    record.differentialCases = await differential(item, lab, compilation)
    summary.differentialCases += record.differentialCases
  }
  if (flags.has('--pack') && [9, 18, 23].includes(item.id)) { await checkPack(lab); summary.detachedPacks.push(lab.labId) }
  summary.labs.push(record)
  console.log(`PASS ${lab.labId}: 20 cases${record.checks ? `, solution ${record.solutionScore}/100, student ${record.studentScore}/100` : ''}${record.differentialCases ? `, ${record.differentialCases} random cases` : ''}`)
}

const outputRoot = path.join(root, '.lab-cache/ch06')
fs.mkdirSync(outputRoot, { recursive: true })
const mode = flags.has('--verify') ? 'verify' : flags.has('--differential') ? 'differential' : 'contracts'
const suffix = [summary.compiler, selectedText ?? 'all', flags.has('--pack') ? 'pack' : ''].filter(Boolean).join('-').replace(/[^a-zA-Z0-9_-]/g, '_')
const reportPath = path.join(outputRoot, `${mode}-${suffix}.json`)
fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`)
console.log(`Ch6 PASS: ${summary.labs.length} Labs, ${summary.cases} fixtures, ${summary.differentialCases} random cases, ${summary.detachedPacks.length} detached packs. Report: ${path.relative(root, reportPath)}`)
