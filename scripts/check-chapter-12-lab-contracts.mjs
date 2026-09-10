import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const EXERCISE_ROOT = path.join(ROOT, 'labs', 'chapter-12', 'exercise')

function read(file) {
  return fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
}

function tokens(text) {
  return text.trim().split(/\s+/).filter(Boolean)
}

function labDirectory(sequence) {
  const prefix = `E-12-${String(sequence).padStart(2, '0')}-`
  const matches = fs.readdirSync(EXERCISE_ROOT).filter((name) => name.startsWith(prefix))
  assert.equal(matches.length, 1, `expected one Lab for ${prefix}, found ${matches.join(', ')}`)
  return path.join(EXERCISE_ROOT, matches[0])
}

function loadLab(sequence) {
  const directory = labDirectory(sequence)
  const cases = JSON.parse(read(path.join(directory, 'tests', 'cases.json')))
  assert.equal(cases.length, 20, `12E${sequence}: case count`)
  assert.equal(cases.reduce((sum, item) => sum + item.points, 0), 100, `12E${sequence}: points`)
  const loaded = cases.map((item) => ({
    ...item,
    inputText: read(path.join(directory, item.input)),
    outputText: read(path.join(directory, item.expected))
  }))
  for (const item of loaded) {
    assert.ok(item.inputText.length > 0, `${item.id}: empty input`)
    assert.ok(item.outputText.length > 0, `${item.id}: empty output`)
  }

  const readme = read(path.join(directory, 'README.md'))
  const sampleInput = readme.match(/### 样例输入\s+```text\n([\s\S]*?)\n```/)
  const sampleOutput = readme.match(/### 样例输出\s+```text\n([\s\S]*?)\n```/)
  assert.ok(sampleInput && sampleOutput, `12E${sequence}: README sample blocks`)
  assert.equal(sampleInput[1].trimEnd(), loaded[0].inputText.trimEnd(), `12E${sequence}: sample input drift`)
  assert.equal(sampleOutput[1].trimEnd(), loaded[0].outputText.trimEnd(), `12E${sequence}: sample output drift`)
  return loaded
}

function wFunction(a, b, c, memo = new Map()) {
  if (a <= 0 || b <= 0 || c <= 0) return 1
  if (a > 20 || b > 20 || c > 20) return wFunction(20, 20, 20, memo)
  const key = `${a},${b},${c}`
  if (memo.has(key)) return memo.get(key)
  const answer = a < b && b < c
    ? wFunction(a, b, c - 1, memo) + wFunction(a, b - 1, c - 1, memo) - wFunction(a, b - 1, c, memo)
    : wFunction(a - 1, b, c, memo) + wFunction(a - 1, b - 1, c, memo) + wFunction(a - 1, b, c - 1, memo) - wFunction(a - 1, b - 1, c - 1, memo)
  memo.set(key, answer)
  return answer
}

function checkFunction(cases) {
  const memo = new Map()
  for (const item of cases) {
    const values = tokens(item.inputText).map(Number)
    const expectedLines = []
    for (let i = 0; i < values.length; i += 3) {
      const [a, b, c] = values.slice(i, i + 3)
      if (a === -1 && b === -1 && c === -1) break
      expectedLines.push(`w(${a}, ${b}, ${c}) = ${wFunction(a, b, c, memo)}`)
    }
    assert.equal(item.outputText.trim(), expectedLines.join('\n'), `${item.id}: Function oracle`)
  }
}

function encodePower(value) {
  const terms = []
  for (let bit = 30; bit >= 0; --bit) {
    if (((value >> bit) & 1) === 0) continue
    if (bit === 0) terms.push('2(0)')
    else if (bit === 1) terms.push('2')
    else terms.push(`2(${encodePower(bit)})`)
  }
  return terms.join('+')
}

function checkPowerExpression(cases) {
  for (const item of cases) {
    const n = Number(tokens(item.inputText)[0])
    assert.equal(item.outputText.trim(), encodePower(n), `${item.id}: power expression`)
  }
}

function buildTotem(level) {
  if (level === 1) return [' /\\', '/__\\']
  const previous = buildTotem(level - 1)
  const height = previous.length
  const width = height * 2
  const result = Array.from({ length: height * 2 }, () => Array(width * 2).fill(' '))
  for (let row = 0; row < height; ++row) {
    for (let column = 0; column < previous[row].length; ++column) {
      result[row][height + column] = previous[row][column]
      result[row + height][column] = previous[row][column]
      result[row + height][width + column] = previous[row][column]
    }
  }
  return result.map((row) => row.join('').trimEnd())
}

function checkTotem(cases) {
  for (const item of cases) {
    const n = Number(tokens(item.inputText)[0])
    assert.equal(item.outputText.trimEnd(), buildTotem(n).join('\n'), `${item.id}: totem geometry`)
  }
}

function checkFastPower(cases) {
  for (const item of cases) {
    const [x, n] = tokens(item.inputText).map(Number)
    const actual = Number(tokens(item.outputText)[0])
    const expected = x ** n
    const tolerance = 1e-9 + 1e-9 * Math.abs(expected)
    assert.ok(Math.abs(actual - expected) <= tolerance, `${item.id}: fast power`)
  }
}

function expectedPardon(level) {
  const size = 2 ** level
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => ((row | column) === size - 1 ? 1 : 0)))
}

function checkPardon(cases) {
  for (const item of cases) {
    const n = Number(tokens(item.inputText)[0])
    const expected = expectedPardon(n).flat().map(String)
    assert.deepEqual(tokens(item.outputText), expected, `${item.id}: pardon matrix`)
  }
}

function locateCowCode(initial, rawPosition) {
  let position = BigInt(rawPosition)
  const base = BigInt(initial.length)
  let length = base
  while (length < position) length *= 2n
  while (position > base) {
    const half = length / 2n
    if (position === half + 1n) position = half
    else if (position > half + 1n) position -= half + 1n
    length = half
  }
  return initial[Number(position - 1n)]
}

function checkCowCode(cases) {
  for (const item of cases) {
    const [initial, position] = tokens(item.inputText)
    assert.equal(item.outputText.trim(), locateCowCode(initial, position), `${item.id}: cow code`)
  }
}

function parseArrayCase(inputText) {
  const values = tokens(inputText).map(Number)
  const n = values[0]
  return values.slice(values.length - n)
}

function checkQuickselect(cases) {
  for (const item of cases) {
    const input = tokens(item.inputText).map(Number)
    const [n, k] = input
    const values = input.slice(2, 2 + n).sort((a, b) => a - b)
    assert.equal(Number(tokens(item.outputText)[0]), values[k], `${item.id}: quickselect`)
  }
}

function checkMergeSort(cases) {
  for (const item of cases) {
    const values = parseArrayCase(item.inputText)
    assert.deepEqual(tokens(item.outputText).map(Number), values.toSorted((a, b) => a - b), `${item.id}: merge sort`)
  }
}

function fillDecodedQuadTree(outputTokens, grid, row, column, size, cursor) {
  const token = outputTokens[cursor.index++]
  if (token === 'L0' || token === 'L1') {
    const value = token === 'L1' ? 1 : 0
    for (let r = row; r < row + size; ++r) for (let c = column; c < column + size; ++c) grid[r][c] = value
    return
  }
  assert.equal(token, 'I', 'quad tree token')
  assert.ok(size > 1, 'internal quad tree node cannot represent one cell')
  const half = size / 2
  fillDecodedQuadTree(outputTokens, grid, row, column, half, cursor)
  fillDecodedQuadTree(outputTokens, grid, row, column + half, half, cursor)
  fillDecodedQuadTree(outputTokens, grid, row + half, column, half, cursor)
  fillDecodedQuadTree(outputTokens, grid, row + half, column + half, half, cursor)
}

function checkQuadTree(cases) {
  for (const item of cases) {
    const input = tokens(item.inputText).map(Number)
    const n = input[0]
    const original = input.slice(1)
    const decoded = Array.from({ length: n }, () => Array(n).fill(-1))
    const output = tokens(item.outputText)
    const cursor = { index: 0 }
    fillDecodedQuadTree(output, decoded, 0, 0, n, cursor)
    assert.equal(cursor.index, output.length, `${item.id}: extra quad tree tokens`)
    assert.deepEqual(decoded.flat(), original, `${item.id}: quad tree reconstruction`)
  }
}

const carpetCells = {
  1: [[0, 0], [-1, 0], [0, -1]],
  2: [[0, 0], [-1, 0], [0, 1]],
  3: [[0, 0], [0, -1], [1, 0]],
  4: [[0, 0], [0, 1], [1, 0]]
}

function checkCarpet(cases) {
  for (const item of cases) {
    const [k, holeRow, holeColumn] = tokens(item.inputText).map(Number)
    const size = 2 ** k
    const lines = item.outputText.trim().split('\n')
    assert.equal(lines.length, (size * size - 1) / 3, `${item.id}: carpet count`)
    const covered = new Set()
    for (const line of lines) {
      const [row, column, type] = tokens(line).map(Number)
      assert.ok(carpetCells[type], `${item.id}: carpet type ${type}`)
      for (const [dr, dc] of carpetCells[type]) {
        const r = row + dr
        const c = column + dc
        assert.ok(r >= 1 && r <= size && c >= 1 && c <= size, `${item.id}: carpet out of bounds`)
        assert.ok(r !== holeRow || c !== holeColumn, `${item.id}: carpet covers hole`)
        const key = `${r},${c}`
        assert.ok(!covered.has(key), `${item.id}: overlapping carpet at ${key}`)
        covered.add(key)
      }
    }
    assert.equal(covered.size, size * size - 1, `${item.id}: incomplete carpet cover`)
  }
}

function checkInversions(cases) {
  for (const item of cases) {
    const values = parseArrayCase(item.inputText)
    if (values.length > 300) continue
    let answer = 0
    for (let i = 0; i < values.length; ++i) for (let j = i + 1; j < values.length; ++j) answer += values[i] > values[j]
    assert.equal(Number(tokens(item.outputText)[0]), answer, `${item.id}: inversion brute force`)
  }
}

function expressionResults(expression, memo = new Map()) {
  if (memo.has(expression)) return memo.get(expression)
  const result = []
  for (let i = 0; i < expression.length; ++i) {
    const operator = expression[i]
    if (!'+-*'.includes(operator)) continue
    for (const left of expressionResults(expression.slice(0, i), memo)) {
      for (const right of expressionResults(expression.slice(i + 1), memo)) {
        result.push(operator === '+' ? left + right : operator === '-' ? left - right : left * right)
      }
    }
  }
  if (result.length === 0) result.push(Number(expression))
  memo.set(expression, result)
  return result
}

function checkExpressions(cases) {
  for (const item of cases) {
    const expression = item.inputText.trim()
    const expected = expressionResults(expression).toSorted((a, b) => a - b)
    assert.deepEqual(tokens(item.outputText).map(Number), expected, `${item.id}: expression results`)
  }
}

function checkBeautiful(cases) {
  for (const item of cases) {
    const n = Number(tokens(item.inputText)[0])
    const values = tokens(item.outputText).map(Number)
    assert.equal(values.length, n, `${item.id}: beautiful length`)
    assert.deepEqual(values.toSorted((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1), `${item.id}: beautiful permutation`)
    const position = Array(n + 1)
    values.forEach((value, index) => { position[value] = index })
    for (let a = 1; a <= n; ++a) {
      for (let b = a + 2; b <= n; b += 2) {
        const middle = (a + b) / 2
        const left = Math.min(position[a], position[b])
        const right = Math.max(position[a], position[b])
        assert.ok(position[middle] < left || position[middle] > right, `${item.id}: arithmetic progression ${a},${middle},${b}`)
      }
    }
  }
}

function checkReversePairs(cases) {
  for (const item of cases) {
    const values = parseArrayCase(item.inputText)
    if (values.length > 300) continue
    let answer = 0
    for (let i = 0; i < values.length; ++i) for (let j = i + 1; j < values.length; ++j) answer += values[i] > 2 * values[j]
    assert.equal(Number(tokens(item.outputText)[0]), answer, `${item.id}: reverse-pair brute force`)
  }
}

function checkSmaller(cases) {
  for (const item of cases) {
    const values = parseArrayCase(item.inputText)
    if (values.length > 300) continue
    const expected = values.map((value, i) => values.slice(i + 1).filter((other) => other < value).length)
    assert.deepEqual(tokens(item.outputText).map(Number), expected, `${item.id}: smaller-after-self brute force`)
  }
}

function checkRangeSum(cases) {
  for (const item of cases) {
    const input = tokens(item.inputText).map(Number)
    const [n, lower, upper] = input
    if (n > 300) continue
    const values = input.slice(3)
    let answer = 0
    for (let left = 0; left < n; ++left) {
      let sum = 0
      for (let right = left; right < n; ++right) {
        sum += values[right]
        if (sum >= lower && sum <= upper) ++answer
      }
    }
    assert.equal(Number(tokens(item.outputText)[0]), answer, `${item.id}: range-sum brute force`)
  }
}

const checks = [
  checkFunction,
  checkPowerExpression,
  checkTotem,
  checkFastPower,
  checkPardon,
  checkCowCode,
  checkQuickselect,
  checkMergeSort,
  checkQuadTree,
  checkCarpet,
  checkInversions,
  checkExpressions,
  checkBeautiful,
  checkReversePairs,
  checkSmaller,
  checkRangeSum
]

for (let sequence = 1; sequence <= 16; ++sequence) {
  checks[sequence - 1](loadLab(sequence))
  console.log(`PASS 12E${String(sequence).padStart(2, '0')} independent contract check`)
}

console.log('Chapter 12 Lab contract audit passed: 16 Labs, 320 cases, sample parity and independent properties.')
