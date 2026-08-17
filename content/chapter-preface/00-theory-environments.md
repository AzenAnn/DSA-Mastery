---
title: "前言 · 理论环境展示"
description: "集中预览 DSA Mastery 理论文档中的正文、定义、定理、性质、证明、行内语义与代码工作台。"
order: 0
chapter: "preface"
chapterTitle: "课程作者指南"
updated: "2026-08-17"
contributors: ["Azen"]
status: "draft"
---

# 前言 · 理论环境展示

这是一篇只用于展示的环境样板。它不承担新的数据结构教学内容，而是把 DSA Mastery 已支持的理论语法放进一篇真实课程文档，方便作者检查写法，也方便读者预览浅色、深色和移动端的实际效果。

::: info 完整作者指南
本页用于快速预览，完整语法、选择规则、正确与错误示例请查看：

[`docs/THEORY_DOC_STYLE_GUIDE.md`](https://github.com/AzenAnn/DSA-Mastery/blob/main/docs/THEORY_DOC_STYLE_GUIDE.md)
:::

## 正文与基础排版

正文应先把问题讲清楚，再用理论环境标出需要稳定识别的知识角色。普通段落适合背景、推导过程和上下文连接；标题负责建立层级，列表和表格负责整理并列信息。

### 段落、列表与表格

一段完整的理论说明通常包含对象、前提、结论和适用范围。例如，分析一个算法时，可以按下面的顺序组织：

1. 明确输入规模 `n`；
2. 选定基本操作；
3. 计算操作次数；
4. 写出时间与空间结论；
5. 说明结论成立的前提。

| 内容角色 | 推荐表达 | 目的 |
| --- | --- | --- |
| 背景说明 | 普通正文 | 保持阅读连续性 |
| 严格约定 | `definition` | 稳定术语含义 |
| 可证明结论 | `theorem` / `property` | 突出逻辑地位 |
| 风险边界 | `pitfall` | 避免错误迁移 |

> 引用块适合引用已有结论或补充来源，不应替代定义、定理等明确语义。

### 行内语义

写作 `==逻辑结构不等于存储结构==` 可以得到 ==逻辑结构不等于存储结构== 这样的克制高亮，而 `a == b` 仍然是普通行内代码。首次正式引入的术语可以写作 <dfn>抽象数据类型</dfn>；键盘操作可以写作 <kbd>Ctrl</kbd> + <kbd>K</kbd>。

有限语义文字类只表达短文本角色：

- <span class="dsa-text-accent">概念关联使用 accent</span>；
- <span class="dsa-text-success">成立或完成使用 success</span>；
- <span class="dsa-text-signal">风险与反例使用 signal</span>；
- <span class="dsa-text-muted">辅助信息使用 muted</span>。

行内公式如 $T(n)=2n+1$，展示公式如

$$
\sum_{i=1}^{n} i=\frac{n(n+1)}{2}
$$

都由 MathJax 渲染。

## 理论语义环境

### 定义、定理与推导

::: definition 定义 · 路径
在图中，路径是一个顶点序列，其中任意两个相邻顶点之间都有边相连。
:::

::: theorem 定理 · 前 n 个正整数之和
对任意正整数 $n$，都有

$$
1+2+\cdots+n=\frac{n(n+1)}{2}.
$$
:::

::: lemma 引理 · 前 n 个奇数
前 $n$ 个正奇数之和为 $n^2$。
:::

::: corollary 推论 · 平方差
由引理可得 $(n+1)^2-n^2=2n+1$。
:::

::: property 性质 · 栈顶操作
栈的插入与删除都发生在栈顶，因此它具有后进先出的操作特征。
:::

::: proof 证明 · 前 n 个正整数之和
首尾配对时，每一对的和都是 $n+1$。根据项数的奇偶分别处理，均可得到总和为 $\frac{n(n+1)}{2}$。
:::

### 理解、示例与边界

::: intuition 直觉 · 二分查找
每次比较都排除约一半候选区间，因此候选数量经历 $n,\frac n2,\frac n4,\ldots$，直到只剩常数个元素。
:::

::: example 示例 · 括号匹配
扫描 `([])` 时，左括号依次入栈；遇到右括号时检查并弹出对应的最近左括号，最终栈为空。
:::

::: counterexample 反例 · 两层循环
“代码中出现两层循环，所以一定是 $\Theta(n^2)$”并不成立。若内层循环每次把变量除以 2，总复杂度可能是 $\Theta(n\log n)$。
:::

::: complexity 复杂度 · 顺序查找
令 `n` 为元素个数。目标不存在时需要检查全部 `n` 个元素，因此最坏时间复杂度为 $\Theta(n)$；若只使用常数个局部变量，辅助空间复杂度为 $\Theta(1)$。
:::

::: pitfall 易错点 · 渐近上界
大 O 表示渐近上界，==不天然等于最坏情况==。最好、最坏和平均描述输入情况，O、Ω、Θ描述函数之间的渐近界。
:::

## 原生 Callout

通用信息继续使用 VitePress 原生环境，不必把每一条提示都升级为理论块。

::: tip 学习建议
先阅读普通正文形成上下文，再依次定位定义、性质、证明与易错点。
:::

::: warning 使用边界
颜色只是辅助线索。正文必须明确写出“定义”“反例”或“易错点”等角色，不能只写“看红色区域”。
:::

::: details 查看环境选择原则
严格术语使用 `definition`；需要论证的重要结论使用 `theorem`；稳定特征使用 `property`；常见错误使用 `pitfall`。如果只是一般提示，优先使用原生 callout。
:::

## 代码工作台

普通 fenced code 可以显示语言、文件名、行号和 Shiki 行标注。下面同时展示 focus、diff、warning 和 error：

```cpp:line-numbers [theory-environment-demo.cpp]
#include <vector>

int sum(const std::vector<int>& values) {
    int total = 0;                         // [!code focus]
    for (int value : values) {
        total += value;                    // [!code ++]
        total = total + value;             // [!code --]
    }
    int unchecked = values[values.size()]; // [!code warning]
    return missing_name;                   // [!code error]
}
```

代码组使用原生 tabs 展示不同实现，文件名不会在工具栏重复出现。

::: code-group

```cpp [iterative.cpp]
int factorial(int n) {
    int answer = 1;
    for (int value = 2; value <= n; ++value) {
        answer *= value;
    }
    return answer;
}
```

```cpp [recursive.cpp]
int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```

:::

样例输入与输出仍使用固定的深色代码表面：

```input
5
```

```output
120
```

## 使用建议

展示页的作用是确认“语义是否选对、页面是否可读、代码工具是否正常”。正式写作时不必让每一节都出现所有环境；只选择真正帮助读者建立结构的那一种。

需要复制语法时，请回到完整作者指南：

**地址：** [`docs/THEORY_DOC_STYLE_GUIDE.md`](https://github.com/AzenAnn/DSA-Mastery/blob/main/docs/THEORY_DOC_STYLE_GUIDE.md)

需要新增选择题、单题 C++ 作业或大型多任务 Lab 时，请使用统一的 Schema、`make run` 与评分工作流：

**站内阅读：** [Lab 更新与测试指南](./01-lab-authoring-guide.md)
