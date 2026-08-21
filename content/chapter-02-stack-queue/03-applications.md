---
title: "2.3 栈与队列的应用"
description: "从栈与队列的访问语义出发，理解表达式求值、单调栈与逐层扩散，并落地为可编译的核心实现。"
order: 3
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["Jeff"]
status: "draft"
---

# 2.3 栈与队列的应用

2.1 与 2.2 回答了“栈和队列是什么、怎么实现”。本篇继续回答：**它们各自的语义能解决哪类问题**。答案不在容器名称里，而在访问顺序里——栈是“后进先出”，队列是“先进先出”。

为聚焦“如何用”，本篇直接使用标准库 `std::stack` 与 `std::queue`。它们与前两篇自实现类的核心语义一致：`std::queue::push` 对应 `enqueue`，`std::queue::pop` 对应 `dequeue`。

## 学习目标

完成本节后，你应该能够：

- 从“最近优先”与“先到优先”的访问顺序判断应使用栈还是队列；
- 用调度场算法把受限中缀表达式转换为后缀表达式，并完成求值；
- 解释单调栈为何把“下一个更大元素”从 $O(n^2)$ 降为 $O(n)$；
- 用队列实现单位边权状态空间的逐层扩散，并证明第一次到达即为最少步数；
- 区分数据结构操作的复杂度与完整业务操作的复杂度。

## 栈与队列的特性：语义决定用途

### 栈：后进先出，“最近”优先

栈只暴露栈顶，所有操作都在栈顶完成，因此它天然表达一种“最近”的依赖：最后放进去的元素，一定是下一个被取出的元素。

凡是需要“**回到最近的状态**”或“**先处理最近发生的事件**”的场景，都应优先检查栈是否匹配：

| 栈的特性 | 对应的问题特征 | 典型应用 |
| --- | --- | --- |
| 后进先出 | 最近未完成的结构最先被收尾 | 括号匹配（见 2.1）、表达式求值、递归调用 |
| 只关心栈顶 | 只需要“上一个状态”，不需要中间任意位置 | 浏览器后退、文本编辑器撤销 |
| 栈内可保持有序 | 需要维护“最近满足某条件的元素” | 单调栈（下一个更大/更小元素） |

### 队列：先进先出，“先到”优先

队列有队头与队尾两个端点：队尾进、队头出。因此它表达的是到达顺序上的公平：最早到达的元素最先被处理。

凡是需要“**按到达顺序处理**”或“**逐层推进**”的场景，都应优先检查队列是否匹配：

| 队列的特性 | 对应的问题特征 | 典型应用 |
| --- | --- | --- |
| 先进先出 | 先到先处理，公平性 | 银行排队、超市收银 |
| 常见实现的入队、出队为 $O(1)$ | 快速取出最早到达者、追加最新到达者 | Round-Robin 调度、生产者—消费者 |
| 按层扩散 | 先到达的先扩展，保证“逐层” | 广度优先搜索（BFS） |

::: tip 先问语义，再选结构
看到一个陌生问题，先问一句：“它的访问顺序是‘最近优先’还是‘先到优先’？”答案是“最近”时优先考虑栈，答案是“先到”时优先考虑队列；随后还要继续检查容量、失败方式和复杂度约束，而不能只凭名称选容器。
:::

## 应用背后的问题结构

特性只是表象，真正决定“为什么能这样用”的是背后的问题结构。

### 栈对应“嵌套结构”与“单调性”

- **嵌套结构**：括号、表达式、递归调用，本质上都是“后开始的部分先结束”。栈的后进先出恰好与“最近开始的部分最先结束”对应。表达式树的后序序列是后缀表达式；调度场算法无需先建树，也能借助运算符栈生成同样的求值顺序。
- **单调性**：如果要求“每个元素右边第一个比它大的元素”，就需要维护一组尚未得到答案的候选。单调栈让这些候选按值保持单调，并及时删除已得到答案的元素，从而把重复扫描压缩为线性处理。

### 队列对应“距离分层”与“时间公平”

- **距离分层**：广度优先搜索把状态按“距离起点的步数”分层。在每条边代价相同的前提下，队列保证距离较小的状态先出队，因此第一次到达某状态时就得到了最少步数。
- **时间公平**：排队、调度常采用“先到先服务”（First Come First Served，FCFS）策略。FIFO 只保证到达顺序上的公平；若任务有优先级、截止时间或差异很大的服务时长，还需要额外调度规则。

## 抽象应用：用数据结构实现数学算法

这一层讨论“用栈或队列解决一个算法问题”。下面给出三个边界明确的代码样例。

### 表达式求值：调度场算法

中缀表达式 `a + b * c` 依赖括号与优先级，而后缀表达式（Reverse Polish Notation，RPN，逆波兰表达式）没有括号、从左到右即可求值。转换与求值都用栈。

先看后缀求值：操作数压栈，运算符弹出两个操作数计算后压回。

```cpp:line-numbers [postfix-eval.cpp]
#include <cctype>
#include <stack>
#include <stdexcept>
#include <string_view>

int apply(int a, int b, char op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b == 0) throw std::domain_error("除零");
            return a / b;
        default: throw std::invalid_argument("未知运算符");
    }
}

int eval_postfix(std::string_view expr) {
    std::stack<int> st;
    for (char ch : expr) {
        const auto uch = static_cast<unsigned char>(ch);
        if (std::isdigit(uch)) {
            st.push(ch - '0');                    // 操作数简化为单个数字
        } else if (std::isspace(uch)) {
            continue;
        } else {
            if (st.size() < 2) throw std::invalid_argument("操作数不足");
            int b = st.top();                     // 先弹出右操作数
            st.pop();
            int a = st.top();                     // 再弹出左操作数
            st.pop();
            st.push(apply(a, b, ch));
        }
    }
    if (st.size() != 1) {
        throw std::invalid_argument("后缀表达式必须产生且只产生一个结果");
    }
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
    out.reserve(expr.size());
    bool expect_operand = true;
    for (char ch : expr) {
        const auto uch = static_cast<unsigned char>(ch);
        if (std::isspace(uch)) continue;
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
                out += ops.top();
                ops.pop();
            }
            if (ops.empty()) throw std::invalid_argument("括号不匹配");
            ops.pop();                            // 弹出 '('
            expect_operand = false;
        } else if (is_operator(ch)) {
            if (expect_operand) throw std::invalid_argument("运算符前缺少操作数");
            while (!ops.empty() && ops.top() != '(' &&
                   precedence(ops.top()) >= precedence(ch)) {
                out += ops.top();
                ops.pop();
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
        out += ops.top();
        ops.pop();
    }
    return out;
}
```

当前函数使用单字符 token，实际返回值不包含分隔空格。例如 `a + b * c` 返回 `abc*+`；下面的推导加入空格只是为了区分 token。

::: complexity 复杂度 · 调度场与后缀求值
令输入长度为 $n$。两个过程都必须扫描全部输入；每个运算符至多入栈一次、出栈一次，因此中缀转后缀与后缀求值的时间复杂度均为 $\Theta(n)$，最坏辅助空间复杂度均为 $\Theta(n)$。
:::

::: warning 示例边界
为突出栈操作，示例只支持单字符操作数以及左结合的二元 `+`、`-`、`*`、`/`，并忽略空白字符。`eval_postfix()` 只计算单个十进制数字，且假设所有中间结果都落在 `int` 范围内；工程实现还需要分词、多位数解析、溢出检查和明确的整数除法语义。
:::

::: details 用调度场转换 `a + b * c` 的全过程
1. 读 `a`：操作数，直接输出 → `a`。
2. 读 `+`：栈空，入栈 → 栈：`+`。
3. 读 `b`：输出 → `a b`。
4. 读 `*`：优先级 `2 > 1`，入栈 → 栈：`+ *`。
5. 读 `c`：输出 → `a b c`。
6. 结束：依次弹出 → `a b c * +`。

得到 token 序列 `a b c * +`，即函数实际返回的 `abc*+`，与“乘法优先于加法”一致。
:::

::: example 示例 · 完整转换并求值
中缀表达式 `(2 + 3) * (7 - 4)` 转换为 `23+74-*`。后缀求值先用 `2 3 +` 得到 `5`，再用 `7 4 -` 得到 `3`，最后计算 `5 3 *`，结果为 `15`。
:::

### 单调栈：下一个更大元素

问题：给定数组，对每个位置求“右边第一个比它大的元素”。暴力做法对每个位置向右扫描，时间复杂度为 $O(n^2)$。

**单调栈**维护一个从栈底到栈顶对应值单调不增的下标栈（栈顶对应值最小；相等元素可以同时保留）。从左到右扫描，当新元素比栈顶对应值大时，栈顶位置的“下一个更大元素”就是当前元素，于是记录答案并弹栈；之后再把新元素的下标入栈。

::: property 性质 · 单调栈的候选不变量
处理下标 `i` 之前，栈中只保存右侧第一个更大元素尚未出现的下标；这些下标按扫描顺序排列，对应值从栈底到栈顶单调不增。
:::

代码使用 `std::optional<int>` 区分“答案恰好为 `-1`”与“不存在更大元素”，避免用合法元素值充当失败标记。

```cpp:line-numbers [monotonic-stack.cpp]
#include <cstddef>
#include <optional>
#include <stack>
#include <vector>

std::vector<std::optional<int>> next_greater(const std::vector<int>& nums) {
    std::vector<std::optional<int>> ans(nums.size());
    std::stack<std::size_t> st;                   // 存下标，对应值从栈底到栈顶单调不增
    for (std::size_t i = 0; i < nums.size(); ++i) {
        while (!st.empty() && nums[st.top()] < nums[i]) {
            ans[st.top()] = nums[i];
            st.pop();
        }
        st.push(i);
    }
    return ans;
}
```

::: proof 正确性说明
下标 `j` 被当前位置 `i` 弹出时有 `nums[i] > nums[j]`。如果 `j` 与 `i` 之间曾出现更大的元素，`j` 应在处理那个元素时就已出栈；因此 `nums[i]` 正是 `nums[j]` 右边第一个更大的元素。扫描结束后仍留在栈中的下标从未遇到更大元素，其答案保持为空。
:::

::: example 示例 · 下一个更大元素
输入 `[2, 1, 2, 4, 3]` 时，结果为 `[4, 2, 4, 无, 无]`。两个“无”分别表示 `4` 和 `3` 的右边不存在更大元素。
:::

::: complexity 复杂度 · 单调栈
每个下标恰好入栈一次、最多出栈一次。内层 `while` 虽然在某一步可能连续弹出多个下标，但整次扫描的弹栈总数不超过 $n$，因此时间复杂度为 $\Theta(n)$。结果数组占用 $\Theta(n)$ 空间，辅助栈的最坏空间复杂度为 $O(n)$。
:::

完成 [Lab 02-11：柱状图中最大的矩形](../../labs/chapter-02/lab-02-11-largest-rectangle-histogram/README.md)，进一步练习用单调栈确定左右边界与矩形宽度。

### 队列与逐层扩散

当问题要求“按到达顺序处理”时，队列是自然选择。下面用一维状态空间体会“逐层扩散”，不需要预先学习图的存储结构。

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
    std::vector<int> dist(limit, -1);             // dist[x] = 最少步数，-1 表示未访问
    q.push(start);
    dist[start] = 0;
    while (!q.empty()) {
        int cur = q.front();
        q.pop();
        if (cur == target) return dist[cur];
        const long long candidates[] = {
            static_cast<long long>(cur) - 1,
            static_cast<long long>(cur) + 1,
            static_cast<long long>(cur) * 2,
        };
        for (long long candidate : candidates) {
            if (candidate < 0 || candidate >= limit) continue;
            const int nxt = static_cast<int>(candidate);
            if (dist[nxt] != -1) continue;
            dist[nxt] = dist[cur] + 1;             // 入队时立即标记
            q.push(nxt);
        }
    }
    return -1;                                    // 当前移动规则下理论上不会执行
}
```

::: property 性质 · 单位代价下第一次到达即最短
队列中的状态按 `dist` 非递减的顺序出队。由于每次移动的代价都为 1，某状态第一次入队时写入的 `dist` 必然是最少步数；代码随后在该状态出队时返回这个值。若换成栈，搜索可能沿某条路径不断深入，不能保证先遇到最短路径。
:::

::: example 示例 · 从 5 到 17
当 `start = 5`、`target = 17`、`limit = 100` 时，一条最短移动序列是 `5 → 10 → 9 → 18 → 17`，共 4 步。
:::

::: complexity 复杂度 · 一维逐层扩散
令状态范围大小为 $L=\text{limit}$。每个位置最多入队一次，每次只检查三个候选位置，因此最坏时间复杂度为 $\Theta(L)$；`dist` 数组和队列的最坏空间复杂度均为 $\Theta(L)$。若提前到达目标，实际访问的状态可能少于 $L$。
:::

::: warning 广度优先的完整图论部分在后续章节
这里只展示“队列在逐层扩散中的作用”。图的存储、广度优先遍历和最短路径将在[图的遍历](../chapter-05-graph/02-traversal.md)中系统展开。本节的关键收获是：**队列的 FIFO 顺序恰好对应“按层处理”**。
:::

## 场景应用：用数据结构构造真实系统

抽象应用是“解一道算法题”；场景应用是“建一个系统”。后者把“数据结构 + 流程代码范式”拼起来，是工程能力的集中体现，也对应本章的三个配套 Lab。

### 栈的场景：浏览器与编辑器

- **浏览器前进 / 后退**：维护后退栈 `back` 与前进栈 `forward`。访问新页面时把当前页压入 `back`，并**清空 `forward`**（前进历史作废）。这就是“最近优先”语义：后退永远是回到最近访问过的页。
- **文本编辑器 Undo / Redo**：把每次操作封装成命令对象压入撤销栈，撤销时弹栈反向执行，再压入重做栈。撤销的永远是“最近一次操作”。

两者都可以用栈建模。任务说明见 [Lab 02-12：可撤销浏览器——栈的超级大综合](../../labs/chapter-02/lab-02-12-undoable-browser/README.md)。

### 队列的场景：收银与调度

- **超市收银 / 银行排队**：多个窗口各有一条顾客队列，顾客选最短队入队，收银员先到先服务。这正是“先到先处理”的公平性，复用 2.2 节的循环队列。
- **Round Robin（时间片轮转）**：进程按到达顺序排成一队，用完一个时间片就回到队尾。队头永远是“下一个被调度”的进程。

任务说明见 [Lab 02-13：超市收银模拟——队列的大综合](../../labs/chapter-02/lab-02-13-supermarket-checkout/README.md)。

### 栈 + 队列联动：停车场管理

停车场内部车道用**栈**（后进的车堵住先进的车，取车要倒出来），门外便道用**队列**（先到先进场）。这是“最近优先”与“先到优先”在同一业务流程里协作的典型例子。任务说明见 [Lab 02-14：停车场管理——栈与队列的大综合](../../labs/chapter-02/lab-02-14-parking-lot-management/README.md)。

::: complexity 复杂度 · 容器操作不等于业务操作
一次栈顶转移或队列首尾操作通常为 $O(1)$，但完整业务可能包含多次基础操作：浏览器 `back(k)`、`forward(k)` 需要 $O(k)$ 次转移；从 $m$ 个收银窗口中线性寻找最短队列需要 $O(m)$；让停车场栈中深度为 $k$ 的车辆离开，需要临时移出并恢复其上方车辆，时间复杂度为 $O(k)$。
:::

## 常见错误汇总

把上面各应用最容易犯的错集中在这里，供自查：

::: pitfall 易错点 · 应用中的契约错误

| 应用 | 常见错误 | 正确做法 |
| --- | --- | --- |
| 中缀转换 | 右括号处理时忘了检查是否存在对应左括号 | 弹出运算符后确认栈顶确实存在 `(` |
| 后缀求值 | 把先弹出的值当成左操作数，错误计算成 `b op a` | 先弹出右操作数 `b`，再弹出左操作数 `a`，计算 `a op b` |
| 后缀求值 | 运算符弹出前栈里不足两个操作数；除零未拦截 | 先检查 `size() >= 2`，并在除法前检查右操作数 |
| 单调栈 | 单调方向搞反 | 先确认栈中保存哪些“尚未得到答案的候选”，再确定单调方向 |
| 逐层扩散 | 出队时才标记访问，导致重复入队 | 入队时立即写入 `dist`，确保每个状态只入队一次 |
| 浏览器后退 | 访问新页后没有清空前进栈 | `visit` 时必须清空 `forward`，否则会进入与当前路径无关的页面 |

:::

## 小结

栈与队列的应用，归根结底是**语义的延伸**：

- 栈的“后进先出”对应“最近优先”，于是匹配括号、表达式、递归、撤销、后退这类**嵌套或回溯**问题；
- 队列的“先进先出”对应“先到优先”，于是匹配逐层扩散、排队、调度这类**顺序或公平**问题。

理解“特性 → 问题结构 → 应用”这条链，比背应用名单更本质：遇到新问题时，先判断它是“最近优先”还是“先到优先”，结构自然就选出来了。

## 练习

1. 把 `(2 + 3) * (7 - 4)` 转换为后缀表达式，并用栈给出完整求值过程；随后在 [Lab 02-04：逆波兰表达式求值](../../labs/chapter-02/lab-02-04-evaluate-rpn/README.md)中实现并测试求值器。
2. 单调栈能求出“左边第一个比它小”的元素吗？需要维护什么性质的栈？完成 [Lab 02-11：柱状图中最大的矩形](../../labs/chapter-02/lab-02-11-largest-rectangle-histogram/README.md)后，再比较“寻找相邻边界”和“结算矩形宽度”的弹栈条件。
3. 在“农夫抓牛”中，为什么入队时写入 `dist`，而不是等到出队时才标记？
4. 浏览器访问新页面时为什么要清空前进栈？不清空会发生什么？（可对照 Lab 02-12）
5. 一个系统需要“后到的请求先处理”（如撤销栈），它该用栈还是队列？如果改成“等待最久的请求先处理”呢？

::: details 查看参考思路
1. 后缀表达式为 `23+74-*`：`2 3 +` 得到 `5`，`7 4 -` 得到 `3`，最后 `5 3 *` 得到 `15`。
2. 能。从左到右扫描并维护一个从栈底到栈顶严格递增的候选栈。处理当前元素时，先弹出所有大于或等于当前值的元素；此时若栈非空，栈顶就是左边第一个更小的元素，记录答案后再把当前元素入栈。
3. FIFO 队列负责按距离分层；入队时写入 `dist` 则保证每个状态只入队一次，而且第一次写入的就是最短距离。若出队时才标记，同一状态可能在出队前被多个前驱重复加入队列。
4. 不清空前进栈，后退后再访问新页，前进栈里会残留“旧未来”，导致前进到与当前浏览路径无关的页面。
5. “后到先处理”是后进先出，用栈；“等待最久先处理”是先进先出，用队列。
:::

## 延伸阅读

- Edsger W. Dijkstra 在 1961 年的 [ALGOL 60 Translation（EWD 35）](https://www.cs.utexas.edu/~EWD/transcriptions/EWD00xx/EWD35.html)中描述了后来被称为 shunting-yard 的翻译方法。
- 完成 [Lab 02-10：滑动窗口最大值](../../labs/chapter-02/lab-02-10-sliding-window-maximum/README.md)，把单调候选从栈扩展到支持队头过期的双端队列；还可继续练习 LeetCode 496 / 503（下一个更大元素）。
- 广度优先遍历的完整图论内容见[图的遍历](../chapter-05-graph/02-traversal.md)。
