# DSA Mastery 更新工作流

本文档是两位核心维护者日常更新教材与 Lab 的执行手册。流程的最终验收对象不是维护者是否完成一次提交，而是读者能否通过理论、实现、实验和练习形成可检查的课程能力。项目蓝图回答“为什么与做什么”，这里回答“下一次更新具体怎么做”。

## 1. 三条默认规则

1. `main` 始终保持可阅读、可构建；所有非微小改动走短生命周期分支和 Pull Request。
2. Markdown 是教材的单一事实来源。不要直接修改 `dist/pages`、`test-results`、`playwright-report` 或其他生成内容。
3. 作者不能独自宣布自己的章节完成；另一名成员必须独立 Review 并批准。

## 2. 两人角色与轮换

### Chapter Owner

- 创建 Chapter Issue，写清学习目标、范围、非目标和参考资料候选。
- 组织提纲、正文、关键示例、Lab 与必要的网站小改动。
- 运行示例、测试和网站构建，记录实际结果。
- 回应 Review，逐项修改或解释为何不修改。
- 合并后更新 Issue 状态并主持一次简短复盘。

### Review Owner

- 在动笔前审阅范围，避免章节过大或遗漏前置知识。
- 不依赖作者的运行结果，亲自复现至少一个关键示例或 Lab。
- 对定义、复杂度、边界、术语和引用做独立核验。
- 至少贡献一个有价值的反例、测试、练习或表达修正。
- 确认 DoD 后批准并合并；不能用一句“看起来没问题”代替 Review。

### 轮换表

| 章节 | Chapter Owner | Review Owner |
| --- | --- | --- |
| 0 绪论 | A | B |
| 1 线性表 | B | A |
| 2 栈与队列 | A | B |
| 3 字符串与数组 | B | A |
| 4 树与二叉树 | A | B |
| 5 树的应用 | B | A |
| 6 图的基础与存储 | A | B |
| 7 图的遍历与应用 | B | A |

如果 Owner 临时无法继续，可以明确交接 Issue；不要让另一人暗中补完后仍保留原责任归属。每完成两章，双方检查是否都实际参与了理论、实现、Lab、测试、Git 和网站验证。缺少的能力放入下一章的个人任务。

### 意见冲突

按以下顺序处理：

1. 写出双方不同结论及其成立前提。
2. 查阅课程教材、经典教材、标准或官方文档等原始来源。
3. 能运行的争议写成最小实验或测试。
4. 仍无法确定时，在正文中标明适用范围或将该点留在 Issue，不强行发布结论。

排版偏好由 Chapter Owner 决定；影响正确性、版权和破坏兼容性的争议必须双方同意。

## 3. Chapter Lifecycle

### Step 1：Planning

Owner 从“章节更新”Issue 模板创建 Issue，填写：

- 读者完成后能做什么；
- 本次覆盖与明确不覆盖的内容；
- 计划包含的 Markdown 页面和 Lab；
- 需要核对的关键定义、复杂度或争议；
- Reviewer 与预计完成时间。

Reviewer 先确认范围。MVP 原则是切小：一章可以分多个页面，但一个 PR 应能独立阅读和验证。

### Step 2：Research

优先使用课程指定教材、经典教材、论文、标准、大学课程资料或官方文档。把来源的作者、标题、版本/日期、链接或 ISBN 记录下来。网络摘要和 AI 回答只能提供线索，不能作为唯一依据。

研究阶段输出的是“自己的理解和结构”，不是从多个来源拼贴句子。

### Step 3：Outline

建议章节至少考虑以下模块：学习目标、概念/ADT、表示与算法、复杂度、关键实现、示例或 Lab、常见错误、练习、小结与延伸阅读。Demo 可以暂缺部分模块，但应使用 `status: draft` 如实表达成熟度。

### Step 4：Draft & Implement

Owner 创建分支并编写正文和 Lab。正文解释关键逻辑，完整可运行代码放在对应 Lab 的独立目录中；不要把大段实现重复粘贴到多个 Markdown 文件。

每个关键算法至少记录：输入、输出、前置条件、边界行为、复杂度及其分析前提。还没有实现或测试的内容不能写成“已验证”。

正文与 Lab 之间优先使用相对 `.md` 链接，例如 `./01-stack.md` 或 `../../labs/chapter-02/lab-02-01-stack/README.md`。`validate:content` 会检查源目标存在，VitePress 构建会把链接改写为课程路由；不要手写 `/DSA-Mastery/`。

本地阅读使用：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

开发服务只监听 `127.0.0.1`。公式使用 `$...$` 或 `$$...$$`，由 VitePress `markdown.math` 的 MathJax 管线渲染。

### Step 5：Author Check

提交 PR 前，Owner 完成：

```bash
pnpm test
```

`pnpm test` 已包含内容校验、`vue-tsc`、lint、临时教材/Lab 自动发现、生产构建和 `dist/pages` 产物检查。涉及导航、Pages base、主题、Markdown 渲染或发布工作流时，再在 Windows PowerShell 中运行：

```powershell
$env:GITHUB_PAGES_BASE_PATH = "/DSA-Mastery"
$env:SITE_URL = "https://azenann.github.io/DSA-Mastery/"
pnpm run build
pnpm run check:site
pnpm run test:pages
Remove-Item Env:GITHUB_PAGES_BASE_PATH
Remove-Item Env:SITE_URL
```

还应在网站中手工检查新页面的导航位置、标题、公式、代码块、相对链接和前后页跳转。Lab 如包含独立运行命令，也在其 README 中记录并实际执行。站点命令、已知风险和排查见 [VITEPRESS_MIGRATION.md](VITEPRESS_MIGRATION.md)。

### Step 6：Peer Review

Reviewer 从“零上下文读者”的角度检查：

- 仅按文档是否能理解并复现实验；
- 定义与复杂度是否在明确前提下成立；
- 空表、单元素、容量边界、非法输入等是否处理或声明；
- 正文、代码、测试与图示是否表达同一语义；
- 引用能否打开，图片和代码许可是否允许使用；
- 页面在网站中是否可读，是否有断链或顺序错误。

评论应区分：`blocking`（必须改）、`suggestion`（建议）和 `question`（需要澄清）。Owner 修改后请说明验证结果；不要只回复“已改”。

### Step 7：Human Final Review & Merge

Reviewer 对照 DoD，确认自动检查通过、阻塞评论解决后批准并使用 squash merge。默认由 Reviewer 合并，确保作者不会绕过同伴审核。合并后删除分支，关闭 Issue，并检查 `main` 上的 **Deploy course site to GitHub Pages** 工作流；发布成功后抽查[在线课程网站](https://azenann.github.io/DSA-Mastery/)中的新页面。

### Step 8：Retrospective

每章只记录三项：保留什么、下次改变什么、产生了哪个后续 Issue。没有实际痛点时，不新增规则或工具。

## 4. Git 与 GitHub 约定

### 分支策略

MVP 只保留 `main` 和短分支，不设长期 `dev`：

```text
chapter/02-stack-queue
lab/02-stack-simulator
fix/linear-list-complexity
docs/update-citation-guide
site/improve-code-block
```

分支从最新 `main` 创建，一个分支对应一个可说明的目标。每人同时最多维护一个核心章节 PR，减少未完成工作。

### Commit Convention

使用简化的 Conventional Commits：

```text
docs(ch01): explain sequential-list insertion
feat(lab01): add linked-list boundary cases
test(site): cover generated chapter navigation
fix(ch01): correct deletion complexity assumption
refactor(site): isolate markdown metadata parser
chore: update project templates
```

常用类型：`docs`、`feat`、`test`、`fix`、`refactor`、`chore`。标题写“做了什么”，不要写 `update`、`changes` 等无法回溯的描述。开发过程可以有多个小提交；合并时默认 squash，让 `main` 的历史按 PR 目标阅读。

### Issue

Issue 是一项工作的入口，不是愿望清单。必须包含可验收结果、范围与负责人。章节使用“章节更新”模板，独立实验使用“Lab 提案”模板；小型勘误可直接写清页面、错误与依据。

### Pull Request

PR 描述需要回答：

- 读者得到什么；
- 改了哪些正文/Lab/网站行为；
- 怎样验证、实际结果是什么；
- 哪些判断需要 Reviewer 重点检查；
- AI 在哪里参与、人工如何复核；
- 关联哪个 Issue。

不要在同一 PR 顺便重构无关网站代码。纯排版批量修改与知识内容修改尽量拆开，方便 Review 差异。

### 网站发布与回滚

- `main` 是公开课程网站的唯一正式发布源；分支和 PR 不直接覆盖线上内容。
- PR 与 `main` 共用内容、类型、lint、自动发现、VitePress build、产物审计和 Pages 子路径 Playwright；PR 不 deploy，`main` push 或手动触发才发布。
- workflow 使用 Node 24，`actions/configure-pages` 提供唯一 Pages base，并上传 `dist/pages`；仓库不提交构建产物。
- 发布完成后，在 Actions 中确认工作流为绿色，再抽查首页、新页面、前后页链接、搜索和至少一个 Lab。
- 发布失败时，在短分支中修复并重新走 PR；不要通过跳过检查或手工上传构建产物绕过流水线。
- 已上线内容需要紧急撤回时，优先创建一个回退 PR 或使用 GitHub 的 Revert 生成新提交，不强推或改写 `main` 历史。

### Tag 与 Release

Demo 阶段不按每章发 Release。满足以下条件时再建立里程碑版本：

- 两人共同完成一个课程阶段；
- 内容和 Lab 已达到相对稳定状态；
- 可以写出对读者有意义的变更说明。

建议使用 `v0.1.0`、`v0.2.0` 等预发布阶段版本，并在 Release 中列出新增章节、重大修正、已知限制和验证范围。等内容标准稳定后再讨论 `v1.0.0`。

## 5. 新增章节：可复制步骤

以下以第 2 章为例。

1. 创建 Chapter Issue，指定 Owner 与 Reviewer。
2. 从最新 `main` 创建 `chapter/02-stack-queue`。
3. 创建目录 `content/chapter-02-stack-queue/`。
4. 按阅读顺序创建 `00-overview.md`、`01-stack.md`、`02-queue.md` 等文件。
5. 每个文件填写完整 frontmatter；同一章 `order` 唯一且连续。
6. 启动本地网站，确认页面被自动发现，不要手工注册导航。
7. 添加或链接对应 Lab，完成作者检查后提交 PR。

正文 frontmatter 示例：

```yaml
---
title: "第 2 章 栈与队列"
description: "理解受限线性结构及其典型应用。"
order: 0
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-09"
contributors: ["成员 A", "成员 B"]
status: "draft"
---
```

字段规则：

| 字段 | 规则 |
| --- | --- |
| `title` | 页面展示标题，清楚且不依赖文件名理解 |
| `description` | 一句话摘要，用于列表或页面说明 |
| `order` | 本章内排序整数，不重复 |
| `chapter` | 非负章节编号，与目录一致 |
| `chapterTitle` | 同一章所有页面保持完全一致 |
| `updated` | 实际内容更新日期，`YYYY-MM-DD` |
| `contributors` | 实际参与内容的成员列表 |
| `status` | `draft`（撰写中）、`review`（待审）或 `published`（已按 DoD 发布）；只有 Review Owner 批准后才能标为 `published` |

目录和文件名用英文小写 kebab-case，并保留两位数字前缀。网站从路径推导 URL，并以 `chapter + order` 排序。移动或改名可能破坏外部链接，应作为显式变更写进 PR。

## 6. 新增 Lab：可复制步骤

三类 Lab 的 Schema、脚手架、`make run`、本地评分、CMake/CTest、学生包与故障排查以 [Lab 更新与测试指南](LAB_AUTHORING_GUIDE.md)为准；本节只描述它们如何进入通用内容协作流程。

以第 2 章的栈实验为例：

1. 创建 Lab Issue，说明学习目标、输入输出、验收方式与依赖。
2. 判断类型后运行 `pnpm lab:new -- --type <quiz|program|project> --chapter 2 --slug stack`，由工具自动分配 `T/E/P` 稳定编号；只有需要调整展示位置时才传 `--order`。也可以说明为何继续使用 README-only。
3. 先写目标、准备、步骤、验收清单、思考题和复盘，再决定是否需要代码目录。
4. 如有实现，遵循统一 student/solution/tests/task 结构；README 必须给出 `make run` 与 pnpm 免 Make 兜底。
5. 运行 `pnpm lab:validate -- <lab-path>`；Program/Project 再运行 `pnpm lab:verify -- <lab-path>`。
6. 用一份全新检出或至少从清晰环境按说明复现，避免依赖作者机器中的隐藏状态。
7. 启动网站检查 Lab 页面是否自动出现，再提交 PR。

Lab frontmatter 在正文基础上额外包含：

```yaml
lab: true
difficulty: "入门"
duration: "45～60 分钟"
```

一个合格的 Lab 不以代码行数衡量，而以“读者能否知道要学什么、如何操作、怎样判断完成”为准。

## 7. Definition of Done

PR 中保留以下检查表；不适用项必须解释，不能静默删除。

- [ ] 读者完成后的可检查成果、范围、学习目标和前置知识清楚，`status` 符合实际成熟度。
- [ ] 核心定义、操作语义、复杂度及其前提已由两人核验。
- [ ] 至少一个示例或 Lab 已按文档从头复现。
- [ ] 关键边界、反例或常见错误有说明或测试，并有练习检查知识迁移。
- [ ] 正文、Lab、代码与测试使用一致的术语和行为约定。
- [ ] 引用可追溯；第三方文字、图片和代码的许可允许当前用法。
- [ ] 页面顺序、标题、链接和网站显示经过手工检查。
- [ ] `pnpm test` 通过；涉及导航、主题、Markdown 渲染、base 或发布时，Pages 子路径 `pnpm run check:site` 与 `pnpm run test:pages` 也通过。
- [ ] 新式 Lab 通过 `lab:validate`；Program/Project 的 reference 自动满分、starter 非满分、构建不污染工作树，且 Review Owner 从干净环境复现。
- [ ] AI 参与范围已说明，事实、代码、引用和测试结果均由人工复核。
- [ ] Review 的 blocking 评论已解决，Review Owner 已批准。

## 8. 版权、引用与 AI 复核

### 可接受的做法

- 阅读多个来源后，用自己的结构、语言、例子和图示重新讲解概念。
- 对非原创观点、定义变体、数据、图表和代码注明来源。
- 优先链接原始论文、官方文档、作者主页或出版社页面。
- 自己重新绘图，并标明“根据某来源重新绘制”；重绘不代表可以隐去思想来源。
- 使用明确开源许可的代码或图片，并遵守署名、相同方式共享等条件。
- 对必要的短引用使用引号/引用块并紧邻标注出处。

### 不可接受的做法

- 整段改几个词就当作原创，或连续复制教材、付费课程和网页正文。
- 截取来源不明或许可不允许再分发的图片放入仓库。
- 看到 GitHub 上的代码就默认可以复制；没有 License 不等于自由使用。
- 让 AI 仿写某本教材的章节，或使用 AI 编造的引用与 DOI。
- 在没有实际运行时声称“测试通过”或“性能更好”。

### 引用记录的最低信息

书籍记录作者、书名、版本、出版社和年份；网页记录作者/机构、页面标题、URL 和访问日期；论文记录作者、题名、期刊/会议、年份和 DOI/稳定链接；代码和图片还要记录具体 License 与版本/commit。

项目正式公开前，两位维护者需要共同确定 License。教材内容与代码可以采用不同许可，但必须在仓库中清楚说明适用范围。License 未确定前，不要从外部复制素材，也不要承诺贡献内容将按某许可证发布。

### AI 人工复核协议

AI 输出一律标记为“候选”，按类型核验：

- **事实/定义**：回到可靠原始来源，确认前提和术语差异。
- **复杂度**：人工写出计数或递推依据，并用边界例子检查。
- **代码**：维护者能逐段解释，实际编译运行，并补关键边界测试。
- **引用**：人工打开链接，确认作者、标题、年份和内容确实支持结论。
- **文字润色**：确认没有因改写引入过度承诺或改变技术含义。

PR 只需透明说明“AI 用于何处 + 如何复核”，不需要提交提示词全文。最终签字永远来自人。

## 9. MVP 边界与升级条件

### 现在必须保持

- 第 0、1 章可阅读，Lab 入口清楚。
- 新增 Markdown 后网站自动发现和排序。
- 两人轮换、PR Review、构建测试和人工终审。
- 内容、Lab 与网站展示之间只有一个正文来源。

### 有真实需求后再增加

- LaTeX/PDF 自动导出与出版模板。
- 更复杂的搜索（模糊匹配、第三方索引或跨版本索引）、评论、账户、进度保存等产品功能。
- 复杂交互 Playground 和大量动画。
- 多语言实现、性能基准和跨平台测试矩阵。
- 长期 `dev` 分支、复杂 Project Board、按章自动 Release。

升级条件是重复出现的痛点或清晰读者价值。例如：当前内置中文全文搜索无法满足真实检索需求时，才考虑模糊搜索或第三方索引；只有当两个以上章节需要同类交互时才抽象 Playground 框架。

## 10. 小改动与紧急勘误

拼写、失效链接等不改变技术含义的小改动仍建议走 PR，但可缩短描述与 Review。影响定义、算法行为、复杂度或实验结果的勘误一律按正常 Review 流程，PR 标题使用 `fix(...)`，并说明原结论、正确结论和证据。

不要为了“立即修复”绕过另一名成员对知识内容的核验；教材的信任来自可追溯修正，而非表面更新速度。
