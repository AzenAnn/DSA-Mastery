---
title: "Lab 04-E-19：二叉树的最长之字形路径"
description: "通过树形动态规划，计算二叉树中最长边方向交替的向下路径。"
order: 27
chapter: 4
labId: "04E19"
chapterTitle: "树与二叉树"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "40～55 分钟"
---

# Lab 04-E-19：二叉树的最长之字形路径

二叉树中一条路径被称为**之字形路径（ZigZag Path）**，如果从路径起点开始，相邻两条边的方向严格交替：左 $\to$ 右 $\to$ 左 $\to$ 右 $\cdots$ 或 右 $\to$ 左 $\to$ 右 $\to$ 左 $\cdots$。路径只能沿着父子关系向下延伸，不能向上回溯。路径长度以**边数**计算，单个节点构成的路径长度为 0。

## 题目

### 最长之字形路径

给定一棵二叉树，求其中最长的之字形路径长度。

### 任务要求

1. 从标准输入读入二叉树的层序遍历序列；
2. 使用**树形动态规划**计算最长之字形路径；
3. 输出最长之字形路径的边数。

## 输入格式

- 一行以空格分隔的若干个 token，表示二叉树的层序遍历序列；
- `null` 表示空节点。

## 输出格式

- 输出一个整数，表示最长之字形路径的边数。

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
| 节点数 $n$ | $0 \le n \le 10^5$ |
| 节点值 | 整数，范围不限 |
| 时间复杂度要求 | $O(n)$ |
| 额外空间限制 | $O(h)$，$h$ 为树高 |

::: tip 关于空树
当输入只包含 `null` 或为空时，树为空，输出 0。
:::

## 样例

### 样例输入 1

```input
1 2 3 null 5 null 6
```

### 样例输出 1

```output
2
```

### 样例解释 1

树结构：

```
    1
   / \
  2   3
   \   \
    5   6
```

- 路径 $1 \to 2 \to 5$：边方向为 左 $\to$ 右，交替，长度 2；
- 路径 $1 \to 3 \to 6$：边方向为 右 $\to$ 右，不交替；
- 最长之字形路径长度为 2。

### 样例输入 2

```input
1 2 3 4 5 null null null null 6 7
```

### 样例输出 2

```output
3
```

### 样例解释 2

树结构：

```
      1
     / \
    2   3
   / \
  4   5
     / \
    6   7
```

- 路径 $1 \to 2 \to 5 \to 6$：左 $\to$ 右 $\to$ 左，交替，长度 3；
- 路径 $1 \to 2 \to 5 \to 7$：左 $\to$ 右 $\to$ 右，不交替；
- 最长之字形路径长度为 3。

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
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-19-longest-zigzag-path
pnpm lab:run -- labs/chapter-04/exercise/E-04-19-longest-zigzag-path
pnpm lab:run -- labs/chapter-04/exercise/E-04-19-longest-zigzag-path --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-19-longest-zigzag-path
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**树形动态规划**，对每个节点维护两个状态：

- `leftZig[u]`：从节点 $u$ 出发、**第一步向左孩子走**的最长之字形路径边数
- `rightZig[u]`：从节点 $u$ 出发、**第一步向右孩子走**的最长之字形路径边数

**状态转移**：
- 如果 $u$ 向左走到左孩子 $L$，下一步必须向右，所以接续 $L$ 的 rightZig：
  $$leftZig[u] = 1 + rightZig[L]$$
- 如果 $u$ 向右走到右孩子 $R$，下一步必须向左，所以接续 $R$ 的 leftZig：
  $$rightZig[u] = 1 + leftZig[R]$$

答案取所有节点的 $\max(leftZig[u], rightZig[u])$。

### 算法步骤

1. 根据层序序列构建二叉树；
2. 后序遍历（或递归 DFS）计算每个节点的 $leftZig$ 和 $rightZig$；
3. 遍历过程中维护全局最大值；
4. 输出全局最大值。

### 复杂度分析

- **时间复杂度**：$O(n)$，每个节点访问一次。
- **空间复杂度**：$O(h)$，递归栈深度为树高 $h$。

### 边界注意

- 空节点（`null`）的 $leftZig = rightZig = -1$（表示不存在），这样 $1 + (-1) = 0$ 恰好表示该方向无路可走；
- 叶子节点的 $leftZig = rightZig = 0$（只包含自己，无边）。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
    TreeNode(int x) : val(x) {}
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    getline(cin, line);
    if (line.empty()) {
        cout << "0\n";
        return 0;
    }

    stringstream ss(line);
    vector<string> tokens;
    string tok;
    while (ss >> tok) tokens.push_back(tok);

    if (tokens.empty() || tokens[0] == "null") {
        cout << "0\n";
        return 0;
    }

    TreeNode* root = new TreeNode(stoi(tokens[0]));
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < tokens.size() && tokens[i] != "null") {
            cur->left = new TreeNode(stoi(tokens[i]));
            q.push(cur->left);
        }
        ++i;
        if (i < tokens.size() && tokens[i] != "null") {
            cur->right = new TreeNode(stoi(tokens[i]));
            q.push(cur->right);
        }
        ++i;
    }

    int ans = 0;

    function<pair<int,int>(TreeNode*)> dfs = [&](TreeNode*%20u) -> pair<int,int> {
        if (!u) return {-1, -1};
        auto [ll, lr] = dfs(u->left);
        auto [rl, rr] = dfs(u->right);
        int leftZig = 1 + lr;
        int rightZig = 1 + rl;
        ans = max({ans, leftZig, rightZig});
        return {leftZig, rightZig};
    };

    dfs(root);
    cout << ans << "\n";

    return 0;
}
```

</details>
