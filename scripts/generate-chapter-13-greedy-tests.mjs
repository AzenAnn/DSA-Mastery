import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const EXERCISE_ROOT = path.join(ROOT, 'labs', 'chapter-13', 'exercise')

const LAB_DIRECTORIES = {
  container: path.join(EXERCISE_ROOT, 'E-13-01-container-with-most-water'),
  palindrome: path.join(EXERCISE_ROOT, 'E-13-02-longest-palindrome'),
  jumpGame: path.join(EXERCISE_ROOT, 'E-13-03-jump-game'),
  cookies: path.join(EXERCISE_ROOT, 'E-13-04-assign-cookies'),
  intervals: path.join(EXERCISE_ROOT, 'E-13-05-non-overlapping-intervals')
}

function arrayInput(values) {
  return `${values.length}\n${values.join(' ')}\n`
}

function cookieInput(greed, cookies) {
  return `${greed.length} ${cookies.length}\n${greed.join(' ')}\n${cookies.join(' ')}\n`
}

function intervalInput(intervals) {
  return `${intervals.length}\n${intervals.map((interval) => interval.join(' ')).join('\n')}\n`
}

function testCase(id, input, tags) {
  return { id, input, tags }
}

function parseSizedArray(inputText) {
  const values = inputText.trim().split(/\s+/).map(Number)
  return values.slice(1, values[0] + 1)
}

function containerOracle(inputText) {
  const height = parseSizedArray(inputText)
  let left = 0
  let right = height.length - 1
  let answer = 0
  while (left < right) {
    answer = Math.max(answer, (right - left) * Math.min(height[left], height[right]))
    if (height[left] < height[right]) ++left
    else --right
  }
  return answer
}

function palindromeOracle(inputText) {
  const counts = new Map()
  for (const character of inputText.trim()) counts.set(character, (counts.get(character) ?? 0) + 1)

  let answer = 0
  let hasOdd = false
  for (const count of counts.values()) {
    answer += count - (count % 2)
    hasOdd ||= count % 2 === 1
  }
  return answer + Number(hasOdd)
}

function jumpGameOracle(inputText) {
  const nums = parseSizedArray(inputText)
  let maxReach = 0
  for (let index = 0; index < nums.length; ++index) {
    if (index > maxReach) return 'false'
    maxReach = Math.max(maxReach, index + nums[index])
  }
  return 'true'
}

function cookieOracle(inputText) {
  const values = inputText.trim().split(/\s+/).map(Number)
  const [childCount] = values
  const greed = values.slice(2, 2 + childCount).toSorted((left, right) => left - right)
  const cookies = values.slice(2 + childCount).toSorted((left, right) => left - right)
  let child = 0
  for (const cookie of cookies) {
    if (child < greed.length && cookie >= greed[child]) ++child
  }
  return child
}

function intervalOracle(inputText) {
  const values = inputText.trim().split(/\s+/).map(Number)
  const n = values[0]
  const intervals = Array.from({ length: n }, (_, index) => [values[1 + 2 * index], values[2 + 2 * index]])
    .toSorted((left, right) => left[1] - right[1] || left[0] - right[0])

  let kept = 0
  let lastEnd = Number.NEGATIVE_INFINITY
  for (const [start, end] of intervals) {
    if (start < lastEnd) continue
    ++kept
    lastEnd = end
  }
  return n - kept
}

function writeCases(labDirectory, cases, oracle) {
  const testsDirectory = path.join(labDirectory, 'tests')
  fs.mkdirSync(testsDirectory, { recursive: true })
  const manifest = cases.map(({ id, input, tags }) => {
    const normalizedInput = input.endsWith('\n') ? input : `${input}\n`
    fs.writeFileSync(path.join(testsDirectory, `${id}.in`), normalizedInput)
    fs.writeFileSync(path.join(testsDirectory, `${id}.out`), `${oracle(normalizedInput)}\n`)
    return {
      id,
      input: `tests/${id}.in`,
      expected: `tests/${id}.out`,
      points: 5,
      tags
    }
  })
  fs.writeFileSync(path.join(testsDirectory, 'cases.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}

const maxSpan = Array(100000).fill(0)
maxSpan[0] = 10000
maxSpan[maxSpan.length - 1] = 10000
const containerStressPattern = Array.from({ length: 100000 }, (_, index) => (37 * index + 17) % 10001)

const containerCases = [
  testCase('001-sample', arrayInput([1, 8, 6, 2, 5, 4, 8, 3, 7]), ['sample']),
  testCase('002-minimum', arrayInput([1, 1]), ['boundary', 'minimum']),
  testCase('003-all-zero', arrayInput([0, 0, 0, 0]), ['boundary', 'zero']),
  testCase('004-equal-ends', arrayInput([4, 3, 2, 1, 4]), ['normal', 'equal-height']),
  testCase('005-increasing', arrayInput([1, 2, 3, 4, 5]), ['normal', 'monotonic']),
  testCase('006-local-peak', arrayInput([2, 3, 4, 5, 18, 17, 6]), ['normal', 'greedy-choice']),
  testCase('007-large-values', arrayInput([10000, 0, 10000]), ['boundary', 'numeric-range']),
  testCase('008-decreasing', arrayInput([5, 4, 3, 2, 1]), ['normal', 'monotonic']),
  testCase('009-best-interior', arrayInput([1, 10, 1, 1, 10, 1]), ['regression', 'interior']),
  testCase('010-adjacent-tall', arrayInput([1, 1, 10000, 10000, 1]), ['regression', 'narrow']),
  testCase('011-single-positive', arrayInput([0, 0, 7, 0, 0]), ['boundary', 'zero']),
  testCase('012-alternating-peaks', arrayInput([1, 9, 1, 9, 1, 9, 1]), ['normal', 'repeated']),
  testCase('013-equal-plateau', arrayInput([6, 6, 6, 6, 6, 6]), ['boundary', 'equal-height']),
  testCase('014-leading-zeros', arrayInput([0, 0, 8, 1, 8]), ['regression', 'zero']),
  testCase('015-trailing-zeros', arrayInput([8, 1, 8, 0, 0]), ['regression', 'zero']),
  testCase('016-wide-shorter-wins', arrayInput([8, 9, 9, 1, 1, 8]), ['regression', 'greedy-choice']),
  testCase('017-equal-short-ties', arrayInput([4, 4, 1, 1, 4, 4]), ['normal', 'equal-height']),
  testCase('018-mixed-regression', arrayInput([6, 4, 3, 1, 4, 6, 99, 62, 1, 2, 6]), ['regression', 'mixed']),
  testCase('019-max-span', arrayInput(maxSpan), ['boundary', 'stress']),
  testCase('020-stress-pattern', arrayInput(containerStressPattern), ['stress', 'performance'])
]

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const palindromeCases = [
  testCase('001-sample', 'abccccdd\n', ['sample']),
  testCase('002-single', 'a\n', ['boundary', 'single']),
  testCase('003-all-even', 'aabbcc\n', ['normal', 'all-even']),
  testCase('004-multiple-odd', 'abc\n', ['normal', 'odd-count']),
  testCase('005-case-sensitive', 'Aa\n', ['boundary', 'case-sensitive']),
  testCase('006-repeated', 'cccaaaab\n', ['normal', 'repeated']),
  testCase('007-count-boundary', 'aaaaabbbbcccccdddd\n', ['boundary', 'count']),
  testCase('008-all-unique-lowercase', 'abcdefghijklmnopqrstuvwxyz\n', ['boundary', 'all-unique']),
  testCase('009-all-unique-both-cases', `${alphabet}\n`, ['boundary', 'case-sensitive']),
  testCase('010-single-char-even', 'aaaaaaaa\n', ['normal', 'all-even']),
  testCase('011-single-char-odd', 'aaaaaaa\n', ['normal', 'odd-count']),
  testCase('012-two-odd-groups', 'aaabbb\n', ['regression', 'odd-count']),
  testCase('013-many-odd-with-pairs', 'aaabbbcccddd\n', ['regression', 'odd-count']),
  testCase('014-balanced-case-pairs', 'AaAaBbBb\n', ['normal', 'case-sensitive']),
  testCase('015-one-even-rest-odd', 'aabbcde\n', ['normal', 'mixed']),
  testCase('016-alphabet-pairs', `${alphabet}${alphabet}\n`, ['normal', 'all-even']),
  testCase('017-mixed-regression', 'bananas\n', ['regression', 'mixed']),
  testCase('018-max-even', `${'a'.repeat(2000)}\n`, ['boundary', 'stress']),
  testCase('019-max-two-odds', `${'a'.repeat(1999)}b\n`, ['boundary', 'odd-count']),
  testCase('020-max-mixed-case', `${'a'.repeat(999)}${'A'.repeat(999)}bB\n`, ['stress', 'case-sensitive'])
]

const jumpReachableStress = Array(10000).fill(1)
const jumpUnreachableStress = Array(10000).fill(1)
jumpUnreachableStress[jumpUnreachableStress.length - 2] = 0
const jumpGameCases = [
  testCase('001-sample-reachable', arrayInput([2, 3, 1, 1, 4]), ['sample', 'reachable']),
  testCase('002-sample-unreachable', arrayInput([3, 2, 1, 0, 4]), ['sample', 'unreachable']),
  testCase('003-single', arrayInput([0]), ['boundary', 'single']),
  testCase('004-zero-barrier', arrayInput([1, 0, 0, 0]), ['boundary', 'zero']),
  testCase('005-early-finish', arrayInput([5, 0, 0, 0, 0, 0]), ['normal', 'early-finish']),
  testCase('006-exact-reach', arrayInput([1, 2, 0, 1, 0, 0]), ['normal', 'exact']),
  testCase('007-long-reachable', arrayInput([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), ['boundary', 'long']),
  testCase('008-all-zero', arrayInput([0, 0, 0, 0, 0]), ['boundary', 'zero']),
  testCase('009-two-reachable', arrayInput([1, 0]), ['boundary', 'reachable']),
  testCase('010-two-unreachable', arrayInput([0, 1]), ['boundary', 'unreachable']),
  testCase('011-overshoot', arrayInput([10, 0, 0]), ['normal', 'overshoot']),
  testCase('012-large-after-gap', arrayInput([3, 0, 0, 0, 100]), ['regression', 'unreachable']),
  testCase('013-skip-zero', arrayInput([2, 0, 1, 0]), ['normal', 'zero']),
  testCase('014-late-skip', arrayInput([3, 0, 0, 1, 0]), ['normal', 'zero']),
  testCase('015-preserve-max-reach', arrayInput([2, 0, 2, 0, 0]), ['regression', 'max-reach']),
  testCase('016-late-barrier', arrayInput([2, 2, 0, 0, 1]), ['regression', 'unreachable']),
  testCase('017-alternating-barrier', arrayInput([1, 0, 1, 0, 1]), ['regression', 'zero']),
  testCase('018-large-jump', arrayInput([100000, 0, 0, 0, 0]), ['boundary', 'overshoot']),
  testCase('019-stress-reachable', arrayInput(jumpReachableStress), ['stress', 'reachable']),
  testCase('020-stress-unreachable', arrayInput(jumpUnreachableStress), ['stress', 'unreachable'])
]

const exactGreed = Array(30000).fill(42)
const exactCookies = Array(30000).fill(42)
const shortageCookies = Array(29999).fill(1)
const cookieCases = [
  testCase('001-sample-shortage', cookieInput([1, 2, 3], [1, 1]), ['sample', 'shortage']),
  testCase('002-sample-surplus', cookieInput([1, 2], [1, 2, 3]), ['sample', 'surplus']),
  testCase('003-no-cookies', cookieInput([1], []), ['boundary', 'empty']),
  testCase('004-single-exact', cookieInput([1], [1]), ['boundary', 'exact']),
  testCase('005-single-too-small', cookieInput([2], [1]), ['boundary', 'unmatched']),
  testCase('006-unsorted', cookieInput([10, 9, 8, 7], [5, 6, 7, 8]), ['normal', 'unsorted']),
  testCase('007-duplicate-demand', cookieInput([2, 2, 2], [2, 2]), ['normal', 'duplicates']),
  testCase('008-all-too-small', cookieInput([5, 6, 7], [1, 2, 3, 4]), ['boundary', 'unmatched']),
  testCase('009-all-satisfied', cookieInput([1, 2, 3], [3, 3, 3]), ['normal', 'all-matched']),
  testCase('010-skip-small-cookies', cookieInput([2, 3], [1, 1, 2, 3]), ['regression', 'skip-cookie']),
  testCase('011-one-large-cookie', cookieInput([1, 2, 3, 4, 5], [100]), ['normal', 'shortage']),
  testCase('012-match-small-first', cookieInput([1, 2, 2, 3], [1, 1, 2, 2]), ['regression', 'greedy-choice']),
  testCase('013-int-max', cookieInput([2147483647], [2147483647]), ['boundary', 'numeric-range']),
  testCase('014-mixed-extremes', cookieInput([1, 2147483647], [2147483647, 1]), ['boundary', 'numeric-range']),
  testCase('015-fewer-cookies', cookieInput([4, 1, 3, 2], [4, 4, 4]), ['normal', 'shortage']),
  testCase('016-extra-unusable', cookieInput([4, 5], [1, 2, 3, 4, 5]), ['normal', 'skip-cookie']),
  testCase('017-descending', cookieInput([5, 4, 3, 2, 1], [1, 2, 3, 4, 5]), ['normal', 'unsorted']),
  testCase('018-mixed-regression', cookieInput([7, 8, 9, 10], [5, 6, 7, 8, 9]), ['regression', 'mixed']),
  testCase('019-stress-exact', cookieInput(exactGreed, exactCookies), ['stress', 'all-matched']),
  testCase('020-stress-shortage', cookieInput(Array(30000).fill(1), shortageCookies), ['stress', 'shortage'])
]

const identicalIntervals = Array.from({ length: 100000 }, () => [-1, 1])
const twoIntervalGroups = Array.from({ length: 100000 }, (_, index) => index % 2 === 0 ? [0, 1] : [1, 2])
const intervalCases = [
  testCase('001-sample-mixed', intervalInput([[1, 2], [2, 3], [3, 4], [1, 3]]), ['sample', 'mixed']),
  testCase('002-sample-duplicates', intervalInput([[1, 2], [1, 2], [1, 2]]), ['sample', 'duplicates']),
  testCase('003-sample-touching', intervalInput([[1, 2], [2, 3]]), ['sample', 'touching']),
  testCase('004-single', intervalInput([[-1, 1]]), ['boundary', 'single']),
  testCase('005-disjoint-unsorted', intervalInput([[5, 6], [-3, -2], [0, 1], [2, 3]]), ['normal', 'unsorted']),
  testCase('006-nested', intervalInput([[1, 10], [2, 9], [3, 8], [4, 7]]), ['normal', 'nested']),
  testCase('007-same-start', intervalInput([[1, 5], [1, 2], [2, 3], [3, 4]]), ['regression', 'same-start']),
  testCase('008-same-end', intervalInput([[1, 4], [2, 4], [3, 4]]), ['normal', 'same-end']),
  testCase('009-overlap-chain', intervalInput([[1, 3], [2, 4], [3, 5], [4, 6]]), ['normal', 'chain']),
  testCase('010-negative-touching', intervalInput([[-5, -3], [-3, -1], [-2, 0]]), ['boundary', 'touching']),
  testCase('011-unsorted-mixed', intervalInput([[4, 5], [1, 2], [3, 4], [2, 3], [1, 10]]), ['regression', 'unsorted']),
  testCase('012-across-zero', intervalInput([[-5, 0], [-4, -1], [-1, 2], [0, 3]]), ['normal', 'negative']),
  testCase('013-coordinate-bounds', intervalInput([[-50000, -49999], [49999, 50000]]), ['boundary', 'numeric-range']),
  testCase('014-long-vs-short', intervalInput([[1, 100], [2, 3], [3, 4], [4, 5]]), ['regression', 'greedy-choice']),
  testCase('015-contained-touching', intervalInput([[0, 10], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]), ['regression', 'touching']),
  testCase('016-mixed-duplicates', intervalInput([[1, 2], [1, 2], [2, 3], [2, 3], [3, 4]]), ['regression', 'duplicates']),
  testCase('017-all-overlap', intervalInput(Array.from({ length: 10 }, (_, index) => [-index - 1, index + 1])), ['boundary', 'all-overlap']),
  testCase('018-mixed-regression', intervalInput([[-2, 2], [-1, 1], [1, 2], [2, 3], [3, 5], [4, 6]]), ['regression', 'mixed']),
  testCase('019-stress-identical', intervalInput(identicalIntervals), ['stress', 'duplicates']),
  testCase('020-stress-two-groups', intervalInput(twoIntervalGroups), ['stress', 'touching'])
]

writeCases(LAB_DIRECTORIES.container, containerCases, containerOracle)
writeCases(LAB_DIRECTORIES.palindrome, palindromeCases, palindromeOracle)
writeCases(LAB_DIRECTORIES.jumpGame, jumpGameCases, jumpGameOracle)
writeCases(LAB_DIRECTORIES.cookies, cookieCases, cookieOracle)
writeCases(LAB_DIRECTORIES.intervals, intervalCases, intervalOracle)

console.log('已生成第 13 章 5 个贪心 Lab 的 100 条确定性测试。')
