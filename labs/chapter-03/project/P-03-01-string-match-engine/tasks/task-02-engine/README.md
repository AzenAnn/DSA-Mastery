# Lab 03-P-01：串匹配与文本处理引擎

## 目标

在 `contracts/matcher.hpp` 的统一契约下完成三件事：

1. 实现 `NaiveMatcher`、`KmpMatcher`、`KmpNextvalMatcher`，保证三种算法对同一输入返回相同的首次出现位置，并按统一口径统计匹配阶段字符比较次数（含失配）与 next/nextval 构建比较次数；
2. 在匹配器之上实现 `find_all / count_occurrences / replace_all`（非重叠、自左向右），并做 UTF-8 字符边界校验；
3. 用固定 seed 的工作负载验证结果与计数的可复现性。

`contracts/` 是稳定公共接口，学生不得修改签名；实现写在 `student/matcher.cpp` 与 `student/engine.cpp`。

## 约定（与正文 3.2 一致）

- 0-based 下标，`next[0] = -1`；空模式出现在位置 0；
- `comparisons`：匹配阶段字符比较次数（含失配）；`prefixComparisons`：构建 next/nextval 的真实字符比较次数（朴素为 0）；
- `find_all / count / replace_all` 均非重叠、自左向右；空 pattern 抛 `std::invalid_argument`；
- 匹配在字节层执行；命中必须满足起点和终点都落在 UTF-8 码点边界，否则该命中被拒绝并跳过。

## 测试组与分值

| CTest | 分值 | 覆盖 |
| --- | ---: | --- |
| `engine-semantic-equivalence` | 30 | 三实现位置一致、空模式、首/尾/重叠/未找到 |
| `engine-next-and-nextval` | 15 | `ababc`、`ABCDABD`、`aaaab` 等精确表值 |
| `engine-text-ops-and-utf8` | 30 | findall/count/replace、UTF-8 边界与跨边界拒绝、空 pattern 异常 |
| `engine-cost-accounting` | 15 | 教材示例与重复前缀的精确比较次数 |
| `engine-workload-determinism` | 10 | 五类 profile 固定 seed 可复现、线性上界、worst-case 对比 |

## 运行

```powershell
make run TASK=engine
make score
# 免 Make 兜底（仓库根）：
pnpm lab:run -- labs/chapter-03/project/P-03-01-string-match-engine --task engine
pnpm lab:score -- labs/chapter-03/project/P-03-01-string-match-engine --task engine
```

## 可选：命令行探索

构建后（`.lab-cache/cmake/student/` 或 `solution/` 下）可运行 `match_engine`：

```powershell
$cli = ".\.lab-cache\cmake\student\Release\match_engine_cli.exe"
"hello world" | & $cli compare world
& $cli workload --profile worst-case --size 4096 --seed 42
```

Linux/macOS 对应路径为 `.lab-cache/cmake/student/match_engine_cli`。

## 完成标准

- [ ] 三种匹配器在全部用例上位置一致；
- [ ] next/nextval 表值与正文推导一致；
- [ ] `replace` 与 03E04 的非重叠语义一致；
- [ ] UTF-8 命中落在字符边界，跨边界命中被拒绝；
- [ ] 固定 seed 下同一 profile 两次运行结果与计数一致；
- [ ] reference 自动满分，starter 可编译但未满分。
