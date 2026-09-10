---
title: "Lab 05-E-04：BST 中第 k 小的元素"
description: "在二叉搜索树中高效查找第 k 小的元素，支持多次查询。"
order: 9
chapter: 5
labId: "05E04"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 05-E-04：BST 中第 k 小的元素

BST 的中序遍历结果是有序的，因此第 $k$ 小的元素就是中序遍历中第 $k$ 个被访问的节点。利用这一性质，可以在 $O(h)$ 时间内完成单次查询。

## 题目

给定一棵由 $n$ 个互不相同的整数构建的 BST，以及 $q$ 个查询。每个查询给出一个整数 $k$，要求输出 BST 中第 $k$ 小的元素。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$，表示 BST 的节点数；
- 第二行 $n$ 个整数，按插入顺序构建 BST；
- 第三行一个整数 $q$ $(1 \leq q \leq 10^5)$，表示查询次数；
- 接下来 $q$ 行，每行一个整数 $k$ $(1 \leq k \leq n)$。

## 输出格式

- 对于每个查询，输出一行一个整数，表示第 $k$ 小的元素。

## 样例

### 样例输入
```input
7
50 30 70 20 40 60 80
5
1
3
5
7
4
```

### 样例输出
```output
20
40
60
80
50
```

### 样例解释

BST 的中序遍历序列为：$20, 30, 40, 50, 60, 70, 80$。

- 第 $1$ 小：$20$
- 第 $3$ 小：$40$
- 第 $5$ 小：$60$
- 第 $7$ 小：$80$
- 第 $4$ 小：$50$

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

利用 BST 中序遍历的有序性，可以在遍历过程中计数：

1. 对 BST 进行中序遍历（左-根-右）；
2. 维护一个计数器 `cnt`，每访问一个节点 `cnt++`；
3. 当 `cnt == k` 时，当前节点即为答案。

单次查询时间复杂度 $O(h + k)$，最坏 $O(n)$。若需频繁查询，可为每个节点维护子树大小，实现 $O(h)$ 查询。

### 复杂度分析

- **时间复杂度**：单次查询 $O(h + k)$，$q$ 次查询共 $O(q \cdot n)$ 最坏；
- **空间复杂度**：$O(h)$ 递归栈空间。

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
    else root->right = insert(root->right, x);
    return root;
}

int kthSmallest(TreeNode* root, int k, int& cnt) {
    if (!root) return -1;
    int left = kthSmallest(root->left, k, cnt);
    if (left != -1) return left;
    if (++cnt == k) return root->val;
    return kthSmallest(root->right, k, cnt);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        root = insert(root, x);
    }
    int q;
    cin >> q;
    while (q--) {
        int k;
        cin >> k;
        int cnt = 0;
        cout << kthSmallest(root, k, cnt) << '\n';
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-04-bst-kth-smallest
```
