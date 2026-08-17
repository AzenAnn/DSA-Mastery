# 教材 Frontmatter 与路由契约

## 1. Scope / Trigger

新增、改名或移动 `content/chapter-*/*.md`，修改元数据、排序、正文内部链接或内容发现逻辑时适用。

## 2. Signatures

`.vitepress/content-index.ts` 的教材输入和路由映射必须等价于：

```text
content/chapter-NN-slug/PP-page.md
  -> /learn/chapter-NN-slug/PP-page/
content/chapter-preface/00-theory-environments.md
  -> /learn/chapter-preface/00-theory-environments/
content/chapter-preface/01-lab-authoring-guide.md
  -> /learn/chapter-preface/01-lab-authoring-guide/
```

VitePress rewrite：

```text
content/:chapter/:page.md -> learn/:chapter/:page/index.md
```

排序键固定为 `chapterRank`、数字 `order`、`title`；`chapterRank("preface") = -1`，数字章保持自身数值。最后一项只作确定性平局处理，不能掩盖重复 order。

## 3. Contracts

路径：

- 章节目录：`chapter-NN-kebab-case`。
- 页面文件：`PP-kebab-case.md`；`00-overview.md` 是章首页。
- `NN` 必须等于 frontmatter `chapter` 的两位表示；`PP` 必须等于 `order` 的两位表示。
- 唯一特殊章节目录固定为 `content/chapter-preface/`；其中按 `NN-kebab-case.md` 收录作者可在站内完整阅读的指南，不允许用 `-1`、`99` 或重排数字章节模拟前言。
- 文件和目录只用小写英文字母、数字和连字符。

每页必填：

| 字段 | 类型与约束 |
| --- | --- |
| `title` | 非空字符串；与唯一一级标题语义一致 |
| `description` | 非空摘要，建议不超过 80 个汉字 |
| `order` | 非负整数；同一章教材页面内唯一 |
| `chapter` | 通常为与目录编号一致的非负整数；前言目录中的指南为字面量 `"preface"` |
| `chapterTitle` | 非空；同章完全一致，不含章节编号 |
| `updated` | 实质性修改日期，`YYYY-MM-DD` |
| `contributors` | 非空字符串数组；记录实际写作或审阅者 |
| `status` | `draft`、`review`、`published` 之一 |

状态含义：

- `draft`：仍可能缺模块，但不能伪装成完整内容。
- `review`：Owner 已自检，等待 Review Owner 独立核验。
- `published`：自动门禁通过且 Review Owner 批准。

链接：

- 教材与 Lab 源文件之间允许并优先使用 `./page.md` 或 `../../labs/.../README.md`；这样 GitHub 与编辑器中也可导航。
- `scripts/validate-content.mjs` 检查相对 `.md` 目标存在；`.vitepress/config.ts` 在构建时把已知源路径改写为课程 route，并保留 `#anchor`。
- 也可使用不带 Pages base 的站点 route；不在正文中写 `/DSA-Mastery/`，VitePress `base` 负责部署前缀。
- 外部链接使用完整 `https://` 地址；锚点必须指向实际标题。
- 链接校验先排除带 URL scheme 或根路径的目标，再检查相对 `.md` 文件；因此 `https://host/guide.md` 不能被当作仓库相对文件。
- `content/README.md`、仓库 README、`docs/**`、`.trellis/**` 不得成为课程页面。

前言 frontmatter 固定为 `chapter: "preface"`、与两位文件前缀一致的 `order`、`chapterTitle: "课程作者指南"`。完整 Lab 手册由 `content/chapter-preface/01-lab-authoring-guide.md` 使用 VitePress include 复用 `docs/LAB_AUTHORING_GUIDE.md`，不得复制第二份正文。数据层向界面同时输出内部 `chapter` 和展示用 `chapterLabel: "前言"`，正文、面包屑与侧栏禁止拼出“第 preface 章”。

## 4. Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| frontmatter 缺失或字段为空 | 内容校验失败 |
| status 不在允许集合 | 内容校验失败 |
| 日期格式错误 | 内容校验失败 |
| 路径编号与 chapter/order 不一致 | 内容校验失败 |
| `chapter: "preface"` 出现在固定目录之外，或前言字段漂移 | 内容校验失败 |
| 前言缺少理论展示或 Lab 完整指南、排在 Ch.0 之后或泄露内部 id | artifact/Playwright 失败 |
| 同章重复 order 或 chapterTitle 漂移 | 内容校验失败 |
| 相对 `.md` 目标不存在、产物站内路由不存在 | validator 或 artifact check 失败 |
| 手写 Pages base 或出现双 `/DSA-Mastery/` | 静态产物审计失败 |
| 内容收集器漏掉合规临时页面 | 自动发现测试失败 |

## 5. Good / Base / Bad Cases

- Good：`content/chapter-02-stack-queue/01-stack.md` 使用 `chapter: 2`、`order: 1`，并相对链接 `../../labs/chapter-02/lab-02-01-stack/README.md`。
- Good：`content/chapter-preface/00-theory-environments.md` 与 `01-lab-authoring-guide.md` 使用 `chapter: "preface"`，在“前言”章节目录中分别显示。
- Base：`draft` 页面仍进入导航并显示状态徽章。
- Bad：普通页面使用 `chapter: "preface"`、使用 `chapter: -1` 模拟前言、`contributors: "A"`、不存在的相对 `.md` 目标或硬编码 `/DSA-Mastery/learn/...`。

## 6. Tests Required

- `pnpm run validate:content`：字段、路径、排序和相对 `.md` 目标。
- 内容发现 fixture：在 `try/finally` 中创建一篇合规临时教材，确认校验、侧栏、数据加载、搜索和 build 都发现它，最后删除。
- 静态产物审计：期望 URL 存在，链接只含一次 base。
- 静态产物审计还要断言前言包含理论展示与完整 Lab 指南、11 种理论块均已渲染、include 已展开、前言位于 Ch.0 之前且不泄露 `preface` 内部标识。
- Playwright：从首页实际点击进入教材页，并检查同源请求、控制台和页面错误；前言用桌面与 390px 视口覆盖章节顺序、搜索、面包屑、侧栏、代码交互和横向溢出。

## 7. Wrong vs Correct

### Wrong

```md
[在线页](/DSA-Mastery/learn/chapter-01-linear-list/03-linked-list/)
```

### Correct

```md
[链表](./03-linked-list.md)
[跨章页面](../chapter-00-introduction/02-complexity-basics.md)
```

不要手改 VitePress 侧栏来“修复”缺页；应修正内容契约或统一收集器。

前言标签也不能从内部 id 拼接：

```ts
// Wrong: `第 preface 章`
const label = `第 ${document.chapter} 章`

// Correct: `前言`
const label = document.chapterLabel
```
