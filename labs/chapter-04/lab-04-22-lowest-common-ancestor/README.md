---
title: "Lab 04-22：二叉树的最近公共祖先"
description: "利用后序遍历自底向上汇聚左右子树目标节点状态，求解最近公共祖先 LCA。"
order: 22
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～35 分钟"
---

# Lab 04-22：二叉树的最近公共祖先

在第 4.6.5 节中，我们探讨了后序遍历状态汇聚的经典代表——最近公共祖先（Lowest Common Ancestor, LCA）。

## 题目

给定一个二叉树, 找到该树中两个指定节点 $p$ 和 $q$ 的**最近公共祖先 (LCA)**。
根据百度百科中对 LCA 的定义：“对于有根树 T 的两个节点 p、q，最近公共祖先表示为一个节点 x，满足 x 是 p、q 的祖先且 x 的深度尽可能大（一个节点也可以是它自己的祖先）。”

## 输入格式
- 第一行：二叉树的层序遍历序列；
- 第二行：两个整数 $p$ 和 $q$。

## 输出格式
- 输出一个整数，表示最近公共祖先节点的值。

## 样例

### 样例输入 1
```input
3 5 1 6 2 0 8 null null 7 4
5 1
```

### 样例输出 1
```output
3
```

### 样例输入 2
```input
3 5 1 6 2 0 8 null null 7 4
5 4
```

### 样例输出 2
```output
5
```

### 样例输入 3
```input
1 2
1 2
```

### 样例输出 3
```output
1
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

利用后序遍历自底向上汇聚状态：
1. **基底条件**：若当前节点为空，或当前节点就是 $p$ 或 $q$，直接返回当前节点；
2. **递归子问题**：在左子树中查找 $p, q$，得到结果 `left`；在右子树中查找 $p, q$，得到结果 `right`；
3. **状态汇聚判定**：
   - 若 `left` 和 `right` 均非空，说明 $p$ 和 $q$ 分布在当前节点的两侧，当前节点就是最近公共祖先，返回 `root`；
   - 若只有一侧非空，说明 $p$ 和 $q$ 都在那一侧（或者找到的那个节点本身就是祖先），返回非空的那一侧指针；
   - 若两侧均为空，返回 `nullptr`。

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

TreeNode* lowestCommonAncestor(TreeNode* root, int p, int q) {
    if (!root || root->val == p || root->val == q) return root;
    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);
    if (left && right) return root;
    return left ? left : right;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-13-lowest-common-ancestor
```
