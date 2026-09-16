# Ch7 图算法代码题合同

## 1. Scope / Trigger

新增或修改 Ch7 Program、题集顺序、测试数据、作者 oracle 或文章练习入口时适用。通用合同见 [labs.md](labs.md) 与 [lab-tooling.md](lab-tooling.md)，完整映射见 [Ch7 题源清单](../../../docs/ch07-exercise-sources.md)。

## 2. Signatures

```powershell
python scripts/check-ch07-exercises.py
python scripts/check-ch07-exercises.py --solutions --mutations
python scripts/check-ch07-exercises.py --write
python scripts/check-ch07-exercises.py --lab 30 --solutions --mutations
pnpm run test:ch07
pnpm lab:verify -- labs/chapter-07/exercise/E-07-30-min-cost-max-flow
```

作者端需要 Python 3.10+；编译选项需要 GCC/Clang（可用 CXX 设置）。学生评分仍只消费静态 tests/cases.json 与 .in/.out，不引入 Python 依赖。

## 3. Contracts

- 2026-09-16 维护者明确授权按 guide 一次性重编号：T01–T30 对应 07E01–07E30，order=101..130。目录、labId、标题与学习顺序一致；删除旧连通分量计数、有向图环检测。迁移记录见 docs/ch07-exercise-order.md。后续新增仍遵守稳定 ID 默认规则，不自动重排。
- 新节 7.2/7.6 文章尚未上传，当前 MST/最短路/A* 仍分别是文章 7.2/7.3/7.4。练习页的规划节与现存文章标题须区分，不构造失效链接。
- 教学页面链接学习清单时使用 content/chapter-07-graph-traversal/00-exercise-guide.md；docs/ch07-exercise-sources.md 仅为仓库维护入口，因 docs/** 被构建排除，不能直接作为学生页面链接目标。
- 20 道新题各至少 20 点、权重和 100，含 sample/normal/boundary/regression/stress，所有数据在 README 范围内；不得以非法输入反例检验未定义行为。
- 07E03：DFS 从 0 起并按编号补扫森林，邻接按 (终点,边号)；自环为 BACK，平行边分别分类。
- 07E01 仍教授递归 DFS，但深链在 Windows 默认栈上可能溢出。参考解递归深度 256 后用等价显式栈帧完成子树；保留原有深链测试，不依赖操作系统专属栈配置。
- 07E04/05：连通性仅看非零度点，自环度数+2；无边有零长度回路。路径起点为较小奇度点；07E05 规范化 Hierholzer 后验验证 m+1 点和边多重集。
- 07E07：每步选择当前最小零入度顶点。07E28：固定 DFS 增广顺序并按左端点排序；最大数量由独立网络流检查。任意方案题改成唯一输出时必须在题面明示。
- 07E09：源到汇的完整链计数模 80112002，孤立点计 1。07E11：所有汇事件使用全局工期，禁止每个分量单算最迟时刻。
- 07E22 检测全图负环，不与既有 07E19 的源点可达负环语义混淆。07E24 不可达距离视为无穷，同时单独要求 h(t)=0 和全图每条有向边的一致性。
- 07E25 目标固定 123804765，0 不计入启发式，以字符串读入；课程扩展无解=-1。
- 07E29/30 每条输入边有独立残量反向边；费用取相反数；64 位存容量、流量、路径时刻和费用乘积。费用流保证初始无负费用环，先最大流再最小费用。
- 只有 --write 写入跟踪的测试文件；普通检查必须发现输入或期望漂移。期望以独立 oracle/性质/枚举生成，禁止调用 C++ solution 写答案后又把满分当作独立证据。

## 4. Validation & Error Matrix

| 条件 | 必须结果 |
| --- | --- |
| T 映射缺项、编号/题目映射或 order 错 | test:ch07 失败 |
| 新题样例/期望/分值漂移 | test:ch07 或作者 checker 失败 |
| 每题错误变体未被任何用例识别 | --mutations 失败并补充定向反例 |
| 参考解不满分、学生代码不能编译或满分 | lab:verify 失败 |
| 欧拉路线漏重边、匹配方案非最优 | 独立性质校验失败 |
| 引用未上传文章 | 内容/静态产物检查失败，不用占位页绕过 |

## 5. Good / Base / Bad Cases

- Good：有两个独立偶度环的欧拉图反例；有终端出口的环仍判不安全；增广必须撤销旧流的网络。
- Base：结构简单的单点、空边图仍纳入边界测试。
- Bad：只跑样例和全连通图；把 m=0 当错误输入，但题面允许 m=0。

## 6. Tests Required

先运行 test:ch07 与作者独立 oracle，再运行全部 30 道 Program 的 lab:verify；标准 pnpm test 完成内容、类型、lint、发现、构建、产物链接。抽查最终站点从 Labs 入口到新增题的真实导航。--mutations 保留每题被杀死的具体测试点。输出 .out 必须逐字节为 LF，README 样例检查先规范 CRLF/LF。

## 7. Wrong vs Correct

Wrong：令所有顶点的启发式都不超过某个大常数，即宣称一致；或将“可采纳”直接等同“一致”。

Correct：边 0→1 权 1、1→2 权 1，终点 2，h=[2,0,0] 可采纳但不一致，因为 2>1+0。此类反例必须在测试中明确出现。

作者 checker 对外接受新编号；内部 fixture 编号冻结，仅用于保留随机种子、oracle 与变异体。不得因重编号改写既有测试数据。
