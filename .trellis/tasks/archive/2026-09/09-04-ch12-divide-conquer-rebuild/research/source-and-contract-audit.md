# Ch12 分治与递归：资料、现状与题目合同审计

## 1. 审计范围

本文件记录 Ch12 重构在进入实现前核对过的事实，避免文章目录、题目协议和删除范围只存在于对话中。

- 教学资料：OI Wiki 分治、Hello 算法递归与分治章节，以及用户给出的两篇中文补充文章。
- 仓库现状：`content/chapter-12-divide-conquer-recursion/`、`labs/chapter-12/`、`.vitepress/content-index.ts`。
- 题目来源：8 道洛谷题和 8 道 LeetCode 题的正式题面。
- 工具边界：Lab Schema v1 的 Program 标准输入输出判题，仅支持 `exact`、`tokens`、`float` 比较，不支持 SPJ。

## 2. 教学资料综合

### 2.1 资料来源

- [OI Wiki：分治](https://oi-wiki.org/basic/divide-and-conquer/)
- [Hello 算法：迭代与递归](https://www.hello-algo.com/chapter_computational_complexity/iteration_and_recursion/#3)
- [Hello 算法：分治](https://www.hello-algo.com/chapter_divide_and_conquer/)
- [Hello 算法：分治算法](https://www.hello-algo.com/chapter_divide_and_conquer/divide_and_conquer/#1213)
- [知乎：递归、迭代与分治法](https://zhuanlan.zhihu.com/p/659420646)
- [博客园：分治算法](https://www.cnblogs.com/RioTian/p/13598642.html)

### 2.2 可转化为课程结构的共同主线

1. 递归首先是一个函数合同：参数描述当前子问题，边界给出最小问题答案，规模度量严格下降，返回值能被上一层使用。
2. 调用栈回答“程序怎样执行”，递归树回答“产生多少子问题和多少工作”；两者不能混为一谈。
3. 分治不是“代码里出现递归”，而是 Divide、Conquer、Combine 三个逻辑阶段；不同算法的主要工作可能落在分解或合并阶段。
4. 正确性需要同时证明终止性、子问题合同和合并保持性；复杂度需要分别计算总工作量、最大递归深度和额外缓冲区。
5. 方法选择必须与迭代、动态规划、回溯区分：重叠子问题偏向记忆化/DP，枚举选择空间偏向回溯，可独立切分并合并偏向分治。

### 2.3 现有正文缺口

当前目录只有 5 篇草稿，且存在以下需要重写的问题：

- `01-recursion-foundations.md` 把函数合同、调用栈和算法例子压在同一篇，读者难以区分“怎么定义”与“怎么执行”。
- `02-divide-and-conquer-patterns.md` 把汉诺塔称为“三元分治”，但它实际上是两次规模为 `n-1` 的递归调用加一次常数移动，即 `T(n)=2T(n-1)+Theta(1)`。
- `03-correctness-complexity.md` 暗示使用主定理前要先判断规模是否整除；更准确的说法是取整通常不改变渐近阶，关键是递推是否满足主定理的结构与正则条件。
- `01-recursion-foundations.md` 把归并排序称为“后续章节”，但 Ch11 已在 Ch12 之前，应改成回看并重新解释 Ch11 算法。
- `00-overview.md` 与 `04-boundaries-with-other-strategies.md` 写死“2 个理论 Lab + 13 个编程 Lab”，与本次 16 题替换目标冲突。
- `.vitepress/content-index.ts` 中 Ch12 尚未声明 `lessonSources` 和 `autoLabChapter: 12`，正文与 Lab 不会完整进入统一课程导航。

## 3. 旧 Lab 删除审计

### 3.1 当前内容

- Theory：`12T01`、`12T02`，共 2 个 Quiz。
- Exercise：`12E01`～`12E13`，共 13 个 Program。
- Project：空。
- 所有现有 Ch12 README 的 `status` 都是 `draft`。

### 3.2 外部引用

对 15 个旧目录 slug 执行仓库级精确搜索，排除 Ch12 正文与 Ch12 Lab 自身后，未发现其他源码引用。课程索引也尚未显式收录 Ch12。

### 3.3 删除结论

用户要求“删掉当前已有的 Lab，并替换为 16 道指定题”。结合全部旧内容仍为草稿，可删除 2 个 Theory 与 13 个 Exercise，并将 `12E01`～`12E13` 重新分配给新的草稿题；新增题继续使用 `12E14`～`12E16`。删除后：

- `theory/` 只保留 `.gitkeep`；
- `exercise/` 包含 16 个 Program；
- `project/` 只保留 `.gitkeep`；
- `autoLabChapter: 12` 让网站显示 Theory/Exercise/Project 三类，其中空分类没有虚假链接。

旧内容删除前必须在 `docs/CLEANUP_REPORT.md` 记录目标、替代物、引用检查和 Git 回滚方式。新目录先逐题通过独立 `lab:validate` / `lab:verify`，再删除旧目录，最后运行全仓验证。

## 4. 正式题目来源与本地化合同

题面只做原创转述并保留正式来源链接；不复制题解或作者代码。参考实现使用原创 C++17。

| 新 ID | 来源 | 核心约束 / 学习目标 | 本地 stdin/stdout 合同与比较模式 |
| --- | --- | --- | --- |
| `12E01` | [洛谷 P1464 Function](https://www.luogu.com.cn/problem/P1464) | 多组 `int64` 三元组；递归状态被压缩到 `1..20`；记忆化 | 沿用原题多行输入，以 `-1 -1 -1` 结束；逐行固定格式；`exact` |
| `12E02` | [洛谷 P1010 幂次方](https://www.luogu.com.cn/problem/P1010) | `1 <= n <= 20000`；递归表示指数 | 沿用原题；无空格规范表达式；`exact` |
| `12E03` | [洛谷 P1498 南蛮图腾](https://www.luogu.com.cn/problem/P1498) | `1 <= n <= 10`；递归分形；最大约 2 MiB 输出 | 沿用原题图案；保留行结构，忽略行尾空白；`exact`，提高 `outputKb` |
| `12E04` | [LeetCode 50 Pow(x, n)](https://leetcode.com/problems/powx-n/) | 指数覆盖 `INT_MIN`；二分幂；浮点误差 | 输入 `x n`，输出数值；`float`，明确绝对/相对误差 |
| `12E05` | [洛谷 P5461 赦免战俘](https://www.luogu.com.cn/problem/P5461) | `n <= 10`；四分递归；大矩阵输出 | 沿用原题 01 矩阵；`exact`，提高 `outputKb` |
| `12E06` | [洛谷 P3612 Secret Cow Code](https://www.luogu.com.cn/problem/P3612) | 初始串长 `<= 30`，位置 `<= 10^18`；只回溯索引，不构造长串 | 沿用原题；单字符输出；`tokens` |
| `12E07` | [洛谷 P1923 求第 k 小的数](https://www.luogu.com.cn/problem/P1923) | 最小值是第 `0` 小；`n` 可达 `5 * 10^6`；练习 quickselect | 沿用原题；禁止 `nth_element`；单整数；`tokens` |
| `12E08` | [LeetCode 912 Sort an Array](https://leetcode.com/problems/sort-an-array/) | `n <= 5 * 10^4`；要求 `O(n log n)` 且不用内置排序 | 输入 `n` 和数组，输出升序数组；`tokens` |
| `12E09` | [LeetCode 427 Construct Quad Tree](https://leetcode.com/problems/construct-quad-tree/) | 边长为 `2^x`，`x <= 6`；区域一致性与四分结构 | 输入 `n` 和网格；输出前序 token：内部结点 `I`、叶子 `L0/L1`，孩子顺序 TL/TR/BL/BR；`tokens` |
| `12E10` | [洛谷 P1228 地毯填补问题](https://www.luogu.com.cn/problem/P1228) | `1 <= k <= 10`；原题为 SPJ，多种覆盖顺序均可能合法 | 保留输入与三元组语义；规定“先中心地毯，再按 TL/TR/BL/BR 递归”的规范输出；`exact`，提高时间/输出上限 |
| `12E11` | [洛谷 P1908 逆序对](https://www.luogu.com.cn/problem/P1908) | `n <= 5 * 10^5`；归并阶段计数；答案需 64 位 | 沿用原题；单整数；`tokens` |
| `12E12` | [LeetCode 241 Different Ways to Add Parentheses](https://leetcode.com/problems/different-ways-to-add-parentheses/) | 表达式长 `<= 20`；分割点 + 笛卡尔积；结果可重复 | 输入表达式；将所有结果按非递减顺序输出，保留重复值；`tokens` |
| `12E13` | [LeetCode 932 Beautiful Array](https://leetcode.com/problems/beautiful-array/) | `1 <= n <= 1000`；奇偶映射保持性质；原题接受任意合法解 | 输入 `n`；规定递归先生成奇数映射、再生成偶数映射的规范数组；`tokens` |
| `12E14` | [LeetCode 493 Reverse Pairs](https://leetcode.com/problems/reverse-pairs/) | `n <= 5 * 10^4`，值覆盖 32 位；比较 `a[i] > 2*a[j]` 防溢出 | 输入 `n` 和数组；输出计数；`tokens` |
| `12E15` | [LeetCode 315 Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | `n <= 10^5`；在归并中维护原下标与已越过右元素数 | 输入 `n` 和数组；输出每个位置的计数；`tokens` |
| `12E16` | [LeetCode 327 Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/) | `n <= 10^5`；64 位前缀和；归并窗口计数 | 输入首行 `n lower upper`，次行数组；输出计数；`tokens` |

## 5. 测试与判题风险

1. `12E03`、`12E05`、`12E10` 的输出规模超过默认 1 MiB 的可能性高，manifest 必须为它们单独提高 `outputKb`；压力用例仍需控制本地总执行时间。
2. `12E04` 必须覆盖 `n = 0`、负指数、`INT_MIN`、接近 0 的底数和容差边界，避免对 `-n` 的 32 位溢出。
3. `12E09` 通过规范前序编码消除 LeetCode 层序序列化中“内部结点 val 任意”的歧义。
4. `12E10` 不能声称与洛谷 SPJ 等价；README 必须明确这是为了本地固定 oracle 增加的输出顺序约束。测试除对比输出外，作者还需用独立覆盖检查验证参考答案没有重叠、漏格或覆盖公主格。
5. `12E12` 对结果排序但保留重复项，避免把不同括号方案得到的相同数值错误去重。
6. `12E13` 的固定输出只验证指定构造。作者验收还需独立检查它是 `1..n` 的排列且不存在违例三元组，不能只相信 oracle。
7. `12E14`、`12E16` 的比较与前缀和使用 64 位中间值；`12E11` 的总逆序对数也使用 64 位。

## 6. 采用的仓库规范

- `.trellis/spec/content/frontmatter-and-routing.md`
- `.trellis/spec/content/labs.md`
- `.trellis/spec/content/lab-tooling.md`
- `.trellis/spec/frontend/vitepress-development.md`
- `.trellis/spec/frontend/vitepress-architecture.md`
- `.trellis/spec/quality/cleanup-safety.md`
- `.trellis/spec/quality/validation-and-pages.md`
- `.trellis/spec/quality/git-and-pr.md`
- `docs/THEORY_DOC_STYLE_GUIDE.md`
- `docs/LAB_AUTHORING_GUIDE.md`
- `C:/Users/28962/.codex/skills/algo/references/cpp_style.md`

## 7. 实施前基线（2026-09-04）

在未修改 Ch12 产品代码前完成以下检查：

| 检查 | 结果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通过，依赖已是最新锁定状态；pnpm 11.1.1 |
| `pnpm run validate` | 通过；内容校验发现 79 篇教材、220 个 Lab、215 个新式 manifest、571 道交互选择题；TypeScript 与 ESLint 通过 |
| `pnpm run test:lab-tools` | 通过；41 项中 40 通过、1 项因当前 Windows 策略无法创建符号链接而按设计跳过、0 失败 |
| `pnpm run test:lab-docs` | 通过；Lab 作者指南中的 JSON、命令、Golden Lab 与 pnpm/Make 接口一致 |

这些结果证明实施前的内容索引、类型检查和 Lab 工具基线健康。改造后的同类失败应首先视为本任务回归；最终仍需按 `implement.md` 运行完整 `pnpm test`、16 题 verify 和 Pages 测试。
