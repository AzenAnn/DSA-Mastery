# Implementation Plan：第 4 章树与二叉树理论题整理

## 1. Enter Execution

- [x] 用户明确批准本轮最终规划摘要。
- [x] 运行 `task.py start`，把任务切换为 `in_progress`。
- [x] 加载 `trellis-before-dev`，复核内容、Lab、VitePress 与质量规范。

## 2. Extract and Normalize the Eight Sources

- [x] 只读取 `01`～`08`，按原顺序选取每份前 20 道选择题与前 5 道综合题；不足时取全部。
- [x] 将 117 道选择题映射到 Quiz Schema，生成稳定唯一 id、四选项数组、0-based 答案与解析。
- [x] 将 16 道综合题转换为 VitePress Markdown 题面与折叠参考答案。
- [x] 把图片题改用源文档自带的文字结构，不复制或热链外部图片。

## 3. Create the Chapter 4 Theory Labs

- [x] 创建 `lab-04-15-binary-tree-basics-quiz`（20 + 5）。
- [x] 创建 `lab-04-16-preorder-traversal-quiz`（12 + 1）。
- [x] 创建 `lab-04-17-inorder-traversal-quiz`（11 + 3）。
- [x] 创建 `lab-04-18-postorder-traversal-quiz`（14 + 0）。
- [x] 创建 `lab-04-19-level-order-traversal-quiz`（8 + 0）。
- [x] 创建 `lab-04-20-reconstruct-binary-tree-quiz`（18 + 2）。
- [x] 创建 `lab-04-21-threaded-binary-tree-quiz`（14 + 0）。
- [x] 创建 `lab-04-22-trees-and-forests-quiz`（20 + 5）。
- [x] 为每个 Lab 写完整 README、统一 `lab.json` 和唯一选择题数据源 `quiz.json`。

## 4. Integrate the Directory

- [x] 在 `content/chapter-04-tree/00-overview.md` 增加八个配套理论题 Lab 的目录、题量和相对链接。
- [x] 确认 CourseIndex 自动发现并归入 Theory，不修改侧栏、Labs 首页或组件清单。

## 5. Mechanical and Content Audits

- [x] 审计逐文件与总题量为 117 道选择题、16 道综合题。
- [x] 审计四选一、答案范围、id 唯一、解析非空、可见来源字段缺失及 README 无选择题副本。
- [x] 审计无 `09` 以后题目、源绝对路径、Obsidian callout、外部图片热链、缓存和临时脚本。
- [x] 抽查所有八个主题的首尾题及答案映射；标记仍需 Review Owner 独立核验的知识风险。

## 6. Quality Gate and Local Preview

- [x] 运行 `pnpm lab:validate` 与 `pnpm run validate:content`。
- [x] 运行 `pnpm run validate`、`pnpm run test:discovery` 和 `pnpm test`。
- [x] 在 Pages base 环境运行 build、`check:site` 和 `test:pages`。
- [x] 使用桌面和 390px 移动端检查目录、八个 Lab、Quiz 交互和综合题折叠。
- [x] 运行 `git diff --check` 与 `git status --short`，确认没有生成物或无关改动。
- [x] 启动 `127.0.0.1` 本地预览并交给用户验收；保持未提交、未推送、未开 PR。

## 7. Post-Approval Delivery

- [x] 用户明确确认本地预览无问题，并要求提交 PR。
- [x] 重新核对工作树与必要门禁，准备按 Conventional Commits 提交内容和 Trellis 记录。
- [x] 推送 `codex/chapter4-theory-exercises`。
- [x] 创建目标分支为 `chapter/04` 的 PR #58，记录题量、验证结果、AI 参与范围和人工复核风险。

## 8. User Preview Feedback

- [x] 从 117 道选择题中移除 `source`、`targetId` 和题面末尾的可见来源行，同时保留内部唯一 `id`。
- [x] 从 16 道综合题中移除可见来源行和题目标识。
- [x] 重新运行目标 Lab、内容校验和浏览器检查，确认页面不再显示“来源”“题目标识”或“标识”。

## Rollback Points

- 单个题库：对应 `lab-04-15`～`lab-04-22` 目录可独立回退。
- 目录接入：增删 Lab 时同步回退 `content/chapter-04-tree/00-overview.md` 的目录项。
- 不修改通用组件或 Schema，因此回退不需要数据迁移。
