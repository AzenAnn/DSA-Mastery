---
title: "Lab 04-21：二叉树的直径"
description: "理解单侧深度返回值与全局跨根最长路径的解耦，计算二叉树的直径。"
order: 21
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～30 分钟"
---

# Lab 04-21：二叉树的直径

在第 4.6.5 节中，我们建立了**二叉树后序状态解耦模型**：函数的返回值与全局维护的极值指标分离。

## 题目

给定一棵二叉树，你需要计算它的**直径长度**。一棵二叉树的直径长度是树中任意两个节点之间最长路径的**边数**。这条路径可能穿过也可能不穿过根节点。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 输出一个整数，表示二叉树的直径长度（边数）。

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
1 2 3 4 5
```

### 样例输出 1
```output
3
```

### 样例输入 2
```input
1 2 null 3 4 5 null null 6
```

### 样例输出 2
```output
4
```

### 样例输入 3
```input
1
```

### 样例输出 3
```output
0
```

### 路径不经过根节点的典型结构

```text
样例 2 树形：
         1
        /
       2          <-- 最大直径经过节点 2（边数 = 4），而不穿过根节点 1！
      / \
     3   4
    /     \
   5       6
最长路径为 5 -> 3 -> 2 -> 4 -> 6，经过 4 条边，直径为 4。
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
pnpm lab:doctor -- labs/chapter-04/lab-04-21-diameter-of-binary-tree
pnpm lab:run -- labs/chapter-04/lab-04-21-diameter-of-binary-tree
pnpm lab:run -- labs/chapter-04/lab-04-21-diameter-of-binary-tree --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-21-diameter-of-binary-tree
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

1. 穿过节点 $u$ 的最长路径长度（边数）= 左子树最大深度 + 右子树最大深度；
2. 但为了让父节点继续计算，递归函数 **只能返回以当前节点为起点的单侧最大深度**：`max(leftDepth, rightDepth) + 1`；
3. 在后序遍历的过程中，利用引用变量 `maxDia` 随时用 `L + R` 更新全局最大直径。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点访问一次。
- **空间复杂度**：$O(h)$。

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

int maxDepth(TreeNode* root, int& maxDia) {
    if (!root) return 0;
    int L = maxDepth(root->left, maxDia);
    int R = maxDepth(root->right, maxDia);
    maxDia = std::max(maxDia, L + R);
    return std::max(L, R) + 1;
}

int diameterOfBinaryTree(TreeNode* root) {
    int maxDia = 0;
    maxDepth(root, maxDia);
    return maxDia;
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::cout << diameterOfBinaryTree(root) << "\n";
    freeTree(root);
    return 0;
}
```

</details>
