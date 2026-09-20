---
title: "Lab 03-E-13：对称矩阵压缩存储与取值"
description: "把 n 阶对称矩阵的下三角按行优先压进一维数组，并按 k = i(i+1)/2 + j + 1 回答取值查询。"
order: 17
chapter: 3
labId: "03E13"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "基础"
duration: "40～55 分钟"
---

# Lab 03-E-13：对称矩阵压缩存储与取值

> 题目来源：改编自《数据结构（C 语言版）》特殊矩阵的压缩存储、王道 3.3 对称矩阵的下标换算。

对称矩阵满足 `A[i][j] = A[j][i]`，把整个 `n×n` 矩阵存下来会有一半是重复的。只存下三角（含对角线）的 `n(n+1)/2` 个元素，就能完整还原矩阵，省下近一半空间。本题要求你按下标公式直接定位压缩数组中的元素，回答若干次取值查询，重点是**下标换算推导**而不是建表。

## 题目

### 对称矩阵的压缩存储

`n` 阶对称矩阵满足 `A[i][j] = A[j][i]`（`0 ≤ i, j < n`）。只需保存下三角（含主对角线）的 `n(n+1)/2` 个元素，按**行优先**依次存进一维数组（本题称“压缩数组”）。

设 `i ≥ j`，则 `A[i][j]` 在压缩数组中的下标（**1-based**）为

$$
k = \frac{i(i+1)}{2} + j + 1 .
$$

当 `i < j` 时，按对称性取 `A[i][j] = A[j][i]`，即用行号 `j`、列号 `i` 代入同一公式：

$$
k = \frac{j(j+1)}{2} + i + 1 .
$$

前 `i` 行（第 `0` 行到第 `i−1` 行）共 `1 + 2 + ⋯ + i = i(i+1)/2` 个元素，再加上本行 `A[i][0..j−1]` 的 `j` 个，就是 `A[i][j]` 之前已有元素的个数；因为 `k` 从 `1` 开始，所以末尾再 `+1`。

### 任务要求

1. 从标准输入读入阶数 `n` 与压缩数组（下三角、含对角线、行优先、共 `n(n+1)/2` 个整数）；
2. 读入 `q` 与 `q` 组查询 `i j`（**0-based**）；对每组查询输出压缩数组下标 `k`（**1-based**）与元素值 `A[i][j]`；
3. `i < j` 时必须按对称性交换行列，不得直接查表；
4. 每次查询必须是 `O(1)` 的直接寻址；
5. 两个整数用单个空格分隔，行末无多余空格。

## 输入格式

- 第一行：整数 `n`（矩阵阶数）；
- 接下来若干行：`n(n+1)/2` 个整数，为对称矩阵下三角（含主对角线）按行优先排列的元素值，空格分隔，**可以跨多行**；
- 接下来一行：整数 `q`（查询次数）；
- 接下来 `q` 行：每行两个整数 `i j`（0-based 下标，保证 `0 ≤ i, j < n`）。

## 输出格式

- 共 `q` 行，每行两个整数：压缩数组下标 `k`（1-based）与元素值 `A[i][j]`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `n` | 1 ≤ n ≤ 600 |
| 压缩数组长度 | `n(n+1)/2`，`n=600` 时为 180300 |
| `q` | 1 ≤ q ≤ 2×10⁴ |
| 元素值 | \|v\| ≤ 10⁹ |
| `i`、`j` | 0 ≤ i, j < n，保证合法 |
| 时间复杂度 | 每次查询 O(1)，总计 O(n² + q) |
| 空间复杂度 | O(n²)（压缩数组本身） |
| 评测时限 | 默认 2000 ms / 输出 1024 KB |

**关于规模：** `n` 的上界取 600 而不是更大，是为了在保留"大矩阵 + 大量查询"这个考点的同时控制测试数据体积（`n = 600` 时压缩数组有 180300 个整数，输入约 0.5 MB；`q = 2×10⁴` 时输出约 190 KB）。这样的规模用默认的 2000 ms 与 1024 KB 限制即可稳定通过，无需放宽。

## 样例

### 样例输入 1

```input
3
1 2 3 4 5 6
3
0 0
2 0
1 2
```

### 样例输出 1

```output
1 1
4 4
5 5
```

### 样例输入 2

```input
1
7
1
0 0
```

### 样例输出 2

```output
1 7
```

### 样例解释

样例 1：`n = 3`，压缩数组 `1 2 3 4 5 6` 按行优先对应下三角

- 第 0 行：`A[0][0] = 1`；
- 第 1 行：`A[1][0] = 2`、`A[1][1] = 3`；
- 第 2 行：`A[2][0] = 4`、`A[2][1] = 5`、`A[2][2] = 6`。

再由对称性补出上三角，完整矩阵为

$$
A=\begin{pmatrix}
1 & 2 & 4\\
2 & 3 & 5\\
4 & 5 & 6
\end{pmatrix}.
$$

- 查询 `0 0`：`i ≥ j`，`k = 0×1/2 + 0 + 1 = 1`，`A[0][0] = 1`，输出 `1 1`；
- 查询 `2 0`：`i ≥ j`，`k = 2×3/2 + 0 + 1 = 4`，`A[2][0] = 4`，输出 `4 4`；
- 查询 `1 2`：`i < j`，按对称性取 `A[2][1] = 5`，`k = 2×3/2 + 1 + 1 = 5`，输出 `5 5`。

三个查询分别覆盖了 `i > j`、`i = j`、`i < j` 三种情形。

样例 2：`n = 1` 时下三角只有一个元素，压缩数组长度为 1，唯一的查询 `0 0` 必然对应 `k = 1`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab doctor labs/chapter-03/exercise/E-03-13-symmetric-matrix-compress
pnpm lab run labs/chapter-03/exercise/E-03-13-symmetric-matrix-compress
pnpm lab score labs/chapter-03/exercise/E-03-13-symmetric-matrix-compress
```

- [ ] 样例通过；
- [ ] `i > j`、`i = j`、`i < j` 三种位置都有证据；
- [ ] `n = 1`、全对角查询、全对称（`i < j`）查询三种边界都有证据；
- [ ] 使用 `sync_with_stdio(false)`/快速读入，能在默认 2000 ms 内跑完 `n = 600`、`q = 2×10⁴` 的最大输入。

## 思考题

1. 公式 `k = i(i+1)/2 + j + 1` 是怎么推出来的？如果把“行优先”改成“列优先”存下三角，`k` 会变成什么？两者有什么对称关系？
2. 存储对称矩阵需要 `n(n+1)/2` 个元素，相比 `n²` 省了多少？当 `n` 很大时这个比例趋近于多少？
3. 本题每次查询是 `O(1)` 的直接寻址；如果先把压缩数组展开成完整的 `n×n` 矩阵再查表，正确性不变，为什么在 `q` 很大、矩阵很稀疏的场合反而不划算？
4. 若矩阵不是对称矩阵，而是“反对称矩阵”（`A[i][j] = −A[j][i]`，对角线全 0），压缩存储还需要存对角线吗？查询公式要怎么改？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

对 `i ≥ j` 的查询，压缩数组里排在 `A[i][j]` 之前的元素分两部分：第 `0` 行到第 `i−1` 行共 `1 + 2 + ⋯ + i = i(i+1)/2` 个，以及第 `i` 行中 `A[i][0..j−1]` 共 `j` 个。所以 `A[i][j]` 是压缩数组里的第 `i(i+1)/2 + j` 个（0-based），换成题目要求的 1-based 下标就是 `k = i(i+1)/2 + j + 1`。

对 `i < j` 的查询，利用对称性把 `A[i][j]` 换成 `A[j][i]`，即交换行列后套用同一公式 `k = j(j+1)/2 + i + 1`。注意 `k` 只由有序对 `(max(i,j), min(i,j))` 决定，因此 `(i,j)` 与 `(j,i)` 得到的下标必然相同。

### 复杂度分析

读入压缩数组 `O(n²)`，每次查询只用一次乘法、一次除法和一次数组访问，是 `O(1)`；总时间 `O(n² + q)`。空间只需保存压缩数组的 `n(n+1)/2` 个元素，即 `O(n²)`，不需要展开成完整的 `n×n` 矩阵。

### 边界注意

- `n = 1`：压缩数组长度为 1，唯一合法的查询是 `(0, 0)`，`k = 1`；
- `i = j` 时两个分支给出同一个 `k`，不额外特判也不会错；
- `i < j` 时最容易忘记交换行列，导致取到别的元素；
- `n = 600` 时 `k` 最大为 `180300`，`i(i+1)/2` 在 32 位整数内安全，但元素值最小可达 `−10⁹`，建议用 `long long` 存元素；
- 输入的下三角元素可以跨多行，按空白分隔逐个读入即可，不要按行读取；
- 本题不涉及错误输入：`i`、`j` 始终合法。

### 参考代码

```cpp
#include <cstdio>
#include <string>
#include <vector>

namespace {

// 快速读入：一次读入一整块到缓冲区，再按字符解析整数，
// 避免对 5×10^5 个整数逐个做格式化输入。
class FastScanner {
public:
    void init(std::FILE* stream) { stream_ = stream; }

    long long nextInt() {
        long long value = 0;
        bool negative = false;
        int current = peek();
        while (current != -1 && current <= ' ') {
            advance();
            current = peek();
        }
        if (current == '-') {
            negative = true;
            advance();
            current = peek();
        }
        while (current >= '0' && current <= '9') {
            value = value * 10 + (current - '0');
            advance();
            current = peek();
        }
        return negative ? -value : value;
    }

private:
    int peek() {
        if (position_ >= size_) {
            if (stream_ == nullptr) return -1;
            size_ = static_cast<int>(std::fread(buffer_, 1, sizeof(buffer_), stream_));
            position_ = 0;
            if (size_ == 0) {
                stream_ = nullptr;
                return -1;
            }
        }
        return static_cast<unsigned char>(buffer_[position_]);
    }

    void advance() { ++position_; }

    char buffer_[1 << 16];
    std::FILE* stream_ = nullptr;
    int position_ = 0;
    int size_ = 0;
};

}  // namespace

int main() {
    FastScanner scanner;
    scanner.init(stdin);

    const long long n = scanner.nextInt();
    const long long total = n * (n + 1) / 2;

    // 压缩数组用 1-based 下标，packed[k] 就是 A[i][j] 的值。
    std::vector<long long> packed(static_cast<std::size_t>(total) + 1, 0);
    for (long long k = 1; k <= total; ++k) {
        packed[static_cast<std::size_t>(k)] = scanner.nextInt();
    }

    const long long q = scanner.nextInt();

    // 先拼进输出缓冲再一次写出，q 最大 2×10^4 行。
    std::string output;
    output.reserve(static_cast<std::size_t>(q) * 20);
    char line[32];
    for (long long t = 0; t < q; ++t) {
        const long long i = scanner.nextInt();
        const long long j = scanner.nextInt();
        long long k = 0;
        if (i >= j) {
            k = i * (i + 1) / 2 + j + 1;
        } else {
            k = j * (j + 1) / 2 + i + 1;
        }
        const int length = std::snprintf(line, sizeof(line), "%lld %lld\n", k,
                                         packed[static_cast<std::size_t>(k)]);
        output.append(line, static_cast<std::size_t>(length));
    }
    std::fwrite(output.data(), 1, output.size(), stdout);
    return 0;
}
```

</details>
