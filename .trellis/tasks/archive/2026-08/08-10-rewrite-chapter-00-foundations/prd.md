# 重写第 0 章基础概念与算法分析

## Goal

把第 0 章整理为一个简短章首页和两篇面向 DSA 初学者的完整文章，使学生先建立数据结构的共同语言，再掌握算法复杂度的基本分析方法，并能顺畅进入已有 Lab 与后续线性表章节。

## Background

- 当前章首页为 `00-overview.md`，两篇正文分别是“主动输出式学习”和“复杂度入门”。
- 章首页必须继续使用 `00-overview.md`；正文路径由文件名和 frontmatter 的 `order` 共同决定。
- 项目使用 VitePress 1.6.4，已有原生 callout、Shiki 语法高亮、代码复制、MathJax、表格、outline、浅暗主题与响应式样式。
- 用户已审核并批准完整内容框架，要求严格按框架顺序实施并完成本地效果测试。

## Requirements

1. 保留 `00-overview.md` 作为简洁入口页，说明章节定位、学习目标、两篇文章的分工、推荐顺序、正文链接、现有 Lab 和学习建议。
2. 将 `01-active-output.md` 改名为 `01-data-structure-basics.md`，重写为“0.1 数据结构基础概念”。
3. 将 `02-complexity-basics.md` 改名为 `02-algorithm-complexity-analysis.md`，重写为“0.2 算法复杂度与算法分析”。
4. 两篇正文的标题顺序和内容模块严格遵循用户批准的提示词，不增加第三篇教学文章，不把主动输出扩写为独立主题。
5. frontmatter 保持 `chapter: 0`、`chapterTitle: "绪论"`、正确 `order`、实际日期、`contributors: ["Azen"]` 和 `status: "draft"`。
6. 使用 VitePress 原生 `info`、`tip`、`warning`、`details`、Shiki 行高亮/行号、代码组和 MathJax；不新增 Vue 组件、CSS、依赖或视觉令牌。
7. C++ 示例语法正确、解释完整；复杂度推导必须说明输入规模、基本操作、次数、输入情况和辅助空间口径。
8. 更新所有受文件名、标题和 route 影响的 README、迁移文档和 Playwright 测试，不留下旧路径断链。
9. 不修改第 1 章、Labs、内容索引、主题、导航或无关代码；不提交、不推送、不创建 PR。
10. 修复第 0 章暴露出的代码块对比度回归：代码框继续使用现有深色表面和 Shiki 语法高亮，但浅色与暗色站点主题下的普通 token、标点、注释、行号和高亮行都必须清晰可辨。允许仅为此问题修改 `.vitepress/config.ts` 的 Shiki 主题、`.vitepress/theme/custom.css` 的代码令牌映射和对应回归测试。

## Acceptance Criteria

- [ ] 章首页只承担导览作用，并能通过相对链接进入两篇正文和现有第 0 章 Labs。
- [ ] 0.1 按批准的 11 个模块完整覆盖基本术语、三层模型、逻辑结构、存储结构、操作、ADT、综合例题、误区和自测。
- [ ] 0.2 按批准的 12 个模块完整覆盖分析模板、五类典型时间复杂度、O/Ω/Θ、增长顺序、控制结构、三种输入情况、空间复杂度、完整例题、误区和自测。
- [ ] Callout、代码块、公式、表格和折叠答案语义合理，在浅色/暗色与 375/768/1024/1440px 下可读且无页面级横向溢出。
- [ ] 旧文件名、旧标题和旧 route 的有效引用已更新，仓库中不存在遗留断链。
- [ ] `pnpm run validate:content`、`pnpm run test:discovery`、`pnpm test` 通过。
- [ ] Pages base 下的 `pnpm run build`、`pnpm run check:site`、`pnpm run test:pages` 通过。
- [ ] 浏览器人工检查覆盖三页、浅暗主题、四档宽度、侧栏、outline、复制、折叠答案、公式、表格、控制台和链接。
- [ ] 代码块在浅色与暗色站点主题下均使用适配深色代码表面的高对比 Shiki token；代表性普通 token 对背景达到 WCAG AA，复制按钮和代码横向滚动保持可用。
- [ ] 代码字号不小于 13px，代码块不出现由行高舍入造成的伪竖向滚动条；长行仍只在代码框内部横向滚动。

## Out of Scope

- 第 1 章及后续章节正文。
- 已有 Lab 的修改或新的复杂度选择题 Lab。
- VitePress 内容索引、导航、依赖、字体、整体色板或整体视觉重构；代码块对比度的局部主题修复除外。
- 提交、推送、PR 或部署。

## Risks and Review Needs

- O、Ω、Θ 的形式定义、平均情况假设、辅助空间口径和示例次数推导需要 Review Owner 独立核验。
- 路由改名会影响 Pages 测试和文档示例，必须通过全仓搜索与 Pages-base 浏览器测试证明已闭环。
