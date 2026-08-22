---
title: "Lab 02-04：最小栈"
description: "实现支持常数时间最小值查询的栈，正确维护重复最小值和空栈失败语义。"
order: 4
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 02-04：最小栈

> 题目来源：改编自 [LeetCode 155：最小栈](https://leetcode.cn/problems/min-stack/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 在 O(1) 时间完成 PUSH、POP、TOP 和 MIN。
- 使用同步最小值栈或等价状态处理重复最小值。
- 保证空栈失败操作不改变状态。

## 前置知识

建议先学习[第 2.1 节栈](../../../content/chapter-02-stack-queue/01-stack.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

设计一个栈。除了普通栈的压入、弹出和读取栈顶操作，它还必须能够直接返回栈中的最小元素。

所有核心操作都必须在 `O(1)` 时间内完成。也就是说，执行 `MIN` 时不能从栈底到栈顶重新扫描全部元素。

原题的核心接口是 `push`、`pop`、`top` 和 `getMin`。本课程将它们映射为命令行命令，并额外提供 `SIZE` 与 `EMPTY`，便于检查完整状态。

## 操作定义

| 命令 | 含义 | 输出 |
| --- | --- | --- |
| `PUSH x` | 将整数 `x` 压入栈顶 | 无输出 |
| `POP` | 删除栈顶元素 | 成功时输出被删除的值；空栈输出 `EMPTY` |
| `TOP` | 读取栈顶元素，但不删除 | 非空时输出栈顶值；空栈输出 `EMPTY` |
| `MIN` | 读取当前最小元素，但不删除 | 非空时输出最小值；空栈输出 `EMPTY` |
| `SIZE` | 查询当前元素个数 | 输出非负整数 |
| `EMPTY` | 查询栈是否为空 | 空栈输出 `YES`，否则输出 `NO` |

空栈上的 `POP`、`TOP` 和 `MIN` 都是失败操作，只产生规定的输出，不得改变栈状态。

## 输入格式

- 第一行：命令数 `q`；
- 后续 `q` 行：每行一条上述命令。

## 输出格式

按照操作定义，每条需要返回结果的命令输出一行。`PUSH` 不产生输出，因此输出行数不一定等于 `q`。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 命令数 `q` | `1 ≤ q ≤ 200000` |
| 元素值 | 64 位有符号整数 |
| 时间复杂度要求 | `PUSH`、`POP`、`TOP`、`MIN`、`SIZE`、`EMPTY` 的栈逻辑均为 `O(1)` |
| 额外空间限制 | `O(n)`，其中 `n` 为当前元素数 |

## 样例

```input
12
PUSH 3
PUSH 5
MIN
PUSH 2
PUSH 2
MIN
POP
MIN
POP
MIN
TOP
SIZE
```

```output
3
2
2
2
2
3
5
2
```

### 样例解释

| 命令 | 执行后的栈（栈底 → 栈顶） | 本次输出 |
| --- | --- | --- |
| `PUSH 3` | `[3]` | — |
| `PUSH 5` | `[3, 5]` | — |
| `MIN` | `[3, 5]` | `3` |
| `PUSH 2` | `[3, 5, 2]` | — |
| `PUSH 2` | `[3, 5, 2, 2]` | — |
| `MIN` | `[3, 5, 2, 2]` | `2` |
| `POP` | `[3, 5, 2]` | `2` |
| `MIN` | `[3, 5, 2]` | `2` |
| `POP` | `[3, 5]` | `2` |
| `MIN` | `[3, 5]` | `3` |
| `TOP` | `[3, 5]` | `5` |
| `SIZE` | `[3, 5]` | `2` |

两个相同的最小值必须分别记录：第一次弹出 `2` 后最小值仍为 `2`，第二次弹出后最小值才恢复为 `3`。

## 边界与验收重点

- 重复压入同一个最小值并逐个弹出。
- 负数、单元素和恢复旧最小值。
- 空栈操作返回 EMPTY 且状态不变。

标准输入均满足题面列出的命令和数据约束。除题面明确规定的失败操作外，不需要为未知命令设计行为。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-duplicate-minimum
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/lab-02-04-min-stack
pnpm lab:run -- labs/chapter-02/lab-02-04-min-stack
pnpm lab:run -- labs/chapter-02/lab-02-04-min-stack --case 001-duplicate-minimum
pnpm lab:score -- labs/chapter-02/lab-02-04-min-stack
```

`make run` 用于查看各用例结果；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`007-scale` 在 400 个元素上连续执行 `MIN`，回归最小值查询不会改变栈状态。`O(1)` 查询要求还需结合实现与复杂度分析判断，不依赖易受机器性能影响的极限超时。

- [ ] 重复最小值、负数和旧最小值恢复正确
- [ ] 空栈 `POP/TOP/MIN` 输出 `EMPTY` 且不改变状态
- [ ] `SIZE` 与 `EMPTY` 始终反映主栈真实状态
- [ ] 能说明为什么 `MIN` 不需要遍历主栈

## 思考与复盘

1. 为什么只记录“历史上最小值”而不记录重复次数会出错？
2. 同步保存每一层最小值与只在变小时保存各有什么取舍？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

维护两个等长栈：`values` 保存真实元素，`minimums[i]` 保存 `values[0..i]` 的最小值。因此非空时 `minimums.back()` 永远是当前最小值。

压入新值时，把“新值与旧最小值中的较小者”压入辅助栈；弹出时两个栈同步弹出。重复最小值会在辅助栈中重复保存，所以逐个弹出不会过早丢失最小值。

### 复杂度分析

- `PUSH/POP/TOP/MIN/SIZE/EMPTY` 的栈逻辑操作均为 `O(1)`；
- 总额外空间为 `O(n)`。

### 边界注意

- 空栈失败操作只输出 `EMPTY`，不能改动任一栈；
- 两个栈的长度必须始终相同；
- 底层 `vector` 偶发扩容属于摊还成本，不改变栈接口的分析结论。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class MinStack {
public:
    void push(long long value) {
        values_.push_back(value);
        minimums_.push_back(minimums_.empty() ? value : std::min(value, minimums_.back()));
    }

    bool pop(long long& value) {
        if (values_.empty()) return false;
        value = values_.back();
        values_.pop_back();
        minimums_.pop_back();
        return true;
    }

    bool top(long long& value) const {
        if (values_.empty()) return false;
        value = values_.back();
        return true;
    }

    bool minimum(long long& value) const {
        if (minimums_.empty()) return false;
        value = minimums_.back();
        return true;
    }

    bool empty() const { return values_.empty(); }
    std::size_t size() const { return values_.size(); }

private:
    std::vector<long long> values_;
    std::vector<long long> minimums_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t q = 0;
    if (!(std::cin >> q)) return 0;
    MinStack stack;

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "PUSH") {
            long long value = 0;
            std::cin >> value;
            stack.push(value);
        } else if (command == "POP") {
            long long value = 0;
            if (stack.pop(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "TOP") {
            long long value = 0;
            if (stack.top(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "MIN") {
            long long value = 0;
            if (stack.minimum(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << stack.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (stack.empty() ? "YES" : "NO") << '\n';
        }
    }
}
```

</details>
