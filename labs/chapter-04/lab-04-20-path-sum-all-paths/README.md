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
#include <vector>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

void dfs(TreeNode* root, int targetSum, std::vector<int>& curPath, std::vector<std::vector<int>>& res) {
    if (!root) return;
    curPath.push_back(root->val);
    targetSum -= root->val;
    if (!root->left && !root->right) {
        if (targetSum == 0) res.push_back(curPath);
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
```

</details>

## 本地运行与提交
```powershell
pnpm lab:run -- labs/chapter-04/lab-04-11-path-sum-all-paths
```
