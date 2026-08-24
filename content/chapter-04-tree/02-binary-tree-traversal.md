---
title: "4.3 二叉树的遍历"
description: "掌握前序、中序、后序与层序遍历的递归与显式栈/队列实现，深入序列重构与时空复杂度分析。"
order: 2
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-24"
contributors: ["Wanderer0"]
status: "draft"
---

# 4.3 二叉树的遍历

在数组与链表中，元素排成线性序列，访问顺序只有“从前到后”或“从后到前”。二叉树则是非线性分叉结构，每个节点最多有两个后续分支。要处理树上的数据（如搜索、输出、统计、复制或释放），必须先解决一个核心问题：**如何不重复、不遗漏地访问树中的每一个节点？**

这就是<dfn>二叉树的遍历</dfn>（traversal）。遍历的本质，是把非线性的二维树形结构**按照特定规则映射为一维线性序列**。

本节我们将系统建立二叉树的四种经典遍历模型（前序、中序、后序、层序），剖析递归执行轨迹与显式栈/队列的迭代实现，掌握由遍历序列唯一恢复二叉树的分治算法，并建立时空复杂度的严谨评估模型。

---

## 学习目标

完成本节后，你应该能够：

- 严格阐述前序（$DLR$）、中序（$LDR$）、后序（$LRD$）与层序（Level-Order）的遍历规则与递归定义；
- 利用“递归执行轨迹”与“三遍路过节点模型”解释深度优先遍历的内部状态与时机；
- 熟练写出前序、中序、后序的递归与基于显式栈的非递归（迭代）实现；
- 掌握基于 FIFO 队列的层序遍历及其分层输出、锯齿形与视图变体；
- 证明“前序+中序”或“中序+后序”能唯一确定二叉树的充要条件，并写出分治重构算法；
- 评估四种遍历的时间复杂度与空间复杂度，并根据实际场景作出工程选型。

---

## 4.3.1 深度优先遍历：前序 / 中序 / 后序

深度优先遍历（Depth-First Search, DFS）的核心策略是：**沿着一条路径不断向深处探索，直到无法继续（遇到空节点）再回溯**。

若用 $D$（Data/Root）表示访问根节点，$L$（Left）表示遍历左子树，$R$（Right）表示遍历右子树，且约定**始终先左后右**（即 $L$ 先于 $R$），则根据访问根节点 $D$ 的时机先后，可以划分出三种经典的深度优先遍历方式：

| 遍历方式 | 英文全称 | 访问顺序 | 递归定义 |
| :--- | :--- | :--- | :--- |
| **前序遍历** | Pre-order Traversal | $DLR$（根 $\to$ 左 $\to$ 右） | 先访问根，再前序遍历左子树，最后前序遍历右子树 |
| **中序遍历** | In-order Traversal | $LDR$（左 $\to$ 根 $\to$ 右） | 先中序遍历左子树，再访问根，最后中序遍历右子树 |
| **后序遍历** | Post-order Traversal | $LRD$（左 $\to$ 右 $\to$ 根） | 先后序遍历左子树，再后序遍历右子树，最后访问根 |

### 递归遍历的执行轨迹与“三遍路过”模型

递归遍历代码极短，但初学者常对其调用过程感到抽象。我们可以借助**欧拉环游轨迹（Euler Tour）**来观察计算机执行递归时的真实流动过程：

```text [traversal-trace.txt]
          1 (A)
         /     \
      2 (B)     3 (C)
     /     \
  4 (D)   5 (E)

递归访问全路径（沿树的外轮廓绕行一周）：
A(下) -> B(下) -> D(下) -> D(左空回) -> D(右空回) -> B(中) -> E(下) -> E(左空回) -> E(右空回) -> B(上) -> A(中) -> C(下) -> C(左空回) -> C(右空回) -> A(上)
```

::: property 性质 · 三遍路过模型（Three-Pass Invariant）
在递归遍历中，计算机实际上会**三次路过**每一个非空节点：
1. **第一次到达**（刚从父节点进入该节点，尚未进入左子树）：若此时访问该节点，即为**前序遍历**；
2. **第二次到达**（从左子树递归返回，尚未进入右子树）：若此时访问该节点，即为**中序遍历**；
3. **第三次到达**（从右子树递归返回，准备返回上一层父节点）：若此时访问该节点，即为**后序遍历**。
:::

针对上面的示例二叉树：
- **前序遍历（$DLR$）**：`A -> B -> D -> E -> C`
- **中序遍历（$LDR$）**：`D -> B -> E -> A -> C`
- **后序遍历（$LRD$）**：`D -> E -> B -> C -> A`

### 递归实现的 C / C++ 代码

递归遍历天然映射了二叉树的递归结构定义：

::: details C / C++ 递归遍历实现（点击展开）

```cpp:line-numbers [recursive-traversal.cpp]
#include <iostream>
#include <functional>

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

// 1. 前序遍历 (DLR)
void preorder(const TreeNode* root, const std::function<void(int)>& visit) {
    if (root == nullptr) return;
    visit(root->val);              // 第一次到达：访问根
    preorder(root->left, visit);   // 递归遍历左子树
    preorder(root->right, visit);  // 递归遍历右子树
}

// 2. 中序遍历 (LDR)
void inorder(const TreeNode* root, const std::function<void(int)>& visit) {
    if (root == nullptr) return;
    inorder(root->left, visit);    // 递归遍历左子树
    visit(root->val);              // 第二次到达：访问根
    inorder(root->right, visit);   // 递归遍历右子树
}

// 3. 后序遍历 (LRD)
void postorder(const TreeNode* root, const std::function<void(int)>& visit) {
    if (root == nullptr) return;
    postorder(root->left, visit);   // 递归遍历左子树
    postorder(root->right, visit);  // 递归遍历右子树
    visit(root->val);               // 第三次到达：访问根
}
```

:::

---

## 4.3.2 遍历的非递归实现（显式栈）

递归实现依赖操作系统的**函数调用栈**（Call Stack）。当树退化为单链且深度极大（例如 $h \ge 10^5$）时，递归调用会耗尽栈内存并导致**栈溢出**（Stack Overflow）。

为了在工业级工程中保障系统的鲁棒性，我们需要使用自定义的**显式栈**（`std::stack` 或数组模拟栈）消除递归，将系统调用栈显式化。

### 1. 中序遍历的非递归实现（最基础的左下潜模型）

中序遍历要求“必须先访问完左子树的所有节点，才能访问当前根”。因此逻辑如下：
1. 从根节点开始，一直向左下潜，将沿途经过的所有节点依次压入栈中；
2. 直到左指针为空，说明栈顶节点是最左侧的最小单元；弹出栈顶并访问它；
3. 将当前指针转向该节点的右孩子，重复上述过程。

```text [inorder-stack.txt]
      A
     / \        1. A 入栈，B 入栈，D 入栈 -> 栈 [A, B, D]
    B   C       2. D 无左孩子 -> 弹出 D 访问，转向 D 的右孩子 (空)
   / \          3. 栈顶为 B -> 弹出 B 访问，转向 B 的右孩子 E
  D   E         4. E 入栈 -> 栈 [A, E] -> 弹出 E 访问，转向 E 右孩子 (空)
                5. 栈顶为 A -> 弹出 A 访问，转向 A 的右孩子 C -> C 入栈 ...
```

::: details 中序遍历迭代实现（点击展开）

```cpp:line-numbers [iterative-inorder.cpp]
#include <vector>
#include <stack>

std::vector<int> inorderTraversal(TreeNode* root) {
    std::vector<int> result;
    std::stack<TreeNode*> st;
    TreeNode* curr = root;

    while (curr != nullptr || !st.empty()) {
        // 一路向左下潜，将左链节点全部压栈
        while (curr != nullptr) {
            st.push(curr);
            curr = curr->left;
        }
        // 弹出最左侧节点
        curr = st.top();
        st.pop();
        result.push_back(curr->val); // 访问
        
        // 转向右子树
        curr = curr->right;
    }
    return result;
}
```

:::

### 2. 前序遍历的非递归实现

前序遍历是“先访问当前节点，再进入左右子树”。它有两种经典的迭代写法：

- **写法 A（简洁弹出栈法）**：先将根压入栈。循环中每次弹出栈顶访问，然后**先压入右孩子，再压入左孩子**（因为栈是 LIFO，后压入的左孩子会先弹出访问）。
- **写法 B（左下潜模型，与中序高度对称）**：在沿左侧下潜的同时立即访问节点并压栈；遇到空时弹出并转向右子树。

::: details 前序遍历两种迭代写法（点击展开）

```cpp:line-numbers [iterative-preorder.cpp]
#include <vector>
#include <stack>

// 写法 A：经典栈弹出法
std::vector<int> preorderTraversalA(TreeNode* root) {
    std::vector<int> result;
    if (root == nullptr) return result;
    
    std::stack<TreeNode*> st;
    st.push(root);
    
    while (!st.empty()) {
        TreeNode* node = st.top();
        st.pop();
        result.push_back(node->val);
        
        // 注意：先压右，后压左！
        if (node->right) st.push(node->right);
        if (node->left)  st.push(node->left);
    }
    return result;
}

// 写法 B：左下潜统一模型
std::vector<int> preorderTraversalB(TreeNode* root) {
    std::vector<int> result;
    std::stack<TreeNode*> st;
    TreeNode* curr = root;

    while (curr != nullptr || !st.empty()) {
        while (curr != nullptr) {
            result.push_back(curr->val); // 进入节点即访问！
            st.push(curr);
            curr = curr->left;
        }
        curr = st.top();
        st.pop();
        curr = curr->right;
    }
    return result;
}
```

:::

### 3. 后序遍历的非递归实现

后序遍历是非递归中最具挑战性的，因为父节点必须在**左子树和右子树都访问完毕后**才能访问。当从栈中取出一个节点时，我们必须知道：**我们是从它的左子树返回，还是从它的右子树返回？**

- 若刚从左子树返回：不能弹出该节点，需继续进入其右子树；
- 若刚从右子树返回（或右子树为空）：两子树均已处理完毕，此时才能弹出并访问。

为了解决这一判断，我们需要引入一个辅助指针 `lastVisited`（记录上一个刚被访问的节点）：

::: details 后序遍历单栈迭代实现（点击展开）

```cpp:line-numbers [iterative-postorder.cpp]
#include <vector>
#include <stack>

std::vector<int> postorderTraversal(TreeNode* root) {
    std::vector<int> result;
    std::stack<TreeNode*> st;
    TreeNode* curr = root;
    TreeNode* lastVisited = nullptr; // 记录上一次访问的节点

    while (curr != nullptr || !st.empty()) {
        // 1. 一路向左下潜
        while (curr != nullptr) {
            st.push(curr);
            curr = curr->left;
        }
        
        // 2. 查看栈顶（先不弹出）
        TreeNode* topNode = st.top();
        
        // 3. 判断右子树是否存在且是否已访问过
        if (topNode->right != nullptr && topNode->right != lastVisited) {
            // 右子树尚未访问，转向右子树
            curr = topNode->right;
        } else {
            // 右子树为空，或者右子树刚被访问完毕返回
            result.push_back(topNode->val); // 正式访问
            lastVisited = topNode;          // 标记最近访问
            st.pop();                       // 弹出当前节点
        }
    }
    return result;
}
```

:::

::: tip 技巧 · 前序巧变后序（双栈/反转法）
后序遍历顺序为 $L \to R \to D$。观察其逆序：$(L \to R \to D)^{-1} = D \to R \to L$。
因此，我们可以先写一个类似于前序遍历（根 $\to$ 右 $\to$ 左）的逻辑，最后将结果数组整体反转（`std::reverse`），即可极简得到后序遍历序列！
:::

---

## 4.3.3 广度优先遍历：层序（队列）

与深度优先向纵深探索不同，**广度优先遍历（Breadth-First Search, BFS）**按照树的层次，从第 $1$ 层（根节点）开始，**自顶向下、每层从左到右**逐个访问节点。

由于先被发现的父节点，其孩子节点也必须先被访问，这种“先来先服务”的特性决定了层序遍历必须借助**先进先出（FIFO）的队列（Queue）**实现。

```text [levelorder-trace.txt]
        1 (A)             第 1 层: [A]
       /     \
    2 (B)     3 (C)       第 2 层: [B, C]
   /     \       \
4 (D)   5 (E)     6 (F)   第 3 层: [D, E, F]

队列流动过程：
入队 A -> [A]
出队 A，访问 A；入队 B, C -> [B, C]
出队 B，访问 B；入队 D, E -> [C, D, E]
出队 C，访问 C；入队 F    -> [D, E, F]
出队 D，访问 D；无孩子    -> [E, F]
出队 E，访问 E；无孩子    -> [F]
出队 F，访问 F；无孩子    -> [] (队列空，结束)
输出序列：A -> B -> C -> D -> E -> F
```

### 分层输出模板（Level-by-Level）

在实际工程与算法题中，通常要求输出二维数组（每一层作为独立的子列表），或者在每层结束时统计当前层的节点数、最大值或视图。关键技巧是在每次外层循环开始时，**用固定变量记录当前队列的大小 `levelSize = q.size()`**：

::: details 层序遍历与分层输出 C++ 实现（点击展开）

```cpp:line-numbers [level-order.cpp]
#include <vector>
#include <queue>

std::vector<std::vector<int>> levelOrder(TreeNode* root) {
    std::vector<std::vector<int>> levels;
    if (root == nullptr) return levels;

    std::queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int levelSize = q.size(); // 核心：锁定当前层的节点数量
        std::vector<int> currentLevel;
        currentLevel.reserve(levelSize);

        for (int i = 0; i < levelSize; ++i) {
            TreeNode* node = q.front();
            q.pop();
            currentLevel.push_back(node->val);

            if (node->left != nullptr)  q.push(node->left);
            if (node->right != nullptr) q.push(node->right);
        }
        levels.push_back(std::move(currentLevel));
    }
    return levels;
}
```

:::

---

## 4.3.4 由遍历序列恢复二叉树

在数据传输或持久化存储中，我们经常需要将二叉树序列化为一维遍历数组，并在另一端反序列化恢复出原始二叉树。

::: theorem 定理 1 · 唯一确定二叉树的充要条件
给定一棵**节点值互不相同**的二叉树：
1. **已知“前序遍历 + 中序遍历”** $\Longrightarrow$ 可以唯一确定这棵二叉树；
2. **已知“后序遍历 + 中序遍历”** $\Longrightarrow$ 可以唯一确定这棵二叉树；
3. **已知“层序遍历 + 中序遍历”** $\Longrightarrow$ 可以唯一确定这棵二叉树；
4. **已知“前序遍历 + 后序遍历”** $\Longrightarrow$ **不能**唯一确定二叉树（除非所有非叶节点度数均为 2）。
:::

::: proof 为什么必须有中序遍历？
- **前序/后序/层序**的作用是：确定**根节点是谁**（前序首位是根，后序末位是根，层序首位是根）；
- **中序**的作用是：根据根节点在中序序列中的位置，将序列**一刀切分为左子树集合与右子树集合**。
- 若缺失中序，仅有前序 `[1, 2]` 与后序 `[2, 1]`，无法判断节点 `2` 究竟是节点 `1` 的左孩子还是右孩子（形态不唯一）。
:::

### 1. 从前序与中序遍历序列构造二叉树

**分治算法步骤**：
1. 前序序列当前区间的首元素 `preorder[preL]` 即为当前子树的根节点值 `rootVal`；
2. 在中序序列中找到 `rootVal` 所在的下标 `k`；
3. `k` 左侧的部分 `[inL, k - 1]` 对应左子树，长度为 `leftLen = k - inL`；`k` 右侧的部分 `[k + 1, inR]` 对应右子树；
4. 递归划分区间：
   - 左子树前序区间为 `[preL + 1, preL + leftLen]`，中序区间为 `[inL, k - 1]`；
   - 右子树前序区间为 `[preL + leftLen + 1, preR]`，中序区间为 `[k + 1, inR]`；
5. 用哈希表（`std::unordered_map`）预处理中序下标，将查找根位置的时间由 $O(n)$ 降为 $O(1)$，使整体构造时间达到线性的 $\Theta(n)$。

```text [reconstruct-pre-in.txt]
前序: [ 3 | 9 | 20 15 7 ]
       根  左子    右子
中序: [ 9 | 3 | 15 20 7 ]
       左子 根    右子
```

::: details 前序+中序构造二叉树实现（点击展开）

```cpp:line-numbers [build-tree-pre-in.cpp]
#include <vector>
#include <unordered_map>

class Solution {
public:
    TreeNode* buildTree(const std::vector<int>& preorder, const std::vector<int>& inorder) {
        std::unordered_map<int, int> inMap;
        for (int i = 0; i < (int)inorder.size(); ++i) {
            inMap[inorder[i]] = i;
        }
        return build(preorder, 0, preorder.size() - 1,
                     inorder, 0, inorder.size() - 1, inMap);
    }

private:
    TreeNode* build(const std::vector<int>& preorder, int preL, int preR,
                     const std::vector<int>& inorder, int inL, int inR,
                     const std::unordered_map<int, int>& inMap) {
        if (preL > preR || inL > inR) return nullptr;

        int rootVal = preorder[preL];
        int inRoot = inMap.at(rootVal);
        int leftLen = inRoot - inL;

        TreeNode* leftChild = build(preorder, preL + 1, preL + leftLen,
                                    inorder, inL, inRoot - 1, inMap);
        TreeNode* rightChild = build(preorder, preL + leftLen + 1, preR,
                                     inorder, inRoot + 1, inR, inMap);

        return new TreeNode(rootVal, leftChild, rightChild);
    }
};
```

:::

---

## 4.3.5 四种遍历的比较与复杂度

四种遍历在计算机底层的时间与空间表现具有鲜明的结构特征：

| 遍历方式 | 核心数据结构 | 时间复杂度 | 最好空间复杂度（平衡树） | 最坏空间复杂度（单链树） | 典型应用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **前序遍历** | 栈（递归/显式） | $\Theta(n)$ | $\Theta(\log n)$ | $\Theta(n)$ | 树的序列化与深拷贝、前缀表达式（波兰式） |
| **中序遍历** | 栈（递归/显式） | $\Theta(n)$ | $\Theta(\log n)$ | $\Theta(n)$ | 二叉搜索树（BST）升序输出、中缀表达式 |
| **后序遍历** | 栈（递归/显式） | $\Theta(n)$ | $\Theta(\log n)$ | $\Theta(n)$ | 树的析构释放、计算子树大小/高度、后缀表达式（逆波兰式）、树形 DP |
| **层序遍历** | 队列（FIFO） | $\Theta(n)$ | $\Theta(n)$ | $\Theta(1)$ | 逐层渲染、无权图最短路径、右视图、完全二叉树检验 |

::: complexity 复杂度深度解析
1. **时间复杂度**：无论是哪种遍历，每个节点和每条边都精确进出栈/队列常数次，因此总时间复杂度严格为 $\Theta(n)$。
2. **空间复杂度差异**：
   - **DFS（前/中/后序）**：空间消耗取决于树的高度 $h$（递归栈深度）。满二叉树时 $h = \log_2 n$，空间仅为 $O(\log n)$；但单链退化时 $h = n$，空间达到 $O(n)$。
   - **BFS（层序）**：空间消耗取决于树的最大宽度 $w$（单层最多节点数）。在满二叉树的最后一层，队列最多容纳约 $\lceil n/2 \rceil$ 个节点，空间为 $O(n)$；但在极端单链树中，每层仅有 $1$ 个节点，队列空间仅为 $O(1)$！
:::

---

## 小结与自测

二叉树遍历的本质是==将二维树形关系映射为一维访问序列==。前序、中序、后序是深度优先遍历在“三遍路过”节点时的不同访问时机；层序遍历则是基于 FIFO 队列的广度优先扩散。前序/后序确定根，中序切分左右子树，构成了分治序列恢复的不变法则。

请尝试回答以下自测问题：

1. 一棵非空二叉树的前序序列为 `A, B, C`，中序序列也为 `A, B, C`，这棵二叉树的形态是什么？
2. 为什么在非递归前序遍历的经典弹出栈写法中，必须先将右孩子压栈，再将左孩子压栈？
3. 在非递归后序遍历中，如果不使用 `lastVisited` 指针，会有什么严重后果？
4. 若已知一棵二叉树的前序序列与后序序列，在什么特定条件下可以唯一确定该树？
5. 比较一棵具有 $n$ 个节点的满二叉树在进行 DFS 与 BFS 遍历时的最大辅助内存消耗，并解释原因。

下一节进入[4.4 线索二叉树](./03-threaded-binary-tree.md)：我们将探索如何充分复用二叉树中庞大的空指针域，在不增加额外空间的条件下实现 $O(1)$ 辅助空间的高速双向遍历。
