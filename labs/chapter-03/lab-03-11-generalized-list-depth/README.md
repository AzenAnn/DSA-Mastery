---
title: "Lab 03-11：广义表的深度"
description: "解析广义表的括号表示，用递归计算深度，体会递归定义如何直接对应递归算法。"
order: 11
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-27"
contributors: ["Fishman"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---

# Lab 03-11：广义表的深度

> 题目来源：改编自《数据结构（C 语言版）》广义表求深度、王道 3.4 广义表章节练习。

给定一个广义表的括号表示，求它的深度。

## 题目

### 广义表的深度

3.4 中，广义表的深度是括号的重数，即元素的最大嵌套层数，约定：

- **空表** `()` 的深度为 1；
- **原子**的深度为 0；
- **非空表** `LS = (a1, …, an)` 的深度为 `max(depth(ai)) + 1`。

本题要求你解析括号表示并递归计算深度。

### 任务要求

1. 从标准输入读入一行广义表；
2. 按上述约定计算并输出其深度；
3. 输入可能是空表、原子或任意嵌套的表。

## 输入格式

- 一行：广义表（括号表示，原子为单个小写字母）。输入不含空格。

## 输出格式

- 一行一个整数：广义表的深度。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|L\|` | 1 ≤ \|L\| ≤ 10³ |
| 嵌套层数 | ≤ 10² |
| 时间复杂度 | O(\|L\|) |
| 空间复杂度 | O(嵌套层数) |

## 样例

### 样例输入 1

```input
(a,(b,(c,d)))
```

### 样例输出 1

```output
3
```

### 样例输入 2

```input
()
```

### 样例输出 2

```output
1
```

### 样例输入 3

```input
((a,b),c,d)
```

### 样例输出 3

```output
2
```

### 样例输入 4

```input
a
```

### 样例输出 4

```output
0
```

### 样例解释

样例 1：`(c,d)` 深度 1，`(b,(c,d))` 深度 2，最外层再加 1，故深度 3；样例 2 是空表，深度约定为 1；样例 3 中 `(a,b)` 深度 1，最外层加 1 得 2；样例 4 是原子，深度 0。

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
pnpm lab:doctor -- labs/chapter-03/lab-03-11-generalized-list-depth
pnpm lab:run -- labs/chapter-03/lab-03-11-generalized-list-depth
pnpm lab:score -- labs/chapter-03/lab-03-11-generalized-list-depth
```

- [ ] 四个样例全部通过；
- [ ] 能手工算出 `(a,(b,(c,d)))` 的深度并指出递归在何处终止；
- [ ] 空表（深度 1）与原子（深度 0）两种边界都有证据；
- [ ] 能说明为什么递归终止条件恰好对应深度定义的边界。

## 思考题

1. 为什么空表的深度约定为 1、原子的深度约定为 0？它们分别是递归的什么边界？
2. 求深度的递归终止条件是什么？为什么必须区分空表与原子？
3. 如果广义表里允许共享子表（如 `E = (a, E)` 的递归引用），直接递归求深度会发生什么？需要怎样处理？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

递归下降解析括号表示：遇到 `(` 进入表，遇到 `)` 结束表，遇到字母是原子。求深度时：

- 空表 `()` 返回 1；
- 原子返回 0；
- 非空表：对每个元素递归求深度，取最大值加 1。

递归终止于"空表"与"原子"两种不可再拆的情况，正好对应深度定义的两个边界。

### 复杂度分析

每个字符扫描一次，O(\|L\|)；递归栈深度等于嵌套层数，O(嵌套层数)。

### 边界注意

- 空表 `()` 深度 1，不是 0；
- 原子深度 0，不是 1；
- 单元素表 `(a)` 深度 = max(0)+1 = 1。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <iostream>
#include <string>

int depth(const std::string& s, int& pos) {
    while (pos < (int)s.size() && s[pos] == ' ') ++pos;
    if (s[pos] == '(') {
        ++pos;
        while (pos < (int)s.size() && s[pos] == ' ') ++pos;
        if (s[pos] == ')') { ++pos; return 1; }  // 空表
        int maxDepth = 0;
        while (true) {
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            maxDepth = std::max(maxDepth, depth(s, pos));
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            if (s[pos] == ',') { ++pos; continue; }
            else if (s[pos] == ')') { ++pos; break; }
        }
        return maxDepth + 1;
    } else {
        ++pos;
        return 0;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string expr;
    std::getline(std::cin, expr);
    int pos = 0;
    std::cout << depth(expr, pos) << '\n';
    return 0;
}
```

</details>
