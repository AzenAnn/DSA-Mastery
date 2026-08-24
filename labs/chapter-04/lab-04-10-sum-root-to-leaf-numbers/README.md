---
title: "Lab 04-10：求根节点到叶节点数字之和"
description: "利用前序遍历与自顶向下数值累乘累加，计算所有根到叶数字的总和。"
order: 10
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-10：求根节点到叶节点数字之和

在第 4.6.4 节中，我们学习了二叉树的“路径类”问题。

## 题目

给你一个二叉树的根节点 `root` ，树中每个节点都存放有一个 `0` 到 `9` 之间的数字。
每条从根节点到叶节点的路径都代表一个数字：
- 例如，从根到叶节点的路径 `1 -> 2 -> 3` 表示数字 `123` 。
计算从根节点到叶节点生成的**所有数字之和**。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 输出一个整数，表示所有路径数字的总和。

## 样例

### 样例输入 1
```input
1 2 3
```

### 样例输出 1
```output
25
```

### 样例输入 2
```input
4 9 0 5 1
```

### 样例输出 2
```output
1026
```

### 样例输入 3
```input
9
```

### 样例输出 3
```output
9
```

### 样例解释

对于样例 2（树形：根 4，左孩子 9 [子节点 5, 1]，右孩子 0）：
- 路径 4->9->5 对应数字 495；
- 路径 4->9->1 对应数字 491；
- 路径 4->0 对应数字 40；
- 总和 = 495 + 491 + 40 = 1026。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

自顶向下前序传递：
- 当前路径值 `curSum = prevSum * 10 + root->val`；
- 若到达叶子节点（`!root->left && !root->right`），返回 `curSum`；
- 否则递归返回左子树与右子树的路径和之和。

### 复杂度分析

- **时间复杂度**：$O(n)$。
- **空间复杂度**：$O(h)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

int dfs(TreeNode* root, int prevSum) {
    if (!root) return 0;
    int sum = prevSum * 10 + root->val;
    if (!root->left && !root->right) return sum;
    return dfs(root->left, sum) + dfs(root->right, sum);
}

int sumNumbers(TreeNode* root) {
    return dfs(root, 0);
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-10-sum-root-to-leaf-numbers
```
