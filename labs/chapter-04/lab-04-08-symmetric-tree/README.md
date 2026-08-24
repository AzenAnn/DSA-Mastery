---
title: "Lab 04-08：对称二叉树判定"
description: "通过双树镜像下潜递归比较判定一棵二叉树是否镜像对称。"
order: 8
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～25 分钟"
---

# Lab 04-08：对称二叉树判定

在第 4.6.2 节中，我们讨论了二叉树的“判断类”问题。本题考查经典的双树同步镜像递归比较。

## 题目

给你一个二叉树的根节点 `root` ，检查它是否轴对称（即是否为自身的镜像）。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 一行输出 `true` 或 `false`。

## 样例

### 样例输入 1
```input
1 2 2 3 4 4 3
```

### 样例输出 1
```output
true
```

### 样例输入 2
```input
1 2 2 null 3 null 3
```

### 样例输出 2
```output
false
```

### 样例输入 3
```input
1
```

### 样例输出 3
```output
true
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

对称的本质是：左子树的左孩子与右子树的右孩子对称，且左子树的右孩子与右子树的左孩子对称。
定义辅助函数 `check(TreeNode* p, TreeNode* q)`：
- 若 `p` 与 `q` 均为空，返回 `true`；
- 若只有一个为空，或值不相等，返回 `false`；
- 递归返回 `check(p->left, q->right) && check(p->right, q->left)`。

### 复杂度分析

- **时间复杂度**：$O(n)$。
- **空间复杂度**：$O(h)$，调用栈深度。

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

bool check(TreeNode* p, TreeNode* q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    return (p->val == q->val) && check(p->left, q->right) && check(p->right, q->left);
}

bool isSymmetric(TreeNode* root) {
    return check(root, root);
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-08-symmetric-tree
```
