---
title: "Lab 03-08：串的非重叠替换 Replace"
description: "实现 Replace(S, T, V)：把 S 中所有非重叠的 T 替换为 V，组合定位与拼接操作。"
order: 8
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-20"
contributors: ["Qing"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 03-08：串的非重叠替换 Replace

> 题目来源：陈守孔《算法与数据结构考研试题精析》串置换题（`replace(s, t, v)`：把 s 中所有非重叠的 t 用 v 代替）。

输入主串 `S`、模式串 `T` 和替换串 `V`，把 `S` 中所有**非重叠**的 `T` 替换为 `V`，输出结果串。

## 题目

### 非重叠替换

3.1 中 `Replace(&S, T, V)` 是串的常用操作之一，可由最小操作子集组合实现。本题把它作为完整的输入输出程序实现。

### 任务要求

1. 从标准输入读入三行：`S`、`T`、`V`；
2. 从左到右找出所有**不重叠**的 `T`，替换为 `V`；
3. 替换从左到右进行，已替换位置不再参与后续匹配（例如 `S=aaaa`、`T=aa`、`V=b` 的结果是 `bb`，而不是 `bbb` 或 `b`）；
4. `V` 可以为空串（即删除所有 `T`）；`T` 非空；
5. 输出替换后的结果串。

## 输入格式

- 第一行：主串 `S`；
- 第二行：模式串 `T`；
- 第三行：替换串 `V`（可为空行）。

字符为可打印 ASCII（含空格），不含换行符；1 ≤ |T| ≤ |S| ≤ 10⁵，|V| ≤ 10⁵，保证输出长度 ≤ 10⁶。

## 输出格式

- 一行：替换后的结果串。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|S\|` | 1 ≤ \|S\| ≤ 10⁵ |
| `\|T\|` | 1 ≤ \|T\| ≤ \|S\| |
| `\|V\|` | 0 ≤ \|V\| ≤ 10⁵ |
| 输出长度 | ≤ 10⁶（题目保证） |
| 时间复杂度 | O(\|S\| + \|T\| + 输出长度) |

## 样例

### 样例输入 1

```input
abcababc
abc
XY
```

### 样例输出 1

```output
XYabXY
```

### 样例输入 2

```input
aaaa
aa
b
```

### 样例输出 2

```output
bb
```

### 样例输入 3

```input
ababa
aba
xy
```

### 样例输出 3

```output
xyba
```

### 样例输入 4

```input
banana
an

```

### 样例输出 4

```output
ba
```

### 样例输入 5

```input
hello world
xyz
q
```

### 样例输出 5

```output
hello world
```

### 样例解释

样例 1 中两处 `abc`（下标 0 与 5）分别替换为 `XY`，中间 `ab` 保留；样例 2 两个 `aa` 非重叠，全部替换为 `b`；样例 3 中第一个 `aba` 被替换后，剩余 `ba` 不再参与匹配；样例 4 的 `V` 为空串，等价于删除所有非重叠 `an`；样例 5 没有匹配，原样输出。

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
pnpm lab:doctor -- labs/chapter-03/lab-03-08-string-replace
pnpm lab:run -- labs/chapter-03/lab-03-08-string-replace
pnpm lab:score -- labs/chapter-03/lab-03-08-string-replace
```

- [ ] 五个样例全部通过；
- [ ] 重叠输入（`aaaa`/`aa`/`b`）的输出符合“非重叠”约定；
- [ ] 空替换串（删除）与无匹配两种边界有证据；
- [ ] 能说明为什么朴素逐位匹配在大数据下会超时，KMP 如何改进。

## 思考题

1. “非重叠”和“替换后对新内容再替换”有什么区别？本题采用哪种？
2. 用最小操作子集（Index、Concat、SubString、StrLength）描述 Replace 的算法框架。
3. 若 `T` 可以为空串，替换语义会有什么歧义？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

用 KMP 在 `S` 上扫描出所有 `T` 的出现位置；每匹配成功一次，就把上一段未匹配的原文追加到输出，再追加 `V`，并把模式指针归零，保证下一次匹配从当前匹配结束之后开始（非重叠）。

### 复杂度分析

- KMP 扫描：O(\|S\| + \|T\|)；
- 输出拼接：总长度与输出结果同阶；
- 总时间 O(\|S\| + \|T\| + 输出长度)，空间 O(\|T\| + 输出长度)。

### 边界注意

- `V` 为空串：等价于删除所有 `T`；
- 匹配紧邻（如 `aaaa`/`aa`）：每个匹配结束后 `j` 归零，不重叠；
- 无匹配：`last` 始终为 0，输出原串。

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

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string s, t, v;
    std::getline(std::cin, s);
    std::getline(std::cin, t);
    std::getline(std::cin, v);

    std::vector<int> next = build_next(t);
    int n = static_cast<int>(s.size());
    int m = static_cast<int>(t.size());
    std::string out;
    int i = 0, j = 0, last = 0;
    while (i < n) {
        if (j == -1 || s[i] == t[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
        if (j == m) {
            int start = i - m;
            out.append(s, last, static_cast<std::size_t>(start - last));
            out += v;
            last = i;
            j = 0;  // 非重叠：匹配结束后模式从头开始
        }
    }
    out.append(s, last, static_cast<std::size_t>(n - last));
    std::cout << out << '\n';
    return 0;
}
```

</details>
