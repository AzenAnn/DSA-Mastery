import { isDirected, maxN } from './contracts.mjs'

export function rng(seed) {
  let state = seed >>> 0
  return (limit) => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return Math.floor(state / 4294967296 * limit) }
}

export function randomEdges(n, count, seed, directed = false, loops = false) {
  const next = rng(seed), edges = [], seen = new Set()
  const maximum = directed ? n * (n - (loops ? 0 : 1)) : n * (n - 1) / 2
  count = Math.min(count, maximum)
  while (edges.length < count) {
    let u = next(n), v = next(n)
    if (u === v && !loops) continue
    if (!directed && u > v) [u, v] = [v, u]
    const key = `${u},${v}`
    if (!seen.has(key)) { seen.add(key); edges.push([u, v]) }
  }
  return edges
}

export function chain(n) { return Array.from({ length: n - 1 }, (_, u) => [u, u + 1]) }
export function clique(n) { return bandEdges(n, n * (n - 1) / 2) }
export function bandEdges(n, count) {
  const edges = []
  for (let gap = 1; gap < n && edges.length < count; ++gap) {
    for (let u = 0; u + gap < n && edges.length < count; ++u) edges.push([u, u + gap])
  }
  return edges
}

function test(name, n, edges, extra = {}) { return { name, data: { n, edges, ...extra } } }
function sample(id) {
  if (id === 6) return test('sample', 3, [[0, 1], [1, 2]], { queries: [[0, 1], [0, 2], [1, 1], [1, 0]] })
  if (id === 7) return test('sample', 5, [[0, 1], [1, 2], [2, 4], [0, 2], [2, 3]])
  if (id === 11) return test('sample', 4, [[0, 1], [0, 3], [1, 2], [1, 3]])
  if (id === 12) return test('sample', 3, [[0, 1], [1, 2], [2, 0]], { source: 0, destination: 2 })
  if (id === 14) return test('sample', 3, [[0, 1]])
  if (id === 16) return test('sample', 8, [[0, 1], [2, 3], [3, 4], [4, 5], [6, 7]])
  if (id === 18) return test('sample', 7, [[0, 2], [0, 5], [2, 4], [1, 6], [5, 4]])
  if (id === 19) return test('sample', 6, [[0, 1], [0, 2], [1, 2], [3, 4]])
  if (id === 20) return test('sample', 6, [[0, 2], [1, 3], [4, 5]])
  return test('sample', 6, [[0, 2], [2, 4], [1, 3]])
}

function undirectedFixtures(id) {
  const largest = maxN(id)
  const cases = [
    sample(id),
    test('boundary-minimum', id === 11 ? 2 : 1, []),
    test('boundary-empty', 6, []),
    test('single-reversed-edge', 3, [[2, 0]]),
    test('normal-chain', 6, chain(6)),
    test('regression-cycle', 6, [...chain(6), [5, 0]]),
    test('triangle-isolates', 5, [[0, 1], [1, 2], [2, 0]]),
    test('regression-interleaved-labels', 7, [[6, 2], [5, 1], [4, 0], [2, 0], [3, 1]]),
    test('normal-star', 7, [[6, 3], [3, 0], [1, 3], [3, 5], [2, 3], [3, 4]]),
    test('two-triangles', 6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3]]),
    test('normal-clique', 6, clique(6).reverse()),
    test('regression-bipartite', 6, Array.from({ length: 9 }, (_, i) => [Math.floor(i / 3), 3 + i % 3])),
    test('equal-components', 8, [[0, 7], [1, 6], [2, 5], [3, 4]]),
    test('unequal-components', 8, [[0, 1], [1, 2], [2, 3], [5, 6]]),
    test('boundary-high-labels', 7, [[6, 5], [5, 4]]),
    test('random-sparse', 12, randomEdges(12, 10, id * 101)),
    test('random-dense', 10, randomEdges(10, 30, id * 103)),
    test('stress-max-empty', largest, []),
    test('stress-long-chain', largest, chain(largest)),
    test('stress-max-edges', largest, bandEdges(largest, Math.min(id === 6 ? 100000 : 200000, largest * (largest - 1) / 2)))
  ]
  if (id === 6) cases.forEach((item, index) => {
    item.data.queries ??= index === 2 ? [] : [[0, 0], [0, item.data.n - 1], [item.data.n - 1, 0]]
    if (index === 17) item.data.queries = Array.from({ length: 100000 }, (_, i) => [i % largest, (i * 17) % largest])
  })
  if (id === 12) cases.forEach((item, index) => {
    item.data.source ??= index === 14 ? item.data.n - 1 : 0
    item.data.destination ??= index === 2 ? item.data.source : item.data.n - 1
  })
  return cases
}

function directedFixtures(id) {
  let first = test('sample', 5, [[0, 2], [2, 0], [1, 3], [3, 1], [2, 1], [3, 4]])
  if (id === 8) first = test('sample', 3, [[0, 1], [0, 1], [1, 1], [2, 0]])
  if (id === 17) first = test('sample', 6, [[2, 0], [2, 1], [4, 3]])
  if (id === 21) first = test('sample', 4, chain(4))
  if (id === 23) first.data.edges.push([0, 1], [2, 3], [0, 0], [4, 4])
  const largest = maxN(id), sccChain = []
  for (let u = 0; u < largest; u += 2) {
    sccChain.push([u, u + 1], [u + 1, u])
    if (u + 2 < largest) sccChain.push([u + 1, u + 2])
  }
  return [
    first,
    test('boundary-singleton', 1, []),
    test('boundary-empty', 6, []),
    test('single-forward-edge', 2, [[0, 1]]),
    test('regression-reverse-edge', 2, [[1, 0]]),
    test('normal-chain', 7, chain(7)),
    test('regression-reverse-chain', 7, chain(7).map(([u, v]) => [v, u])),
    test('normal-cycle', 6, [...chain(6), [5, 0]]),
    test('boundary-self-loops', 5, Array.from({ length: 5 }, (_, i) => [i, i])),
    test('regression-parallel-edges', 3, [[0, 1], [0, 1], [1, 0], [1, 1], [1, 1]]),
    test('two-scc-one-way', 5, [[0, 1], [1, 0], [1, 2], [2, 3], [3, 4], [4, 2]]),
    test('regression-interleaved-scc', 6, [[5, 3], [3, 1], [1, 5], [4, 2], [2, 0], [0, 4], [3, 0]]),
    test('regression-dfs-exit-order', 5, [[0, 1], [0, 2], [2, 1], [1, 3], [3, 2], [3, 4]]),
    test('diamond-dag', 5, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]),
    test('disconnected-scc', 7, [[0, 1], [1, 0], [2, 3], [3, 2], [4, 5], [5, 4]]),
    test('random-sparse', 8, randomEdges(8, 17, id * 107, true, true)),
    test('random-dense', 10, randomEdges(10, 60, id * 109, true, true)),
    test('stress-long-chain', largest, chain(largest)),
    test('stress-scc-chain', largest, sccChain),
    test('stress-max-edges', largest, Array.from({ length: largest }, (_, u) => [[u, (u + 1) % largest], [u, u]]).flat())
  ]
}

function starFixtures() {
  const specs = [[4, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 3], [5, 2], [6, 1], [7, 5], [8, 4], [9, 7], [10, 3], [11, 0], [12, 11], [16, 8], [30, 19], [100, 51], [100000, 0], [100000, 99999], [100000, 50000]]
  return specs.map(([n, center], i) => {
    let edges = Array.from({ length: n }, (_, v) => v).filter((v) => v !== center).map((v, j) => (j + i) % 2 ? [center, v] : [v, center])
    if (i % 3 === 0) edges.reverse()
    if (!i) edges = [[0, 1], [1, 2], [3, 1]]
    return test(i === 0 ? 'sample' : `${i >= 17 ? 'stress' : 'boundary'}-center-${i}`, n, edges)
  })
}

function judgeFixtures() {
  const toward = (n, judge) => Array.from({ length: n }, (_, u) => u).filter((u) => u !== judge).map((u) => [u, judge])
  const dense = randomEdges(999, 9001, 997, true)
  return [
    test('sample', 3, [[0, 2], [1, 2]]), test('boundary-singleton', 1, []), test('boundary-empty', 3, []),
    test('two-people-first-judge', 2, [[1, 0]]), test('two-people-last-judge', 2, [[0, 1]]),
    test('cycle', 3, [[0, 1], [1, 2], [2, 0]]), test('mutual-trust', 2, [[0, 1], [1, 0]]),
    test('regression-judge-outgoing', 3, [[0, 2], [1, 2], [2, 1]]),
    test('missing-one-trust', 4, [[0, 3], [1, 3]]), test('extra-nonjudge-trust', 4, [...toward(4, 3), [0, 1], [1, 2]]),
    test('two-popular-people', 4, [[0, 2], [1, 2], [0, 3], [1, 3]]),
    test('disconnected-trust', 5, [[0, 1], [2, 3], [3, 4]]),
    test('high-judge-label', 6, toward(6, 5).reverse()), test('low-judge-label', 6, toward(6, 0).reverse()),
    test('middle-judge-label', 7, toward(7, 3)), test('random-no-judge', 30, randomEdges(30, 100, 999, true)),
    test('stress-trust-chain', 1000, chain(1000)), test('stress-max-n-judge', 1000, toward(1000, 999)),
    test('stress-max-m-judge', 1000, [...dense, ...toward(1000, 999)]),
    test('stress-max-m-no-judge', 101, randomEdges(101, 10000, 1000, true))
  ]
}

function conversionFixtures() {
  const cases = []
  for (const type of ['U', 'D']) for (const shape of ['basic', 'empty', 'cycle']) for (const format of ['E', 'M', 'L']) {
    const edges = shape === 'empty' ? [] : shape === 'basic' ? [[2, 0], [1, 0]] : [[0, 1], [1, 2], [2, 0]]
    cases.push(test(cases.length ? `${type}-${format}-${shape}` : 'sample', shape === 'empty' ? 1 : 3, edges, { type, format }))
  }
  const edges = clique(500)
  cases.push(test('stress-U-M-complete', 500, edges, { type: 'U', format: 'M' }))
  cases.push(test('stress-D-L-complete', 500, edges.flatMap(([u, v]) => [[u, v], [v, u]]), { type: 'D', format: 'L' }))
  return cases
}

function adtFixtures() {
  const cases = []
  for (const type of ['U', 'D']) {
    const add = (name, n, operations) => cases.push(test(cases.length ? `${type}-${name}` : 'sample', n, [], { type, operations }))
    add('sample', 3, [['ADD', 0, 1], ['HAS', 1, 0], ['ADD', 1, 0], ['DEL', 1, 0], ['HAS', 0, 1], ['DEL', 0, 1], ['HAS', 0, 2]])
    add('boundary-empty', 1, [])
    add('missing-query', 2, [['HAS', 0, 1]])
    add('missing-delete', 2, [['DEL', 1, 0], ['DEL', 0, 1]])
    add('regression-duplicate-add', 2, [['ADD', 0, 1], ['ADD', 0, 1], ['HAS', 0, 1]])
    add('regression-reverse-delete', 2, [['ADD', 0, 1], ['DEL', 1, 0], ['HAS', 0, 1], ['HAS', 1, 0]])
    add('opposite-arcs', 2, [['ADD', 0, 1], ['ADD', 1, 0], ['DEL', 0, 1], ['HAS', 1, 0], ['ADD', 0, 1]])
    add('interleaved-edges', 5, [['ADD', 0, 4], ['ADD', 1, 4], ['ADD', 4, 2], ['DEL', 0, 4], ['HAS', 1, 4], ['HAS', 4, 2], ['ADD', 0, 4]])
    const next = rng(type === 'U' ? 611 : 612)
    add('random-operations', 9, Array.from({ length: 200 }, () => { const u = next(9), v = (u + 1 + next(8)) % 9; return [['ADD', 'DEL', 'HAS'][next(3)], u, v] }))
    add('stress-max-operations', 100000, Array.from({ length: 200000 }, (_, i) => [i < 100000 ? 'ADD' : 'DEL', i % 100000, (i + 1) % 100000]))
  }
  return cases
}

function roomFixtures() {
  const edges3000 = Array.from({ length: 1000 }, (_, u) => [1, 2, 3].map((gap) => [u, (u + gap) % 1000])).flat()
  return [
    test('sample', 4, chain(4)), test('boundary-one-key-success', 2, [[0, 1]]), test('boundary-one-key-wrong-room', 2, [[1, 0]]),
    test('regression-self-key', 2, [[0, 0]]), test('boundary-start-empty', 3, [[1, 2]]),
    test('self-key-and-path', 3, [[0, 0], [0, 1], [1, 2]]), test('normal-cycle', 4, [...chain(4), [3, 0]]),
    test('regression-unreachable-cycle', 4, [[0, 1], [2, 3], [3, 2]]),
    test('all-keys-in-start', 6, Array.from({ length: 6 }, (_, v) => [0, v])),
    test('regression-shared-keys', 4, [[0, 1], [0, 2], [1, 2], [2, 3], [3, 1]]),
    test('fan-in-only', 5, [[1, 0], [2, 0], [3, 0], [4, 0]]), test('reverse-chain', 5, chain(5).map(([u, v]) => [v, u])),
    test('locked-self-cycle', 5, [[0, 1], [1, 2], [2, 3], [4, 4]]),
    test('random-sparse', 10, randomEdges(10, 8, 841, true, true)), test('random-dense', 20, randomEdges(20, 250, 842, true, true)),
    test('boundary-high-key', 1000, [[0, 999]]), test('stress-long-chain', 1000, chain(1000)),
    test('stress-max-keys', 1000, edges3000),
    test('stress-unreachable-keys', 1000, randomEdges(999, 3000, 843, true, true).map(([u, v]) => [u + 1, v + 1])),
    test('stress-max-room-keys', 1000, Array.from({ length: 1000 }, (_, v) => [0, v]))
  ]
}

export function fixturesFor(id) {
  const cases = id === 4 ? starFixtures() : id === 5 ? judgeFixtures() : id === 9 ? conversionFixtures()
    : id === 10 ? adtFixtures() : id === 13 ? roomFixtures() : isDirected(id) ? directedFixtures(id) : undirectedFixtures(id)
  if (cases.length !== 20) throw new Error(`06E${id}: expected 20 cases, found ${cases.length}`)
  return cases.map((item, index) => ({ ...item, caseId: `${String(index + 1).padStart(3, '0')}-${item.name.toLowerCase()}`, tag: index === 0 ? 'sample' : item.name.startsWith('stress') || item.name.includes('-stress') ? 'stress' : item.name.includes('boundary') ? 'boundary' : item.name.includes('regression') ? 'regression' : 'normal' }))
}
