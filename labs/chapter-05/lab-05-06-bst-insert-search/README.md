---
title: "Lab 05-06：二叉搜索树的插入与查找"
description: "实现二叉搜索树（BST）的基本操作：插入新节点与查找指定值。"
order: 6
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～25 分钟"
---

# Lab 05-06：二叉搜索树的插入与查找

在第 5.1 节中，我们学习了二叉搜索树（BST）的定义：对于任意节点，其左子树中所有节点的值均小于该节点的值，右子树中所有节点的值均大于该节点的值。本题要求你实现 BST 的插入与查找两个核心操作。

## 题目

给定 $q$ 个操作，操作分为两种：

- `I x`：将整数 $x$ 插入到 BST 中（若 $x$ 已存在，则忽略此操作）；
- `Q x`：查询整数 $x$ 是否在 BST 中。

你需要按顺序输出所有查询操作的结果。

## 输入格式

- 第一行一个整数 $q$ $(1 \leq q \leq 10^5)$，表示操作数量；
- 接下来 $q$ 行，每行一个字符和一个整数，格式为 `I x` 或 `Q x`。

## 输出格式

- 对于每个 `Q` 操作，输出一行：`Yes` 或 `No`。

## 样例

### 样例输入
```input
8
I 5
I 3
I 7
Q 3
Q 4
I 4
Q 4
Q 5
```

### 样例输出
```output
Yes
No
Yes
Yes
```

### 样例解释

前三个 `I` 操作依次插入 $5, 3, 7$，构建出如下 BST：

```text
    5
   / \
  3   7
```

- `Q 3`：$3$ 在树中，输出 `Yes`；
- `Q 4`：$4$ 不在树中，输出 `No`；
- `I 4` 插入 $4$ 后，树变为：

```text
    5
   / \
  3   7
   \
    4
```

- `Q 4`：此时 $4$ 已在树中，输出 `Yes`；
- `Q 5`：$5$ 是根节点，输出 `Yes`。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

BST 的插入与查找遵循相同的搜索路径：

1. **查找**：从根出发，目标值小于当前节点值则向左走，大于则向右走，相等则找到；走到空指针说明不存在。
2. **插入**：沿查找路径走到空指针位置，创建新节点接入。

两个操作的时间复杂度均取决于树高，理想情况下为 $O(\log n)$。

### 复杂度分析

- **时间复杂度**：每次操作 $O(h)$，其中 $h$ 为树高；
- **空间复杂度**：$O(n)$ 存储节点。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* insert(TreeNode* root, int x) {
    if (!root) return new TreeNode(x);
    if (x < root->val) root->left = insert(root->left, x);
    else if (x > root->val) root->right = insert(root->right, x);
    return root;
}

bool search(TreeNode* root, int x) {
    if (!root) return false;
    if (x == root->val) return true;
    if (x < root->val) return search(root->left, x);
    return search(root->right, x);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    TreeNode* root = nullptr;
    while (q--) {
        char op;
        int x;
        cin >> op >> x;
        if (op == 'I') {
            root = insert(root, x);
        } else {
            cout << (search(root, x) ? "Yes" : "No") << '\n';
        }
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-06-bst-insert-search
```
