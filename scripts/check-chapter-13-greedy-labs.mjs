import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const EXERCISE_ROOT = path.join(ROOT, 'labs', 'chapter-13', 'exercise')
const OVERVIEW_PATH = path.join(ROOT, 'content', 'chapter-13-greedy', '00-overview.md')

function read(file) {
  return fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
}

function tokens(text) {
  return text.trim().split(/\s+/).filter(Boolean)
}

function parseSizedArray(inputText) {
  const values = tokens(inputText).map(Number)
  const n = values[0]
  assert.equal(values.length, n + 1, 'array input length')
  return values.slice(1)
}

function containerArea(inputText) {
  const height = parseSizedArray(inputText)

  if (height.length <= 500) {
    let bruteForce = 0
    for (let left = 0; left < height.length; ++left) {
      for (let right = left + 1; right < height.length; ++right) {
        bruteForce = Math.max(bruteForce, (right - left) * Math.min(height[left], height[right]))
      }
    }
    return String(bruteForce)
  }

  let left = 0
  let right = height.length - 1
  let answer = 0
  while (left < right) {
    answer = Math.max(answer, (right - left) * Math.min(height[left], height[right]))
    if (height[left] < height[right]) ++left
    else --right
  }
  return String(answer)
}

function longestPalindrome(inputText) {
  const [value] = tokens(inputText)
  const counts = new Map()
  for (const character of value) counts.set(character, (counts.get(character) ?? 0) + 1)

  let answer = 0
  let hasOdd = false
  for (const count of counts.values()) {
    answer += count - (count % 2)
    hasOdd ||= count % 2 === 1
  }
  return String(answer + Number(hasOdd))
}

function jumpGame(inputText) {
  const nums = parseSizedArray(inputText)

  if (nums.length <= 500) {
    const reachable = Array(nums.length).fill(false)
    reachable[0] = true
    for (let index = 0; index < nums.length; ++index) {
      if (!reachable[index]) continue
      const end = Math.min(nums.length - 1, index + nums[index])
      for (let next = index + 1; next <= end; ++next) reachable[next] = true
    }
    return String(reachable.at(-1))
  }

  let maxReach = 0
  for (let index = 0; index < nums.length && index <= maxReach; ++index) {
    maxReach = Math.max(maxReach, index + nums[index])
  }
  return String(maxReach >= nums.length - 1)
}

function assignCookies(inputText) {
  const values = tokens(inputText).map(Number)
  const [childCount, cookieCount] = values
  assert.equal(values.length, 2 + childCount + cookieCount, 'cookie input length')
  const greed = values.slice(2, 2 + childCount).toSorted((left, right) => left - right)
  const cookies = values.slice(2 + childCount).toSorted((left, right) => left - right)

  let child = 0
  for (const cookie of cookies) {
    if (child < greed.length && cookie >= greed[child]) ++child
  }
  return String(child)
}

function nonOverlappingIntervals(inputText) {
  const values = tokens(inputText).map(Number)
  const n = values[0]
  assert.equal(values.length, 1 + 2 * n, 'interval input length')
  const intervals = Array.from({ length: n }, (_, index) => [values[1 + 2 * index], values[2 + 2 * index]])
    .toSorted((left, right) => left[1] - right[1] || left[0] - right[0])

  if (n <= 200) {
    const bestEndingAt = Array(n).fill(1)
    let kept = 1
    for (let current = 0; current < n; ++current) {
      for (let previous = 0; previous < current; ++previous) {
        if (intervals[previous][1] <= intervals[current][0]) {
          bestEndingAt[current] = Math.max(bestEndingAt[current], bestEndingAt[previous] + 1)
        }
      }
      kept = Math.max(kept, bestEndingAt[current])
    }
    return String(n - kept)
  }

  let kept = 0
  let lastEnd = Number.NEGATIVE_INFINITY
  for (const [start, end] of intervals) {
    if (start < lastEnd) continue
    ++kept
    lastEnd = end
  }
  return String(n - kept)
}

const LABS = [
  {
    sequence: 1,
    labId: '13E01',
    title: '盛最多水的容器',
    oracle: containerArea
  },
  {
    sequence: 2,
    labId: '13E02',
    title: '最长回文串',
    oracle: longestPalindrome
  },
  {
    sequence: 3,
    labId: '13E03',
    title: '跳跃游戏',
    oracle: jumpGame
  },
  {
    sequence: 4,
    labId: '13E04',
    title: '分发饼干',
    oracle: assignCookies,
    source: 'https://leetcode.cn/problems/assign-cookies/'
  },
  {
    sequence: 5,
    labId: '13E05',
    title: '无重叠区间',
    oracle: nonOverlappingIntervals,
    source: 'https://leetcode.cn/problems/non-overlapping-intervals/'
  }
]

function locateLab(sequence) {
  const prefix = `E-13-${String(sequence).padStart(2, '0')}-`
  const matches = fs.readdirSync(EXERCISE_ROOT).filter((name) => name.startsWith(prefix))
  assert.equal(matches.length, 1, `expected one Lab for ${prefix}, found ${matches.join(', ')}`)
  return path.join(EXERCISE_ROOT, matches[0])
}

function assertSampleBlock(readme, content, message) {
  assert.ok(readme.includes(`\`\`\`text\n${content.trimEnd()}\n\`\`\``), message)
}

function checkLab(config) {
  const directory = locateLab(config.sequence)
  const readme = read(path.join(directory, 'README.md'))
  const manifest = JSON.parse(read(path.join(directory, 'lab.json')))
  const cases = JSON.parse(read(path.join(directory, 'tests', 'cases.json')))
  const expectedTitle = `Lab 13-E-${String(config.sequence).padStart(2, '0')}：${config.title}`

  assert.match(readme, new RegExp(`^title: "${expectedTitle}"$`, 'm'), `${config.labId}: frontmatter title`)
  assert.match(readme, new RegExp(`^labId: "${config.labId}"$`, 'm'), `${config.labId}: stable ID`)
  assert.match(readme, new RegExp(`^# ${expectedTitle}$`, 'm'), `${config.labId}: H1`)
  assert.equal(manifest.type, 'program', `${config.labId}: manifest type`)
  assert.equal(manifest.toolchain?.standard, 'c++17', `${config.labId}: C++ standard`)
  assert.equal(manifest.judge?.compare?.mode, 'tokens', `${config.labId}: compare mode`)

  assert.equal(cases.length, 20, `${config.labId}: case count`)
  assert.equal(new Set(cases.map((item) => item.id)).size, 20, `${config.labId}: unique case IDs`)
  assert.ok(cases.every((item) => item.points === 5), `${config.labId}: every case is worth 5 points`)
  assert.equal(cases.reduce((sum, item) => sum + item.points, 0), 100, `${config.labId}: total points`)
  assert.ok(readme.includes('公开测试共 20 组'), `${config.labId}: README case count`)

  const testsDirectory = path.join(directory, 'tests')
  const actualInputs = fs.readdirSync(testsDirectory).filter((name) => name.endsWith('.in')).toSorted()
  const actualOutputs = fs.readdirSync(testsDirectory).filter((name) => name.endsWith('.out')).toSorted()
  const listedInputs = cases.map((item) => path.basename(item.input)).toSorted()
  const listedOutputs = cases.map((item) => path.basename(item.expected)).toSorted()
  assert.deepEqual(actualInputs, listedInputs, `${config.labId}: listed input files`)
  assert.deepEqual(actualOutputs, listedOutputs, `${config.labId}: listed output files`)

  const loaded = cases.map((item) => {
    assert.equal(item.input, `tests/${item.id}.in`, `${item.id}: input path`)
    assert.equal(item.expected, `tests/${item.id}.out`, `${item.id}: output path`)
    const inputText = read(path.join(directory, item.input))
    const outputText = read(path.join(directory, item.expected))
    assert.ok(inputText.length > 0, `${item.id}: empty input`)
    assert.ok(outputText.length > 0, `${item.id}: empty output`)
    assert.equal(outputText.trim(), config.oracle(inputText), `${item.id}: oracle output`)
    return { inputText, outputText }
  })

  assertSampleBlock(readme, loaded[0].inputText, `${config.labId}: sample input drift`)
  assertSampleBlock(readme, loaded[0].outputText, `${config.labId}: sample output drift`)
  if (config.source) assert.ok(readme.includes(config.source), `${config.labId}: LeetCode source`)
}

for (const lab of LABS) checkLab(lab)

const overview = read(OVERVIEW_PATH)
assert.ok(
  overview.includes('../../labs/chapter-13/exercise/E-13-04-assign-cookies/README.md'),
  'chapter overview: 13E04 link'
)
assert.ok(
  overview.includes('../../labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/README.md'),
  'chapter overview: 13E05 link'
)

console.log(`第 13 章贪心 Lab 合同检查通过：${LABS.length} 个 Lab，${LABS.length * 20} 条测试。`)
