---
title: "Lab 04-12：二叉树的层序与锯齿形遍历"
description: "使用队列与双端队列完成二叉树的标准分层输出与锯齿形反转输出。"
order: 12
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-12：二叉树的层序与锯齿形遍历

在第 4.3.3 节中，我们学习了二叉树的广度优先搜索（BFS）层序遍历。

## 题目

给定一棵二叉树，分别输出其**标准层序遍历**和**锯齿形层序遍历（之字形）**。
- 标准层序：自顶向下，每层从左向右；
- 锯齿形层序：第 0 层从左向右，第 1 层从右向左，第 2 层从左向右，依次类推交替翻转。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 第一段输出 `LEVEL_ORDER:` 后跟标准层序遍历，每层占一行；
- 第二段输出 `ZIGZAG_ORDER:` 后跟锯齿形层序遍历，每层占一行。

## 样例

### 样例输入 1
```input
3 9 20 null null 15 7
```

### 样例输出 1
```output
LEVEL_ORDER:
3
9 20
15 7
ZIGZAG_ORDER:
3
20 9
15 7
```

### 样例输入 2
```input
1 2 3 4 5 6 7
```

### 样例输出 2
```output
LEVEL_ORDER:
1
2 3
4 5 6 7
ZIGZAG_ORDER:
1
3 2
4 5 6 7
```

### 样例输入 3
```input
1
```

### 样例输出 3
```output
LEVEL_ORDER:
1
ZIGZAG_ORDER:
1
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

1. **分层遍历标准套路**：利用队列的当前大小 `sz = q.size()` 锁定当前层的节点数量，使用固定循环弹出恰好 `sz` 个节点，将其子节点推入下一层；
2. **锯齿形翻转**：在收集完所有层的结果后，对所有奇数层（第 1, 3, 5... 层）执行 `std::reverse` 翻转即可。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点进出队列一次，翻转操作总用时为 $O(n)$。
- **空间复杂度**：$O(n)$，队列和输出数组所占空间。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

void printLevelAndZigzag(TreeNode* root) {
    std::vector<std::vector<int>> levels;
    if (root) {
        std::queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            size_t sz = q.size();
            std::vector<int> cur;
            for (size_t i = 0; i < sz; i++) {
                TreeNode* node = q.front();
                q.pop();
                cur.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            levels.push_back(cur);
        }
    }

    std::cout << "LEVEL_ORDER:\n";
    for (const auto& lv : levels) {
        for (size_t i = 0; i < lv.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << lv[i];
        }
        std::cout << "\n";
    }

    std::cout << "ZIGZAG_ORDER:\n";
    for (size_t l = 0; l < levels.size(); l++) {
        auto lv = levels[l];
        if (l % 2 == 1) std::reverse(lv.begin(), lv.end());
        for (size_t i = 0; i < lv.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << lv[i];
        }
        std::cout << "\n";
    }
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-03-binary-tree-level-and-zigzag-order
```
