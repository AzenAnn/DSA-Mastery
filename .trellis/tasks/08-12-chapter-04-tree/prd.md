# PRD：第 4 章 树与二叉树

## 目标

二叉树定义与遍历、Huffman 编码、堆与优先队列。课程核心大章，建议实施时拆两个 task（基础+遍历 / 应用+堆）。

## 内容分工

- 01-binary-tree：树的术语、二叉树性质、递归遍历与非递归遍历（用第 2 章栈/队列）；
- 02-tree-applications：Huffman 树与编码、表达式树；
- 03-heap：堆的定义与调整、优先队列。

## 配套 Labs

- 二叉树遍历实现（含非递归）；
- Huffman 编码。

## 依赖

第 2 章（栈做非递归遍历、队列做层序遍历）。是第 5 章图与第 6 章 BST、第 7 章堆排序的基础。

## 验收标准

- 参考 `.trellis/spec/content/frontmatter-and-routing.md` 与 `labs.md`；
- `pnpm run validate:content`、`build`、`check:site` 通过；
- 非递归遍历必须覆盖空树与单节点边界。

## 归属

- Chapter Owner：Azen（轮换表第 4 章）；Review Owner：xy3。
