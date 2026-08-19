# Lab 内容与复现契约

## 1. Scope / Trigger

新增或修改 `labs/chapter-*/lab-*/README.md`、交互题库 `quiz.json`、Lab 内实现/测试、Lab 索引或实验验收方式时适用。

## 2. Signatures

```text
labs/chapter-NN/lab-NN-LL-slug/README.md
  -> /labs/chapter-NN/lab-NN-LL-slug/

labs/chapter-NN/lab-NN-LL-slug/quiz.json
  -> .vitepress/quiz.data.ts
  -> <QuizSet />
```

Lab 由同一个内容索引收集，`kind` 固定为 `lab`；其 `chapter + order` 只在 Lab 集合内唯一。

新式 Lab 的机器接口另见 [Lab v1 机器接口、评分与分发合同](lab-tooling.md)。README-only 旧 Lab 继续兼容；有维护需求时按作者指南渐进迁移，不一次性重写全部历史内容。

## 3. Contracts

Lab 继承教材八个字段，并额外要求：

| 字段 | 约束 |
| --- | --- |
| `lab` | YAML 布尔值 `true`，不能写字符串 `"true"` |
| `difficulty` | 非空、面向读者的级别，如“入门”“基础” |
| `duration` | 非空、可理解的预计时长，如“45～60 分钟” |

README 至少说明：

- 可检查的学习目标和前置知识；
- 环境、输入、操作步骤和预期输出；
- 正常、边界、错误三类情况；
- 完成清单、思考题和复盘；
- 如果有代码，给出从干净检出开始的精确命令。

完整实现、`src/`、`tests/`、fixtures 和样例放在该 Lab 目录，不复制进多个教材页面。命令不得依赖作者机器的全局包、秘密文件或未说明服务。

### 个人题库导入清洗

从维护者个人 Obsidian、题库导出或其他非课程发布稿迁移练习时，只保留读者完成题目所需的题面、选项、题目来源名称、题目标识、正确答案、解析和选项辨析。课程 Lab 必须移除个人版本附带的发布痕迹：

- “查看原始页面”等指向个人题库详情页的入口；
- “看交互可视化”等个人学习资源区，以及删除链接后留下的空标题；
- 页首“答案来源说明”和题内“答案来源：Codex……”等生成过程声明；
- 作者机器路径、个人工作流说明和仅供个人复习的提示。

题目的考试年份、书目名称、难度、考点和题目标识不属于个人痕迹，可以保留。知识正确性仍通过 `status: draft`、Review Owner 人工核验和 PR 证据管理，不在每道答案中重复展示生成过程。

### 交互选择题 Lab

以选择题自测为主体的 Lab 必须复用 `Lab 00-03：复杂度计算自测` 的通用 `<QuizSet />`，不能把 A～D 写成不可选择的静态列表，也不能新建第二套 Quiz 组件。README 只挂载一次 `<QuizSet />`；同目录 `quiz.json` 是题目内容的唯一事实来源。

每道题的数据契约为：

| 字段 | 约束 |
| --- | --- |
| `id` | 非空且在本题库内唯一 |
| `stem` | 非空 Markdown 题面，可含公式、表格和代码围栏 |
| `options` | 恰好四个非空字符串，依次对应 A～D |
| `answer` | `0`～`3` 的整数 |
| `explanation` | 非空 Markdown 解析，提交前不显示 |
| `code` | 可选；需要独立代码窗时使用 |
| `hint` | 可选；提交前由学习者主动展开的 Markdown 提示 |
| `points` | 可选正整数，省略为 1；用于当前分/总分 |
| `title/source/difficulty/topics/targetId` | 可选通用字段；个人题库导入时应保留现有元信息 |

构建期只渲染仓库内受信任 Markdown，并关闭原始 HTML；浏览器组件负责选择、提示、提交、即时反馈、正确答案、题解、重试、答题进度、正确数、当前分/总分和 JSON 派生的折叠答案总览。README 不得再重复 `### 题 N`、静态答案速查或 `::: details 查看答案与解析`，避免同一道题出现两份来源。选项文本不得手写 A～D 前缀，也不得在规范化空白后重复。

#### Quiz 题源选取约定

新增选择题只找题、不编题：题面、选项与答案必须来自可核实出处，优先级为 408 统考真题 > 王道《数据结构》及配套习题 > 严蔚敏/李春葆教材及习题 > 高校公开真题/期末卷 > 可溯源转载/题库；每题至少经两个来源交叉核对题面与答案。

- 同一道题在不同版本中的**选项字母可能不同**（选项重排），核对时以答案内容为准，写入 `quiz.json` 时按选定版本的选项顺序原样保留；
- 涉及出题年份的题优先选用较新的真题；历年题库复用的题（如自考 02331 部分题目反复出现在不同年份卷中）无法确证单一年份时，不作年份题引用；
- 找不到合适 4 选 1 题源的知识点不强凑选择题，可保留在教材正文与思考题中；
- 随题库维护一份出处清单文档（如 `docs/lab-03-quiz-source.md`），记录每题来源与核对链接，与 `quiz.json` 的 `source` 字段互相印证。

## 4. Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| 目录编号、chapter、order 不一致 | 内容校验失败 |
| `lab` 不是布尔值 true | 内容校验失败 |
| 缺 difficulty/duration | 内容校验失败 |
| README 没有客观完成标准 | Review blocking |
| 声称运行成功但 PR 无命令和结果 | Review blocking |
| 页面未进入 Labs 索引或搜索 | 构建/浏览器测试失败 |
| 个人题库导入后仍有原始页、个人可视化或答案生成声明 | Review blocking；清洗后重新检查 |
| 删除个人链接后留下空“相关学习资源”标题 | Review blocking；连同空区块删除 |
| `quiz.json` 缺字段、选项不是四项、答案越界或 id 重复 | `validate:content` 与构建失败 |
| README 使用 QuizSet 但无 `quiz.json`，或挂载次数不是 1 | `validate:content` 失败 |
| 交互题库仍重复维护静态题目/折叠答案 | `validate:content` 失败 |
| 选择题只有静态 A～D，不能选择、提交或重试 | Pages Playwright / Review blocking |
| 新式 manifest 路径越界、未知主版本、分值/依赖错误或薄 Makefile 漂移 | `lab:validate` 失败；详见 lab-tooling |

## 5. Good / Base / Bad Cases

- Good：实现顺序表 Lab，明确空表、非法下标、扩容边界，并给测试断言。
- Base：纯纸笔学习地图 Lab 可以没有源码，但仍有步骤和可检查产物。
- Bad：“实现一个链表并确保正确”，没有接口、边界、运行命令或验收证据。
- Good（题库导入）：保留“2023 年真题”“ds-2023-01”等题目元信息，只呈现题面、答案与解析。
- Base（题库导入）：外部资料确属课程统一扩展阅读时，可由维护者重新筛选并以课程措辞加入，不沿用个人导出区块。
- Bad（题库导入）：直接复制“查看原始页面”“看交互可视化”“答案来源：Codex……”或其空标题。
- Good（交互题库）：README 只写 `<QuizSet />`，四选一、提交反馈、题解和重试均由既有通用组件完成。
- Base（交互题库）：简单纯文本题仍使用相同 `quiz.json` 契约，不另做简化版组件。
- Bad（交互题库）：把四个选项写成 Markdown 列表，再用 36 个 `details` 暴露答案。

## 6. Tests Required

- 临时 Lab fixture 必须被内容校验、Labs 索引、搜索和 build 自动发现，并在 `finally` 删除。
- 有代码的 Lab 执行其 README 命令，PR 记录退出码和关键断言。
- Playwright 从 Labs 索引实际点击至少一个 Lab；检查标题、时长、状态和无同源错误。
- Review Owner 从清晰环境独立复现至少一个关键步骤或反例。
- 个人题库导入任务必须对目标 Lab 运行 `rg -n '查看原始页面|看交互可视化|答案来源说明|答案来源：.*Codex'`，断言没有匹配；再人工确认题目来源名称、题目标识、答案和解析仍在。
- 内容校验必须遍历每个存在 `quiz.json` 的 Lab，检查 JSON、字段、唯一挂载点和静态内容重复；数据 loader 对损坏文件必须让构建失败，不能当成“没有题库”静默跳过。
- Pages Playwright 至少在一份交互题库中真实完成“选择 → 提交 → 对错反馈 → 题解 → 重试”，并核对四选项数量、答题进度、公式/表格和移动端无横向溢出。
- Golden Program/Project 还必须通过 `lab:verify`；reference 自动满分、starter 可编译且非满分，构建只写 `.lab-cache/`。

## 7. Wrong vs Correct

### Wrong

```yaml
lab: "true"
duration: "很快"
```

```md
## 验收
- [ ] 程序看起来正常
```

### Correct

```yaml
lab: true
difficulty: "基础"
duration: "90～120 分钟"
```

```md
## 验收
- [ ] 空表删除返回约定错误且结构不变
- [ ] 首、中、尾插入后的遍历结果与期望序列一致
```

个人题库导入的错误格式：

```md
> **题目标识**：`ds-2023-01` ｜ [查看原始页面](https://example.com/private-question)

**答案来源：Codex 基于题面独立推理补全**

#### 相关学习资源
- [看交互可视化](https://example.com/personal-visualizer)
```

正确格式：

```md
> **题目标识**：`ds-2023-01`

**正确答案：D**

**答案详解**
```

交互题库的错误格式：

```md
### 题 1：复杂度
- **A.** O(1)
- **B.** O(n)

::: details 查看答案与解析
正确答案：A
:::
```

正确格式：

```md
## 选择题

<QuizSet />
```

```json
[{"id":"q1","stem":"复杂度是（ ）","options":["O(1)","O(log n)","O(n)","O(n²)"],"answer":0,"explanation":"一次常数操作。"}]
```
