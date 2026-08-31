---
title: "4.1 树的基本概念与存储结构"
description: "从树的术语与基本性质出发，比较双亲、孩子、孩子兄弟三种表示，并实现一般树。"
order: 0
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-24"
contributors: ["Azen"]
status: "draft"
---

# 4.1 树的基本概念与存储结构

线性表把元素排成一条线，树则用分支表达“一对多”的层次关系。课程目录、文件系统、组织结构和语法分析都可以抽象成树：每个对象只沿一条路径归属于上层对象，却可以继续管理多个下层对象。

本页也是第 4 章的入口。我们先建立一般树的术语与 Tree ADT，再比较三种经典存储结构，最后分别用 C 和 C++ 落地一棵可创建、遍历和释放的多叉树。[下一节](./01-binary-tree.md)会把每个节点的孩子位置固定为“左、右”两个槽位。

## 学习目标

完成本节后，你应该能够：

- 用同一棵示例树解释节点、根、子树、父子、兄弟、度、叶、内部节点、层次、深度和高度；
- 推导非空树的边数与度数和，并说明树与森林之间的转换；
- 用 Tree ADT 描述行为，而不把接口误写成某一种存储结构；
- 比较双亲表示法、孩子表示法和孩子兄弟表示法的查询代价与空间取舍；
- 阅读并实现 C 的孩子兄弟树，以及 C++ 的所有权安全多叉树。

## 4.1.1 树的定义与基本术语

::: definition 定义 · 树
<dfn>树</dfn>（tree）是由有限个节点组成的集合：

- 节点数为 $0$ 时，称为<dfn>空树</dfn>；
- 节点数大于 $0$ 时，有且仅有一个节点称为<dfn>根</dfn>；
- 除根外，其余节点被划分为若干个互不相交的集合，每个集合自身又是一棵树，称为根的<dfn>子树</dfn>。

这一定义是递归的。它同时保证了树是连通的，并且不存在环。
:::

先观察一棵课程目录树：

```graphviz
digraph CourseTree {
  rankdir=TB;
  node [shape=box];
  data [label="数据结构"];
  linear [label="线性结构"];
  list [label="线性表"];
  stack [label="栈与队列"];
  nonlinear [label="非线性结构"];
  tree [label="树"];
  graph_node [label="图"];
  data -> {linear nonlinear};
  linear -> {list stack};
  nonlinear -> {tree graph_node};
}
```
<!-- diagram id="course-tree" caption: "数据结构课程中线性结构与非线性结构的层次关系" -->

下面统一约定：根在第 $1$ 层；节点深度按“从根到该节点经过的边数”计算，因此根的深度为 $0$；节点高度按“从该节点到最远叶节点经过的边数”计算，因此叶节点高度为 $0$。

| 术语 | 严格含义 | 示例 |
| --- | --- | --- |
| 节点（node） | 树中的一个数据元素及其关系信息 | “线性结构” |
| 边（edge） | 连接一对父子节点的关系 | “数据结构”到“线性结构” |
| 根（root） | 唯一没有父节点的节点 | “数据结构” |
| 父节点 / 孩子节点 | 一条边上更靠近根 / 更远离根的节点 | “线性结构”是“线性表”的父节点 |
| 兄弟节点（sibling） | 具有同一父节点的不同节点 | “线性表”与“栈与队列” |
| 祖先 / 后代 | 根到某节点路径上的前驱 / 以某节点为根的子树中的节点 | “数据结构”是“栈与队列”的祖先 |
| 子树（subtree） | 某节点及其全部后代构成的树 | 以“非线性结构”为根的部分 |
| 节点的度 | 该节点拥有的孩子数 | “线性结构”的度为 $2$ |
| 树的度 | 全部节点度数的最大值 | 示例树的度为 $2$ |
| 叶节点（leaf） | 度为 $0$ 的节点，也称终端节点 | “树”“图”等 |
| 内部节点 | 度大于 $0$ 的节点，也称分支节点 | “数据结构”“线性结构” |
| 层次（level） | 根为第 $1$ 层，孩子比父节点多一层 | “图”在第 $3$ 层 |
| 节点深度（depth） | 根到该节点路径上的边数 | “图”的深度为 $2$ |
| 节点高度（height） | 该节点到最远叶节点路径上的边数 | “非线性结构”的高度为 $1$ |
| 树高 | 根节点的高度 | 示例树高为 $2$，共有 $3$ 层 |

::: pitfall 易错点 · 深度、高度与层数的口径
有些教材把“树的深度”定义为最大层数，并令单节点树的深度为 $1$；另一些资料按边数定义高度，令单节点树高度为 $0$。两种口径都可使用，但不能在同一推导中混用。本文写“第 $i$ 层”或“共有 $k$ 层”时从 $1$ 开始；写节点深度与高度时按边数计算。
:::

### 有序树与森林

::: definition 定义 · 有序树
如果每个节点的孩子之间规定了从左到右的相对次序，并且交换两个孩子会得到不同的结构，这棵树称为<dfn>有序树</dfn>。未规定孩子次序时称为无序树。
:::

目录菜单、表达式结构通常是有序树；只表达成员归属、且同级顺序无意义的分类体系可以建模为无序树。==“有序”描述孩子的相对位置，不等于节点数据已经按大小排序。==

::: definition 定义 · 森林
<dfn>森林</dfn>（forest）是若干棵互不相交的树组成的集合。删除一棵非空树的根，根的各棵子树就组成一片森林；反过来，给一片森林增加一个新根，并把每棵树的根连接为新根的孩子，就得到一棵树。
:::

## 4.1.2 树的基本性质与 Tree ADT【进阶】

### 边数、路径与度数和

::: theorem 定理 · 非空树的边数
一棵含 $n$ 个节点的非空树恰好有 $n-1$ 条边。
:::

::: proof
根没有父节点，其余 $n-1$ 个节点都恰好有一个父节点。每个非根节点与其父节点之间对应唯一一条边，所以边数为 $n-1$。

也可以从递归构造理解：单节点树有 $0$ 条边；每向已有树接入一个新节点，必须且只能增加一条连接边，否则新节点不连通或形成环。
:::

由此立即得到：

::: property 性质 · 一般树的数量关系
对含 $n>0$ 个节点的树：

1. 任意两节点之间存在唯一简单路径；
2. 全部节点的度数和等于边数：
   $$
   \sum_{v \in V}\deg(v)=n-1;
   $$
3. 删除任意一条边都会使树分成两棵树；增加一条连接树内两个既有节点的边则会产生环；
4. 若树的最大度不超过 $m$，根在第 $1$ 层，则第 $i$ 层最多有 $m^{i-1}$ 个节点。
:::

当 $m>1$ 且树共有 $k$ 层时，节点总数满足：

$$
n \le 1+m+m^2+\cdots+m^{k-1}
  =\frac{m^k-1}{m-1}.
$$

这个上界只有在每个非叶节点都有 $m$ 个孩子、且叶节点都位于第 $k$ 层时才能取到。若不限制树的度，仅知道层数无法给出有限的节点数上界。

### 从结构转向行为：Tree ADT

<dfn>抽象数据类型</dfn>（Abstract Data Type，ADT）描述“数据对象允许什么操作、操作满足什么约束”，不规定节点必须放在数组还是链表里。

::: definition 定义 · Tree ADT
Tree ADT 的数据对象是一组节点及其父子关系，并保持以下结构不变量：

- 空树没有根；非空树恰好有一个根；
- 根没有父节点，其余节点恰好有一个父节点；
- 从根可以到达每个节点，且不存在环。

典型操作包括：

| 操作 | 行为约定 |
| --- | --- |
| `empty()` | 判断树是否为空 |
| `root()` | 返回根；空树时按接口约定失败 |
| `value(node)` | 读取节点保存的数据 |
| `parent(node)` | 返回父节点；根没有父节点 |
| `children(node)` | 按既定次序枚举直接孩子 |
| `degree(node)` | 返回直接孩子数 |
| `insertChild(parent, position, subtree)` | 在指定位置接入一棵独立子树，并保持无环和单父节点 |
| `removeSubtree(node)` | 断开并返回或销毁以 `node` 为根的整棵子树 |
| `traverse(order, visit)` | 按约定次序访问每个节点一次 |
:::

::: intuition 直觉 · ADT 是合同，存储结构是履约方式
如果业务最常问“这个节点的父节点是谁”，双亲表示法会让 `parent` 很快；如果最常做自顶向下遍历，孩子表或孩子兄弟表示更自然。接口语义没有改变，改变的是每个操作的实现成本。
:::

::: pitfall 易错点 · 接入子树不是随便连一条指针
若待接入节点已经属于当前树，直接连接可能让一个节点拥有两个父节点，或让祖先成为后代从而产生环。工程实现至少要明确所有权转移规则；需要支持移动子树时，应先从原父节点断开，再验证目标位置不会形成环。
:::

## 4.1.3 树的存储结构

树的逻辑关系固定，但内存中没有天然的“分支”。经典表示法分别优先保存父关系、孩子集合或孩子之间的次序。

### 双亲表示法

把所有节点放在连续数组中，每个节点记录父节点下标；根的父下标用 `-1` 表示。

```cpp:line-numbers [parent-array.cpp]
struct ParentNode {
    char value;
    int parent;  // 根为 -1
};

ParentNode nodes[] = {
    {'A', -1},
    {'B',  0},
    {'C',  0},
    {'D',  1},
};
```

- 已知节点下标时，查父节点只需 $O(1)$；
- 枚举某节点的所有孩子通常要扫描整个数组，为 $O(n)$；
- 连续存储紧凑、易序列化，但插入删除若要求数组连续，可能需要搬移或维护空槽。

### 孩子表示法

每个节点保存一张孩子下标表。可以理解为“节点数组 + 每个节点一条孩子链表”，也可以直接使用动态数组：

```cpp:line-numbers [children-lists.cpp]
struct ChildrenNode {
    char value;
    std::vector<int> children;
};
```

枚举节点 $v$ 的孩子只需 $O(\deg(v))$，保持有序树的孩子次序也很直接；若不额外保存父下标，反向查父仍需扫描多个孩子表。

### 孩子兄弟表示法

每个节点只保留两个链接：

- `firstChild`：指向第一个孩子；
- `nextSibling`：指向下一个兄弟。

```graphviz
digraph ChildSibling {
  rankdir=TB;
  node [shape=circle];
  subgraph cluster_logical {
    label="逻辑树";
    A_tree [label="A"];
    B_tree [label="B"];
    C_tree [label="C"];
    D_tree [label="D"];
    E_tree [label="E"];
    A_tree -> {B_tree C_tree D_tree};
    C_tree -> E_tree;
  }
  subgraph cluster_links {
    label="孩子兄弟链接";
    A_link [label="A"];
    B_link [label="B"];
    C_link [label="C"];
    D_link [label="D"];
    E_link [label="E"];
    A_link -> B_link [label="firstChild"];
    B_link -> C_link [label="nextSibling"];
    C_link -> D_link [label="nextSibling"];
    C_link -> E_link [label="firstChild"];
  }
}
```
<!-- diagram id="child-sibling" caption: "firstChild 与 nextSibling 把一般树编码为二叉链接结构" -->

任意度的一般树因此被编码成了一个“左边走向第一个孩子、右边走向下一个兄弟”的二叉链接结构。每个节点链接数固定为 $2$，既能保留孩子次序，也不需要为最大度预留指针槽。

::: property 性质 · 树与孩子兄弟二叉表示
一片有序森林可以与一棵孩子兄弟二叉树一一对应：

- 二叉链接的“左”指向原树的第一个孩子；
- 二叉链接的“右”指向原树的下一个兄弟。

这里的右链接表达兄弟关系，不是原树中的父子边，因此不能把两种结构的深度直接等同。
:::

### 三种表示法对比

| 维度 | 双亲表示法 | 孩子表示法 | 孩子兄弟表示法 |
| --- | --- | --- | --- |
| 每节点关系字段 | 一个父下标 | 一个孩子容器入口 | 两个链接 |
| 查父节点 | $O(1)$ | 通常 $O(n)$，可额外存父 | 通常 $O(n)$，可额外存父 |
| 枚举直接孩子 | 通常扫描 $O(n)$ | $O(\deg(v))$ | $O(\deg(v))$ |
| 取得第一个孩子 | 通常 $O(n)$ | $O(1)$ | $O(1)$ |
| 保持孩子次序 | 需额外约定 | 自然 | 自然 |
| 度变化 | 不影响字段数 | 容器按需增长 | 不影响字段数 |
| 典型场景 | 并查式回溯、序列化、频繁查父 | 频繁自顶向下遍历 | 度差异大、需统一两链接表示 |

::: tip 选择表示法
先列出高频操作，再选择存储结构。若父查询与孩子遍历都频繁，可以同时保存 `parent` 和 `children`，用少量冗余换取双向 $O(1)$ 定位；代价是每次移动或删除子树都必须同步维护两处关系。
:::

## 4.1.4 一般树的实现【C/C++】与多叉树工程【拓展】

### C：孩子兄弟表示

下面的实现让每个节点独占自己的孩子链。`tree_append_child` 只接入一棵独立子树；`tree_destroy` 会释放整棵子树，但不会沿根节点的 `next_sibling` 越界释放外部兄弟。

::: details C 实现（点击展开）

```c:line-numbers [general-tree.c]
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    char value;
    struct TreeNode* first_child;
    struct TreeNode* next_sibling;
} TreeNode;

TreeNode* tree_create_node(char value) {
    TreeNode* node = malloc(sizeof *node);
    if (node == NULL) {
        return NULL;
    }
    node->value = value;
    node->first_child = NULL;
    node->next_sibling = NULL;
    return node;
}

bool tree_append_child(TreeNode* parent, TreeNode* child) {
    if (parent == NULL || child == NULL || child->next_sibling != NULL) {
        return false;
    }

    TreeNode** link = &parent->first_child;
    while (*link != NULL) {
        link = &(*link)->next_sibling;
    }
    *link = child;
    return true;
}

void tree_preorder(const TreeNode* root) {
    if (root == NULL) {
        return;
    }

    printf("%c ", root->value);
    for (const TreeNode* child = root->first_child;
         child != NULL;
         child = child->next_sibling) {
        tree_preorder(child);
    }
}

void tree_destroy(TreeNode* root) {
    if (root == NULL) {
        return;
    }

    TreeNode* child = root->first_child;
    while (child != NULL) {
        TreeNode* next = child->next_sibling;
        child->next_sibling = NULL;
        tree_destroy(child);
        child = next;
    }
    free(root);
}
```

:::

`tree_append_child` 为保持孩子次序需要走到兄弟链尾部，时间为 $O(\deg(parent))$。若节点再保存尾孩子指针，就能把末尾追加降为 $O(1)$，但删除最后孩子时需额外维护该指针。

::: warning C 所有权约定
上面的 API 约定：接入成功后，`parent` 管理 `child` 子树；调用者不得再单独释放 `child`。实现没有全局节点登记表，无法自行识别“把祖先接到后代下面”的环，因此调用前还必须保证 `child` 是与 `parent` 所在树互不相交的独立子树。
:::

### C++：用 RAII 表达唯一所有权

一般业务中，每个树节点只有一个父节点，正好对应 `std::unique_ptr` 的唯一所有权。父节点销毁时，孩子容器及所有后代会递归自动释放。

::: details C++ 实现（点击展开）

```cpp:line-numbers [general-tree.cpp]
#include <algorithm>
#include <cstddef>
#include <memory>
#include <string>
#include <utility>
#include <vector>

struct Node {
    explicit Node(std::string text) : value(std::move(text)) {}

    Node& emplaceChild(std::string text) {
        children.push_back(std::make_unique<Node>(std::move(text)));
        return *children.back();
    }

    std::string value;
    std::vector<std::unique_ptr<Node>> children;
};

template <class Visit>
void preorder(const Node* root, Visit&& visit) {
    if (root == nullptr) {
        return;
    }
    visit(*root);
    for (const auto& child : root->children) {
        preorder(child.get(), visit);
    }
}

std::size_t height(const Node& root) {
    if (root.children.empty()) {
        return 0;
    }

    std::size_t answer = 0;
    for (const auto& child : root.children) {
        answer = std::max(answer, std::size_t{1} + height(*child));
    }
    return answer;
}
```

:::

`height` 接收非空节点引用，因此叶节点高度明确为 $0$，不会把空树与叶混成同一个返回值。`children` 采用 `std::vector`，顺序遍历具有良好的局部性，末尾添加的摊还时间为 $O(1)$。容器扩容会移动 `unique_ptr` 对象，却不会移动它们在堆上的 `Node`；但指向 `vector` 元素本身的迭代器和引用仍会失效。

### 多叉树的工程取舍

::: property 性质 · 工程实现必须持续维护的不变量
每次插入、移动或删除子树后，都应满足：

- 一个节点至多有一个拥有者或父节点；
- 根没有父节点，所有非根节点都可由根到达；
- 任何节点都不能成为自己的祖先；
- 有序树中孩子容器的次序就是业务次序；
- 外部索引、父观察指针与孩子所有权同时存在时，它们指向同一结构版本。
:::

真实系统还需要根据访问模式作选择：

1. **所有权**：普通树优先使用唯一所有权；若多个上层对象共享同一节点，结构已经更接近 DAG，不应继续套用树的单父不变量。
2. **孩子容器**：遍历多、追加多时优先连续容器；若需要按名字频繁定位，可额外维护哈希索引，但展示次序仍要有单一来源。
3. **稳定标识**：界面、数据库或网络协议不要长期保存容器下标，宜使用稳定 ID，再由索引找到节点。
4. **父链接**：可以保存非拥有型 `parent` 指针加速向上查询，但移动子树时必须同步更新；父子双方都用拥有型智能指针会形成错误的双重所有权。
5. **递归深度**：遍历时间为 $\Theta(n)$，递归额外空间为 $\Theta(h)$。退化成链时 $h=n-1$，深树应改用显式栈或设置输入深度上限。
6. **并发修改**：遍历期间改变孩子容器可能使迭代器失效；需要快照、版本号或明确禁止边遍历边改结构。

::: complexity 复杂度 · 一般树遍历与释放
无论采用孩子表还是孩子兄弟表示，只要每个节点和每条父子边各处理常数次，完整遍历与释放的时间都是 $\Theta(n)$。递归实现的辅助空间为 $\Theta(h)$，其中 $h$ 是按边数计算的树高；存储全部节点与关系需要 $\Theta(n)$ 空间。
:::

## 配套理论题

本章理论练习按知识主题拆成八组。选择题可在网页中即时提交和重做；综合题先独立推导，再展开参考答案核对。题量不足上限的主题按现有题目全部收录，不跨主题补题。

| 顺序 | 主题与入口 | 选择题 | 综合题 |
| ---: | --- | ---: | ---: |
| 01 | [二叉树基础（性质与存储）理论题精练](../../labs/chapter-04/theory/T-04-01-binary-tree-basics-quiz/README.md) | 20 | 5 |
| 02 | [前序遍历理论题精练](../../labs/chapter-04/theory/T-04-02-preorder-traversal-quiz/README.md) | 12 | 1 |
| 03 | [中序遍历理论题精练](../../labs/chapter-04/theory/T-04-03-inorder-traversal-quiz/README.md) | 11 | 3 |
| 04 | [后序遍历理论题精练](../../labs/chapter-04/theory/T-04-04-postorder-traversal-quiz/README.md) | 14 | 0 |
| 05 | [层序遍历理论题精练](../../labs/chapter-04/theory/T-04-05-level-order-traversal-quiz/README.md) | 8 | 0 |
| 06 | [由遍历序列构造二叉树理论题精练](../../labs/chapter-04/theory/T-04-06-reconstruct-binary-tree-quiz/README.md) | 18 | 2 |
| 07 | [线索二叉树理论题精练](../../labs/chapter-04/theory/T-04-07-threaded-binary-tree-quiz/README.md) | 14 | 0 |
| 08 | [树与森林理论题精练](../../labs/chapter-04/theory/T-04-08-trees-and-forests-quiz/README.md) | 20 | 5 |

## 小结与自测

树的本质不是“很多指针”，而是==唯一根、单一父关系、连通且无环==。Tree ADT 先固定行为，双亲、孩子和孩子兄弟表示再为不同查询模式支付不同成本。C 需要显式约定和释放所有权；C++ 可以用 RAII 把“父拥有孩子”的结构不变量编码进类型。

请尝试回答：

1. 含 $12$ 个节点的非空树有多少条边？全部节点的度数和是多少？
2. 删除根后得到的是一棵树还是一片森林？怎样把它重新接回一棵树？
3. 为什么双亲表示法查父为 $O(1)$，枚举孩子却通常为 $O(n)$？
4. 孩子兄弟表示中的 `nextSibling` 为什么不能算作原树的父子边？
5. 若系统既要频繁向上查询又要频繁枚举孩子，你会保存哪些字段，更新时必须维护什么不变量？

下一节进入[4.2 二叉树](./01-binary-tree.md)：当每个节点固定拥有左、右两个有序槽位后，树会得到更强的数量性质与更紧凑的数组编号。
