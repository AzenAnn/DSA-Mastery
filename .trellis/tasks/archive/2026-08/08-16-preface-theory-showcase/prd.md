# 前言理论语法展示页

## Goal

新增一个名为“前言”的课程章节，其中只包含一篇理论样式展示文档，让作者和读者在真实 VitePress 页面中查看定义、定理、性质、证明、正文、行内强调、代码框等现有理论环境，并能直接找到完整作者指南。

## Background

- 当前教材目录只接受 `content/chapter-NN-slug/PP-page.md`，`chapter` 与 `order` 必须是非负整数并匹配两位目录/文件编号。
- `chapter: 0` 已被“绪论”占用；课程索引按数值 chapter 聚合和排序，因此新增 `chapter-00-preface` 不会形成独立“前言”章节。
- 用户已确认“前言”必须是独立导航章节并排在 Ch.0 之前，因此需要为内容索引、校验器、章节标签和对应测试增加显式的 `preface` 章节合同。
- 理论语法与作者指南已经存在，展示页应复用 `docs/THEORY_DOC_STYLE_GUIDE.md`，不新增另一套样式 API。

## Requirements

- 只新增一篇展示文档，不扩写为教程系列。
- 页面覆盖正常正文层级，以及 `definition`、`theorem`、`lemma`、`corollary`、`property`、`proof`、`intuition`、`example`、`counterexample`、`complexity`、`pitfall` 的代表性展示。
- 同时展示原生 callout、`==mark==`、`dfn`、`kbd`、有限语义文字类、带文件名/行号/Shiki 标注的代码框和 code-group。
- 页面显式标注作者指南仓库地址，并提供可点击链接。
- 页面进入自动发现、侧栏和本地搜索；浅暗主题及移动端不产生根页面横向溢出。
- “前言”在首页课程结构、课程总目录和侧栏中位于 Ch.0 之前；页面标题区和面包屑不得显示“第 preface 章”或虚构数字。
- 完成内容校验、构建、静态产物检查和针对展示页的浏览器检查，最后启动本地预览供用户查看。

## Acceptance Criteria

- [x] AC1: “前言”章节按用户确认的导航方式出现，并且只包含一篇展示文档。
- [x] AC2: 展示页覆盖全部理论容器、正文/行内语义、原生 callout 与代码工作台代表语法，且没有未解析标记。
- [x] AC3: 页面包含 `docs/THEORY_DOC_STYLE_GUIDE.md` 的可见地址和可点击链接。
- [x] AC4: 页面被课程索引、侧栏和本地搜索发现，相关构建与浏览器门禁通过。
- [x] AC5: 本地预览服务启动成功，并向用户提供可直接打开的页面 URL。

## Out of Scope

- 修改现有理论组件视觉、增加新容器类型或复制整篇作者指南。
- 改写现有 Chapter 0 教材正文。
- 推送远端、发布 GitHub Pages 或创建 PR。

## Key Decision

- 使用作者可读的特殊章节标识 `chapter: "preface"` 与目录 `content/chapter-preface/`，不使用 `-1`、`99` 等伪数字，也不重编号现有章节。
- 课程导航为该章节使用显式标签“前言”；其唯一文档地址为 `/learn/chapter-preface/00-theory-environments/`。
- 作者指南采用可见仓库路径 `docs/THEORY_DOC_STYLE_GUIDE.md`，链接到 GitHub `main` 分支上的对应文件，避免把不参与 VitePress 构建的 `docs/` 当作站内课程路由。
