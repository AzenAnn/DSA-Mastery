# PRD：第 6 章 查找

## 目标

二分查找、二叉排序树（BST）与散列表（哈希表）。

## 内容分工

- 01-binary-search-tree：BST 定义、插入/删除（含双子女删除）、复杂度与退化问题；
- 02-hash-table：散列函数、冲突处理（链地址法/开放定址）、负载因子。

## 配套 Labs

- 散列表实现与冲突统计；
- BST 增删查与顺序遍历校验。

## 依赖

第 4 章（树的概念与递归）。哈希部分相对独立，可调节章节节奏。

## 验收标准

- 参考 `.trellis/spec/content/frontmatter-and-routing.md` 与 `labs.md`；
- `pnpm run validate:content`、`build`、`check:site` 通过；
- 必须覆盖 BST 删除的三种情况与散列冲突的边界测试。

## 归属

- Chapter Owner：Azen（轮换表第 6 章）；Review Owner：xy3。
