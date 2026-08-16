# Technical Design

## Content contract

新增 `ChapterId = number | "preface"`。普通教材继续使用 `chapter-NN-slug` 与非负整数 chapter；特殊前言只允许：

```text
content/chapter-preface/00-theory-environments.md
frontmatter chapter: "preface"
frontmatter order: 0
```

校验器显式识别这一条合同，其他非数字 chapter 或特殊目录一律失败。这样不会用 `-1`/`99` 污染作者语义，也不需要重编号现有内容。

## Index and navigation

- 内容收集器把 `chapter-preface` 纳入教材扫描，使用排序权重 `preface -> -1`，其余数字保持原序。
- `CourseDocument` 增加稳定的 `chapterLabel`：前言显示“前言”，普通内容显示“第 N 章”。
- `CurriculumChapter` 增加数据化的 `label`；普通值仍是 `Ch.N`，前言为“前言”。首页卡片、课程总目录和侧栏只消费该 label，不自行拼接前缀。
- 在 `curriculumChapterDefinitions` 首位增加前言定义，直接链接唯一展示文档，不创建空壳 outline 页面。
- `getChapterLanding()` 只为 `chapter === "preface"` 返回显式前言 URL；数字章继续沿用既有物理 chapter fallback，避免同一文章被课程编排复用时改变旧面包屑行为。

## Showcase page

页面只用于展示，不复制作者指南全文。结构覆盖：

1. 正文层级、段落、列表、表格、链接、行内代码与公式；
2. 11 种理论容器；
3. 原生 tip/warning/details；
4. mark、dfn、kbd 与 4 个有限语义文字类；
5. 带文件名、行号、highlight/focus/diff/warning/error 的代码框及 code-group；
6. 可见的 `docs/THEORY_DOC_STYLE_GUIDE.md` 地址与 GitHub 链接。

## Compatibility and validation

- VitePress rewrite `content/:chapter/:page.md` 已支持 `chapter-preface`，无需新增 route 规则。
- 更新内容验证、静态产物发现和 Pages Playwright，防止特殊 chapter 被某一层遗漏。
- 现有数字 chapter 类型、Lab 数字规则、Pages base、搜索和理论渲染器保持不变。
- 失败回滚点是 `ChapterId`/label 扩展、单一内容目录和测试；不触碰理论组件 CSS。
