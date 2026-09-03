---
title: "Lab 04-E-03：二叉树的前序遍历"
description: "实现二叉树的前序遍历（根 -> 左 -> 右），掌握递归与显式栈迭代两种经典 DFS 解法。"
order: 11
chapter: 4
labId: "04E03"
chapterTitle: "树与二叉树"
updated: "2026-08-24"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～20 分钟"
---

# Lab 04-E-03：二叉树的前序遍历

## 实验目的

1. 深刻理解二叉树前序遍历（$DLR$：根 $\to$ 左 $\to$ 右）的定义与访问时机；
2. 掌握二叉树递归遍历的极简写法；
3. 掌握基于显式栈（`std::stack`）消除递归的迭代遍历模板。

---

## 题目描述

给定一棵二叉树的根节点 `root`，请返回其节点值的 **前序遍历** 序列。

### 输入格式

输入包含一行，为二叉树的层序序列（以空格分隔，`null` 表示空节点）。若输入为空树，则输入为单行 `null` 或空行。

### 输出格式

输出一行，为二叉树前序遍历得到的节点值序列，以空格分隔。若树为空，则输出空行。

::: tip 💡 输入提示
使用流分词极简读取；仅在 `token != "null"` 时调用 `std::stoi`，防止异常崩溃：
```cpp
std::vector<std::string> tokens;
std::string token;
while (std::cin >> token) tokens.push_back(token);
```
:::

---

## 样例说明

### 样例 1

**输入**：
```text
1 null 2 3
```

**输出**：
```text
1 2 3
```

**图解**：
```text
  1
   \
    2
   /
  3
前序遍历: 根(1) -> 左(空) -> 右(2 -> 左(3)) ==> 1 2 3
```

---

### 样例 2

**输入**：
```text
null
```

**输出**：
```text

```

**解释**：空树的前序遍历序列为空。

---

### 样例 3

**输入**：
```text
1 2 3 4 5 6 7
```

**输出**：
```text
1 2 4 5 3 6 7
```

**图解**：
```text
        1
      /   \
    2       3
   / \     / \
  4   5   6   7
前序遍历: 1 -> (2 -> 4 -> 5) -> (3 -> 6 -> 7) ==> 1 2 4 5 3 6 7
```

---

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
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-03-binary-tree-preorder-traversal
pnpm lab:run -- labs/chapter-04/exercise/E-04-03-binary-tree-preorder-traversal
pnpm lab:run -- labs/chapter-04/exercise/E-04-03-binary-tree-preorder-traversal --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-03-binary-tree-preorder-traversal
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

前序遍历的访问顺序为 **根节点 $\to$ 左子树 $\to$ 右子树**。

1. **递归法**：
   - 终止条件：`root == nullptr` 直接返回；
   - 访问当前根节点 `res.push_back(root->val)`；
   - 递归前序遍历左子树 `dfs(root->left)`；
   - 递归前序遍历右子树 `dfs(root->right)`。

2. **显式栈迭代法（通用模板）**：
   - 使用一个辅助栈 `std::stack<TreeNode*>`；
   - 先将根节点压入栈；
   - 每次从栈顶弹出节点访问其值；
   - **关键点**：由于栈是后进先出（LIFO），为了先访问左子树，必须**先压入右孩子，再压入左孩子**。

### 复杂度分析

- **时间复杂度**：$\Theta(n)$，每个节点进出栈一次，访问常数时间。
- **空间复杂度**：$\Theta(h)$，递归调用栈或显式栈的最大深度等于树的高度 $h$（最好 $O(\log n)$，最坏单链 $O(n)$）。

</details>

<details>
<summary>点击查看参考代码</summary>

```cpp:line-numbers [solution/main.cpp]
#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <stack>

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
        if (i < tokens.size() && tokens[i] != "null") {
            curr->left = new TreeNode(std::stoi(tokens[i]));
            q.push(curr->left);
        }
        i++;
        if (i < tokens.size() && tokens[i] != "null") {
            curr->right = new TreeNode(std::stoi(tokens[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

void freeTree(TreeNode* root) {
    if (!root) return;
    freeTree(root->left);
    freeTree(root->right);
    delete root;
}

std::vector<int> preorderTraversal(TreeNode* root) {
    std::vector<int> res;
    if (root == nullptr) return res;
    std::stack<TreeNode*> st;
    st.push(root);
    while (!st.empty()) {
        TreeNode* node = st.top();
        st.pop();
        res.push_back(node->val);
        if (node->right != nullptr) st.push(node->right);
        if (node->left != nullptr)  st.push(node->left);
    }
    return res;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::vector<int> ans = preorderTraversal(root);
    for (size_t i = 0; i < ans.size(); ++i) {
        std::cout << ans[i] << (i + 1 == ans.size() ? "" : " ");
    }
    std::cout << "\n";
    freeTree(root);
    return 0;
}
```

</details>
