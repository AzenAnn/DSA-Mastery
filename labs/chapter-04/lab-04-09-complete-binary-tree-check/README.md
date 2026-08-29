---
title: "Lab 04-09：二叉树的完全性检验"
description: "利用层序遍历与空节点连续性判定，检验一棵二叉树是否为完全二叉树。"
order: 9
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-09：二叉树的完全性检验

根据第 4.2.2 节的定义，在一棵**完全二叉树 (Complete Binary Tree)** 中，除了最后一层外，所有层都被完全填满，并且最后一层的所有叶节点都尽可能靠左排列。

## 题目

给定一棵二叉树的层序序列化输入，判断该二叉树是否为完全二叉树。

### 任务要求
1. 读入二叉树的层序序列化数据并构建二叉树；
2. 实现函数 `bool isCompleteTree(TreeNode* root)` 进行判定；
3. 输出 `true` 或 `false`。

## 输入格式
- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列，空节点使用 `null` 表示。

## 输出格式
- 输出一行：`true` 表示是完全二叉树，`false` 表示不是。

::: tip 💡 输入处理与建树指引
1. **读入序列**：
   直接使用 `std::string token; while (std::cin >> token)` 循环读取输入放入 `std::vector<std::string> tokens` 中即可，C++ 会自动按空格和换行分词。
2. **字符串转数字与 null 拦截**：
   - 遇到 `"null"` 时，表示空子树，直接将子节点置为 `nullptr`；**切勿对 `"null"` 调用 `std::stoi("null")`**（会抛出 `std::invalid_argument` 异常导致崩溃）；
   - 仅在 `token != "null"` 时，才调用 `std::stoi(token)` 转为整数并创建有效节点 `new TreeNode(val)`。
3. **基于队列的 BFS 建树**：
   借助 `std::queue<TreeNode*>` 存放父节点，队头出队后依次连接左右孩子，并将非空孩子入队。
:::

## 数据范围与限制
| 项目 | 范围 |
| --- | --- |
| 节点数 $n$ | $0 \le n \le 10^4$ |
| 节点值 | $-10^4 \le \text{val} \le 10^4$ |
| 时间复杂度要求 | $O(n)$ |
| 额外空间复杂度 | $O(n)$（队列空间） |

## 样例

### 样例输入 1
```input
1 2 3 4 5 6 null
```

### 样例输出 1
```output
true
```

### 样例输入 2
```input
1 2 3 4 5 null 7
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

### 样例解释与结构对照

```text
样例 1（完全二叉树）：            样例 2（非完全二叉树，存在空洞）：
        1                                1
      /   \                            /   \
     2     3                          2     3
    / \   /                          / \     \
   4   5 6                          4   5     7  <-- 节点 6 位置缺失！
层序遍历：1 2 3 4 5 6 null        层序遍历：1 2 3 4 5 null 7
所有非空节点连续紧凑排列，无空洞。   在遇到空指针后又出现了非空节点 7。
```

## 如何验证

```powershell
# 运行评测
pnpm lab:run -- labs/chapter-04/lab-04-09-complete-binary-tree-check

# 单用例调试
pnpm lab:run -- labs/chapter-04/lab-04-09-complete-binary-tree-check --case 001-sample
```

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

在层序遍历（BFS）中，完全二叉树的所有非空节点必然**连续不断**地从队列中弹出。
如果我们将所有子节点（包括 `nullptr`）都推入队列：
1. 一旦我们在队列头部弹出了一个 `nullptr`，标志着二叉树中有效节点的“连续区”已经结束；
2. 如果在此之后队列中**还能弹出任何非空的 `TreeNode*`**，说明树在某些层出现了“空洞”，破坏了完全二叉树的左对齐不变量，直接判定为 `false`；
3. 如果队列全部清空都没有在空节点之后遇到非空节点，则为 `true`。

### 算法步骤

1. 若 `root == nullptr`，空树视作完全二叉树，返回 `true`；
2. 初始化队列 `q`，并将 `root` 入队；
3. 维护布尔标记 `seenNull = false`；
4. 当队列不为空时：
   - 弹出队首节点 `curr`；
   - 若 `curr == nullptr`，令 `seenNull = true`；
   - 若 `curr != nullptr`：
     - 若 `seenNull == true`，说明空节点之后出现了有效节点，返回 `false`；
     - 将 `curr->left` 与 `curr->right`（无论是否为空）均加入队列；
5. 队列处理完毕，返回 `true`。

### 复杂度分析

- **时间复杂度**：$O(n)$，二叉树中每个节点及其空指针至多进出队列一次。
- **空间复杂度**：$O(n)$，队列在最后一层最多容纳 $O(n)$ 个节点。

### 边界与易错点

- **空树与单节点树**：均应判定为完全二叉树；
- **极端单链树**：左斜树或右斜树在较深层会提前触发 `seenNull`，算法能正确判定为 `false`。

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

bool isCompleteTree(TreeNode* root) {
    if (!root) return true;
    std::queue<TreeNode*> q;
    q.push(root);
    bool seenNull = false;
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (curr == nullptr) {
            seenNull = true;
        } else {
            if (seenNull) return false;
            q.push(curr->left);
            q.push(curr->right);
        }
    }
    return true;
}

int main() {
    std::vector<std::string> tokens;
    std::string token;
    while (std::cin >> token) {
        tokens.push_back(token);
    }
    TreeNode* root = buildTree(tokens);
    std::cout << (isCompleteTree(root) ? "true" : "false") << "\n";
    freeTree(root);
    return 0;
}
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-09-complete-binary-tree-check
```
