# Implementation Plan：线性表五类选择题 Lab

## 1. Enter Execution

- [x] 用户明确批准本轮最终规划摘要。
- [x] 运行 Phase 1.4 review gate、校验规划材料并执行 `task.py start`。
- [x] 加载 `trellis-before-dev`，确认 Lab、VitePress 和质量规范及工作树边界。

## 2. Extract and Audit Sources

- [x] 读取 5 篇源 Markdown，按 `### 选择题 N` 边界提取 `10 / 10 / 10 / 2 / 4` 道题。
- [x] 记录每题标题、来源、难度、考点、A～D、正确答案和答案解析，确认未越界导入综合题。
- [x] 收集目标题目中的图片与本地链接；优先采用已有文字版结构，列出确需复制的最小资源。

## 3. Generate Five Labs

- [x] 创建 `lab-01-04-sequential-list-quiz/README.md`，包含顺序表前 10 题。
- [x] 创建 `lab-01-05-singly-linked-list-quiz/README.md`，包含单链表前 10 题。
- [x] 创建 `lab-01-06-doubly-linked-list-quiz/README.md`，包含双链表前 10 题。
- [x] 创建 `lab-01-07-circular-linked-list-quiz/README.md`，包含循环链表现有 2 题。
- [x] 创建 `lab-01-08-static-linked-list-quiz/README.md`，包含静态链表现有 4 题。
- [x] 为每篇补齐 Lab frontmatter、目标、前置知识、作答方法、答案速查、完成清单、思考题和复盘。

## 4. Normalize and Review Markdown

- [x] 把每题规范为“标题 + 元信息 + 题面 + A～D + 单个折叠答案容器”。
- [x] 移除 Obsidian callout、源目录绝对路径和失效图片引用。
- [x] 逐页检查公式、表格、代码围栏、嵌套列表、details 开闭和外部链接。
- [x] 对比源文件顺序和答案字母，确保机械转换没有改变题意或正确答案。
- [x] 精确删除一次性转换脚本和临时审计文件。

## 5. Automated Coverage

- [x] 运行题库结构审计：题量为 `10 / 10 / 10 / 2 / 4`，总计 36，每题有 4 个选项和 1 个答案容器。
- [x] 搜索 Obsidian 标记、`C:\Users\`、`../assets/practice`、硬编码 `/DSA-Mastery/` 和未闭合围栏。
- [x] 如现有测试覆盖不足，更新 `tests/pages-navigation.spec.mjs`，覆盖搜索与代表性新 Lab 渲染。

## 6. Quality Gate

- [x] 运行 `pnpm run validate:content`。
- [x] 运行 `pnpm run validate`。
- [x] 运行 `pnpm run test:discovery`。
- [x] 运行 `pnpm test`。
- [x] 设置 Pages base 与 `SITE_URL`，运行 `pnpm run build`、`pnpm run check:site` 和 `pnpm run test:pages`。
- [x] 检查 `git diff --check`、`git status --short`，确认无 fixture、生成物、日志或截图混入。

## 7. Local Preview and Handoff

- [x] 用最终 Pages-base 构建启动绑定 `127.0.0.1` 的本地预览，端口冲突时选择空闲端口。
- [x] 在 Labs 索引、五篇直接页面、桌面和 390px 移动视口检查题目、表格、代码、折叠答案、搜索和控制台。
- [x] 保持预览服务运行，提供 Labs 索引及 5 个直接 URL。
- [x] 报告真实题量、文件清单、验证结果和仍需人工知识复核的答案；不提交、不推送、不开 PR。

## Rollback Points

- 题目转换：按单个 Lab 目录回退，不改源文件。
- 自动化覆盖：只回退新增 Lab 的浏览器断言。
- 本地预览：终止精确预览进程，不删除仓库内容或其他服务。

## 8. 用户预览后的发布清洗

- [x] 删除五篇 Lab 的“查看原始页面”链接，保留题目来源名称和题目标识。
- [x] 删除答案中的“相关学习资源 / 看交互可视化”区块，且不留下空标题。
- [x] 删除五篇页首答案来源说明与题内 Codex 答案来源声明。
- [x] 将个人题库导入清洗准则写入 `.trellis/spec/content/labs.md`，补充错误矩阵、测试和正反例。
- [x] 重新运行内容、结构、Pages-base 浏览器门禁并刷新本地预览。

## 9. 用户预览后的交互与目录修订

- [x] 把五篇静态题目迁移到同目录 `quiz.json`，README 统一使用既有 `<QuizSet />`。
- [x] 通用增强 `quiz.data.ts` 与 `QuizSet.vue`，兼容 Lab 00-03，并支持富文本题面、选项、解析和题目元信息。
- [x] 让编号章节的“相关 Labs”从 ContentIndex 自动收录同章全部 Lab，补齐 Lab 01-04～01-08。
- [x] 在内容 validator 中检测 Quiz 数据契约、唯一挂载点及静态答案重复，在自动发现 fixture 中检测侧栏收录。
- [x] 更新 Pages 浏览器测试，覆盖五个侧栏入口和选择、提交、反馈、重试。
- [x] 将交互 Quiz 与章节 Lab 完整性约束写入 Trellis 内容、前端和质量规范。
- [x] 重新执行完整质量门禁、Pages-base 构建与浏览器检查，并刷新本地预览。
