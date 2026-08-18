# Implementation Plan：查找章节理论内容与选择题

## 1. Enter Execution

- [x] 用户明确批准本轮最终规划摘要。
- [x] 执行 `task.py start`，将任务切换为 `in_progress`。
- [x] 加载 `trellis-before-dev`，复核内容、Lab、VitePress 与质量规范及工作树边界。

## 2. Establish the Chapter Framework

- [x] 迁移现有 BST、散列表文件到新的 order 2、5 文件名，立即修正 frontmatter 和相关链接。
- [x] 重写 `00-overview.md`，列出五篇正文的学习问题、能力映射、顺序和三个 Lab。
- [x] 新建基础查找、平衡查找树、B/B+ 树三篇正文骨架，确保 order 1～5 无缺口或重复。

## 3. Write and Review All Articles

- [x] 完成 `01-linear-and-binary-search.md`：基本概念、顺序/分块/折半查找、判定树、ASL 和选型。
- [x] 扩写 `02-binary-search-tree.md`：查找/插入/删除、退化、平均/最坏复杂度和练习。
- [x] 完成 `03-balanced-search-tree.md`：AVL 四类旋转与删除再平衡、红黑树性质/操作直觉/对比。
- [x] 完成 `04-b-tree-and-b-plus-tree.md`：阶数边界、查找、插入、删除、B+ 树差异和 I/O 场景。
- [x] 扩写 `05-hash-table.md`：冲突策略、删除、装填因子、成功/失败 ASL、再散列和选型。
- [x] 更新既有两个操作 Lab 的前置文章链接与节号；检查概览和正文的往返链接。
- [x] 视文本机械感使用 humanizer 做限定范围润色，再人工复核术语、公式、代码和结论未被改变。

## 4. Build the 24-Question Theory Lab

- [x] 按研究清单逐年核对 24 道题的题面、四个选项和答案，不导入解答题。
- [x] 为图形/表格题重建独立可答的 Markdown 表格或层级文本，删除来源站点交互与收藏痕迹。
- [x] 独立推导每道解析，并为 `6 / 11 / 7` 三类题添加主题元数据和稳定 id。
- [x] 创建 `lab-06-03-search-theory-quiz/quiz.json`，核对答案字母到 0～3 的映射。
- [x] 创建 Lab README，包含前置知识、作答流程、唯一 `<QuizSet />`、24 题答案速查、完成清单、思考题和复盘。

## 5. Mechanical and Knowledge Audits

- [x] 审计文章集合为 `00`～`05`、order 唯一、标题与文件名一致，旧文件名和旧节号无残留。
- [x] 审计题库恰好 24 题、主题数量 `6 / 11 / 7`、每题 4 选项、id 唯一、答案合法、解析非空、无 Q41/Q42。
- [x] 对题源年份/题号矩阵做逐项差异核对；重点手算 B 树高度/结点计数、删除调整和散列表 ASL。
- [x] 搜索硬编码 `/DSA-Mastery/`、目标网站 UI 痕迹、抓取缓存、临时脚本和断开的相对 Markdown 链接。

## 6. Quality Gate

- [x] 运行 `pnpm run validate:content`。
- [x] 运行 `pnpm run validate`。
- [x] 运行 `pnpm run test:discovery`。
- [x] 运行 `pnpm test`。
- [x] 设置 Pages base 与 `SITE_URL`，运行 `pnpm run build`、`pnpm run check:site` 和 `pnpm run test:pages`。
- [x] 运行 `git diff --check` 与 `git status --short`，确认无构建产物、fixture 或无关修改。

## 7. Full-Scope Review and Handoff

- [x] 加载 `trellis-check`，执行内容规范、数据流、复用、一致性和测试复核并修正问题。
- [x] 抽查桌面与移动端章节概览、五篇文章、Lab 入口、搜索和完整 Quiz 交互。
- [x] 报告文章/题目清单、来源矩阵、验证结果和需 Review Owner 独立复核的高风险知识点。
- [x] 初次交付不提交、不推送、不开 PR；保留当前分支改动供用户审阅。

## 8. Sync Main and Commit

- [x] 根据用户后续指示，从 `origin/main` 拉取最新提交。
- [x] 恢复本任务改动并检查文本冲突与跨层语义冲突。
- [x] 修正 Chapter 0 文件重排造成的“内存视角”断链。
- [x] 重新运行本地与 Pages 子路径全量门禁。
- [x] 按确认的提交计划提交任务内容，并完成 Trellis 归档与会话记录。

## Rollback Points

- 文章迁移：BST/散列表文件名、order、概览和 Lab 前置链接作为同一回滚单元。
- 新文章：三个新增文件可逐篇回退，但概览必须同步移除对应导航。
- 题库：整个 `lab-06-03-search-theory-quiz/` 目录独立回退。
- 验证：不提交临时抓取、审计或构建产物，无需清理用户现有数据。
