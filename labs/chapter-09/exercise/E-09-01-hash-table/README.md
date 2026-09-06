---
title: "Lab 09-E-01：散列表实现与冲突统计"
description: "实现链地址法与线性探测两种散列表，用探测次数观察堆积并计算成功与失败 ASL。"
order: 2
chapter: 9
labId: "09E01"
chapterTitle: "散列与索引结构"
updated: "2026-08-21"
contributors: ["Azen", "RichardYi-SYSU-Mac"]
status: "draft"
lab: true
difficulty: "基础"
duration: "90～120 分钟"
---

# Lab 09-E-01：散列表实现与冲突统计

## 目标

实现链地址法与线性探测两种散列表，用查找比较次数（探测次数）观察冲突与堆积，定量理解成功与失败查找的平均查找长度（ASL）。

## 前置知识

建议先阅读[第 8.5 节 散列表](../../../../content/chapter-08-search/05-hash-table.md)，掌握散列函数、链地址法、开放定址法、删除标记与装填因子。

## 输入输出格式

程序第一行读取模式，第二行读取表长 `m`，随后逐行处理指令直到文件结束。关键字 `k` 为非负整数，散列函数固定为 `h(k) = k mod m`。

| 指令 | 含义 | 输出 |
| --- | --- | --- |
| `insert k` | 插入关键字 `k`（重复插入忽略） | 无 |
| `find k` | 查找关键字 `k` | 命中输出 `1`，未命中输出 `0` |
| `delete k` | 删除关键字 `k`（探测法保留墓碑） | 删除成功输出 `1`，未找到输出 `0` |
| `probe k` | 查找 `k` 的比较 / 探测次数 | 一个整数，见下方约定 |
| `dump` | 输出整张表 | 每槽一行，格式 `slot i = …` |

### `probe` 的次数约定

- **链地址法**：返回被检查的链表结点个数。命中时等于 `k` 在链中的位置（从 1 起），未命中时等于该链长度（空链为 `0`）。
- **线性探测**：返回从 `h(k)` 起被检查的槽数，含结束查找的空槽；墓碑槽继续后移，命中或遇到从未使用的空槽即停止。

### `dump` 的格式

- 链地址法：`slot i =` 后接该链中按插入顺序排列的关键字，空链只输出 `slot i =`。
- 线性探测：`slot i = empty`、`slot i = tombstone` 或 `slot i = <key>`。

### 样例输入

```input
probing
7
insert 1
insert 8
insert 15
dump
find 8
find 22
probe 15
probe 22
```

### 样例输出

```output
slot 0 = empty
slot 1 = 1
slot 2 = 8
slot 3 = 15
slot 4 = empty
slot 5 = empty
slot 6 = empty
1
0
3
4
```

## 任务

1. 实现整数键散列函数 `h(k) = k mod m`。
2. 实现两种散列表：

   - **链地址法**：槽位为链表，记录每条链的长度；
   - **线性探测**：冲突时探测下一槽，删除用"已删除"墓碑标记。

3. 通过以下边界场景：

   | 场景 | 期望 |
   | --- | --- |
   | 链地址法插入多个同余关键字 | 形成一条链，`probe` 返回链内位置 |
   | 链地址法删除 | 删除后链缩短，未命中查找返回链长 |
   | 线性探测连续冲突 | 形成聚集，`probe` 随位置后移递增 |
   | 线性探测删除 | 墓碑保留，删除后仍能查到其后的关键字 |
   | 线性探测失败查找 | 到空槽为止的探测次数，可据此求和得到失败 ASL |

4. 另写一段本地实验：随机 1000 个键、`m = 2000`（α ≈ 0.5）与 `m = 500`（α = 2.0），统计平均链长 / 平均探测次数并与理论值对比，观察装填因子对性能的影响。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-chaining-basic
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-09/exercise/E-09-01-hash-table
pnpm lab:run -- labs/chapter-09/exercise/E-09-01-hash-table
pnpm lab:run -- labs/chapter-09/exercise/E-09-01-hash-table --case 001-chaining-basic
pnpm lab:score -- labs/chapter-09/exercise/E-09-01-hash-table
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 验收标准

- [ ] 五个测试用例全部通过；
- [ ] 链地址法插入与查找正确，失败查找明确返回 `0`；
- [ ] 线性探测实现正确，删除用墓碑标记且删除后查找仍正确；
- [ ] 能由 `probe` 输出解释"同义词聚集"如何拉长失败 ASL；
- [ ] 本地实验的平均链长 / 探测次数与装填因子 α 的趋势一致。

## 思考题

1. 为什么线性探测删除不能直接把槽清空，而要保留墓碑标记？
2. 装填因子增大时，链地址法与线性探测的成功 / 失败 ASL 各如何变化？
3. 表长取素数为什么通常比取 2 的幂更不容易产生聚集？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

链地址法把同义词放进链表，冲突只影响本链长度；线性探测在冲突时顺序后移，产生连续占用区（聚集），失败查找要一直探测到空槽。

- **链地址法 `probe`**：命中返回链内位置，未命中返回链长。
- **线性探测 `probe`**：从 `h(k)` 起逐槽检查，遇墓碑继续，遇空槽或命中停止，返回检查槽数。

### 复杂度分析

- 链地址法：平均查找长度约为 `1 + α/2`（成功）、`α + e^{-α}`（失败）。
- 线性探测：成功 ASL 约为 `(1 + 1/(1-α))/2`，失败 ASL 约为 `(1 + 1/(1-α)²)/2`，随 α 接近 1 急剧上升。

### 参考实现

```cpp
#include <iostream>
#include <string>
#include <vector>

namespace {
const int EMPTY = -1;
const int TOMBSTONE = -2;

struct ChainingTable {
    explicit ChainingTable(int m) : chains(m) {}
    bool insert(int key) {
        auto& chain = chains[key % static_cast<int>(chains.size())];
        for (int value : chain) if (value == key) return false;
        chain.push_back(key);
        return true;
    }
    bool find(int key) const {
        const auto& chain = chains[key % static_cast<int>(chains.size())];
        for (int value : chain) if (value == key) return true;
        return false;
    }
    bool remove(int key) {
        auto& chain = chains[key % static_cast<int>(chains.size())];
        for (std::size_t i = 0; i < chain.size(); ++i) {
            if (chain[i] == key) { chain.erase(chain.begin() + static_cast<long>(i)); return true; }
        }
        return false;
    }
    int probes(int key) const {
        const auto& chain = chains[key % static_cast<int>(chains.size())];
        int examined = 0;
        for (int value : chain) { examined += 1; if (value == key) return examined; }
        return examined;
    }
    void dump() const {
        for (std::size_t i = 0; i < chains.size(); ++i) {
            std::cout << "slot " << i << " =";
            for (int value : chains[i]) std::cout << ' ' << value;
            std::cout << '\n';
        }
    }
    std::vector<std::vector<int>> chains;
};

struct ProbingTable {
    explicit ProbingTable(int m) : slots(static_cast<std::size_t>(m), EMPTY) {}
    bool insert(int key) {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        std::size_t target = m;
        for (std::size_t step = 0; step < m; ++step) {
            const std::size_t index = (home + step) % m;
            if (slots[index] == key) return false;
            if (slots[index] == EMPTY || slots[index] == TOMBSTONE) {
                if (target == m) target = index;
                if (slots[index] == EMPTY) break;
            }
        }
        if (target == m) return false;
        slots[target] = key;
        return true;
    }
    bool find(int key) const {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        for (std::size_t step = 0; step < m; ++step) {
            const int slot = slots[(home + step) % m];
            if (slot == EMPTY) return false;
            if (slot == key) return true;
        }
        return false;
    }
    bool remove(int key) {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        for (std::size_t step = 0; step < m; ++step) {
            const std::size_t index = (home + step) % m;
            if (slots[index] == EMPTY) return false;
            if (slots[index] == key) { slots[index] = TOMBSTONE; return true; }
        }
        return false;
    }
    int probes(int key) const {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        for (std::size_t step = 0; step < m; ++step) {
            const int slot = slots[(home + step) % m];
            if (slot == EMPTY || slot == key) return static_cast<int>(step) + 1;
        }
        return static_cast<int>(m);
    }
    void dump() const {
        for (std::size_t i = 0; i < slots.size(); ++i) {
            std::cout << "slot " << i << " = ";
            if (slots[i] == EMPTY) std::cout << "empty";
            else if (slots[i] == TOMBSTONE) std::cout << "tombstone";
            else std::cout << slots[i];
            std::cout << '\n';
        }
    }
    std::vector<int> slots;
};
}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string mode;
    int m = 0;
    if (!(std::cin >> mode >> m) || m <= 0) return 0;
    if (mode == "chaining") {
        ChainingTable table(m);
        std::string op; int key;
        while (std::cin >> op) {
            if (op == "insert") { std::cin >> key; table.insert(key); }
            else if (op == "find") { std::cin >> key; std::cout << (table.find(key) ? 1 : 0) << '\n'; }
            else if (op == "delete") { std::cin >> key; std::cout << (table.remove(key) ? 1 : 0) << '\n'; }
            else if (op == "probe") { std::cin >> key; std::cout << table.probes(key) << '\n'; }
            else if (op == "dump") table.dump();
        }
    } else if (mode == "probing") {
        ProbingTable table(m);
        std::string op; int key;
        while (std::cin >> op) {
            if (op == "insert") { std::cin >> key; table.insert(key); }
            else if (op == "find") { std::cin >> key; std::cout << (table.find(key) ? 1 : 0) << '\n'; }
            else if (op == "delete") { std::cin >> key; std::cout << (table.remove(key) ? 1 : 0) << '\n'; }
            else if (op == "probe") { std::cin >> key; std::cout << table.probes(key) << '\n'; }
            else if (op == "dump") table.dump();
        }
    }
    return 0;
}
```

</details>
