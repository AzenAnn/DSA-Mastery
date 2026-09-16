---
title: "Lab 03-E-20：Head/Tail 复合运算求值"
description: "对广义表依次执行 Head/Tail 操作序列并求值，理清“表尾一定是一张表”带来的括号层数变化。"
order: 24
chapter: 3
labId: "03E20"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "50～70 分钟"
---

# Lab 03-E-20：Head/Tail 复合运算求值

> 题目来源：改编自严蔚敏《数据结构（C 语言版）》3.4 广义表的表头与表尾、王道《数据结构》广义表练习（用 Head/Tail 取出指定原子）。

03-E-06 只做了**一步**表头/表尾，03-E-15 数长度与结点。本题把 Head/Tail 串成一串操作，要求你**逐步求值**——考的正是广义表最容易错的那一点：**`Tail` 的返回值是一张表，不是“去掉表头后剩下的那串元素”**。

## 题目

### 广义表的记法

- **原子**是单个字母或数字；
- 元素之间用**逗号**分隔，整张表用一对**括号**包起来，允许空表 `()`；
- 输入不含空白字符，且保证最外层是括号。

### Head 与 Tail 的定义

| 表达式 | 结果 | 说明 |
| --- | --- | --- |
| `Head((a,b,c))` | `a` | 表头就是第一个元素，可能是原子也可能是子表 |
| `Head(((a),b))` | `(a)` | 表头可以是子表，此时结果整张子表 |
| `Tail((a,b,c))` | `(b,c)` | 表尾是**一张表**：把剩余元素重新组织成表 |
| `Tail((a))` | `()` | 去掉唯一元素后剩空表，仍然是一张表 |
| `Head(Tail(Tail((a,b,c))))` | `c` | 复合运算：`(a,b,c) → (b,c) → (c) → c` |

**表尾一定多一层括号，但括号层数不会随操作累积。** 这一点必须想清楚：

- `Tail((a,b,c)) = (b,c)`：去掉 `a` 后剩 `b,c` 两个元素，把它们包成表就是 `(b,c)`；
- 再做一次表尾：当前表是 `(b,c)`，去掉表头 `b` 后剩 `c`，包成表是 **`(c)`**——**不是 `((c))`**。因为 `Tail` 每次返回的都是一张**新表**（自带一对括号），而不是把结果继续套进原来的括号里。
- 若把 `(a,b,c)` 连续取三次表尾，得到的就是空表 `()`。

### 任务要求

1. 从标准输入读入一行广义表与一行操作序列（只含 `H`、`T`）；
2. 从整张表开始，把操作序列**依次**作用在“上一步的结果”上；
3. 输出最终结果：结果是原子就输出该字符，结果是表就输出标准括号串（元素间逗号分隔、无空格），空表输出 `()`；
4. 保证每一步的操作对象都是**非空表**（不会对原子或空表取 Head/Tail），因此不需要处理非法输入；
5. 复杂度要求 `O(|表| + 操作数)`。

## 输入格式

- 第一行：广义表（教材记法；原子为单个字母或数字；不含空白字符；保证最外层是括号）；
- 第二行：操作序列，只含字符 `H` 与 `T`（`H` 表示取表头，`T` 表示取表尾）；保证每个操作都作用在一张非空表上。

## 输出格式

- 一行：最终结果。原子直接输出该字符；表输出成标准括号串；空表输出 `()`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|表\|`（第一行长度） | 1 ≤ \|表\| ≤ 2.5×10⁵ |
| 嵌套深度 | ≤ 10³ |
| `\|ops\|`（操作序列长度） | 0 ≤ \|ops\| ≤ 2.5×10⁵（空序列表示不做任何操作） |
| 时间复杂度 | O(\|表\| + \|ops\|) |
| 空间复杂度 | O(\|表\|) |
| 判题限制 | 2000 ms / 输出 1024 KB |

**为什么要求 `O(|表| + |ops|)`：** 把“当前表”当成字符串、每步用 `substr` 重新拼一份的写法，每一步都要 `O(|表|)` 的时间与空间，而且表尾每做一次只会变短两个字符，总代价约为 `|表|²/4` 量级。一份语义正确的朴素实现在 `|表| ≈ 10⁵`、`|ops| ≈ 5×10⁴` 时实测已约 **1.2 秒**；本题压力点取 `|表| ≈ 2.5×10⁵`、`|ops| ≈ 1.25×10⁵`，按 `|表|²` 关系约为前者的 **6 倍**，即约 7 秒，必然超时。正确做法是对原始输入**只做一次**括号配对，之后用游标表示当前表（详见题解），任意一步都不复制子串。

上界取 2.5×10⁵ 而不是更大，是在"必须压住朴素实现"与"控制测试数据体积"之间取的平衡：朴素写法的代价是 `|表|²/4`，这个规模已能把 2000 ms 的时限顶穿数倍，而两个压力点的输入合计约 0.6 MB。

## 样例

### 样例输入 1

```input
(a,(b,c),(d,(e)))
TTH
```

### 样例输出 1

```output
(d,(e))
```

### 样例输入 2

```input
(a,b,c)
TT
```

### 样例输出 2

```output
(c)
```

### 样例输入 3

```input
(a,b,c)
TTT
```

### 样例输出 3

```output
()
```

### 样例解释

**样例 1：`(a,(b,c),(d,(e)))` 依次执行 `T`、`T`、`H`。**

| 步骤 | 操作 | 操作前的当前表 | 操作后的当前表 |
| --- | --- | --- | --- |
| 起始 | — | `(a,(b,c),(d,(e)))` | 同左 |
| 1 | `T` | `(a,(b,c),(d,(e)))` | `((b,c),(d,(e)))` |
| 2 | `T` | `((b,c),(d,(e)))` | `((d,(e)))` |
| 3 | `H` | `((d,(e)))` | `(d,(e))` |

- 第 1 步：顶层元素是原子 `a` 与子表 `(b,c)`、`(d,(e))`。去掉表头 `a`，剩下的两张子表包成**一张新表** `((b,c),(d,(e)))`；
- 第 2 步：当前表的表头是子表 `(b,c)`，整个子表作为一个元素被去掉，剩下 `(d,(e))` 包成新表 `((d,(e)))`——只有**一层**新括号；
- 第 3 步：当前表 `((d,(e)))` 只有一个元素 `(d,(e))`，取表头得到的就是这张子表本身，即 `(d,(e))`。
- 若第 3 步改成 `T`，则去掉 `(d,(e))` 后什么也不剩，输出空表 `()`。

**样例 2：`(a,b,c)` 连续两次表尾。** `(a,b,c) → (b,c) → (c)`。常见错误答案是 `((c))`——那是把“取表尾”误解成“继续套一层括号”。`Tail` 的返回值是一张**新表**，所以第二次表尾的结果是一层的 `(c)`。

**样例 3：`(a,b,c)` 连续三次表尾。** 在样例 2 的基础上再去掉表头 `c`，剩下空表，按约定输出 `()`。

三个样例放在一起看：`H` 取到原子 `a`；`TT` 得到 `(c)`；`TTT` 得到 `()`。**括号层数只在“当前表本身还是子表”时变化，不会因为连续取表尾而累积。**

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-20-head-tail-evaluation
pnpm lab:run -- labs/chapter-03/exercise/E-03-20-head-tail-evaluation
pnpm lab:score -- labs/chapter-03/exercise/E-03-20-head-tail-evaluation
```

- [ ] 三个样例都能手工逐步推导（尤其是 `TT` 得 `(c)` 而不是 `((c))`）；
- [ ] 表头是原子、表头是子表、表尾得空表三类情况都有证据；
- [ ] 空表输入（`()` 且操作序列为空）输出 `()`；
- [ ] 操作序列长度大于 1 的用例全部正确（不能只做第一步）；
- [ ] `|表| ≈ 2.5×10⁵`、`|ops| ≈ 1.25×10⁵` 的压力用例在 2000 ms 内完成，即实现确实是 `O(|表| + |ops|)`。

## 思考题

1. 为什么 `Tail((a))` 得到的是 `()` 而不是“什么都没有”？表和“一串元素”在类型上差在哪里？
2. 用头尾链表存储广义表时（`List` 结点用 `hp` 指向表头、`tp` 指向表尾），`Head` 与 `Tail` 各是什么复杂度？与本题的游标做法相比，省掉了哪部分开销？
3. 本题保证每一步的对象都是非空表。如果要自己判定合法性（对原子或空表取 Head/Tail 时报错），至少要额外维护哪些信息？
4. `Head(Tail(L))` 与 `Tail(Head(L))` 在什么条件下结果相同？举一个相同、一个不同的例子。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

朴素做法是把“当前表”当成字符串，每步用 `substr` 复制出表头或表尾：思路直观，但每步 `O(|表|)`，总代价约 `|表|²/4`，压力点必然超时。

正确做法是**一次括号配对 + 游标推进**：

1. **预处理**：一遍扫描原始输入，用栈给每个 `(` 记下配对的 `)`（记为 `mate[]`）。这一步 `O(|表|)`；
2. **表示当前表**：当前表恒等于
   `"(" + text[left..right] + ")"`，
   其中 `[left, right]` 是**原始串中的一段元素区间**。初始时 `left = 1`（跳过最外层左括号）、`right = mate[0] - 1`（到最外层右括号之前）；
3. **`H`（表头）**：表头就是 `left` 处的那个元素。若 `text[left] == '('`，它是一张子表，当前表就变成这张子表的内容区间 `[left+1, mate[left]-1]`；否则它是原子，**结果就是该字符**（题目保证此后不再有操作）；
4. **`T`（表尾）**：跳过表头元素（若它是子表就跳到 `mate[left]`），再跳过紧随其后的逗号；**右边界 `right` 不变**。因为新表自带一对括号，层数不变；
5. **输出**：若最后一步 `H` 取到原子，就输出该字符；否则当 `left > right` 时输出 `()`，其余情况输出 `"(" + text[left..right] + ")"`。

两个游标都单调移动（`left` 只增、`right` 只减），每个操作只花 `O(1)`，所以总时间是 `O(|表| + |ops|)`。

### 复杂度分析

- 预处理括号配对：`O(|表|)` 时间、`O(|表|)` 空间（配对数组 + 栈，用显式栈避免深度 10³ 的递归风险）；
- 每个操作 `O(1)`，共 `O(|ops|)`；
- 输出一次成型，长度不超过 `O(|表|)`。

总计 `O(|表| + |ops|)` 时间、`O(|表|)` 空间。

### 边界注意

- `Tail((a)) = ()`：单元素表取表尾得到空表，要输出 `()` 而不是空行；
- `Head(((a),b)) = (a)`：表头是子表时，结果整张子表都要输出；
- 连续取表尾到底：`left > right` 时输出 `()`；
- 结果为原子时不能再继续操作（题目保证不会出现这种输入），实现上可以把“最后一步是否取到原子”记下来；
- 空表输入 `()` 只可能配空操作序列，直接输出 `()`；
- 输入用整行读入（`getline`），因为操作序列可能为空行。

### 参考代码

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::string ops;
    std::getline(std::cin, text);
    std::getline(std::cin, ops);

    const int n = static_cast<int>(text.size());
    if (n == 0) {
        std::cout << "()" << '\n';
        return 0;
    }

    std::vector<int> mate(static_cast<std::size_t>(n), -1);
    std::vector<int> stack;
    stack.reserve(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        if (text[static_cast<std::size_t>(i)] == '(') {
            stack.push_back(i);
        } else if (text[static_cast<std::size_t>(i)] == ')') {
            const int open = stack.back();
            stack.pop_back();
            mate[static_cast<std::size_t>(open)] = i;
            mate[static_cast<std::size_t>(i)] = open;
        }
    }

    int left = 1;
    int right = mate[0] - 1;
    bool headIsAtom = false;
    int atomPos = -1;

    for (std::size_t k = 0; k < ops.size(); ++k) {
        const int headEnd = (text[static_cast<std::size_t>(left)] == '(')
                                ? mate[static_cast<std::size_t>(left)]
                                : left;
        if (ops[k] == 'H') {
            if (text[static_cast<std::size_t>(left)] == '(') {
                left = left + 1;
                right = headEnd - 1;
                headIsAtom = false;
            } else {
                headIsAtom = true;
                atomPos = left;
            }
        } else {
            int newLeft = headEnd + 1;
            if (newLeft <= right && text[static_cast<std::size_t>(newLeft)] == ',') ++newLeft;
            left = newLeft;
            headIsAtom = false;
        }
    }

    if (headIsAtom) {
        std::cout << text[static_cast<std::size_t>(atomPos)] << '\n';
    } else if (left > right) {
        std::cout << "()" << '\n';
    } else {
        std::cout << '(' << text.substr(static_cast<std::size_t>(left),
                                        static_cast<std::size_t>(right - left + 1))
                  << ')' << '\n';
    }
    return 0;
}
```

</details>
