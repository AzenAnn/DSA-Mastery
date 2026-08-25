---
title: "Lab 04-15：从中序与后序遍历构造二叉树"
description: "通过后序确定根节点与中序划分区间的镜像分治恢复二叉树。"
order: 15
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～35 分钟"
---

# Lab 04-15：从中序与后序遍历构造二叉树

在第 4.3.4 节中，我们学习了中序遍历与后序遍历结合重构二叉树的算法原理。

## 题目

给定两个整数数组 `inorder` 和 `postorder`，其中 `inorder` 是二叉树的中序遍历，`postorder` 是同一棵树的后序遍历（节点值各不相同），请构造二叉树并分别输出其**前序遍历**与**层序遍历**。

## 输入格式
- 第一行：节点总数 $n$；
- 第二行：$n$ 个整数，表示中序遍历；
- 第三行：$n$ 个整数，表示后序遍历。

## 输出格式
- 第一行：`PREORDER:` 后跟空格分隔的前序遍历序列；
- 第二行：`LEVELORDER:` 后跟空格分隔的层序遍历序列。

## 样例

### 样例输入 1
```input
5
9 3 15 20 7
9 15 7 20 3
```

### 样例输出 1
```output
PREORDER: 3 9 20 15 7
LEVELORDER: 3 9 20 15 7
```

### 样例输入 2
```input
4
4 3 2 1
4 3 2 1
```

### 样例输出 2
```output
PREORDER: 1 2 3 4
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
PREORDER: 1
LEVELORDER: 1
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

与前序+中序恢复对称：
1. 后序遍历的最后一个元素 `postorder[postR]` 必定是当前子树的**根节点**；
2. 利用哈希表找到根节点在中序序列中的位置 `inRoot`；
3. 左子树大小 `leftSize = inRoot - inL`；
4. 后序中左子树区间为 `[postL, postL + leftSize - 1]`，右子树区间为 `[postL + leftSize, postR - 1]`；
5. 递归求解。

### 复杂度分析

- **时间复杂度**：$O(n)$。
- **空间复杂度**：$O(n)$。

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

TreeNode* helper(const std::vector<int>& inorder, int inL, int inR,
                 const std::vector<int>& postorder, int postL, int postR,
                 const std::unordered_map<int, int>& inMap) {
    if (inL > inR || postL > postR) return nullptr;
    int rootVal = postorder[postR];
    TreeNode* root = new TreeNode(rootVal);
    int inRoot = inMap.at(rootVal);
    int leftSize = inRoot - inL;
    root->left = helper(inorder, inL, inRoot - 1, postorder, postL, postL + leftSize - 1, inMap);
    root->right = helper(inorder, inRoot + 1, inR, postorder, postL + leftSize, postR - 1, inMap);
    return root;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-06-construct-binary-tree-in-post
```
