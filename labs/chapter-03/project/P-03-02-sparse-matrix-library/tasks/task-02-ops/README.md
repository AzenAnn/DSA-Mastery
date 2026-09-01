# Lab 03-P-02：稀疏矩阵运算库

在 `contracts/sparse_matrix.hpp` 的契约下实现三元组顺序表的转置、加法、乘法与取值，测试组覆盖语义等价与边界。

## 契约

- `data` 始终按 (row, col) 升序；
- `transpose` 用 `num`/`cpot` 一趟扫描，O(rows + cols + t)；
- `add` 要求同型，`multiply` 要求 `a.cols == b.rows`，维度不匹配抛 `std::invalid_argument`；
- 相加为 0 的非零元应被消去。

## 测试组

| CTest | 分值 | 覆盖 |
| --- | ---: | --- |
| `ops-transpose` | 30 | 快速转置正确性、两次转置回到原样 |
| `ops-add` | 25 | 同型加法、相加抵消为 0 的消去 |
| `ops-multiply` | 35 | 乘法结果与稠密点积一致 |
| `ops-boundary` | 10 | 空矩阵、get 未命中、维度不匹配异常 |

## 验证

```powershell
make run TASK=ops
make score
# 或
pnpm lab:run -- labs/chapter-03/project/P-03-02-sparse-matrix-library --task ops
pnpm lab:score -- labs/chapter-03/project/P-03-02-sparse-matrix-library
```
