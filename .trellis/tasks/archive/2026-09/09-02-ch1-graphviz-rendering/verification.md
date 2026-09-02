# Ch.1 Graphviz 迁移验证记录

## Static and Source Checks

- 12 个新增 `diagram id` 在全仓各出现一次，且全仓 diagram ID 无重复。
- Ch.1 目标 4 篇文档共 14 个 Graphviz 块（含原有 2 个）全部通过本机 Graphviz `dot -Tsvg` 语法验证。
- `git diff --check` 通过；产品源码差异限定为 4 篇目标教材 Markdown、12 个新 SVG 缓存和一条 Graphviz Trellis 规范补充。

## Project Gates

- `pnpm install --frozen-lockfile`：通过，锁文件无变化。
- `pnpm test`：通过；内容校验为 73 篇教材、203 个 Lab、198 个新式 manifest、516 道交互选择题，Lab 工具测试 38 通过、1 项 Windows 符号链接能力测试按预期跳过，最终本地 base 构建和站点产物检查通过。
- `GITHUB_PAGES_BASE_PATH=/DSA-Mastery pnpm run build`：通过。
- `GITHUB_PAGES_BASE_PATH=/DSA-Mastery pnpm run check:site`：通过，332 个 HTML，base 为 `/DSA-Mastery/`。
- `GITHUB_PAGES_BASE_PATH=/DSA-Mastery pnpm run test:pages`：22/22 通过。未设置该变量的第一次启动与 Pages 产物 base 不匹配，停止后按正确环境重新运行并全绿。

## Browser Checks

- 1440px 与 390px 分别检查 `01-abstract-data-type`、`02-sequential-list`、`03-linked-list`、`04-comparison-and-selection`。
- 四页目标图数量分别为 1、3、6、2；另有 `01-abstract-data-type` 原有 2 张 Graphviz 图。
- 两个视口下所有 SVG 均完成加载，页面 `scrollWidth == clientWidth`，无根页面横向溢出。
- 暗色首检发现透明 Graphviz 画布会使固定深色标签失去对比度；12 张图改用白色画布后复测通过。
- 本地预览持续运行于 `http://127.0.0.1:5174/`，已在 Codex 内置浏览器保留 `01-abstract-data-type/#_1-2-2-面向接口解耦` 页面。
