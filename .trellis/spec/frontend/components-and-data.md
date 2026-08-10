# Vue 组件与共享数据

## 1. Scope / Trigger

新增或修改主题组件、首页板块、导航、文档元信息、搜索入口或内容数据类型时适用。

## 2. Signatures

统一条目至少包含：

```ts
type ContentEntry = {
  kind: 'lesson' | 'lab'
  title: string
  description: string
  chapter: number
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

复用优先：

- 保留 VitePress 默认主题的顶栏、路由、local search、appearance、sidebar/mobile drawer、outline、prev/next、edit link、代码复制、语法高亮和 404，并用 `custom.css` 统一改色。
- 只有课程元信息、教材/Lab 混合目录、品牌首页或默认主题无法表达的交互才写自定义组件。
- 所有章节卡、Lab 卡、统计、sidebar、搜索和 prev/next 都从 ContentIndex 派生；不得在组件中手写七篇教材或四个 Lab。
- 浏览器 API 只在挂载后访问；SSR 阶段不能直接读取 `window`、`document`、`localStorage`。
- 普通内部导航使用 `withBase` 或 VitePress 生成链接。VitePress 1.6.4 的 Lab 跨页面 outline 兼容路径是例外：顶栏 Labs 与 Labs 目录卡片使用 `target="_self"` 触发同标签整页导航。
- 图标纯装饰时 `aria-hidden="true"`；导航、搜索、对话框、目录和按钮有中文可访问名称。

## 4. Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| 组件重复扫描 Markdown 或硬编码内容清单 | Review blocking |
| 同一条目在首页、搜索、侧栏 URL 不同 | 数据一致性测试失败 |
| SSR 期间访问浏览器对象 | build 失败 |
| 无 label 的图标按钮或键盘不可达 | 无障碍/Review blocking |
| 自定义实现替换了等价原生能力但无需求 | 要求简化或说明理由 |

## 5. Good / Base / Bad Cases

- Good：`ChapterGrid` 接收按章分组的数据，只负责渲染卡片。
- Base：没有 Lab 时显示明确空状态，不伪造统计。
- Bad：`Home.vue` 内维护 `const chapters = [...]`，搜索组件另维护 `const items = [...]`。

## 6. Tests Required

- 数据层测试断言所有消费者使用相同 URL、标题、kind 和顺序。
- 最终产物 Playwright 覆盖 draft 徽章、中文搜索、教材/Lab 跳转、默认 prev/next 与移动侧栏。
- 键盘覆盖搜索打开/关闭、焦点、主题切换、移动目录和可见焦点。
- 生产构建验证 SSR，无 hydration 或控制台错误。

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
