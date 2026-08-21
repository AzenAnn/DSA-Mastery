---
title: "Lab 02-03：验证栈序列"
description: "按给定入栈顺序模拟栈，判断目标出栈序列是否合法，并定位第一个未匹配位置。"
order: 3
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-03：验证栈序列

> 题目来源：改编自 [LeetCode 946：验证栈序列](https://leetcode.cn/problems/validate-stack-sequences/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 用栈模拟固定入栈顺序下的出栈过程。
- 证明每个元素至多入栈、出栈一次，因此总时间为 O(n)。
- 在非法序列中报告第一个未匹配的 popped 下标。

## 前置知识

建议先学习[第 2.1 节栈](../../../content/chapter-02-stack-queue/01-stack.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

给定两个长度均为 `n`、元素互不重复且包含相同元素集合的序列 `pushed` 与 `popped`。元素必须按 `pushed` 顺序入栈，但可以在任意时刻出栈。判断 `popped` 是否可能是完整出栈序列。

## 输入格式

- 第一行：整数 `n`；
- 第二行：`n` 个整数，表示 `pushed`；
- 第三行：`n` 个整数，表示 `popped`。

## 输出格式

- 合法时输出 `YES`；
- 非法时输出 `NO k`，`k` 为算法结束后 `popped` 中第一个未匹配元素的 0-based 下标。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 序列长度 `n` | `0 ≤ n ≤ 200000` |
| 元素值 | 64 位有符号整数 |
| 输入保证 | 两序列均无重复且互为排列 |
| 时间复杂度要求 | `O(n)` |
| 额外空间限制 | `O(n)` |

## 样例

```input
5
1 2 3 4 5
4 5 3 2 1
```

```output
YES
```

### 样例解释

依次压入 `1、2、3、4` 后，栈顶 `4` 与第一个待出栈元素相同，于是弹出 `4`。压入 `5` 后，可以连续从栈顶弹出 `5、3、2、1`，恰好匹配完整的 `popped`，因此输出 `YES`。

任意时刻，栈中保存的都是“已经按 `pushed` 顺序入栈、但尚未匹配出栈”的元素；只有栈顶可能成为下一个出栈元素。

## 边界与验收重点

- 空序列与单元素序列。
- 全部元素入栈后再逆序出栈。
- 只匹配若干前缀后失败，并正确报告下标。

标准输入均满足题面列出的命令和数据约束。除题面明确规定的失败操作外，不需要为未知命令设计行为。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-valid-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/lab-02-03-validate-stack-sequences
pnpm lab:run -- labs/chapter-02/lab-02-03-validate-stack-sequences
pnpm lab:run -- labs/chapter-02/lab-02-03-validate-stack-sequences --case 001-valid-sample
pnpm lab:score -- labs/chapter-02/lab-02-03-validate-stack-sequences
```

`make run` 在答案尚未全对时仍正常返回，便于查看各用例结果；`make score` 是严格入口，只有得到 100 分才返回成功。样例采用精确输出比较；`007-scale` 是一组规模较大的合法序列，用于检查实现能否在时限内完成。

- [ ] 参考样例与全部公开测试通过
- [ ] 空序列、单元素、立即出栈和延迟出栈均有自测
- [ ] 非法序列输出第一个未匹配的 0-based 下标
- [ ] 能用“每个元素至多入栈、出栈一次”说明 `O(n)` 时间

## 思考与复盘

1. 为什么栈顶不等于下一个待输出元素时不能立即判错？
2. 为什么算法中的内部 `while` 循环不会令总时间退化为 `O(n²)`？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

使用一个辅助栈模拟入栈过程，并用 `next` 指向 `popped` 中第一个尚未匹配的位置。每压入一个元素，就在“栈顶等于 `popped[next]`”时持续弹栈。

循环过程中始终满足：辅助栈按原顺序保存所有已经入栈但尚未匹配的元素，`popped[0..next)` 已经合法完成。全部入栈结束后，`next == n` 当且仅当目标序列合法。

### 算法步骤

1. 初始化空栈和 `next = 0`；
2. 按顺序遍历 `pushed`，将当前元素压栈；
3. 当栈非空且栈顶等于 `popped[next]` 时，弹栈并递增 `next`；
4. 若最终 `next == n`，输出 `YES`，否则输出 `NO next`。

### 复杂度分析

- 时间复杂度：`O(n)`，每个元素最多入栈和出栈各一次；
- 额外空间：`O(n)`，最坏情况下所有元素都暂存在栈中。

### 边界注意

- `n = 0` 时两个空序列合法；
- 不要在暂时无法匹配栈顶时提前判错，后续元素仍可能先入栈再出栈；
- 输出的是第一个未匹配的 `popped` 下标，不是对应元素值。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> pushed(n);
    std::vector<long long> popped(n);
    for (auto& value : pushed) std::cin >> value;
    for (auto& value : popped) std::cin >> value;

    std::vector<long long> stack;
    stack.reserve(n);
    std::size_t next = 0;
    for (const long long value : pushed) {
        stack.push_back(value);
        while (!stack.empty() && next < n && stack.back() == popped[next]) {
            stack.pop_back();
            ++next;
        }
    }

    if (next == n) {
        std::cout << "YES\n";
    } else {
        std::cout << "NO " << next << '\n';
    }
}
```

</details>
