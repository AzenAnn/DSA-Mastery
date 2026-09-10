---
title: "Lab 04-E-04：二叉树的层序与锯齿形遍历"
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

# Lab 04-E-04：二叉树的层序与锯齿形遍历

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

::: tip 💡 输入提示
使用流分词极简读取；仅在 `token != "null"` 时调用 `std::stoi`，防止异常崩溃：
```cpp
std::vector<std::string> tokens;
std::string token;
while (std::cin >> token) tokens.push_back(token);
```
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
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-04-binary-tree-level-and-zigzag-order
pnpm lab:run -- labs/chapter-04/exercise/E-04-04-binary-tree-level-and-zigzag-order
pnpm lab:run -- labs/chapter-04/exercise/E-04-04-binary-tree-level-and-zigzag-order --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-04-binary-tree-level-and-zigzag-order
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 核心思路

二叉树锯齿形层序遍历的本质是：**在广度优先搜索（BFS）按层推进的同时，控制每层元素的存储次序**。本题有两种优雅的实现方案：

#### 方案一：双端队列法（`std::deque`）
* **核心机制**：利用 `std::deque` 允许在**两端均以 $O(1)$ 时间插入**的物理特性；
* **遍历流程**：
  1. 偶数层（从左到右）：直接向队尾推进 `deque.push_back(node->val)`；
  2. 奇数层（从右到左）：直接向队头推入 `deque.push_front(node->val)`；
* **优势**：利用了deque本身两端pop和push的特性，省去了翻转或下标处理的操作。

#### 方案二：定长 Vector 镜像坐标填充法（进阶）
* **核心机制**：在进入每层循环时，当前层的节点总数已知为 `sz = q.size()`；
* **遍历流程**：
  1. 一次性精准开辟大小为 `sz` 的连续内存：`std::vector<int> row(sz)`；
  2. 若当前层从左向右，填入下标 `row[i] = node->val`；
  3. 若当前层从右向左，直接从后向前填入镜像下标 `row[sz - 1 - i] = node->val`；
* **优势**：单块物理内存连续分配，CPU L1/L2 缓存行预取效率极高，无多次指针解引用或额外开辟分段 buffer 的常数开销。

---

### 复杂度分析与性能对比

| 解法对比 | 传统解法 (`vector` + `reverse`) | 方案一：双端队列法 (`std::deque`) | 方案二：镜像下标法 (`vector` 镜像索引) |
| :--- | :--- | :--- | :--- |
| **时间复杂度** | $O(n)$（含额外 $\lfloor k/2 \rfloor$ 次 swap） | $O(n)$（头尾插入均为 $O(1)$） | $O(n)$（单次赋值到位，常数项最小） |
| **空间复杂度** | $O(n)$（若按值拷贝会产生冗余堆内存） | $O(n)$（中控 map + 分段 chunk） | $O(n)$（单块连续物理内存） |
| **缓存局部性** | 高（但在按值拷贝时开销大） | 中等（跨 chunk 访问时有两次解引用） | **极高**（100% 缓存行顺序命中） |
| **设计契约** | 需后置倒序处理 | **算法语义最纯粹，吻合题意** | 理论执行速度更快 |

</details>

<details>
<summary>点击查看参考代码</summary>

### 方案一：双端队列法（`std::deque` 推荐面试解）

利用 `std::deque` 的双端插入能力，偶数层 `push_back`，奇数层 `push_front`，无需事后倒序翻转。

```cpp:line-numbers [solution-deque.cpp]
#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <deque>

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

void printLevelAndZigzagDeque(TreeNode* root) {
    if (!root) {
        std::cout << "LEVEL_ORDER:\nZIGZAG_ORDER:\n";
        return;
    }

    std::vector<std::vector<int>> levelOrder;
    std::vector<std::deque<int>> zigzagOrder;

    std::queue<TreeNode*> q;
    q.push(root);
    bool leftToRight = true;

    while (!q.empty()) {
        size_t sz = q.size();
        std::vector<int> curLevel;
        std::deque<int> curZigzag;

        for (size_t i = 0; i < sz; i++) {
            TreeNode* node = q.front();
            q.pop();

            curLevel.push_back(node->val);

            // 偶数层尾插，奇数层头插
            if (leftToRight) {
                curZigzag.push_back(node->val);
            } else {
                curZigzag.push_front(node->val);
            }

            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }

        levelOrder.push_back(curLevel);
        zigzagOrder.push_back(curZigzag);
        leftToRight = !leftToRight;
    }

    // 1. 输出标准层序
    std::cout << "LEVEL_ORDER:\n";
    for (const auto& lv : levelOrder) {
        for (size_t i = 0; i < lv.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << lv[i];
        }
        std::cout << "\n";
    }

    // 2. 输出锯齿层序
    std::cout << "ZIGZAG_ORDER:\n";
    for (const auto& row : zigzagOrder) {
        for (size_t i = 0; i < row.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << row[i];
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
    printLevelAndZigzagDeque(root);
    freeTree(root);
    return 0;
}
```

---

### 方案二：定长 Vector 镜像坐标法（追求极致性能与 CPU 缓存）

预分配确定长度的 `vector<int> curZigzag(sz)`，按方向选择下标 `i` 或 `sz - 1 - i` 写入，享受单块连续内存最高缓存命中率。

```cpp:line-numbers [solution-vector-mirror.cpp]
#include <iostream>
#include <vector>
#include <string>
#include <queue>

void printLevelAndZigzagMirror(TreeNode* root) {
    if (!root) {
        std::cout << "LEVEL_ORDER:\nZIGZAG_ORDER:\n";
        return;
    }

    std::vector<std::vector<int>> levelOrder;
    std::vector<std::vector<int>> zigzagOrder;

    std::queue<TreeNode*> q;
    q.push(root);
    bool leftToRight = true;

    while (!q.empty()) {
        size_t sz = q.size();
        std::vector<int> curLevel(sz);
        std::vector<int> curZigzag(sz); // 精准预分配，零冗余开销

        for (size_t i = 0; i < sz; i++) {
            TreeNode* node = q.front();
            q.pop();

            curLevel[i] = node->val;

            // 核心：偶数层填在 i，奇数层直接填在镜像位置 sz - 1 - i
            size_t zigzagIdx = leftToRight ? i : (sz - 1 - i);
            curZigzag[zigzagIdx] = node->val;

            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }

        levelOrder.push_back(curLevel);
        zigzagOrder.push_back(curZigzag);
        leftToRight = !leftToRight;
    }

    std::cout << "LEVEL_ORDER:\n";
    for (const auto& lv : levelOrder) {
        for (size_t i = 0; i < lv.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << lv[i];
        }
        std::cout << "\n";
    }

    std::cout << "ZIGZAG_ORDER:\n";
    for (const auto& row : zigzagOrder) {
        for (size_t i = 0; i < row.size(); i++) {
            std::cout << (i == 0 ? "" : " ") << row[i];
        }
        std::cout << "\n";
    }
}
```

</details>
