---
title: "Lab 04-E-09：对称二叉树判定"
description: "通过双树镜像下潜递归比较判定一棵二叉树是否镜像对称。"
order: 17
chapter: 4
labId: "04E09"
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～25 分钟"
---

# Lab 04-E-09：对称二叉树判定

在第 4.6.2 节中，我们讨论了二叉树的“判断类”问题。本题考查经典的双树同步镜像递归比较。

## 题目

给你一个二叉树的根节点 `root` ，检查它是否轴对称（即是否为自身的镜像）。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 一行输出 `true` 或 `false`。

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
1 2 2 3 4 4 3
```

### 样例输出 1
```output
true
```

### 样例输入 2
```input
1 2 2 null 3 null 3
```

### 样例输出 2
```output
false
```

### 样例输入 3
```input
1
```

### 样例输出 3
```output
true
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
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-09-symmetric-tree
pnpm lab:run -- labs/chapter-04/exercise/E-04-09-symmetric-tree
pnpm lab:run -- labs/chapter-04/exercise/E-04-09-symmetric-tree --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-09-symmetric-tree
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

对称的本质是：左子树的左孩子与右子树的右孩子对称，且左子树的右孩子与右子树的左孩子对称。
定义辅助函数 `check(TreeNode* p, TreeNode* q)`：
- 若 `p` 与 `q` 均为空，返回 `true`；
- 若只有一个为空，或值不相等，返回 `false`；
- 递归返回 `check(p->left, q->right) && check(p->right, q->left)`。

### 复杂度分析

- **时间复杂度**：$O(n)$。
- **空间复杂度**：$O(h)$，调用栈深度。

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

bool check(TreeNode* p, TreeNode* q) {
    if (!p && !q) return true;
    if (!p || !q) return false;
    return (p->val == q->val) && check(p->left, q->right) && check(p->right, q->left);
}

bool isSymmetric(TreeNode* root) {
    return check(root, root);
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::cout << (isSymmetric(root) ? "true" : "false") << "\n";
    freeTree(root);
    return 0;
}
```

</details>
