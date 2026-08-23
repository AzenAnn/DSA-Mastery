---
title: "Lab 04-05：从前序与中序遍历构造二叉树"
description: "通过前序确定根节点与中序划分区间的区间分治思想恢复二叉树。"
order: 5
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～35 分钟"
---

# Lab 04-05：从前序与中序遍历构造二叉树

在第 4.3.4 节中，我们推导了**唯一确定一棵二叉树的定理**：前序遍历与中序遍历结合，可以唯一重构出二叉树结构。

## 题目

给定两个整数数组 `preorder` 和 `inorder`，其中 `preorder` 是二叉树的先序遍历，`inorder` 是同一棵树的中序遍历（节点值各不相同），请构造二叉树并分别输出其**后序遍历**与**层序遍历**。

## 输入格式
- 第一行：节点总数 $n$；
- 第二行：$n$ 个整数，表示前序遍历；
- 第三行：$n$ 个整数，表示中序遍历。

## 输出格式
- 第一行：`POSTORDER:` 后跟空格分隔的后序遍历序列；
- 第二行：`LEVELORDER:` 后跟空格分隔的层序遍历序列。

## 样例

### 样例输入 1
```input
5
3 9 20 15 7
9 3 15 20 7
```

### 样例输出 1
```output
POSTORDER: 9 15 7 20 3
LEVELORDER: 3 9 20 15 7
```

### 样例输入 2
```input
4
1 2 3 4
4 3 2 1
```

### 样例输出 2
```output
POSTORDER: 4 3 2 1
LEVELORDER: 1 2 3 4
```

### 样例输入 3
```input
1
1
1
```

### 样例输出 3
```output
POSTORDER: 1
LEVELORDER: 1
```

### 区间分治示意图

```text
前序序列：[ 根节点 |      左子树前序      |      右子树前序      ]
         preL    preL+1 ... preL+Lsize   preL+Lsize+1 ... preR

中序序列：[      左子树中序      | 根节点 |      右子树中序      ]
         inL ... inRoot-1         inRoot  inRoot+1 ... inR

左子树节点个数 Lsize = inRoot - inL
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

1. 前序遍历的第一个元素 `preorder[preL]` 必定是当前子树的**根节点**；
2. 利用哈希表 `inMap` 在 $O(1)$ 时间在中序序列中找到根节点的索引 `inRoot`；
3. 根节点将中序序列划分为左子树区间 `[inL, inRoot - 1]` 和右子树区间 `[inRoot + 1, inR]`；
4. 左子树节点数 `leftSize = inRoot - inL`，由此在前序中划分出左子树 `[preL + 1, preL + leftSize]` 和右子树 `[preL + leftSize + 1, preR]`；
5. 递归构造左右子树，完成二叉树重构。

### 复杂度分析

- **时间复杂度**：$O(n)$，使用哈希表预存中序索引后，重构每个节点耗时 $O(1)$。
- **空间复杂度**：$O(n)$，哈希表与递归调用栈开销。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <unordered_map>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

TreeNode* helper(const std::vector<int>& preorder, int preL, int preR,
                 const std::vector<int>& inorder, int inL, int inR,
                 const std::unordered_map<int, int>& inMap) {
    if (preL > preR || inL > inR) return nullptr;
    int rootVal = preorder[preL];
    TreeNode* root = new TreeNode(rootVal);
    int inRoot = inMap.at(rootVal);
    int leftSize = inRoot - inL;
    root->left = helper(preorder, preL + 1, preL + leftSize, inorder, inL, inRoot - 1, inMap);
    root->right = helper(preorder, preL + leftSize + 1, preR, inorder, inRoot + 1, inR, inMap);
    return root;
}

TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
    std::unordered_map<int, int> inMap;
    for (int i = 0; i < (int)inorder.size(); i++) inMap[inorder[i]] = i;
    return helper(preorder, 0, (int)preorder.size() - 1, inorder, 0, (int)inorder.size() - 1, inMap);
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-05-construct-binary-tree-pre-in
```
