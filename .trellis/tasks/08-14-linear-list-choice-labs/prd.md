# PRD：线性表五类选择题 Lab

## Goal

把用户本地 CodeBrick Obsidian 导出目录中的 5 篇线性表选择题，整理为 DSA Mastery 第 1 章可自动发现、可交互作答、可提交并查看反馈的 Lab。读者应能在网页中完成顺序表、单链表、双链表、循环链表和静态链表的分主题自测，而不需要理解 Obsidian 专用 callout 语法或访问作者机器上的本地资源。

## Background and Confirmed Facts

- 源目录为 `C:\Users\28962\Desktop\Undergraduate resource\大二\大二上\数据结构与算法\codebrick-exporter\output\数据结构-Obsidian\02-线性表`，只作为只读导入来源，不纳入仓库。
- 5 篇源文件及选择题数量为：顺序表 12、单链表 16、双链表 17、循环链表 2、静态链表 4。
- “每篇前 10 题”解释为最多保留前 10 题：前三篇各 10 题，后两篇保留现有全部 2 题和 4 题，共 36 题；不补造题目。
- 现有第 1 章 Lab 使用 `lab-01-01`～`lab-01-03`，新增页面应使用 `order` 4～8。
- 源文档使用 Obsidian callout；项目目标格式为 VitePress Markdown。交互形式必须复用 `Lab 00-03：复杂度计算自测` 的 `QuizSet`，不能以静态选项加折叠答案代替。
- 源文件中存在作者机器相对资源路径；题面已有文字版结构时，应以文字表格替代图片引用，不能把失效路径带入课程站点。
- 当前分支为 `codex/linear-list-choice-labs`，creator/assignee 均为 `Azen`。

## Requirements

### R1. 五个独立 Lab

按下列固定映射创建 5 个 `README.md`：

| order | 目录 | 标题 | 题量 |
| --- | --- | --- | --- |
| 4 | `labs/chapter-01/lab-01-04-sequential-list-quiz/` | `Lab 01-04：顺序表选择题精练` | 10 |
| 5 | `labs/chapter-01/lab-01-05-singly-linked-list-quiz/` | `Lab 01-05：单链表选择题精练` | 10 |
| 6 | `labs/chapter-01/lab-01-06-doubly-linked-list-quiz/` | `Lab 01-06：双链表选择题精练` | 10 |
| 7 | `labs/chapter-01/lab-01-07-circular-linked-list-quiz/` | `Lab 01-07：循环链表选择题精练` | 2 |
| 8 | `labs/chapter-01/lab-01-08-static-linked-list-quiz/` | `Lab 01-08：静态链表选择题精练` | 4 |

每个页面遵守 Lab frontmatter 契约：`chapter: 1`、`chapterTitle: "线性表"`、与目录一致的 `order`、`updated: "2026-08-14"`、`contributors: ["Azen"]`、`status: "draft"`、`lab: true`，并提供合理的 `difficulty` 与 `duration`。

### R2. 题目选择与内容边界

- 严格按源文件出现顺序截取前 10 道选择题；源文件不足 10 道时保留全部现有题目。
- 保留题面、选项、正确答案、答案详解、选项辨析、题目来源名称、难度、考点和题目标识。
- 不导入综合题，不新增或拼凑选择题，不把 36 道题合并成一个超长页面。
- 不对答案做无依据的知识重写；只允许修正转换造成的 Markdown、公式、代码围栏、表格或明显失效资源问题。
- 移除个人导出稿中的“查看原始页面”“看交互可视化”、页首答案来源说明和题内 Codex 答案来源声明；内容继续标记为 `draft`，等待 Review Owner 人工核验。

### R3. 统一交互题目与答案格式

每个 Lab 使用同一结构：

1. 目标、前置知识、建议用时和作答步骤；
2. README 使用既有 `<QuizSet />`，题库放入同目录 `quiz.json`，复用 Lab 00-03 的唯一答题运行时；
3. 每题显示来源、难度、考点和题目标识，A～D 必须是可选择控件；
4. 用户提交后才显示对错、正确答案、详解和选项辨析，并支持重新作答；
5. 页面末尾保留答案速查表、完成清单、思考题和复盘。

Obsidian 的 `[!summary]`、`[!question]`、`[!example]`、`[!success]`、`[!warning]` 等语法不得原样残留。不得新增第二套 Quiz 组件；只允许增强现有通用 `QuizSet` 和 `quiz.json` 契约以支持富文本题面与解析。

### R4. 资源、链接与可移植性

- 不引用 `C:\Users\...` 或源导出目录中的本地绝对路径。
- 对首 10 题内的图片引用逐项检查：已有完整文字版题面时删除图片依赖并保留文字表格；若文字不足以独立作答，才把对应资源复制到合规的站点静态目录并使用仓库内链接。
- 不复制 CodeBrick 题目详情页和个人可视化入口；题面必须脱离这些链接仍可独立作答。
- 不硬编码 `/DSA-Mastery/`，不为每篇 Lab 手工维护侧栏链接；5 个 Lab 必须由统一 ContentIndex 自动进入 Labs 索引、搜索和“Ch.1 线性表 → 相关 Labs”。

### R5. 验证与本地预览

- 机械审计五份 `quiz.json` 的题目数为 `10 / 10 / 10 / 2 / 4`，总计 36；每题都有四个选项、合法答案索引和非空解析，README 仅挂载一次 `<QuizSet />`。
- 运行 `pnpm run validate:content`、`pnpm run validate`、`pnpm run test:discovery` 和 `pnpm test`。
- 在 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与正式 `SITE_URL` 下运行 `pnpm run build`、`pnpm run check:site` 和 `pnpm run test:pages`。
- 浏览器检查 Labs 索引、搜索、线性表侧栏五个新增入口、五篇直接页面、桌面与 390px 移动布局、公式、表格、代码、选择/提交/反馈/重试和控制台。
- 启动绑定 `127.0.0.1` 的最终预览服务，向用户提供 Labs 索引和五个直接 URL，并保持服务运行供检查。

## Acceptance Criteria

- [x] 第 1 章新增 5 个命名、order 和 frontmatter 均合规的选择题 Lab。
- [x] 五篇分别包含 10、10、10、2、4 道源文件顺序一致的选择题，共 36 道，不包含综合题或补造题。
- [x] 每道题的题面、可选选项、提交按钮、反馈和解析在 VitePress 中结构清晰，并复用现有 `QuizSet`。
- [x] 页面不含 Obsidian callout、作者机器绝对路径、失效图片、硬编码 Pages base、个人原始页/可视化入口或答案生成声明。
- [x] Labs 索引、搜索和线性表“相关 Labs”自动发现五篇页面，无手写第二份导航。
- [x] 内容、类型、lint、自动发现、构建、产物审计和 Pages 浏览器测试全部通过。
- [x] 本地预览可访问，桌面与移动页面无横向溢出或控制台错误，用户能直接检查五篇 Lab。

## Out of Scope

- 不导入 `_目录.md`，不导入任何综合题。
- 不修改现有 `Lab 01-01`～`Lab 01-03` 的教学内容。
- 不新增在线判题、答题状态持久化或第二套自定义 Vue Quiz 组件。
- 不修改 VitePress 路由、依赖或 Pages 发布机制；仅对既有 Quiz 组件、数据加载和样式做通用增强。
- 不提交、推送、创建 PR 或发布线上站点；本轮先交付本地预览，后续由用户决定。

## Open Questions

无阻塞问题。题量不足 10 的处理、五篇拆分方式、答案展示形式、资源策略和本地预览目标均已由用户输入、前置规划摘要及仓库规范确定。
