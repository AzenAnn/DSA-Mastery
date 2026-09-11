---
title: "Lab 05-E-06：将二叉搜索树变平衡"
description: "中序遍历提取有序序列，取中点重建高度平衡的二叉搜索树。"
order: 11
chapter: 5
labId: "05E06"
chapterTitle: "树的应用"
updated: "2026-09-10"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～35 分钟"
---

# Lab 05-E-06：将二叉搜索树变平衡

AVL 树靠旋转维持平衡；但如果允许“推倒重建”，中序遍历 + 取中点是最快也最不容易写挂的平衡化手段。

## 题目

给定一棵二叉搜索树，它的形状可能很不平衡（例如退化成链）。

请把它改建为一棵**高度平衡**的二叉搜索树（任意节点左右子树高度差不超过 $1$），并保持中序遍历序列不变。本题规定：对有序序列 $a_l, \dots, a_r$，取 $a_{(l+r)/2}$（向下取整）作为根。

## 输入格式

- 一行，给出原树的**层序遍历**：从上到下、从左到右输出节点值，`#` 表示空节点；行末的 `#` 可省略；
- 节点数 $n$ 满足 $1 \leq n \leq 10^4$，节点值互不相同且绝对值不超过 $10^9$；
- 数据保证输入是一棵合法的二叉搜索树。

## 输出格式

- 一行，输出新树的层序遍历，格式与输入相同（`#` 表示空节点，行末的 `#` 省略）。

## 样例

### 样例输入
```input
1 # 2 # 3 # 4
```

### 样例输出
```output
2 1 3 # # # 4
```

### 样例解释

- 原树是一条右链 $1 \to 2 \to 3 \to 4$，高度为 $4$；
- 中序遍历得到有序序列 $1\ 2\ 3\ 4$；
- 取中点 $a_{(0+3)/2} = a_1 = 2$ 作根；左半 $[1]$ 作左子树，右半 $[3, 4]$ 再取中点 $3$ 作右子树的根、$4$ 作其右孩子；
- 新树层序：$2\ 1\ 3\ \#\ \#\ \#\ 4$，高度降到 $3$ 且左右子树高度差不超过 $1$。

## 提示

BST 的中序遍历就是升序序列；对升序数组每次取中点建树，得到的树天然高度平衡。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

分两步：

1. **提取有序序列**：对原树做一次中序遍历，得到升序数组 $a$（BST 的性质保证了这一点）；
2. **取中点重建**：递归地，对区间 $[l, r]$ 取 $mid = (l + r) / 2$，以 $a_{mid}$ 为根，左半区间建左子树、右半区间建右子树。区间为空则返回空指针。

这样建树每层区间长度减半，树高 $O(\log n)$，且任意节点左右子树大小最多差 $1$，必然高度平衡；中序序列保持为 $a$，BST 性质不受影响。

输出层序遍历时，为每个节点输出两个孩子（空则输出 `#`），最后去掉行末多余的 `#`。

### 复杂度分析

- **时间复杂度**：$O(n)$
- **空间复杂度**：$O(n)$

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

struct Node {
    long long val;
    Node* left;
    Node* right;
    Node(long long v) : val(v), left(nullptr), right(nullptr) {}
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<string> tok;
    string s;
    while (cin >> s) tok.push_back(s);

    // ① 按层序建树
    Node* root = new Node(stoll(tok[0]));
    queue<Node*> qu;
    qu.push(root);
    size_t idx = 1;
    while (!qu.empty() && idx < tok.size()) {
        Node* cur = qu.front();
        qu.pop();
        if (tok[idx] != "#") {                      // 左孩子
            cur->left = new Node(stoll(tok[idx]));
            qu.push(cur->left);
        }
        ++idx;
        if (idx < tok.size() && tok[idx] != "#") {  // 右孩子
            cur->right = new Node(stoll(tok[idx]));
            qu.push(cur->right);
        }
        ++idx;
    }

    // ② 中序遍历 -> 有序数组
    vector<long long> in;
    vector<Node*> st;
    Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) {
            st.push_back(cur);
            cur = cur->left;
        }
        cur = st.back();
        st.pop_back();
        in.push_back(cur->val);
        cur = cur->right;
    }

    // ③ 取中点重建
    function<Node*(int, int)> build = [&](int l, int r) -> Node* {
        if (l > r) return nullptr;
        int mid = (l + r) / 2;
        Node* node = new Node(in[mid]);
        node->left = build(l, mid - 1);
        node->right = build(mid + 1, r);
        return node;
    };
    Node* nb = build(0, (int)in.size() - 1);

    // ④ 层序输出
    vector<string> out;
    queue<Node*> q2;
    if (nb) q2.push(nb);
    while (!q2.empty()) {
        Node* c = q2.front();
        q2.pop();
        if (!c) {
            out.push_back("#");
            continue;
        }
        out.push_back(to_string(c->val));
        q2.push(c->left);
        q2.push(c->right);
    }
    while (out.size() > 1 && out.back() == "#") out.pop_back();
    for (size_t i = 0; i < out.size(); ++i) {
        if (i) cout << ' ';
        cout << out[i];
    }
    cout << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-06-balance-bst-rebuild
```
