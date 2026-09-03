# Lab 03-P-01：串匹配与文本处理引擎

## 目标

实现一个标准输入 / 标准输出工具：读入一行主串 `T` 和一行模式串 `P`，用**朴素匹配**、**KMP（next 版）**与 **KMP-nextval 版**分别求 `P` 在 `T` 中首次出现的位置，并统计匹配阶段执行的字符比较次数（含失配）与预处理（next/nextval 构建）的字符比较次数。

## 输入输出协议

stdin 恰好两行：

```text
<text>
<pattern>
```

stdout 恰好三行：

```text
naive first=<pos> comparisons=<n> prefix=<p>
kmp first=<pos> comparisons=<n> prefix=<p>
nextval first=<pos> comparisons=<n> prefix=<p>
```

- `<pos>`：0-based 首次出现位置；未找到输出 `-1`；空模式约定出现在位置 `0`；
- `<n>`：匹配阶段字符比较次数，**包含失配**；
- `<p>`：构建 next/nextval 时的字符比较次数，朴素恒为 `0`。

约定与第 3.2 节正文完全一致：0-based 下标、`next[0] = -1`；`m > n` 直接未找到；空模式出现在位置 0 且比较次数为 0。

## 边界与错误

- 正常：命中在开头、中间、结尾；模式与主串有重叠；
- 边界：空模式、空主串、单字符、`m > n`、重复字符；
- 错误：stdin 缺少第二行（没有模式）时，向 stderr 输出一行诊断并以非零退出码结束。

## 运行

```powershell
make run
make run TASK=matcher CASE=001-sample
# 免 Make 兜底（仓库根）：
pnpm lab:run -- labs/chapter-03/project/P-03-01-string-match-engine --task matcher
```

## 完成标准

- [ ] 三种算法对同一输入返回相同的首次出现位置；
- [ ] 朴素匹配的比较次数符合 `(n-m+1)×m` 最坏上界；
- [ ] KMP 与 nextval 匹配阶段比较次数不超过 `2n+m` 的线性口径；
- [ ] 空模式、`m>n`、首/尾/重叠用例全部正确；
- [ ] 比较次数与 `03E03` 的口径一致（含失配的字符比较）。
