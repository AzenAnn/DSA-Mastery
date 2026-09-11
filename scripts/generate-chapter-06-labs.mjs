import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { THIN_MAKEFILE } from '../tools/lab/scaffold.mjs'
import { catalog, labPath } from './chapter-06/catalog.mjs'
import { fixturesFor } from './chapter-06/fixtures.mjs'
import { oracle, parseInput, serialize } from './chapter-06/contracts.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const articles = { 1: '01-graph-basics.md', 2: '02-graph-storage.md', 3: '03-graph-traversal-connectivity.md' }

export function renderReadme(item, input, output) {
  const number = String(item.id).padStart(2, '0'), title = `Lab 06-E-${number}：${item.title}`, relative = labPath(item)
  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(item.description)}
order: ${item.id + 4}
chapter: 6
labId: "06E${number}"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "${item.difficulty ?? '基础'}"
duration: "${item.difficulty === '进阶' ? '75～100' : '35～60'} 分钟"
---

# ${title}

> 题目来源：[${item.source}](${item.sourceUrl})。${item.adaptation}

## 学习目标

${item.steps.map((step) => `- [ ] ${step}`).join('\n')}
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.${item.article} ${item.article === 1 ? '图的基本概念' : item.article === 2 ? '图的存储结构' : '图的遍历与连通性'}](../../../../content/chapter-06-graph-foundations/${articles[item.article]})。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

${item.statement}

## 输入格式

${item.input}

### 数据范围

${item.constraints}

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

${item.output}

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

\`\`\`text
${input.trimEnd()}
\`\`\`

### 样例输出

\`\`\`text
${output.trimEnd()}
\`\`\`

${item.sampleExplanation}

## 实现任务

修改本题目录中的 \`student/main.cpp\`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 \`solution/main.cpp\`。

${item.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## 正常、边界与错误情况

- 正常情况：${item.id === 10 ? '严格按操作顺序更新图，每个返回值对应操作发生时的状态。' : '按题目定义处理全部输入，输出与输入边的排列顺序无关。'}
${item.boundaries.map((entry) => `- ${entry}`).join('\n')}
- 常见错误：${item.pitfall}
- 非法输入不在评分范围；不要在标准输出中添加提示词、调试标记或额外解释。

## 运行与评分

在本 Lab 目录执行：

\`\`\`powershell
make doctor
make run
make run CASE=001-sample
make score
\`\`\`

未安装 Make 时，在仓库根目录执行：

\`\`\`powershell
pnpm lab:doctor -- ${relative}
pnpm lab:run -- ${relative}
pnpm lab:run -- ${relative} --case 001-sample
pnpm lab:score -- ${relative}
\`\`\`

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 \`pnpm lab:verify -- ${relative}\`。

## 正确性说明

${item.proof}

## 复杂度分析

${item.complexity}

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

${item.questions.map((question, index) => `${index + 1}. ${question}`).join('\n')}
`
}

export function artifactsFor(item) {
  assert(item.id >= 4 && item.id <= 23, 'generation is limited to new ch6 Labs')
  const files = new Map(), cases = []
  for (const fixture of fixturesFor(item.id)) {
    const input = serialize(item.id, fixture.data)
    const data = parseInput(item.id, input)
    const output = oracle(item.id, data)
    const inputPath = `tests/${fixture.caseId}.in`, outputPath = `tests/${fixture.caseId}.out`
    files.set(inputPath, input)
    files.set(outputPath, output)
    cases.push({ id: fixture.caseId, input: inputPath, expected: outputPath, points: 5, tags: [fixture.tag] })
    if (fixture.caseId === '001-sample') files.set('README.md', renderReadme(item, input, output))
  }
  files.set('tests/cases.json', `${JSON.stringify(cases, null, 2)}\n`)
  files.set('Makefile', THIN_MAKEFILE)
  files.set('lab.json', `${JSON.stringify({
    $schema: '../../../../schemas/lab.schema.json', schemaVersion: 1, type: 'program', language: 'cpp',
    toolchain: { standard: 'c++17', profile: 'course-default' },
    targets: { student: { sources: ['student/main.cpp'] }, solution: { sources: ['solution/main.cpp'] } },
    judge: { kind: 'stdio', cases: 'tests/cases.json', compare: { mode: 'tokens' }, limits: { timeMs: 2000, outputKb: [6, 7, 8, 9].includes(item.id) ? 16384 : 4096 } }
  }, null, 2)}\n`)
  return files
}

function sourceDocument() {
  return `# Ch6 代码题来源与适配清单

本批新增 20 个 Program Lab，稳定编号 06E04 至 06E23；原有 06E01 至 06E03 保留。维护者：Azen，更新日期：2026-09-12。

| Lab | 来源 | 本地适配 |
| --- | --- | --- |
${catalog.map((item) => `| [06E${String(item.id).padStart(2, '0')}：${item.title}](../${labPath(item)}/README.md) | [${item.source}](${item.sourceUrl}) | ${item.adaptation} |`).join('\n')}

## 输出规范

连通分量和 SCC 按各分量的最小顶点升序编号；这不等于拓扑序。Building Roads 将最小代表连接到其余升序代表。Flight Routes Check 优先输出从 1 不可达的最小顶点，再检查不能回到 1 的最小顶点。凝聚图去掉内部边，跨分量边去重后按编号对排序。具体输入输出以各题 README 为准。

## 来源核验

两道洛谷页面已直接核验，均要求矩阵及排序邻接表，故不能将本地的查询题、邻接表专项称作未改编原题。八道 LeetCode 的题意、约束与样例通过 doocs/leetcode 对应 README_EN.md 镜像核对，官方页面本次触发访问限制。课程练习根据仓库 6.2/6.3 正文设计。

CSES 官方访问超时，1682 另核对了 [USACO Guide 题解](https://usaco.guide/problems/cses-1682-flight-routes-check/solution) 的正反图判定方法；三题采用题面明确的本地范围和课程样例。未直接核实的官方样例、约束不标作已验证。

## 维护与验证

题面元数据和教学内容由 \`scripts/chapter-06/catalog.mjs\` 维护；固定测试结构由 \`fixtures.mjs\` 维护；输入合同与独立 JavaScript oracle 位于 \`contracts.mjs\`。C++ student/solution 文件独立维护，生成器不会改动学生或参考代码，也不会覆盖原有三个 Lab。

\`node scripts/generate-chapter-06-labs.mjs\` 默认只预览；确认数据变更后使用 \`--write\`。\`node scripts/check-chapter-06-lab-contracts.mjs\` 检查 400 组数据、样例同步与独立答案；\`--verify\` 增加全部 C++ 验证，\`--differential\` 增加固定种子的小图对拍。使用 \`CXX\` 选择实际编译器，不并发切换同一 Lab 的编译器。
`
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write')
  assert.deepEqual(catalog.map((item) => item.id), Array.from({ length: 20 }, (_, i) => i + 4))
  for (const item of catalog) {
    const directory = path.join(root, labPath(item)), files = artifactsFor(item)
    for (const target of ['student', 'solution']) assert(fs.existsSync(path.join(directory, target, 'main.cpp')), `${directory}: missing ${target} source`)
    if (write) {
      const previousCasesPath = path.join(directory, 'tests/cases.json')
      if (fs.existsSync(previousCasesPath)) {
        const previous = JSON.parse(fs.readFileSync(previousCasesPath, 'utf8'))
        for (const entry of previous) for (const relative of [entry.input, entry.expected]) {
          // Only retire fixtures formerly listed in this Lab's own manifest.
          assert(/^tests\/\d{3}-[a-zA-Z0-9-]+\.(in|out)$/.test(relative))
          if (!files.has(relative) && fs.existsSync(path.join(directory, relative))) fs.unlinkSync(path.join(directory, relative))
        }
      }
      for (const [relative, contents] of files) {
        const target = path.join(directory, relative)
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, contents, 'utf8')
      }
    }
    console.log(`${write ? 'WROTE' : 'PREVIEW'} ${labPath(item)}: ${files.size} files, 20 cases`)
  }
  if (write) fs.writeFileSync(path.join(root, 'docs/ch06-exercise-sources.md'), sourceDocument(), 'utf8')
}
