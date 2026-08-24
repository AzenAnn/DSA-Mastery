# Graphviz 图示作者指南

教材中的树和图使用 `vitepress-plugin-diagrams` 在构建期调用 Kroki，把 `graphviz` 代码块转换为 SVG。Markdown 仍是唯一事实来源，`public/diagrams/` 里的 SVG 只是插件缓存和发布资源。

## 最小写法

````md
```graphviz
digraph BinaryTree {
  rankdir=TB;
  node [shape=circle];
  A [label="根"];
  A -> B [label="左"];
  A -> C [label="右"];
}
```
<!-- diagram id="binary-tree-example" caption: "一棵带左右语义的二叉树" -->
````

`digraph` 表示有向图，边使用 `->`；`graph` 表示无向图，边使用 `--`。节点 ID 使用稳定的 ASCII 名称，展示文字通过 `label` 编写。带权边可写成 `[label="7"]`。

常用布局属性：

- `rankdir=TB`：从上到下，适合树；`rankdir=LR`：从左到右，适合流程和路径。
- `node [shape=circle]`：统一节点形状；也可按节点单独指定 `shape`、`label`。
- `subgraph cluster_name`：把多个节点放入带标题的区域，用于并排比较两种结构。
- `style=dashed`、`color` 和 `penwidth` 可突出边界或重点，但不要让颜色成为唯一语义。

## Caption 与 ID

每个正式教材图都应使用唯一的 `diagram id` 和一句中文 caption。插件当前按完整的 fenced info string 匹配类型，因此代码块只写 `graphviz`，不要追加 `[filename]`；ID 只使用 ASCII、短且能表达页面语义。修改 DOT 内容时保留 ID，插件会按内容哈希更新缓存。Caption 说明读者要观察的关系，不写 Kroki 或缓存实现细节。

## 本地预览与构建

可以先在在线编辑器检查 DOT 语法：

- [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/)
- [Kroki Inspector](https://kroki.io/)

本地开发需要网络访问默认的 `https://kroki.io`。如果网络受限，可运行自托管 Kroki，并设置 `KROKI_SERVER_URL`：

```bash
KROKI_SERVER_URL=http://localhost:8000 pnpm run dev
KROKI_SERVER_URL=http://localhost:8000 pnpm run build
```

提交前运行：

```bash
pnpm install --frozen-lockfile
pnpm run validate
pnpm run build
pnpm run check:site
```

构建期插件会复用 `public/diagrams/` 中已有 SVG；缺失或无法生成时构建失败并显示错误。检查页面时确认 SVG 可见、caption 存在，并在 390px 窄屏和浅/暗主题下没有横向溢出。

正文链接不要写 `/DSA-Mastery/`。站点部署前缀由 VitePress 配置的 `base` 统一处理，图资源的 `publicPath` 也会在构建时跟随该前缀发布。

## 何时继续使用文本块

框线表、内存布局、序列化字符串、递归调用日志和包含大量步骤文字的执行轨迹不是节点/边图，继续使用 `text` fenced code 更清晰。Graphviz 只用于能从节点和边关系中获得学习价值的结构图。
