# DSA Mastery 项目蓝图

> 状态：Demo / MVP；VitePress 站点基线已落地
> 适用对象：两名核心维护者及后续贡献者  
> 核心判断：先验证教材与 Lab 能否让读者形成可检查的课程能力，再扩展出版与交互能力。

## 1. 项目定位

### 一句话简介

DSA Mastery 是一套面向课程学习者、将理论推导与可复现实验结合的数据结构与算法开源教程。

### 项目介绍

DSA Mastery 不把“看完课程”或“记住结论”当作掌握。读者应当能够说明定义与设计取舍、推导复杂度、独立实现核心结构与算法、设计边界测试，并把方法迁移到课程题目和综合实验中。项目希望帮助读者在学校的数据结构与算法课程中达到高水平，同时为后续算法学习建立可靠基础。

两名学生共同完成研究、写作、实现、复现和交叉 Review，这是支持教程持续更新、提高内容可信度的生产方式。内容沿课程主线逐步覆盖概念、ADT、算法、复杂度、实现、测试、常见错误、典型问题、综合练习和扩展阅读。最终形态可以包含在线教材、可运行代码库、实验体系和交互式算法 Playground；Demo 先验证读者能否顺利走完一个最小的理论—实验闭环。

### 核心理念

```text
Input → Understand → Explain → Implement → Test → Teach → Review → Improve
```

- 读者能力优先于页面数量，真正掌握优先于短期记忆。
- 理论与实验相互验证；如果不能解释、推导、实现和测试，就还没有真正掌握。
- 教程不仅服务课程通过，更要训练处理综合问题和继续学习算法的能力。
- 两人维护与工程化服务于内容质量和持续交付，而不是项目的最终目的。
- AI 是辅助者和质检线索提供者，人工对知识、引用和发布负责。
- Markdown 是内容单一事实来源，避免在多个格式中重复修改。

### 项目目标

1. 帮助读者系统掌握课程核心理论，能够解释定义、推导复杂度并比较设计取舍。
2. 通过可运行实现、边界测试和对比实验，把抽象知识转化为独立完成实验的能力。
3. 通过典型问题与综合练习训练迁移能力，使读者能够应对课程考试、作业和综合应用。
4. 让两位维护者用研究、写作、编程、测试与 Review 持续产出可信内容。
5. 用自动渲染的网站降低发布成本，形成至少可持续一学期、可逐步接受外部贡献的教程体系。

### 非目标

- 不在第一阶段复刻商业级在线学习平台。
- 不追求一次覆盖所有算法，也不以篇幅衡量质量。
- 不在 Demo 同时维护手写 Markdown、LaTeX 和网页三份正文。
- 不把 AI 生成内容未经核验地当作正式教材。
- 不用复杂分支、微服务或大量自动化证明“工程能力”。
- 不提供押题、速成或成绩保证；课程高水平必须建立在真实理解与练习上。
- 不替代学校课程、教师指导或权威教材，而是补足理论、实验和练习之间的连接。

## 2. 最终成果与优先级

| 类别 | 长期成果 | Demo/MVP |
| --- | --- | --- |
| 读者能力 | 能解释、推导、实现、验证并迁移课程核心知识 | 完成一条可检查的理论—实验学习路径 |
| 教材 | 完整章节、练习、术语与参考文献体系 | 第 0~2 章简稿 + 第 3~7 章规划 |
| 代码 | 多种核心结构与算法的可运行实现 | Lab 接口和少量示例 |
| 实验 | 目标、步骤、测试、复盘、扩展任务 | 每章 2 个轻量 Lab |
| 网站 | 导航、目录、公式、代码、搜索、贡献信息 | 自动发现、导航、搜索、深色阅读与代码复制 |
| PDF/LaTeX | 分章 PDF 与全书出版物 | 暂不建设 |
| 互动 Demo | 栈、队列、树、排序、图算法 Playground | 暂不建设 |
| 测试 | 单元、边界、集成、性能测试 | 网站构建与最小集成测试 |
| 工程化 | CI、预览、版本、变更日志、自动发布 | 本地 build/test + PR Review |
| 社区 | 贡献指南、Issue、勘误与讨论机制 | 轻量模板与协作规范 |

只有当连续完成至少 2～3 个章节、当前流程确实产生重复劳动时，才引入对应自动化。

## 3. 仓库架构

```text
dsa-mastery/
├─ README.md                    # 新成员入口
├─ CONTRIBUTING.md             # 贡献入口与最短流程
├─ .vitepress/
│  ├─ config.ts                # VitePress、rewrites、Markdown、Pages base
│  ├─ content-index.ts         # 构建期内容索引
│  ├─ content.data.ts          # Vue 内容数据加载
│  └─ theme/                   # 默认主题扩展、品牌组件与样式
├─ index.md                     # 品牌首页入口
├─ content/                     # 教材 Markdown，内容单一事实来源
│  ├─ README.md                # frontmatter 与目录约定
│  ├─ chapter-00-introduction/
│  ├─ chapter-01-linear-list/
│  └─ chapter-02-stack-queue/
├─ labs/                        # 章节实验与后续实现/测试
│  ├─ index.md                 # Labs 目录入口
│  ├─ chapter-00/
│  ├─ chapter-01/
│  └─ chapter-02/
├─ public/                      # 图片等 Web 静态资源
├─ scripts/                     # 内容、自动发现与产物审计
├─ tests/                       # Pages 最终产物 Playwright
├─ docs/
│  ├─ PROJECT_BLUEPRINT.md      # 本文档
│  ├─ UPDATE_WORKFLOW.md        # 日常生产与发布规范
│  └─ VITEPRESS_MIGRATION.md    # 架构、风险与回滚
└─ .github/                     # PR 和 Issue 模板
```

目录职责边界：

- `content/` 只放教材正文及其写作规则。完整程序不塞进正文。
- `labs/` 放实验说明；未来同一 Lab 可增加 `src/`、`tests/`、样例输入输出。
- `.vitepress/content-index.ts` 只在构建期发现并派生课程数据；Vue 组件不读取文件或复制正文。
- `.vitepress/theme/` 扩展默认 VitePress 外壳，只自定义品牌首页、Labs 目录和课程元信息。
- `public/` 中的图片需记录作者、来源和许可；可在后续增加资源清单。
- `dist/pages`、Playwright 输出和缓存都是可再生文件，不作为人工编辑入口。

## 4. 推荐章节结构

不同章节可以调整篇幅，但应尽量按学习顺序覆盖：

1. 本章导览：为什么学、学习目标、前置知识。
2. 核心概念与定义：统一术语、符号和操作语义。
3. ADT 或问题模型：数据、操作、约束、不变量。
4. 表示与算法：设计思路、关键步骤、图示或伪代码。
5. 复杂度：时间、空间、最好/平均/最坏情况及前提。
6. 实现：只展示关键代码并链接完整 Lab/源码。
7. 示例与实验：至少一个可复现例子或 Lab。
8. 常见错误：错误原因、反例及诊断方法。
9. 练习与思考：概念题、手算题或小型编程任务。
10. 小结与延伸阅读：本章知识图谱、可靠来源。

Demo 允许章节只覆盖其中的核心部分；合并时必须明确 `status: draft`，不能把未完成内容包装成正式章节。

## 5. 两人角色轮换

每章设置两个角色：

- **Chapter Owner**：建立 Issue 和提纲，组织理论、示例、Lab 与修改；对交付完整性负责。
- **Review Owner**：独立查证关键结论，复现实验，检查边界与表达；批准后负责合并。

下一章交换角色。Reviewer 不是“挑错的人”，而是该章的第二位学习者，至少应亲自补充一个反例、测试或练习。这样两人都会写理论、写代码、做实验和 Review。

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

若章节跨度明显不同，可在一个大章中按小节交换“实现负责人”，但最终仍只有一位 Chapter Owner 串联叙事。意见冲突按“可运行证据 → 权威来源 → 最小实验 → 暂记开放问题”的顺序处理，不以合并权限决定知识结论。

## 6. 章节生产流水线

```text
Issue/目标
   ↓
资料与提纲
   ↓
正文 + 示例 + Lab
   ↓
作者自检与本地构建
   ↓
同伴独立复现/Review
   ↓
修改 + 人工终审
   ↓
合并 main → 网站更新
```

| 阶段 | 输入 | 输出 | 主责 |
| --- | --- | --- | --- |
| Planning | 课程进度、读者需求 | 范围、目标、非目标、Issue | Owner |
| Research | 教材/论文/官方资料 | 可追溯资料清单与争议点 | Owner，Reviewer抽查 |
| Outline | 章节模板 | 小节与 Lab 方案 | Owner |
| Draft | 提纲与资料 | 原创正文、关键示例 | Owner |
| Implement | ADT 与算法 | 可运行实现或明确的实验任务 | Owner |
| Verify | 正文、实现 | 测试结果、复杂度推导、反例 | 双方独立 |
| Review | 完整 PR | 评论、修改项、批准结论 | Reviewer |
| Publish | 通过的 PR | `main` 中的章节与网站页面 | Reviewer 合并 |

详细操作见 [UPDATE_WORKFLOW.md](UPDATE_WORKFLOW.md)。

## 7. 技术路线与 Single Source of Truth

### 当前实现

- 写作：Markdown + YAML frontmatter，便于 Git diff、Review 和 AI 辅助。
- 网站：VitePress `1.6.4` 以仓库根目录为 source root，自动生成页面、侧栏、搜索和课程索引。
- 主题：保留默认 VitePress 顶栏、搜索、appearance、侧栏、outline、prev/next、代码复制和 404；只自定义 `BrandMark`、`Home`、`Labs`、`DocumentHeader`/`Footer` 与品牌 CSS。
- 公式与代码：`markdown.math: true` 使用 MathJax；代码高亮与复制由 VitePress 处理。
- Lab：每个 Lab 一个独立目录，从 `README.md` 开始，按需要增加代码与测试。
- 验证：`pnpm test` 统一覆盖内容、类型、lint、自动发现、build 与产物审计；Pages 子路径由 Playwright 真实点击验证。
- 托管：公开仓库通过 GitHub Actions 自动构建并发布到 [GitHub Pages](https://azenann.github.io/DSA-Mastery/)；生成目录不进入 Git。

迁移实现、传递依赖风险和回滚见 [VITEPRESS_MIGRATION.md](VITEPRESS_MIGRATION.md)。

### 为什么暂不以 LaTeX 为主源码

LaTeX 适合出版级 PDF，但 Web 组件、交互 Demo、GitHub diff 和学生协作体验较弱。若同时维护 LaTeX 与 Markdown，最容易产生内容漂移。因此当前选择 Markdown 为主，未来用 Pandoc/Quarto 或定制导出流水线生成 LaTeX/PDF；只有确认出版排版是近期刚需时再做模板工程。

### 数据流

```text
人工维护
  ├─ content/chapter-*/*.md ─┐
  ├─ labs/**/README.md ──────┴─► validator + content-index
  │                                  ├─► 页面 / 侧栏 / 搜索 / 首页统计
  │                                  └─► VitePress build ─► dist/pages ─► Pages
  └─ labs/**/src + tests（未来）──► 编译/测试 ───► 可复现实验结果

未来自动生成
  content + 引用 + 资源 ───────► Pandoc/Quarto ──► 分章 PDF / 全书 PDF
```

手工编辑区是 Markdown、Lab 源码和 `.vitepress/`。`dist/pages`、`test-results`、`playwright-report`、缓存和生成的 HTML/PDF 都不应手工修改；如果输出不正确，应修复源文件、主题或构建器。

## 8. 网站内容契约

正文放在 `content/chapter-NN-topic/*.md`，新 Lab 放在 `labs/chapter-NN/lab-NN-X-SS-topic/README.md`（`X` 为 `T/E/P`，`SS` 为类型内稳定序号；既有旧路径继续兼容）。正文 frontmatter 的当前必填字段是：

```yaml
title: "页面标题"
description: "一句话摘要"
order: 0
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-09"
contributors: ["成员 A"]
status: "draft"
```

Lab 额外需要 `lab: true`、`difficulty` 和 `duration`。目录与文件使用两位数字前缀保证仓库中也能自然排序；同一类内容、同一章的 `order` 不得重复。网站从路径推导 URL，并根据 `chapter + order` 建立导航，因此新增 Markdown 不应要求修改配置或组件。

正文可保留 `./page.md` 或跨目录相对 `.md` 链接。内容校验检查源目标存在，VitePress 构建再将其改写成课程路由并应用 Pages base；正文不得硬编码 `/DSA-Mastery/`。

## 9. 自动化边界

当前 GitHub Actions 让 PR 与 `main` 复用同一个 build job：

```text
Pull Request
  └─ pnpm install --frozen-lockfile → validate → discovery → build → artifact check → Playwright → upload artifact

main
  └─ 同一 build job → deploy-pages → GitHub Pages 公开课程网站
                          └─ 未来再追加 PDF/Release artifact
```

- PR 构建并上传测试 artifact，但 deploy job 显式跳过，不发布正式内容。
- `main` 必须复用 PR 的检查，避免“Review 通过但发布失败”。
- CI 使用 Node 24；本地最低版本仍由 `package.json#engines` 规定为 `>=22.13.0`。
- Pages base 来自 `actions/configure-pages`，只注入一次；本地可按迁移文档复现同一子路径。
- PDF、Benchmark 和多语言矩阵等耗时任务等对应成果进入近期范围后再增加。
- 自动检查失败必须修复或明确调整规则，不能用 AI Review 或口头确认替代。

## 10. AI 与人工责任边界

| 场景 | AI 可以做 | 人工必须做 |
| --- | --- | --- |
| Planning | 提纲候选、遗漏项提示 | 决定范围与教学目标 |
| Writing | 初稿、改写、术语扫描 | 逐句确认事实和教学逻辑 |
| Coding | 样板、测试候选、静态审查 | 运行、调试、检查边界与复杂度 |
| Research | 提供检索词和来源线索 | 打开原始来源、核对引用与许可 |
| Review | 找矛盾、反例、断链 | 判断严重性、批准与合并 |
| Publishing | 格式和构建诊断 | 确认版本内容与公开范围 |

所有由 AI 生成的事实、代码和引用都视为“待验证输入”。禁止提交不存在的参考文献、未运行的测试结论或无法解释的代码。PR 描述应简要说明 AI 用在何处、人工如何验证，不必保存冗长聊天记录。

## 11. 质量标准

章节合并标准刻意控制在可持续范围：

1. 读者完成后的可检查成果、范围、学习目标和前置知识明确，`status` 与完成度一致。
2. 核心定义、操作语义和复杂度已由两人核验。
3. 至少一个示例或 Lab 可以按说明复现。
4. 关键边界、常见错误或反例得到说明，并有练习检查读者能否迁移知识。
5. 引用真实可访问，第三方图片和代码许可清楚。
6. 标题、术语、文件名、导航顺序一致。
7. 构建和现有测试通过，没有新增明显断链。
8. Reviewer 批准，Owner 完成修改，双方认可发布。

“AI Review 通过”不是独立发布门槛；AI 只能增加检查线索，不能签署完成。

## 12. 路线图

### Phase 0：基础设施（已完成）

- 确认目录、frontmatter、两人轮换和 Review 规则。
- 完成第 0、1 章简稿、4 个 Lab 与教程网站 Demo。
- 用真实更新验证新增 Markdown 是否无需改网站代码。
- 以第 2 章（栈与队列）demo 验证多章节内容框架：4 篇文章 + 2 个 Lab 零配置进入侧栏、搜索与导航。

### Phase 1：MVP 验证

- 由两人分别完整 Owner 一个新章（自第 3 章开始，按轮换表）。
- 邀请目标读者完成至少一篇教程和一个 Lab，记录卡点、耗时与未达到的学习目标。
- 根据实际摩擦调整模板和 DoD，而非继续加功能。
- 补最小内容校验：字段、排序唯一性和内部链接。（已完成）

### Phase 2：课程核心能力建设

按依赖顺序推进第 3~7 章（规划见 Trellis parent task `08-12-roadmap-chapters-3-7`）：

| 顺序 | 章节 | 依赖 | 关键内容 |
| --- | --- | --- | --- |
| 3 | 字符串与数组 | 无 | 串匹配与 KMP、数组寻址、特殊矩阵压缩 |
| 4 | 树与二叉树 | 第 2 章 | 遍历（含非递归）、Huffman、堆 |
| 5 | 图 | 第 4 章 | DFS/BFS、MST、最短路径 |
| 6 | 查找 | 第 4 章 | BST、散列表 |
| 7 | 排序 | 第 4 章（堆） | 插入/交换/选择/归并/堆排/基数、稳定性 |

- 每章保持 `00-overview + 2~3 篇文章 + 2 个 Lab` 同构骨架。
- 为核心结构增加可运行实现、单元测试和实验结果。
- 增加典型问题、综合练习、术语表与引用清单。

### Phase 3：完整教材

- 补章节连贯性、综合练习、索引和统一图示。
- 建立编辑版本号和发布说明。
- 评估自动导出 PDF，而非提前维护双份源码。

### Phase 4：在线教材增强

- 依据真实读者反馈改进搜索相关性、目录体验，并增加编辑链接等协作入口。
- 优先改善可读性、无障碍和移动端体验。

### Phase 5：Interactive Playground

- 从一个高价值交互（如排序单步执行）开始。
- 每个交互都要有确定状态模型、重置能力和测试。

### Phase 6：公开协作完善

- 仓库已经公开；下一步明确 License、治理、版本节奏和外部贡献机制。
- 只有贡献规模需要时再引入更复杂的 Project Board 与自动发布。

## 13. 第一个月行动计划

| 周次 | 目标 | A | B | 可验收输出 |
| --- | --- | --- | --- | --- |
| Week 1 | 定规则、跑通 Demo | 第 0 章 Owner | 第 0 章 Reviewer/网站验证 | 目录契约、两章骨架、可运行网站 |
| Week 2 | 验证完整章节闭环 | 完善第 0 章与 Lab | 独立复现、提 Review | 第一份按 DoD 合并的章节 |
| Week 3 | 交换角色 | Review 第 1 章 | 第 1 章 Owner 与 Lab | 第二次完整轮换记录 |
| Week 4 | 复盘并定下阶段范围 | 汇总内容问题 | 汇总工程问题 | Demo 展示、会议决策、下月 Issue |

月底成功标准不是页数，而是两人都走完一次 Owner 和 Reviewer 流程，并能在不修改网站导航代码的情况下新增页面。

## 14. 主要风险与止损规则

| 风险 | 早期信号 | 止损规则 |
| --- | --- | --- |
| 范围失控 | 同时开多个未完成章节 | 每人最多一个进行中的核心 PR |
| 沉迷网站 | 内容未更，组件持续增加 | 没有真实内容需求不新增组件 |
| 双份维护 | Markdown 与 LaTeX 内容漂移 | PDF 只允许从主源码生成 |
| AI 幻觉 | 引用打不开、代码未运行 | 无人工核验不得合并 |
| 分工固化 | 一人长期只写代码 | 每章交换 Owner/Reviewer |
| Review 形式化 | 只有“LGTM”无复现 | Reviewer 至少提交一项验证证据 |
| 工作流过重 | 小改动也耗时数天 | 保留 main + 短分支，按摩擦增加规则 |
| 更新中断 | 两周无进展且 Issue 过多 | 缩小下一章范围，先完成一个小节 |
| 版权风险 | 来源不明的图文进入仓库 | 删除或重绘，许可未确认即不发布 |

## 15. Demo 评审会议建议

演示后只需共同回答五个问题：

1. 目标读者完成一篇教程后，能否准确说出并使用本页的核心知识？
2. 读者能否从理论章节自然进入 Lab，并独立判断实验是否完成？
3. 当前内容是否同时覆盖定义、复杂度、实现、边界和知识迁移？
4. 两人 Review 与 Markdown 自动发布是否足以持续保障这些读者成果？
5. 下一个月最影响学习效果的缺口是新内容、练习、实验还是网站体验？

把会议结论转成 3～5 个 Issue，并明确本轮不做什么。项目能持续，依靠的是稳定的小循环，不是一次完美的总设计。
