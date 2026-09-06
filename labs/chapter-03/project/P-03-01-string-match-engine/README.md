---
title: "Lab 03-P-01：串匹配与文本处理引擎"
description: "在统一 Matcher 契约下实现朴素匹配、KMP 与 nextval，用文本处理引擎和固定 seed 工作负载完成确定性比较与工程选型。"
order: 14
chapter: 3
labId: "03P01"
chapterTitle: "字符串与数组"
updated: "2026-08-21"
contributors: ["Qing"]
status: "draft"
lab: true
difficulty: "综合"
duration: "5～7 小时"
---

# Lab 03-P-01：串匹配与文本处理引擎

朴素匹配、KMP 与 nextval 解决的是同一个问题：在文本中查找模式串。三者返回的位置必须完全一致，区别只在字符比较次数与回退方式。本项目要求你在统一 `Matcher` 契约下实现三种匹配器，再组装成文本处理引擎（首次出现、全部出现、计数、非重叠替换），用固定 seed 的工作负载比较确定性的比较次数，最后回答"在什么访问模式下该选谁"。

## 学习目标

- 在统一契约下实现朴素匹配、KMP（next 版）与 nextval 版，并保持三实现语义等价；
- 按统一口径统计匹配阶段字符比较次数与 next/nextval 构建比较次数；
- 用匹配器组装 `first / count / findall / replace`，处理非重叠替换与 UTF-8 字符边界；
- 用固定 seed 工作负载比较算法，区分比较次数、空间开销与墙钟时间；
- 写出带访问模式前提的选型结论，并说明结论的反转条件。

## 前置知识

- 第 3.1 节：串的存储与最小操作子集；
- 第 3.2 节：朴素匹配、KMP、next/nextval 推导与复杂度论证（约定 `next[0] = -1`）；
- 第 3.2 节"字符串的烦恼"：编码、容量与边界陷阱；
- 建议先完成 Lab 03-05～03-09（KMP、next 推导、比较次数、替换、UTF-8）。

## 环境

Node.js、pnpm、C++17 编译器与 CMake 3.25 或更高版本。进入目录先检查：

```powershell
make doctor
# 未安装 GNU Make 时，在仓库根执行：
pnpm lab:doctor -- labs/chapter-03/project/P-03-01-string-match-engine
```

## 公共契约与约定

`contracts/matcher.hpp` 是不可修改的公共合同：

- `MatchOutcome{ first, comparisons, prefixComparisons }`：首次出现位置（未找到为 `npos`）、匹配阶段字符比较次数（含失配）、next/nextval 构建比较次数（朴素为 0）；
- `Matcher` 抽象：`NaiveMatcher`、`KmpMatcher`、`KmpNextvalMatcher` 必须对同一输入返回相同位置；
- 0-based 下标，`next[0] = -1`；空模式约定出现在位置 0；`m > n` 未找到；
- `find_all / count_occurrences / replace_all`：非重叠、自左向右；空 pattern 抛 `std::invalid_argument`；
- 匹配在字节层执行，命中必须落在 UTF-8 码点边界（见"UTF-8 语义"）。

## 任务与评分

| Task | 类型 | 权重 | 依赖 | 交付物 |
| --- | --- | ---: | --- | --- |
| `matcher` | stdio | 30 | 无 | 三种匹配算法的命令行工具：首次位置 + 比较次数 |
| `engine` | CTest | 50 | matcher | 统一契约实现、文本处理命令、UTF-8 边界、工作负载确定性 |
| `report` | manual | 20 | engine | 实验方法、数据、解释与选型 |

```text
Automated: 80/80
Manual pending: 20
Provisional total: 80/100
```

自动测试只判定接口、位置、比较次数与确定性；墙钟时间只作为报告中的辅助证据。

## Task 1：matcher（stdio，30 分）

stdin 两行（主串、模式），stdout 三行：

```text
naive first=<pos> comparisons=<n> prefix=<p>
kmp first=<pos> comparisons=<n> prefix=<p>
nextval first=<pos> comparisons=<n> prefix=<p>
```

`<pos>` 为 0-based 首次出现位置，未找到输出 `-1`，空模式输出 `0`；`<n>` 为匹配阶段字符比较次数（含失配）；`<p>` 为构建 next/nextval 的比较次数（朴素为 0）。缺第二行时向 stderr 输出诊断并以非零退出码结束。本任务与 `03E03` 的口径一致，但统一输出三种实现。

## Task 2：engine（CTest，50 分）

实现 `contracts/matcher.hpp` 中的三个匹配器，以及 `find_all / count_occurrences / replace_all` 与 UTF-8 工具。测试组：

| CTest | 分值 | 覆盖 |
| --- | ---: | --- |
| `engine-semantic-equivalence` | 30 | 三实现位置一致、空模式、首/尾/重叠/未找到 |
| `engine-next-and-nextval` | 15 | next/nextval 精确表值 |
| `engine-text-ops-and-utf8` | 30 | findall/count/replace、UTF-8 边界、空 pattern 异常 |
| `engine-cost-accounting` | 15 | 教材示例与重复前缀的精确比较次数 |
| `engine-workload-determinism` | 10 | 五类 profile 可复现、线性上界、worst-case 对比 |

### UTF-8 语义（冻结）

- 输入按字节读入，匹配在字节层执行；
- 命中必须满足：命中起点是码点边界（`pos == 0`、`pos == size` 或该字节不是续字节 `0x80–0xBF`），且命中终点同样落在码点边界；
- 不满足边界的字节命中被拒绝并跳过，不输出、不替换；
- 空 pattern 抛异常，避免死循环；字符数（`utf8_char_count`）只作为报告辅助信息。

### 计数口径

- `comparisons`：匹配阶段真实执行的字符比较次数，**含失配**；与 03E03 一致；
- `prefixComparisons`：构建 next（以及由 next 派生 nextval）时真实执行的字符比较次数；`k == -1` 的直接扩展不计；
- 不同字段单位不同，不得相加成"综合性能分"；墙钟时间不进入自动评分。

## 工作负载

`src/workload.cpp` 使用固定算法（xorshift32）与固定 seed 生成，跨平台可复现：

| Profile | 生成方式 | 待验证假设 |
| --- | --- | --- |
| `random-text` | 随机 ASCII | 首字符少见，朴素可能反超 KMP 常数 |
| `repeated-prefix` | `aaa…ab` 类 | 大量部分匹配，KMP/nextval 优势明显 |
| `worst-case` | 01 串 | 朴素 O(n·m)，KMP O(n+m) |
| `realistic` | 自然语言文本 | 三者差异小，朴素可用 |
| `stream` | 顺序只读输入模拟 | KMP"主串只扫一遍"的工程价值 |

构建后可用 `match_engine_cli` 查看任意 profile 的确定性计数：

```powershell
$cli = ".\.lab-cache\cmake\student\Release\match_engine_cli.exe"
& $cli workload --profile worst-case --size 4096 --seed 42
```

Linux/macOS 对应路径为 `.lab-cache/cmake/student/match_engine_cli`。

## 运行

```powershell
make run
make run TASK=matcher
make run TASK=engine
make score
make verify
# 免 Make 兜底：在仓库根执行
pnpm lab:run -- labs/chapter-03/project/P-03-01-string-match-engine
pnpm lab:run -- labs/chapter-03/project/P-03-01-string-match-engine --task matcher
pnpm lab:score -- labs/chapter-03/project/P-03-01-string-match-engine
pnpm lab:verify -- labs/chapter-03/project/P-03-01-string-match-engine
```

## 正常、边界与错误情况

- 正常：命中在开头/中间/结尾，重叠模式，重复字符，UTF-8 文本；
- 边界：空主串、空模式、单字符、`m > n`、未找到；
- 错误：matcher 缺第二行输入（stderr 诊断 + 非零退出码）；engine 空 pattern 的查找/替换（抛异常）；CLI 未知命令与坏参数（诊断 + 非零退出码）。

## 报告与完成清单

复制 `report/template.md`，至少使用三个规模（如 256 / 4096 / 65536）与全部五类 profile，正式计时至少 7 轮取中位数，并记录环境与参数。报告必须区分比较次数、空间估算与墙钟时间，结论带访问模式前提与反转条件。

- [ ] 三种匹配器通过相同语义与边界用例；
- [ ] next/nextval 表值与正文推导一致；
- [ ] replace 与 03E04 非重叠语义一致，UTF-8 边界用例通过；
- [ ] 五类 profile 在固定 seed 下可复现且三实现结果一致；
- [ ] reference 自动部分 80/80，starter 可编译但未满分；
- [ ] 构建产物只位于 `.lab-cache/`。

## 思考与复盘

1. 为什么"链表插删是 O(1)"式的结论在串匹配里也有类似陷阱（必须说明访问模式）？
2. 朴素匹配为什么在首字符少见的文本上可能比 KMP 更快？
3. nextval 在什么输入上收益明显？为什么 `aaaab` 的失配总是发生在 `j = 4`？
4. 若主串只能顺序读一遍（磁带、网络流），KMP 相比朴素有什么本质优势？
5. 记录一个被测试捕获的错误、不变量破坏方式和最小回归用例。

## 与 03E03 的差异

`03E03` 是单题 Program，只对一对输入输出朴素与 KMP 的比较次数；本 Lab 的 `matcher` 统一输出三种实现，`engine` 进一步提供契约、文本处理命令、UTF-8 边界与可复现工作负载，并包含人工报告分。
## 完成清单

- [ ] 正常、边界和错误情况都有可复现证据。
- [ ] README 命令已从干净检出验证。

## 思考与复盘

记录一种错误方案、失败原因和改进方式。
