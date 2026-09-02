# Lab 03-P-02：稀疏矩阵运算库

读入稀疏矩阵的三元组，用 `num` / `cpot` 一趟扫描完成快速转置，输出按 (row, col) 升序的三元组。

## 输入格式

- 第一行：`rows cols count`（行数、列数、非零元个数）；
- 随后 `count` 行：`row col value`（非零元，输入保证按 (row, col) 升序）。

## 输出格式

- 转置后的非零元，每行 `row col value`，按 (row, col) 升序。

## 约束

| 项目 | 范围 |
| --- | --- |
| rows, cols | 1 ≤ rows, cols ≤ 10⁴ |
| count | 0 ≤ count ≤ 10⁵ |

要求使用 `num`/`cpot` 一趟扫描，复杂度 O(rows + cols + count)。

## 验证

```powershell
make run TASK=transpose
pnpm lab:run -- labs/chapter-03/project/P-03-02-sparse-matrix-library --task transpose
```
