# Design：第 1 章线性表工作负载评测 Project Lab

## Architecture

```text
contracts/
  IntList + InstrumentedList + Workload API
          │
          ├── SequentialList (student/solution)
          └── LinkedList     (student/solution)
                         │
                  Workload runner/library
                         │
              CLI table + versioned JSON
                         │
                 CTest + manual report
```

Lab 自身是课程内容和机器入口的单一来源。VitePress 只通过现有 CourseIndex 自动发现 README 与 `lab.json.type=project`；站点层只更新原来固定“20 个/空 Project”的断言，不增加注册表。

## Directory and build boundaries

目标目录为 `labs/chapter-01/lab-01-21-list-workload-analyzer/`：

- `contracts/`：固定公共头文件，student/solution 共用。
- `tasks/task-01-sequential-list`、`task-02-linked-list`、`task-03-workload-runner`：各自 README、task.json、student、solution、tests。
- `src/main.cpp`：薄 CLI 入口；业务逻辑留在 workload task。
- `report/`：manual task 和模板。
- 顶层 CMake 通过 `LAB_USE_SOLUTION` 在 student/solution 源之间切换，target 级 include/link，不使用全局隐式依赖。
- Preset 的 binaryDir 固定在 `.lab-cache/cmake/student|solution`。

## Contracts

### List semantics

`IntList` 固定 `size/empty/at/set/insert/erase/find/checksum/clear`。`at/set/erase` 要求 `index < size`；`insert` 允许 `index == size`。越界使用 `std::out_of_range`，业务序列不变。

### Metrics

`CostMetrics` 使用 `uint64_t` 字段：

- elementMoves：复制或平移已有值；写入新用户值不计。
- nodeHops：沿 next/prev 的一次节点转移。
- bufferReallocations：测量阶段内缓冲区更换；构造分配不计。
- nodeAllocations/nodeDeallocations：业务节点创建/释放；哨兵不计。
- linkWrites：业务插删对 prev/next 的赋值；哨兵构造不计。
- valueComparisons：find 的值相等比较。

初始化完成后 runner 调用 `resetMetrics`。最终校验/格式化通过不计数的快照或 guard 完成，不污染测量窗口。不同字段不聚合成总成本。

### SequentialList

- 默认最小容量 8；构造后 `size=0, capacity=8`。
- 满载插入前翻倍；删除后 `size <= capacity/4` 才减半，且不低于 8。
- expand/shrink 复制的每个已有元素计 1 move；insert/erase 平移的每次赋值计 1 move。
- clear 清空逻辑元素但保留当前容量，不执行可能失败的分配，以兑现 `noexcept`；后续 erase 仍按 25% 规则缩容。

### LinkedList

- 单个内嵌 sentinel，空表 next/prev 都指回自身。
- 每个业务节点满足双向互逆不变量；size 等于沿 next 可达的业务节点数。
- nodeAt 从较近一端定位；每次沿业务/哨兵链接移动计 hop。
- insert/delete 的 linkWrites 由公共 helper 的实际指针赋值定义，固定小例直接断言。
- 复制禁用；析构和 clear 释放全部业务节点。

## Workload data flow

CLI 解析：

```text
--profile <name>
--size <positive integer>
--operations <positive integer>
--seed <uint32>
--warmup <non-negative integer>
--repetitions <positive integer>
[--json]
```

解析后生成 `WorkloadConfig`，由明确实现的 xorshift32 产生跨标准库可复现的索引和值。每个 profile 先用 `0..size-1` 初始化两个实现、重置 metrics，再执行同一语义操作：

- random-read：随机 at。
- head-churn：成对头插/头删，保持规模稳定。
- middle-churn：成对中部插删。
- tail-churn：成对尾插/尾删，从满容量起观察扩缩容滞后。
- linear-scan：重复 checksum。

每次查询比较返回值；调试/小规模测试可逐操作校验，正式运行至少在每轮末尾比较 size、checksum 和完整逻辑快照。任何不等价视为 runner error，不输出成功结论。

计时使用 `steady_clock`，预热轮不进入统计，正式轮输出每实现各轮耗时和中位数。JSON 结构包含 `reportVersion: 1`、config、equivalent、implementations、metrics、estimatedStorageBytes、timingsNs；人类表格由同一结果对象渲染。

## Task graph and scoring

- sequential-list：25，CTest 内 30/25/30/15。
- linked-list：25，CTest 内 25/25/35/15。
- workload-runner：30，CTest 内 40/35/25，依赖前两项。
- report：20，manual，依赖 workload-runner。

CTest 只运行确定性断言。reference 聚合自动满分 80；starter 保持可编译，以显式 TODO/基础骨架产生非满分而非 CE。

## Site integration

- Lab frontmatter order=21，Chapter 1 生产页面编号扩为 01～21。
- `scripts/check-built-site.mjs` 的数量和 expected orders 更新为 21。
- `tests/pages-navigation.spec.mjs` 将 Project 空状态断言改为展开后 1 个链接，校验 href/title/键盘折叠；移动侧栏不再期待“暂无工程型 Lab”。
- Chapter 1 overview 加入 Project 入口；URL 使用相对源码链接和现有 rewrite/base。

## Compatibility and rollback

- 不改 Schema、CLI 和既有 Lab，新增目录可单独回退。
- 若 CMake/CTest 设计无法被现有 Project runner 承载，先停回规划，不私自扩展共享 tooling。
- 回滚时删除新 Lab、overview 链接，并恢复“20 个 + Project 空状态”两处测试断言；不触碰其他 Chapter 1 Lab。

## Security and operational notes

- CLI 不启动 shell、不执行外部工作负载；只解析数字和枚举参数。
- 对 size/operations/repetitions 设置合理上限，防止意外超大分配或长时间运行。
- 本地预览绑定 127.0.0.1；不部署生产，不开放公网。
