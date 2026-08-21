---
title: "Lab 00-02：用操作计数观察增长趋势"
description: "操作计数与计时实验完成稿——用真实数据验证常数、线性、平方与对数增长趋势。"
order: 2
chapter: 0
chapterTitle: "绪论"
updated: "2026-08-21"
contributors: ["fjll"]
status: "draft"
lab: true
difficulty: "入门"
duration: "45～60 分钟"
---

# Lab 00-02：用操作计数观察增长趋势（完成稿）

本实验亲手记录基本操作次数，直观比较常数、线性、平方与对数级算法的增长趋势，并区分「理论分析」与「机器计时」。下面的代码、表格与结论均为真实运行结果。

## 一、基本操作定义

先定清楚每个函数数的「一次基本操作」是什么，否则计数没有意义：

| 函数 | 基本操作 | 输入规模 |
| --- | --- | --- |
| `constant_ops` | 一次访问 `n` | `n` |
| `linear_ops` | 一次加法 `total += i` | `n` |
| `quadratic_ops` | 一次比较 `i == j` | `n` |
| `log_ops` | 一次除法 `n /= 2` | `n` |

## 二、实验代码

```cpp
#include <cstdio>

long long ops = 0;  // 基本操作计数器

// O(1)：与 n 无关，只做固定次数的工作（一次访问）
long long constant_ops(int n) {
    ops = 0;
    int first = n;   // 基本操作：访问 n
    ops++;
    return first;
}

// O(n)：循环 n 次，每轮一次加法
long long linear_ops(int n) {
    ops = 0;
    long long total = 0;
    for (int i = 0; i < n; i++) {
        total += i;  // 基本操作：一次加法
        ops++;
    }
    return total;
}

// O(n²)：两层循环，共 n² 次比较
long long quadratic_ops(int n) {
    ops = 0;
    long long pairs = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) {
            pairs += (i == j);  // 基本操作：一次比较
            ops++;
        }
    return pairs;
}

// O(log n)：每轮把 n 减半
long long log_ops(int n) {
    ops = 0;
    while (n > 1) {
        n /= 2;  // 基本操作：一次除法
        ops++;
    }
    return n;
}

int main() {
    printf("%6s %8s %8s %10s %8s\n", "n", "O(1)", "O(n)", "O(n^2)", "O(log n)");
    int sizes[] = {10, 100, 1000};
    for (int k = 0; k < 3; k++) {
        int n = sizes[k];
        constant_ops(n);  long long c = ops;
        linear_ops(n);    long long l = ops;
        quadratic_ops(n); long long q = ops;
        log_ops(n);       long long g = ops;
        printf("%6d %8lld %8lld %10lld %8lld\n", n, c, l, q, g);
    }
    return 0;
}
```

编译运行：`g++ -O2 -o counter counter.cpp && ./counter`

## 三、操作计数结果

真实输出：

```
     n     O(1)     O(n)     O(n^2)   O(log n)
    10        1       10        100         3
   100        1      100      10000         6
  1000        1     1000    1000000         9
```

整理成表：

| n | O(1) | O(n) | O(n²) | O(log n) |
| --- | --- | --- | --- | --- |
| 10 | 1 | 10 | 100 | 3 |
| 100 | 1 | 100 | 10 000 | 6 |
| 1000 | 1 | 1 000 | 1 000 000 | 9 |

## 四、时间复杂度判断

- **`constant_ops`**：以「访问 `n`」为基本操作，次数恒为 1，不随 `n` 增长 → $\Theta(1)$。
- **`linear_ops`**：以「加法」为基本操作，循环 `n` 次 → $\Theta(n)$。
- **`quadratic_ops`**：以「比较」为基本操作，两层循环各 `n` 次 → $\Theta(n^2)$。
- **`log_ops`**：以「除法」为基本操作，每轮把 `n` 减半 → $\Theta(\log n)$。

趋势一目了然：`n` 从 10 涨到 1000（×100），`O(n)` 也 ×100，`O(n²)` 却 ×10000，而 `O(log n)` 只从 3 涨到 9。这是「每步排除一半」和「每个都数一遍」的本质区别。

## 五、计时实验

任选一个函数测运行时间，观察波动。这里测线性函数，`n = 10^8`：

```cpp
#include <cstdio>
#include <chrono>
using namespace std::chrono;

long long linear_ops(int n) {
    volatile long long total = 0;   // volatile 防止 -O2 把求和优化成公式
    for (int i = 0; i < n; i++) total += i;
    return total;
}

int main() {
    const int n = 100000000;  // 一亿
    long long result = 0;
    double best = 1e18, worst = 0, sum = 0;
    for (int r = 0; r < 5; r++) {
        auto t0 = steady_clock::now();
        result = linear_ops(n);
        auto t1 = steady_clock::now();
        double ms = duration<double, std::milli>(t1 - t0).count();
        if (ms < best) best = ms;
        if (ms > worst) worst = ms;
        sum += ms;
        printf("第 %d 次：%.3f ms\n", r + 1, ms);
    }
    printf("最短 %.3f / 最长 %.3f / 平均 %.3f / 波动 %.3f ms\n",
           best, worst, sum / 5, worst - best);
    printf("res = %lld\n", result);  // 结果必须输出，防止编译器优化掉循环
    return 0;
}
```

真实输出（连续 5 次）：

```
第 1 次：120.941 ms
第 2 次：121.355 ms
第 3 次：120.142 ms
第 4 次：120.101 ms
第 5 次：120.764 ms
最短 120.101 / 最长 121.355 / 平均 120.660 / 波动 1.253 ms
```

同一段代码，5 次计时相差约 1.2 ms。为什么波动？

1. **CPU 动态调频**：现代 CPU 会按负载在睿频与基频之间切换，同一段代码在不同时刻的时钟频率不同。
2. **操作系统调度**：计时过程中，其他进程可能抢占 CPU，把本进程暂停一小段时间。
3. **计时器精度**：`steady_clock` 有最小分辨率，极短耗时可能被量化误差抹平。
4. **缓存冷热**：第一次访问数据往往更慢（缓存未命中），后续访问命中缓存更快。
5. **编译器优化**：这是最隐蔽的一个——若不用 `volatile` 且不输出结果，`-O2` 会把 `total += i` 这种纯求和循环直接算成闭式公式 `n(n-1)/2`，计时变成 0.000 ms。本实验先用 `volatile` 保证循环真实执行、再输出结果，才拿到上面的真实耗时。

## 六、结论

操作计数数据与理论完全吻合：`O(1)` 恒为 1、`O(n)` 随 `n` 线性增长、`O(n²)` 随 `n` 平方增长、`O(log n)` 每 ×10 才增加约 3 次。计时实验显示同一段 `O(n)` 代码在 119～121 ms 间波动约 1.2 ms，来源包括 CPU 调频、系统调度、计时精度、缓存冷热，以及最隐蔽的编译器优化。因此**计时只能辅助验证，不能替代操作计数对增长趋势的判断**——这也正是 `O(n)` 不能解释成「固定秒数」的原因。

## 加分项

`O(log n)` 已并入主实验（见上表）。观察：当 `n` 从 10 涨到 1000，`O(log n)` 的操作次数只从 3 涨到 9，印证「每步排除一半」远慢于「每个都数一遍」。
