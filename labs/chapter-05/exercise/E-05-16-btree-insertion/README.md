---
title: "Lab 05-E-16：B 树的插入"
description: "实现 B 树的插入操作，包括节点分裂，输出插入完成后 B 树的层序遍历。"
order: 21
chapter: 5
labId: "05E16"
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "40～60 分钟"
---

# Lab 05-E-16：B 树的插入

B 树是一种自平衡的搜索树，专为磁盘存储设计。一棵 $m$ 阶 B 树满足：每个节点最多有 $m$ 个子节点，最多 $m-1$ 个关键字；除根节点外，每个节点至少有 $\lceil m/2 \rceil$ 个子节点。

## 题目

给定一棵 $m$ 阶 B 树的阶数 $m$，以及 $n$ 个互不相同的整数。按顺序依次插入到一棵初始为空的 B 树中。

插入完成后，输出 B 树的**关键字层序遍历**：按层输出每个节点的关键字，节点之间用 `;` 分隔，同一节点内的关键字用空格分隔。

## 输入格式

- 第一行两个整数 $m$ 和 $n$ $(3 \leq m \leq 10, 1 \leq n \leq 100)$；
- 第二行 $n$ 个互不相同的整数，按顺序插入。

## 输出格式

- 一行，按层输出每个节点的关键字。

## 样例

### 样例输入
```input
3 7
10 20 30 40 50 60 70
```

### 样例输出
```output
40;20;60;10;30;50;70
```

### 样例解释

$m=3$ 阶 B 树，每个节点最多 $2$ 个关键字，最少 $1$ 个关键字（除根外）。

插入过程：
1. 插入 $10$：`[10]`
2. 插入 $20$：`[10, 20]`
3. 插入 $30$：`[10, 20, 30]` 临时溢出，分裂为中位数 $20$ 上升为根，左 $[10]$，右 $[30]$

```text
    [20]
   /    \
[10]  [30]
```

4. 插入 $40$：到右子树 `[30, 40]`
5. 插入 $50$：`[30, 40, 50]` 溢出，分裂。$40$ 上升到根，根变为 `[20, 40]`

```text
      [20, 40]
     /   |   \
  [10] [30] [50]
```

6. 插入 $60$：到 `[50, 60]`
7. 插入 $70$：`[50, 60, 70]` 溢出，分裂。$60$ 上升，根 `[20, 40]` 接收 $60$ 后变为 `[20, 40, 60]` 也溢出，再次分裂。

最终树：

```text
        [40]
       /    \
    [20]   [60]
   /   \   /   \
[10] [30][50] [70]
```

层序遍历：
- 第 1 层：`[40]` → `40`
- 第 2 层：`[20], [60]` → `20;60`
- 第 3 层：`[10], [30], [50], [70]` → `10;30;50;70`

合并输出：`40;20;60;10;30;50;70`

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

B 树插入采用**自底向上**的分裂策略：

1. 从根递归找到合适的叶子节点；
2. 将关键字插入叶子并排序；
3. 若插入后叶子关键字数超过 $m-1$，则分裂：
   - 取中位数关键字上升到父节点；
   - 原节点分裂为左右两个节点；
   - 返回上升的关键字和新右节点给父节点；
4. 父节点接收上升关键字后，若也超过 $m-1$，继续向上分裂；
5. 若根节点分裂，创建新根。

### 复杂度分析

- **时间复杂度**：$O(\log_m n)$ 每次插入；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

struct BTreeNode {
    vector<int> keys;
    vector<BTreeNode*> children;
    bool leaf;
    BTreeNode(bool l) : leaf(l) {}
};

pair<int, BTreeNode*> splitNode(BTreeNode* x, int m) {
    int mid = m / 2;
    int up = x->keys[mid];
    BTreeNode* right = new BTreeNode(x->leaf);
    right->keys.assign(x->keys.begin() + mid + 1, x->keys.end());
    if (!x->leaf) {
        right->children.assign(x->children.begin() + mid + 1, x->children.end());
        x->children.resize(mid + 1);
    }
    x->keys.resize(mid);
    return {up, right};
}

tuple<BTreeNode*, int, BTreeNode*> insertRec(BTreeNode* x, int k, int m) {
    if (x->leaf) {
        x->keys.push_back(k);
        sort(x->keys.begin(), x->keys.end());
        if ((int)x->keys.size() <= m - 1) return {x, -1, nullptr};
        auto [up, right] = splitNode(x, m);
        return {x, up, right};
    }
    int i = 0;
    while (i < (int)x->keys.size() && k > x->keys[i]) i++;
    auto [child, upChild, rightChild] = insertRec(x->children[i], k, m);
    if (upChild == -1) return {x, -1, nullptr};
    x->keys.insert(x->keys.begin() + i, upChild);
    x->children.insert(x->children.begin() + i + 1, rightChild);
    if ((int)x->keys.size() <= m - 1) return {x, -1, nullptr};
    auto [up, right] = splitNode(x, m);
    return {x, up, right};
}

BTreeNode* insert(BTreeNode* root, int k, int m) {
    if (!root) {
        root = new BTreeNode(true);
        root->keys.push_back(k);
        return root;
    }
    auto [node, up, right] = insertRec(root, k, m);
    if (up != -1) {
        BTreeNode* newRoot = new BTreeNode(false);
        newRoot->keys.push_back(up);
        newRoot->children.push_back(node);
        newRoot->children.push_back(right);
        return newRoot;
    }
    return node;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    BTreeNode* root = nullptr;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        root = insert(root, x, m);
    }
    if (!root) { cout << "null\n"; return 0; }
    vector<string> levels;
    queue<BTreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int sz = q.size();
        string level;
        for (int i = 0; i < sz; ++i) {
            BTreeNode* u = q.front(); q.pop();
            if (i) level += ";";
            for (size_t j = 0; j < u->keys.size(); ++j) {
                if (j) level += " ";
                level += to_string(u->keys[j]);
            }
            for (auto* v : u->children) q.push(v);
        }
        levels.push_back(level);
    }
    for (size_t i = 0; i < levels.size(); ++i) {
        if (i) cout << ";";
        cout << levels[i];
    }
    cout << '\n';
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/exercise/E-05-16-btree-insertion
```
