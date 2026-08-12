# PRD：第 7 章 排序

## 目标

内部排序的完整比较：插入、交换、选择、归并、堆排序与基数排序，稳定性与性能基准。

## 内容分工

- 01-compare-sort：直接插入、希尔、冒泡、快排、归并——逐步推导与稳定性表；
- 02-heap-sort-and-radix：堆排序（依赖第 4 章堆）、基数排序（LSD）。

## 配套 Labs

- 排序稳定性对比实验；
- 多算法性能基准测试（记录真实耗时与操作次数）。

## 依赖

第 4 章（堆）。独立性最强，适合作为收官章与综合检验。

## 验收标准

- 参考 `.trellis/spec/content/frontmatter-and-routing.md` 与 `labs.md`；
- `pnpm run validate:content`、`build`、`check:site` 通过；
- 各算法时间/空间/稳定性结论必须人工核验，最好/平均/最坏前提清楚；
- 基准测试在 PR 中附命令与结果。

## 归属

- Chapter Owner：xy3（轮换表第 7 章）；Review Owner：Azen。
