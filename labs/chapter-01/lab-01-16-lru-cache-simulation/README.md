---
title: "Lab 01-16：LRU 缓存模拟"
description: "实现一个简化版 LRU 缓存，理解哈希表与双向链表的组合结构设计。"
order: 16
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-17"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 01-16：LRU 缓存模拟

实现一个**简化版 LRU（Least Recently Used）缓存**，支持 `get` 和 `put` 两种操作：

- `get key`：如果缓存中存在键 `key`，返回其值，并将该键标记为最近使用；
- `put key value`：将键值对插入缓存。如果缓存已满，则淘汰最久未使用的键值对。

本题重点在于理解"哈希表定位 + 双向链表维护使用顺序"的组合结构，不要求处理并发。

## 题目

### LRU 缓存模拟

按顺序执行一系列 `get` 和 `put` 操作，输出所有 `get` 操作的结果。

### 任务要求

1. 从标准输入读入缓存容量 `capacity` 和操作数 `n`；
2. 依次执行 `n` 条操作；
3. 对于每条 `get` 操作，输出对应的返回值；如果键不存在，输出 `-1`。

## 输入格式

- 第一行：两个整数 `capacity` 和 `n`，分别表示缓存容量和操作数量；
- 接下来 `n` 行，每行一条操作：
  - `1 key`：表示 `get(key)`；
  - `2 key value`：表示 `put(key, value)`。

## 输出格式

- 对于每个 `get` 操作，输出一行一个整数：
  - 如果键存在于缓存中，输出对应的值；
  - 如果键不存在，输出 `-1`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 缓存容量 `capacity` | 1 ≤ capacity ≤ 10⁴ |
| 操作数 `n` | 1 ≤ n ≤ 10⁵ |
| 键 `key` | 0 ≤ key ≤ 10⁵ |
| 值 `value` | −10⁹ ≤ value ≤ 10⁹ |
| 时间复杂度要求 | 每次操作 O(1) |
| 额外空间限制 | O(capacity) |

## 样例

### 样例输入

```input
2 6
2 1 1
2 2 2
1 1
2 3 3
1 2
1 1
```

### 样例输出

```output
1
-1
1
```

### 样例解释

以样例输入为例，`capacity=2`，操作序列：

| 步骤 | 操作 | 缓存状态（最近 → 最久） | 输出 |
| --- | --- | --- | --- |
| 1 | `put(1,1)` | `[1:1]` | — |
| 2 | `put(2,2)` | `[2:2, 1:1]` | — |
| 3 | `get(1)` | `[1:1, 2:2]` | `1`（命中，提到头部） |
| 4 | `put(3,3)` | `[3:3, 1:1]` | —（满，淘汰尾部 `2:2`） |
| 5 | `get(2)` | `[3:3, 1:1]` | `-1`（`2` 已被淘汰） |
| 6 | `get(1)` | `[1:1, 3:3]` | `1`（命中，提到头部） |

输出：`1`、`-1`、`1`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-16-lru-cache-simulation
pnpm lab:run -- labs/chapter-01/lab-01-16-lru-cache-simulation
pnpm lab:run -- labs/chapter-01/lab-01-16-lru-cache-simulation --case sample
pnpm lab:score -- labs/chapter-01/lab-01-16-lru-cache-simulation
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组边界自测通过
- [ ] 每次操作平均 O(1)
- [ ] 能说明哈希表和双向链表各自维护了什么不变量

## 思考题

1. 如果只允许使用顺序表（数组）来实现 LRU，你会如何设计？时间复杂度会变成什么？
2. 题目中 `get` 操作会改变节点的使用顺序。这在并发环境下会带来什么问题？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

**哈希表 + 双向链表**的组合结构：

- **哈希表**：`O(1)` 定位键值对是否存在；
- **双向链表**：按使用顺序维护节点，最近使用的在头部，最久未用的在尾部。

### 算法步骤

**`get(key)`：**
1. 哈希表查找，不存在返回 `-1`；
2. 存在则将该节点移到链表头部（标记为最近使用），返回值。

**`put(key, value)`：**
1. 若 `key` 已存在，更新值并移到头部；
2. 若不存在：
   - 缓存已满：删除链表尾部节点（最久未用），同时从哈希表删除；
   - 新建节点插入链表头部，哈希表记录映射。

### 复杂度分析

- **时间复杂度**：每次 `get`/`put` 平均 `O(1)`。
- **空间复杂度**：`O(capacity)`，最多存储容量个节点。

### 边界注意

- `capacity = 0` 的情况本题不会出现（`capacity >= 1`）；
- 更新已有键时也要将其移到头部，视为"最近使用"。

</details>

