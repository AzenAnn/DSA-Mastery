---
title: "Lab 04-18：另一棵树的子树"
description: "通过双重递归或树结构哈希判定一棵树是否包含另一棵树的全部结构。"
order: 18
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-23"
contributors: ["Wanderer0"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 04-18：另一棵树的子树

在第 4.6.2 节中，我们探讨了子结构匹配问题。

## 题目

给你两棵二叉树 `root` 和 `subRoot` 。检验 `root` 中是否包含和 `subRoot` 具有相同结构和节点值的子树。如果存在，返回 `true` ；否则，返回 `false` 。

## 输入格式
- 第一行：主树 `root` 的层序遍历序列；
- 第二行：子树 `subRoot` 的层序遍历序列。

## 输出格式
- 输出一行 `true` 或 `false`。

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
3 4 5 1 2
4 1 2
```

### 样例输出 1
```output
true
```

### 样例输入 2
```input
3 4 5 1 2 null null null null 0
4 1 2
```

### 样例输出 2
```output
false
```

### 样例输入 3
```input
1 2 3
1 2 3
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
pnpm lab:doctor -- labs/chapter-04/lab-04-18-subtree-of-another-tree
pnpm lab:run -- labs/chapter-04/lab-04-18-subtree-of-another-tree
pnpm lab:run -- labs/chapter-04/lab-04-18-subtree-of-another-tree --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-18-subtree-of-another-tree
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

双重递归：
1. 编写 `isSameTree(s, t)` 判断以 `s` 和 `t` 为根的两棵树是否全等；
2. 主函数中：若 `isSameTree(root, subRoot)` 成立则返回 `true`，否则递归在 `root->left` 或 `root->right` 中寻找子树。

### 复杂度分析

- **时间复杂度**：$O(|root| 	imes |subRoot|)$。
- **空间复杂度**：$O(max(h_{root}, h_{subRoot}))$。

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

bool isSameTree(TreeNode* s, TreeNode* t) {
    if (!s && !t) return true;
    if (!s || !t) return false;
    return (s->val == t->val) && isSameTree(s->left, t->left) && isSameTree(s->right, t->right);
}

bool isSubtree(TreeNode* root, TreeNode* subRoot) {
    if (!root) return false;
    if (isSameTree(root, subRoot)) return true;
    return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::vector<std::string> tokens1, tokens2;
    std::string token;
    while (std::cin >> token) {
        tokens1.push_back(token);
        if (std::cin.peek() == '\n' || std::cin.peek() == '\r') break;
    }
    while (std::cin >> token) {
        tokens2.push_back(token);
    }

    TreeNode* root = buildTree(tokens1);
    TreeNode* subRoot = buildTree(tokens2);

    std::cout << (isSubtree(root, subRoot) ? "true" : "false") << "\n";

    freeTree(root);
    freeTree(subRoot);
    return 0;
}
```

</details>
