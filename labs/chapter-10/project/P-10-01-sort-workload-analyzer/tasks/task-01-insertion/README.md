# Lab 10-P-01：基础排序工作负载评测器 · 任务一

实现 `sortlab::InsertionSorter` 的 `sort()`，把 `a[0..i-1]` 视为已排好序的前缀，每次把 `a[i]` 插入到前缀中的正确位置。

要求：

- 只有 `a[j].key > key.key`（严格大于）才右移，保证稳定；
- 每比较一次 key `++metrics_.comparisons`，每把 Record 写入数组位置 `++metrics_.moves`（读入局部变量不计）。
