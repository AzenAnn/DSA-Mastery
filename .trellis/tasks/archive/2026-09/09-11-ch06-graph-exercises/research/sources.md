# Ch6 题源研究记录

记录日期：2026-09-11。研究 agent 只读访问题源，主会话收敛合同。未直接成功访问的官方页面不得记作“官方核验通过”。README 使用中文重述和验证后的本地样例，作者来源文档保留改编差异。

## 课程来源

- [6.2 图的存储结构](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/02-graph-storage/)，本地权威稿为 `content/chapter-06-graph-foundations/02-graph-storage.md`。
- [6.3 图的遍历与连通性](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/03-graph-traversal-connectivity/)，本地权威稿为 `content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md`。
- 用户第 5、6、7、12、13、14、20 题为据此设计的课程练习，不宣称存在独立的外部 OJ 题面。

## 洛谷：已直接核验

| 来源 | 实际标题 | 约束 |
| --- | --- | --- |
| [T471612](https://www.luogu.com.cn/problem/T471612) | 图的存储 (邻接矩阵) | `1 <= n <= 1000`，`1 <= m <= 100000` |
| [T419391](https://www.luogu.com.cn/problem/T419391) | 【数据结构】图的存储 | 同上 |

两题均为 1-based 简单无向图，输入 n m 和 m 条边，输出 n 行邻接矩阵后再输出 n 行邻接表，每行度数加升序邻居。源题均没有相邻查询，且均非仅输出邻接表。课程分别增加查询、移除附带表输出，以及保留邻接表专项并放宽规模；详细变更见 design.md。

共同原题样例：n=5，边 `(1,2),(2,3),(3,5),(1,3),(3,4)`；邻接表依次为 `2 2 3`、`2 1 3`、`4 1 2 4 5`、`1 3`、`1 3`。矩阵由这些边唯一确定。原站限制 2 秒、256 MiB；本地评测限制独立声明，不假装实现内存沙箱。

## LeetCode：镜像核验

官方 1791 页面触发 Cloudflare JavaScript challenge。以下细节实际读取自 doocs/leetcode 的 README_EN.md，均保留对应官方链接。引用题源时使用用户指定的官方 URL；作者证据注明镜像核验状态。

镜像公共前缀：`https://raw.githubusercontent.com/doocs/leetcode/main/solution/`。

| 题号 | 官方 URL | 精确镜像路径 |
| --- | --- | --- |
| 1791 | https://leetcode.com/problems/find-center-of-star-graph/ | `1700-1799/1791.Find%20Center%20of%20Star%20Graph/README_EN.md` |
| 997 | https://leetcode.com/problems/find-the-town-judge/ | `0900-0999/0997.Find%20the%20Town%20Judge/README_EN.md` |
| 1615 | https://leetcode.com/problems/maximal-network-rank/ | `1600-1699/1615.Maximal%20Network%20Rank/README_EN.md` |
| 1971 | https://leetcode.com/problems/find-if-path-exists-in-graph/ | `1900-1999/1971.Find%20if%20Path%20Exists%20in%20Graph/README_EN.md` |
| 841 | https://leetcode.com/problems/keys-and-rooms/ | `0800-0899/0841.Keys%20and%20Rooms/README_EN.md` |
| 547 | https://leetcode.com/problems/number-of-provinces/ | `0500-0599/0547.Number%20of%20Provinces/README_EN.md` |
| 2316 | https://leetcode.com/problems/count-unreachable-pairs-of-nodes-in-an-undirected-graph/ | `2300-2399/2316.Count%20Unreachable%20Pairs%20of%20Nodes%20in%20an%20Undirected%20Graph/README_EN.md` |
| 2685 | https://leetcode.com/problems/count-the-number-of-complete-components/ | `2600-2699/2685.Count%20the%20Number%20of%20Complete%20Components/README_EN.md` |

### 关键边界

- 1791 最少 3 个顶点，保证为星型图；997 允许 n=1/m=0，此时法官为 1。
- 1615 最少 2 个顶点，城市间道路只计一次；1971 允许 n=1 和起终点相同，长度为 0 的路径有效。
- 841 最少 2 个房间，总钥匙数 `1..3000`，每个房间内编号互异，允许钥匙指向所在房间。不要把总钥匙数 0 的数据误当原题边界。
- 547 是对称矩阵，主对角线全为 1；n=1 的结果为 1。
- 2316 计算无序点对，最大空图答案为 4,999,950,000；使用 64 位整数。
- 2685 最多 50 个顶点，无边单点分量也是完全分量；完全度判定依赖无重边自环的简单图约束。

### 可用于本地序列化的已核验样例

| 题号 | 参数 | 结果 |
| --- | --- | --- |
| 1791 | edges=[[1,2],[2,3],[4,2]] | 2 |
| 997 | n=3, trust=[[1,3],[2,3]] | 3 |
| 1615 | n=4, roads=[[0,1],[0,3],[1,2],[1,3]] | 4 |
| 1971 | n=3, edges=[[0,1],[1,2],[2,0]], source=0, destination=2 | true |
| 841 | rooms=[[1],[2],[3],[]] | true |
| 547 | matrix=[[1,1,0],[1,1,0],[0,0,1]] | 2 |
| 2316 | n=7, edges=[[0,2],[0,5],[2,4],[1,6],[5,4]] | 14 |
| 2685 | n=6, edges=[[0,1],[0,2],[1,2],[3,4]] | 3 |

## CSES：官方访问受限

- [1666 Building Roads](https://cses.fi/problemset/task/1666/)
- [1682 Flight Routes Check](https://cses.fi/problemset/task/1682/)
- [1683 Planets and Kingdoms](https://cses.fi/problemset/task/1683/)

官方 HTTPS 及文本代理在有限次数尝试后仍超时，完整官方约束与样例尚未直接核验。VJudge 尝试重定向到首页；猜测的其他题解路径返回 404，不作为证据。

已访问 [USACO Guide: Flight Routes Check](https://usaco.guide/problems/cses-1682-flight-routes-check/solution)，HTTP 200，支持 1-based 有向图、YES/NO 与不可达有序点对，以及从顶点 1 在正反图各遍历一次的方法。该题解复杂度标注 O(N)，课程应按图输入写为 O(n+m)。

Building Roads 的任务语义为以最少道路连接全部无向分量；Planets and Kingdoms 为 SCC 划分。规划采用已明确的本地输入规模、规范化答案和自行构造样例；未核实的官方约束不作为宣称。规范化选取的是有效答案子集，无须改动共享判题器。后续官方来源可达时再补充比对，不改变当前合同。
