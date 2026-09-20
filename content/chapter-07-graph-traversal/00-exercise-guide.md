---
title: "Ch7 代码题学习清单"
description: "按六个主题组织 30 道图算法代码题，列出稳定编号、题源、文章对应关系与测试方法。"
order: 0
chapter: 7
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
---

# Ch7 代码题学习清单

更新日期：2026-09-14。根据维护者提供的 30 题清单整理。T01–T30 是学习顺序；07E 系列是永久 Lab 身份，两者不互相替代。10 道既有题保留目录及 ID，20 道新题追加为 07E13–07E32。清单外的 07E02、07E03 保留在末尾作为补充，因此本章共有 32 道代码题。

## 题目映射

| 清单 | 稳定 ID / 题目 | 规划节 | 难度 | 处理 |
| --- | --- | --- | --- | --- |
| T01 | [07E01 · DFS 遍历与时间戳](../../labs/chapter-07/exercise/E-07-01-dfs-timestamps/README.md) | 7.1 | 入门 | 保留 |
| T02 | [07E05 · 显式栈 DFS](../../labs/chapter-07/exercise/E-07-05-iterative-dfs/README.md) | 7.1 | 入门 | 保留 |
| T03 | [07E13 · DFS 边分类统计](../../labs/chapter-07/exercise/E-07-13-dfs-edge-classification/README.md) | 7.1 | 基础 | 新增 |
| T04 | [07E14 · 欧拉回路判定](../../labs/chapter-07/exercise/E-07-14-eulerian-classification/README.md) | 7.1 | 进阶 | 新增 |
| T05 | [07E15 · 哥尼斯堡七桥问题](../../labs/chapter-07/exercise/E-07-15-seven-bridges/README.md) | 7.1 | 进阶 | 新增 |
| T06 | [07E16 · 课程表](../../labs/chapter-07/exercise/E-07-16-course-schedule/README.md) | 7.2 | 基础 | 新增 |
| T07 | [07E17 · 课程表 II](../../labs/chapter-07/exercise/E-07-17-course-schedule-ii/README.md) | 7.2 | 基础 | 新增 |
| T08 | [07E18 · 找到最终的安全状态](../../labs/chapter-07/exercise/E-07-18-eventual-safe-states/README.md) | 7.2 | 进阶 | 新增 |
| T09 | [07E19 · 最大食物链计数](../../labs/chapter-07/exercise/E-07-19-food-chain-count/README.md) | 7.2 | 进阶 | 新增 |
| T10 | [07E20 · 并行课程 III](../../labs/chapter-07/exercise/E-07-20-parallel-courses/README.md) | 7.2 | 挑战 | 新增 |
| T11 | [07E21 · 关键路径分析（AOE 网）](../../labs/chapter-07/exercise/E-07-21-critical-path/README.md) | 7.2 | 挑战 | 新增 |
| T12 | [07E04 · 最小生成树](../../labs/chapter-07/exercise/E-07-04-minimum-spanning-tree/README.md) | 7.3 | 基础 | 保留 |
| T13 | [07E22 · 最低成本连通所有城市](../../labs/chapter-07/exercise/E-07-22-connect-cities/README.md) | 7.3 | 基础 | 新增 |
| T14 | [07E23 · 连接所有点的最小费用](../../labs/chapter-07/exercise/E-07-23-connect-points/README.md) | 7.3 | 进阶 | 新增 |
| T15 | [07E24 · 最小体力消耗路径](../../labs/chapter-07/exercise/E-07-24-minimum-effort-path/README.md) | 7.3 | 进阶 | 新增 |
| T16 | [07E07 · Dijkstra 逐轮推演](../../labs/chapter-07/exercise/E-07-07-dijkstra-trace/README.md) | 7.4 | 入门 | 保留 |
| T17 | [07E08 · 朴素 Dijkstra 与路径还原](../../labs/chapter-07/exercise/E-07-08-dijkstra-matrix-path/README.md) | 7.4 | 基础 | 保留 |
| T18 | [07E09 · 网络延迟时间](../../labs/chapter-07/exercise/E-07-09-network-delay-time/README.md) | 7.4 | 基础 | 保留 |
| T19 | [07E11 · Bellman-Ford 与负环](../../labs/chapter-07/exercise/E-07-11-bellman-ford-negative/README.md) | 7.4 | 基础 | 保留 |
| T20 | [07E12 · Floyd 全源最短路径](../../labs/chapter-07/exercise/E-07-12-floyd-all-pairs/README.md) | 7.4 | 基础 | 保留 |
| T21 | [07E10 · 紧急救援](../../labs/chapter-07/exercise/E-07-10-emergency-rescue/README.md) | 7.4 | 进阶 | 保留 |
| T22 | [07E25 · 虫洞（Wormholes）](../../labs/chapter-07/exercise/E-07-25-wormholes/README.md) | 7.4 | 进阶 | 新增 |
| T23 | [07E26 · A* 网格寻路](../../labs/chapter-07/exercise/E-07-26-astar-grid/README.md) | 7.5 | 进阶 | 新增 |
| T24 | [07E27 · 启发式函数有效性判定](../../labs/chapter-07/exercise/E-07-27-heuristic-validation/README.md) | 7.5 | 进阶 | 新增 |
| T25 | [07E28 · 八数码问题（A*）](../../labs/chapter-07/exercise/E-07-28-eight-puzzle/README.md) | 7.5 | 挑战 | 新增 |
| T26 | [07E06 · BFS 二分图判定](../../labs/chapter-07/exercise/E-07-06-bfs-bipartite/README.md) | 7.6 | 基础 | 保留 |
| T27 | [07E29 · 二分图最大匹配（匈牙利）](../../labs/chapter-07/exercise/E-07-29-bipartite-matching/README.md) | 7.6 | 进阶 | 新增 |
| T28 | [07E30 · 飞行员配对方案](../../labs/chapter-07/exercise/E-07-30-pilot-pairing/README.md) | 7.6 | 进阶 | 新增 |
| T29 | [07E31 · 最大流（Edmonds-Karp）](../../labs/chapter-07/exercise/E-07-31-edmonds-karp/README.md) | 7.6 | 挑战 | 新增 |
| T30 | [07E32 · 最小费用最大流](../../labs/chapter-07/exercise/E-07-32-min-cost-max-flow/README.md) | 7.6 | 挑战 | 新增 |

各节题量为 5 / 6 / 4 / 7 / 3 / 5。按清单逐行难度计算：入门 3、基础 10、进阶 12、挑战 5；原清单末尾“基础 11、挑战 4”的汇总与逐行标注不符，本次采用逐行标注。

补充练习：[07E02 连通分量](../../labs/chapter-07/exercise/E-07-02-connected-components/README.md)、[07E03 有向图环检测](../../labs/chapter-07/exercise/E-07-03-directed-cycle-detection/README.md)。07E03 保留“有环输出 YES”的原接口；T06/07E16 使用“可完成课程输出 YES”，避免把旧用户程序的判定语义翻转。

## 文章重编与现有链接

新清单的节编号与当前文章标题并不同步。这里只连接真实存在的文章；未来上传新文章后按下表替换链接，并运行内容与产物检查，不能预先添加失效地址。

| 新规划 | 当前可以阅读的文章 |
| --- | --- |
| 7.1 DFS 与欧拉图 | [当前 7.1 DFS 与 BFS](../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md) |
| 7.2 拓扑排序与关键路径 | 新文章尚未上传；题面提供独立完成所需合同与步骤 |
| 7.3 最小生成树 | [当前 7.2 最小生成树](../../content/chapter-07-graph-traversal/02-minimum-spanning-tree.md) |
| 7.4 最短路径 | [当前 7.3 最短路径](../../content/chapter-07-graph-traversal/03-shortest-path.md) |
| 7.5 A* | [当前 7.4 A* 寻路可视化](../../content/chapter-07-graph-applications/04-astar-visualization.md) |
| 7.6 匹配与流 | 新文章尚未上传；以二分图染色为前置，题面明确增广合同 |

## 题源核对与改编

核对日期 2026-09-14。下列来源是题目主题/语义依据；题面、C++ 和数据由本课程编写，课程输入输出、边界与确定性规则以各 Lab README 为准。

- T04：参考 [P1636](https://www.luogu.com.cn/problem/P1636)，原题求最少笔画数，课程版仅判定一笔欧拉回路/路径。
- T05：清单中的 POJ 1392 错配。[POJ 官方索引](https://poj.org/searchproblem?field=source&key=N) 对应标题为 Ouroboros Snake。本次按七桥题意独立构建，不标成该 POJ 原题。
- T06/T07/T08：[207](https://leetcode.cn/problems/course-schedule/)、[210](https://leetcode.com/problems/course-schedule-ii/description/)、[802](https://leetcode.cn/problems/find-eventual-safe-states/)。函数题转 stdio；T07 要求字典序最小，T08 显式输出数量以区分空答案。
- T09：[P4017](https://www.luogu.com.cn/problem/P4017)，保留模数 80112002 和被吃→捕食者方向，补充 m=0/孤立点语义。
- T10：[2050](https://leetcode.cn/problems/parallel-courses-iii/)，保持课程编号从 1 开始、DAG、无限并行。
- T13：[1135](https://leetcode.cn/problems/connecting-cities-with-minimum-cost/) 题面需要会员；只核对到标题，不声称完整核验原题。采用课程自述合同并明示零权、重边与权重范围扩展。
- T14/T15：[1584](https://leetcode.cn/problems/min-cost-to-connect-all-points/)、[1631](https://leetcode.cn/problems/path-with-minimum-effort/)，分别为曼哈顿 MST 与最小瓶颈路径，不能把目标函数混成路径和。
- T22：[POJ 3259](https://poj.org/problem?id=3259) 访问失败；按清单题意保留署名，完整列出多组输入、双向道路、单向虫洞、全图负环合同，待人工复核来源。
- T25：[P1379](https://www.luogu.com.cn/problem/P1379)，目标是 123804765，课程扩展无解时输出 -1。
- T27：[AcWing 861](https://www.acwing.com/problem/content/863/) 需要登录；采用独立模板题面，不声称逐字核验原文。
- T28：[P2756](https://www.luogu.com.cn/problem/P2756)，固定 DFS 增广顺序与输出排序；无配对改为 0。
- T30：[P3381](https://www.luogu.com.cn/problem/P3381)，采用教学规模与明确无负费用环约束，支持负费用边。参考解先最大化流量，再最小化费用。
- T03/T11/T23/T24/T29 为课程原创/经典模板；十道既有题沿用其 README 中的题源说明。

## 测试与独立核验

新增 20 题各有 20 个测试点，每点 5 分，包含 sample/normal/boundary/regression/stress。使用固定随机种子补充结构差异，不以大量重复随机数据代替定向反例；每份 README 列出测试点名称。非法输入仅在题面定义行为时测试。

| 题组 | 独立答案依据 | 必须覆盖的风险 |
| --- | --- | --- |
| 边分类 | 递归 DFS 时间区间，与显式栈实现对照 | 前向/横叉、重边、自环、森林 |
| 欧拉图/七桥 | 并查集连通性、度数；另检查路线边多重集 | 孤立点、两个独立环、奇度、每座桥只走一次 |
| 拓扑与 DAG | DFS 判环、前驱集合扫描、反向依赖 DP | 非连通环、动态字典序、所有源/汇、取模 |
| AOE | 最长前缀+活动+最长后缀=全局工期 | 多源多汇、短分量余量、零权、64 位 |
| MST/瓶颈 | Prim↔Kruskal；瓶颈用 minimax Dijkstra | 重边、不连通、等权、错误距离、总费用溢出 |
| 虫洞/启发式 | Floyd 距离/负对角线 | 非源点分量负环、方向、零权、不可达点无穷语义 |
| 网格/八数码 | 无启发式最短路；目标反向完整 BFS 的 181440 个可达状态 | 障碍端点、绕路、奇偶、特殊目标、最深状态 |
| 匹配 | 转单位容量网络，用 Dinic 求最优数量；校验方案合法性 | 贪心失效、重新配对、Hall 缺陷、固定遍历 |
| 最大流 | Dinic；小图再枚举所有 s-t 割 | 撤销旧流、平行/反向输入边、零容量、大流量 |
| 费用流 | 小图枚举每条边的整数流并检验守恒；规模用独立通道闭式公式 | 负费用、反向残量重配、先最大流、乘积溢出 |

作者命令（仓库根目录）：

```powershell
python packages/course-authoring/ch07/check-ch07-exercises.py
python packages/course-authoring/ch07/check-ch07-exercises.py --solutions --mutations
python packages/course-authoring/ch07/check-ch07-exercises.py --write
python packages/course-authoring/ch07/check-ch07-exercises.py --lab 32 --solutions --mutations
```

不带 --write 时只核对现有输入、LF 期望、分值和 oracle 一致性；--write 才重建指定新题测试文件。--solutions 编译并逐例对照，--mutations 为每题注入一个典型错误，必须至少被一个测试点检出。作者检查需要 Python 3.10+；编译检查需要 clang++/g++，可通过 CXX 指定。报告与可执行文件写入 .lab-cache/ch07-audit/，不进入提交。学习者只需标准 Lab CLI，无需 Python。

继续使用 `pnpm lab verify <lab-path>` 检验官方评分入口：参考满分、starter 可编译非满分、期望文件稳定。20 题独立 oracle 全过不能代替全章 CLI、站点与人工知识 Review。
