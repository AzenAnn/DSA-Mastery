---
title: "Lab 04-19：求根节点到叶节点数字之和"
description: "利用前序遍历与自顶向下数值累乘累加，计算所有根到叶数字的总和。"
order: 19
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-19：求根节点到叶节点数字之和

在第 4.6.4 节中，我们学习了二叉树的“路径类”问题。

## 题目

给你一个二叉树的根节点 `root` ，树中每个节点都存放有一个 `0` 到 `9` 之间的数字。
每条从根节点到叶节点的路径都代表一个数字：
- 例如，从根到叶节点的路径 `1 -> 2 -> 3` 表示数字 `123` 。
计算从根节点到叶节点生成的**所有数字之和**。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 输出一个整数，表示所有路径数字的总和。

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
1 2 3
```

### 样例输出 1
```output
25
```

### 样例输入 2
```input
4 9 0 5 1
```

### 样例输出 2
```output
1026
```

### 样例输入 3
```input
9
```

### 样例输出 3
```output
9
```

### 样例解释

对于样例 2（树形：根 4，左孩子 9 [子节点 5, 1]，右孩子 0）：
- 路径 4->9->5 对应数字 495；
- 路径 4->9->1 对应数字 491；
- 路径 4->0 对应数字 40；
- 总和 = 495 + 491 + 40 = 1026。

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
pnpm lab:doctor -- labs/chapter-04/lab-04-19-sum-root-to-leaf-numbers
pnpm lab:run -- labs/chapter-04/lab-04-19-sum-root-to-leaf-numbers
pnpm lab:run -- labs/chapter-04/lab-04-19-sum-root-to-leaf-numbers --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-19-sum-root-to-leaf-numbers
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

自顶向下前序传递：
- 当前路径值 `curSum = prevSum * 10 + root->val`；
- 若到达叶子节点（`!root->left && !root->right`），返回 `curSum`；
- 否则递归返回左子树与右子树的路径和之和。

### 复杂度分析

- **时间复杂度**：$O(n)$。
- **空间复杂度**：$O(h)$。

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

int dfs(TreeNode* root, int prevSum) {
    if (!root) return 0;
    int sum = prevSum * 10 + root->val;
    if (!root->left && !root->right) {
        return sum;
    }
    return dfs(root->left, sum) + dfs(root->right, sum);
}

int sumNumbers(TreeNode* root) {
    return dfs(root, 0);
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::cout << sumNumbers(root) << "\n";
    freeTree(root);
    return 0;
}
```

</details>
