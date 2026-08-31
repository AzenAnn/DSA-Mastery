# Vue 组件与共享数据

## 1. Scope / Trigger

新增或修改主题组件、首页板块、导航、文档元信息、搜索入口或内容数据类型时适用。

## 2. Signatures

统一条目至少包含：

```ts
type ChapterId = number | 'preface'

type ContentEntry = {
  kind: 'lesson' | 'lab'
  title: string
  description: string
  chapter: ChapterId
  chapterLabel: string
  chapterTitle: string
  order: number
  updated: string
  contributors: string[]
  status: 'draft' | 'review' | 'published'
  url: string
  sourcePath: string
  readingMinutes: number
  difficulty?: string
  duration?: string
  labCategory?: 'theory' | 'exercise' | 'project'
  labId?: string
}
```

`url` 是不含 Pages base 的站内路由；`sourcePath` 是仓库相对 POSIX 路径。

## 3. Contracts

当前自定义边界：

- `Layout.vue` 扩展默认 layout 插槽，不实现第二套路由外壳；
- `BrandMark.vue` 只提供品牌标记；
- `HomePage.vue` 与 `LabsIndex.vue` 渲染两个自定义入口页；
- `DocumentHeader.vue` 与 `DocumentFooterNote.vue` 补充课程元信息和人工复核提示；
- `course.ts` 只消费 data loader 的可序列化索引。
- `quiz.data.ts` 在构建期校验并渲染所有 Lab 的 `quiz.json`；`QuizSet.vue` 是唯一选择题交互组件，兼容纯文本与 Markdown 富文本题面、选项和解析。
- `QuizSet` 的根 Grid 轨道使用 `minmax(0, 1fr)`，题卡作为 Grid item 设置 `min-width: 0`。题面允许代码块、公式和表格横向滚动，但不得用内容的 min-content 宽度撑开整页。

复用优先：

- 保留 VitePress 默认主题的顶栏、路由、local search、appearance、sidebar/mobile drawer、outline、prev/next、edit link、代码复制、语法高亮和 404，并用 `custom.css` 统一改色。
- 只有课程元信息、教材/Lab 混合目录、品牌首页或默认主题无法表达的交互才写自定义组件。
- 所有章节卡、Lab 卡、统计、sidebar、搜索和 prev/next 都从 ContentIndex 派生；不得在组件中手写七篇教材或四个 Lab。
- Lab 分类同样由 ContentIndex 从 `lab.json.type` 或 README-only 的显式 `labCategory` 派生。稳定 ID 从 README `labId` 读取，并在 Lab 目录、详情元信息和侧栏中一致展示；组件不得从旧目录名或标题重新计算。声明 `autoLabChapter` 的章节侧栏按分类字段分组，但不得硬编码任何章节题目数组；零 Lab 时仍由同一数据流生成三类空状态。
- `chapter` 是排序与映射用的内部标识；所有用户可见章节名称读取 `chapterLabel` 或 curriculum `label`。特殊 `preface` 的标签必须是“前言”，数字章标签保持“第 N 章”或 curriculum 的 `Ch.N`。
- 浏览器 API 只在挂载后访问；SSR 阶段不能直接读取 `window`、`document`、`localStorage`。
- 普通内部导航使用 `withBase` 或 VitePress 生成链接。VitePress 1.6.4 的 Lab 跨页面 outline 兼容路径是例外：顶栏 Labs 与 Labs 目录卡片使用 `target="_self"` 触发同标签整页导航。
- 图标纯装饰时 `aria-hidden="true"`；导航、搜索、对话框、目录和按钮有中文可访问名称。

## 4. Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| 组件重复扫描 Markdown 或硬编码内容清单 | Review blocking |
| 同一条目在首页、搜索、侧栏 URL 不同 | 数据一致性测试失败 |
| 组件用 `chapter` 拼接可见标签并渲染“第 preface 章” | 数据契约/Playwright 失败；改用 `chapterLabel` |
| SSR 期间访问浏览器对象 | build 失败 |
| 无 label 的图标按钮或键盘不可达 | 无障碍/Review blocking |
| 自定义实现替换了等价原生能力但无需求 | 要求简化或说明理由 |
| 新 Lab 复制/分叉 QuizSet 或在组件内硬编码题目 | Review blocking；复用 `quiz.json` loader |
| 富文本通过未经约束的运行时 HTML 注入 | 安全/架构检查失败；改为构建期、`html: false` 渲染 |

## 5. Good / Base / Bad Cases

- Good：`ChapterGrid` 接收按章分组的数据，只负责渲染卡片。
- Good：`DocumentHeader` 使用 `document.chapterLabel`，前言面包屑显示“前言”。
- Base：没有 Lab 时显示明确空状态，不伪造统计。
- Bad：`Home.vue` 内维护 `const chapters = [...]`，搜索组件另维护 `const items = [...]`。
- Good：新选择题 Lab 只新增 README 挂载点和 `quiz.json`，既有 QuizSet 自动加载。
- Bad：为“线性表选择题”复制一个 `LinearListQuiz.vue`，形成第二套提交和反馈逻辑。
- Good：宽文本树或表格在题卡内部滚动，390px 视口下 `documentElement.scrollWidth <= clientWidth`。
- Bad：Grid 轨道保留默认 `auto` 最小值，让某一道宽题面把所有题卡和页面整体撑宽。

## 6. Tests Required

- 数据层测试断言所有消费者使用相同 URL、标题、kind 和顺序。
- 前言回归断言总目录、侧栏、面包屑和 eyebrow 均使用显式标签，且排序早于 Ch.0。
- 最终产物 Playwright 覆盖 draft 徽章、中文搜索、教材/Lab 跳转、默认 prev/next 与移动侧栏。
- 键盘覆盖搜索打开/关闭、焦点、主题切换、移动目录和可见焦点。
- 生产构建验证 SSR，无 hydration 或控制台错误。
- Quiz 回归覆盖四选一、禁用未选择提交、正确/错误状态、题解、重试、进度导航和富文本无溢出；至少在 390px 视口断言 `documentElement.scrollWidth <= clientWidth`。原 Lab 00-03 继续通过，证明通用增强向后兼容。

## 7. Wrong vs Correct

### Wrong

```vue
<script setup>
const labs = [{ title: 'Lab 01-01', href: '/DSA-Mastery/labs/...' }]
</script>
```

### Correct

```vue
<script setup lang="ts">
defineProps<{ labs: ContentEntry[] }>()
// 模板中用 withBase(lab.url)；Labs 目录跨页面链接保留 target="_self"。
</script>
```

特殊章节标签：

```vue
<!-- Wrong -->
第 {{ document.chapter }} 章

<!-- Correct -->
{{ document.chapterLabel }}
```
