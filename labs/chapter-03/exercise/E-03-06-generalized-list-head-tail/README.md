---
title: "Lab 03-E-06：广义表的表头与表尾"
description: "解析广义表的括号表示，实现 Head 与 Tail 操作并序列化结果，体会表尾比直觉多一层括号。"
order: 10
chapter: 3
labId: "03E06"
chapterTitle: "字符串与数组"
updated: "2026-08-27"
contributors: ["Fishman"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 03-E-06：广义表的表头与表尾

> 题目来源：改编自《数据结构（C 语言版）》广义表表头表尾运算、王道 3.4 广义表章节练习。

给定一个广义表 `L` 和一个由 `H`（Head）与 `T`（Tail）组成的操作序列，输出依次执行这些操作后得到的结果。

## 题目

### 广义表的表头与表尾

3.4 中，对非空广义表 `L = (a1, a2, …, an)`：

- **表头 Head(L)**：第一个元素 `a1`，它既可能是原子，也可能是子表；
- **表尾 Tail(L)**：去掉表头后剩余元素组成的表 `(a2, …, an)`，**一定是一个表**（可能是空表 `()`）。

本题要求你解析广义表的括号表示，并依次执行给定操作。

### 任务要求

1. 从标准输入读入广义表 `L` 与操作序列 `ops`（各占一行）；
2. 依次执行 `ops` 中的每个操作：`H` 取表头、`T` 取表尾；
3. 输出最终结果：原子输出单个字母，表输出括号表示；
4. 表头可能是原子或子表，表尾一定是表。

## 输入格式

- 第一行：广义表 `L`（括号表示，原子为单个小写字母，如 `(a,(b,c,d))`）；
- 第二行：操作序列 `ops`（由 `H`、`T` 组成，非空）。

输入不含空格；广义表保证语法合法且操作不会作用到未定义的原子/空表上。

## 输出格式

- 一行：最终结果。原子输出该字母，表输出括号表示（如 `()`、`(a,b)`、`((b,c,d))`）。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|L\|` | 1 ≤ \|L\| ≤ 10³ |
| `\|ops\|` | 1 ≤ \|ops\| ≤ 10² |
| 时间复杂度 | O(\|L\| + \|ops\| · 结果大小) |
| 空间复杂度 | O(\|L\|) |

## 样例

### 样例输入 1

```input
(a,(b,c,d))
H
```

### 样例输出 1

```output
a
```

### 样例输入 2

```input
(a,(b,c,d))
T
```

### 样例输出 2

```output
((b,c,d))
```

### 样例输入 3

```input
((x,y,z),(a,b,c,d))
THTH
```

### 样例输出 3

```output
b
```

### 样例输入 4

```input
(a)
T
```

### 样例输出 4

```output
()
```

### 样例解释

样例 1 中表头是原子 `a`；样例 2 中表尾是 `((b,c,d))`——注意它比去掉表头后的 `(b,c,d)` **多一层括号**；样例 3 依次 `Tail → Head → Tail → Head` 取出原子 `b`；样例 4 中 `(a)` 的表尾是空表 `()`。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-06-generalized-list-head-tail
pnpm lab:run -- labs/chapter-03/exercise/E-03-06-generalized-list-head-tail
pnpm lab:score -- labs/chapter-03/exercise/E-03-06-generalized-list-head-tail
```

- [ ] 四个样例全部通过；
- [ ] 能手工写出 `((x,y,z),(a,b,c,d))` 经 `THTH` 得到 `b` 的每一步；
- [ ] 能解释为什么表尾比去掉表头后的剩余元素多一层括号；
- [ ] 表头是原子、表头是子表、表尾是空表三种情况都有证据。

## 思考题

1. 为什么 `Tail((a))` 得到 `()` 而不是 `a`？表尾和"去掉表头后剩下的元素"有什么区别？
2. 广义表可以用头尾链表存储：`List` 节点的 `hp` 指向表头、`tp` 指向表尾。Head/Tail 操作在这种存储下各是什么复杂度？
3. 如果要求"取出某个深层原子"（如 3.4 练习里取 `b`），写出用 `H`/`T` 表示的运算式。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

用递归下降解析把括号表示转成树：每个节点要么是原子（存字符），要么是表（存子元素列表）。之后按 `ops` 逐字符操作：

- `H`：`node = node->children[0]`（表头，可能是原子或子表）；
- `T`：新建一个表，把 `children[1..]` 拷入作为其子元素（表尾一定是表）。

最后递归序列化：原子输出字母，表输出 `(` + 逗号分隔的元素 + `)`。

### 复杂度分析

解析与序列化各 O(\|L\|)；每个 `H`/`T` 操作复制表尾时与当前表大小相关，总 O(\|L\| + \|ops\|·\|L\|)。空间 O(\|L\|)。

### 边界注意

- 空表 `()` 没有表头表尾，测试保证不会对其操作；
- 表尾可能是空表 `()`，序列化时输出 `()`；
- 表头是子表时，序列化要递归展开，不能只输出一层。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Node {
    bool atom = false;
    char ch = '\0';
    std::vector<std::shared_ptr<Node>> children;
};

std::shared_ptr<Node> parse(const std::string& s, int& pos) {
    while (pos < (int)s.size() && s[pos] == ' ') ++pos;
    if (s[pos] == '(') {
        auto node = std::make_shared<Node>();
        ++pos;
        while (pos < (int)s.size() && s[pos] == ' ') ++pos;
        if (s[pos] == ')') { ++pos; return node; }
        while (true) {
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            if (s[pos] == '(') {
                node->children.push_back(parse(s, pos));
            } else {
                auto atom = std::make_shared<Node>();
                atom->atom = true; atom->ch = s[pos];
                node->children.push_back(atom); ++pos;
            }
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            if (s[pos] == ',') { ++pos; continue; }
            else if (s[pos] == ')') { ++pos; break; }
        }
        return node;
    } else {
        auto atom = std::make_shared<Node>();
        atom->atom = true; atom->ch = s[pos]; ++pos;
        return atom;
    }
}

std::string toString(const std::shared_ptr<Node>& n) {
    if (n->atom) return std::string(1, n->ch);
    std::string r = "(";
    for (size_t i = 0; i < n->children.size(); ++i) {
        if (i) r += ",";
        r += toString(n->children[i]);
    }
    r += ")";
    return r;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string expr, ops;
    std::getline(std::cin, expr);
    std::getline(std::cin, ops);
    int pos = 0;
    auto node = parse(expr, pos);
    for (char c : ops) {
        if (c == 'H') {
            node = node->children[0];
        } else if (c == 'T') {
            auto tail = std::make_shared<Node>();
            if (node->children.size() > 1)
                tail->children.assign(node->children.begin() + 1, node->children.end());
            node = tail;
        }
    }
    std::cout << toString(node) << '\n';
    return 0;
}
```

</details>
