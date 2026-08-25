---
title: "Lab 05-10：AVL 树的插入与平衡"
description: "实现 AVL 树的插入操作，包括四种旋转（LL、RR、LR、RL），输出最终树的层序遍历。"
order: 10
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "40～60 分钟"
---

# Lab 05-10：AVL 树的插入与平衡

AVL 树是一棵自平衡的二叉搜索树，要求任意节点的左右子树高度差的绝对值不超过 $1$。当插入导致失衡时，需要通过旋转操作恢复平衡。本题要求你完整实现 AVL 树的插入及四种旋转。

## 题目

给定 $n$ 个互不相同的整数，按顺序依次插入一棵初始为空的 AVL 树中。插入完成后，输出该 AVL 树的**层序遍历**序列。

若某个节点的子节点为空，输出 `null` 占位；若某一层全为 `null` 则停止输出。输出格式与 LeetCode 层序序列一致。

## 输入格式

- 第一行一个整数 $n$ $(1 \leq n \leq 10^5)$；
- 第二行 $n$ 个互不相同的整数，按顺序插入 AVL 树。

## 输出格式

- 一行，输出层序遍历序列，以空格分隔，空子树用 `null` 占位。

## 样例

### 样例输入
```input
6
30 20 10 25 40 50
```

### 样例输出
```output
30 20 40 10 25 null 50
```

### 样例解释

逐步插入过程：

1. 插入 $30$：树为 `30`
2. 插入 $20$：树为 `30 / 20`
3. 插入 $10$：节点 $30$ 失衡（左子树高 2，右子树高 0），执行 **LL 旋转**，以 $20$ 为轴右旋。

```text
   20
  /  \
10    30
```

4. 插入 $25$：树为 `20 / 10 30 / null null 25 null`
5. 插入 $40$：树为 `20 / 10 30 / null null 25 40`
6. 插入 $50$：节点 $30$ 失衡（左子树高 1，右子树高 2），执行 **RR 旋转**，以 $40$ 为轴左旋。

最终树：

```text
      20
     /  \
   10    40
        /  \
      25    50
             /
           30  <-- 这里需要仔细推导
```

实际上最终 AVL 树为：

```text
      30
     /  \
   20    40
  /  \     \
10   25    50
```

层序遍历：$30, 20, 40, 10, 25, \text{null}, 50$

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

AVL 树的核心是维护每个节点的平衡因子（右子树高 - 左子树高），其绝对值不超过 $1$。插入后从插入点向上回溯更新高度并检查平衡：

- **平衡因子 = +2 且右子树平衡因子 >= 0**：RR 型，左旋；
- **平衡因子 = +2 且右子树平衡因子 < 0**：RL 型，先右旋再左旋；
- **平衡因子 = -2 且左子树平衡因子 <= 0**：LL 型，右旋；
- **平衡因子 = -2 且左子树平衡因子 > 0**：LR 型，先左旋再右旋。

每次旋转后更新相关节点的高度。

### 复杂度分析

- **时间复杂度**：每次插入 $O(\log n)$，共 $O(n \log n)$；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

struct Node {
    int val, h;
    Node *l, *r;
    Node(int x) : val(x), h(1), l(nullptr), r(nullptr) {}
};

int height(Node* t) { return t ? t->h : 0; }
int bf(Node* t) { return t ? height(t->r) - height(t->l) : 0; }
void upd(Node* t) { if (t) t->h = 1 + max(height(t->l), height(t->r)); }

Node* rotR(Node* y) {
    Node* x = y->l;
    y->l = x->r;
    x->r = y;
    upd(y); upd(x);
    return x;
}

Node* rotL(Node* x) {
    Node* y = x->r;
    x->r = y->l;
    y->l = x;
    upd(x); upd(y);
    return y;
}

Node* insert(Node* t, int v) {
    if (!t) return new Node(v);
    if (v < t->val) t->l = insert(t->l, v);
    else t->r = insert(t->r, v);
    upd(t);
    int b = bf(t);
    if (b < -1) {
        if (bf(t->l) > 0) t->l = rotL(t->l);
        return rotR(t);
    }
    if (b > 1) {
        if (bf(t->r) < 0) t->r = rotR(t->r);
        return rotL(t);
    }
    return t;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    Node* root = nullptr;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        root = insert(root, x);
    }
    if (!root) { cout << "null\n"; return 0; }
    vector<string> out;
    queue<Node*> q;
    q.push(root);
    while (!q.empty()) {
        Node* u = q.front(); q.pop();
        if (!u) {
            out.push_back("null");
            continue;
        }
        out.push_back(to_string(u->val));
        q.push(u->l);
        q.push(u->r);
    }
    while (out.size() > 1 && out.back() == "null") out.pop_back();
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
pnpm lab:run -- labs/chapter-05/lab-05-10-avl-tree-insert
```
