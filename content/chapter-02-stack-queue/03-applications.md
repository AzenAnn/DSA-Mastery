---
title: "2.3 栈与队列的应用"
description: "从栈与队列的特性出发，理解它们为何能匹配不同的数学问题与真实场景，并用表达式求值、单调栈与逐层扩散落地为可运行代码。"
order: 3
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-18"
contributors: ["Jeff"]
status: "draft"
---

# 2.3 栈与队列的应用

2.1 与 2.2 回答了"栈和队列是什么、怎么实现"。本篇回答另一个问题：**它们各自的特性能解决哪类问题**。答案的钥匙不在实现里，而在语义里——栈是"后进先出"，队列是"先进先出"。这两个语义决定了它们天然匹配不同的问题结构，这正是本篇要展开的主线。

为聚焦"如何用"，本篇直接使用标准库 `std::stack` 与 `std::queue`，其接口与前两篇的自实现类语义一致（`std::queue` 的 `push` 对应 `enqueue`，`pop` 对应 `dequeue`）。

## 栈与队列的特性：语义决定用途

### 栈：后进先出，"最近"优先

栈只暴露栈顶，所有操作都在栈顶完成，因此它天然表达一种"最近"的依赖：最后放进去的元素，一定是下一个被取出的元素。

翻译一下就是——凡是需要"**回到最近的状态**"或"**先处理最近发生的**"的场景，栈都是首选：

| 栈的特性 | 对应的问题特征 | 典型应用 |
| --- | --- | --- |
| 后进先出 | 最近未完成的结构最先被收尾 | 括号匹配（见 2.1）、表达式求值、递归调用 |
| 只关心栈顶 | 只需要"上一个状态"，不需要中间任意位置 | 浏览器后退、文本编辑器撤销 |
| 栈内可保持有序 | 需要维护"最近满足某条件的元素" | 单调栈（下一个更大/更小元素） |

### 队列：先进先出，"先到"优先

队列有队头与队尾两个端点：队尾进、队头出。因此它表达一种"顺序"的公平：最早到达的元素，一定是第一个被处理的元素。

翻译一下就是——凡是需要"**按到达顺序处理**"或"**逐层推进**"的场景，队列都是首选：

| 队列的特性 | 对应的问题特征 | 典型应用 |
| --- | --- | --- |
| 先进先出 | 先到先处理，公平性 | 银行排队、超市收银 |
| 队头队尾两端 O(1) | 快速取出最久、追加最新 | Round-Robin 调度、生产者-消费者 |
| 按层扩散 | 先到达的先扩展，保证"逐层" | 广度优先搜索（BFS） |

::: tip 先问语义，再选结构
看到一个陌生问题，先问一句："它的访问顺序是'最近优先'还是'先到优先'？"答案是"最近"就用栈，"先到"就用队列。这种一一映射的关系是快速解题的秘诀。
:::

## 应用背后的数学原理

特性只是表象，真正决定"为什么能这样用"的是背后的数学结构。
### 栈对应"嵌套结构"与"单调性"

- **嵌套结构**：括号、表达式、递归调用，本质上都是"后开始的部分先结束"的嵌套结构。栈的后进先出恰好与"最近开始的最先结束"一一对应。表达式求值能工作，正是因为中缀表达式的文法是一棵递归嵌套的树，而栈在按这棵树的"后序"遍历它。
- **单调性**：如果要求"每个元素右边第一个比它大的元素"，本质是在一维序列上寻找一种偏序关系。单调栈利用"栈内元素保持单调"这个不变量，把暴力扫描压缩成线性。

### 队列对应"距离分层"与"时间公平"

- **距离分层**：广度优先搜索之所以能找到无权图的最短路径，是因为它把节点按"距离起点的步数"分成一层一层，而队列的先进先出恰好保证"先入队的一层被处理完，才轮到下一层"。
- **时间公平**：排队、调度这类场景的数学基础是排队论（queueing theory）里"先到先服务"的公平原则——等待最久者优先获得服务，这正是队列的语义。

## 抽象应用：用数据结构实现数学算法

这一层是"用栈/队列去解决一个算法问题"。下面是三个有完整代码的样板。

### 表达式求值：调度场算法

中缀表达式 `a + b * c` 依赖括号与优先级，而后缀表达式（Reverse Polish Notation，RPN，逆波兰表达式）没有括号、从左到右即可求值。转换与求值都用栈。

先看后缀求值：操作数压栈，运算符弹出两个操作数计算后压回。

```cpp:line-numbers [postfix-eval.cpp]
#include <stack>
#include <string_view>
#include <stdexcept>

int apply(int a, int b, char op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b == 0) throw std::domain_error("除零");
            return a / b;
        default:  throw std::invalid_argument("未知运算符");
    }
}

int eval_postfix(std::string_view expr) {
    std::stack<int> st;
    for (char ch : expr) {
        if (ch >= '0' && ch <= '9') {
            st.push(ch - '0');                    // 操作数入栈（简化为单个数字）
        } else if (ch == ' ') {
            continue;
        } else {
            if (st.size() < 2) throw std::invalid_argument("操作数不足");
            int b = st.top(); st.pop();
            int a = st.top(); st.pop();
            st.push(apply(a, b, ch));
        }
    }
    if (st.size() != 1) throw std::invalid_argument("多余操作数");
    return st.top();
}
```

再看中缀转后缀，使用**调度场算法**（shunting-yard，由 Edsger Dijkstra 提出）：操作数直接输出，运算符与栈顶比较优先级。为了聚焦栈操作，下面约定每个操作数都是单个字母或数字，只支持二元 `+`、`-`、`*`、`/`；相邻操作数、一元运算符和空括号都属于非法输入。定义优先级 `P`：

$$
P(o) = \begin{cases} 2 & o \in \{*, /\},\\ 1 & o \in \{+, -\},\\ 0 & o \text{ 是左括号。} \end{cases}
$$

```cpp:line-numbers [shunting-yard.cpp]
#include <cctype>
#include <stack>
#include <stdexcept>
#include <string>
#include <string_view>

bool is_operator(char op) {
    return op == '+' || op == '-' || op == '*' || op == '/';
}

int precedence(char op) {
    if (op == '*' || op == '/') return 2;
    if (op == '+' || op == '-') return 1;
    throw std::invalid_argument("未知运算符");
}

std::string infix_to_postfix(std::string_view expr) {
    std::stack<char> ops;
    std::string out;
    bool expect_operand = true;
    for (char ch : expr) {
        if (ch == ' ') continue;
        const auto uch = static_cast<unsigned char>(ch);
        if (std::isalpha(uch) || std::isdigit(uch)) {
            if (!expect_operand) throw std::invalid_argument("操作数之间缺少运算符");
            out += ch;
            expect_operand = false;
        } else if (ch == '(') {
            if (!expect_operand) throw std::invalid_argument("左括号前缺少运算符");
            ops.push(ch);
        } else if (ch == ')') {
            if (expect_operand) throw std::invalid_argument("右括号前缺少操作数");
            while (!ops.empty() && ops.top() != '(') {
                out += ops.top(); ops.pop();
            }
            if (ops.empty()) throw std::invalid_argument("括号不匹配");
            ops.pop();                            // 弹出 '('
            expect_operand = false;
        } else if (is_operator(ch)) {
            if (expect_operand) throw std::invalid_argument("运算符前缺少操作数");
            while (!ops.empty() && ops.top() != '(' &&
                   precedence(ops.top()) >= precedence(ch)) {
                out += ops.top(); ops.pop();
            }
            ops.push(ch);
            expect_operand = true;
        } else {
            throw std::invalid_argument("未知字符");
        }
    }
    if (expect_operand) throw std::invalid_argument("表达式不完整");
    while (!ops.empty()) {
        if (ops.top() == '(') throw std::invalid_argument("括号不匹配");
        out += ops.top(); ops.pop();
    }
    return out;
}
```

每个运算符入栈一次、出栈一次，转换时间 `O(n)`；后缀求值每个操作数与运算符只处理一次，同样 `O(n)`。二者空间 `O(n)`。

::: details 用调度场转换 `a + b * c` 的全过程
1. 读 `a`：操作数，直接输出 → `a`。
2. 读 `+`：栈空，入栈 → 栈：`+`。
3. 读 `b`：输出 → `a b`。
4. 读 `*`：优先级 `2 > 1`，入栈 → 栈：`+ *`。
5. 读 `c`：输出 → `a b c`。
6. 结束：依次弹出 → `a b c * +`。

得到后缀表达式 `a b c * +`，与"乘法优先于加法"一致。
:::

### 单调栈：下一个更大元素

问题：给定数组，对每个位置求"右边第一个比它大的元素"。暴力做法对每个位置向右扫描，时间 `O(n^2)`。

**单调栈**维护一个从栈底到栈顶单调不增的栈（栈顶最小；相等元素可以同时保留）。从左到右扫描，当新元素比栈顶大时，栈顶元素的"下一个更大元素"就是当前元素，于是弹栈并记录答案；否则新元素入栈。

```cpp:line-numbers [monotonic-stack.cpp]
#include <stack>
#include <vector>

std::vector<int> next_greater(const std::vector<int>& nums) {
    int n = static_cast<int>(nums.size());
    std::vector<int> ans(n, -1);                  // 默认没有下一个更大元素
    std::stack<int> st;                           // 存下标，对应值从栈底到栈顶单调不增
    for (int i = 0; i < n; ++i) {
        while (!st.empty() && nums[st.top()] < nums[i]) {
            ans[st.top()] = nums[i];              // 栈顶找到了下一个更大元素
            st.pop();
        }
        st.push(i);
    }
    return ans;
}
```

关键性质：**每个元素最多入栈一次、出栈一次**。内层 `while` 虽然看起来可能执行多次，但总次数被元素个数限制——这正是 2.1 节摊还分析（amortized analysis）的又一次应用：

$$
T(n) = \sum_{\text{each element}} O(1) = O(n).
$$

### 队列与逐层扩散

当问题要求"按到达顺序处理"时，队列是自然选择。下面用一维状态空间体会"逐层扩散"，不需要图论或树结构。

**农夫抓牛**：农夫在数轴位置 `start`，每步可移动到 `x-1`、`x+1` 或 `2x`，求到达 `target` 的最少步数（位置限制在 `[0, limit)`）。

```cpp:line-numbers [bfs-level.cpp]
#include <queue>
#include <stdexcept>
#include <vector>

int min_steps(int start, int target, int limit) {
    if (limit <= 0 || start < 0 || start >= limit ||
        target < 0 || target >= limit) {
        throw std::invalid_argument("位置必须位于 [0, limit) 内");
    }

    std::queue<int> q;
    std::vector<int> dist(limit, -1);             // dist[x] = 到达 x 的最少步数，-1 表示未访问
    q.push(start);
    dist[start] = 0;
    while (!q.empty()) {
        int cur = q.front(); q.pop();
        if (cur == target) return dist[cur];
        for (int nxt : {cur - 1, cur + 1, cur * 2}) {
            if (nxt < 0 || nxt >= limit) continue;
            if (dist[nxt] != -1) continue;        // 已访问，跳过
            dist[nxt] = dist[cur] + 1;
            q.push(nxt);
        }
    }
    return -1;                                    // 不可达
}
```

队列为什么能保证"最少步数"？因为它严格按**层**处理：先处理步数为 0 的起点，再处理步数为 1 的所有位置，再步数为 2……第一次到达 `target` 时的步数必然最小。若换成栈（后进先出），会沿某条路径深入到底，无法保证先遇到最短路径。

::: warning 广度优先的完整图论部分在第 5 章
这里只展示"队列在逐层扩散中的作用"。真正的图广度优先遍历（BFS，Breadth-First Search）、邻接表与最短路径，将在第 5 章"图的遍历与应用"系统展开。本节的关键收获是：**队列的 FIFO 顺序恰好对应"按层处理"**。
:::

## 场景应用：用数据结构构造真实系统

抽象应用是"解一道算法题"；场景应用是"建一个系统"。后者把"数据结构 + 流程代码范式"拼起来，是工程能力的集中体现，也对应本章的三个配套 Lab。

### 栈的场景：浏览器与编辑器

- **浏览器前进 / 后退**：维护后退栈 `back` 与前进栈 `forward`。访问新页面时把当前页压入 `back`，并**清空 `forward`**（前进历史作废）。这就是"最近优先"语义：后退永远是回到最近访问过的页。
- **文本编辑器 Undo / Redo**：把每次操作封装成命令对象压入撤销栈，撤销时弹栈反向执行，再压入重做栈。撤销的永远是"最近一次操作"。

两者都只用栈就能建模，且每次操作都是 `O(1)`。完整实现见 [Lab 02-03：可撤销浏览器——栈的超级大综合](../../labs/chapter-02/lab-02-03-undoable-browser/README.md)。

### 队列的场景：收银与调度

- **超市收银 / 银行排队**：多个窗口各有一条顾客队列，顾客选最短队入队，收银员先到先服务。这正是"先到先处理"的公平性，复用 2.2 节的循环队列。
- **Round-Robin 调度**（round-robin，时间片轮转）：进程按到达顺序排成一队，用完一个时间片就回到队尾。队头永远是"下一个被调度"的进程。

完整实现见 [Lab 02-04：超市收银模拟——队列的大综合](../../labs/chapter-02/lab-02-04-supermarket-checkout/README.md)。

### 栈 + 队列联动：停车场管理

停车场内部车道用**栈**（后进的车堵住先进的车，取车要倒出来），门外便道用**队列**（先到先进场）。这是"最近优先"与"先到优先"在同一业务流程里协作的典型例子。完整实现见 [Lab 02-05：停车场管理——栈与队列的大综合](../../labs/chapter-02/lab-02-05-parking-lot-management/README.md)。

## 常见错误汇总

把上面各应用最容易犯的错集中在这里，供自查：

| 应用 | 常见错误 | 正确做法 |
| --- | --- | --- |
| 表达式求值 | 右括号处理时忘了先检查栈空；除零未拦截 | 遇到 `)` 先确认栈里有 `(`；`/` 的右操作数为 0 时显式报错 |
| 表达式求值 | 运算符弹出前栈里不足两个操作数 | 先检查 `size() >= 2` |
| 单调栈 | 单调方向搞反（该递减却写成递增） | 写代码前先问"栈顶该是尚未找到答案的元素里最可能被解锁的吗" |
| 逐层扩散 | 出队时才标记访问，导致重复入队 | 入队时立即标记（`dist` 赋值），防止 `x-1` 与 `x+1` 互相倒灌 |
| 浏览器后退 | 访问新页后没有清空前进栈 | `visit` 时必须清空 `forward`，否则前进到无关页面 |

## 小结

栈与队列的应用，归根结底是**语义的延伸**：

- 栈的"后进先出"对应"最近优先"，于是匹配括号、表达式、递归、撤销、后退这类**嵌套或回溯**问题；
- 队列的"先进先出"对应"先到优先"，于是匹配逐层扩散、排队、调度这类**顺序或公平**问题。

理解"特性 → 数学原理 → 应用"这条链，比背应用名单更本质：遇到新问题时，先判断它是"最近优先"还是"先到优先"，结构自然就选出来了。

## 练习

1. 把 `(a + b) * (c - d)` 转换为后缀表达式，并给出完整求值步骤。
2. 单调栈能求出"左边第一个比它小"的元素吗？需要维护什么性质的栈？
3. 在"农夫抓牛"中，为什么入队时标记 `dist` 而非出队时标记？
4. 浏览器访问新页面时为什么要清空前进栈？不清空会发生什么？（可对照 Lab 02-03）
5. 一个系统需要"后到的请求先处理"（如撤销栈），它该用栈还是队列？如果改成"等待最久的请求先处理"呢？

::: details 查看参考思路
1. `(a + b) * (c - d)` 转后缀为 `a b + c d - *`；求值：先算 `a+b`、`c-d`，再相乘。
2. 能。从左到右扫描并维护一个从栈底到栈顶严格递增的候选栈。处理当前元素时，先弹出所有大于或等于当前值的元素；此时若栈非空，栈顶就是左边第一个更小的元素，记录答案后再把当前元素入栈。
3. 入队时标记可防止同一位置被反复入队（`x-1` 与 `x+1` 互指），保证逐层性；出队时才标记会让队列被重复节点撑爆。
4. 不清空前进栈，后退后再访问新页，前进栈里会残留"旧未来"，导致前进到与当前浏览路径无关的页面。
5. "后到先处理"是后进先出，用栈；"等待最久先处理"是先进先出，用队列。
:::

## 延伸阅读

- 调度场算法由 Edsger Dijkstra 提出，完整描述见其 1961 年论文与《算法导论》表达式求值章节。
- 单调栈与单调队列题单：LeetCode 496 / 503 / 739（下一个更大/每日温度）、239（滑动窗口最大值）。
- 广度优先遍历的完整图论部分见本课程第 5 章。
