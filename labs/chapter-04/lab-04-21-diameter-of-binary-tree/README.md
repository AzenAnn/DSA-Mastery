---
title: "Lab 04-21：二叉树的直径"
description: "理解单侧深度返回值与全局跨根最长路径的解耦，计算二叉树的直径。"
order: 21
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～30 分钟"
---

# Lab 04-21：二叉树的直径

在第 4.6.5 节中，我们建立了**二叉树后序状态解耦模型**：函数的返回值与全局维护的极值指标分离。

## 题目

给定一棵二叉树，你需要计算它的**直径长度**。一棵二叉树的直径长度是树中任意两个节点之间最长路径的**边数**。这条路径可能穿过也可能不穿过根节点。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 输出一个整数，表示二叉树的直径长度（边数）。

## 样例

### 样例输入 1
```input
1 2 3 4 5
```

### 样例输出 1
```output
3
```

### 样例输入 2
```input
1 2 null 3 4 5 null null 6
```

### 样例输出 2
```output
4
```

### 样例输入 3
```input
1
```

### 样例输出 3
```output
0
```

### 路径不经过根节点的典型结构

```text
样例 2 树形：
         1
        /
       2          <-- 最大直径经过节点 2（边数 = 4），而不穿过根节点 1！
      / \
     3   4
    /     \
   5       6
最长路径为 5 -> 3 -> 2 -> 4 -> 6，经过 4 条边，直径为 4。
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

1. 穿过节点 $u$ 的最长路径长度（边数）= 左子树最大深度 + 右子树最大深度；
2. 但为了让父节点继续计算，递归函数 **只能返回以当前节点为起点的单侧最大深度**：`max(leftDepth, rightDepth) + 1`；
3. 在后序遍历的过程中，利用引用变量 `maxDia` 随时用 `L + R` 更新全局最大直径。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点访问一次。
- **空间复杂度**：$O(h)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

int maxDepth(TreeNode* root, int& maxDia) {
    if (!root) return 0;
    int L = maxDepth(root->left, maxDia);
    int R = maxDepth(root->right, maxDia);
    maxDia = std::max(maxDia, L + R);
    return std::max(L, R) + 1;
}

int diameterOfBinaryTree(TreeNode* root) {
    int maxDia = 0;
    maxDepth(root, maxDia);
    return maxDia;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-12-diameter-of-binary-tree
```
