---
title: "Lab 03-05：next 与 nextval 数组推导"
description: "输入模式串，输出 next 与 nextval 数组，掌握 KMP 失配回退的两种约定。"
order: 5
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-20"
contributors: ["Qing"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 03-05：next 与 nextval 数组推导

> 题目来源：严蔚敏《数据结构》第 4 章习题、王道《数据结构》习题集 4.2。

输入一个模式串 `T`，输出它的 next 数组与 nextval 数组。本题统一采用 0-based 下标、`next[0] = nextval[0] = -1` 的约定（与 3.2 正文一致）。

## 题目

### next 与 nextval

KMP 失配时模式串如何滑动，完全由模式串自身的 next 数组决定；nextval 在 next 基础上继续压缩“必然再次失配”的回退目标。本题把两个数组都算出来。

### 任务要求

1. 从标准输入读入一行模式串 `T`；
2. 第一行输出 next 数组，第二行输出 nextval 数组；
3. 数组元素用单个空格分隔，行末无多余空格；
4. 约定：0-based 下标，`next[0] = -1`、`nextval[0] = -1`；
5. nextval 的压缩规则：若 `T[j] == T[next[j]]`，则 `nextval[j] = nextval[next[j]]`，否则 `nextval[j] = next[j]`。

## 输入格式

- 一行：模式串 `T`。

字符为可打印 ASCII（不含空格），长度 1 ≤ |T| ≤ 10⁵。

## 输出格式

- 第一行：next 数组，元素空格分隔；
- 第二行：nextval 数组，元素空格分隔。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|T\|` | 1 ≤ \|T\| ≤ 10⁵ |
| 时间复杂度 | O(\|T\|) |
| 空间复杂度 | O(\|T\|) |

## 样例

### 样例输入 1

```input
ababc
```

### 样例输出 1

```output
-1 0 0 1 2
-1 0 -1 0 2
```

### 样例输入 2

```input
aaaaab
```

### 样例输出 2

```output
-1 0 1 2 3 4
-1 -1 -1 -1 -1 4
```

### 样例输入 3

```input
abaabcac
```

### 样例输出 3

```output
-1 0 0 1 1 2 0 1
-1 0 -1 1 0 2 -1 1
```

### 样例解释

样例 1 中 `ababc` 的 next 为 `-1 0 0 1 2`；逐位压缩 nextval：`j=2` 时 `T[2]='a' == T[next[2]]=T[0]='a'`，所以 `nextval[2] = nextval[0] = -1`，其余类似。样例 2 中大量重复字符让 `nextval` 一路压到 -1，只有最后不重复的 `'b'` 保留回退位置 4。

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
pnpm lab:doctor -- labs/chapter-03/lab-03-05-next-array
pnpm lab:run -- labs/chapter-03/lab-03-05-next-array
pnpm lab:score -- labs/chapter-03/lab-03-05-next-array
```

- [ ] 三个样例全部通过；
- [ ] 能手工推导 `ababaaababaa` 的 next 与 nextval（1-based 与 0-based 各自算一遍）；
- [ ] 能解释 nextval 相比 next 消除了哪一类冗余比较；
- [ ] 单字符、全相同、全不同三类边界都有证据。

## 思考题

1. nextval 会把回退目标压到 -1，这代表匹配时发生什么动作？
2. 1-based 约定（`next[1] = 0`）与本题的 0-based 约定（`next[0] = -1`）数值上是什么关系？
3. 为什么 `k = next[k]` 的回退链一定收敛？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

next 的递推与匹配失配回退同构：进入循环时 `k = next[j]`，比较 `T[j]` 与 `T[k]`；相等则扩展 `next[j+1] = k + 1`，不等则 `k` 回退到 `next[k]`，直到 `k == -1`。nextval 只需在 next 基础上按压缩规则再扫一遍。

### 复杂度分析

next 构建 O(\|T\|)（k 前进量不超过 m，回退量不超过前进量）；nextval 在 next 上再扫一遍 O(\|T\|)。

### 边界注意

- `|T| = 1`：两行都只输出一个 `-1`；
- 字符全相同：next 递增为 `-1,0,1,...`，nextval 除最后一位外全部为 -1；
- 字符全不同：next 为 `-1,0,0,0,...`，nextval 与 next 相同。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <string>
#include <vector>

std::vector<int> build_next(const std::string& p) {
    int m = static_cast<int>(p.size());
    std::vector<int> next(m, 0);
    int k = -1, j = 0;
    next[0] = -1;
    while (j < m - 1) {
        if (k == -1 || p[j] == p[k]) {
            ++j;
            ++k;
            next[j] = k;
        } else {
            k = next[k];
        }
    }
    return next;
}

std::vector<int> build_nextval(const std::string& p, const std::vector<int>& next) {
    int m = static_cast<int>(p.size());
    std::vector<int> nextval(m, 0);
    nextval[0] = -1;
    for (int j = 1; j < m; ++j) {
        int k = next[j];
        nextval[j] = (p[j] == p[k]) ? nextval[k] : k;
    }
    return nextval;
}

void print_array(const std::vector<int>& a) {
    for (std::size_t i = 0; i < a.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string p;
    std::getline(std::cin, p);
    std::vector<int> next = build_next(p);
    std::vector<int> nextval = build_nextval(p, next);
    print_array(next);
    print_array(nextval);
    return 0;
}
```

</details>
