---
title: "Lab 03-E-16：定长顺序串的插入与删除"
description: "在定长顺序串上按下标插入与删除：超容量时截断丢弃，删除越界时删到末尾，并统计被丢弃与被删除的字符总数。"
order: 20
chapter: 3
labId: "03E16"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "基础"
duration: "40～55 分钟"
---

# Lab 03-E-16：定长顺序串的插入与删除

> 题目来源：改编自严蔚敏《数据结构（C 语言版）》3.1 串的定长顺序存储与 `StrInsert` / `StrDelete`、王道《数据结构》串的顺序存储。

定长顺序存储把串放在一段容量固定为 `cap` 的连续空间里，串长永远不能超过 `cap`。正因为空间是"定长"的，插入时就要面对真实的内存边界：剩余空间不够时无处可放，只能保留能放下的字符；删除时给多了长度，也只是删到末尾为止。本题要求你按这两条规则模拟一串操作，并统计一共有多少字符因为容量不足被丢弃、多少字符被删除。

## 题目

### 定长顺序串

定长顺序串用一段长度为 `cap` 的连续空间保存字符，同时记录当前串长 `|S|`（恒有 `|S| ≤ cap`）。对它做插入时，如果插入后总长度超过 `cap`，多出来的字符**没有任何位置可放**，只能按"截断"处理；做删除时，如果给出的删除范围越过串尾，也只是**删到末尾**为止。

### 任务要求

1. 从标准输入读入容量 `cap`、初始串 `S`、操作数 `m`，再依次读入 `m` 条操作；
2. `I p T`：在下标 `p` 处插入串 `T`。**位置一律 0-based**，`0 ≤ p ≤ |S|`（`p = |S|` 表示插入到末尾）。**超容量按截断处理**：若插入后长度超过 `cap`，只保留结果串的前 `cap` 个字符，其余字符丢弃，并把丢弃的字符数累加进"被截断丢弃的字符总数"；不报错、不扩容；
3. `D p len`：从下标 `p` 起删除 `len` 个字符，`0 ≤ p ≤ |S|`。**删除越界删到末尾**：若 `p + len > |S|`，只删到串尾为止，把**真正删掉**的字符数累加进"删除字符总数"；
4. 输出两行：第一行是全部操作结束后的最终串（可能是空行）；第二行是三个整数 `最终长度 被截断丢弃的字符总数 删除字符总数`；
5. 保证所有操作都满足上述下标约定，**不设 `ERROR` 分支**，也不需要处理非法输入。

## 输入格式

- 第一行：容量 `cap`；
- 第二行：初始串 `S`（非空白可打印 ASCII，不含空格与制表符；**允许为空串**，此时该行只有一个换行符）；
- 第三行：操作数 `m`；
- 随后 `m` 行，每行一条操作：
  - `I p T`：`p` 为 0-based 插入下标，`T` 为插入串（非空白可打印 ASCII，**允许为空串**，此时该行只有 `I` 和 `p`）；
  - `D p len`：`p` 为 0-based 起始下标，`len` 为要删除的字符个数（可以为 `0`，也可以大于剩余长度）。

## 输出格式

- 第一行：最终串。若最终串为空，输出一个空行；
- 第二行：三个整数 `最终长度 被截断丢弃的字符总数 删除字符总数`，用单个空格分隔，行末无多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `cap` | 1 ≤ cap ≤ 10⁵ |
| `\|S\|` | 0 ≤ \|S\| ≤ cap，初始串允许为空，全程恒有 \|S\| ≤ cap |
| `m` | 1 ≤ m ≤ 10⁴ |
| 插入下标 `p` | 0 ≤ p ≤ \|S\|（0-based），保证合法 |
| 删除下标 `p` | 0 ≤ p ≤ \|S\|（0-based），保证合法 |
| 删除长度 `len` | 0 ≤ len，可以大于 \|S\| − p，此时按删到末尾处理 |
| 字符集 | 非空白可打印 ASCII（不含空格、制表符） |
| 时间复杂度 | O(m × cap) 以内都可接受；本题不设 TLE 压力点，重点是边界规则 |
| 空间复杂度 | O(cap) |

## 样例

### 样例输入 1

```input
8
ABCDEF
4
I 6 GH
I 2 XY
D 5 10
I 5 Z
```

### 样例输出 1

```output
ABXYCZ
6 2 3
```

### 样例输入 2

```input
4
abcd
3
I 0 W
D 0 0
D 2 5
```

### 样例输出 2

```output
Wa
2 1 2
```

### 样例解释

**样例 1**（`cap = 8`，初始 `S = ABCDEF`）：

| 操作 | 执行前串 | 执行后串 | 说明 |
| --- | --- | --- | --- |
| `I 6 GH` | `ABCDEF` | `ABCDEFGH` | 下标 `6` 正好是末尾；插入后长度 `8`，未超过 `cap`，没有字符被丢弃 |
| `I 2 XY` | `ABCDEFGH` | `ABXYCDEF` | 在下标 `2` 处插入 `XY` 得 `ABXYCDEFGH`，长度 `10 > 8`；保留前 `8` 个字符 `ABXYCDEF`，末尾的 `G`、`H` 共 `2` 个字符被丢弃 |
| `D 5 10` | `ABXYCDEF` | `ABXYC` | 从下标 `5` 起删 `10` 个字符，`5 + 10 = 15 > 8`，只能删到末尾；实际删掉 `D`、`E`、`F` 共 `3` 个字符 |
| `I 5 Z` | `ABXYC` | `ABXYCZ` | 此时 `\|S\| = 5`，下标 `5` 就是末尾；插入后长度 `6`，未超过 `cap` |

最终串是 `ABXYCZ`，最终长度 `6`，累计丢弃 `2` 个字符，累计删除 `3` 个字符，所以第二行输出 `6 2 3`。

**样例 2**（`cap = 4`，初始 `S = abcd`）：

| 操作 | 执行前串 | 执行后串 | 说明 |
| --- | --- | --- | --- |
| `I 0 W` | `abcd` | `Wabc` | 在下标 `0` 处（串首）插入 `W` 得 `Wabcd`，长度 `5 > 4`；保留前 `4` 个字符，末尾的 `d` 被丢弃，丢弃数 `+1` |
| `D 0 0` | `Wabc` | `Wabc` | `len = 0` 是合法操作，一个字符也没删，删除数不变 |
| `D 2 5` | `Wabc` | `Wa` | 从下标 `2` 起删 `5` 个字符，`2 + 5 = 7 > 4`，删到末尾；实际删掉 `b`、`c` 共 `2` 个字符 |

最终串是 `Wa`，最终长度 `2`，累计丢弃 `1`，累计删除 `2`，所以第二行输出 `2 1 2`。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-16-fixed-capacity-string-edit
pnpm lab:run -- labs/chapter-03/exercise/E-03-16-fixed-capacity-string-edit
pnpm lab:score -- labs/chapter-03/exercise/E-03-16-fixed-capacity-string-edit
```

- [ ] 两个样例通过；
- [ ] 插入位置在串首、串中、串尾三种情况都有证据；
- [ ] `cap` 恰好填满（无截断）、插入被截断、删除越界删到末尾、删除整串、空插入串 `T`、`len = 0`、初始空串七种边界都有证据；
- [ ] 第二行三个整数都核对过：最终长度、截断丢弃总数、删除字符总数。

## 思考题

1. 定长顺序串在插入时为什么不扩容，而是把放不下的字符丢弃？这样做在存储密度和时间代价上分别换来了什么？
2. 如果把"截断"改成"拒绝插入并输出 `ERROR`"，题面与判题需要额外约定哪些内容？本题为什么不采用这种设计？
3. `std::string::insert` / `erase` 每次都可能搬移 `O(cap)` 个字符，在 `m = 10⁴`、`cap = 10⁵` 的规模下为什么依然可以直接使用？如果要支持 `m` 达到 `10⁶`，你会怎么改？（提示：本题的考点是边界规则，不是复杂度。）
4. 统计"被截断丢弃的字符总数"时，为什么不能简单地把每次 `|S| + |T| − cap` 累加？请举一个同时包含插入与删除的操作序列说明。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

用一段按 `cap` 分配的顺序存储保存当前串，并维护三个量：当前串 `S`、截断丢弃总数 `truncated`、删除字符总数 `deleted`。

- `I p T`：先在 `p` 处把 `T` 拼接进去，得到长度 `|S| + |T|` 的临时结果。若它超过 `cap`，就只保留前 `cap` 个字符，把 `|S| + |T| − cap` 个字符计入 `truncated`；否则不计数。位置 `p` 是 0-based，`p = |S|` 时等于追加到末尾。
- `D p len`：真正能删的字符数是 `min(len, |S| − p)`（`p ≤ |S|` 时非负）。把这部分从串中移除，并把真正删掉的数量计入 `deleted`。`p + len > |S|` 时自然退化为"删到末尾"。

`std::string` 的下标从 0 开始，与题面完全一致，直接模拟即可。

### 复杂度分析

每次插入或删除最坏搬移 `O(cap)` 个字符，总共 `O(m × cap)` 时间、`O(cap)` 空间。本题规模下 `m × cap ≤ 2×10⁹` 字节级别的搬移，实测在毫秒量级，因此**不设 TLE 压力点**：压力用例考查的是大规模下截断、越界删除等规则是否依然正确，而不是逼你去写更复杂的数据结构。

### 边界注意

- **位置一律 0-based**：`p = 0` 是串首，`p = |S|` 表示末尾/追加位置；
- **超容量按截断处理**：只保留前 `cap` 个字符，丢弃的字符数要累加；插入被截断时，丢掉的可能是 `T` 的后半部分，也可能是原串的尾部，甚至是两者；
- **删除越界删到末尾**：`p + len > |S|` 时不报错，实际删除量是 `|S| − p`；
- 空插入串 `T` 与 `len = 0` 都是合法操作，不改变串、不改变计数；
- 初始串可以是空串（第二行为空行），此时第一次插入的 `p` 只能取 `0`；
- 最终串可能为空，此时输出第一行是空行；判题按空白切分 token，但题面仍要求写清两行结构；
- 全过程恒有 `|S| ≤ cap`，所以插入的截断判断只需比较 `|S| + |T|` 与 `cap`。

### 参考代码

```cpp
#include <iostream>
#include <string>

namespace {

// 去掉行尾的换行符与空白：串 S、插入串 T 都不含空白字符，去掉尾部不影响语义
std::string trimRight(const std::string &line) {
    std::size_t end = line.size();
    while (end > 0) {
        const char ch = line[end - 1];
        if (ch == '\r' || ch == '\n' || ch == ' ' || ch == '\t') {
            --end;
        } else {
            break;
        }
    }
    return line.substr(0, end);
}

void skipSpaces(const std::string &line, std::size_t &pos) {
    while (pos < line.size() && (line[pos] == ' ' || line[pos] == '\t')) {
        ++pos;
    }
}

long long readInt(const std::string &line, std::size_t &pos) {
    long long value = 0;
    while (pos < line.size() && line[pos] >= '0' && line[pos] <= '9') {
        value = value * 10 + (line[pos] - '0');
        ++pos;
    }
    return value;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string line;
    if (!std::getline(std::cin, line)) {
        return 0;
    }
    const long long cap = std::stoll(trimRight(line));

    std::string text;
    std::getline(std::cin, text);
    text = trimRight(text);

    std::getline(std::cin, line);
    const long long m = std::stoll(trimRight(line));

    long long truncated = 0;  // 被截断丢弃的字符总数
    long long deleted = 0;    // 被删除的字符总数

    for (long long i = 0; i < m; ++i) {
        if (!std::getline(std::cin, line)) {
            break;
        }
        line = trimRight(line);
        std::size_t pos = 0;
        skipSpaces(line, pos);
        if (pos >= line.size()) {
            continue;
        }
        const char op = line[pos];
        ++pos;
        skipSpaces(line, pos);
        long long p = readInt(line, pos);
        if (p > static_cast<long long>(text.size())) {
            p = static_cast<long long>(text.size());
        }

        if (op == 'I') {
            skipSpaces(line, pos);
            const std::string insertText = line.substr(pos);  // 允许为空串
            std::string merged = text.substr(0, static_cast<std::size_t>(p)) + insertText +
                                 text.substr(static_cast<std::size_t>(p));
            if (static_cast<long long>(merged.size()) > cap) {
                truncated += static_cast<long long>(merged.size()) - cap;
                merged.resize(static_cast<std::size_t>(cap));
            }
            text = merged;
        } else {
            skipSpaces(line, pos);
            const long long count = readInt(line, pos);
            const long long begin = p;
            long long end = p + count;
            if (end > static_cast<long long>(text.size())) {
                end = static_cast<long long>(text.size());  // 越界只删到末尾
            }
            if (end > begin) {
                deleted += end - begin;
                text.erase(static_cast<std::size_t>(begin), static_cast<std::size_t>(end - begin));
            }
        }
    }

    std::cout << text << '\n';
    std::cout << static_cast<long long>(text.size()) << ' ' << truncated << ' ' << deleted << '\n';
    return 0;
}
```

</details>
