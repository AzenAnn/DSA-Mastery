# Ch.1 文本结构图 Graphviz 化

## Goal

把用户截图中 Chapter 1 以 `text` fenced code 绘制的 12 个教学图改为构建期生成的 Graphviz SVG，使结构关系更清楚、正文不再显示为可复制代码，同时保持原有知识语义与站点发布合同。

## Background

- 开发者身份为 Azen，本任务位于从最新 `origin/main` 创建的 `codex/ch1-graphviz-rendering` 分支。
- 仓库已在 `.vitepress/config.ts` 集成 `vitepress-plugin-diagrams`，`docs/GRAPHVIZ_AUTHORING_GUIDE.md` 规定作者使用纯 `graphviz` fence、稳定 ASCII diagram ID 和中文 caption。
- 用户提供的 11 张截图对应 4 篇 Ch.1 教材中的 12 个 `text` 块；第 5 张截图包含“插入前布局”和“逐步右移”两个块。
- 作者指南通常建议内存布局和执行轨迹继续使用文本块；本任务以用户明确圈定的截图为例外，将这些已经承担“图”职责的块也转为 Graphviz，并用 `shape=plain`/HTML table 保留布局信息。

## Requirements

### R1. 精确迁移截图中的 12 个图

只迁移以下块：

1. `content/chapter-01-linear-list/01-abstract-data-type.md:187`：面向接口解耦层次图。
2. `content/chapter-01-linear-list/02-sequential-list.md:46`：逻辑序列到连续物理内存的映射。
3. `content/chapter-01-linear-list/02-sequential-list.md:289`：对称扩缩容导致的边界振荡轨迹。
4. `content/chapter-01-linear-list/02-sequential-list.md:304`：25% 滞后阻尼区间。
5. `content/chapter-01-linear-list/03-linked-list.md:38`：顺序表插入前的下标与元素布局。
6. `content/chapter-01-linear-list/03-linked-list.md:45`：插入 15 时元素逐步右移的轨迹。
7. `content/chapter-01-linear-list/03-linked-list.md:72`：离散地址节点通过 `next` 建立逻辑顺序。
8. `content/chapter-01-linear-list/03-linked-list.md:200`：dummy head 的空表与非空表。
9. `content/chapter-01-linear-list/03-linked-list.md:330`：带 tail 的单链表仍需定位尾节点前驱。
10. `content/chapter-01-linear-list/03-linked-list.md:363`：双向循环哨兵链表的空表与非空表。
11. `content/chapter-01-linear-list/04-comparison-and-selection.md:121`：顺序表连续读取与链表 pointer chasing 对比。
12. `content/chapter-01-linear-list/04-comparison-and-selection.md:179`：线性表业务选型决策树。

### R2. 保持教学语义

- 保留原图中的元素值、下标、地址、容量/长度状态、操作顺序、关键复杂度和“必须找到前驱”等结论。
- 节点与边表达方向、前驱/后继、循环、分支和状态迁移；表格式信息可用 Graphviz HTML table 表达。
- 不重写图前后的知识正文，不改变章节结构、frontmatter、链接或路由。

### R3. 遵守 Graphviz 作者合同

- 每个 fenced block 的 info string 只能是 `graphviz`。
- 每个图紧随唯一、稳定、语义化的 ASCII `diagram id` 和一句中文 caption。
- DOT 节点 ID 使用 ASCII；中文只出现在 `label` 中。
- 图在桌面和窄屏下不造成根页面横向溢出，浅色和暗色主题下均可读；颜色不是唯一语义。

### R4. 控制范围

- 不修改 Graphviz 插件、VitePress 配置、依赖或全站样式。
- 不迁移截图之外的 Ch.1 `text` 块，例如 `03-linked-list.md` 的演进小结和 `06-array-to-linked-list-problem-solving.md` 的流程/公式块。
- 构建生成的 `public/diagrams/` SVG 作为现有插件的受版本控制缓存一并纳入本任务；不提交 `dist/pages`。

## Acceptance Criteria

- [x] AC1：上述 12 个目标位置均由 `text` fence 改为 `graphviz` fence，且每个图都有唯一 ASCII ID 与中文 caption。
- [x] AC2：12 个图完整保留原始结构关系和关键标签，没有改变相邻知识结论。
- [x] AC3：截图之外的 Ch.1 `text` 块、站点配置、依赖和路由保持不变。
- [x] AC4：`pnpm run validate`、`pnpm run build`、`pnpm run check:site` 全部通过，12 个 SVG 缓存成功生成并进入最终站点产物。
- [x] AC5：以 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 构建并运行 `pnpm run check:site` 通过，图资源 URL 不出现缺失或重复 base。
- [x] AC6：人工检查 4 篇目标教材页，确认 12 个图均显示为带 caption 的 SVG，并在 390px/1440px、浅色/暗色下无根页面横向溢出且文字可辨。

## Out of Scope

- 重写 Chapter 1 正文、复杂度结论或章节导航。
- 把所有 Chapter 1 `text` fence 机械迁移为 Graphviz。
- 新增交互式动画、浏览器端 Graphviz/WASM 或第二份图源。
- 修改 Graphviz 作者指南或插件渲染实现。
