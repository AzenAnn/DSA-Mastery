---
title: "1.6 从数组解法到链表解法——解题模型的迁移"
description: "把下标、双指针和元素搬移迁移为游标、结构不变量与节点重连。"
order: 6
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-31"
contributors: ["Azen"]
status: "draft"
---

# 1.6 从数组解法到链表解法——解题模型的迁移

你做完一组线性表题，回头一看，题目明明在考链表，自己却用数组全做出来了。

这当然不是坏事。能用数组做出来，说明你已经抓住了题目关于“有序序列”的那一层逻辑。但如果考试进一步要求“必须使用单链表”“不允许辅助数组”“原地修改节点链接”，只保留数组答案就不够了。真正需要补上的，并不是再背几段链表模板，而是回答一个更有迁移价值的问题：

> 数组解法究竟依赖了哪些能力？换成链式存储后，这些能力应该由什么替代？

反转只是这条路的起点。顺着它继续走，我们会遇到倒数第 (k) 个节点、有序合并、回文、相邻交换、约瑟夫环和静态链表。你会发现，很多数组技巧没有消失，只是从“两个下标”变成了“两个游标”，从“搬动元素”变成了“改写邻接关系”，从“循环条件”变成了“结构不变量”。

## 学习目标

完成本节后，你应该能够：

- 区分题目的序列语义、存储表示和具体算法，不把三者混为一谈；
- 找出数组解法隐含使用的随机访问、双端访问和元素搬移能力；
- 用节点游标、前驱、哨兵和链接重连重建同一个解题过程；
- 从循环不变量出发写出单链表逆置，而不是只记住四行赋值；
- 根据迭代器能力判断 STL 算法能否用于 `vector`、`list`、`forward_list` 或自定义链表；
- 识别哪些题可以直接迁移、哪些题需要换模型、哪些题不应强行使用链表；
- 用一套固定流程完成链表题的画图、实现、复杂度分析和结构检查。

## 6.1 先把三层问题拆开

数组和链表都能保存一个线性序列，但它们给算法提供的基本动作并不相同。迁移之前，先把问题分成三个层次。

### 6.1.1 第一层：ADT 决定“题目要什么”

[线性表 ADT](./01-abstract-data-type.md)描述的是逻辑行为，例如：

- 元素有确定的先后顺序；
- 可以读取、插入、删除和遍历；
- 操作需要定义合法位置和失败方式。

“反转序列”“删除倒数第 (k) 个元素”“合并两个有序序列”都属于这一层。它们并没有天然绑定数组或链表。

### 6.1.2 第二层：存储表示决定“手里有什么动作”

顺序表用连续空间表达顺序，链表用链接表达顺序：

```text
顺序表
下标      0      1      2      3
数据     10     20     30     40

单链表
head ─► [10 | •] ─► [20 | •] ─► [30 | •] ─► [40 | null]
```

数组中的 `i + 1` 同时带有两层含义：

1. 下一个逻辑位置；
2. 可以通过地址计算立即到达的位置。

链表中的“下一个”只由 `next` 决定。节点即使物理地址相隔很远，只要 `next` 指向正确，逻辑顺序就成立。

### 6.1.3 第三层：算法决定“怎样组合这些动作”

数组反转通常组合的是“左右下标向中间移动 + 交换元素”；链表反转组合的是“保存后继 + 改写 `next` + 推进游标”。目标相同，但算法使用的原语已经改变。

::: intuition 迁移不是逐行翻译
把 `a[i]` 机械改成 `p->value` 往往走不通，因为 `i + 1` 是常数时间地址计算，`p->next` 才是链表里真正的逻辑后继。迁移时应该保留问题语义，重新选择能够维护同一不变量的动作。
:::

可以把这三层记成一条链：

```text
题目语义（要得到什么）
        ↓ 保留
表示能力（能怎样访问和修改）
        ↓ 替换
算法不变量（每一步保证什么）
```

## 6.2 数组技巧迁移到链表的坐标系

做迁移时，不要先写代码。先把数组解法使用的能力列出来，再逐项寻找链表替代物。

| 数组解法中的能力 | 链表中的替代方式 | 主要代价或风险 |
| --- | --- | --- |
| `a[i]` 随机访问 | 从某个已知节点沿 `next`/`prev` 行走 | 定位通常从 `O(1)` 变为 `O(n)` |
| `i++`、`j--` | `p = p->next`、双链表中的 `q = q->prev` | 单链表不能直接后退 |
| 左右下标同时扫描 | 双向链表两端游标，或单链表快慢指针/反转后半段 | 需要重新设计相遇条件 |
| 插入后整体右移 | 找到前驱后接入新节点 | 修改是 `O(1)`，定位未必是 |
| 删除后整体左移 | 让前驱跳过目标节点并释放目标 | 容易留下悬空指针 |
| 交换 `a[i]` 与 `a[j]` | 交换节点数据，或真正交换节点位置 | 两者在节点身份有意义时不等价 |
| `n - k` 计算倒数位置 | 快慢指针维持固定距离 | 需要明确 `k` 的合法范围 |
| 下标取模形成循环 | 尾节点指回头节点 | 终止条件不能再写 `p != nullptr` |
| 新数组承接结果 | 哨兵节点 + `tail` 逐段接链 | 要明确是否复用、转移节点所有权 |

### 6.2.1 链表操作的复杂度要拆成两段

“链表插入删除是 `O(1)`”是一句缺少前提的话。更准确的成本模型是：

$$
T_{\text{total}}
= T_{\text{locate}}
+ T_{\text{modify}}
$$

- 输入给出下标时，单链表通常要先遍历，`T_locate = O(n)`；
- 已经持有目标节点的前驱时，修改有限条链接，`T_modify = O(1)`；
- 如果业务一直保存着稳定节点或迭代器，定位成本可能早已在之前支付。

因此，把数组解法改成链表解法后，必须重新分析复杂度，不能沿用原来的结论。

### 6.2.2 先判断你写的是顺序表，还是静态链表

“我用数组模拟了链表”可能指两件完全不同的事。

第一种写法只有连续数据：

```cpp [sequential-storage.cpp]
long long values[1000];
```

如果插入删除依靠移动一段元素，它仍然是顺序表。

第二种写法让数组槽位保存逻辑后继：

```cpp [cursor-list-shape.cpp]
struct Slot {
    long long value{};
    int next = -1;
};

Slot slots[1000];
int head = -1;
```

这已经是[静态链表](./05-real-world-practices.md#52-静态链表与-free-list)。`slots[i]` 中的 `i` 表示物理槽位，真正的逻辑顺序由 `next` 串起来。把 `int next` 换成 `Node* next`，大部分改链算法几乎可以逐行对应。

::: pitfall 数组下标不一定是逻辑位序
在静态链表 `7 → 2 → 19 → -1` 中，第 0、1、2 个逻辑元素分别位于槽位 7、2、19。直接读取 `slots[1]` 得不到第 1 个逻辑元素。用了数组作为节点池，不等于重新获得顺序表的随机访问语义。
:::

### 6.2.3 一张可重复使用的迁移流程

面对一道已经有数组解法的题，可以按下面六步重做：

1. **冻结目标**：写清楚结果序列应该满足什么，而不是先看已有代码。
2. **标出数组特权**：圈出 `a[i]`、`i - 1`、`n - k`、区间搬移、首尾同时访问等操作。
3. **选择链表游标**：判断需要 `curr`、`prev`、`fast/slow`、`tail`，还是哨兵节点。
4. **重写不变量**：说明每轮循环开始时，哪些节点已经处理、哪些链仍然完整。
5. **按安全顺序改链**：先保存以后仍需访问的入口，再覆盖链接，最后推进游标。
6. **重新算成本**：分别计算定位、遍历、重连、额外空间和节点分配/释放。

这六步比背“链表题十大模板”慢一点，但迁移到陌生题时可靠得多。

## 6.3 第一场完整迁移：反转

反转适合作为起点，因为它把两种表示的差异暴露得很彻底。

### 6.3.1 数组反转维护的是什么

数组版可以从两端向中间交换：

```cpp:line-numbers [reverse-vector-fragment.cpp]
std::size_t left = 0;
std::size_t right = values.size();

while (left < right) {
    --right;
    if (left >= right) break;
    std::swap(values[left], values[right]);
    ++left;
}
```

它依赖两项能力：

- `values[left]` 和 `values[right]` 都能在 `O(1)` 时间访问；
- 交换两个元素不会改变其他位置的可达性。

单链表没有尾下标，也不能由当前节点直接走向前驱。因此，数组版的“双端夹逼”不能原样搬过去。

### 6.3.2 链表反转改变的是邻接关系

先固定节点结构：

```cpp [singly-node.cpp]
struct Node {
    long long value{};
    Node* next = nullptr;
};
```

单链表逆置的核心函数如下：

```cpp:line-numbers [reverse-list.cpp]
Node* reverse_list(Node* head) {
    Node* prev = nullptr;
    Node* curr = head;

    while (curr != nullptr) {
        Node* next = curr->next;  // 保存未处理后缀的入口
        curr->next = prev;        // 当前节点接到已反转前缀之前
        prev = curr;              // 扩大已反转前缀
        curr = next;              // 进入未处理后缀
    }

    return prev;
}
```

拿 `1 → 2 → 3 → null` 走一遍：

| 轮次开始 | `prev` 指向 | `curr` 指向 | 保存的 `next` | 改链后的已反转部分 |
| --- | --- | --- | --- | --- |
| 初始 | `null` | 1 | — | 空 |
| 第 1 轮 | `null` | 1 | 2 | `1 → null` |
| 第 2 轮 | 1 | 2 | 3 | `2 → 1 → null` |
| 第 3 轮 | 2 | 3 | `null` | `3 → 2 → 1 → null` |
| 结束 | 3 | `null` | — | 全部完成 |

::: property 反转循环不变量
每轮循环开始时，`prev` 是“原链表已处理前缀”的逆序头节点，`curr` 是“原链表未处理后缀”的头节点；两部分互不重叠，并且合起来恰好包含原链表全部节点。
:::

::: proof 为什么返回 prev
初始时已处理前缀为空，不变量成立。每轮先保存 `curr->next`，因此未处理后缀不会丢失；再令 `curr->next = prev`，当前节点被安全地移到已反转前缀前面；最后分别推进 `prev` 和 `curr`，不变量继续成立。循环结束时 `curr == nullptr`，未处理后缀为空，所以 `prev` 包含全部节点，且顺序已经反转。
:::

### 6.3.3 为什么必须先保存 `next`

如果把更新顺序写成这样：

```cpp [broken-reverse.cpp]
curr->next = prev;
curr = curr->next;
```

第二行走向的是刚刚改好的前驱，而不是原来的后继。原链表剩余部分失去了唯一入口，轻则只反转一个节点，重则形成错误环路。

链表改写中最常用的一条安全规则是：

> 在覆盖一条链接以前，先保存通过这条链接才能到达、而之后仍然需要访问的节点。

### 6.3.4 空表、单节点和旧头节点

上面的循环天然覆盖三个边界：

- 空表：`curr` 一开始就是 `nullptr`，直接返回 `nullptr`；
- 单节点：执行一轮，把它的 `next` 设为 `nullptr`，仍返回自己；
- 多节点：原头节点最先执行 `curr->next = nullptr`，因此自然成为新尾节点。

如果链表外壳还维护 `tail_`，反转前的 `head_` 应成为新 `tail_`，函数返回值成为新 `head_`。如果使用 dummy head，哨兵不属于数据序列，不参与反转；应反转 `dummy.next` 指向的有效节点，再把返回的新头接回 `dummy.next`。

### 6.3.5 递归版本并没有消除保存现场

递归写法看起来更短：

```cpp:line-numbers [reverse-list-recursive.cpp]
Node* reverse_list_recursive(Node* head) {
    if (head == nullptr || head->next == nullptr) {
        return head;
    }

    Node* new_head = reverse_list_recursive(head->next);
    head->next->next = head;
    head->next = nullptr;
    return new_head;
}
```

它让递归调用先反转后缀，再把当前 `head` 接到后缀末尾。逻辑正确，但每层调用都要在调用栈保存现场：

- 时间复杂度仍为 `O(n)`；
- 额外栈空间为 `O(n)`；
- 极长链表可能导致栈溢出。

考试若要求 `O(1)` 额外空间，通常应写三指针迭代版。

### 6.3.6 静态链表只是把指针换成游标

将 `Node*` 换成数组下标，算法骨架完全不变：

```cpp:line-numbers [reverse-cursor-list.cpp]
struct Slot {
    long long value{};
    int next = -1;
};

int reverse_cursor_list(std::vector<Slot>& slots, int head) {
    int prev = -1;
    int curr = head;

    while (curr != -1) {
        int next = slots[curr].next;
        slots[curr].next = prev;
        prev = curr;
        curr = next;
    }

    return prev;
}
```

对应关系非常直接：

| 指针链表 | 静态链表 |
| --- | --- |
| `nullptr` | `-1` 或约定的空游标 |
| `Node* curr` | `int curr` |
| `curr->next` | `slots[curr].next` |
| `head = prev` | `head = prev` |

所以，如果你已经能用 `next[]` 写出静态链表反转，迁移到指针链表时真正新增的负担主要是节点生命周期，而不是算法本身。

### 6.3.7 交换值和交换节点为什么可能不等价

只把每个节点的 `value` 交换成逆序，也能打印出反转后的数值序列。但当节点本身具有身份时，结果就不同了。

假设外部保存着 `Node* selected`，它指向任务编号 42 的节点。真正重连节点后，这个指针仍指向同一个任务，只是任务在序列中的位置改变；如果只交换 `value`，该地址里的内容却变成了另一项任务。

以下场景尤其要区分两种操作：

- 外部持有节点指针、引用或迭代器；
- 节点包含不能随意交换的资源、锁或所有权信息；
- 题目明确要求修改链接，不允许只交换数据域；
- 相同数值的多个节点仍然需要保持各自身份。

::: complexity 单链表反转
三指针迭代恰好访问每个节点一次，时间复杂度为 `O(n)`，额外空间为 `O(1)`。这里的“原地”指复用原节点并改写链接，不是把值复制到辅助数组再倒序写回。
:::

可以用 [Lab 01-E-04：单链表逆置](../../labs/chapter-01/exercise/E-01-04-singly-linked-list-reverse/README.md) 和 [Lab 01-E-14：静态链表逆置](../../labs/chapter-01/exercise/E-01-14-static-linked-list-reverse/README.md) 做一次逐行对照。

## 6.4 链表到底能不能使用 `reverse` 和 STL

“链表是结构体实现的，所以结构体能不能使用 STL？”这个问题把三个层次揉在了一起。更准确的提问方式是：

1. 这组元素能否表示为一个可遍历区间？
2. 迭代器能向哪些方向移动？
3. 元素是否支持算法要求的读取、交换、移动或比较？

STL 算法通常不关心容器内部是不是 `struct`，它关心的是迭代器所承诺的能力。

### 6.4.1 迭代器能力是一张通行证

| 迭代器能力 | 能做什么 | 典型容器 |
| --- | --- | --- |
| 前向迭代 | 反复从前向后推进 | `std::forward_list` |
| 双向迭代 | 既能 `++it`，也能 `--it` | `std::list` |
| 随机访问 | 支持 `it + k`、距离和下标式跳转 | `std::vector`、`std::array` |

算法要求的能力越强，可接受的容器越少：

| 操作 | 最关键的迭代能力 | `vector` | `list` | `forward_list` |
| --- | --- | --- | --- | --- |
| `std::find` | 单向读取并推进 | 可以 | 可以 | 可以 |
| `std::reverse` | 双向迭代 + 元素可交换 | 可以 | 可以 | 不可以 |
| `std::sort` | 随机访问 | 可以 | 不可以 | 不可以 |
| 容器成员 `sort()` | 由容器自行实现 | 无此成员 | 可以 | 可以 |
| 容器成员 `reverse()` | 由容器自行实现 | 无此成员 | 可以 | 可以 |

`std::lower_bound` 还有一个很适合考试辨析的细节：它可以接受前向迭代器，但在非随机访问迭代器上，比较次数可以保持对数级，迭代器推进次数却可能是线性的。接口“能调用”不等于底层结构重新拥有随机访问能力。

### 6.4.2 `std::reverse(list.begin(), list.end())` 能编译，但语义不同

```cpp [list-reverse-options.cpp]
std::list<int> values{1, 2, 3, 4};

std::reverse(values.begin(), values.end());  // 对迭代器引用的元素做 iter_swap
values.reverse();                            // 使用 list 专门提供的操作
```

C++ 标准为 `std::reverse` 规定了双向迭代器，并对成对迭代器应用 `iter_swap`。所以 `std::list` 的双向迭代器满足移动要求时，可以调用通用算法；它完成的是对迭代器所引用元素的交换。

`std::list::reverse()` 则是容器专门操作。标准保证它反转元素顺序，并且不影响已有迭代器和引用的有效性。标准不规定 `list` 的内部节点布局，但节点式实现可以通过调整内部链接完成操作，也不需要把元素对象两两交换。

当元素交换昂贵、不可交换，或者你关心节点/迭代器身份时，成员函数表达得更准确。

### 6.4.3 单链表为什么不能交给 `std::reverse`

`std::forward_list` 的迭代器只能向前移动，没有 `--it`。通用 `std::reverse` 需要从区间两端向中间配对，因此不能接受它。

但这不代表单链表不能反转：

```cpp [forward-list-reverse.cpp]
std::forward_list<int> values{1, 2, 3, 4};
values.reverse();
```

容器知道自己的链式结构，可以提供不依赖双向迭代器的专门成员函数。这恰好说明：

> 通用算法只能使用迭代器公开的能力，容器成员函数可以利用容器内部掌握的结构信息。

### 6.4.4 裸 `Node*` 为什么不是现成的 STL 区间

如果节点由多次 `new` 分散分配，`Node* head` 只是一个节点地址。对它执行 `++head` 是指针算术，尝试走向物理相邻的 `Node` 对象，并不会执行 `head = head->next`。

要让自定义链表接入基于迭代器的算法，需要提供迭代器类型，使 `++it` 内部沿 `next` 移动，并让 `*it` 返回数据元素。单链表最多自然提供前向迭代能力；想支持双向迭代，节点和迭代器还必须能找到前驱。

反过来，一个普通结构体完全可以作为 STL 容器的元素：

```cpp [struct-in-stl.cpp]
struct Student {
    int id{};
    int score{};
};

std::vector<Student> students;
std::sort(students.begin(), students.end(),
          [](const Student& left, const Student& right) {
              return left.score > right.score;
          });
```

这里能否排序，取决于 `vector` 提供的随机访问迭代器和比较操作，而不是 `Student` 使用了 `struct` 关键字。

::: pitfall 不要直接交换链表内部节点对象
若一个自定义 `Node` 同时保存 `value` 和 `next`，直接对两个活跃节点执行 `std::swap(*a, *b)` 会连同 `next` 一起交换，可能制造自环、断链或重复可达。容器的迭代器通常应暴露业务元素，而不是允许通用算法随意交换内部链接字段。
:::

## 6.5 题型迁移工坊

下面不把链表代码当作孤立模板，而是始终追问五件事：数组版用了什么能力，链表用什么替代，循环维护什么，哪里可能断链，复杂度怎样变化。

### 6.5.1 删除倒数第 (k) 个：从 `n-k` 到固定距离

数组版通常先得到长度 `n`，目标下标是 `n - k`，删除后再搬移后缀。这里偷偷使用了“已知长度 + 下标定位”。

单链表可以先遍历求长度再定位，但快慢指针能把两个阶段合并成一次向前扫描：

```cpp:line-numbers [remove-nth-from-end.cpp]
Node* remove_nth_from_end(Node* head, std::size_t k) {
    Node dummy{0, head};
    Node* fast = &dummy;
    Node* slow = &dummy;

    for (std::size_t step = 0; step < k; ++step) {
        fast = fast->next;  // 前置条件：1 <= k <= 链表长度
    }

    while (fast->next != nullptr) {
        fast = fast->next;
        slow = slow->next;
    }

    Node* target = slow->next;
    slow->next = target->next;
    delete target;
    return dummy.next;
}
```

数组中的 `n - k` 被替换为“`fast` 始终领先 `slow` (k) 条边”。当 `fast` 到达尾节点时，`slow` 恰好位于目标节点的前驱。

哨兵让“删除头节点”也变成普通的“删除 `slow->next`”。风险主要有两个：没有验证 `k` 导致空指针解引用；删除后继续使用 `target` 导致悬空访问。

时间复杂度为 `O(n)`，额外空间为 `O(1)`，对应练习是 [Lab 01-E-05：删除单链表倒数第 k 个节点](../../labs/chapter-01/exercise/E-01-05-singly-linked-list-remove-nth/README.md)。

### 6.5.2 合并两个有序序列：从输出数组到尾游标

数组版常用两个下标 `i/j` 比较，再把较小值写入第三个数组。链表版仍然保留“双游标比较”，只是输出动作从“复制值”变成“把已有节点接到结果尾部”：

```cpp:line-numbers [merge-sorted-lists.cpp]
Node* merge_sorted_lists(Node* left, Node* right) {
    Node dummy{0, nullptr};
    Node* tail = &dummy;

    while (left != nullptr && right != nullptr) {
        if (left->value <= right->value) {
            tail->next = left;
            left = left->next;
        } else {
            tail->next = right;
            right = right->next;
        }
        tail = tail->next;
    }

    tail->next = left != nullptr ? left : right;
    return dummy.next;
}
```

循环不变量是：`dummy.next ... tail` 已经包含两个输入链表中所有确定更小的节点，并保持有序；`left` 和 `right` 分别指向两个未处理后缀的最小节点。

当使用 `<=` 选择左链节点时，相等元素保持左链优先，合并是稳定的。该写法复用原节点，额外空间为 `O(1)`，但也转移了两条输入链的结构所有权：合并后不能再把原来的 `left/right` 当作两条独立链表管理和释放。

对应练习是 [Lab 01-E-06：合并两个有序单链表](../../labs/chapter-01/exercise/E-01-06-singly-linked-list-merge/README.md)。再把 `Node*` 换成游标，就得到 [Lab 01-E-15：静态链表合并两个有序表](../../labs/chapter-01/exercise/E-01-15-static-linked-list-merge/README.md)。

### 6.5.3 回文判断：先问能不能从右向左走

数组回文的经典写法是 `left++`、`right--`。迁移时，决定方案的不是“它叫回文题”，而是链表能否找到前驱。

- 双向链表：`head` 和 `tail` 可以像左右下标一样向中间走，对应 [Lab 01-E-07：双链表回文判断](../../labs/chapter-01/exercise/E-01-07-doubly-linked-list-palindrome/README.md)；
- 单链表：无法由尾节点后退，需要“快慢指针找中点 + 反转后半段 + 同向比较”；
- 允许额外空间：可以把值压入栈或数组，但这绕开了原地链表训练。

单链表原地方案的核心形状如下：

```cpp:line-numbers [singly-list-palindrome.cpp]
bool is_palindrome(Node* head) {
    if (head == nullptr || head->next == nullptr) return true;

    Node* slow = head;
    Node* fast = head;
    while (fast->next != nullptr && fast->next->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }

    Node* second_half = reverse_list(slow->next);
    Node* right = second_half;
    Node* left = head;
    bool equal = true;

    while (right != nullptr) {
        if (left->value != right->value) {
            equal = false;
            break;
        }
        left = left->next;
        right = right->next;
    }

    slow->next = reverse_list(second_half);  // 恢复输入结构
    return equal;
}
```

这里的迁移不是把 `right--` 翻译成某一行，而是通过反转后半段，把“从右向左”改造成“两条链同时向右”。如果调用者期望查询操作不改变链表，比较结束后还必须恢复结构。

时间复杂度为 `O(n)`，额外空间为 `O(1)`。最容易漏掉的是奇偶长度的中点边界，以及提前发现不相等后忘记恢复后半段。

### 6.5.4 两两交换：输出相同不代表结构相同

数组版可以直接 `swap(a[0], a[1])`、`swap(a[2], a[3])`。如果链表题要求“交换节点而不是交换值”，就要修改三段邻接关系。

单链表使用哨兵后的局部结构是：

```text
prev → first → second → next_pair
```

目标结构是：

```text
prev → second → first → next_pair
```

对应代码：

```cpp:line-numbers [swap-pairs.cpp]
Node* swap_pairs(Node* head) {
    Node dummy{0, head};
    Node* prev = &dummy;

    while (prev->next != nullptr && prev->next->next != nullptr) {
        Node* first = prev->next;
        Node* second = first->next;
        Node* next_pair = second->next;

        first->next = next_pair;
        second->next = first;
        prev->next = second;

        prev = first;
    }

    return dummy.next;
}
```

`next_pair` 必须在覆盖链接前保存。每轮结束后，`prev` 指向已经交换完成部分的最后一个节点，也就是原来的 `first`。

双向链表还要同步维护 `prev` 字段，检查 `x->next->prev == x` 与 `x->prev->next == x`。只验证正向输出可能发现不了反向链接损坏。对应练习是 [Lab 01-E-09：双链表相邻节点交换](../../labs/chapter-01/exercise/E-01-09-doubly-linked-list-swap-pairs/README.md)。

### 6.5.5 约瑟夫环：把取模循环变成真实的环

数组模拟约瑟夫问题常见两种方式：维护 `alive[]` 跳过已删除位置，或在动态数组中反复 `erase`。它们用取模把尾部重新映射到头部。

循环链表直接把尾节点的 `next` 指向 `head`：

```text
        ┌────────────────────────┐
        ▼                        │
head → [1] → [2] → [3] → [4] ──┘
```

删除当前节点时必须同时持有前驱：

```cpp [circular-delete-fragment.cpp]
prev->next = curr->next;
Node* target = curr;
curr = curr->next;
delete target;
```

这里的终止条件不能再写 `curr != nullptr`，因为合法循环链表永远不会走到空指针。通常需要维护剩余节点数，或者记住起点并判断是否绕行一周。

若需要输出完整淘汰顺序，每次报数仍需沿链走过相应节点；链表优化的是删除本身，不会让“数 (m) 步”消失。对应练习是 [Lab 01-E-10：约瑟夫环](../../labs/chapter-01/exercise/E-01-10-josephus-problem/README.md)。继续练习 [循环链表拆分](../../labs/chapter-01/exercise/E-01-11-circular-linked-list-split/README.md) 和 [删除指定值](../../labs/chapter-01/exercise/E-01-12-circular-linked-list-delete-value/README.md) 时，要把“走一整圈”的终止不变量写在代码旁边。

### 6.5.6 静态链表：最适合做迁移桥梁

静态链表把内存管理暂时拿掉，只留下“逻辑顺序由链接决定”这一核心。适合按下面顺序训练：

1. 用 `slots[] + next` 完成有序插入；
2. 用 `prev/curr/next` 游标完成逆置；
3. 用 `pa/pb/tail` 游标完成有序合并；
4. 最后把 `int` 游标替换成 `Node*`，补上 `new/delete` 和所有权约束。

对应练习分别是 [Lab 01-E-13：静态链表有序插入](../../labs/chapter-01/exercise/E-01-13-static-linked-list-insert/README.md)、[Lab 01-E-14：静态链表逆置](../../labs/chapter-01/exercise/E-01-14-static-linked-list-reverse/README.md) 和 [Lab 01-E-15：静态链表合并两个有序表](../../labs/chapter-01/exercise/E-01-15-static-linked-list-merge/README.md)。

静态链表合并两个独立节点池时还有一个数组特有的问题：如果把第二个池复制到第一个池后面，第二个池中的所有有效游标都要加上偏移量。这个步骤是在重定位物理槽位，不是算法上的有序合并。

### 6.5.7 有序去重：数组写指针和链表前驱其实很像

有序数组原地去重常用 `slow/fast`：`fast` 负责读，`slow` 负责写入下一个不同值。链表版本不需要把保留元素向前覆盖，而是让当前保留节点跳过重复节点：

```cpp:line-numbers [deduplicate-sorted-list.cpp]
void deduplicate_sorted_list(Node* head) {
    Node* curr = head;

    while (curr != nullptr && curr->next != nullptr) {
        if (curr->value != curr->next->value) {
            curr = curr->next;
            continue;
        }

        Node* duplicate = curr->next;
        curr->next = duplicate->next;
        delete duplicate;
    }
}
```

数组版的不变量是“`[0, slow]` 已经压缩为无重复前缀”，链表版则是“从 `head` 到 `curr` 已经无重复，`curr->next` 是下一个待判断节点”。同一个双指针思想仍然存在，只是“写入位置”变成了“保留节点的链接出口”。

## 6.6 迁移后会长出新的链表题型

数组经验不是链表学习的终点。掌握游标与链接后，还会出现一些更依赖节点关系的模型。

### 6.6.1 快慢指针不是固定模板，而是距离不变量

快慢指针至少有三种不同含义：

- 固定间隔：删除倒数第 (k) 个节点；
- 速度比为 2:1：找中点或检测环；
- 两条路径重新对齐：寻找两链表交点。

真正可迁移的是“两个游标之间保持什么关系”，不是变量必须叫 `fast` 和 `slow`。

### 6.6.2 哨兵不是多余节点，而是边界统一器

头插、删头、两两交换第一对时，真正麻烦的是“第一个有效节点没有普通前驱”。dummy head 人为提供一个稳定前驱，使所有局部操作都能写成：

```text
找到前驱 → 保存目标/后继 → 重连 → 更新外壳状态
```

哨兵是否参与业务序列、是否需要释放、空表如何表示，都必须提前约定。更多演进过程见[链表与演进设计](./03-linked-list.md#33-哨兵节点的边界革命)。

### 6.6.3 链表归并排序比下标式快速排序更自然

链表找中点可以用快慢指针，合并两个有序链表只需改链，因此归并排序能在 `O(n log n)` 时间内完成，并保持稳定。快速排序常依赖区间下标和双向扫描，移植到单链表后分区与边界管理更别扭，也不具备数组上的缓存优势。

选择排序方法时，应该重新观察表示能力，而不是把数组时代最熟悉的算法强行搬过来。

### 6.6.4 节点身份可以成为算法资源

链表节点地址稳定时，可以把节点迭代器保存到哈希表中，组合出 [LRU 缓存](./04-comparison-and-selection.md#组合例题lru-为什么需要两种结构)：哈希表负责按键定位，双向链表负责 `O(1)` 摘链和接链。

这类组合提醒我们，数据结构题不是“数组与链表二选一”。当一种结构缺少某项能力时，可以用索引结构补定位，用链式结构补局部修改。

## 6.7 哪些数组算法不应该强行迁移

好的迁移能力也包括知道什么时候停手。

### 6.7.1 二分查找失去随机访问优势

有序数组可以在 `O(1)` 时间访问中点，所以每轮把搜索区间缩小一半，总时间为 `O(log n)`。

单链表即使知道逻辑中点位置，也要从某个入口走过去。反复寻找中点会把移动成本重新加回来。标准库的 `lower_bound` 可以接受前向迭代器，但在链表上迭代器推进仍可能是线性的。

如果核心需求是高频二分定位，应保留连续数组，或换成平衡搜索树、跳表等真正提供分层索引的结构。

### 6.7.2 堆依赖下标公式

数组堆用 `2i+1`、`2i+2` 和 `(i-1)/2` 在父子之间常数时间跳转。普通链表只有线性前驱后继关系，不能保留这些跳转能力。

把堆“改成链表”实际上是在重新设计一棵带父子指针的树，已经不是顺序表到链表的简单迁移。

### 6.7.3 前缀和与频繁区间查询需要位置索引

前缀和依赖 `prefix[r] - prefix[l-1]`，核心是按位置随机读取两个累计值。单链表保存前缀值并不会自动支持按下标 `O(1)` 取值。

若还要动态修改和区间查询，更合适的方向通常是树状数组、线段树或其他带索引的增强结构。

### 6.7.4 有些滑动窗口可以迁移，但理由不同

如果窗口的左右端点只单调向前移动，单链表的两个游标也能完成线性扫描；如果算法频繁读取窗口中的任意下标、从尾端回退或依赖连续内存统计，就需要额外结构。

所以判断标准不是“它用了双指针”，而是每个指针究竟需要怎样移动、访问哪些位置。

::: counterexample 输出一样，训练目标不同
题目要求原地反转链表，你把值复制进 `vector`、调用 `reverse` 再输出，可能通过只检查输出的测试，却没有满足 `O(1)` 额外空间和修改链接的表示约束。考试中的数据结构要求也是题目契约的一部分，不能被最终输出掩盖。
:::

## 6.8 考试时怎样把数组答案改写成链表答案

考场上不需要临时发明一套理论，可以固定执行下面的流程。

### 第一步：圈出表示约束

特别留意这些词：

- 必须使用单链表、双链表、循环链表或静态链表；
- 不允许辅助数组或新建等长链表；
- 原地修改；
- 给出头指针、目标节点、前驱指针还是下标；
- 是否要求保持节点身份、稳定性或原链表结构。

如果题目没有强制链表，还要先完成[比较与权衡](./04-comparison-and-selection.md)中的选型，而不是默认“链表更像数据结构题”。

### 第二步：画局部图，不要只在脑中转指针

只画当前操作涉及的四类角色：

```text
已处理部分 → 前驱 → 当前节点 → 后继/未处理部分
```

两两交换就画 `prev/first/second/next_pair`，删除就画 `prev/target/next`。名字越能表达角色，越不容易在连续赋值中迷路。

### 第三步：先写一句循环不变量

例如：

- 反转：`prev` 是已反转前缀头，`curr` 是未处理后缀头；
- 合并：`tail` 之前已经有序，两个输入游标仍指向各自剩余最小值；
- 删除倒数节点：`fast` 始终比 `slow` 领先 (k) 条边；
- 去重：到 `curr` 为止已经无重复。

如果说不清每轮开始时什么必须成立，代码通常也还没有想清楚。

### 第四步：按“保存、重连、推进”写更新

```text
保存仍需访问的节点
        ↓
修改当前局部链接
        ↓
更新 head/tail/size 等外壳状态
        ↓
推进游标进入下一轮
```

删除操作还要决定释放时机；释放后不得再读取目标节点。

### 第五步：用结构边界自测

至少检查：

- 空表；
- 单节点；
- 两节点；
- 奇数和偶数长度；
- 操作发生在头部、中间、尾部；
- 删除唯一节点后变为空表；
- 循环链表完成一整圈而不是无限循环；
- 双向链表正向和反向都能回到一致序列。

### 第六步：把复杂度写完整

不要只写“改了三条链接，所以 `O(1)`”。要说明输入如何定位到这些节点：

```text
总时间 = 定位 + 遍历/比较 + 局部改链
额外空间 = 游标 + 递归栈 + 新节点/辅助容器
```

## 6.9 一张迁移复盘卡

每做完一道题，可以填写下面这张表：

| 复盘问题 | 你的答案 |
| --- | --- |
| 题目的序列语义是什么？ | 例如反转、删除、合并、分割 |
| 数组解法依赖了哪些能力？ | 下标、长度、双端访问、区间搬移、额外数组 |
| 链表中用哪些角色替代？ | `prev/curr/next`、`fast/slow`、`dummy/tail` |
| 每轮循环的不变量是什么？ | 用一句完整的话描述 |
| 覆盖链接前必须保存什么？ | 后继、下一组、旧头尾等 |
| 节点值和节点身份是否等价？ | 是否允许只交换数据域 |
| 定位成本是多少？ | 已知节点还是从头遍历 |
| 修改成本是多少？ | 改几条链接，是否分配或释放 |
| 哪个最小样例最容易打破代码？ | 空表、单节点、头删、尾删、成环等 |
| 操作后要检查哪些结构不变量？ | 尾空指针、双向互反、环入口、`size_` |

## 分层训练路线

建议不要一次把所有链表题刷完，而是做“一题多表示”的纵向对照：

1. **基础改链**：[单链表逆置](../../labs/chapter-01/exercise/E-01-04-singly-linked-list-reverse/README.md)与[静态链表逆置](../../labs/chapter-01/exercise/E-01-14-static-linked-list-reverse/README.md)逐行互译。
2. **距离不变量**：[删除倒数第 k 个节点](../../labs/chapter-01/exercise/E-01-05-singly-linked-list-remove-nth/README.md)，分别写“求长度两遍扫描”和“快慢指针一遍扫描”。
3. **尾游标建链**：[合并有序单链表](../../labs/chapter-01/exercise/E-01-06-singly-linked-list-merge/README.md)，再迁移到[静态链表合并](../../labs/chapter-01/exercise/E-01-15-static-linked-list-merge/README.md)。
4. **双端能力重建**：[双链表回文](../../labs/chapter-01/exercise/E-01-07-doubly-linked-list-palindrome/README.md)，再自行补写单链表“中点 + 反转 + 恢复”版本。
5. **局部结构重写**：[双链表相邻节点交换](../../labs/chapter-01/exercise/E-01-09-doubly-linked-list-swap-pairs/README.md)，同时验证正反两个方向。
6. **终止条件迁移**：[约瑟夫环](../../labs/chapter-01/exercise/E-01-10-josephus-problem/README.md)、[循环链表拆分](../../labs/chapter-01/exercise/E-01-11-circular-linked-list-split/README.md)和[循环链表删除指定值](../../labs/chapter-01/exercise/E-01-12-circular-linked-list-delete-value/README.md)。

每道题至少保留三份思考记录：数组版靠什么完成，链表版维护什么不变量，为什么这个题值得或不值得迁移。这样练到最后，真正留下的不是若干模板，而是一种表示变化后重新建模的能力。

## 小结与自测

数组和链表都能表达线性序列，但算法真正使用的是表示提供的能力：

- 数组用连续空间换来随机访问，很多技巧围绕下标和区间展开；
- 链表用显式链接表达邻接，很多技巧围绕游标、前驱和节点身份展开；
- 数组双指针可以迁移为链表双游标，但必须重新定义二者的距离或相遇关系；
- 元素搬移通常变成链接重连，定位成本却可能从 `O(1)` 变为 `O(n)`；
- `struct` 不是 STL 的障碍，range、迭代器能力和元素操作要求才是判断依据；
- 真正成熟的迁移，不只是知道怎样改写，也知道什么时候不该改写。

请尝试不看代码回答：

1. 为什么 `std::reverse` 可以用于 `std::list`，却不能用于 `std::forward_list`？
2. `std::list::reverse()` 和 `std::reverse(list.begin(), list.end())` 在可依赖的语义上有什么区别？
3. 单链表反转时，`prev` 和 `curr` 分别代表哪两部分？
4. 删除倒数第 (k) 个节点时，快慢指针保持的距离不变量是什么？
5. 为什么“交换节点值”不总能代替“交换节点位置”？
6. 静态链表使用数组，为什么按逻辑位序访问仍然是 `O(n)`？
7. 二分查找和数组堆为什么不适合直接迁移到普通链表？

::: details 查看自测答案
1. 通用 `std::reverse` 要求双向迭代能力；`list` 迭代器可前后移动，`forward_list` 只能向前。
2. 通用算法对迭代器引用的元素应用交换；成员函数直接保证容器内元素顺序反转，并保持迭代器和引用有效，且可利用容器自身结构。
3. `prev` 指向已经反转的原前缀，`curr` 指向尚未处理的原后缀。
4. `fast` 始终领先 `slow` (k) 条边；当 `fast` 到尾节点时，`slow` 位于待删节点前驱。
5. 外部引用、节点资源和相同值节点的身份不会随“值交换”按相同方式移动。
6. 数组下标表示物理槽位，逻辑第 (i) 个节点仍需沿 `next` 游标走过前 (i) 个节点。
7. 二分依赖常数时间访问中点，数组堆依赖父子下标公式；普通链表不提供这些跳转能力。
:::

## 参考与延伸

- [C++ 工作草案：`reverse` 算法](https://eel.is/c++draft/alg.reverse)，规定双向迭代器要求和 `iter_swap` 效果。
- [C++ 工作草案：`std::list` operations](https://eel.is/c++draft/list.ops)，包含 `reverse`、`sort`、`merge` 与迭代器有效性保证。
- [C++ 工作草案：`std::forward_list` operations](https://eel.is/c++draft/forward.list.ops)，包含单向链表的成员 `reverse` 与 `sort`。
- [1.3 第二种实现——链表与演进设计](./03-linked-list.md)，复习哨兵、双向链表和结构不变量。
- [1.4 比较与权衡](./04-comparison-and-selection.md)，复习定位成本、缓存局部性和容器选型。
- [1.5 现实中的 List 与工程扩展](./05-real-world-practices.md)，继续理解标准库、静态链表和组合结构。
