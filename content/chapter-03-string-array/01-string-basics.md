---
title: "3.1 字符串的定义、存储与编码"
description: "串的定义、ADT 与最小操作子集，字符编码，三种存储表示及其操作代价，以及文本编辑中的应用。"
order: 1
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-15"
contributors: ["Qing"]
status: "draft"
---

# 3.1 字符串的定义、存储与编码

计算机上的非数值处理对象，很多是以字符串为单位的：源程序与目标程序、顾客的姓名地址、货物的名称与规格、信息检索系统的关键词、文本编辑的内容，都是字符串。可计算机硬件天生是为数值计算设计的，于是串的存储和操作都得单独想办法。不同应用中串的特点差别很大——长度是否固定、拼接是否频繁、要不要随机访问、是不是流式输入——只有按实际情况选对存储结构，串处理才高效。这一节先把串的基本概念与抽象数据类型定下来，再说字符在计算机里怎么编码，最后讲三种存储表示。

## 学习目标

- 区分空串、空格串、子串、主串、位置等术语，理解空串与空格串的差别；
- 理解串的抽象数据类型（ADT String）与最小操作子集，能由最小子集组合出其他操作；
- 说明字符、字符集与编码的关系（ASCII、UTF-8、GBK），理解"串长不等于字节数"；
- 比较三种存储表示（定长顺序、堆分配、块链）的分配方式、操作代价与适用场景；
- 实现求长、取子串、定位、拼接等基本操作并分析复杂度；
- 通过文本编辑的例子理解"以串的整体为操作对象"的实际意义。

## 串的定义与基本术语

**串（string，或字符串）** 是零个或多个字符组成的有限序列，一般记为

$$
S = \text{"}a_0a_1\cdots a_{n-1}\text{"} \quad (n \ge 0)
$$

其中 $S$ 是串名，引号括起来的字符序列是串的值，$a_i$ 可以是字母、数字或其他字符；串中字符的个数 $n$ 称为**串长**。零个字符的串称为**空串**（null string），长度为 0，本文用 $\varnothing$ 表示。

**空格串**（blank string）是由一个或多个空格组成的串，如 `" "`，其长度就是空格字符的个数。注意它不是空串。<span id="rev-3-1-blank" class="course-review-target"></span>

::: tip 空串与空格串
`""` 是空串，长度为 0；`" "` 是空格串，长度至少为 1。判断"串是否为空"用的是空串，不是空格串。
:::

串中任意个**连续**字符组成的子序列称为该串的**子串**，包含子串的串称为**主串**。<span id="rev-3-1-substr" class="course-review-target"></span>

字符在串中的序号称为该字符在串中的**位置**；子串在主串中的位置以子串第一个字符在主串中的位置表示。<span id="rev-3-1-pos" class="course-review-target"></span>例如：

| 串 | 长度 | 说明 |
| --- | --- | --- |
| `"data"` | 4 | 是 `"datastructure"` 的子串，位置 1 |
| `"structure"` | 9 | 是 `"datastructure"` 的子串，位置 5 |
| `"datastructure"` | 13 | 主串 |

两个串**相等**，当且仅当它们的长度相等且各个对应位置的字符都相同。<span id="rev-3-1-equal" class="course-review-target"></span>串值必须用引号括起来以区别于变量名或数值常量，例如 `x = '123'` 表示把字符序列 `123` 赋给串变量 `x`；引号本身不属于串值。

<QuizSet block="terms" />

## 串的逻辑结构：数据对象受限的线性表

串的逻辑结构和线性表极为相似，区别仅在于串的数据对象被约束为字符集。<span id="rev-3-1-char-set" class="course-review-target"></span>真正的差别体现在基本操作上：线性表大多以**单个元素**为操作对象（查找某个元素、求取某个元素、在某个位置插入/删除一个元素），而串通常以**串的整体**为操作对象（查找子串、求取子串、插入/删除子串、替换子串）。<span id="rev-3-1-op-object" class="course-review-target"></span>

| 对比维度 | 线性表 | 串 |
| --- | --- | --- |
| 数据对象 | 任意同类元素 | 字符 |
| 典型操作对象 | 单个元素 | 串（子串）的整体 |
| 典型操作 | 按位查找、插入、删除元素 | 子串查找、截取、拼接、替换 |

这一差别决定了串的存储设计重点：不仅要能随机存取字符，更要让"取一段、拼一段、找一段"这类整体操作高效。

## 串的抽象数据类型

串的抽象数据类型可以形式化地定义如下：

```text
ADT String {
    数据对象: D = { ai | ai ∈ CharacterSet, i = 1, 2, …, n, n ≥ 0 }
    数据关系: R = { <a(i-1), ai> | a(i-1), ai ∈ D, i = 2, …, n }
}
```

基本操作集（13 种）：

| 操作 | 功能 |
| --- | --- |
| `StrAssign(&T, chars)` | 生成一个值等于字符常量 `chars` 的串 T |
| `StrCopy(&T, S)` | 由串 S 复制得串 T |
| `StrEmpty(S)` | 若 S 为空串返回 TRUE，否则 FALSE |
| `StrCompare(S, T)` | 字典序比较：S>T 返回正值，相等返回 0，S<T 返回负值 |
| `StrLength(S)` | 返回串的长度 |
| `ClearString(&S)` | 将 S 清为空串 |
| `Concat(&T, S1, S2)` | 用 T 返回 S1 与 S2 联接而成的新串 |
| `SubString(&Sub, S, pos, len)` | 用 Sub 返回 S 中第 pos 个字符起长度为 len 的子串 |
| `Index(S, T, pos)` | 返回 T 在 S 中第 pos 个字符之后首次出现的位置，否则 0 |
| `Replace(&S, T, V)` | 用 V 替换 S 中出现的所有与 T 相等的不重叠子串 |
| `StrInsert(&S, pos, T)` | 在 S 的第 pos 个字符之前插入 T |
| `StrDelete(&S, pos, len)` | 从 S 中删除第 pos 个字符起长度为 len 的子串 |
| `DestroyString(&S)` | 销毁串 S |

其中 **StrAssign、StrCompare、StrLength、Concat、SubString 五种操作构成串类型的最小操作子集**：它们不可能利用其他串操作来实现；反之，除 ClearString 和 DestroyString 外，其余操作都可以在这个最小操作子集上实现。<span id="rev-3-1-min-subset" class="course-review-target"></span>例如定位函数 Index 可以利用判等、求串长和求子串来实现：

```cpp:line-numbers [index-adt.cpp]
// 在主串 S 的第 pos 个字符之后返回子串 T 首次出现的位置；找不到返回 0
int index_by_adt(const String& S, const String& T, int pos) {
    int n = str_length(S), m = str_length(T);
    int i = pos;
    while (i <= n - m + 1) {                 // 依次尝试每个可能的起点
        String sub = sub_string(S, i, m);    // 取长度与 T 相等的子串
        if (str_compare(sub, T) == 0) return i;
        ++i;
    }
    return 0;
}
```

这个实现每趟都要做一次 $O(m)$ 的子串复制与比较，最坏为 $O(n\cdot m)$，但逻辑清晰、只依赖最小操作子集。<span id="rev-3-1-adt-index" class="course-review-target"></span>下一篇文章会给出不依赖其他串操作的直接实现，并研究如何把它加速到 $O(n+m)$。

<QuizSet block="adt" />

## 字符、字符集与编码

**字符**是组成字符串的基本单位。C/C++ 中 `char` 通常占 1 字节（8 bits），用 **ASCII 码**对 128 个符号编码——这 128 个符号构成的集合就是**字符集（charset）**：数字、大小写字母、标点与控制字符各有一个 0～127 的编号。<span id="rev-3-1-char" class="course-review-target"></span>

**字符集**回答"系统里有哪些字符"，**编码**回答"每个字符用怎样的字节序列表示"。ASCII 是两者合一的单字节编码：一个字符恰好一字节。真实世界的字符远多于 128 个，于是出现了多字节编码：<span id="rev-3-1-utf8" class="course-review-target"></span>

| 编码 | 字节形态 | 特点 |
| --- | --- | --- |
| ASCII | 固定 1 字节 | 覆盖 128 个符号，单字节编码的基准 |
| UTF-8 | 变长 1～4 字节 | 兼容 ASCII；英文 1 字节、中文 3 字节，互联网事实标准 |
| GBK | 变长 1～2 字节 | 中文 Windows 常用；中文 2 字节 |

**乱码**的成因是"同一字节序列被不同编码解读"：一段 UTF-8 编码的中文按 GBK 打开时，字节被按错误的边界切开，于是显示成无法理解的内容。<span id="rev-3-1-mojibake" class="course-review-target"></span>

编码直接决定串的存储与长度问题：一个"字符"占几个字节、定长数组按字节还是按字符分配、取子串按什么计数，都跟编码绑定。

::: tip 串长不等于字节数
多字节编码下字符数与字节数不相等。取子串、截断等操作必须明确"按字符计数还是按字节计数"，否则可能从多字节字符中间切开，产生半个字符。
:::

## 串的存储表示

串有 3 种机内表示方法：**定长顺序存储、堆分配存储、块链存储**。它们分别对应不同的取舍。

### 定长顺序存储

与线性表的顺序存储结构类似，用一组地址连续的存储单元存放串值。先想一个问题：顺序表与顺序串在存储结构设计上有什么不同？顺序表往往预留**备用空间**，给插入新结点留扩充余地；而串的基本操作以"串的整体"为主，插入删除少，反而必须知道串的实际长度。于是串长成为存储时必须已知的一个参数，常见的表示方案有三种：

| 表示方式 | 做法 | 特点 |
| --- | --- | --- |
| 尾指针 | 用一个指针指示最后一个字符的位置 | 由首尾指针差求长 O(1) |
| 计数器 | 用独立变量或下标 0 的单元记录字符个数（如 PASCAL） | 求长 O(1)，操作方便 |
| 结束标记 | 串值末尾加 `'\0'` 等不计入长度的特殊字符（C 语言风格） | 长度隐含，需扫描求得 |

定长顺序结构按预定义大小 `MAXSTRLEN` 为每个串变量分配固定长度的存储区，本教程采用"计数器"方案（0 号单元存长度）：

```cpp:line-numbers [sstring.h]
#define MAXSTRLEN 255                    // 用户可在 255 以内定义最大串长
typedef unsigned char SString[MAXSTRLEN + 1];   // 0 号单元存放串的长度
```

这种布局的示意（串 `"abcd"`）：

```
下标:   0   1   2   3   4   5   6   ...
      [ 4 ] a   b   c   d   ?   ?
```

在这种结构下实现串操作，基本动作就是"字符序列的复制"。以串联接 Concat 为例，T = S1 + S2 的结果取决于两个串的长度之和与 `MAXSTRLEN` 的关系，可能出现三种情况：

1. $S1[0] + S2[0] \le \text{MAXSTRLEN}$：直接复制，结果正确，未截断；
2. $S1[0] < \text{MAXSTRLEN}$ 且 $S1[0] + S2[0] > \text{MAXSTRLEN}$：S2 的一部分被舍去，发生截断；
3. $S1[0] = \text{MAXSTRLEN}$：结果与 S1 相同，S2 完全没有拼上。

```cpp:line-numbers [concat-sstring.cpp]
// 用 T 返回 S1 与 S2 联接而成的新串；未截断返回 true，截断返回 false
bool concat(SString& T, const SString& S1, const SString& S2) {
    bool uncut;
    if (S1[0] + S2[0] <= MAXSTRLEN) {                  // 情况 1：未截断
        for (int i = 1; i <= S1[0]; ++i) T[i] = S1[i];
        for (int i = 1; i <= S2[0]; ++i) T[S1[0] + i] = S2[i];
        T[0] = S1[0] + S2[0];
        uncut = true;
    } else if (S1[0] < MAXSTRLEN) {                    // 情况 2：S2 被截断
        for (int i = 1; i <= S1[0]; ++i) T[i] = S1[i];
        for (int i = 1; i <= MAXSTRLEN - S1[0]; ++i) T[S1[0] + i] = S2[i];
        T[0] = MAXSTRLEN;
        uncut = false;
    } else {                                            // 情况 3：仅取 S1
        for (int i = 0; i <= S1[0]; ++i) T[i] = S1[i];
        uncut = false;
    }
    return uncut;
}
```

求子串 SubString 只需复制字符序列，但要先做参数合法性检查（`1 ≤ pos ≤ StrLength(S)` 且 `0 ≤ len ≤ StrLength(S) - pos + 1`）：

```cpp:line-numbers [substring-sstring.cpp]
// 用 Sub 返回 S 的第 pos 个字符起长度为 len 的子串；参数非法返回 false
bool sub_string(SString& Sub, const SString& S, int pos, int len) {
    if (pos < 1 || pos > S[0] || len < 0 || len > S[0] - pos + 1) return false;
    for (int i = 1; i <= len; ++i) Sub[i] = S[pos + i - 1];
    Sub[0] = len;
    return true;
}
```

**评价**：定长顺序存储访问任意字符是 O(1)，缓存友好，实现也简单；代价是最大长度在编译期就固定，超长只能按"截断或失败"的约定处理，拼接、插入都要整段搬移字符。<span id="rev-3-1-fixed-eval" class="course-review-target"></span>

::: warning 截断语义要在接口层约定
定长串的 concat、insert 超长时，是"截尾保留前缀"还是"返回失败"，不同实现做法不同。接口文档必须写清，否则调用方会拿到静默错误的数据。
:::

### 堆分配存储

堆分配存储仍以一组地址连续的存储单元存放串值，但空间是在程序执行过程中按串的实际长度**动态分配**的。C 语言中由 `malloc()`、`realloc()`、`free()` 管理：

```cpp:line-numbers [heap-string.h]
struct HString {
    char* ch = nullptr;    // 非空串时按串长分配存储区，空串为 nullptr
    int length = 0;        // 串长度
};
```

基于"字符序列复制"实现基本操作，每个新产生的串都按实际长度分配空间：

```cpp:line-numbers [heap-string-ops.cpp]
Status str_assign(HString& T, const char* chars) {     // 赋值
    free(T.ch);
    int n = 0;
    while (chars[n]) ++n;                              // 求 chars 长度
    if (!n) { T.ch = nullptr; T.length = 0; return OK; }
    T.ch = (char*)malloc(n * sizeof(char));
    if (!T.ch) return OVERFLOW;
    for (int i = 0; i < n; ++i) T.ch[i] = chars[i];
    T.length = n;
    return OK;
}

int str_compare(const HString& S, const HString& T) {  // 字典序比较
    for (int i = 0; i < S.length && i < T.length; ++i)
        if (S.ch[i] != T.ch[i]) return S.ch[i] - T.ch[i];
    return S.length - T.length;
}

Status concat(HString& T, const HString& S1, const HString& S2) {  // 拼接
    free(T.ch);                                        // 释放旧空间
    T.ch = (char*)malloc((S1.length + S2.length) * sizeof(char));
    if (!T.ch) return OVERFLOW;
    for (int i = 0; i < S1.length; ++i) T.ch[i] = S1.ch[i];
    for (int i = 0; i < S2.length; ++i) T.ch[S1.length + i] = S2.ch[i];
    T.length = S1.length + S2.length;
    return OK;
}

Status sub_string(HString& Sub, const HString& S, int pos, int len) {  // 取子串
    if (pos < 1 || pos > S.length || len < 0 || len > S.length - pos + 1) return ERROR;
    free(Sub.ch);
    if (!len) { Sub.ch = nullptr; Sub.length = 0; return OK; }   // 空子串
    Sub.ch = (char*)malloc(len * sizeof(char));
    if (!Sub.ch) return OVERFLOW;
    for (int i = 0; i < len; ++i) Sub.ch[i] = S.ch[pos - 1 + i];
    Sub.length = len;
    return OK;
}

Status str_insert(HString& S, int pos, const HString& T) {  // 插入
    if (pos < 1 || pos > S.length + 1) return ERROR;
    if (!T.length) return OK;
    S.ch = (char*)realloc(S.ch, (S.length + T.length) * sizeof(char));
    if (!S.ch) return OVERFLOW;
    for (int i = S.length - 1; i >= pos - 1; --i)      // 从后往前腾出位置
        S.ch[i + T.length] = S.ch[i];
    for (int i = 0; i < T.length; ++i) S.ch[pos - 1 + i] = T.ch[i];
    S.length += T.length;
    return OK;
}
```

::: tip 此堆非彼堆
这里的"堆"指内存管理中由 `malloc`/`free` 管理的动态内存区，与数据结构里的堆（一种树形结构）不是一回事。C 程序的内存布局里，栈由系统自动分配释放（函数参数、局部变量），空间小、连续；堆由开发人员申请和释放，空间大、可能有碎片，不释放时程序结束时由操作系统回收。堆分配串的"堆"就是后者——在运行时按串的实际长度申请内存。
:::

堆分配串的拼接复杂度是 $O(\text{len}(a) + \text{len}(b))$，插入是 $O(\text{len}(S) + \text{len}(T))$。**连续多次拼接会退化为平方复杂度**：<span id="rev-3-1-heap-concat" class="course-review-target"></span>

::: warning 循环逐字符拼接为什么是 O(k²)
若在循环里用 concat 逐字符追加，第 i 次拼接要重新分配并把前 i 个字符全部复制一遍，总代价为 $1 + 2 + \cdots + k = O(k^2)$。要写成 $O(k)$，应预先知道总长度一次分配到位，或使用带均摊增长机制的容器（如 `std::string`）。
:::

**评价**：堆分配串既有顺序存储访问方便的特点，又对串长没有任何限制，是串处理程序中最常用的方案；代价是每次拼接、截取都可能涉及内存分配与整体复制，频繁小操作时分配开销明显。<span id="rev-3-1-heap-eval" class="course-review-target"></span>

### 块链存储

与线性表的链式存储类似，串也可以用链表存储。串结构的特殊性在于每个数据元素是字符，于是出现"**结点大小**"问题：每个结点可以只存 1 个字符，也可以存多个字符。结点大小大于 1 时称为**块链**：

```cpp:line-numbers [block-string.h]
#define BLOCK_SIZE 4
struct BlockNode {                // 块结点
    char data[BLOCK_SIZE];
    BlockNode* next = nullptr;
};
struct Blstring {                 // 块链串
    BlockNode* head = nullptr;    // 头指针
    BlockNode* tail = nullptr;    // 尾指针：便于在串尾操作
    int length = 0;               // 当前串长
};
```

串 `"abcdefghi"` 用结点大小为 4 的块链存储示意（最后一块用不属于串字符集的 `#` 填充）：

```
head → | a b c d | → | e f g h | → | i # # # | ⋀
```

结点大小是空间与操作的权衡，可以用**存储密度**来衡量：

$$
\text{存储密度} = \frac{\text{串值所占的存储位}}{\text{实际分配的存储位}}
$$

- 结点大小为 1 时，每个字符配一个指针（例如 8 字节指针配 1 字节字符），存储密度低、空间浪费严重，但操作最简单；<span id="rev-3-1-block-size" class="course-review-target"></span>
- 结点大小大于 1 时存储密度提高，但最后一个结点不一定被占满，需要填充 `#` 之类的非串值字符；块内多字符也使得插入、删除字符时通常要在块间搬移字符，操作更复杂。<span id="rev-3-1-density" class="course-review-target"></span>

**评价**：访问第 i 个字符需要沿链接行走 $O(i)$，随机访问是三种表示中最差的；但串值的"整串搬移"（改指针即可）成本低，适合超长文本的批量与流式处理。<span id="rev-3-1-block-eval" class="course-review-target"></span>

### 三种存储方式对比

| 维度 | 定长顺序 | 堆分配 | 块链 |
| --- | --- | --- | --- |
| 存储分配 | 编译期固定 | 运行时按需 | 按块分配 |
| 最大长度 | 有上限，可能截断 | 无固定上限 | 无固定上限 |
| 随机访问第 i 个字符 | O(1) | O(1) | O(i) |
| 拼接 | O(n)，可能截断 | O(n)，重新分配 | O(块数)，不截断 |
| 空间开销 | 无指针开销 | 无指针开销 | 指针 + 块内填充 |
| 适用场景 | 长度已知、频繁随机访问 | 通用，拼接/比较为主 | 超长文本、流式批量处理 |

<QuizSet block="storage" />

## 基本操作复杂度汇总

| 操作 | 行为约定 | 复杂度（堆分配） |
| --- | --- | --- |
| `length(s)` | 返回串长 | O(1) |
| `substr(s, pos, len)` | 越界失败 | O(len) |
| `concat(a, b)` | 返回 a + b | O(len(a) + len(b)) |
| `index(s, t)` | 返回 t 首次出现位置；无则约定值 | 最坏 $O(n\cdot m)$（见 3.2） |
| `compare(a, b)` | 字典序比较 | $O(\min(\text{len}(a), \text{len}(b)))$ |
| `insert(s, pos, t)` | 越界失败 | O(len(s) + len(t)) |
| `replace(s, t, v)` | 替换全部不重叠 t | 与 index 次数相关，最坏平方级 |

::: tip 复杂度里的 len 指什么
`substr(s, pos, len)` 就是把从 `pos` 起的 `len` 个字符复制出来，工作量只取决于所取子串的长度，所以是 O(len)；`concat` 需要复制两个串的全部字符，所以是 O(len(a) + len(b))。
:::

::: warning 串比较不是长度比较
`"ab" < "abc"`，因为短串是长串的前缀时短串更小；`"abc" < "abd"`，因为第一个不同字符 `c < d`。比较必须逐字符按字典序进行，而不是先比长度。<span id="rev-3-1-compare-warning" class="course-review-target"></span>
:::

## 应用举例：文本编辑中的串

文本编辑的实质是修改字符数据的形式或格式，基本操作是串的查找、插入和删除。可以把整个文本看成一个**文本串**，用换页符、换行符划分为若干页与行——页是文本串的子串，行是页的子串。进入编辑时，程序为文本串建立**页表**和**行表**（各子串的存储映像）：页表记录页号与该页起始行号，行表记录每行的行号、起始地址和长度。例如某文本串只占一页，其行表如下：

| 行号 | 起始地址 | 长度 |
| --- | --- | --- |
| 100 | 201 | 8 |
| 101 | 209 | 17 |
| 102 | 226 | 24 |
| 103 | 250 | 17 |
| 104 | 267 | 15 |

在某行内插入或删除若干字符，只需更新该行的长度；若超出行分配的存储空间，则重新分配并修改起始地址。插入或删除整行，则涉及行表的插入/删除；若删除的是页的起始行，还要更新页表。由于访问以页表、行表为索引，**删除行或页时只需改表，不必删除涉及的字符本身**，从而节省大量时间。

这个例子说明了两点：一是串处理中"以串的整体为操作对象"（行是子串，文本是主串）是常态；二是存储结构与索引结构分离（字符存储 + 行表）可以大幅降低编辑代价。

## 小结

串是数据对象限定为字符集的线性表，但操作以"串的整体"为单位，存储也因此围绕"取一段、拼一段、找一段"来设计；字符编码决定了串里的"字符"在计算机里占几个字节。三种存储是三种取舍：定长顺序简单直接但长度受限；堆分配灵活通用，代价是每次拼接都可能整体分配复制；块链适合超长文本的流式处理，随机访问却最慢。选哪种，取决于应用里是频繁比较、频繁拼接，还是大文本顺序处理。下一节把这些基础用到串最经典的问题——模式匹配上。

## 练习

1. 空串与空格串有什么区别？它们的长度分别是多少？"判断串为空"应该用哪个？
2. UTF-8 与 GBK 都是变长编码，一个中文字符分别占几个字节？为什么说"串长不等于字节数"？
3. 顺序表与顺序串在存储结构设计上有什么不同？串长有哪三种表示方案，各有什么特点？
4. 循环中逐字符拼接为什么是 $O(k^2)$？给出两种改写为 $O(k)$ 的方案。
5. 定长串的 `concat` 超长时有哪些失败约定？分别写出接口行为与调用方需要注意什么。
6. 用最小操作子集（StrLength、SubString、Concat）实现 `StrDelete(&S, pos, len)`。
7. 堆分配串的 `concat` 和 `sub_string` 都做了"释放旧空间 + 分配 + 复制"，说明为什么必须先释放旧空间，不释放会怎样。
8. 块链存储中，访问第 i 个字符的复杂度是多少？若每个结点只存 1 个字符，空间开销会怎样变化？"存储密度"怎么描述这个问题？
9. 文本编辑中删除一行时，为什么只需改行表而不动字符存储？这体现了串的什么操作特点？
