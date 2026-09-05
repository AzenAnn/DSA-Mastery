# Lab 10-P-01：基础排序工作负载评测器 · 任务二

实现 `sortlab::SelectionSorter` 与 `sortlab::BubbleSorter` 的 `sort()`。

要求：

- 选择排序每趟从未排序区间选出 key 最小的元素交换到当前起始位置，显式展开交换为三条赋值（计三次 `moves`）；
- 冒泡排序相邻比较、逆序则交换，某趟无交换即提前终止；只有 `a[j].key > a[j+1].key` 才交换以保持稳定；
- 计数口径与任务一一致。
