import assert from 'node:assert/strict'

export const baseFor = (id) => [4, 5, 6, 7, 20, 21, 22].includes(id) ? 1 : 0
export const maxN = (id) => ({ 5: 1000, 6: 1000, 9: 500, 11: 100, 12: 200000, 13: 1000, 14: 200, 19: 50 }[id] ?? 100000)
export const isDirected = (id) => [5, 8, 13, 17, 21, 22, 23].includes(id)
const line = (values) => `${values.join(' ')}\n`
export const edgeKey = (u, v) => `${u},${v}`

export function adjacency(n, edges, directed = false) {
  const graph = Array.from({ length: n }, () => [])
  for (const [u, v] of edges) {
    graph[u].push(v)
    if (!directed) graph[v].push(u)
  }
  return graph
}

export function labelsDsu(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i)
  const size = Array(n).fill(1)
  function find(v) {
    while (parent[v] !== v) { parent[v] = parent[parent[v]]; v = parent[v] }
    return v
  }
  for (const [u, v] of edges) {
    let a = find(u), b = find(v)
    if (a === b) continue
    if (size[a] < size[b]) [a, b] = [b, a]
    parent[b] = a
    size[a] += size[b]
  }
  const labels = [], canonical = new Map()
  for (let v = 0; v < n; ++v) {
    const root = find(v)
    if (!canonical.has(root)) canonical.set(root, canonical.size + 1)
    labels.push(canonical.get(root))
  }
  return labels
}

export function reachable(n, edges, start = 0) {
  const graph = adjacency(n, edges, true), seen = Array(n).fill(false), queue = [start]
  seen[start] = true
  for (let cursor = 0; cursor < queue.length; ++cursor) {
    for (const v of graph[queue[cursor]]) if (!seen[v]) { seen[v] = true; queue.push(v) }
  }
  return seen
}

// An iterative Tarjan oracle is independent of the C++ Kosaraju reference.
export function labelsTarjan(n, edges) {
  const graph = adjacency(n, edges, true)
  const index = Array(n).fill(0), low = Array(n).fill(0), active = Array(n).fill(false), raw = Array(n).fill(0)
  const members = []
  let clock = 0, count = 0
  const enter = (u) => { index[u] = low[u] = ++clock; active[u] = true; members.push(u) }
  for (let start = 0; start < n; ++start) {
    if (index[start]) continue
    enter(start)
    const frames = [[start, 0]]
    while (frames.length) {
      const top = frames.at(-1), u = top[0]
      if (top[1] < graph[u].length) {
        const v = graph[u][top[1]++]
        if (!index[v]) { enter(v); frames.push([v, 0]) }
        else if (active[v]) low[u] = Math.min(low[u], index[v])
      } else {
        frames.pop()
        if (low[u] === index[u]) {
          ++count
          let v
          do { v = members.pop(); active[v] = false; raw[v] = count } while (v !== u)
        }
        if (frames.length) {
          const parent = frames.at(-1)[0]
          low[parent] = Math.min(low[parent], low[u])
        }
      }
    }
  }
  const canonical = new Map()
  return raw.map((component) => {
    if (!canonical.has(component)) canonical.set(component, canonical.size + 1)
    return canonical.get(component)
  })
}

export function closure(n, edges, directed = true) {
  assert(n <= 80, 'closure is only for small-graph differential checks')
  const a = Array.from({ length: n }, (_, u) => Array.from({ length: n }, (_, v) => u === v))
  for (const [u, v] of edges) { a[u][v] = true; if (!directed) a[v][u] = true }
  for (let k = 0; k < n; ++k) for (let u = 0; u < n; ++u) if (a[u][k]) {
    for (let v = 0; v < n; ++v) a[u][v] ||= a[k][v]
  }
  return a
}

export function labelsClosure(a) {
  const label = Array(a.length).fill(0)
  let count = 0
  for (let u = 0; u < a.length; ++u) if (!label[u]) {
    ++count
    for (let v = 0; v < a.length; ++v) if (a[u][v] && a[v][u]) label[v] = count
  }
  return label
}

export function serialize(id, data) {
  const { n, edges = [] } = data, base = baseFor(id)
  const edgeLines = edges.map(([u, v]) => line([u + base, v + base])).join('')
  if (id === 4) return `${n}\n${edgeLines}`
  if (id === 6) return line([n, edges.length, data.queries.length]) + edgeLines + data.queries.map(([u, v]) => line([u + 1, v + 1])).join('')
  if (id === 9) {
    const header = line([data.type, data.format, n])
    const graph = adjacency(n, edges, data.type === 'D')
    if (data.format === 'E') return header + `${edges.length}\n` + edgeLines
    if (data.format === 'L') return header + graph.map((row) => line([row.length, ...row.slice().reverse()])).join('')
    return header + graph.map((row) => { const set = new Set(row); return line(Array.from({ length: n }, (_, v) => Number(set.has(v)))) }).join('')
  }
  if (id === 10) return line([data.type, n, data.operations.length]) + data.operations.map((op) => line(op)).join('')
  if (id === 13) return `${n}\n` + adjacency(n, edges, true).map((row) => line([row.length, ...row])).join('')
  if (id === 14) {
    const graph = adjacency(n, edges)
    return `${n}\n` + graph.map((row, u) => { const set = new Set([u, ...row]); return line(Array.from({ length: n }, (_, v) => Number(set.has(v)))) }).join('')
  }
  return line([n, edges.length]) + edgeLines + (id === 12 ? line([data.source, data.destination]) : '')
}

export function parseInput(id, text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  let at = 0
  const word = () => { assert(at < tokens.length, 'truncated input'); return tokens[at++] }
  const integer = (min, max) => {
    const raw = word()
    assert(/^-?\d+$/.test(raw), `not an integer: ${raw}`)
    const value = Number(raw)
    assert(Number.isSafeInteger(value) && value >= min && value <= max, `${value} outside ${min}..${max}`)
    return value
  }
  let type, format
  if ([9, 10].includes(id)) { type = word(); assert(['U', 'D'].includes(type)) }
  if (id === 9) { format = word(); assert(['E', 'M', 'L'].includes(format)) }
  const n = integer(id === 4 ? 3 : [11, 13].includes(id) ? 2 : 1, maxN(id)), base = baseFor(id)
  const vertex = () => integer(base, n - 1 + base) - base
  const data = { n, edges: [], type, format }
  const readEdges = (m) => { for (let i = 0; i < m; ++i) data.edges.push([vertex(), vertex()]) }
  if (id === 4) readEdges(n - 1)
  else if (id === 10) {
    const q = integer(0, 200000)
    data.operations = []
    for (let i = 0; i < q; ++i) {
      const operation = word(); assert(['ADD', 'DEL', 'HAS'].includes(operation))
      const u = vertex(), v = vertex(); assert.notEqual(u, v)
      data.operations.push([operation, u, v])
    }
  } else if (id === 13 || (id === 9 && format === 'L')) {
    for (let u = 0; u < n; ++u) {
      const k = integer(0, id === 13 ? Math.min(n, 1000) : n - 1), neighbors = new Set()
      for (let i = 0; i < k; ++i) {
        const v = vertex(); assert(!neighbors.has(v), 'duplicate neighbor'); neighbors.add(v)
        data.edges.push([u, v])
      }
    }
    if (id === 13) assert(data.edges.length >= 1 && data.edges.length <= 3000)
  } else if (id === 14 || (id === 9 && format === 'M')) {
    const a = Array.from({ length: n }, () => Array.from({ length: n }, () => integer(0, 1)))
    for (let u = 0; u < n; ++u) for (let v = 0; v < n; ++v) {
      if (u === v) assert.equal(a[u][v], id === 14 ? 1 : 0)
      if (id === 14 || type === 'U') assert.equal(a[u][v], a[v][u], 'asymmetric matrix')
      if (u !== v && a[u][v] && (id !== 14 || u < v)) data.edges.push([u, v])
    }
  } else {
    const cap = id === 5 ? 10000 : id === 6 ? 100000 : id === 9 ? n * (n - 1) : 200000
    const m = integer(0, cap)
    if (id === 6) {
      const q = integer(0, 100000)
      readEdges(m)
      data.queries = Array.from({ length: q }, () => [vertex(), vertex()])
    } else readEdges(m)
  }
  if (id === 12) { data.source = vertex(); data.destination = vertex() }
  assert.equal(at, tokens.length, 'extra input tokens')
  if (id === 9 && format !== 'E' && type === 'U') {
    const keys = new Set(data.edges.map(([u, v]) => edgeKey(u, v)))
    for (const [u, v] of data.edges) assert(keys.has(edgeKey(v, u)), 'asymmetric adjacency list')
    data.edges = data.edges.filter(([u, v]) => u < v)
  }
  const multigraph = [8, 17, 21, 22, 23].includes(id)
  const directed = id === 9 ? type === 'D' : isDirected(id)
  const seen = new Set()
  for (const [u, v] of data.edges) {
    if (!multigraph && id !== 13) assert.notEqual(u, v, 'self loop in simple graph')
    const key = directed || u < v ? edgeKey(u, v) : edgeKey(v, u)
    if (!multigraph) assert(!seen.has(key), 'duplicate edge in simple graph')
    seen.add(key)
  }
  if (id === 4) {
    const degree = Array(n).fill(0)
    for (const [u, v] of data.edges) { ++degree[u]; ++degree[v] }
    assert.equal(degree.filter((d) => d === n - 1).length, 1, 'not a star')
    assert.equal(degree.filter((d) => d === 1).length, n - 1, 'not a star')
  }
  return data
}

export function oracle(id, data) {
  const { n, edges = [] } = data, base = baseFor(id)
  if (id === 4 || id === 5) {
    const incoming = Array(n).fill(0), outgoing = Array(n).fill(0)
    for (const [u, v] of edges) { ++outgoing[u]; ++incoming[v]; if (id === 4) { ++outgoing[v]; ++incoming[u] } }
    const answer = incoming.findIndex((degree, u) => degree === n - 1 && (id === 4 || outgoing[u] === 0))
    return `${answer < 0 ? -1 : answer + base}\n`
  }
  if ([6, 7, 8, 9].includes(id)) {
    const graph = adjacency(n, id === 8 ? edges.map(([u, v]) => [v, u]) : edges, id === 8 || (id === 9 && data.type === 'D'))
    for (const row of graph) row.sort((a, b) => a - b)
    const lists = () => graph.map((row) => line([row.length, ...row.map((v) => v + base)])).join('')
    if (id === 7 || id === 8) return lists()
    const matrix = graph.map((row) => { const set = new Set(row); return Array.from({ length: n }, (_, v) => Number(set.has(v))) })
    const matrixText = matrix.map(line).join('')
    if (id === 6) return matrixText + data.queries.map(([u, v]) => `${matrix[u][v]}\n`).join('')
    const canonical = []
    for (let u = 0; u < n; ++u) for (const v of graph[u]) if (data.type === 'D' || u < v) canonical.push([u, v])
    return `MATRIX\n${matrixText}LIST\n${lists()}EDGES ${canonical.length}\n${canonical.map(line).join('')}`
  }
  if (id === 10) {
    const current = new Set(), answers = []
    for (const [op, u, v] of data.operations) {
      const key = data.type === 'D' || u < v ? edgeKey(u, v) : edgeKey(v, u), exists = current.has(key)
      if (op === 'ADD') { answers.push(Number(!exists)); current.add(key) }
      else if (op === 'DEL') { answers.push(Number(exists)); current.delete(key) }
      else answers.push(Number(exists))
    }
    return answers.map((value) => `${value}\n`).join('')
  }
  if (id === 11) {
    let best = 0
    for (let a = 0; a < n; ++a) for (let b = a + 1; b < n; ++b) {
      let count = 0
      for (const [u, v] of edges) if (u === a || u === b || v === a || v === b) ++count
      best = Math.max(best, count)
    }
    return `${best}\n`
  }
  if (id === 13) return `${Number(reachable(n, edges).every(Boolean))}\n`
  if (id === 21) {
    const forward = reachable(n, edges), missed = forward.indexOf(false)
    if (missed >= 0) return `NO\n1 ${missed + 1}\n`
    const backward = reachable(n, edges.map(([u, v]) => [v, u])), missing = backward.indexOf(false)
    return missing >= 0 ? `NO\n${missing + 1} 1\n` : 'YES\n'
  }
  const labels = id >= 22 ? labelsTarjan(n, edges) : labelsDsu(n, edges)
  const sizes = [], representatives = []
  for (let v = 0; v < n; ++v) {
    const i = labels[v] - 1
    if (!sizes[i]) { sizes[i] = 0; representatives[i] = v }
    ++sizes[i]
  }
  if (id === 12) return `${Number(labels[data.source] === labels[data.destination])}\n`
  if (id === 14) return `${sizes.length}\n`
  if (id === 16) return `${sizes.length}\n${line(sizes.sort((a, b) => b - a))}`
  if (id === 18) {
    let result = BigInt(n) * BigInt(n - 1) / 2n
    for (const size of sizes) result -= BigInt(size) * BigInt(size - 1) / 2n
    return `${result}\n`
  }
  if (id === 19) {
    const adjacent = new Set(edges.flatMap(([u, v]) => [edgeKey(u, v), edgeKey(v, u)])), complete = sizes.map(() => true)
    for (let u = 0; u < n; ++u) for (let v = u + 1; v < n; ++v) {
      if (labels[u] === labels[v] && !adjacent.has(edgeKey(u, v))) complete[labels[u] - 1] = false
    }
    return `${complete.filter(Boolean).length}\n`
  }
  if (id === 20) return `${sizes.length - 1}\n` + representatives.slice(1).map((v) => line([representatives[0] + 1, v + 1])).join('')
  if (id === 23) {
    const unique = new Set(edges.filter(([u, v]) => labels[u] !== labels[v]).map(([u, v]) => edgeKey(labels[u], labels[v])))
    const condensed = [...unique].map((key) => key.split(',').map(Number)).sort(([a, b], [c, d]) => a - c || b - d)
    return line([sizes.length, condensed.length]) + line(labels) + condensed.map(line).join('')
  }
  return `${sizes.length}\n${line(labels)}`
}
