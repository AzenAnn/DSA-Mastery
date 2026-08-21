---
title: "Lab 03-08：UTF-8 串长与字符数"
description: "按 UTF-8 首字节规则统计字节数与字符数，验证'串长不等于字节数'。"
order: 8
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-20"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---

# Lab 03-08：UTF-8 串长与字符数

> 题目来源：牛客“字符数量”题与 3.1 字符编码知识点（UTF-8 变长编码、串长不等于字节数）。

输入一行 UTF-8 编码的文本，输出它的**总字节数**和**字符数**（Unicode 码点数）。

## 题目

### UTF-8 字符统计

3.1 指出：多字节编码下“串长不等于字节数”，`strlen`、`std::string::size()` 都按字节计数。本题要求按 UTF-8 规则统计真正的字符数。

### 任务要求

1. 从标准输入读入一行 UTF-8 文本（按字节读取）；
2. 第一行输出总字节数，第二行输出字符数；
3. 按首字节判定字符长度：
   - `0xxxxxxx` → 1 字节；
   - `110xxxxx` → 2 字节；
   - `1110xxxx` → 3 字节；
   - `11110xxxx` → 4 字节；
   - `10xxxxxx` 是续字节，不作为字符起点；
4. 输入保证是合法 UTF-8，不需要校验非法编码。

## 输入格式

- 一行：UTF-8 编码文本，不含换行符；字节数 ≤ 10⁶。

## 输出格式

- 第一行：总字节数；
- 第二行：字符数（码点数）。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 输入字节数 | 0 ≤ 字节数 ≤ 10⁶ |
| 时间复杂度 | O(字节数) |
| 空间复杂度 | O(1)（不含输入本身） |

## 样例

### 样例输入 1

```input
中a
```

### 样例输出 1

```output
4
2
```

### 样例输入 2

```input
Hello
```

### 样例输出 2

```output
5
5
```

### 样例输入 3

```input
A中B
```

### 样例输出 3

```output
5
3
```

### 样例输入 4

```input
𝄞
```

### 样例输出 4

```output
4
1
```

### 样例输入 5

```input

```

### 样例输出 5

```output
0
0
```

### 样例解释

“中”的 UTF-8 编码是 `E4 B8 AD`（3 字节），加上 `'a'` 的 1 字节，样例 1 共 4 字节、2 个字符；样例 4 的 `𝄞`（U+1D11E）占 4 字节、1 个字符；样例 5 是空串，字节数与字符数都为 0。

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
pnpm lab:doctor -- labs/chapter-03/lab-03-08-utf8-char-count
pnpm lab:run -- labs/chapter-03/lab-03-08-utf8-char-count
pnpm lab:score -- labs/chapter-03/lab-03-08-utf8-char-count
```

- [ ] 五个样例全部通过；
- [ ] 能说出 ASCII、中文、4 字节字符各占几个字节；
- [ ] 能解释为什么 `strlen("中a")` 返回 4 而不是 2；
- [ ] 空串与纯 ASCII 输入都有证据。

## 思考题

1. 若程序按字节截断多字节字符，会发生什么？如何避免“半个字符”？
2. GBK 与 UTF-8 下同一个中文字符各占几字节？
3. 统计字符数时为什么数“首字节”而不是“续字节”？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

逐字节扫描输入：字节数就是读入串的长度；遇到首字节时按高位模式判定该字符占 1～4 字节，字符数加一后跳过相应字节。续字节（`10xxxxxx`）永远不会成为字符起点。

### 复杂度分析

每个字节只访问一次，时间 O(字节数)；只用常数个计数器，空间 O(1)。

### 边界注意

- 空串：字节数、字符数都为 0；
- 纯 ASCII：字节数等于字符数；
- 4 字节字符（emoji 等）：首字节 `11110xxx`，一次跳过 4 字节。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <string>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string line;
    std::getline(std::cin, line);

    std::size_t bytes = line.size();
    std::size_t chars = 0;
    for (std::size_t i = 0; i < bytes;) {
        unsigned char c = static_cast<unsigned char>(line[i]);
        if ((c & 0x80) == 0) {
            ++chars;
            i += 1;
        } else if ((c & 0xE0) == 0xC0) {
            ++chars;
            i += 2;
        } else if ((c & 0xF0) == 0xE0) {
            ++chars;
            i += 3;
        } else if ((c & 0xF8) == 0xF0) {
            ++chars;
            i += 4;
        } else {
            // 输入保证合法；防御性地按 1 字节跳过续字节。
            ++chars;
            i += 1;
        }
    }
    std::cout << bytes << '\n';
    std::cout << chars << '\n';
    return 0;
}
```

</details>
