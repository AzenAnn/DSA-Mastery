---
title: "Lab 02-07：逆波兰表达式求值"
description: "使用操作数栈计算逆波兰表达式，处理左右操作数顺序、负数、除法和非法表达式。"
order: 7
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "40～60 分钟"
---

# Lab 02-07：逆波兰表达式求值

> 题目来源：改编自 [LeetCode 150：逆波兰表达式求值](https://leetcode.cn/problems/evaluate-reverse-polish-notation/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 使用栈从左到右求值后缀表达式。
- 正确区分先弹出的右操作数和后弹出的左操作数。
- 根据栈基数、除零和 token 类型识别非法表达式。

## 前置知识

建议先学习[第 2.3 节栈与队列的应用](../../../content/chapter-02-stack-queue/03-applications.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

读取一个由十进制整数和 `+`、`-`、`*`、`/` 组成的逆波兰表达式。整数入栈；运算符取出 `right` 后再取出 `left`，计算 `left op right` 后压回。

## 输入格式

- 第一行：token 数量 `n`；
- 第二行：`n` 个由空白分隔的 token。

## 输出格式

- 合法表达式输出一个 64 位整数结果；
- 操作数不足、除零、未知 token 或结束时栈中不恰好剩一个值，输出 `ERROR`。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| token 数量 `n` | `1 ≤ n ≤ 200000` |
| 运算符 | `+`、`-`、`*`、`/` |
| 数值范围 | 合法计算的中间结果均在 64 位有符号整数范围内 |
| 除法规则 | 向零截断 |
| 时间复杂度要求 | `O(n)` |
| 额外空间限制 | `O(n)` |

## 样例

```input
5
2 1 + 3 *
```

```output
9
```

### 样例解释

| 读入 token | 操作数栈 | 说明 |
| --- | --- | --- |
| `2` | `[2]` | 数字直接入栈 |
| `1` | `[2, 1]` | 数字直接入栈 |
| `+` | `[3]` | 计算 `2 + 1` |
| `3` | `[3, 3]` | 数字直接入栈 |
| `*` | `[9]` | 计算 `3 × 3` |

扫描结束时栈中恰好剩下一个值 `9`，因此表达式合法。

## 边界与验收重点

- 减法和除法不能交换左右操作数。
- 负数 token 必须按整数而不是运算符解析。
- 操作数不足、结果残留和除零都输出 ERROR。

标准输入均满足题面列出的命令和数据约束。除题面明确规定的失败操作外，不需要为未知命令设计行为。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/lab-02-07-evaluate-rpn
pnpm lab:run -- labs/chapter-02/lab-02-07-evaluate-rpn
pnpm lab:run -- labs/chapter-02/lab-02-07-evaluate-rpn --case 001-sample
pnpm lab:score -- labs/chapter-02/lab-02-07-evaluate-rpn
```

`make run` 在答案尚未全对时仍正常返回；`make score` 只有得到 100 分才返回成功。样例采用精确输出比较；`009-scale` 使用近四万个 token 检查一次扫描能否在时限内完成。

- [ ] 正常表达式以及四类 `ERROR` 情况全部通过
- [ ] 减法、除法和负数 token 的处理正确
- [ ] 结束时检查栈中是否恰好剩一个值
- [ ] 能说明每个 token 只被处理一次，因此时间为 `O(n)`

## 思考与复盘

1. 为什么遇到运算符时必须先保存 `right`？
2. 合法表达式结束时为什么必须恰好剩一个栈元素？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

从左到右扫描 token。整数压入操作数栈；遇到运算符时先弹出右操作数 `right`，再弹出左操作数 `left`，将 `left op right` 的结果压回。

若运算符出现时不足两个操作数、发生除零、token 既不是整数也不是运算符，或扫描结束后栈中不恰好剩一个值，表达式均非法。

### 算法步骤

1. 尝试把 token 完整解析为 64 位整数，成功则入栈；
2. 否则确认它是四种运算符之一，并检查栈中至少有两个值；
3. 依次弹出 `right`、`left`，检查除零后计算并压回；
4. 扫描完毕，只有栈大小为 1 时输出结果，否则输出 `ERROR`。

### 复杂度分析

- 时间复杂度：`O(n)`；
- 额外空间：`O(n)`，全为操作数时栈达到最大。

### 边界注意

- `-3` 是整数 token，不是减号运算符；
- `8 3 -` 应计算 `8 - 3`，不能写成 `3 - 8`；
- `1 2` 虽然没有局部错误，但最终残留两个值，因此仍应输出 `ERROR`。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

bool parse_integer(const std::string& token, long long& value) {
    try {
        std::size_t parsed = 0;
        value = std::stoll(token, &parsed);
        return parsed == token.size();
    } catch (const std::invalid_argument&) {
        return false;
    } catch (const std::out_of_range&) {
        return false;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> stack;
    stack.reserve(n);
    bool valid = true;

    for (std::size_t i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        if (!valid) continue;

        long long value = 0;
        if (parse_integer(token, value)) {
            stack.push_back(value);
            continue;
        }

        const bool is_operator = token == "+" || token == "-" || token == "*" || token == "/";
        if (!is_operator || stack.size() < 2) {
            valid = false;
            continue;
        }

        const long long right = stack.back();
        stack.pop_back();
        const long long left = stack.back();
        stack.pop_back();

        if (token == "+") stack.push_back(left + right);
        else if (token == "-") stack.push_back(left - right);
        else if (token == "*") stack.push_back(left * right);
        else if (right == 0) valid = false;
        else stack.push_back(left / right);
    }

    if (!valid || stack.size() != 1) std::cout << "ERROR\n";
    else std::cout << stack.back() << '\n';
}
```

</details>
