---
title: "Lab 04-E-05：二叉树的右视图"
description: "利用广度优先搜索或右优先深度优先搜索获取二叉树的右视图。"
order: 13
chapter: 4
labId: "04E05"
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-E-05：二叉树的右视图

在第 4.3.3 节中，我们掌握了 BFS 层序遍历。本实验考查层序遍历的经典变体——二叉树右视图。

## 题目

给定一棵二叉树，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值序列。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 一行以空格分隔的整数，表示右视图节点值序列。若为空树输出空行。

::: tip 💡 输入提示
使用流分词极简读取；仅在 `token != "null"` 时调用 `std::stoi`，防止异常崩溃：
```cpp
std::vector<std::string> tokens;
std::string token;
while (std::cin >> token) tokens.push_back(token);
```
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

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-05-binary-tree-right-side-view
pnpm lab:run -- labs/chapter-04/exercise/E-04-05-binary-tree-right-side-view
pnpm lab:run -- labs/chapter-04/exercise/E-04-05-binary-tree-right-side-view --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-05-binary-tree-right-side-view
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

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
