---
title: "Lab 04-E-15：二叉树中的最大路径和"
description: "通过后序遍历与树形动态规划，计算任意两节点间非空路径的最大权值和。"
order: 23
chapter: 4
labId: "04E15"
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "30～45 分钟"
---

# Lab 04-E-15：二叉树中的最大路径和

作为第 4 章的压轴挑战题，本题综合考查树形动态规划（Tree DP）与后序自底向上状态转移。

## 题目

二叉树中的**路径**被定义为一条节点序列，序列中每对相邻节点之间都存在一条边。同一个节点在一条路径序列中**至多出现一次**。该路径**至少包含一个**节点，且不一定经过根节点。
**路径和**是路径中各节点值的总和。
给你一个二叉树的根节点 `root` ，返回其**最大路径和**。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列。

## 输出格式
- 输出一个整数，表示最大路径和。

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
6
```

### 样例输入 2
```input
-10 9 20 null null 15 7
```

### 样例输出 2
```output
42
```

### 样例输入 3
```input
-3
```

### 样例输出 3
```output
-3
```

### 样例解释

对于样例 2（树形：根 -10，左 9，右 20 [子节点 15, 7]）：
- 最优路径为 15 -> 20 -> 7；
- 最大路径和 = 15 + 20 + 7 = 42。
- 根节点 -10 由于贡献为负，被优雅地排除在全局最大路径之外。

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
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-15-binary-tree-maximum-path-sum
pnpm lab:run -- labs/chapter-04/exercise/E-04-15-binary-tree-maximum-path-sum
pnpm lab:run -- labs/chapter-04/exercise/E-04-15-binary-tree-maximum-path-sum --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-15-binary-tree-maximum-path-sum
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路（树形 DP）

对于任意节点 $u$：
1. **单侧最大贡献**：定义函数 `maxGain(node)` 为从 `node` 出发向其子树延伸的单侧非空路径最大增益；若子树贡献为负数，则选择不延伸（即 `std::max(gain, 0)`）；
2. **跨根路径更新**：以当前节点 $u$ 为转折点的拱桥路径总和为：`u->val + leftGain + rightGain`。在后序遍历时用该值更新全局最大路径和 `maxSum`；
3. **函数返回值**：返回 `u->val + max(leftGain, rightGain)` 供父节点使用。

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
#include <climits>

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

int maxGain(TreeNode* node, int& maxSum) {
    if (!node) return 0;
    int leftGain = std::max(maxGain(node->left, maxSum), 0);
    int rightGain = std::max(maxGain(node->right, maxSum), 0);
    int priceNewpath = node->val + leftGain + rightGain;
    maxSum = std::max(maxSum, priceNewpath);
    return node->val + std::max(leftGain, rightGain);
}

int maxPathSum(TreeNode* root) {
    int maxSum = INT_MIN;
    maxGain(root, maxSum);
    return maxSum;
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::cout << maxPathSum(root) << "\n";
    freeTree(root);
    return 0;
}
```

</details>
