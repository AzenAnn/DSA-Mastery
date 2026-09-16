---
title: "Lab 03-E-18：上三角矩阵压缩存储与取值"
description: "把 n 阶矩阵的上三角按行优先压进一维数组，下三角不存储、值恒为常量 c，并按 k = i(2n−i+1)/2 + (j−i) + 1 回答取值查询。"
order: 22
chapter: 3
labId: "03E18"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "基础"
duration: "40～55 分钟"
---

# Lab 03-E-18：上三角矩阵压缩存储与取值

> 题目来源：改编自《数据结构（C 语言版）》特殊矩阵的压缩存储、王道 3.3 三角矩阵的下标换算。

**三角矩阵**是指上三角（不含对角线）或下三角（不含对角线）区域中元素全为同一个常数 `c` 的矩阵。这种矩阵里真正“需要记住”的只有另一个三角。本题把**上三角（含主对角线）**的 `n(n+1)/2` 个元素按**行优先**压进一维数组，下三角区域不占用任何存储，取值时直接返回常量 `c`。考点仍是**下标换算的推导**，而不是真的把矩阵开出来。

## 题目

### 上三角的压缩存储

给定 `n` 阶矩阵 `A`（`0 ≤ i, j < n`，下标 **0-based**），它的下三角区域（`i > j`）元素全部等于常量 `c`。我们只保存上三角（含主对角线）的 `n(n+1)/2` 个元素，按**行优先**依次存进一维数组（本题称“压缩数组”）。

设 `i ≤ j`，则 `A[i][j]` 在压缩数组中的下标（**1-based**）为

$$
k = \frac{i(2n-i+1)}{2} + (j-i) + 1 .
$$

**公式推导：** 第 `r` 行在上三角中有 `n−r` 个元素（列号 `r..n−1`），所以排在 `A[i][j]` 前面的是

$$
\underbrace{\sum_{r=0}^{i-1}(n-r)}_{\text{前 } i \text{ 行}} + \underbrace{(j-i)}_{\text{本行第 } i \text{ 列起的元素}}
= \left(in-\frac{i(i-1)}{2}\right) + (j-i)
= \frac{i(2n-i+1)}{2} + (j-i).
$$

前 `i` 行（第 `0` 行到第 `i−1` 行）的元素个数为 `i(2n−i+1)/2`；因为 `k` 从 `1` 开始计数，所以末尾再 `+1`，就得到上面的公式。

设 `i > j`，该位置落在未存储的下三角区域：

$$
k = 0,\qquad \text{值} = c .
$$

`k = 0` 是约定的“未存储”标记（合法压缩下标从 `1` 开始，`0` 不会被正常寻址用到）。

### 与 Lab 03-E-13（对称矩阵）的区别

| 对比项 | 03E13 对称矩阵 | 本题 03E18 三角矩阵 |
| --- | --- | --- |
| 压缩哪一半 | **下三角**（含对角线） | **上三角**（含对角线） |
| 元素个数 | `n(n+1)/2` | `n(n+1)/2` |
| `i ≥ j` 的查询 | 直接查表：`k = i(i+1)/2 + j + 1` | `i > j` 未存储：`k = 0`、值 `= c`（`i = j` 在对角线上，正常查表） |
| `i < j` 的查询 | 按对称性取 `A[i][j] = A[j][i]`，`k = j(j+1)/2 + i + 1` | 直接查表：`k = i(2n−i+1)/2 + (j−i) + 1` |

一句话概括差异：**对称矩阵存下三角、`i < j` 时取对称元；本题存上三角、`i > j` 时取常量 `c`**。对称矩阵的 `k` 只由有序对 `(max(i,j), min(i,j))` 决定，`(i,j)` 与 `(j,i)` 得到同一个 `k`；本题则完全不同——`(i,j)` 与 `(j,i)` 中最多只有一个能查到压缩数组里的元素，另一个必然是 `k = 0`。

### 任务要求

1. 从标准输入读入阶数 `n` 与压缩数组（上三角、含对角线、行优先、共 `n(n+1)/2` 个整数），再读入常量 `c`；
2. 读入 `q` 与 `q` 组查询 `i j`（**0-based**）；对每组查询输出压缩数组下标 `k`（**1-based**）与元素值 `A[i][j]`；
3. `i > j` 时必须输出 `k = 0` 与常量 `c`，**不得**去压缩数组里取别的元素；
4. 每次查询必须是 `O(1)` 的直接寻址；
5. 两个整数用单个空格分隔，行末无多余空格。

## 输入格式

- 第一行：整数 `n`（矩阵阶数）；
- 接下来若干行：`n(n+1)/2` 个整数，为上三角（含主对角线）按**行优先**排列的元素值（先第 `0` 行的 `n` 个，再第 `1` 行的 `n−1` 个，依此类推），空格分隔，**可以跨多行**；
- 接下来一行：整数 `c`（下三角区域的常量）；
- 接下来一行：整数 `q`（查询次数）；
- 接下来 `q` 行：每行两个整数 `i j`（0-based 下标，保证 `0 ≤ i, j < n`）。

## 输出格式

- 共 `q` 行，每行两个整数：压缩数组下标 `k`（1-based，未存储时为 `0`）与元素值 `A[i][j]`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `n` | 1 ≤ n ≤ 300 |
| 压缩数组长度 | `n(n+1)/2`，`n=300` 时为 45150 |
| `q` | 1 ≤ q ≤ 10⁴ |
| 元素值与常量 | \|v\| ≤ 10⁹，\|c\| ≤ 10⁹ |
| `i`、`j` | 0 ≤ i, j < n，保证合法 |
| 时间复杂度 | 每次查询 O(1)，总计 O(n² + q) |
| 空间复杂度 | O(n²)（压缩数组本身） |
| 评测时限 | `timeMs = 2000`、`outputKb = 1024`（均为默认值） |

**关于规模与限制：** `q = 10⁴` 行、每行最多两个 11 位数，输出约 0.15 MB，远低于 `outputKb = 1024` 的上限，因此本题沿用默认时限与输出上限。`n = 300` 时压缩数组有 45150 个元素，输入约 0.1 MB，按下面的方法关掉同步或快速读入就能稳定通过；`n` 的上界取 300 而不是更大，是为了在保留"大矩阵 + 大量查询"考点的同时控制测试数据体积。

## 样例

### 样例输入 1

```input
3
1 2 3 4 5 6
-1
4
0 0
0 2
1 2
2 0
```

### 样例输出 1

```output
1 1
3 3
5 5
0 -1
```

### 样例输入 2

```input
4
1 2 3 4 5 6 7 8 9 10
-7
3
0 3
2 3
3 0
```

### 样例输出 2

```output
4 4
9 9
0 -7
```

### 样例输入 3

```input
1
42
-5
1
0 0
```

### 样例输出 3

```output
1 42
```

### 样例解释

**样例 1：** `n = 3`，压缩数组 `1 2 3 4 5 6` 按行优先对应上三角

- 第 0 行：`A[0][0] = 1`、`A[0][1] = 2`、`A[0][2] = 3`；
- 第 1 行：`A[1][1] = 4`、`A[1][2] = 5`；
- 第 2 行：`A[2][2] = 6`。

完整矩阵为（下三角区域全部是常量 `c = −1`）

$$
A=\begin{pmatrix}
1 & 2 & 3\\
-1 & 4 & 5\\
-1 & -1 & 6
\end{pmatrix}.
$$

- 查询 `0 0`：`i = j`（对角线上，属于上三角），`k = 0×(6−0+1)/2 + (0−0) + 1 = 1`，取压缩数组第 1 项 `1`，输出 `1 1`；
- 查询 `0 2`：`i < j`，`k = 0×7/2 + (2−0) + 1 = 3`，取第 3 项 `3`，输出 `3 3`；
- 查询 `1 2`：`i < j`，前 `1` 行有 `1×(6−1+1)/2 = 3` 个元素，`k = 3 + (2−1) + 1 = 5`，取第 5 项 `5`，输出 `5 5`；
- 查询 `2 0`：`i > j`，落在未存储的下三角，`k = 0`、值为常量 `c = −1`，输出 `0 -1`。

前三个查询分别覆盖了 `i = j`、`i < j`，第四个覆盖 `i > j`，三种情形都出现了。

**样例 2：** `n = 4`，压缩数组 `1 2 3 4 5 6 7 8 9 10` 按行优先切成四行：第 0 行 `1 2 3 4`，第 1 行 `5 6 7`，第 2 行 `8 9`，第 3 行 `10`。

- 查询 `0 3`：前 `0` 行共 `0` 个元素，`k = 0 + (3−0) + 1 = 4`，取第 4 项 `4`，输出 `4 4`；
- 查询 `2 3`：前 `2` 行共 `2×(8−2+1)/2 = 7` 个元素，`k = 7 + (3−2) + 1 = 9`，取第 9 项 `9`，输出 `9 9`；
- 查询 `3 0`：`i > j`，`k = 0`、值 `= c = −7`，输出 `0 -7`。

注意样例 2 中 `k = 4` 正好是第 0 行的最后一个元素，`k = 9` 逼近压缩数组末尾（总长 `10`），说明公式在两个方向上都对得上。

**样例 3：** `n = 1` 时上三角只有一个元素，压缩数组长度为 1，唯一的查询 `0 0` 必然对应 `k = 1`、值 `42`。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-18-upper-triangular-compress
pnpm lab:run -- labs/chapter-03/exercise/E-03-18-upper-triangular-compress
pnpm lab:score -- labs/chapter-03/exercise/E-03-18-upper-triangular-compress
```

- [ ] 样例通过；
- [ ] `i > j`、`i = j`、`i < j` 三种位置都有证据；
- [ ] `n = 1`、全对角查询、全上三角（`i < j`）查询、全下三角（`i > j`）查询四种边界都有证据；
- [ ] 负值与 `±10⁹` 的取值有证据（尤其 `i > j` 时要输出常量 `c`，而不是 `0`）；
- [ ] 使用 `sync_with_stdio(false)`/快速读入，能在 `timeMs = 2000` 内跑完 `n = 300`、`q = 10⁴` 的最大输入。

## 思考题

1. 公式 `k = i(2n−i+1)/2 + (j−i) + 1` 是怎么推出来的？如果把上三角改成**列优先**存放，`k` 会变成什么？和 03E13 的下三角行优先公式有什么对应关系？
2. 对称矩阵和三角矩阵都只需要 `n(n+1)/2` 个存储单元，两者的压缩方案能互换吗？如果同一个矩阵既是“上三角全为常数”又是“下三角全为常数”，它是什么矩阵？还需要压缩吗？
3. `k = 0` 被用作“未存储”的标记。合法下标从 `1` 开始，所以这个约定不会与真实下标冲突——请说明为什么不能反过来把“未存储”记为 `k = n(n+1)/2 + 1`。
4. 如果查询改为“求矩阵第 `i` 行的所有元素之和”，在本题的压缩存储下你还能做到每次查询 `O(1)` 吗？需要预处理什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

对 `i ≤ j` 的查询，压缩数组里排在 `A[i][j]` 之前的元素分两部分：第 `0` 行到第 `i−1` 行的上三角元素共 `i(2n−i+1)/2` 个（第 `r` 行有 `n−r` 个），以及第 `i` 行中 `A[i][i..j−1]` 共 `j−i` 个。所以 `A[i][j]` 之前有 `i(2n−i+1)/2 + (j−i)` 个元素，换成题目要求的 1-based 下标就是 `k = i(2n−i+1)/2 + (j−i) + 1`。读入时把压缩数组按 1-based 存好，查询时直接取 `packed[k]`。

对 `i > j` 的查询，下三角区域根本没有存进数组，所以 `k = 0`，值直接输出常量 `c`。注意这一步**不能**去 `packed` 里取元素：`k` 既不是 `i(i+1)/2+j+1` 那类对称公式的结果，更不是任何真实下标。

### 复杂度分析

读入压缩数组 `O(n²)`，每次查询只用一次乘法、一次除法和一次数组访问，是 `O(1)`；总时间 `O(n² + q)`。空间只需保存压缩数组的 `n(n+1)/2` 个元素，即 `O(n²)`，不需要展开成完整的 `n×n` 矩阵。

### 边界注意

- `n = 1`：压缩数组长度为 1，唯一合法的查询是 `(0, 0)`，`k = 1`；
- `i = j`：落在主对角线上，仍属于上三角，必须走正常寻址分支（不能因为“看着像下三角”就返回 `c`）；
- `i > j`：最容易出错的地方——`k` 是 `0`，值必须输出常量 `c`，而不是 `0`、也不是压缩数组里别的元素；
- `n = 300` 时 `k` 最大为 `45150`，`i(2n−i+1)/2` 在 32 位整数内安全，但元素值与常量最小可达 `−10⁹`，建议用 `long long` 存；
- 输入的压缩数组可以跨多行，按空白分隔逐个读入即可，不要按行读取；
- 本题不涉及错误输入：`i`、`j` 始终合法，也不会出现 `n = 0`。

### 参考代码

```cpp
#include <cstdio>
#include <string>
#include <vector>

namespace {

// 快速读入：一次读入一整块到缓冲区，再按字符解析整数，
// 避免对最多 45150 个整数逐个做格式化输入。
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

    // 压缩数组用 1-based 下标：packed[k] 就是上三角第 k 个元素。
    std::vector<long long> packed(static_cast<std::size_t>(total) + 1, 0);
    for (long long k = 1; k <= total; ++k) {
        packed[static_cast<std::size_t>(k)] = scanner.nextInt();
    }

    // 下三角区域不存储，取值恒为常量 c。
    const long long constant = scanner.nextInt();
    const long long q = scanner.nextInt();

    // 先拼进输出缓冲再一次写出，q 最大 2×10^4 行。
    std::string output;
    output.reserve(static_cast<std::size_t>(q) * 24);
    char line[48];
    for (long long t = 0; t < q; ++t) {
        const long long i = scanner.nextInt();
        const long long j = scanner.nextInt();

        long long k = 0;
        long long value = constant;
        if (i <= j) {
            // 前 i 行（第 0 行到第 i−1 行）共有 i(2n−i+1)/2 个元素，
            // 再加上本行的 j−i 个，最后换成 1-based。
            k = i * (2 * n - i + 1) / 2 + (j - i) + 1;
            value = packed[static_cast<std::size_t>(k)];
        }

        const int length = std::snprintf(line, sizeof(line), "%lld %lld\n", k, value);
        output.append(line, static_cast<std::size_t>(length));
    }
    std::fwrite(output.data(), 1, output.size(), stdout);
    return 0;
}
```

</details>
