# 第三章 串匹配与文本处理引擎（工程题）— 技术设计

> 需求与验收见 `prd.md`；本文档冻结技术边界、契约草案、任务图与关键决策。实现开始前必须经用户 Review 通过。

## 1. 定位

第三章收口工程。学生在统一 Matcher 契约下实现朴素匹配、KMP（next 版）与 nextval 版，再组装文本处理引擎命令，用固定 seed 工作负载对拍三者的确定性字符比较次数，最后完成带前提的选型报告。自动 80 分 + 人工 20 分，结构与 Golden Project（lab-04-02 Huffman）一致。

## 2. 目录结构

```text
labs/chapter-03/lab-03-14-string-match-engine/
├─ README.md
├─ lab.json
├─ Makefile                        # 三行薄模板
├─ CMakeLists.txt
├─ CMakePresets.json
├─ contracts/
│  └─ matcher.hpp                  # Matcher 抽象 + MatchOutcome + next/nextval 构建函数
├─ src/                            # 可选公共实现（如 next 构建、UTF-8 边界工具）
├─ tasks/
│  ├─ task-01-matcher/
│  │  ├─ README.md
│  │  ├─ task.json                 # kind=stdio
│  │  ├─ student/main.cpp
│  │  ├─ solution/main.cpp
│  │  └─ tests/cases.json + 001..NNN.in/.out
│  └─ task-02-engine/
│     ├─ README.md
│     ├─ task.json                 # kind=ctest
│     ├─ student/…                 # 可编译但不满分
│     ├─ solution/…                # 参考实现
│     └─ tests/engine_*.cpp        # CTest 源
└─ report/
   ├─ task.json                    # kind=manual checklist
   └─ template.md
```

slug 与编号以最终批准为准；`pnpm lab:new -- --type project --chapter 3 --order 14 --slug string-match-engine` 生成骨架后替换占位内容。

## 3. 契约草案（contracts/matcher.hpp）

```cpp
struct MatchOutcome {
    std::size_t first;         // 首次出现位置；未找到 = npos
    std::uint64_t comparisons; // 字符比较次数（含失配）
};

class Matcher {
public:
    virtual ~Matcher() = default;
    virtual MatchOutcome first(std::string_view text,
                               std::string_view pattern) const = 0;
    virtual std::string name() const noexcept = 0;
};

class NaiveMatcher final : public Matcher { /* ... */ };
class KmpMatcher final : public Matcher { /* ... */ };          // next 版
class KmpNextvalMatcher final : public Matcher { /* ... */ };   // nextval 版
```

约定：

- next 为 0-based、`next[0] = -1`，与正文 3.2 完全一致；`nextval` 在 next 基础上压缩必然失配的回退；
- 空模式：`first = 0`（正文约定）；`m > n`：`first = npos`；
- next/nextval 构建函数放在 contracts 或 src 公共实现，CTest 可直接校验精确表值；
- 学生不得修改 `contracts/` 中的签名；实现细节（节点、容量等）不得泄漏进契约。

## 4. Task 1：matcher（stdio，30 分）

命令行工具，复用 Program 判题内核。stdin 协议（实现时冻结于 README），建议：

```text
T <text>
P <pattern>
```

输出三行：`naive first=<pos> comparisons=<n>`、`kmp ...`、`nextval ...`；未找到时 `first=npos`。stderr 只承载诊断。

cases 设计（合计 100）：

| 用例组 | 分值建议 | 覆盖 |
| --- | ---: | --- |
| sample | 10 | 题面样例，协议示例 |
| normal | 30 | 常规命中、首/尾命中、重叠 |
| boundary | 25 | 空 text、空 pattern、单字符、m>n、重复字符 |
| error | 10 | 坏参数/空行、非法指令（非零退出码） |
| stress | 15 | 大 text、长 pattern、01 串最坏情况 |
| regression | 10 | 每个曾逃过测试的错误留下最小反例 |

与 lab-03-06 的边界：lab-03-06 是单题比较次数练习；本 task 是统一三实现的命令行入口，输出合同不同，README 需写明。

## 5. Task 2：engine（ctest，50 分）

CMake target 连接 `contracts/` 与学生/参考实现。CTest 名与 `task.json` 完全一致，task 内分值合计 100：

| CTest | 分值 | 覆盖 |
| --- | ---: | --- |
| `engine-semantic-equivalence` | 30 | 三实现对同一输入返回相同 first；空模式/m>n/首尾/重叠/重复字符 |
| `engine-next-and-nextval` | 15 | `ababc` → next `[-1,0,0,1,2]`；`aaaab` → nextval `[-1,-1,-1,-1,3]` 等精确表值 |
| `engine-text-ops-and-utf8` | 30 | findall/count/replace 非重叠语义；UTF-8 命中落在字符边界；跨边界命中行为符合冻结语义；空 pattern 抛异常 |
| `engine-cost-accounting` | 15 | 固定小样例 comparisons/prefix 精确值；朴素最坏 O(n·m) 计数上界、KMP/nextval 线性计数口径回归 |
| `engine-workload-determinism` | 10 | 五类 profile 固定 seed 可复现、三实现位置一致、worst-case 朴素显著多于 KMP |

引擎命令：`first / count / findall / replace / compare`；人类表格 + `--json`（顶层含 `reportVersion`）。`replace` 自左向右、非重叠，与 lab-03-07 语义一致；空 pattern 时报错（避免死循环），行为写入 README。

## 6. UTF-8 设计决策（冻结）

- 输入按字节读入 `std::string`，匹配在字节层执行；
- UTF-8 是自同步变长编码：合法码点边界是安全对齐起点；命中必须满足“命中起点是码点边界，且命中长度等于 pattern 字节长（pattern 自身必须是完整码点序列）”；
- 跨码点边界的字节命中：引擎拒绝该命中并跳过，stdio 层可将诊断写 stderr；README 与测试固定该语义；
- 字符数（lab-03-08 语义）只在报告/`compare` 输出中作为辅助信息，不进入自动判定。

## 7. Task 3：report（manual，20 分）

`report/task.json` 只声明 Reviewer checklist，不伪造自动分：

- 实验方法（4）：OS/CPU/编译器/构建类型；规模/操作数/seed；预热与正式轮数（≥7 取中位数）；计时是否包含构造、初始化与正确性校验；
- 数据完整性（6）：至少三个规模（建议 256 / 4096 / 65536）× 五类 profile 的确定性计数，另给中位时间；
- 原因分析（6）：把差异连接到比较次数、主串回退与 next/nextval 收益条件；不把计数解释成 CPU 周期或 Cache Miss；
- 工程选型与边界（4）：至少两个场景（如流式顺序输入、文本编辑器查找、固定文本多次查找），写出访问比例、定位输入与反转条件。

## 8. 工作负载 profiles

| profile | 生成方式 | 待验证假设 |
| --- | --- | --- |
| `random-text` | 随机 ASCII | 首字符少见，朴素常数更小，可能反超 KMP |
| `repeated-prefix` | `aaa…ab` 类 | nextval 显著省比较 |
| `worst-case` | 01 串部分匹配 | 朴素 O(n·m)，KMP O(n+m) |
| `realistic` | 自然语言文本 | 三者差异小，朴素可用 |
| `stream` | 顺序只读输入模拟（不回溯 API） | KMP“主串只扫一遍”的工程价值 |

固定 seed + 自实现 xorshift32，不依赖标准库分布器实现细节；seed 出现在输出中。墙钟时间只作报告辅助证据，自动测试不得断言“实现 A 快于实现 B”。

## 9. lab.json 草案

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "project",
  "language": "cpp",
  "toolchain": { "standard": "c++17", "profile": "course-default" },
  "buildSystem": "cmake",
  "tasks": [
    { "id": "matcher", "path": "tasks/task-01-matcher", "weight": 30, "kind": "stdio", "dependsOn": [] },
    { "id": "engine", "path": "tasks/task-02-engine", "weight": 50, "kind": "ctest", "dependsOn": ["matcher"] },
    { "id": "report", "path": "report", "weight": 20, "kind": "manual", "dependsOn": ["engine"] }
  ]
}
```

## 10. 兼容、风险与回滚

- 与 lab-03-06 概念重叠：README 明确差异；engine 不复制其 stdin 协议；
- UTF-8 语义是新增考点：决策冻结于 README + 测试，避免学生与 Reviewer 各执一词；
- 换行与 oracle：`.out` 一律 LF，比较与写入前先统一 CRLF/LF，只经 `refresh-expected --write` 更新；
- 依赖：不依赖数组 Labs；前置为 3.1/3.2 与现有 04–08 Labs；
- 回滚：按 task 推进，task-01 失败只影响 stdio cases；契约、UTF-8 语义或计数口径变更必须回到 planning 更新 prd/design 后再实现。

## 11. 可选扩展（不计入基础 100 分）

- 块链串存储重跑同负载，比较“存储密度”与编辑成本；
- 追加 BM 参考实现做横向对比；
- 把 3.2 的词索引表作为 `index` 命令（分词 + 排序 + 查询），复用第一章线性表结论。
