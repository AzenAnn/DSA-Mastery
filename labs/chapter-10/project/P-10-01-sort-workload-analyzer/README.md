---
title: "Lab 10-P-01：基础排序工作负载评测器"
description: "在统一 Sorter 接口下实现插入、选择、冒泡、希尔四种排序，用相同工作负载验证稳定性并比较比较/移动代价。"
order: 21
chapter: 10
labId: "10P01"
chapterTitle: "排序"
updated: "2026-09-05"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "综合"
duration: "300～420 分钟"
---

# Lab 10-P-01：基础排序工作负载评测器

## 目标

实现四种基础排序——**插入、选择、冒泡、希尔**，让它们在同一个接口下运行，再回答两个问题：

1. 谁稳定、谁不稳定？稳定与否对带**卫星数据**（重复 key 附带各自信息）的记录意味着什么？
2. 四种排序都是 $O(n^2)$，但为什么比较次数、移动次数差异很大？「渐近复杂度」和「实际代价」到底差在哪？

本 Lab 是基础排序这一章的收口工程。你不仅要写出能用的排序，还要像评测器一样**计数**：每比较一次 key 记一次，每把一个元素写进数组记一次，最后用这些数字比较四种算法、验证稳定性，并解释为什么同阶算法有不同常数。

## 前置知识

- 第 10.1 节插入排序、第 10.2 节选择排序、第 10.3 节冒泡排序、第 10.4 节希尔排序；
- 稳定性的定义，以及「交换不相邻元素可能破坏稳定性」的直觉；
- 第 0 章时间复杂度与嵌套循环分析；基本的 C++ 类、`std::vector` 与 CMake。

## 建议用时

300～420 分钟（5～7 小时），建议分 3 次提交：先插入排序，再做选择 + 冒泡，最后做希尔排序并跑评测器写报告。

## 核心契约

所有排序器实现 `contracts/sorters.hpp` 中的 `sortlab::Sorter`。排序的载荷是：

```cpp
struct Record {
    int key;  // 决定比较次序
    int tag;  // 卫星数据（通常是原始序号），用于观测稳定性
};
```

**计数口径（必须严格遵守，否则精确计数测试会失败）：**

- `comparisons`：每执行一次对 `key` 的大小比较（如 `a[j].key > key.key`）就 `++` 一次；
- `moves`：每把一个 `Record` **写入数组位置**（如 `a[j+1] = a[j]`、交换展开的每一条赋值）就 `++` 一次；把元素**读到局部变量**（如 `Record key = a[i]`）**不**计入。

两个计数单位不同，只能分别解释，不能相加后说「数值小的更快」。

## 任务与评分

| Task | 类型 | 权重 | 依赖 | 交付物 |
| --- | --- | ---: | --- | --- |
| `insertion` | CTest | 25 | 无 | 插入排序（含稳定性与精确计数） |
| `selection-bubble` | CTest | 30 | 无 | 选择排序 + 冒泡排序 |
| `shell` | CTest | 25 | 无 | 希尔排序（Shell / Hibbard 两种增量序列） |
| `report` | manual | 20 | 前三项 | 工作负载对比与选型报告 |

顶层评分会分开显示自动分与待人工分。任务依赖只表示推荐顺序和定位关系，不会把前置任务变成「一票否决」。

## 运行与评分

进入本目录后优先使用：

```powershell
make doctor
make run
make run TASK=insertion
make run TASK=selection-bubble
make run TASK=shell
make score
```

Windows 未安装 GNU Make 时，在仓库根使用免 Make 兜底：

```powershell
pnpm lab:run -- labs/chapter-10/project/P-10-01-sort-workload-analyzer
pnpm lab:run -- labs/chapter-10/project/P-10-01-sort-workload-analyzer --task insertion
pnpm lab:score -- labs/chapter-10/project/P-10-01-sort-workload-analyzer
```

维护者可用 `--target solution` 验证参考实现自动部分满分。Project 使用 CMake ≥ 3.25 与 CTest，所有构建产物只写入 `.lab-cache/`。

评测器（供报告使用）在构建后可运行：

```powershell
.lab-cache/cmake/student/src/sort_workload --profile random --size 4096 --seed 42
.lab-cache/cmake/student/src/sort_workload --profile ascending --size 4096 --seed 42
.lab-cache/cmake/student/src/sort_workload --profile descending --size 4096 --seed 42
.lab-cache/cmake/student/src/sort_workload --profile few-unique --size 4096 --seed 42
```

## 任务一：插入排序

实现 `sortlab::InsertionSorter` 的 `sort()`。把 `a[0..i-1]` 视为已排好序的前缀，每次把 `a[i]` 插入到前缀中的正确位置。插入排序是稳定的：只有 `a[j].key > key.key`（严格大于）才右移，相等时不移动。

自动测试覆盖：正确性（排序结果有序且是原序列的排列）、稳定性（重复 key 的 tag 保持相对顺序）、以及三组固定小输入上的精确 `comparisons` / `moves`。

## 任务二：选择排序 + 冒泡排序

实现 `sortlab::SelectionSorter` 与 `sortlab::BubbleSorter`。

- **选择排序**每趟从未排序区间选出 key 最小的元素交换到当前起始位置。它**不稳定**：一次交换可能把某个元素「跳过」另一个 key 相同的元素。交换请显式展开为三条赋值（计三次 `moves`）。
- **冒泡排序**相邻两两比较、逆序则交换，某趟无交换即可提前终止。它**稳定**：只有 `a[j].key > a[j+1].key`（严格大于）才交换。

自动测试覆盖：两者正确性、冒泡稳定性、选择排序在 `[2,2,1]` 上把两个相等 key 次序颠倒的反例、以及精确计数（含冒泡在已有序输入上 `moves == 0` 的提前终止检查）。

## 任务三：希尔排序

实现 `sortlab::ShellSorter`，支持两种增量序列（`GapSequence`）：

- `Shell`：`n/2, n/4, …, 1`（折半）；
- `Hibbard`：`1, 3, 7, 15, …`（`2^k - 1`），取不超过 `n/3` 的最大项，再 `(h-1)/2` 递减到 1。

对每个增量 `h`，做一次按步长 `h` 的插入排序。希尔排序**不稳定**：间隔交换会跨过相等 key。自动测试覆盖：正确性、同一输入下两种序列产生**不同**比较次数（证明增量序列影响代价），以及逆序规模增大时 Hibbard 序列优于 Shell 序列的精确计数。

## 提交物

- 三个 task 的 `student/` 实现；
- `make run TASK=...` 三个任务各自的通过输出；
- `report/template.md` 填写的报告；
- 一份 500～800 字的设计说明，覆盖「复杂度分析要求」的 4 个问题。

## 验收标准

- [ ] 四种排序都对 `contracts/sorters.hpp` 的接口实现，`make run` 三个 CTest 任务全绿；
- [ ] 插入、冒泡的稳定性与选择、希尔的不稳定性各有测试证据；
- [ ] 精确计数测试通过（比较/移动次数与参考实现一致）；
- [ ] 用 `sort_workload` 在四种输入上跑出对比表，并解释计数差异的来源；
- [ ] 报告区分「渐近复杂度」「确定性计数」「实测时间」三者，不混为一谈。

## 复杂度分析要求

在说明文档里回答：

1. 插入、选择、冒泡的最坏/平均/最好时间复杂度各是多少？它们的比较次数上界分别是多少？
2. 为什么插入排序在「基本有序」的输入上远快于选择排序？这与两者的 `moves` 计数有何关系？
3. 为什么同是 $O(n^2)$，冒泡排序在已有序输入上的 `moves` 是 0，而选择排序无论如何都要 $n(n-1)/2$ 次比较？
4. 希尔排序为什么没有统一的「准确复杂度」结论？增量序列如何影响它的实际代价？

## 加分项

- 给 `ShellSorter` 增加一个 `gaps = {1}` 的退化序列，验证它与插入排序的计数几乎一致；
- 把 `sort_workload` 的输出导入电子表格，画「规模—比较次数」曲线，观察四种排序的斜率差异；
- 研究「为什么选择排序的移动次数是 $O(n)$，却仍被归入 $O(n^2)$」，写一段简短论证。

## 延伸思考

1. 稳定性到底什么时候重要？为什么数据库排序、Excel 排序几乎都要求稳定？
2. 如果数据「几乎有序」，插入排序和冒泡排序谁更占优？用 `moves` 计数解释。
3. 希尔排序打破了插入排序 $O(n^2)$ 的最坏情况，为什么第 11 章还要引入归并、快排这些 $O(n\log n)$ 算法？希尔的代价和局限是什么？
