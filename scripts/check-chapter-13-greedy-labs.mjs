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

function canPlaceFlowers(inputText) {
  const values = tokens(inputText).map(Number)
  const [n, need] = values
  assert.equal(values.length, n + 2, 'flowerbed input length')
  const bed = values.slice(2)
  let planted = 0
  for (let index = 0; index < n; ++index) {
    if (bed[index] === 0 && (index === 0 || bed[index - 1] === 0) && (index === n - 1 || bed[index + 1] === 0)) {
      bed[index] = 1
      ++planted
    }
  }
  return String(planted >= need)
}

function lemonadeChange(inputText) {
  const bills = parseSizedArray(inputText)
  let fives = 0
  let tens = 0
  for (const bill of bills) {
    if (bill === 5) ++fives
    else if (bill === 10) {
      if (fives === 0) return 'false'
      --fives
      ++tens
    } else {
      if (tens > 0 && fives > 0) {
        --tens
        --fives
      } else if (fives >= 3) fives -= 3
      else return 'false'
    }
  }
  return 'true'
}

function maximizeSumAfterKNegations(inputText) {
  const values = tokens(inputText).map(Number)
  const [n, k] = values
  assert.equal(values.length, n + 2, 'negation input length')
  const nums = values.slice(2).toSorted((left, right) => left - right)
  let remaining = k
  for (let index = 0; index < nums.length && nums[index] < 0 && remaining > 0; ++index, --remaining) nums[index] = -nums[index]
  const sum = nums.reduce((total, value) => total + value, 0)
  return String(remaining % 2 === 0 ? sum : sum - 2 * Math.min(...nums))
}

function stockProfit(inputText) {
  const prices = parseSizedArray(inputText)
  let minimum = prices[0]
  let answer = 0
  for (const price of prices) {
    answer = Math.max(answer, price - minimum)
    minimum = Math.min(minimum, price)
  }
  return String(answer)
}

function maximumUnits(inputText) {
  const values = tokens(inputText).map(Number)
  const [typeCount, truckSize] = values
  assert.equal(values.length, 2 + 2 * typeCount, 'truck input length')
  const types = Array.from({ length: typeCount }, (_, index) => [values[2 + index * 2], values[3 + index * 2]])
    .toSorted((left, right) => right[1] - left[1])
  let capacity = truckSize
  let answer = 0
  for (const [boxes, units] of types) {
    const taken = Math.min(capacity, boxes)
    answer += taken * units
    capacity -= taken
  }
  return String(answer)
}

function jumpGameTwo(inputText) {
  const nums = parseSizedArray(inputText)
  let jumps = 0
  let boundary = 0
  let farthest = 0
  for (let index = 0; index < nums.length - 1; ++index) {
    farthest = Math.max(farthest, index + nums[index])
    if (index === boundary) {
      ++jumps
      boundary = farthest
    }
  }
  return String(jumps)
}

function partitionLabels(inputText) {
  const value = tokens(inputText)[0]
  const last = new Map([...value].map((character, index) => [character, index]))
  const lengths = []
  let start = 0
  let end = 0
  for (let index = 0; index < value.length; ++index) {
    end = Math.max(end, last.get(value[index]))
    if (index === end) {
      lengths.push(end - start + 1)
      start = index + 1
    }
  }
  return `${lengths.length}\n${lengths.join(' ')}`
}

function reconstructQueue(inputText) {
  const values = tokens(inputText).map(Number)
  const n = values[0]
  assert.equal(values.length, 1 + n * 2, 'queue input length')
  const people = Array.from({ length: n }, (_, index) => [values[index * 2 + 1], values[index * 2 + 2]])
    .toSorted((left, right) => right[0] - left[0] || left[1] - right[1])
  const queue = []
  for (const person of people) queue.splice(person[1], 0, person)
  return queue.map((person) => person.join(' ')).join('\n')
}

function candy(inputText) {
  const ratings = parseSizedArray(inputText)
  const left = Array(ratings.length).fill(1)
  for (let index = 1; index < ratings.length; ++index) if (ratings[index] > ratings[index - 1]) left[index] = left[index - 1] + 1
  let answer = left.at(-1)
  let right = 1
  for (let index = ratings.length - 2; index >= 0; --index) {
    right = ratings[index] > ratings[index + 1] ? right + 1 : 1
    answer += Math.max(left[index], right)
  }
  return String(answer)
}

function minimumRefuelStops(inputText) {
  const values = tokens(inputText).map(Number)
  const [target, startFuel, n] = values
  assert.equal(values.length, 3 + n * 2, 'refuel input length')
  const stations = Array.from({ length: n }, (_, index) => [values[3 + index * 2], values[4 + index * 2]])
  const available = []
  let fuel = startFuel
  let stops = 0
  for (const [position, addedFuel] of [...stations, [target, 0]]) {
    while (fuel < position && available.length > 0) {
      available.sort((left, right) => right - left)
      fuel += available.shift()
      ++stops
    }
    if (fuel < position) return '-1'
    available.push(addedFuel)
  }
  return String(stops)
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
  },
  {
    sequence: 6,
    labId: '13E06',
    title: '种花问题',
    oracle: canPlaceFlowers,
    source: 'https://leetcode.com/problems/can-place-flowers/description/'
  },
  {
    sequence: 7,
    labId: '13E07',
    title: '柠檬水找零',
    oracle: lemonadeChange,
    source: 'https://leetcode.com/problems/lemonade-change/description/'
  },
  {
    sequence: 8,
    labId: '13E08',
    title: 'K 次取反后最大化的数组和',
    oracle: maximizeSumAfterKNegations,
    source: 'https://leetcode.com/problems/maximize-sum-of-array-after-k-negations/description/'
  },
  {
    sequence: 9,
    labId: '13E09',
    title: '买卖股票的最佳时机',
    oracle: stockProfit,
    source: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/description/'
  },
  {
    sequence: 10,
    labId: '13E10',
    title: '卡车上的最大单元数',
    oracle: maximumUnits,
    source: 'https://leetcode.com/problems/maximum-units-on-a-truck/'
  },
  {
    sequence: 11,
    labId: '13E11',
    title: '跳跃游戏 II',
    oracle: jumpGameTwo,
    source: 'https://leetcode.com/problems/jump-game-ii/description/'
  },
  {
    sequence: 12,
    labId: '13E12',
    title: '划分字母区间',
    oracle: partitionLabels,
    source: 'https://leetcode.com/problems/partition-labels/'
  },
  {
    sequence: 13,
    labId: '13E13',
    title: '根据身高重建队列',
    oracle: reconstructQueue,
    source: 'https://leetcode.com/problems/queue-reconstruction-by-height/'
  },
  {
    sequence: 14,
    labId: '13E14',
    title: '分发糖果',
    oracle: candy,
    source: 'https://leetcode.com/problems/candy/'
  },
  {
    sequence: 15,
    labId: '13E15',
    title: '最低加油次数',
    oracle: minimumRefuelStops,
    source: 'https://leetcode.com/problems/minimum-number-of-refueling-stops/'
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
for (let sequence = 6; sequence <= 15; ++sequence) {
  const prefix = `E-13-${String(sequence).padStart(2, '0')}-`
  assert.ok(overview.includes(prefix), `chapter overview: ${prefix} link`)
}

console.log(`第 13 章贪心 Lab 合同检查通过：${LABS.length} 个 Lab，${LABS.length * 20} 条测试。`)
