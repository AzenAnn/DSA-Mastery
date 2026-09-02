# Ch.1 文本结构图 Graphviz 化：技术设计

## Architecture and Boundaries

沿用现有单一数据流，不新增组件或配置：

```text
content/chapter-01-linear-list/*.md 中的 graphviz DOT
  -> vitepress-plugin-diagrams（构建期调用 Kroki）
  -> public/diagrams/ 中按内容哈希缓存的 SVG
  -> dist/pages/diagrams/ 发布资源
  -> 正文 figure / img / figcaption
```

Markdown 中的 DOT 仍是唯一事实来源；SVG 只作为插件缓存与发布资源。

## Diagram Design

| Diagram ID | 表达方式 | 关键关系 |
| --- | --- | --- |
| `list-interface-decoupling` | TB 分层有向图 | Client 只依赖 List ADT，ADT 分派到顺序表和双向链表 |
| `sequential-memory-layout` | plain HTML table + 映射边 | 逻辑元素与连续物理单元一一对应，地址相差 L 字节 |
| `resize-thrashing-cycle` | 状态迁移图 | cap=8 与 cap=16 在 push/pop 后反复切换，每次搬移 O(n) |
| `resize-hysteresis-range` | LR 区间表/状态带 | 0%、25%、50%、100% 边界与缩容、缓冲、正常、扩容区间 |
| `sequential-insert-before` | plain HTML table | 下标 0..3 与元素 10..40 的初始布局 |
| `sequential-insert-shift-trace` | TB 步骤图 | 空槽出现后，40、30、20 依次右移，最终写入 15 |
| `linked-list-logical-order` | record 节点 + 地址标签 | 分散物理地址通过 next 形成 10→20→30 |
| `dummy-head-cases` | 两个并列子图 | 空表 dummy→null；非空 dummy→10→20→null |
| `singly-linked-tail-predecessor` | LR 单链 + 注释节点 | tail 指向 30，但删除尾节点必须先定位 20 |
| `circular-sentinel-cases` | 空表/非空表子图 | sentinel 自环；非空时 next/prev 形成双向闭环 |
| `cache-locality-comparison` | 两行对比子图 | 顺序表连续单元 vs 链表分散地址与 pointer chasing |
| `list-selection-decision-tree` | TB 决策树 | 按随机访问、尾部增删、两端操作、稳定节点需求选型 |

## DOT Conventions

- 统一使用 `fontname="sans-serif"` 和清晰的 `rankdir`；避免依赖外部字体。
- 表格/内存布局使用 `shape=plain` 与 HTML-like label；链表节点优先使用 `shape=record` 或普通 box。
- 循环与双向关系使用显式箭头方向/端点标签；辅助说明使用无边框 note 节点或 edge label。
- 布局通过 `rank=same`、适度 `nodesep/ranksep` 与少量 invisible edge 约束，不用超长固定宽度。
- 色彩只用于层次与强调，同时保留文字、形状和箭头语义；避免主题相关的透明背景假设。

## Compatibility

- 只使用标准 DOT 与 Graphviz HTML label，兼容当前 Kroki/Graphviz 渲染链路。
- fenced info string 保持纯 `graphviz`，避免插件把它当作普通代码块。
- `diagram id` 新增后保持稳定；以后修改 DOT 时由内容哈希生成新的缓存文件。
- 本地 `/` 与 Pages `/DSA-Mastery/` 继续由现有 `publicPath` 配置处理，正文不硬编码 base。

## Risks and Mitigations

- **中文/HTML label 语法错误**：先用 Graphviz/Kroki 构建逐图验证，避免一次性把错误带到最终构建。
- **宽图在移动端难读**：优先竖向分层、分行表格和子图，不把所有信息塞进单行。
- **执行轨迹转图后信息丢失**：逐项对照原 `text` 内容，保留每一步状态和复杂度标签。
- **Kroki 网络不稳定**：构建生成并提交 `public/diagrams/` 缓存；失败时保留 Markdown 修改，可重试生成，不修改插件降级路径。

## Rollback

回退本任务涉及的 4 篇 Markdown 与新生成的 12 个 SVG 缓存即可恢复原状；不涉及配置、依赖、路由或数据迁移。
