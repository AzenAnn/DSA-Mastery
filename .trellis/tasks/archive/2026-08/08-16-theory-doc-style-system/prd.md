# DSA Mastery 理论文档语法与视觉系统

## Goal

为中文数据结构与算法教材提供一套作者可直接复用、读者能够快速辨认知识层级的理论文档语法与视觉系统，使定义、定理、性质、证明、复杂度、示例、反例和易错点在 VitePress 页面中保持统一，并延续现有“纸张/墨色 × 靛蓝/橙色 × 深色代码工作台”品牌。

## Background

- 当前站点固定使用 VitePress `1.6.4`、Vue `3.5`、Markdown-it `14.3`、Shiki `2.5` 与 MathJax。
- `.vitepress/config.ts` 是唯一 Markdown/VitePress 配置边界，`.vitepress/theme/custom.css` 是现有品牌令牌与视觉入口。
- VitePress 已提供搜索、侧栏、outline、代码复制、Shiki 行标注、代码组、主题切换和 Pages base；本任务只能扩展或样式化这些能力。
- 当前教材用 `::: info 定义：...` 表达定义，缺少定义、定理、性质、证明等稳定语义；普通代码块中的 `[filename]` 会被 VitePress 1.6.4 的 wrapper 丢弃，仅代码组标签会显示文件名。
- UI/UX 检索确认教育文档应优先保证内容可读、浅暗双主题、高对比、键盘焦点、移动端无页面级横向滚动和 reduced-motion。其远程字体与粉色建议不适合现有品牌，不纳入实现。

## Requirements

### R1 — 理论语义容器

- 支持 `definition`、`theorem`、`lemma`、`corollary`、`property`、`proof`、`intuition`、`example`、`counterexample`、`complexity`、`pitfall`。
- 每种容器支持显式标题；无标题时使用中文默认标题。
- 标题必须转义，正文可嵌套 Markdown 列表、表格、MathJax、链接、行内代码和代码块。
- 输出使用稳定、可测试的 `dsa-theory-block` 与类型修饰类；内容继续进入本地搜索。
- 不实现跨页面自动编号；编号由作者显式填写。

### R2 — 原生 callout 兼容

- 保留并美化 VitePress 的 `info`、`note`、`tip`、`important`、`warning`、`danger`、`caution` 与 `details`。
- 不能破坏现有教材与 Lab 中的原生容器语法。

### R3 — 内联语义

- `==文字==` 渲染为语义 `<mark>`，且不误解析行内代码、代码块或数学公式中的等号。
- 提供受限的 `dsa-text-accent`、`dsa-text-signal`、`dsa-text-success`、`dsa-text-muted` 类，以及 `mark`、`kbd`、`dfn` 样式。
- 禁止作者使用任意颜色参数；所有颜色来自主题语义令牌。

### R4 — 代码工作台

- 保留 VitePress/Shiki 原生高亮、复制、行号、行高亮、focus、diff、warning、error、代码组和 `input`/`output` 行为。
- 让普通 fenced code 的 `[filename]` 在标题栏中可见，代码组继续用原生 tabs 展示文件名。
- 语言、文件名、复制状态形成紧凑工具栏；代码组 tabs 有 hover、checked 与 focus-visible 状态。
- diff、warning、error 同时具有符号/文字或边缘标记，不能只靠颜色。
- 长文件名、长代码和移动端只在代码表面内部滚动，不造成页面级横向溢出。

### R5 — 设计系统与可访问性

- 在现有 `--course-*` 基础上增加语义令牌与组件令牌；新增组件样式不得散落 raw hex。
- 浅色与暗色同时定义；正文对比度至少 4.5:1，组件边界与焦点至少 3:1。
- 重要状态同时使用文字、类型标签、边框形态或符号。
- 维持 4/8px 节奏、150–300ms 过渡与 `prefers-reduced-motion`。
- 在 375/390、768、1024、1440px 下无页面级横向溢出。

### R6 — 作者指南与真实消费者

- 新增 `docs/THEORY_DOC_STYLE_GUIDE.md`，覆盖设计原则、容器决策表、全部语法、正确/错误用法、代码标注、浅暗注意事项和旧 `::: info 定义` 迁移方式。
- 在 `content/chapter-00-introduction/01-data-structure-basics.md` 与 `content/chapter-00-introduction/03-algorithm-complexity-analysis.md` 中小范围迁移真实内容。
- 只改变表达语法，不改变知识结论，不做全仓机械改写。

### R7 — 测试与交付

- 自动测试覆盖所有自定义容器类、默认/自定义标题、标题转义、嵌套 Markdown、搜索内容、mark 边界、文件名、原生代码注解及未解析 `:::` 泄漏。
- Pages Playwright 覆盖浅暗主题、375/390 与 1440px、键盘焦点、代码复制、代码组、根页面无横向溢出和控制台/网络错误。
- 执行 `pnpm run validate`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site`、`pnpm test` 与 Pages-base `pnpm run test:pages`。
- 同步 `.trellis/spec/` 的作者语法与测试合同。

## Acceptance Criteria

- [x] AC1: 十一种理论容器均能用 `:::` 语法生成稳定类型类、中文默认标题与安全的自定义标题。（R1）
- [x] AC2: 容器内的公式、列表、表格、链接和 fenced code 正常渲染，本地搜索包含容器正文，产物没有未解析标记。（R1、R2）
- [x] AC3: `==...==` 生成 `<mark>`，而行内代码、代码块与数学表达式中的 `==` 保持原样。（R3）
- [x] AC4: 普通代码块显示 `[filename]`，代码组 tabs、行号、高亮、focus、diff、warning、error、input/output 与复制仍工作。（R4）
- [x] AC5: 理论块、内联语义和代码表面全部使用令牌，在浅暗主题与 390/1440px 下可读、可聚焦且根页面无横向溢出。（R5）
- [x] AC6: 两篇真实教材完成小范围迁移，知识正文无实质改写；作者指南提供完整可复制语法和迁移说明。（R6）
- [x] AC7: 解析、构建、产物、Pages 与浏览器门禁全部通过，fixture、服务、截图和缓存均已清理。（R7）
- [x] AC8: Trellis 前端/内容/质量规范记录新增语法合同与必需测试，任务 diff 不含无关重构或生成物。（R7）

## Out of Scope

- 自动编号、交叉引用数据库、PDF/LaTeX 双源码、CMS、全仓内容迁移。
- 重写 VitePress 默认 layout、搜索、侧栏、代码复制、Shiki 或代码组运行时。
- 升级 VitePress、Markdown-it、Shiki、Vue、pnpm，或引入 Tailwind/重量级 UI 框架。
- 远程字体、品牌换色、滚动触发动画、霓虹/大面积渐变装饰。

## Review Note

知识结论保持不变，但两篇教材的表达语法发生变化；合并前仍需另一名维护者核对正文未被误改。
