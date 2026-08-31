---
title: "Lab 04-20：路径总和 II（收集所有路径）"
description: "通过显式回溯收集所有满足目标和的根到叶完整路径。"
order: 20
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～35 分钟"
---

# Lab 04-20：路径总和 II（收集所有路径）

在第 4.6.4 节中，我们系统学习了树上回溯（Backtracking）与路径收集模型。

## 题目

给你二叉树的根节点 `root` 和一个整数目标和 `targetSum` ，找出所有**从根节点到叶子节点**路径总和等于给定目标和的路径。如果不存在任何满足条件的路径，输出 `NONE`。

## 输入格式
- 第一行：二叉树的层序遍历序列；
- 第二行：一个整数 `targetSum`。

## 输出格式
- 每行输出一条符合条件的路径，节点值之间用空格分隔；若无路径输出 `NONE`。

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
5 4 8 11 null 13 4 7 2 null null 5 1
22
```

### 样例输出 1
```output
5 4 11 2
5 8 4 5
```

### 样例输入 2
```input
1 2 3
5
```

### 样例输出 2
```output
NONE
```

### 样例输入 3
```input
1 2
3
```

### 样例输出 3
```output
1 2
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
pnpm lab:doctor -- labs/chapter-04/lab-04-20-path-sum-all-paths
pnpm lab:run -- labs/chapter-04/lab-04-20-path-sum-all-paths
pnpm lab:run -- labs/chapter-04/lab-04-20-path-sum-all-paths --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-20-path-sum-all-paths
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

利用标准**自顶向下回溯模板**：
1. 访问当前节点时，将节点值压入临时路径 `curPath.push_back(root->val)`，目标和减去当前值 `targetSum -= root->val`；
2. 到达叶子节点时，若 `targetSum == 0`，将当前路径加入结果集 `res.push_back(curPath)`；
3. 分别递归左子树与右子树；
4. 递归返回前，弹出当前节点 `curPath.pop_back()` 恢复现场。

### 复杂度分析

- **时间复杂度**：$O(n)$。
- **空间复杂度**：$O(n)$。

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

void dfs(TreeNode* root, int targetSum, std::vector<int>& curPath, std::vector<std::vector<int>>& res) {
    if (!root) return;
    curPath.push_back(root->val);
    targetSum -= root->val;
    if (!root->left && !root->right) {
        if (targetSum == 0) {
            res.push_back(curPath);
        }
    } else {
        dfs(root->left, targetSum, curPath, res);
        dfs(root->right, targetSum, curPath, res);
    }
    curPath.pop_back();
}

std::vector<std::vector<int>> pathSum(TreeNode* root, int targetSum) {
    std::vector<std::vector<int>> res;
    std::vector<int> curPath;
    dfs(root, targetSum, curPath, res);
    return res;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
        if (std::cin.peek() == '\n' || std::cin.peek() == '\r') break;
    }
    int targetSum = 0;
    if (!(std::cin >> targetSum)) return 0;

    TreeNode* root = buildTree(tokens);
    auto paths = pathSum(root, targetSum);

    if (paths.empty()) {
        std::cout << "NONE\n";
    } else {
        for (const auto& p : paths) {
            for (size_t i = 0; i < p.size(); i++) {
                std::cout << (i == 0 ? "" : " ") << p[i];
            }
            std::cout << "\n";
        }
    }

    freeTree(root);
    return 0;
}
```

</details>
