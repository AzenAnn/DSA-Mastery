# Implementation Plan

## 1. Preparation

- [x] 从最新 `main` 创建 `codex/ch01-array-to-linked-list-problem-solving`。
- [x] 用 Trellis 记录 base branch、working branch 和 content scope。
- [x] 再次确认工作区只包含本任务允许的改动。

## 2. Authoring

- [x] 新建 `content/chapter-01-linear-list/06-array-to-linked-list-problem-solving.md`。
- [x] 按 design.md 的结构完成迁移框架、反转、STL、题型工坊、反例和复盘卡。
- [x] 为每个本地 Lab 链接核对目标文件存在且题号正确。
- [x] 更新 `content/chapter-01-linear-list/00-overview.md`。
- [x] 更新 `.vitepress/content-index.ts` 的 Chapter 1 `lessonSources`。

## 3. Content Verification

- [x] 检查 frontmatter、唯一 H1、标题层级、理论容器闭合和代码 fence。
- [x] 检查所有相对 `.md` 链接、复杂度结论和指针更新顺序。
- [x] 编译文章中的独立 C++ 函数示例，或将不可独立编译片段明确标为上下文片段。
- [x] 运行 `pnpm run validate:content`。
- [x] 运行 `pnpm run test:discovery`。
- [x] 运行 `pnpm test`。

## 4. Preview Review Gate

- [x] 启动本地 VitePress 服务并访问新页面 route。
- [x] 检查桌面宽度与窄屏下的标题、表格、代码、公式、链接和横向溢出。
- [x] 检查浏览器控制台、页面错误与同源失败请求。
- [x] 向用户提供新页面文件与本地预览地址，等待人工检阅。

## 5. After User Approval

- [x] 用户授权提交 PR，未提出正文修订；已复核网站目录接入与既有验证结果。
- [x] 仅暂存本任务文件与必要 Trellis 记录，确认无无关改动。
- [ ] 使用 `docs(ch01): explain array-to-linked-list problem solving` 提交。
- [ ] 推送 `codex/ch01-array-to-linked-list-problem-solving`，不直接合并 `main`。

## Rollback Points

- 分支创建前：本地 `main` 保持在 `cb5f214`。
- 用户检阅前：所有正文改动均未提交，可逐文件审查。
- 推送前：通过 `git diff --check`、`git status --short` 和 staged diff 最终确认范围。
