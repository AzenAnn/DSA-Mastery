---
title: "Lab 04-13：二叉树的右视图"
description: "利用广度优先搜索或右优先深度优先搜索获取二叉树的右视图。"
order: 13
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-13：二叉树的右视图

在第 4.3.3 节中，我们掌握了 BFS 层序遍历。本实验考查层序遍历的经典变体——二叉树右视图。

## 题目

给定一棵二叉树，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值序列。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 一行以空格分隔的整数，表示右视图节点值序列。若为空树输出空行。

::: tip 💡 输入处理与建树指引
1. **读入序列**：
   直接使用 `std::string token; while (std::cin >> token)` 循环读取输入放入 `std::vector<std::string> tokens` 中即可，C++ 会自动按空格和换行分词。
2. **字符串转数字与 null 拦截**：
   - 遇到 `"null"` 时，表示空子树，直接将子节点置为 `nullptr`；**切勿对 `"null"` 调用 `std::stoi("null")`**（会抛出 `std::invalid_argument` 异常导致崩溃）；
   - 仅在 `token != "null"` 时，才调用 `std::stoi(token)` 转为整数并创建有效节点 `new TreeNode(val)`。
3. **基于队列的 BFS 建树**：
   借助 `std::queue<TreeNode*>` 存放父节点，队头出队后依次连接左右孩子，并将非空孩子入队。
:::

## 样例

### 样例输入 1
```input
1 2 3 null 5 null 4
```

### 样例输出 1
```output
1 3 4
```

### 样例输入 2
```input
1 2 3 4 null null null 5
```

### 样例输出 2
```output
1 3 4 5
```

### 样例输入 3
```input
1 2 null 3 null 4 null
```

### 样例输出 3
```output
1 2 3 4
```

### 样例解释

```text
样例 1 树形观测：                 样例 2 树形观测（左侧更深）：
      1   <--- 看到 1                  1   <--- 看到 1
    /   \                            /   \
   2     3 <--- 看到 3                2     3 <--- 看到 3
    \     \                         /
     5     4 <--- 看到 4            4        <--- 看到 4
                                  /
                                 5         <--- 看到 5
右视图结果：1 3 4                 右视图结果：1 3 4 5
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

右视图的本质是**每一层最右边的那个节点**：
- **解法一（BFS 层序遍历）**：在每一层的 `sz` 个节点中，只保留最后一个节点（即 `i == sz - 1` 时的节点值）；
- **解法二（DFS 根-右-左优先搜索）**：记录当前深度，当深度等于结果数组的大小时，说明是该深度首次被访问到的节点（即最右节点），直接加入结果。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点访问一次。
- **空间复杂度**：$O(n)$（BFS 队列）或 $O(h)$（DFS 调用栈）。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <queue>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

TreeNode* buildTree(const std::vector<std::string>& tokens) {
    if (tokens.empty() || tokens[0] == "null") return nullptr;
    TreeNode* root = new TreeNode(std::stoi(tokens[0]));
    std::queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (i < tokens.size()) {
            if (tokens[i] != "null") {
                curr->left = new TreeNode(std::stoi(tokens[i]));
                q.push(curr->left);
            }
            i++;
        }
        if (i < tokens.size()) {
            if (tokens[i] != "null") {
                curr->right = new TreeNode(std::stoi(tokens[i]));
                q.push(curr->right);
            }
            i++;
        }
    }
    return root;
}

void freeTree(TreeNode* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

std::vector<int> rightSideView(TreeNode* root) {
    std::vector<int> res;
    if (!root) return res;
    std::queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        size_t sz = q.size();
        for (size_t i = 0; i < sz; i++) {
            TreeNode* node = q.front();
            q.pop();
            if (i == sz - 1) {
                res.push_back(node->val);
            }
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
    return res;
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    auto res = rightSideView(root);
    for (size_t i = 0; i < res.size(); i++) {
        std::cout << (i == 0 ? "" : " ") << res[i];
    }
    std::cout << "\n";
    freeTree(root);
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-13-binary-tree-right-side-view
```
