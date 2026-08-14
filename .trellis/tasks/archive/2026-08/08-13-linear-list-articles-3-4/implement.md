# Implementation Plan：线性表第 3、4 篇

## 1. Enter Execution

- [x] 用户明确批准本轮最终规划摘要。
- [x] 运行 Phase 1.4 的 Trellis review gate，并执行 `task.py start`。
- [x] 加载 `trellis-before-dev`，再次确认 content、frontend 与 quality 规范及工作树边界。

## 2. Write the Articles

- [x] 重写 `03-linked-list.md`，按 3.1～3.4 完成概念、演进路线、代码讲解、例题、复杂度、误区与自测。
- [x] 新建 `04-comparison-and-selection.md`，按 4.1～4.2 完成性能矩阵、选型流程、场景例题、C++ 示例与边界说明。
- [x] 使用 `Azen`、`2026-08-13` 和 `draft` 完成两篇 frontmatter。
- [x] 更新章首页导览与 `content/README.md` 目录示例。

## 3. Integrate Navigation

- [x] 将 `.vitepress/content-index.ts` 的线性表 `lessonSources` 对齐实际 00～04 页面。
- [x] 在 `tests/pages-navigation.spec.mjs` 增加最小浏览器断言，覆盖新标题和代表性文章渲染。
- [x] 检查侧栏顺序、搜索条目、上一篇/下一篇和所有相对 `.md` 链接。

## 4. Verify Code Examples

- [x] 把代表性代码整理到受忽略的 `test-results/` 临时文件中，避免污染受跟踪内容。
- [x] 使用 `g++ -std=c++17 -Wall -Wextra -pedantic` 编译。
- [x] 运行断言，覆盖空表、头/中/尾插入删除、尺寸缓存和循环哨兵不变量。
- [x] 精确删除临时源码与二进制，不把验证程序或产物留在仓库。

## 5. Quality Gate

- [x] 运行 `pnpm run validate:content`，尽早发现元数据、编号和相对链接问题。
- [x] 运行 `pnpm run validate`。
- [x] 运行 `pnpm run test:discovery`。
- [x] 运行 `pnpm test`，覆盖最终本地 base 构建和静态产物审计。
- [x] 设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与 `SITE_URL=https://azenann.github.io/DSA-Mastery/`，重新运行 `pnpm run build`、`pnpm run check:site` 和 `pnpm run test:pages`。
- [x] 检查 `git status --short`，确认没有 fixture、生成物、截图或日志混入任务 diff。

## 6. Local Preview and User Handoff

- [x] 用最终构建启动 `pnpm run preview`，绑定 `127.0.0.1`；因 4173 已占用，使用 4174。
- [x] 在桌面和 390px 移动视口打开第 3、4 篇，检查目录、表格、代码、折叠答案、侧栏、prev/next 与控制台。
- [x] 保持预览进程运行，向用户提供首页及两篇文章的直接 URL。
- [x] 报告文件清单、真实验证结果、仍需人工复核的知识判断；不提交、不推送、不开 PR。

## Verification Evidence

- `pnpm run validate:content`：通过，发现 31 篇教材与 18 个 Lab。
- 两篇正文的代表性 C++17 示例均以 `-Wall -Wextra -pedantic` 编译并运行断言通过。
- `pnpm run validate`、`pnpm run test:discovery`、`pnpm test`：全部通过。
- Pages base 下的 `pnpm run build`、`pnpm run check:site`、`pnpm run test:pages`：全部通过，Playwright 11/11。
- 桌面与 390px 移动视口：两篇均无横向溢出；侧栏、搜索、前后篇、表格、代码块与折叠答案正常；浏览器控制台无错误。
- 本地预览：`http://127.0.0.1:4174/DSA-Mastery/`，保持运行供人工验收。

## Rollback Points

- 写作阶段：第 3、4 篇可独立回退，不影响构建机制。
- 导航阶段：仅回退线性表 `lessonSources` 与对应浏览器断言。
- 预览阶段：终止精确 PID；不删除仓库源码或其他服务。
