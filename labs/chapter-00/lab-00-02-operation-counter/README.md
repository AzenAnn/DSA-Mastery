---
title: "Lab 00-02：用操作计数观察增长趋势"
description: "用基本操作计数直观比较常数、线性与平方级增长，并区分理论分析与机器计时。"
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

# Lab 00-02：用操作计数观察增长趋势

## 目标

大 O 记的从来不是「秒数」，而是「基本操作执行了多少次」。本 Lab 让你亲手把这句话跑出来：写三个函数，让它们的基本操作次数分别近似 `1`、`n` 和 `n²`，再把结果填成一张表，亲眼看到增长趋势的差距，而不是记住一句「平方比线性快」。

完成本 Lab 后，你应该能：

- 说清「时间复杂度」数的是**基本操作的次数**，不是运行时间；
- 用自己的实验数据验证 `O(1)`、`O(n)`、`O(n²)` 的增长趋势；
- 说明为什么同一段代码的计时会波动，以及该怎样测才更稳。

## 建议用时

45～60 分钟。跑代码本身只要几分钟，大部分时间应花在「预测 → 验证 → 解释偏差」上。

## 前置知识

- 会写最基础的循环（`for`）即可；
- 读过 0.3 节，知道「基本操作」「输入规模」「增长阶」这三个词各指什么；
- 参考代码用 C++，你也可以用 Python / Java，但**计数器必须是自己显式写的**，不能靠语言或工具替你数。

## 先预测，再验证

跑代码之前，先在纸上填出你对 `n = 1000` 的预测：

| 函数 | 你预测它执行多少次基本操作 |
| --- | --- |
| 常数（O(1)） | ______ |
| 线性（O(n)） | ______ |
| 平方（O(n²)） | ______ |

填完再跑代码，看差在哪。如果预测错了，错的那一步，就是你对「循环次数」理解里真实的漏洞——这正是本 Lab 要抓出来的东西。

## 任务

1. 编写三个小函数，使基本操作次数分别近似为 `1`、`n` 和 `n²`。
2. 对 `n = 10、100、1000` 记录操作次数；过慢时可以减小最大输入。
3. 将结果整理为表格，写出每个函数的时间复杂度判断。
4. 任选一个函数测量运行时间，说明计时为何可能波动。

## 参考实现

先定清楚每个函数数的「一次基本操作」是什么，否则计数没有意义：

| 函数 | 基本操作 | 输入规模 |
| --- | --- | --- |
| `constant_ops` | 一次访问 `n` | `n` |
| `linear_ops` | 一次加法 `total += i` | `n` |
| `quadratic_ops` | 一次比较 `i == j` | `n` |
| `log_ops` | 一次除法 `n /= 2` | `n` |

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

// O(log n)：每轮把 n 减半（加分项）
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

## 参考结果

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

趋势一目了然：`n` 从 10 涨到 1000（×100），`O(n)` 也 ×100，`O(n²)` 却 ×10000，而 `O(log n)` 只从 3 涨到 9。

## 时间复杂度判断

- **`constant_ops`**：以「访问 `n`」为基本操作，次数恒为 1，不随 `n` 增长 → $\Theta(1)$。
- **`linear_ops`**：以「加法」为基本操作，循环 `n` 次 → $\Theta(n)$。
- **`quadratic_ops`**：以「比较」为基本操作，两层循环各 `n` 次 → $\Theta(n^2)$。
- **`log_ops`**：以「除法」为基本操作，每轮把 `n` 减半 → $\Theta(\log n)$。

## 计时实验：为什么结果会波动

任选一个函数测运行时间。这里测线性函数，`n = 10^8`：

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

同一段代码，5 次计时相差约 1.2 ms。波动来自：

1. **CPU 动态调频**：CPU 按负载在睿频与基频间切换，不同时刻时钟频率不同；
2. **操作系统调度**：其他进程可能抢占 CPU，把本进程暂停一小段时间；
3. **计时器精度**：`steady_clock` 有最小分辨率，极短耗时可能被量化误差抹平；
4. **缓存冷热**：第一次访问往往更慢（缓存未命中），后续命中更快；
5. **编译器优化**：最隐蔽的一个——若不用 `volatile` 且不输出结果，`-O2` 会把 `total += i` 这种纯求和循环算成闭式公式 `n(n-1)/2`，计时变成 0.000 ms。

## 约束

- 基本操作必须是你**自己定义并显式计数**的，不能直接 `printf` 一个数糊弄；
- 计数器统计的必须是明确写出的基本操作，而不是「循环变量的自增」；
- 计时必须用墙钟时间（`chrono` 或 `clock_gettime`），不能用操作次数反推「耗时」；
- 计时的结果必须输出到屏幕上，否则编译器会优化掉整个循环。

## 验收标准

- [ ] 三个函数的计数器统计的是明确写出的基本操作（代码里能看到「基本操作 + 紧邻的 `ops++`」）；
- [ ] 实验至少包含 `n = 10、100、1000` 三组（若减小最大输入，已写明减到多少、为什么）；
- [ ] 表格里 O(1) 一列恒为常数、O(n) 一列约等于 `n`、O(n²) 一列约等于 `n²`（趋势一致）；
- [ ] 每个函数都写明了时间复杂度，且写清了「以什么为基本操作、以什么为输入规模」；
- [ ] 计时至少跑了 2 次，并说明为何取最小/平均，而不是只跑一次就下结论；
- [ ] 结论里没有把 `O(n)` 说成「固定秒数」；
- [ ] 至少指出一个计时误差来源（如 CPU 负载、编译器优化、计时精度、缓存）。

## 加分项

`O(log n)` 已并入主实验（见上表）。观察：当 `n` 从 10 涨到 1000，`O(log n)` 的操作次数只从 3 涨到 9，印证「每步排除一半」远慢于「每个都数一遍」。

## Review 提示

审阅者可把 `n` 加到 `10000` 看平方函数是否明显变慢、把计时函数连续多跑几遍看波动；或检查被计数的「基本操作」是否真的和算法工作相关（而不是在数一个与规模无关的空循环）。
