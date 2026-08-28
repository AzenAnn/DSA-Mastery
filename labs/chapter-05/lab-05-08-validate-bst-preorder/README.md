---
title: "Lab 05-08：验证 BST 先序遍历序列"
description: "给定一个整数序列，判断它是否可以作为某棵 BST 的先序遍历序列。"
order: 8
chapter: 5
chapterTitle: "树的应用"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～35 分钟"
---

# Lab 05-08：验证 BST 先序遍历序列

BST 的先序遍历序列具有特殊性质：序列的第一个元素是根节点，后续元素被划分为两段——小于根的一段（左子树）和大于根的一段（右子树）。利用这一性质，可以在不重建树的情况下进行验证。

## 题目

给定一个长度为 $n$ 的整数序列，判断它是否可以作为某棵二叉搜索树的先序遍历序列。

注意：序列中的值**互不相同**。

## 输入格式

- 第一行一个整数 $T$ $(1 \leq T \leq 10)$，表示测试组数；
- 每组数据：第一行一个整数 $n$ $(1 \leq n \leq 10^5)$，第二行 $n$ 个整数。

## 输出格式

- 对于每组数据，输出 `Yes` 或 `No`。

## 样例

### 样例输入
```input
3
5
40 30 35 80 100
5
40 30 35 25 80
3
1 2 3
```

### 样例输出
```output
Yes
No
Yes
```

### 样例解释

- **第一组** `40 30 35 80 100`：根为 $40$，左子树先序为 `30 35`（均小于 $40$），右子树先序为 `80 100`（均大于 $40$）。递归验证左右子序列均合法，故输出 `Yes`。

- **第二组** `40 30 35 25 80`：根为 $40$，左子树部分 `30 35 25` 中，$35 > 30$ 应在 $30$ 的右子树，但 $25 < 30$ 又出现在 $35$ 之后，破坏了 BST 先序的性质。故输出 `No`。

- **第三组** `1 2 3`：可构成只有右子树的 BST，输出 `Yes`。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

BST 先序序列的验证可利用单调栈优化到 $O(n)$：

1. 维护一个栈模拟先序遍历的递归过程；
2. 同时维护一个变量 `lastPop` 表示最近被弹出栈的节点值（即当前处理的根节点的值）；
3. 遍历序列，若当前值小于 `lastPop`，说明它应该在 `lastPop` 的左子树，但先序遍历中左子树已经处理完毕，矛盾；
4. 否则，弹出栈顶所有小于当前值的元素，更新 `lastPop`，然后将当前值入栈。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个元素最多入栈出栈一次；
- **空间复杂度**：$O(n)$。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <stack>
using namespace std;

bool isValidPreorder(const vector<int>& a) {
    stack<int> st;
    int lastPop = -1;
    bool hasLastPop = false;
    for (int x : a) {
        if (hasLastPop && x < lastPop) return false;
        while (!st.empty() && x > st.top()) {
            lastPop = st.top();
            hasLastPop = true;
            st.pop();
        }
        st.push(x);
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        vector<int> a(n);
        for (int i = 0; i < n; ++i) cin >> a[i];
        cout << (isValidPreorder(a) ? "Yes" : "No") << '\n';
    }
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-05/lab-05-08-validate-bst-preorder
```
