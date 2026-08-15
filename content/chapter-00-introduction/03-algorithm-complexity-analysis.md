---
title: "0.3 算法复杂度与算法分析"
description: "从输入规模和基本操作出发，推导常见算法的时间与辅助空间复杂度。"
order: 3
chapter: 0
chapterTitle: "绪论"
updated: "2026-08-12"
contributors: ["Azen"]
status: "draft"
---

# 0.3 算法复杂度与算法分析

## 学习目标

完成本节后，你应该能够：

- 说明为什么不能只用运行秒数评价算法；
- 为一个简单问题选择合理的输入规模；
- 计算常见代码片段的时间复杂度；
- 判断常见复杂度的增长速度；
- 分析辅助空间和递归调用栈；
- 区分最好、最坏和平均情况。

## 为什么要分析算法

假设两段程序都能正确完成学生查找任务：程序 A 从头到尾比较学号，程序 B 每一步排除一半候选记录。数据只有十条时，两者可能都在瞬间结束；数据增长到一百万条时，差距会明显扩大。

直接用秒表计时并不能给出稳定结论，因为结果还会受到计算机性能、编译器、编程语言、系统负载和测试数据的影响。我们需要一种与具体机器相对独立的方法，描述算法所需工作量如何随问题规模增长。

算法首先必须得到正确结果并在规定条件下结束。在此前提下，我们再评价：

- 执行过程中需要完成多少工作；
- 需要多少额外内存；
- 输入规模增大时，工作量怎样增长；
- 算法依赖什么前提，适合什么场景。

::: tip 关键结论
复杂度描述的是资源消耗随输入规模增长的趋势，不是某次运行的秒数。理论分析与实际测量相互补充，但不能互相替代。
:::

## 算法分析的基本方法

分析一段算法时，固定按照下面的步骤进行：

1. **确定输入规模**：说明 `n`、`m` 等变量分别表示什么。
2. **选择基本操作**：找出能够代表主要工作的比较、赋值、访问或算术操作。
3. **计算执行次数**：写出基本操作次数与输入规模的关系。
4. **区分输入情况**：说明讨论的是最好、最坏还是平均情况。
5. **保留主要增长项**：忽略不改变增长阶的低阶项和常数因子。
6. **分析额外空间**：说明统计的是辅助空间还是包含输入的总空间。
7. **写出完整结论**：同时给出前提、时间和空间结论。

例如，“顺序查找是 `O(n)`”还不够完整。更清楚的说法是：“令 `n` 为元素个数，以元素比较为基本操作；目标不存在时需要比较 `n` 次，因此最坏时间复杂度为 $\Theta(n)$，算法只使用常数个额外变量，辅助空间复杂度为 $\Theta(1)$。”

## 时间复杂度

时间复杂度用基本操作执行次数的增长阶描述算法的时间需求。下面依次观察五种常见形态。

### 常数时间：O(1)

```cpp{2} [first-score.cpp]
int first_score(const int* scores) {
    return scores[0];
}
```

这里令输入规模 `n` 为成绩个数，并假设 `n > 0`。读取首元素只执行一次下标访问，次数不随 `n` 增长，所以时间复杂度为 $\Theta(1)$。`O(1)`不表示“只执行一条机器指令”，而表示操作次数被某个常数界定。

### 线性时间：O(n)

```cpp:line-numbers [sum-scores.cpp]
#include <vector>

long long sum_scores(const std::vector<int>& scores) {
    long long total = 0;
    for (int score : scores) { // [!code highlight]
        total += score;        // [!code highlight]
    }
    return total;
}
```

令 `n` 为 `scores` 中的元素个数，以加法 `total += score` 为基本操作。循环对每个元素执行一次加法，共执行 `n` 次，因此时间复杂度为 $\Theta(n)$，辅助空间复杂度为 $\Theta(1)$。

### 平方时间：O(n²)

```cpp:line-numbers [count-equal-pairs.cpp]
#include <cstddef>
#include <vector>

std::size_t count_equal_pairs(const std::vector<int>& values) {
    std::size_t count = 0;
    for (std::size_t i = 0; i < values.size(); ++i) {
        for (std::size_t j = i + 1; j < values.size(); ++j) { // [!code highlight]
            if (values[i] == values[j]) {                    // [!code highlight]
                ++count;
            }
        }
    }
    return count;
}
```

令 `n` 为元素个数，以 `values[i] == values[j]` 为基本操作。第一个元素与后面 `n-1` 个元素比较，第二个与后面 `n-2` 个比较，直到最后没有后继元素。总比较次数为

$$
(n-1)+(n-2)+\cdots+1=\frac{n(n-1)}{2}.
$$

保留最高次项后，时间复杂度为 $\Theta(n^2)$；函数只使用常数个计数变量，辅助空间复杂度为 $\Theta(1)$。

### 对数时间：O(log n)

下面的二分查找要求输入已经按非递减顺序排列。

```cpp:line-numbers [binary-contains.cpp]
#include <cstddef>
#include <vector>

bool binary_contains(const std::vector<int>& sorted_values, int target) {
    std::size_t left = 0;
    std::size_t right = sorted_values.size();

    while (left < right) { // [!code highlight]
        const std::size_t middle = left + (right - left) / 2;
        if (sorted_values[middle] < target) {
            left = middle + 1;
        } else {
            right = middle;
        }
    }

    return left < sorted_values.size() && sorted_values[left] == target;
}
```

令 `n` 为元素个数。每轮循环把候选区间缩小到原来的一半。经过 `k` 轮后，候选规模至多为 $n / 2^k$；当它缩小到 1 时，`k` 与 $\log_2 n$ 同阶。因此最坏时间复杂度为 $\Theta(\log n)$，辅助空间复杂度为 $\Theta(1)$。

### 线性对数时间：O(n log n)

下面的函数不执行排序，只用计数模拟“每一层完整处理一次输入”的工作形态，例如自底向上的归并过程。

```cpp:line-numbers [count-level-visits.cpp]
#include <cstddef>
#include <vector>

std::size_t count_level_visits(const std::vector<int>& values) {
    std::size_t visits = 0;

    for (std::size_t width = 1; width < values.size();) { // [!code highlight]
        for (std::size_t i = 0; i < values.size(); ++i) { // [!code highlight]
            ++visits;
        }
        if (width > values.size() / 2) {
            break;
        }
        width *= 2;
    }
    return visits;
}
```

令 `n` 为元素个数。外层的 `width` 每轮翻倍，共有 $\Theta(\log n)$ 层；每层内循环访问全部 `n` 个元素，工作量为 $\Theta(n)$。两者相乘得到 $\Theta(n \log n)$。函数本身只使用常数个额外变量，因此辅助空间复杂度为 $\Theta(1)$。

## 渐近表示法

渐近记号把注意力放在 `n` 足够大时的增长趋势。设 `T(n)` 表示某项资源消耗，`f(n)` 是用于比较的非负函数。

::: info 渐近记号的形式定义
如果存在常数 $c>0$ 和 $n_0$，使得对所有 $n\ge n_0$ 都有

$$
0\le T(n)\le c f(n),
$$

则记为 $T(n)=O(f(n))$，表示渐近上界。

如果存在常数 $c>0$ 和 $n_0$，使得对所有 $n\ge n_0$ 都有

$$
0\le c f(n)\le T(n),
$$

则记为 $T(n)=\Omega(f(n))$，表示渐近下界。

如果存在常数 $c_1,c_2>0$ 和 $n_0$，使得对所有 $n\ge n_0$ 都有

$$
0\le c_1 f(n)\le T(n)\le c_2 f(n),
$$

则记为 $T(n)=\Theta(f(n))$，表示渐近紧确界。
:::

直观地说，大 O 说明“增长得不会比某个量级更快”，大 Ω 说明“增长得不会比某个量级更慢”，大 Θ 则说明上下两边都由同一个量级限制。

例如，若 $T(n)=3n+5$，当 $n\ge1$ 时有 $3n\le T(n)\le8n$，因此 $T(n)=\Theta(n)$。它当然也属于 $O(n^2)$，但 $\Theta(n)$更准确地描述了增长阶。

::: warning 记号不等于输入情况
大 O 本身表示上界，并不天然等于“最坏情况”；最好、最坏和平均描述输入情况，O、Ω、Θ描述函数之间的渐近界。教材和工程讨论常用大 O 简写增长阶，阅读时仍要确认上下文。
:::

## 常见复杂度的增长速度

| 数量级 | 直观增长方式 | 典型形态 | 输入增大后的影响 |
| --- | --- | --- | --- |
| `O(1)` | 工作量受常数限制 | 按下标访问 | 规模增长几乎不改变操作次数 |
| `O(log n)` | 每步排除固定比例 | 二分查找 | 输入翻倍只增加少量步骤 |
| `O(n)` | 每个元素处理常数次 | 完整扫描 | 输入翻倍，工作量约翻倍 |
| `O(n log n)` | 对数层、每层线性工作 | 高效比较排序 | 比线性增长快，但远低于平方增长 |
| $O(n^2)$ | 大量元素对被处理 | 两两比较 | 输入翻倍，工作量约变为四倍 |
| $O(2^n)$ | 每增加一个元素，候选组合近似翻倍 | 枚举子集 | 只能处理较小输入 |
| `O(n!)` | 枚举所有排列 | 穷举排列 | 很小的规模增长也会急剧放大工作量 |

因此，常见增长速度从慢到快排列为：

$$
O(1)<O(\log n)<O(n)<O(n\log n)<O(n^2)<O(2^n)<O(n!).
$$

这个顺序比较的是增长趋势，而不是任何输入规模下的实际耗时。对于很小的 `n`，常数因子、缓存行为和实现质量仍可能决定真实速度。

## 顺序、分支与循环的分析规则

### 顺序执行

若两个代码段依次执行，时间代价相加。例如前半段执行 `3n` 次操作，后半段执行 $n^2$ 次操作，总次数是 $n^2+3n$，增长阶为 $\Theta(n^2)$。

### 条件分支

分析最坏情况时，通常关注所有可达分支中代价最大的路径；分析最好情况时则关注代价最小的合法路径。平均情况还需要说明各类输入出现的概率。

### 嵌套循环

不能只看到两层循环就断定为 $O(n^2)$。下面的外层执行 `n` 次，内层每次把 `remaining` 除以 2，因此内层为 $\Theta(\log n)$，总时间为 $\Theta(n \log n)$。

```cpp:line-numbers [nested-log-loop.cpp]
#include <cstddef>

std::size_t count_steps(std::size_t n) {
    std::size_t steps = 0;
    for (std::size_t i = 0; i < n; ++i) {
        for (std::size_t remaining = n; remaining > 1; remaining /= 2) { // [!code highlight]
            ++steps;
        }
    }
    return steps;
}
```

### 多个输入规模

如果算法分别遍历长度为 `n` 和 `m` 的两个独立输入，总时间通常写成 $\Theta(n+m)$；如果对第一个输入的每个元素都遍历第二个输入，则写成 $\Theta(nm)$。除非已知 `m` 与 `n` 的关系，否则不能擅自把它们合并成一个变量。

## 最好、最坏和平均情况

以顺序查找为例：

```cpp:line-numbers [linear-search.cpp]
#include <cstddef>
#include <optional>
#include <vector>

std::optional<std::size_t> linear_search(
    const std::vector<int>& values,
    int target
) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (values[i] == target) { // [!code highlight]
            return i;
        }
    }
    return std::nullopt;
}
```

令 `n` 为元素个数，以相等比较为基本操作：

- **最好情况**：第一个元素就是目标，只比较 1 次，时间复杂度为 $\Theta(1)$。
- **最坏情况**：目标不存在或位于最后一个位置，需要比较 `n` 次，时间复杂度为 $\Theta(n)$。
- **平均情况**：如果已知查找一定成功，并且目标等概率出现在每个位置，期望比较次数为 $(n+1)/2$，时间复杂度为 $\Theta(n)$。

平均情况的结论依赖“查找成功且位置均匀分布”这一假设。若目标不存在的概率、位置分布或数据生成方式不同，期望比较次数也会改变。

## 空间复杂度

空间分析需要先说明统计口径。本节主要计算算法在输入之外使用的**辅助空间**。

### 常数辅助空间

```cpp{2-4} [swap-first-two.cpp]
#include <vector>

void swap_first_two(std::vector<int>& values) {
    const int temporary = values[0];
    values[0] = values[1];
    values[1] = temporary;
}
```

假设输入至少有两个元素。无论输入向量多长，函数都只增加一个 `temporary` 变量，因此辅助空间复杂度为 $\Theta(1)$。输入向量本身占用 $\Theta(n)$ 空间，但它不是此算法额外申请的空间。

### 递归调用栈

```cpp:line-numbers [recursive-sum.cpp]
#include <cstddef>
#include <vector>

long long recursive_sum(const std::vector<int>& values, std::size_t count) {
    if (count == 0) {
        return 0;
    }
    return recursive_sum(values, count - 1) + values[count - 1]; // [!code highlight]
}
```

假设 $0 \le n \le values.size()$。调用 `recursive_sum(values, n)` 时，每一层把 `count` 减 1，直到 0，共产生 `n+1` 层调用。每层只保存常数规模的局部状态，所以调用栈的辅助空间为 $\Theta(n)$；每个元素参与一次加法，时间复杂度也为 $\Theta(n)$。

## 完整分析例题

### 题面

下面的函数判断数组中是否存在两个值相等的元素，请完整分析它的时间与辅助空间复杂度。

```cpp:line-numbers [has-duplicate.cpp]
#include <cstddef>
#include <vector>

bool has_duplicate(const std::vector<int>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        for (std::size_t j = i + 1; j < values.size(); ++j) {
            if (values[i] == values[j]) { // [!code highlight]
                return true;
            }
        }
    }
    return false;
}
```

### 按分析模板推导

1. **输入规模**：令 `n` 为 `values` 中的元素个数。
2. **基本操作**：选择 `values[i] == values[j]` 这一相等比较。
3. **执行次数**：若没有重复值，需要比较所有无序元素对，共 $n(n-1)/2$ 次。
4. **输入情况**：如果前两个元素相等，只比较 1 次；如果不存在重复值，执行全部比较。没有给出数据分布时，不武断给出平均次数。
5. **保留主要增长项**：$n(n-1)/2=(n^2-n)/2$，最高次项为 $n^2$。
6. **额外空间**：只使用 `i`、`j` 等常数个局部变量。
7. **完整结论**：最好时间复杂度为 $\Theta(1)$，最坏时间复杂度为 $\Theta(n^2)$，辅助空间复杂度为 $\Theta(1)$。函数不要求输入有序，但当 `n` 很大时，可能需要用额外存储换取更低的期望查找时间。

::: details 为什么不直接写“平均时间复杂度”
平均情况必须建立输入分布模型，例如元素取值范围、重复值出现概率以及重复位置。题目没有提供这些信息，因此只能可靠地给出最好和最坏情况，而不能凭感觉声称平均为某个数量级。
:::

## 常见误区

::: warning 易错点
- **“`O(n)`表示运行 `n` 秒。”** 复杂度描述操作次数的增长上界，不是时间单位。
- **“忽略常数，所以常数完全不重要。”** 常数不改变渐近增长阶，但会影响实际运行时间和小规模输入。
- **“两层循环一定是 $O(n^2)$。”** 内层若每次把规模减半，总复杂度可能是 $\Theta(n \log n)$。
- **“`O(n+m)`总能写成`O(n)`。”** 只有已知 `m` 被 `n` 的常数倍约束时才能这样简化。
- **“对数底数不同会产生不同渐近阶。”** 换底只带来常数因子，因此渐近表示通常省略底数。
- **“有提前返回的算法只有一个复杂度。”** 提前返回会产生不同的最好、最坏和平均输入情况。
- **“复杂度更低就一定更好。”** 还要考虑前置条件、常数、空间、实现难度和真实输入规模。
- **“理论分析可以代替测试。”** 分析说明增长趋势，测试用于发现实现错误并观察真实环境因素。
:::

例如，把下面的代码判断为 $\Theta(n^2)$就是机械套用“两个循环”：

```cpp
for (std::size_t i = 0; i < n; ++i) {
    for (std::size_t remaining = n; remaining > 1; remaining /= 2) {
        // 常数次操作
    }
}
```

修正过程是：先分别计算每层次数。外层为 `n`，内层为 $\log_2 n$，所以总复杂度为 $\Theta(n \log n)$。

## 小结与练习入口

面对一段新算法，可以反复使用下面的分析路径：

`确定输入规模 → 找基本操作 → 计算次数 → 区分输入情况 → 保留主项 → 分析额外空间 → 写出结论`

### 自测题

1. 读取长度为 `n` 的数组首尾元素并相加，时间复杂度是多少？
2. 一个循环变量从 `n` 开始，只要它大于 1 就执行循环体，每轮再整除 2。假设 $n \ge 1$，循环执行多少轮？
3. 两层循环中，内层从 `i+1` 执行到 `n-1`，总执行次数和增长阶分别是什么？
4. 对长度分别为 `n`、`m` 的两个数组做两两比较，时间复杂度是什么？
5. 一个递归函数每层处理一个元素并递归到下一个元素，它可能需要多少调用栈空间？

::: details 查看参考答案
1. 只进行固定次数的访问和加法，时间复杂度为 $\Theta(1)$。
2. 执行 $\lfloor\log_2 n\rfloor$ 轮，增长阶为 $\Theta(\log n)$。
3. 总次数为 $(n-1)+(n-2)+\cdots+1=n(n-1)/2$，增长阶为 $\Theta(n^2)$。
4. 每个第一个数组元素都与第二个数组的全部元素比较，共 `nm` 次，时间复杂度为 $\Theta(nm)$。
5. 如果递归深度随元素个数线性增长，调用栈辅助空间通常为 $\Theta(n)$。
:::

接下来可以完成[Lab 00-02：用操作计数观察增长趋势](../../labs/chapter-00/lab-00-02-operation-counter/README.md)，用实验数据观察不同增长阶。复杂度代码片段选择题将在后续 Lab 中补充。
