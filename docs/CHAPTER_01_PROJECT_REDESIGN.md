# Project 设计稿：线性表双实现与工作负载评测器

> 文档状态：Proposal
> 对应章节：第 1 章「线性表」
> 建议落点：`labs/chapter-01/lab-01-21-list-workload-analyzer/`
> Lab 类型：Project（多任务综合 Lab）
> 语言与工具链：C++17、CMake ≥ 3.25、CTest
> 难度：综合
> 建议用时：5～7 小时
> 更新日期：2026-08-20

## 1. 项目定位

本项目要求学生在同一份 `List` 抽象契约下，分别实现动态顺序表和双向循环哨兵链表，再让两种实现执行完全相同的工作负载。程序既检查它们的可观察行为是否一致，也记录元素搬移、节点跳转、内存分配和链接修改等确定性指标。学生最后依据复杂度、操作计数、内存估算和实测时间，为具体场景选择实现并说明结论的适用边界。

项目形成一条与第 1 章一致的学习闭环：

```text
List ADT 与边界契约
        ↓
顺序表实现 ────── 链表实现
        \          /
         同一工作负载回放
                ↓
      正确性等价 + 成本证据
                ↓
        有前提的工程选型
```

本项目中的“性能”不是让学生凭一次计时宣布某个容器永远更快。自动测试只判定确定性的接口行为、不变量和操作计数；墙钟时间只作为报告中的辅助证据，不进入自动评分。

## 2. 为什么替换原“内存布局与缓存性能模拟器”方案

原方案有“实现—测量—决策”的好框架，但不适合作为第 1 章 Project 的必做内容：

- `struct` 解析、ABI 对齐、嵌套类型和 `offsetof` 更接近编译原理与体系结构，不是线性表章节的主线；
- CPU Cache 的组相联、替换策略和写策略超出当前章节前置知识，容易让学生把精力花在模拟器细节上；
- “只重排字段就最小化缓存未命中”缺少访问模式，优化目标本身不完整；字段重排还可能改变 ABI、序列化格式和外部接口；
- 原示例 `byte + int + byte + short` 在所给规则下通常为 12 字节，不是 16 字节；说明题面和 oracle 尚未冻结；
- AOS/SOA 是数据组织方式的改变，不等同于结构体字段重排，原 Task 3 与最终报告之间缺少可执行连接；
- 四个任务同时覆盖类型系统、解释器、Cache、优化器和报告，范围过大，难以在一个 Chapter Project 中得到充分测试。

因此，新方案把 Cache 局部性保留为“解释顺序遍历结果的一个硬件因素”，但不要求学生实现硬件 Cache，也不声称操作计数等价于真实 CPU 周期或 Cache Miss 数量。

## 3. 学习目标

完成项目后，学生应能够：

1. 用统一接口描述线性表“能做什么”，并明确合法下标、失败方式与状态不变性；
2. 实现带几何扩容和延迟缩容的动态顺序表，维护 `0 ≤ size ≤ capacity`；
3. 实现带 `size` 缓存的双向循环哨兵链表，维护前后链接和空表不变量；
4. 区分“定位成本”与“修改成本”，解释链表局部改链 `O(1)` 的前提；
5. 用相同工作负载比较随机访问、头部修改、中部修改、尾部增删和完整遍历；
6. 区分渐近复杂度、确定性操作计数、内存估算与真实运行时间；
7. 写出与访问模式、输入规模和平台条件绑定的容器选型建议。

## 4. 前置知识与非目标

### 4.1 前置知识

- List ADT、前置条件与后置条件；
- 顺序表的寻址、插删平移、倍增扩容与摊还分析；
- 单/双向链表、哨兵节点、尺寸缓存与链接不变量；
- 时间/空间复杂度和基本 C++ 类设计；
- 会使用 `make run`，或在仓库根使用 `pnpm lab:run`。

### 4.2 非目标

- 不解析真实 C++ `struct`，不复刻某个编译器 ABI；
- 不实现硬件 Cache、TLB、预取器或分支预测模拟器；
- 不把 `std::chrono` 的一次结果当作跨机器结论；
- 不实现并发容器、线程安全 LRU 或自定义分配器；
- 不要求完整支持复制/移动语义；本项目可显式禁用容器拷贝，聚焦所有权和核心操作；
- 不把各类计数强行相加成一个“综合性能分”。

## 5. 最终交付物

学生需要提交：

1. `SequentialList`：动态顺序表实现；
2. `LinkedList`：双向循环哨兵链表实现；
3. `list_workload`：在两种实现上生成并回放同一工作负载的命令行程序；
4. 自动测试通过记录，以及两种实现最终序列一致的证据；
5. 一份基于固定参数、固定随机种子和重复测量的实验报告。

## 6. 稳定接口与行为契约

公共接口放在 `contracts/`，学生不得修改函数签名。ADT 与性能观测接口分离，避免把 `capacity`、节点指针等实现细节泄漏到 `List` 契约中。

建议接口形状：

```cpp
class IntList {
public:
    virtual ~IntList() = default;

    virtual std::size_t size() const noexcept = 0;
    virtual bool empty() const noexcept = 0;
    virtual int at(std::size_t index) const = 0;
    virtual void set(std::size_t index, int value) = 0;
    virtual void insert(std::size_t index, int value) = 0;
    virtual int erase(std::size_t index) = 0;
    virtual int find(int value) const noexcept = 0;
    virtual long long checksum() const noexcept = 0;
    virtual void clear() noexcept = 0;
};

struct CostMetrics {
    std::uint64_t elementMoves{};
    std::uint64_t nodeHops{};
    std::uint64_t bufferReallocations{};
    std::uint64_t nodeAllocations{};
    std::uint64_t nodeDeallocations{};
    std::uint64_t linkWrites{};
    std::uint64_t valueComparisons{};
};

class InstrumentedList : public IntList {
public:
    virtual CostMetrics metrics() const noexcept = 0;
    virtual void resetMetrics() noexcept = 0;
    virtual std::size_t estimatedStorageBytes() const noexcept = 0;
};
```

统一行为：

| 操作 | 合法范围 | 越界行为 |
| --- | --- | --- |
| `at`、`set`、`erase` | `0 ≤ index < size()` | 抛出 `std::out_of_range`，序列不变 |
| `insert` | `0 ≤ index ≤ size()` | 抛出 `std::out_of_range`，序列不变 |
| `find` | 任意 `int` | 返回首个匹配下标；未找到返回 `-1` |
| `clear` | 任意状态 | 变为空表，可再次插入 |
| `checksum` | 任意状态 | 按逻辑顺序求和；空表返回 `0` |

计数口径必须写入 README 和单元测试：

- `elementMoves`：为扩容复制旧元素、或为插删平移已有元素的赋值次数；写入新值本身不计；
- `nodeHops`：定位或遍历时，从一个节点沿 `next/prev` 移动到另一个节点的次数；
- `bufferReallocations`：因扩容或缩容更换顺序表缓冲区的次数；构造时的初始缓冲区不计；
- `nodeAllocations/nodeDeallocations`：测量阶段内创建/释放业务节点的次数；哨兵不计；
- `linkWrites`：插入或删除业务节点时对 `prev/next` 字段的赋值次数；构造哨兵不计；
- `valueComparisons`：`find` 对元素值执行相等比较的次数；
- 初始化工作负载后统一调用 `resetMetrics()`；生成最终输出或校验快照不得污染测量计数。

这些计数单位不同，只能分别解释，不得直接求和后宣称数值更小的实现“更快”。

## 7. 建议目录结构

```text
lab-01-21-list-workload-analyzer/
├─ README.md
├─ lab.json
├─ Makefile
├─ CMakeLists.txt
├─ CMakePresets.json
├─ contracts/
│  ├─ int_list.hpp
│  ├─ sequential_list.hpp
│  ├─ linked_list.hpp
│  └─ workload.hpp
├─ src/
│  └─ main.cpp
├─ tasks/
│  ├─ task-01-sequential-list/
│  │  ├─ README.md
│  │  ├─ task.json
│  │  ├─ student/sequential_list.cpp
│  │  ├─ solution/sequential_list.cpp
│  │  └─ tests/sequential_list_tests.cpp
│  ├─ task-02-linked-list/
│  │  ├─ README.md
│  │  ├─ task.json
│  │  ├─ student/linked_list.cpp
│  │  ├─ solution/linked_list.cpp
│  │  └─ tests/linked_list_tests.cpp
│  └─ task-03-workload-runner/
│     ├─ README.md
│     ├─ task.json
│     ├─ common/workload_core.cpp
│     ├─ student/workload_output.cpp
│     ├─ solution/workload_output.cpp
│     └─ tests/workload_runner_tests.cpp
└─ report/
   ├─ README.md
   ├─ task.json
   └─ template.md
```

`Makefile` 必须使用仓库规定的三行薄模板；全部生成物只能写入 `.lab-cache/`。公共接口由 `contracts/` 提供，CMake target 负责连接具体 student/solution 实现，不在各 task 之间复制接口。

## 8. 任务图与评分

| Task | ID | 类型 | 顶层权重 | 依赖 | 可检查交付物 |
| --- | --- | --- | ---: | --- | --- |
| 动态顺序表 | `sequential-list` | CTest | 25% | 无 | 通过接口、边界、扩缩容与不变量测试 |
| 双向循环链表 | `linked-list` | CTest | 25% | 无 | 通过接口、链接、边界与清空复用测试 |
| 工作负载评测器 | `workload-runner` | CTest | 30% | 前两项 | 同源操作、语义等价、稳定计数和错误诊断 |
| 实验与选型报告 | `report` | manual | 20% | 前三项 | 方法、数据、解释、建议与局限 |

顶层显示必须区分：

```text
Automated: 80/80
Manual pending: 20
Provisional total: 80/100
```

`dependsOn` 只表达推荐顺序和诊断关系，不把前置任务变成隐藏得分门禁。

## 9. Task 1：动态顺序表

### 9.1 实现要求

- 保存 `data_`、`size_`、`capacity_`；默认最小容量建议为 8；
- 始终满足 `0 ≤ size_ ≤ capacity_`；
- 满载插入时容量翻倍；
- 当 `size_ ≤ capacity_/4` 时容量减半，但不得低于最小容量；
- `at/set` 为常数寻址；`insert/erase` 的搬移方向正确；
- `find` 返回首个匹配位置；
- `clear` 后对象仍可复用，并保留当前容量以满足 `noexcept` 合同；
- 越界操作抛出 `std::out_of_range`，且不改变已有序列或指标以外的有效状态。

### 9.2 CTest 建议

| 测试名 | Task 内分值 | 覆盖点 |
| --- | ---: | --- |
| `sequential-contract` | 30 | 基本操作与 List 语义 |
| `sequential-boundaries` | 25 | 空表、首/尾、越界、重复值 |
| `sequential-resize` | 30 | 倍增、25% 延迟缩容、无临界点抖动 |
| `sequential-invariants` | 15 | size/capacity、clear 后复用、计数口径 |

测试必须包含“容量刚满后 push/pop 交替”的回归用例，确认 25% 缩容策略不会每次操作都重新分配。

## 10. Task 2：双向循环哨兵链表

### 10.1 实现要求

- 哨兵不保存业务数据；空表时 `sentinel.next == &sentinel` 且 `sentinel.prev == &sentinel`；
- 维护 `size_`，使其始终等于可达业务节点数；
- 任意业务节点满足 `node->next->prev == node` 与 `node->prev->next == node`；
- `nodeAt(index)` 可从更近的一端定位，但最坏复杂度仍为 `O(n)`；
- 已知相邻节点后，插入和删除只修改固定数量链接；
- `clear` 释放全部业务节点并恢复空表哨兵状态；
- 删除后不再访问目标节点；禁用默认浅拷贝，避免重复释放。

### 10.2 CTest 建议

| 测试名 | Task 内分值 | 覆盖点 |
| --- | ---: | --- |
| `linked-contract` | 25 | 与顺序表一致的 List 语义 |
| `linked-boundaries` | 25 | 空表、单节点、首/中/尾、越界 |
| `linked-bidirectional-links` | 35 | 正反遍历、哨兵、尺寸与四向链接 |
| `linked-clear-and-reuse` | 15 | 清空、析构路径和重新插入 |

不能只比较正向输出；测试必须同时检查反向序列和哨兵两端，否则漏写 `right->prev` 一类错误可能逃过测试。

## 11. Task 3：工作负载评测器

### 11.1 目标

评测器在两种实现上生成完全相同的操作序列。每个 profile 先完成初始化，再重置指标，随后进入测量阶段。程序至少检查：

- 每个查询操作的返回值一致；
- 每个修改操作后的 `size` 一致；
- profile 结束时完整逻辑序列和 `checksum` 一致；
- 同一参数和种子产生完全相同的确定性操作计数；
- 非法参数得到清楚诊断和非零退出码。

随机 workload 使用项目自带的固定算法（如明确实现的 `xorshift32`），不要依赖不同标准库实现可能产生不同序列的分布器细节。随机种子必须出现在输出中。

### 11.2 工作负载 profiles

命令示例：

```powershell
.lab-cache/bin/student/list_workload --profile random-read --size 4096 --operations 2000 --seed 42
.lab-cache/bin/student/list_workload --profile head-churn --size 4096 --operations 2000 --seed 42
.lab-cache/bin/student/list_workload --profile middle-churn --size 4096 --operations 2000 --seed 42
.lab-cache/bin/student/list_workload --profile tail-churn --size 4096 --operations 2000 --seed 42
.lab-cache/bin/student/list_workload --profile linear-scan --size 4096 --operations 200 --seed 42
```

| Profile | 测量阶段 | 主要知识点 | 待验证假设 |
| --- | --- | --- | --- |
| `random-read` | 随机下标 `at` | 直接寻址 vs 节点定位 | 顺序表无节点跳转；链表定位成本随距离增长 |
| `head-churn` | 交替头插、头删 | 批量搬移 vs 局部改链 | 顺序表搬移多；链表定位为常数但有分配和指针写入 |
| `middle-churn` | 中部交替插删 | `locate + modify` | 两者都可能线性，但成本来源不同 |
| `tail-churn` | 满容量附近尾插、尾删 | 摊还分析与缩容滞后 | 顺序表不应在 50% 处反复扩缩容；链表每次创建/释放节点 |
| `linear-scan` | 多轮 `checksum` | 同为 `O(n)` 的实际差异 | 操作阶相同，局部性和额外指针流量可能影响实测时间 |

表中的内容是实验前假设，不是写死在题面里的“标准结论”。报告必须用学生自己的结果验证、修正或拒绝这些假设。

### 11.3 输出合同

人类可读输出至少包含：

```text
Profile: random-read
Size: 4096  Operations: 2000  Seed: 42
Equivalent final state: yes

Implementation   Moves  Hops  Realloc  NodeAlloc  LinkWrites  Checksum
sequential       0      0     0        0          0           8386560
linked           0      2039110 0      0          0           8386560

Elapsed time is observational only; it is not used for automatic scoring.
```

实际数字由固定算法和测试 oracle 决定，设计稿中的示例不得直接作为标准输出。建议同时提供 `--json`，使报告脚本或后续工具能读取结构化结果；消费者先检查 `reportVersion`。

时间测量使用 `std::chrono::steady_clock`，至少提供预热和多轮重复能力。自动测试不得断言“实现 A 必须快于实现 B”，只能检查计时字段存在且为非负值。

### 11.4 CTest 建议

| 测试名 | Task 内分值 | 覆盖点 |
| --- | ---: | --- |
| `runner-semantic-equivalence` | 40 | 五类 workload 的返回值、最终序列和 checksum |
| `runner-cost-accounting` | 35 | 固定小样例的 moves/hops/realloc/linkWrites 精确值 |
| `runner-invalid-input` | 25 | 未知 profile、零/过大参数、坏 seed 与诊断退出码 |

## 12. Task 4：实验与选型报告

报告不能只贴终端截图。至少包含以下内容：

### 12.1 实验方法（4 分）

- 操作系统、CPU、编译器版本、构建类型；
- 每个 profile 的 `size`、`operations`、`seed`；
- 预热轮数、正式轮数和汇总方式；建议报告中位数，不只报告最快一次；
- 说明计时期间是否包含构造、初始化、输出和正确性校验。

### 12.2 数据完整性（6 分）

- 至少选三个规模，例如 `256 / 4096 / 65536`；
- 五类 profile 均给出两种实现的确定性计数；
- 墙钟时间至少重复 7 轮并给出中位数；
- 给出 `estimatedStorageBytes()`；两种实现都按容器对象加已保留存储估算，并注明链表结果不含分配器元数据和碎片。

### 12.3 原因分析（6 分）

- 把观察到的差异分别连接到寻址、搬移、节点跳转、分配和链接修改；
- 明确区分最好/最坏/摊还复杂度；
- 解释为什么同为 `O(n)` 仍可能有不同常数；
- 不把操作计数解释成 CPU 周期，也不根据时间反推出精确 Cache Miss 数。

### 12.4 工程建议与边界（4 分）

至少对以下两个场景作出选择：

1. 高频按排名读取、低频批量重建的排行榜；
2. 长期持有当前位置、频繁在当前位置附近增删的播放列表。

每个建议必须写出访问比例、定位输入、规模和稳定引用需求；还要说明哪些条件变化会使结论反转。

## 13. 顶层 `lab.json`

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "project",
  "language": "cpp",
  "toolchain": {
    "standard": "c++17",
    "profile": "course-default"
  },
  "buildSystem": "cmake",
  "tasks": [
    {
      "id": "sequential-list",
      "path": "tasks/task-01-sequential-list",
      "weight": 25,
      "kind": "ctest",
      "dependsOn": []
    },
    {
      "id": "linked-list",
      "path": "tasks/task-02-linked-list",
      "weight": 25,
      "kind": "ctest",
      "dependsOn": []
    },
    {
      "id": "workload-runner",
      "path": "tasks/task-03-workload-runner",
      "weight": 30,
      "kind": "ctest",
      "dependsOn": ["sequential-list", "linked-list"]
    },
    {
      "id": "report",
      "path": "report",
      "weight": 20,
      "kind": "manual",
      "dependsOn": ["workload-runner"]
    }
  ]
}
```

三个 CTest task 的 `task.json` 中，测试名必须与 CMake/CTest 完全一致，且各 task 内测试分值分别合计 100。`report/task.json` 只声明 Reviewer checklist，不伪造自动分。

## 14. 作者落地流程

本设计应作为独立 Trellis 任务实施，不并入当前“第 1 章 Lab 目录重构”任务。建议等待该任务稳定 `01-01`～`01-20` 后，再使用下一个连续编号；如果落地时目录已经变化，以当时的下一个合法编号为准，同时更新目录、README `title/order` 和全部引用。

1. 创建独立 Issue/Trellis task，冻结最终交付物、接口、计数口径和五类 profile；
2. 使用脚手架生成安全起点：

   ```powershell
   pnpm lab:new -- --type project --chapter 1 --order 21 --slug list-workload-analyzer
   ```

3. 先完成 `contracts/`、reference 实现和能抓住已知错误的 CTest，再写可编译但自动部分不满分的 starter；
4. CMake 用 target 表达 student/solution 与公共依赖，`CMAKE_CXX_STANDARD` 只提供 C++17 后备值，不覆盖 manifest；
5. 逐 task 执行，再执行顶层聚合评分；保证错误能定位到具体 task/test；
6. 运行并记录：

   ```powershell
   pnpm lab:validate -- labs/chapter-01/lab-01-21-list-workload-analyzer
   pnpm lab:run -- labs/chapter-01/lab-01-21-list-workload-analyzer
   pnpm lab:score -- labs/chapter-01/lab-01-21-list-workload-analyzer
   pnpm lab:verify -- labs/chapter-01/lab-01-21-list-workload-analyzer
   pnpm lab:pack -- labs/chapter-01/lab-01-21-list-workload-analyzer --profile student
   pnpm test
   pnpm run validate
   pnpm run test:discovery
   pnpm run build
   pnpm run check:site
   pnpm run test:pages
   ```

7. 在学生包内重新执行 validate/run，并确认没有 `solution/`、缓存和二进制；
8. Reviewer 从干净环境复现至少一个早期 task、完整聚合评分和一组报告数据；
9. `lab.json.type = project` 会让内容索引把它归入“工程 Project”；不得手工修改侧栏 Lab 名单。

## 15. 最终验收清单

### 15.1 学习与内容

- [ ] 项目只要求第 1 章已教授的 ADT、顺序表、链表、复杂度和选型知识；
- [ ] README 说明目标、前置知识、步骤、正常/边界/错误行为、完成清单和复盘；
- [ ] 每个结论都区分理论保证、计数模型、内存估算和实测时间；
- [ ] 不出现“顺序遍历必然 100% Cache Hit”或“链表插删无条件 O(1)”等绝对化表述。

### 15.2 自动验证

- [ ] 顶层 task ID、权重和依赖合法，权重合计 100 且无环；
- [ ] CTest 名与各 `task.json` 一致，task 内分值各自合计 100；
- [ ] 两种实现对同一 workload 的查询结果、最终序列和 checksum 一致；
- [ ] 空表、单元素、重复值、首/中/尾、越界和清空复用均有测试；
- [ ] 顺序表扩缩容和链表双向链接各有精确回归测试；
- [ ] reference 自动部分为 80/80；starter 可编译但自动部分不满分；
- [ ] manual 20 分保持 pending，未被自动分吞并；
- [ ] 所有构建产物只写 `.lab-cache/`，运行后工作树无污染。

### 15.3 工程交付

- [ ] `make run TASK=...` 与 `pnpm lab:run -- ... --task ...` 行为一致；
- [ ] Windows/MSVC 与 Linux/GCC、Clang 的验证路径有真实记录；
- [ ] student pack 不含 solution、cache 或 binary，且能脱离源仓库运行；
- [ ] Project 自动进入 Chapter 1 的“工程 Project”分类，没有第二份导航清单；
- [ ] 知识正确性、测试充分性和报告 rubric 由另一名维护者独立核验。

## 16. 可选扩展（不计入基础 100 分）

- 用静态链表/对象池重做链表节点分配，比较局部性与容量上限；
- 用 `std::vector`、`std::list`、`std::deque` 重跑同一 workload，讨论标准库接口与自制结构的差异；
- 在支持的平台用硬件性能计数器观察 Cache Miss，但必须记录工具、权限和平台限制；
- 把现有 LRU Program 作为后续迁移案例，解释“哈希定位 + 链表调序”如何复用本项目结论。

这些扩展不能改变基础 Project 的接口、评分和跨平台可复现性。
