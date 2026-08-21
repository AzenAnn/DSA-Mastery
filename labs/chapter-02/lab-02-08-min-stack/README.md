---
title: "Lab 02-08：最小栈"
description: "实现支持常数时间最小值查询的栈，正确维护重复最小值和空栈失败语义。"
order: 8
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 02-08：最小栈

> 题目来源：改编自 [LeetCode 155：最小栈](https://leetcode.cn/problems/min-stack/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 在 O(1) 时间完成 PUSH、POP、TOP 和 MIN。
- 使用同步最小值栈或等价状态处理重复最小值。
- 保证空栈失败操作不改变状态。

## 前置知识

建议先学习[第 2.1 节栈](../../../content/chapter-02-stack-queue/01-stack.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

实现最小栈命令解释器。除普通栈操作外，`MIN` 必须在常数时间返回当前最小元素；禁止在每次查询时遍历整个栈。

## 输入格式

- 第一行：命令数 `q`；
- 后续 `q` 行：`PUSH x`、`POP`、`TOP`、`MIN`、`SIZE` 或 `EMPTY`。

## 输出格式

`PUSH` 不输出；`POP` 输出被删除值；`TOP`、`MIN`、`SIZE` 和 `EMPTY` 分别输出查询结果。空栈上的 `POP`、`TOP`、`MIN` 输出 `EMPTY`；`EMPTY` 输出 `YES` 或 `NO`。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 命令数 `q` | `1 ≤ q ≤ 200000` |
| 元素值 | 64 位有符号整数 |
| 支持命令 | `PUSH`、`POP`、`TOP`、`MIN`、`SIZE`、`EMPTY` |
| 时间复杂度要求 | 每条栈逻辑操作 `O(1)` |
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

主栈与最小值栈保持相同长度。压入 `3、5、2、2` 后，最小值栈依次记录 `3、3、2、2`。第一次弹出 `2` 后栈顶最小值仍是 `2`；第二次弹出 `2` 后，旧最小值 `3` 自动恢复。这样 `MIN` 只需查看辅助栈顶，不需要遍历主栈。

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
pnpm lab:doctor -- labs/chapter-02/lab-02-08-min-stack
pnpm lab:run -- labs/chapter-02/lab-02-08-min-stack
pnpm lab:run -- labs/chapter-02/lab-02-08-min-stack --case 001-duplicate-minimum
pnpm lab:score -- labs/chapter-02/lab-02-08-min-stack
```

`make run` 用于查看各用例结果；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`007-scale` 在大量元素上连续执行 `MIN`，会让每次线性扫描的实现超时，从而落实 `O(1)` 查询要求。

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
