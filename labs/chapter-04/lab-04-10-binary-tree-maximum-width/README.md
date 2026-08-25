---
title: "Lab 04-10：二叉树的最大宽度"
description: "利用完全二叉树的父子编号性质计算二叉树的最大宽度。"
order: 10
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～35 分钟"
---

# Lab 04-10：二叉树的最大宽度

在第 4.2.3 节中，我们推导了完全二叉树的**父子节点编号性质**：若当前节点编号为 $i$（从 0 开始计数），其左孩子编号为 $2i+1$，右孩子编号为 $2i+2$。

## 题目

给定一棵二叉树，求其所有层中最大的层宽度。每一层的宽度定义为：该层最左端非空节点和最右端非空节点之间的节点数（包含中间的空节点）。

## 数据范围与限制
| 项目 | 范围 |
| --- | --- |
| 节点数 $n$ | $1 \le n \le 3000$ |
| 节点值 | $-100 \le \text{val} \le 100$ |
| 时间复杂度要求 | $O(n)$ |
| 空间复杂度要求 | $O(n)$ |

## 样例

### 样例输入 1
```input
1 3 2 5 3 null 9
```

### 样例输出 1
```output
4
```

### 样例输入 2
```input
1 3 2 5 null null 9 6 null 7
```

### 样例输出 2
```output
7
```

### 样例输入 3
```input
1 2 null 3 null 4 null
```

### 样例输出 3
```output
1
```

### 样例解释与编号追踪

```text
样例 1 树结构与层内虚拟编号：
          1          (层 0: 编号 0, 宽度 = 0 - 0 + 1 = 1)
        /   \
       3     2        (层 1: 编号 0, 1, 宽度 = 1 - 0 + 1 = 2)
      / \     \
     5   3     9      (层 2: 编号 0, 1, [2], 3, 宽度 = 3 - 0 + 1 = 4)

第 2 层最左节点为 5（编号 0），最右节点为 9（编号 3），跨度包含空位 [2]，总宽度为 4。
```

## 如何验证

```powershell
pnpm lab:run -- labs/chapter-04/lab-04-02-binary-tree-maximum-width
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

1. 若将二叉树按完全二叉树编号：根为 $0$，左孩子为 $2i+1$，右孩子为 $2i+2$；
2. 每一层的宽度 = $	ext{lastIndex} - 	ext{firstIndex} + 1$；
3. **大深度溢出防护**：当树极度倾斜（如单链树深度达 3000）时，$2^h$ 会迅速超出 64 位整数范围。核心优化是**每层入队时将索引减去该层的最小索引（firstIndex）进行归一化重置**。这样每层的第一个节点编号永远从 0 开始，彻底消除数值溢出风险。

### 算法步骤

1. 若 `root == nullptr`，返回 0；
2. 队列中存储 `pair<TreeNode*, uint64_t>`，初始压入 `{root, 0}`；
3. 记录全局最大宽度 `maxWidth = 0`；
4. 当队列不为空时：
   - 记录当前层大小 `size = q.size()`，提取当前层最左节点的编号 `minIndex = q.front().second`；
   - 遍历当前层的 `size` 个节点：
     - 归一化编号 `curIndex = index - minIndex`；
     - 记录当前层的第一个归一化编号 `first` 和最后一个编号 `last`；
     - 若有左孩子，将 `{left, 2 * curIndex + 1}` 入队；
     - 若有右孩子，将 `{right, 2 * curIndex + 2}` 入队；
   - 更新 `maxWidth = max(maxWidth, last - first + 1)`；
5. 返回 `maxWidth`。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点访问一次。
- **空间复杂度**：$O(n)$，BFS 队列存储。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>
#include <cstdint>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

uint64_t widthOfBinaryTree(TreeNode* root) {
    if (!root) return 0;
    uint64_t maxWidth = 0;
    std::queue<std::pair<TreeNode*, uint64_t>> q;
    q.push({root, 0});
    while (!q.empty()) {
        size_t size = q.size();
        uint64_t minIndex = q.front().second;
        uint64_t first = 0, last = 0;
        for (size_t i = 0; i < size; i++) {
            auto [node, index] = q.front();
            q.pop();
            uint64_t curIndex = index - minIndex;
            if (i == 0) first = curIndex;
            if (i == size - 1) last = curIndex;
            if (node->left) q.push({node->left, 2 * curIndex + 1});
            if (node->right) q.push({node->right, 2 * curIndex + 2});
        }
        maxWidth = std::max(maxWidth, last - first + 1);
    }
    return maxWidth;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-02-binary-tree-maximum-width
```
