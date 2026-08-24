---
title: "Lab 04-11：二叉树的前序遍历"
description: "实现二叉树的前序遍历（根 -> 左 -> 右），掌握递归与显式栈迭代两种经典 DFS 解法。"
order: 11
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-24"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～20 分钟"
---

# Lab 04-11：二叉树的前序遍历

## 实验目的

1. 深刻理解二叉树前序遍历（$DLR$：根 $\to$ 左 $\to$ 右）的定义与访问时机；
2. 掌握二叉树递归遍历的极简写法；
3. 掌握基于显式栈（`std::stack`）消除递归的迭代遍历模板。

---

## 题目描述

给定一棵二叉树的根节点 `root`，请返回其节点值的 **前序遍历** 序列。

### 输入格式

输入包含一行，为二叉树的层序序列（以空格分隔，`null` 或 `#` 表示空节点）。若输入为空树，则输入为单行 `null` 或空行。

### 输出格式

输出一行，为二叉树前序遍历得到的节点值序列，以空格分隔。若树为空，则输出空行。

---

## 样例说明

### 样例 1

**输入**：
```text
1 null 2 3
```

**输出**：
```text
1 2 3
```

**图解**：
```text
  1
   \
    2
   /
  3
前序遍历: 根(1) -> 左(空) -> 右(2 -> 左(3)) ==> 1 2 3
```

---

### 样例 2

**输入**：
```text
null
```

**输出**：
```text

```

**解释**：空树的前序遍历序列为空。

---

### 样例 3

**输入**：
```text
1 2 3 4 5 6 7
```

**输出**：
```text
1 2 4 5 3 6 7
```

**图解**：
```text
        1
      /   \
    2       3
   / \     / \
  4   5   6   7
前序遍历: 1 -> (2 -> 4 -> 5) -> (3 -> 6 -> 7) ==> 1 2 4 5 3 6 7
```

---

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

前序遍历的访问顺序为 **根节点 $\to$ 左子树 $\to$ 右子树**。

1. **递归法**：
   - 终止条件：`root == nullptr` 直接返回；
   - 访问当前根节点 `res.push_back(root->val)`；
   - 递归前序遍历左子树 `dfs(root->left)`；
   - 递归前序遍历右子树 `dfs(root->right)`。

2. **显式栈迭代法（通用模板）**：
   - 使用一个辅助栈 `std::stack<TreeNode*>`；
   - 先将根节点压入栈；
   - 每次从栈顶弹出节点访问其值；
   - **关键点**：由于栈是后进先出（LIFO），为了先访问左子树，必须**先压入右孩子，再压入左孩子**。

### 复杂度分析

- **时间复杂度**：$\Theta(n)$，每个节点进出栈一次，访问常数时间。
- **空间复杂度**：$\Theta(h)$，递归调用栈或显式栈的最大深度等于树的高度 $h$（最好 $O(\log n)$，最坏单链 $O(n)$）。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp:line-numbers [solution/main.cpp]
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <stack>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

std::vector<int> preorderTraversal(TreeNode* root) {
    std::vector<int> res;
    if (root == nullptr) return res;

    std::stack<TreeNode*> st;
    st.push(root);

    while (!st.empty()) {
        TreeNode* node = st.top();
        st.pop();
        res.push_back(node->val);

        if (node->right != nullptr) st.push(node->right);
        if (node->left != nullptr)  st.push(node->left);
    }
    return res;
}
```

</details>
