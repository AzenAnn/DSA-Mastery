---
title: "Lab 05-E-02：二叉搜索树的删除"
description: "实现二叉搜索树（BST）的节点删除操作，并输出删除后的中序遍历。"
order: 7
chapter: 5
labId: "05E02"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 05-E-02：二叉搜索树的删除

BST 的删除操作比插入和查找更复杂，因为需要处理被删节点的子树重组问题。你需要实现三种情况的删除：叶子节点、只有一个子节点、有两个子节点。

## 题目

首先给定 $n$ 个互不相同的整数，按给定顺序依次插入一棵初始为空的 BST 中，构建出 BST。

然后给定 $m$ 个整数，表示要删除的值。保证每个待删值在删除时均存在于树中。按给定顺序依次删除。

最后输出该 BST 的**中序遍历**序列，以空格分隔。若树为空，输出 `null`。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$，表示插入的元素个数；
- 第二行 $n$ 个互不相同的整数，按顺序插入 BST；
- 第三行一个整数 $m$ $(0 \leq m \leq n)$，表示删除操作的次数；
- 第四行 $m$ 个整数，表示要删除的值。

## 输出格式

- 一行，输出中序遍历序列，整数间以单个空格分隔；若树为空则输出 `null`。

## 样例

### 样例输入
```input
7
50 30 70 20 40 60 80
2
30 70
```

### 样例输出
```output
20 40 50 60 80
```

### 样例解释

初始插入 $7$ 个节点后，BST 结构如下：

```text
      50
     /  \
   30    70
  / \    / \
20  40 60  80
```

- 删除 $30$：$30$ 有两个子节点，用其右子树的最小值 $40$ 替换，然后删除 $40$ 的原位置。

```text
      50
     /  \
   40    70
  /      / \
20      60  80
```

- 删除 $70$：$70$ 有两个子节点，用其右子树的最小值 $80$ 替换，然后删除 $80$ 的原位置。

```text
      50
     /  \
   40    80
  /      /
20      60
```

中序遍历结果为：$20, 40, 50, 60, 80$。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

BST 删除分三种情况：

1. **被删节点是叶子**：直接删除；
2. **被删节点只有一个子节点**：用子节点替代被删节点；
3. **被删节点有两个子节点**：找到右子树中的最小值（或左子树中的最大值）替代被删节点的值，然后递归删除那个最小（大）值节点。

第三种情况保证了替换后仍然满足 BST 性质。

### 复杂度分析

- **时间复杂度**：每次删除 $O(h)$，$m$ 次共 $O(m \cdot h)$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
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

TreeNode* findMin(TreeNode* root) {
    while (root && root->left) root = root->left;
    return root;
}

TreeNode* remove(TreeNode* root, int x) {
    if (!root) return nullptr;
    if (x < root->val) root->left = remove(root->left, x);
    else if (x > root->val) root->right = remove(root->right, x);
    else {
        if (!root->left) {
            TreeNode* tmp = root->right;
            delete root;
            return tmp;
        }
        if (!root->right) {
            TreeNode* tmp = root->left;
            delete root;
            return tmp;
        }
        TreeNode* succ = findMin(root->right);
        root->val = succ->val;
        root->right = remove(root->right, succ->val);
    }
    return root;
}

void inorder(TreeNode* root, vector<int>& res) {
    if (!root) return;
    inorder(root->left, res);
    res.push_back(root->val);
    inorder(root->right, res);
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
    int m;
    cin >> m;
    for (int i = 0; i < m; ++i) {
        int x; cin >> x;
        root = remove(root, x);
    }
    vector<int> res;
    inorder(root, res);
    if (res.empty()) {
        cout << "null\n";
    } else {
        for (size_t i = 0; i < res.size(); ++i) {
            if (i) cout << ' ';
            cout << res[i];
        }
        cout << '\n';
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-02-bst-delete
```
