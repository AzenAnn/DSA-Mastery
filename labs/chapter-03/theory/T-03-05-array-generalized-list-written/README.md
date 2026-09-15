---
title: "Lab 03-T-05：数组与广义表理论大题训练"
description: "5 道数组与广义表理论大题，训练寻址推导、特殊矩阵压缩、稀疏矩阵转置和递归结构分析。"
order: 16
chapter: 3
labId: "03T05"
chapterTitle: "字符串与数组"
updated: "2026-09-15"
contributors: ["Fishman"]
status: "draft"
lab: true
labCategory: "theory"
difficulty: "基础～进阶"
duration: "100～130 分钟"
---

# Lab 03-T-05：数组与广义表理论大题训练

## 目标与前置知识

- 从维度长度和下标约定推导行优先寻址公式，并能解释每个 stride 的来源；
- 利用结构规律推导对称矩阵、三对角矩阵和稀疏矩阵的压缩下标；
- 用不重不漏、边界覆盖和复杂度分析说明快速转置为什么正确；
- 区分广义表的原子、子表、表头、表尾、长度与深度；
- 将递归定义直接翻译为递归算法，并指出空表、原子和深层嵌套的终止条件。

前置阅读：[3.3 数组寻址与特殊矩阵](../../../../content/chapter-03-string-array/03-array-and-matrix.md) 和 [3.4 广义表与递归算法](../../../../content/chapter-03-string-array/04-generalized-list.md)。建议先完成 [Lab 03-T-03](../T-03-03-array-matrix-quiz/README.md)、[Lab 03-T-04](../T-03-04-generalized-list-quiz/README.md) 以及四个配套 Exercise Lab。

## 试卷与评分

| 部分 | 题量 | 分值 | 建议用时 |
| --- | --- | --- | --- |
| 理论大题 | 5 题，每题 20 分 | 100 分 | 100～130 分钟 |

每题答案应包含：题目解读、关键步骤或伪代码、正确性依据、复杂度、边界检查和一个可执行的 C++17 片段。答案采用人工自评；只给最终数值而没有推导或边界说明的部分，原则上不超过该小问一半分。

## 理论大题

### 第 1 题：三维数组的行优先寻址

数组 `A[2][3][4]` 按行优先存储，首地址对应偏移 0。求 `A[1][2][3]` 的一维偏移，并推广到任意 n 维数组。

::: details 参考答案与评分要点

**题目解读**：下标从 0 开始；最右侧维度变化最快，因此 `A[1]` 前面有 `3×4` 个元素，`A[1][2]` 前面还要跨过 `2×4` 个元素，最后加上第三维下标 3。

**算法分析**：第 k 维 stride 是其右侧所有维长度的乘积。于是偏移为 `1×(3×4)+2×4+3=23`。一般式为

`offset = Σ idx[k] × Π b[s] (s>k)`。

**伪代码**：

```text
offset = 0
for k = 0 .. n-1:
    stride = 1
    for s = k+1 .. n-1: stride *= bound[s]
    offset += index[k] * stride
return offset
```

**最终代码**：

```cpp
long long rowMajorOffset(const std::vector<long long>& bound,
                         const std::vector<long long>& index) {
    long long offset = 0;
    for (std::size_t k = 0; k < bound.size(); ++k) {
        long long stride = 1;
        for (std::size_t s = k + 1; s < bound.size(); ++s) stride *= bound[s];
        offset += index[k] * stride;
    }
    return offset;
}
```

**拓展和思考**：若改成列优先，stride 改为左侧各维长度的乘积；若下标从 1 开始，应先减去各维下界再计算。`n=1` 时右侧为空乘积，stride 仍为 1。

**评分要点（20 分）**：维度顺序与下标约定 4 分；23 的推导 6 分；通用公式 4 分；伪代码/代码 3 分；列优先、1-based 或 n=1 边界 3 分。

:::

### 第 2 题：对称矩阵与三对角矩阵压缩

设 `A` 为 `n×n` 对称矩阵，只存下三角（含主对角线）。另有 n 阶三对角矩阵按行压缩。分别推导 `A[i][j]` 的下标规则，并说明越界区域如何处理。

::: details 参考答案与评分要点

**题目解读**：对称矩阵先把 `(i,j)` 规范成 `(max(i,j), min(i,j))`；三对角矩阵只有 `|i-j|≤1` 的位置进入压缩数组。

**算法分析**：下三角第 i 行有 `i+1` 个元素，行前元素数为 `i(i+1)/2`，所以对称矩阵下标为 `i(i+1)/2+j`（规范化后）。三对角矩阵前 i 行共有 `2i` 个元素，行内偏移为 `j-(i-1)`，合并得 `k=2i+j`。

**伪代码**：

```text
Symmetric(i, j):
    if i < j: swap(i, j)
    return i*(i+1)/2 + j

Tridiagonal(i, j):
    if abs(i-j) > 1: return absent
    return 2*i + j
```

**最终代码**：

```cpp
long long symmetricOffset(long long i, long long j) {
    if (i < j) std::swap(i, j);
    return i * (i + 1) / 2 + j;
}

std::optional<long long> tridiagonalOffset(long long i, long long j) {
    if (std::llabs(i - j) > 1) return std::nullopt;
    return 2 * i + j;
}
```

**拓展和思考**：若只存上三角，可按行长度 `n-i` 累加推导；若矩阵元素可能为 0，不能用数值 0 同时表示“无存储项”，应使用显式存在标志。边界行的非零元个数分别为 2、3、…、3、2。

**评分要点（20 分）**：对称规范化 4 分；下三角行前计数 4 分；三对角 `2i+j` 推导 5 分；伪代码/代码 3 分；越界、零值和首尾行边界 4 分。

:::

### 第 3 题：稀疏矩阵快速转置

给定按 `(row,col)` 行优先保存的三元组表 `M`，设计快速转置算法，要求输出 `T=Mᵀ` 仍按行优先排列，并分析复杂度。

::: details 参考答案与评分要点

**题目解读**：转置不仅交换每个三元组的行列，还必须让 `T.data` 按新行号排序。若只交换字段而不重排，后续按行扫描会失去有序性。

**算法分析**：先统计原矩阵每一列的非零元个数 `num[col]`，再求转置后每一行的起始位置 `cpot[col]`。扫描每个三元组 `(r,c,v)` 时，将 `(c,r,v)` 放入 `T.data[cpot[c]]` 并递增 `cpot[c]`。每个三元组只处理一次，时间为 `O(cols+t)`，空间为 `O(cols+t)`。

**伪代码**：

```text
num[0..cols-1] = 0
for (r,c,v) in M.data: num[c]++
cpot[0] = 0
for c = 1 .. cols-1: cpot[c] = cpot[c-1] + num[c-1]
for (r,c,v) in M.data:
    p = cpot[c]
    T.data[p] = (c,r,v)
    cpot[c]++
```

**最终代码**：

```cpp
struct Triple { int row, col, value; };
std::vector<Triple> fastTranspose(int cols, const std::vector<Triple>& data) {
    std::vector<int> num(cols), cpot(cols);
    for (const auto& x : data) ++num[x.col];
    for (int c = 1; c < cols; ++c) cpot[c] = cpot[c - 1] + num[c - 1];
    std::vector<Triple> out(data.size());
    for (const auto& x : data) {
        int p = cpot[x.col]++;
        out[p] = {x.col, x.row, x.value};
    }
    return out;
}
```

**拓展和思考**：若要求稳定保留同一列内的输入顺序，以上扫描顺序即可满足；若允许动态插入删除，十字链表更适合，但随机访问成本会改变。可用一个含重复列、零权值和空行的最小反例检查实现。

**评分要点（20 分）**：指出交换后仍需重排 4 分；`num/cpot` 两阶段 6 分；伪代码/代码 4 分；不重不漏正确性 3 分；复杂度与空列/重复列边界 3 分。

:::

### 第 4 题：广义表的表头、表尾和操作序列

给定 `L=((x,y,z),(a,b,c,d))`，执行 `THTH`，写出每一步结果，并说明为什么最终结果是原子 `b` 而不是表。

::: details 参考答案与评分要点

**题目解读**：`Head` 取当前表的第一个元素，可能是原子或子表；`Tail` 去掉表头后仍然返回一个表，因此会保留一层括号。

**算法分析**：

| 步骤 | 操作 | 结果 |
| --- | --- | --- |
| 0 | 初始 | `((x,y,z),(a,b,c,d))` |
| 1 | `T` | `((a,b,c,d))` |
| 2 | `H` | `(a,b,c,d)` |
| 3 | `T` | `(b,c,d)` |
| 4 | `H` | `b` |

解析阶段把原子表示为字符、把表表示为子节点数组；`H` 取 `children[0]`，`T` 复制 `children[1..]` 为新表。

**伪代码**：

```text
node = parse(L)
for op in ops:
    if op == H: node = node.children[0]
    else: node = List(node.children[1..])
return serialize(node)
```

**最终代码**：

```cpp
std::string tailHeadTailHead(const std::string& text) {
    // 解析器与序列化器由 Lab 03-E-06 实现；此处展示操作契约
    auto node = parse(text);
    node = tail(node);
    node = head(node);
    node = tail(node);
    node = head(node);
    return serialize(node);
}
```

**拓展和思考**：`Tail((a))` 是 `()`；若操作作用于原子或空表则未定义，题目必须明确禁止该情况。可以把同一操作序列改成 `THTHT`，观察何时会触及非法状态。

**评分要点（20 分）**：四步结果 8 分；Head/Tail 类型语义 4 分；伪代码/代码 4 分；括号层次与非法状态边界 4 分。

:::

### 第 5 题：广义表深度的递归证明

证明深度定义：原子深度为 0、空表深度为 1、非空表 `LS=(a1,…,an)` 的深度为 `max(depth(ai))+1`。并给出求 `G=(a,(b),(c,(d,e)))` 深度的递归过程。

::: details 参考答案与评分要点

**题目解读**：深度是最大括号嵌套层数，不是最外层长度。递归必须遍历同一层的全部元素，不能只看第一个子表。

**算法分析**：原子和空表是两个终止条件；非空表对每个元素递归，取最大值再加 1。对 `G`：`depth((b))=1`，`depth((d,e))=1`，`depth((c,(d,e)))=2`，因此 `depth(G)=3`。

**伪代码**：

```text
depth(node):
    if node is atom: return 0
    if node is empty list: return 1
    best = 0
    for child in node.children: best = max(best, depth(child))
    return best + 1
```

**最终代码**：

```cpp
int depth(const Node& node) {
    if (node.atom) return 0;
    if (node.children.empty()) return 1;
    int best = 0;
    for (const auto& child : node.children)
        best = std::max(best, depth(*child));
    return best + 1;
}
```

**拓展和思考**：若允许共享子表或循环引用，直接递归可能不终止，需要访问状态或节点身份去重；若把空表深度改成 0，所有包含空表的推导都要同步调整，不能只改一个边界分支。

**评分要点（20 分）**：两个递归终止条件 4 分；`G` 的逐层计算 6 分；遍历同层全部元素 3 分；伪代码/代码 4 分；循环引用、空表约定和复杂度 3 分。

:::

## 完成清单与复盘

- [ ] 5 题均写出题目解读、算法分析、伪代码、代码和复杂度；
- [ ] 第 1～3 题覆盖 0-based/1-based、行/列优先、矩阵边界、空行与重复列；
- [ ] 第 4～5 题覆盖原子、空表、表头为子表、表尾括号和深层递归；
- [ ] 每题至少记录一个“典型错解”及其最小反例；
- [ ] 能把本 Lab 的每题分别关联到 E-03-06～E-03-09 或 P-03-02。

复盘思考：如果把第 3 题的稀疏矩阵改为动态更新，把第 4 题的操作序列改为可能触及空表，原有不变量分别是哪一条先失效？
