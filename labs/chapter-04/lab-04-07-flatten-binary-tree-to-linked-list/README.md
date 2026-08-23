---
title: "Lab 04-07：二叉树展开为链表"
description: "通过原地指针变换将二叉树按先序遍历顺序展开为单向右链表。"
order: 7
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～30 分钟"
---

# Lab 04-07：二叉树展开为链表

在第 4.4 节中，我们学习了线索化二叉树利用空指针重定向的思想。本题是先序遍历的原地指针重组经典题目。

## 题目

给你二叉树的根节点 `root` ，请你将它展开为一个单链表：
- 展开后的单链表应该同样使用 `TreeNode` ，其中 `right` 子指针指向链表中下一个节点，而 `left` 子指针始终为 `nullptr` 。
- 展开后的单链表应该与二叉树**先序遍历**顺序相同。
- 要求在原树上完成指针调整（原地修改，$O(1)$ 额外空间）。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 输出一行展开后单链表的节点值序列，以空格分隔；若为空树输出 `<empty>`。

## 样例

### 样例输入 1
```input
1 2 5 3 4 null 6
```

### 样例输出 1
```output
1 2 3 4 5 6
```

### 样例输入 2
```input
1 2 null 3 null
```

### 样例输出 2
```output
1 2 3
```

### 样例输入 3
```input
null
```

### 样例输出 3
```output
<empty>
```

### 原地指针嫁接示意图

```text
原树状态：                  找到左子树最右节点 4：           将 5 嫁接到 4 的右侧并右移：
    1                          1                             1
  /   \                       /   \                            \
 2     5                     2     5                            2
/ \     \                   / \     \                          / \
3   4     6                 3   4 --> 5                        3   4
                                       \                            \
                                        6                            5
                                                                      \
                                                                       6
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路（Morris 原地寻找前驱）

对于当前节点 `curr`：
1. 若其左孩子 `curr->left` 不为空，先序遍历中，`curr->right` 原本的所有节点必然排在 `curr->left` 这棵子树的最右节点（前驱节点）之后；
2. 因此，找到左子树的最右节点 `predecessor`，将 `curr->right` 嫁接到 `predecessor->right`；
3. 将 `curr->left` 移动到 `curr->right`，并将 `curr->left` 置为空；
4. 移动 `curr = curr->right`，继续处理下一个节点。

### 复杂度分析

- **时间复杂度**：$O(n)$，每条边最多被访问两次。
- **空间复杂度**：$O(1)$，无需递归栈或额外数组。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

void flatten(TreeNode* root) {
    TreeNode* curr = root;
    while (curr != nullptr) {
        if (curr->left != nullptr) {
            TreeNode* next = curr->left;
            TreeNode* predecessor = next;
            while (predecessor->right != nullptr) {
                predecessor = predecessor->right;
            }
            predecessor->right = curr->right;
            curr->left = nullptr;
            curr->right = next;
        }
        curr = curr->right;
    }
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-07-flatten-binary-tree-to-linked-list
```
