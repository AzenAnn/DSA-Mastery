---
title: "Lab 03-15：稀疏矩阵运算库"
description: "在统一契约下实现稀疏矩阵的三元组转置、加法与乘法，用固定 seed 工作负载比较稀疏与稠密场景，并给出带前提的存储选型。"
order: 15
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-27"
contributors: ["Fishman"]
status: "draft"
lab: true
difficulty: "综合"
duration: "5～7 小时"
---

# Lab 03-15：稀疏矩阵运算库

转置、加法与乘法是稀疏矩阵最基础的运算，三者都围绕同一个三元组顺序表展开：转置要把行列互换后重排，加法要按位置归并，乘法要按"行 × 列"做稀疏点积。本项目要求你在统一 `SparseMatrix` 契约下实现这三种运算与取值，用固定 seed 的工作负载比较稀疏与稠密场景，最后回答"稀疏到什么程度才值得用三元组，什么时候该换成十字链表"。

## 学习目标

- 用 `num`/`cpot` 一趟扫描实现 O(rows + cols + t) 的快速转置；
- 用归并思路实现同型加法，正确消去相加为 0 的非零元；
- 实现稀疏乘法，保证结果与稠密点积语义一致；
- 用固定 seed 工作负载比较不同稀疏度，区分非零元个数、空间估算与墙钟时间；
- 写出带稀疏度前提的存储/算法选型结论，并说明结论的反转条件。

## 前置知识

- 第 3.3 节：数组顺序存储与寻址、对称/三角/三对角矩阵的压缩下标换算；
- 第 3.3 节：稀疏矩阵的三元组顺序表、快速转置（`num`/`cpot`）与十字链表；
- 第 2 章：栈与队列（`num`/`cpot` 是计数排序思想的直接应用）。

## 环境

Node.js、pnpm、C++17 编译器与 CMake 3.25 或更高版本。进入目录先检查：

```powershell
make doctor
# 未安装 GNU Make 时，在仓库根执行：
pnpm lab:doctor -- labs/chapter-03/lab-03-15-sparse-matrix-library
```

## 公共契约与约定

`contracts/sparse_matrix.hpp` 是不可修改的公共合同：

- `Triple{ row, col, value }`：一个非零元；
- `SparseMatrix{ rows, cols, data }`：行数、列数，以及**按 (row, col) 升序**的三元组表；
- `transpose`：行列互换并重排，O(rows + cols + t)；
- `add`：要求两矩阵同型，否则抛 `std::invalid_argument`；相加为 0 的非零元应被消去；
- `multiply`：要求 `a.cols == b.rows`，否则抛 `std::invalid_argument`；结果仍按 (row, col) 升序；
- `get`：命中返回该非零元的值，未命中返回 0。

## 任务与评分

| Task | 类型 | 权重 | 依赖 | 交付物 |
| --- | --- | ---: | --- | --- |
| `transpose` | stdio | 40 | 无 | 快速转置命令行工具：读三元组、输出转置后三元组 |
| `ops` | CTest | 40 | transpose | 契约实现：转置 / 加法 / 乘法 / 取值与边界 |
| `report` | manual | 20 | ops | 实验方法、数据、解释与选型 |

```text
Automated: 80/80
Manual pending: 20
Provisional total: 80/100
```

自动测试只判定接口、位置、值与维度异常；墙钟时间只作为报告中的辅助证据。

## Task 1：transpose（stdio，40 分）

stdin 第一行 `rows cols count`，随后 `count` 行 `row col value`；stdout 输出转置后的非零元，每行 `row col value`，按 (row, col) 升序。必须用 `num`/`cpot` 一趟扫描，复杂度 O(rows + cols + count)。

## Task 2：ops（CTest，40 分）

实现 `contracts/sparse_matrix.hpp` 中的 `transpose / add / multiply / get`。测试组：

| CTest | 分值 | 覆盖 |
| --- | ---: | --- |
| `ops-transpose` | 30 | 快速转置正确性、两次转置回到原样 |
| `ops-add` | 25 | 同型加法、相加抵消为 0 的消去 |
| `ops-multiply` | 35 | 乘法结果与稠密点积一致 |
| `ops-boundary` | 10 | 空矩阵、get 未命中、维度不匹配异常 |

## 运行

```powershell
make run
make run TASK=transpose
make run TASK=ops
make score
make verify
# 免 Make 兜底：在仓库根执行
pnpm lab:run -- labs/chapter-03/lab-03-15-sparse-matrix-library
pnpm lab:run -- labs/chapter-03/lab-03-15-sparse-matrix-library --task transpose
pnpm lab:score -- labs/chapter-03/lab-03-15-sparse-matrix-library
pnpm lab:verify -- labs/chapter-03/lab-03-15-sparse-matrix-library
```

## 正常、边界与错误情况

- 正常：随机稀疏、带状、对角线集中的矩阵；
- 边界：空矩阵（count = 0）、单元素、转置两次回到原样、`get` 未命中；
- 错误：`add`/`multiply` 维度不匹配（抛异常）；相乘后抵消为 0 的非零元应被消去。

## 报告与完成清单

复制 `report/template.md`，至少使用三个规模与三种稀疏度，正式计时至少 7 轮取中位数，并记录环境与参数。报告必须区分非零元个数、空间估算与墙钟时间，结论带稀疏度前提与反转条件。

- [ ] 转置、加法、乘法通过契约与边界用例；
- [ ] 加法与乘法能正确消去相加/相乘为 0 的非零元；
- [ ] 三个规模 × 三种稀疏度可复现，reference 自动部分 80/80；
- [ ] 报告写明三元组 vs 十字链表的选型边界与反转条件；
- [ ] 构建产物只位于 `.lab-cache/`。

## 思考与复盘

1. 快速转置的 `cpot` 为什么能一趟扫描完成？它和普通转置的 `O(cols × t)` 差在哪？
2. 三元组顺序表在"随机访问"下为什么退化？十字链表在什么操作模式下才值得那额外的指针开销？
3. 稀疏度 δ = t/(mn) 达到多少时，三元组表才比二维数组省空间（按字节估算）？
4. 若矩阵运算中非零元位置频繁变化（如矩阵相加产生新非零元），三元组与十字链表各有什么代价？
5. 记录一个被测试捕获的错误、不变量破坏方式与最小回归用例。
