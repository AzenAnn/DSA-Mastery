---
title: "Lab 04-12：二叉树的层序与锯齿形遍历"
description: "使用队列与双端队列完成二叉树的标准分层输出与锯齿形反转输出。"
order: 12
chapter: 4
labId: "04E04"
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
pnpm lab:doctor -- labs/chapter-04/lab-04-12-binary-tree-level-and-zigzag-order
pnpm lab:run -- labs/chapter-04/lab-04-12-binary-tree-level-and-zigzag-order
pnpm lab:run -- labs/chapter-04/lab-04-12-binary-tree-level-and-zigzag-order --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-12-binary-tree-level-and-zigzag-order
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

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
        if (l % 2 == 1) {
            std::reverse(lv.begin(), lv.end());
        }
        for (size_t i = 0; i < lv.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << lv[i];
        }
        std::cout << "\n";
    }
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    printLevelAndZigzag(root);
    freeTree(root);
    return 0;
}
```

</details>
