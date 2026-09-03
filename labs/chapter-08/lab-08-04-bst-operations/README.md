---
title: "Lab 08-04：BST 增删查与边界测试"
description: "实现 BST 的查找、插入与三类删除，用指令序列验证中序有序性与树高不变量。"
order: 4
chapter: 8
chapterTitle: "基础查找与树形查找"
updated: "2026-08-21"
contributors: ["Azen", "RichardYi-SYSU-Mac"]
status: "draft"
lab: true
difficulty: "基础"
duration: "90～120 分钟"
---

# Lab 08-04：BST 增删查与边界测试

## 目标

实现二叉排序树（Binary Search Tree，BST），完成查找、插入、删除与中序遍历，用指令序列验证"中序始终有序"这一核心不变量，并观察随机插入与有序插入的树高差异。

## 前置知识

建议先阅读[第 8.2 节 二叉排序树](../../../content/chapter-08-search/02-binary-search-tree.md)，掌握三类删除情况（叶结点、单孩子、双孩子用中序后继）与退化分析。

## 输入输出格式

程序从标准输入逐行读取指令，直到文件结束。指令与输出如下：

| 指令 | 含义 | 输出 |
| --- | --- | --- |
| `insert x` | 插入关键字 `x`（重复键忽略） | 无 |
| `find x` | 查找关键字 `x` | 命中输出 `1`，未命中输出 `0` |
| `remove x` | 删除关键字 `x` | 删除成功输出 `1`，未找到输出 `0` |
| `inorder` | 中序遍历 | 一行若干整数，按升序排列，空格分隔；空树输出空行 |
| `height` | 树高 | 最长根到叶路径上的结点数，空树为 `0` |

### 样例输入

```input
insert 5
insert 3
insert 7
insert 1
insert 4
insert 6
insert 8
inorder
height
find 4
find 9
```

### 样例输出

```output
1 3 4 5 6 7 8
3
1
0
```

## 任务

1. 实现 BST 的 `insert`、`find`、`remove`、`inorder`、`height`。
2. 删除实现三种情况：叶结点、单孩子、双孩子（用中序后继顶替）。
3. 通过以下边界场景：

   | 场景 | 期望 |
   | --- | --- |
   | 插入 `5,3,7,1,4,6,8` 后中序 | `1 3 4 5 6 7 8` |
   | 删除叶结点 `1` | 中序仍有序，`find 1` 返回 `0` |
   | 删除单孩子结点 `3` | 子树正确上移，中序仍有序 |
   | 删除双孩子结点 `5` | 中序后继顶替，中序仍有序 |
   | 删除不存在的值 | 明确返回 `0`，树不变 |
   | 空树删除 / 查找 | 明确返回 `0`，树高为 `0` |

4. 另写一段本地实验：统计随机插入 100 个不重复值的树高，与有序插入 100 个值的树高对比，理解退化现象。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-basic
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-08/lab-08-04-bst-operations
pnpm lab:run -- labs/chapter-08/lab-08-04-bst-operations
pnpm lab:run -- labs/chapter-08/lab-08-04-bst-operations --case 001-basic
pnpm lab:score -- labs/chapter-08/lab-08-04-bst-operations
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 验收标准

- [ ] 五个测试用例全部通过，每次修改后中序遍历仍严格升序；
- [ ] 双孩子删除后 BST 性质保持；
- [ ] 删除不存在的值与空树操作明确返回 `0`，不崩溃；
- [ ] 随机插入 100 个值的树高明显小于有序插入 100 个值（如随机 ≈ 15 以内 vs 有序 = 100）；
- [ ] 能解释"有序插入导致退化为链"如何使查找复杂度回到 `O(n)`。

## 思考题

1. 为什么用中序后继（或前驱）删除双孩子结点不会破坏 BST 性质？
2. 随机插入与有序插入的树高差异，如何影响 `find` 的平均与最坏复杂度？
3. 如果要求"删除后树高尽量不变小"，中序后继与中序前驱在什么情况下有差别？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

BST 的递归结构使 `insert`、`find`、`remove` 都能沿一条根到叶的路径完成：

- `insert`：沿比较方向下沉，在空指针处新建结点；重复键不插入。
- `find`：等于命中，小于向左，大于向右。
- `remove`：先定位；叶结点直接删除，单孩子用唯一孩子顶替，双孩子用右子树最左结点（中序后继）的关键字顶替后递归删除该后继。

中序遍历天然给出升序序列，因此每次操作后用 `inorder` 即可验证不变量。

### 复杂度分析

- 查找、插入、删除：平均 `O(log n)`，最坏 `O(n)`（退化为链时）。
- 空间：`O(n)`，递归栈最坏 `O(n)`。

### 参考实现

```cpp
#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Node {
    int key;
    std::unique_ptr<Node> left;
    std::unique_ptr<Node> right;
    explicit Node(int k) : key(k) {}
};

class BST {
public:
    void insert(int key) { insert(root_, key); }
    bool find(int key) const { return find(root_.get(), key); }
    bool remove(int key) { return remove(root_, key); }

    void inorder() const {
        std::vector<int> values;
        collect(root_.get(), values);
        for (std::size_t i = 0; i < values.size(); ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << values[i];
        }
        std::cout << '\n';
    }

    int height() const { return height(root_.get()); }

private:
    std::unique_ptr<Node> root_;

    void insert(std::unique_ptr<Node>& node, int key) {
        if (!node) { node = std::make_unique<Node>(key); return; }
        if (key < node->key) insert(node->left, key);
        else if (key > node->key) insert(node->right, key);
    }

    bool find(const Node* node, int key) const {
        if (!node) return false;
        if (key == node->key) return true;
        return key < node->key ? find(node->left.get(), key) : find(node->right.get(), key);
    }

    bool remove(std::unique_ptr<Node>& node, int key) {
        if (!node) return false;
        if (key < node->key) return remove(node->left, key);
        if (key > node->key) return remove(node->right, key);
        if (!node->left) { node = std::move(node->right); return true; }
        if (!node->right) { node = std::move(node->left); return true; }
        const int successor = min(node->right.get());
        node->key = successor;
        return remove(node->right, successor);
    }

    int min(const Node* node) const {
        while (node->left) node = node->left.get();
        return node->key;
    }

    void collect(const Node* node, std::vector<int>& values) const {
        if (!node) return;
        collect(node->left.get(), values);
        values.push_back(node->key);
        collect(node->right.get(), values);
    }

    int height(const Node* node) const {
        if (!node) return 0;
        return 1 + std::max(height(node->left.get()), height(node->right.get()));
    }
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    BST bst;
    std::string op;
    while (std::cin >> op) {
        if (op == "insert") {
            int key; std::cin >> key; bst.insert(key);
        } else if (op == "find") {
            int key; std::cin >> key; std::cout << (bst.find(key) ? 1 : 0) << '\n';
        } else if (op == "remove") {
            int key; std::cin >> key; std::cout << (bst.remove(key) ? 1 : 0) << '\n';
        } else if (op == "inorder") {
            bst.inorder();
        } else if (op == "height") {
            std::cout << bst.height() << '\n';
        }
    }
    return 0;
}
```

</details>
