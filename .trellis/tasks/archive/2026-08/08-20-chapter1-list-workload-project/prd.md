# 第 1 章线性表工作负载评测 Project Lab

## Goal

在第 1 章新增一个可运行、可评分、可打包的 Project Lab。学习者在同一份 List ADT 下实现动态顺序表和双向循环哨兵链表，再通过可复现的工作负载比较二者的正确性、操作成本、空间成本与实测表现，最终形成有前提的工程选型结论。

读者价值是把本章分散的 ADT、顺序表、链表、复杂度、缓存局部性和容器选型知识串成一个可检查的综合成果，而不是引入新的硬件 Cache 或编译器课程。

## Background and Confirmed Facts

- 最新 `origin/main` 已合并原 Chapter 1 Lab 目录重构，现有 Lab 为连续的 `01-01`～`01-20`，下一个编号是 `01-21`。
- 第 1 章侧栏已由统一 CourseIndex 按 `quiz -> theory`、`program -> exercise`、`project -> project` 分类；新增 `lab.json.type = project` 后应自动进入“工程 Project”，不得手写导航清单。
- `scripts/check-built-site.mjs:87-111` 当前把 Chapter 1 生产 Lab 数量固定为 20；新增 Lab 后必须更新为连续的 21 个。
- `tests/pages-navigation.spec.mjs:956-1002` 当前断言 Project 分组为空；新增 Lab 后必须改为断言唯一 Project 链接与键盘折叠行为。
- Project Schema v1 支持 `ctest|stdio|manual` task、顶层权重、依赖图和自动/人工分离；现有 Golden Project 为 `labs/chapter-04/lab-04-02-huffman-coding`。
- 用户已确认采用 `docs/CHAPTER_01_PROJECT_REDESIGN.md` 的“线性表双实现与工作负载评测器”方向，并要求全部实现、本地预览，PR 必须等待用户确认。
- 当前开发身份由 Trellis 识别为 `Azen`；工作分支为 `lab/ch01-list-workload-project`，基于最新 `origin/main`。

## Requirements

### R1. New Project identity and learner documentation

- 新增 `labs/chapter-01/lab-01-21-list-workload-analyzer/`，README frontmatter 的 title/order/chapter 必须与目录一致。
- README 明确学习目标、前置知识、环境、任务、运行命令、正常/边界/错误行为、评分、完成清单、思考题和复盘。
- Lab 使用 C++17、CMake ≥ 3.25、CTest 和三行薄 Makefile；生成物只写 `.lab-cache/`。
- 顶层 `lab.json` 为 Project Schema v1，包含三个自动 task 和一个人工报告 task。

### R2. Stable contracts and instrumented implementations

- `contracts/` 提供稳定的 List ADT、metrics 和 workload 合同，student/solution 共用，不复制接口。
- List 支持 `size/empty/at/set/insert/erase/find/checksum/clear`，采用 0-based 索引；越界抛 `std::out_of_range` 且有效序列不变。
- 指标至少包含 element moves、node hops、buffer reallocations、node allocations/deallocations、link writes、value comparisons；README 和测试冻结计数口径。
- 指标是独立单位，不得相加为伪“性能总分”；计时不参与自动评分。

### R3. Sequential-list task

- 实现带最小容量、倍增扩容和 25% 延迟缩容的动态顺序表。
- 始终维护 `0 <= size <= capacity`；插入/删除搬移方向正确；clear 后可复用。
- CTest 覆盖基本契约、空/单元素/首中尾/越界、扩缩容、临界点不抖动和计数。

### R4. Linked-list task

- 实现带 size 缓存的双向循环哨兵链表；哨兵不保存业务数据。
- 空表、正反链接、尺寸、头尾和 clear 后复用不变量必须可测试。
- 禁止默认浅拷贝；删除后不再访问目标节点；按下标定位与局部改链成本分离。
- CTest 同时检查正向和反向关系，防止单向输出掩盖漏链错误。

### R5. Workload runner task

- 构建 `list_workload` 命令行程序，在两种实现上生成相同操作序列并验证语义等价。
- 支持 `random-read`、`head-churn`、`middle-churn`、`tail-churn`、`linear-scan` 五类 profile，以及 `size/operations/seed/repetitions/warmup` 参数。
- 固定随机算法和 seed，保证跨标准库实现的操作序列可复现。
- 输出 profile、参数、等价性、checksum、各类计数、空间估算和观察性计时；提供稳定 JSON 输出及 `reportVersion`。
- 未知 profile、非法数值或不完整参数必须得到明确 stderr 和非零退出码。
- 自动测试只断言语义、确定性计数、结构化输出和错误行为，不断言某实现必然更快。

### R6. Task graph and grading

- `sequential-list` CTest 25、`linked-list` CTest 25、`workload-runner` CTest 30、`report` manual 20，权重合计 100 且无依赖环。
- 三个 CTest task 内部测试名与 CMake 完全一致，task 内 points 各自合计 100。
- reference 自动部分为 80/80；starter 可编译但自动部分小于 80；manual 20 始终显示 pending。
- 单 task 与聚合 `run/score/verify` 均可执行并定位错误。

### R7. Report and student package

- 提供 report README、manual task.json 和模板，要求环境、固定参数、至少三个规模、五类 profile、重复计时中位数、计数解释、空间估算、两个业务选型与局限。
- student pack 必须排除 solution/cache/binary，并能脱离源仓库 validate/run。

### R8. Content and site integration

- Chapter 1 总览增加综合 Project 入口，链接只指向 Lab README 的公开 route。
- 更新 Chapter 1 产物数量/编号门禁为 21，并更新 Pages 测试：Project 分组包含一个可点击链接，不再显示空状态。
- Labs 首页、搜索、课程侧栏、prev/next 和 Pages base 必须继续从统一 ContentIndex 自动发现新 Lab。
- 不硬编码 `/DSA-Mastery/`，不新增第二份 Lab 列表。

### R9. Delivery and user review boundary

- 完成目标 Lab validate/run/score/verify、student pack、全仓 `pnpm test` 和 Pages Playwright。
- 启动绑定 `127.0.0.1` 的本地 VitePress 预览，给用户可访问地址与重点验收路径。
- 在用户确认前不创建 PR、不推送分支、不合并；保持工作区改动可审查。

## Acceptance Criteria

- [ ] `lab-01-21-list-workload-analyzer` 的 README、frontmatter、manifest、Make/CMake/presets、contracts、student/solution、tests 和 report 完整存在。
- [ ] 顶层 task 权重为 25/25/30/20，依赖存在且无环；三个 CTest task 内部分值各为 100。
- [ ] 顺序表与链表对正常、边界和错误操作满足同一 List 语义，且各自关键不变量有直接测试。
- [ ] 五类 workload 在相同 seed 下可复现，两个实现的查询结果、最终序列和 checksum 一致。
- [ ] 固定小样例的 metrics 精确可测；elapsed time 不进入自动判分。
- [ ] reference 自动分为 80/80，starter 可编译且低于 80，manual pending 为 20。
- [ ] Lab 的单 task/聚合 Make 与 pnpm 入口一致，构建只污染 `.lab-cache/`。
- [ ] student pack 不含 solution/cache/binary，并能独立 validate/run。
- [ ] Chapter 1 生成 21 个连续 Lab；Project 侧栏有且仅有新 Lab 链接，空状态消失。
- [ ] `pnpm lab:validate/run/score/verify`、`pnpm test`、Pages base build/check/Playwright 均通过并有真实结果。
- [ ] 本地预览可访问 Lab 页面、Chapter 1 侧栏和 Labs 首页，无控制台/同源错误。
- [ ] 用户收到预览地址和验证摘要；PR 创建动作保持未执行，等待用户明确确认。

## Out of Scope

- 真实 C++ struct/ABI 解析、硬件 Cache/TLB/预取模拟和自动字段重排。
- 并发容器、线程安全 LRU、自定义 allocator、强制硬件性能计数器。
- 修改 Lab Schema v1、共享 Lab CLI 或全站导航架构，除非实现期发现现有合同无法承载且重新回到规划。
- 发布生产 Pages、创建/合并 PR、推送分支或改变 main 历史。

## Risks and Deferred Items

- 墙钟时间受平台、优化和噪声影响，只作人工报告证据；自动测试不比较快慢。
- `estimatedStorageBytes` 只能给出实现内可观察下界，链表分配器元数据和碎片必须明确排除。
- 知识内容仍需 Review Owner 人工核验；本次实现和自动测试不能替代最终同伴 Review。
