---
title: "Lab 01-P-01：线性表双实现与工作负载评测器"
description: "在统一 List ADT 下实现动态顺序表和双向循环链表，用可复现工作负载完成正确性校验、成本测量与工程选型。"
order: 21
chapter: 1
labId: "01P01"
chapterTitle: "线性表"
updated: "2026-08-20"
contributors: ["Azen", "DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "综合"
duration: "5～7 小时"
---

# Lab 01-P-01：线性表双实现与工作负载评测器

同一个 List ADT 可以用连续数组实现，也可以用离散节点实现。两者保存相同的逻辑序列，却为寻址、搬移、链接、分配和遍历支付不同成本。本项目要求你先证明两种实现“做得一样对”，再用统一工作负载回答“在什么条件下应该选谁”。

## 学习目标

- 在固定接口和边界契约下实现两种可替换的线性表；
- 维护顺序表的容量不变量、倍增扩容和 25% 延迟缩容；
- 维护双向循环哨兵链表的尺寸与前后链接不变量；
- 区分定位、搬移、改链、分配、空间估算与墙钟时间；
- 使用固定随机种子生成可复现工作负载，并给出带前提的选型结论。

## 前置知识与环境

- 第 1.1～1.4 节的 List ADT、动态顺序表、双向循环哨兵链表、复杂度与选型；
- Node.js、pnpm、C++17 编译器与 CMake 3.25 或更高版本。

```powershell
make doctor
# 未安装 GNU Make 时，在仓库根执行：
pnpm lab:doctor -- labs/chapter-01/project/P-01-01-list-workload-analyzer
```

## 公共接口与边界

`contracts/` 是不可修改的公共合同。两种实现都支持 `size / empty / at / set / insert / erase / find / checksum / clear`。

- `at`、`set`、`erase`：`0 <= index < size()`；
- `insert`：`0 <= index <= size()`，其中 `index == size()` 是尾插；
- 越界抛出 `std::out_of_range`，已有逻辑序列保持不变；
- `find` 返回首个匹配下标，未找到返回 `-1`；
- `clear` 后对象必须能再次插入；顺序表保留已分配容量，因此该 `noexcept` 操作不会暗中申请内存。

性能观测接口额外提供快照、操作计数和存储空间估算，但不会把容量或节点指针泄漏到 List ADT 中。

## 任务与评分

| Task | 类型 | 权重 | 依赖 | 交付物 |
| --- | --- | ---: | --- | --- |
| `sequential-list` | CTest | 25 | 无 | 动态顺序表与扩缩容计数 |
| `linked-list` | CTest | 25 | 无 | 双向循环哨兵链表与链接计数 |
| `workload-runner` | CTest | 30 | 前两项 | 五类同源工作负载、表格与 JSON |
| `report` | manual | 20 | workload-runner | 实验方法、数据、解释和选型 |

自动测试只判定接口、不变量、确定性计数和输出合同。墙钟时间不会决定自动得分。

```text
Automated: 80/80
Manual pending: 20
Provisional total: 80/100
```

## Task 1：动态顺序表

- 默认最小容量 8，满载插入前容量翻倍；
- 删除后仅当 `size <= capacity/4` 才减半，且不低于 8；
- 插入从后向前搬移，删除从前向后补位；
- 始终满足 `0 <= size <= capacity`；
- `clear` 只清空逻辑元素并保留容量；后续删除仍可按 25% 规则缩容；
- 记录已有元素搬移和缓冲区更换次数。

边界包括空表、单元素、首/中/尾插删、重复值、容量刚满，以及满容量附近反复 `push/pop` 不发生 50% 临界点抖动。

## Task 2：双向循环哨兵链表

- 哨兵不保存业务数据；空表时 `next` 和 `prev` 都指回哨兵；
- `size` 等于正向可达业务节点数；
- 任意节点满足 `node->next->prev == node` 与 `node->prev->next == node`；
- 按下标定位时从较近一端开始；
- 插删记录节点跳转、分配/释放和链接字段写入；
- 禁止默认浅拷贝，`clear` 与析构释放全部业务节点。

测试会同时检查正向和反向序列；只让正向输出“看起来正确”不算完成。

## Task 3：工作负载评测器

`list_workload` 在两种实现上运行相同操作，并比较每次查询结果、每次操作后的规模、最终序列、checksum 和观测值。预热轮与正式重复轮使用同一 seed 和操作序列，初始化、正确性对拍与输出均不计入计时。

| Profile | 测量内容 | 需要解释的成本 |
| --- | --- | --- |
| `random-read` | 随机下标读取 | 直接寻址与节点定位 |
| `head-churn` | 成对头插、头删 | 批量搬移与局部改链 |
| `middle-churn` | 成对中部插删 | 两种 `O(n)` 的不同来源 |
| `tail-churn` | 满容量附近尾插、尾删 | 摊还扩容、缩容滞后与节点分配 |
| `linear-scan` | 多轮 checksum | 同为 `O(n)` 时的指针流量与局部性 |

```powershell
make run TASK=workload-runner

$runner = ".\.lab-cache\bin\student\list_workload.exe"
& $runner --profile random-read --size 4096 --operations 2000 `
  --seed 42 --warmup 1 --repetitions 7

& $runner --profile head-churn --size 4096 --operations 2000 `
  --seed 42 --warmup 1 --repetitions 7 --json
```

Linux/macOS 下对应可执行文件为 `.lab-cache/bin/student/list_workload`；参考实现位于相邻的 `solution` 目录。`--ops` 是 `--operations` 的短别名。

参数限制：`size` 为 1～1,000,000，`operations` 为 1～10,000,000，`warmup` 为 0～100，`repetitions` 为 1～100，`seed` 为 32 位无符号整数。非法参数写入 stderr 并返回非零退出码。

## 指标口径

| 字段 | 计数内容 |
| --- | --- |
| `elementMoves` | 扩缩容复制或插删平移已有值；写入新值不计 |
| `nodeHops` | 沿 `next/prev` 从一个节点移动到另一个节点 |
| `bufferReallocations` | 测量阶段内更换顺序表缓冲区 |
| `nodeAllocations` / `nodeDeallocations` | 创建/释放业务节点；哨兵不计 |
| `linkWrites` | 插删时写入业务节点或相邻节点的 `prev/next` 字段 |
| `valueComparisons` | `find` 执行的值相等比较 |

不同字段单位不同，不能相加成“综合性能分”。`estimatedStorageBytes` 统一按“容器对象本身 + 已保留的数组缓冲区或业务节点”估算；链表结果不包含分配器元数据和碎片，因此它仍不是进程真实占用。

## 运行、单任务与严格评分

```powershell
make run
make run TASK=sequential-list
make run TASK=linked-list
make run TASK=workload-runner
make score
make verify
```

仓库根免 Make 入口：

```powershell
pnpm lab:run -- labs/chapter-01/project/P-01-01-list-workload-analyzer
pnpm lab:run -- labs/chapter-01/project/P-01-01-list-workload-analyzer --task sequential-list
pnpm lab:score -- labs/chapter-01/project/P-01-01-list-workload-analyzer
pnpm lab:verify -- labs/chapter-01/project/P-01-01-list-workload-analyzer
```

## 正常、边界与错误情况

- 正常：两种实现执行同一 profile，`equivalent = true`，checksum 相同；
- 边界：最小规模、单次操作、seed 为 0、容量刚满、空表错误访问、clear 后重用；
- 错误：未知 profile、缺少参数值、超出范围或无法解析的整数，必须明确报错；
- 环境错误：缺少 CMake/编译器属于工具错误，不是学生 WA。

## 报告与完成清单

复制 `report/template.md`，至少使用三个规模和全部五类 profile；每组正式计时至少 7 轮，报告中位数并记录环境。

- [ ] 两种实现通过相同 List 契约和边界用例；
- [ ] 顺序表扩缩容、防抖动和链表双向链接测试通过；
- [ ] 五类 profile 在相同 seed 下可复现且结果一致；
- [ ] 人类表格和 JSON 可用，JSON 含 `reportVersion`；
- [ ] reference 自动部分 80/80，starter 可编译但未满分；
- [ ] 构建产物只位于 `.lab-cache/`。

## 思考与复盘

1. 为什么“链表插删是 `O(1)`”必须说明调用者是否已经持有节点？
2. 两种 `O(n)` 为什么仍可能表现不同？
3. 为什么计时不能替代复杂度证明，也不能直接给出精确 Cache Miss？
4. 若业务必须长期持有元素句柄，哪项需求会改变选型？
5. 记录一个被测试捕获的错误、不变量破坏方式和最小回归用例。
