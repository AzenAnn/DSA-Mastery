---
title: "Lab 04-18：另一棵树的子树"
description: "通过双重递归或树结构哈希判定一棵树是否包含另一棵树的全部结构。"
order: 18
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-18：另一棵树的子树

在第 4.6.2 节中，我们探讨了子结构匹配问题。

## 题目

给你两棵二叉树 `root` 和 `subRoot` 。检验 `root` 中是否包含和 `subRoot` 具有相同结构和节点值的子树。如果存在，返回 `true` ；否则，返回 `false` 。

## 输入格式
- 第一行：主树 `root` 的层序遍历序列；
- 第二行：子树 `subRoot` 的层序遍历序列。

## 输出格式
- 输出一行 `true` 或 `false`。

## 样例

### 样例输入 1
```input
3 4 5 1 2
4 1 2
```

### 样例输出 1
```output
true
```

### 样例输入 2
```input
3 4 5 1 2 null null null null 0
4 1 2
```

### 样例输出 2
```output
false
```

### 样例输入 3
```input
1 2 3
1 2 3
```

### 样例输出 3
```output
true
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

双重递归：
1. 编写 `isSameTree(s, t)` 判断以 `s` 和 `t` 为根的两棵树是否全等；
2. 主函数中：若 `isSameTree(root, subRoot)` 成立则返回 `true`，否则递归在 `root->left` 或 `root->right` 中寻找子树。

### 复杂度分析

- **时间复杂度**：$O(|root| 	imes |subRoot|)$。
- **空间复杂度**：$O(max(h_{root}, h_{subRoot}))$。

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

bool isSameTree(TreeNode* s, TreeNode* t) {
    if (!s && !t) return true;
    if (!s || !t) return false;
    return (s->val == t->val) && isSameTree(s->left, t->left) && isSameTree(s->right, t->right);
}

bool isSubtree(TreeNode* root, TreeNode* subRoot) {
    if (!root) return false;
    if (isSameTree(root, subRoot)) return true;
    return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-09-subtree-of-another-tree
```
