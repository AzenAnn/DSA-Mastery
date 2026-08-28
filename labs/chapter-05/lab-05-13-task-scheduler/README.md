---
title: "Lab 05-13：任务调度器"
description: "使用贪心 + 优先队列安排任务，计算完成所有任务所需的最少时间单位。"
order: 13
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "30～45 分钟"
---

# Lab 05-13：任务调度器

给定一系列任务和冷却时间限制，你需要合理安排任务执行顺序，使得完成所有任务所需的总时间最少。

## 题目

给定 $n$ 个任务，用整数表示任务类型（相同整数表示同类型任务）。

执行规则：
- 每个时间单位可以执行一个任务；
- 两个相同类型的任务之间必须至少有 $k$ 个时间单位的间隔（冷却期），在此期间可以执行其他任务或空闲。

求完成所有任务所需的最少时间单位数。

## 输入格式

- 第一行两个整数 $n$ 和 $k$ $(1 \leq n \leq 10^5, 0 \leq k \leq 100)$；
- 第二行 $n$ 个整数，表示任务序列。

## 输出格式

- 输出一个整数，表示完成所有任务的最少时间单位数。

## 样例

### 样例输入
```input
6 2
1 1 1 2 2 3
```

### 样例输出
```output
8
```

### 样例解释

任务频次：$1$ 出现 $3$ 次，$2$ 出现 $2$ 次，$3$ 出现 $1$ 次。冷却时间 $k=2$。

一种最优安排为：`1 2 3 1 2 空闲 1`

时间线：

| 时间 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|------|---|---|---|---|---|---|---|---|
| 任务 | 1 | 2 | 3 | 1 | 2 | 空闲 | 1 | |

- 时间 $1$ 执行 $1$
- 时间 $2$ 执行 $2$
- 时间 $3$ 执行 $3$
- 时间 $4$ 执行 $1$（距上次 $1$ 间隔 $2$，满足）
- 时间 $5$ 执行 $2$（距上次 $2$ 间隔 $2$，满足）
- 时间 $6$ 无可用任务，空闲
- 时间 $7$ 执行 $1$（距上次 $1$ 间隔 $2$，满足）

总共需要 $8$ 个时间单位。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

贪心策略：每次优先执行剩余次数最多的任务。

1. 统计每种任务的出现次数；
2. 使用最大堆（优先队列）按任务剩余次数排序；
3. 每次取出堆顶任务执行，将其剩余次数减 $1$；
4. 若该任务还有剩余，将其放入冷却队列，等待 $k$ 个时间单位后再重新入堆；
5. 若堆为空但冷却队列中还有任务，则需空闲等待。

另一种数学解法：设最大频次为 `maxFreq`，出现 `maxFreq` 次的任务种类数为 `maxCount`，则答案至少为 `(maxFreq - 1) * (k + 1) + maxCount`，与 $n$ 取较大值即可。

### 复杂度分析

- **时间复杂度**：$O(n \log m)$，$m$ 为不同任务种类数；
- **空间复杂度**：$O(m)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> tasks(n);
    for (int i = 0; i < n; ++i) cin >> tasks[i];
    unordered_map<int, int> freq;
    for (int t : tasks) freq[t]++;
    priority_queue<int> pq;
    for (auto& p : freq) pq.push(p.second);
    int time = 0;
    while (!pq.empty()) {
        vector<int> tmp;
        int cycle = k + 1;
        while (cycle-- && !pq.empty()) {
            int cnt = pq.top(); pq.pop();
            if (cnt > 1) tmp.push_back(cnt - 1);
            time++;
        }
        for (int x : tmp) pq.push(x);
        if (!pq.empty()) time += cycle + 1; // 空闲等待
    }
    cout << time << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-13-task-scheduler
```
