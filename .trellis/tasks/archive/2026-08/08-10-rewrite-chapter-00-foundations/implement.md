# Implementation Plan

1. 读取三个现有第 0 章页面、相关 README/迁移文档和 route 测试。
2. 重写 `00-overview.md` 为简洁导览页。
3. 通过改名与全文替换完成 0.1、0.2，逐项核对批准框架中的 11/12 个模块。
4. 全仓搜索旧文件名、标题和 route，更新必要的说明和 Playwright 断言。
5. 运行内容校验与 discovery，修复 frontmatter、相对链接或路由问题。
6. 运行 `pnpm test`，再以 `/DSA-Mastery` base 构建、检查静态产物并执行 Pages Playwright。
7. 启动本地站点，在 375/768/1024/1440px 及浅暗模式检查三页、侧栏、outline、callout、代码复制、折叠答案、公式、表格、溢出和控制台。
8. 清理生成缓存与临时服务，完成要求逐项审计；不提交或推送。
9. 修复浅色主题下深色代码框错误使用 `--shiki-light` 的冲突，并为普通 token 增加浏览器回归断言。
10. 在浅色/暗色及 375/768/1024/1440px 下复查代码 token、行号、高亮行、复制按钮、内部横向滚动和页面溢出。

## Risky Files and Rollback Points

- `content/chapter-00-introduction/*.md`：知识与链接主改动。
- `tests/pages-navigation.spec.mjs`：route/标题断言必须与内容同步。
- `content/README.md`、`README.md`、`docs/VITEPRESS_MIGRATION.md`：仅更新旧路径和章节描述。
- 不修改 `.vitepress/**`、`labs/**` 或锁文件。
- `.vitepress/config.ts`、`.vitepress/theme/custom.css`：只允许 Shiki 高对比主题和代码块对比度的局部规则；不改全站主题令牌、布局或组件。

## Validation Commands

- `pnpm run validate:content`
- `pnpm run test:discovery`
- `pnpm test`
- Pages base: `pnpm run build`
- Pages base: `pnpm run check:site`
- Pages base: `pnpm run test:pages`

## Review Gates

- 复杂度数学定义与推导需要独立人工复核。
- 浏览器检查必须覆盖浅色/暗色、四档宽度和交互；没有证据时不得声明完成。
