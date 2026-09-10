import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const LAB_ROOT = path.join(ROOT, 'labs', 'chapter-14', 'exercise')
const WRITE = process.argv.includes('--write')

const catalog = [
  {
    title: '爬楼梯', slug: 'climbing-stairs', article: '01-state-design.md', source: 'LeetCode 70', sourceUrl: 'https://leetcode.cn/problems/climbing-stairs/', difficulty: '入门', duration: '30～45 分钟',
    description: '用一维计数模型理解“最后一步”如何决定状态转移。',
    statement: '一段楼梯共有 n 级。每次只能向上走 1 级或 2 级，求恰好到达第 n 级的不同走法数。两种走法只要任意一步的步长不同，就视为不同。',
    input: '一行一个整数 `n`。', output: '输出恰好到达第 `n` 级的走法数。', constraints: '`1 ≤ n ≤ 45`。',
    state: '`dp[i]` 表示恰好站在第 `i` 级时的走法数。', decision: '最后一步走 1 级，或最后一步走 2 级。', transition: '`dp[i] = dp[i-1] + dp[i-2]`。', base: '`dp[0]=1, dp[1]=1`。', order: '从小到大枚举楼层。', answer: '`dp[n]`。', complexity: '时间 `O(n)`，空间 `O(n)`；滚动变量可降到 `O(1)`。', trap: '不要把 `dp[0]` 理解成“没有方案”；它代表尚未迈步的空方案。'
  },
  {
    title: '最小花费爬楼梯', slug: 'min-cost-climbing-stairs', article: '01-state-design.md', source: 'LeetCode 746', sourceUrl: 'https://leetcode.cn/problems/min-cost-climbing-stairs/', difficulty: '入门', duration: '35～50 分钟',
    description: '练习把“支付台阶费用”和“到达楼顶”分离建模。',
    statement: '给定 n 级带费用的台阶。踩上第 i 级要支付 cost[i]，你可以从第 0 级或第 1 级开始，每次上 1 级或 2 级。楼顶位于第 n 级且无需付费，求到达楼顶的最小总费用。',
    input: '第一行 `n`，第二行 `n` 个非负整数 `cost[i]`。', output: '输出到达楼顶的最小费用。', constraints: '`2 ≤ n ≤ 1000`，`0 ≤ cost[i] ≤ 999`。',
    state: '`dp[i]` 表示到达位置 `i`（尚未支付该位置费用）的最小总费用。', decision: '从 `i-1` 或 `i-2` 跨到 `i`。', transition: '`dp[i]=min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])`。', base: '`dp[0]=dp[1]=0`。', order: '从 2 递增到 n。', answer: '`dp[n]`。', complexity: '时间 `O(n)`，空间 `O(n)`，可滚动到 `O(1)`。', trap: '费用在离开前一个台阶时结算；楼顶没有 `cost[n]`。'
  },
  {
    title: '数字三角形', slug: 'number-triangle', article: '01-state-design.md', source: '洛谷 P1216', sourceUrl: 'https://www.luogu.com.cn/problem/P1216', difficulty: '基础', duration: '45～60 分钟',
    description: '从父状态有限的三角网格中求一条最大权路径。',
    statement: '给定一个 n 行数字三角形。从顶点出发，每次只能走到下一行相邻的左下或右下位置，求到达最后一行时能取得的最大数字和。',
    input: '第一行 `n`，随后第 i 行给出 i 个整数。', output: '输出一条合法顶到底路径的最大数字和。', constraints: '`1 ≤ n ≤ 1000`，每个数字在 `0..100`。',
    state: '`dp[i][j]` 表示到达第 i 行第 j 个位置的最大和。', decision: '由左上父结点或右上父结点到达。', transition: '`dp[i][j]=a[i][j]+max(dp[i-1][j-1],dp[i-1][j])`，越界父状态忽略。', base: '`dp[0][0]=a[0][0]`。', order: '逐行自上而下。', answer: '最后一行所有状态的最大值。', complexity: '时间 `O(n²)`，空间 `O(n²)`；一维倒序可降到 `O(n)`。', trap: '边缘结点只有一个父状态，不能把不存在的父状态默认为 0 后参与一般数据比较。'
  },
  {
    title: '最大子段和', slug: 'maximum-subarray', article: '01-state-design.md', source: '洛谷 P1115', sourceUrl: 'https://www.luogu.com.cn/problem/P1115', difficulty: '基础', duration: '35～50 分钟',
    description: '用“必须以当前位置结尾”消除连续子段的枚举。',
    statement: '给定一个非空整数序列，选择一段连续且非空的区间，使区间元素和最大，输出这个最大值。',
    input: '第一行 `n`，第二行 `n` 个整数。', output: '输出最大连续子段和。', constraints: '`1 ≤ n ≤ 2×10^5`，`|a[i]| ≤ 10^4`。',
    state: '`dp[i]` 表示必须以 `a[i]` 结尾的最大子段和。', decision: '把 `a[i]` 接到上一段后面，或从 `a[i]` 重新开始。', transition: '`dp[i]=max(a[i],dp[i-1]+a[i])`。', base: '`dp[0]=a[0]`。', order: '从左到右。', answer: '所有 `dp[i]` 的最大值。', complexity: '时间 `O(n)`，空间 `O(1)`。', trap: '答案区间非空；把答案初始化为 0 会在全负数输入上出错。'
  },
  {
    title: '打家劫舍', slug: 'house-robber', article: '01-state-design.md', source: 'LeetCode 198', sourceUrl: 'https://leetcode.cn/problems/house-robber/', difficulty: '入门', duration: '35～50 分钟',
    description: '在相邻选择互斥的约束下练习“选与不选”。',
    statement: '一排房屋各有非负收益。不能同时选择相邻两间房，求可取得的最大总收益；允许一间也不选。',
    input: '第一行 `n`，第二行 `n` 个非负整数。', output: '输出满足相邻互斥条件的最大收益。', constraints: '`1 ≤ n ≤ 100`，单间收益不超过 400。',
    state: '`dp[i]` 表示只考虑前 i 间房时的最大收益。', decision: '不选第 i 间，或选第 i 间并跳过第 i-1 间。', transition: '`dp[i]=max(dp[i-1],dp[i-2]+value[i])`。', base: '`dp[0]=0`，第一间单独处理。', order: '房屋从左到右。', answer: '`dp[n]`。', complexity: '时间 `O(n)`，空间 `O(n)`，可滚动到 `O(1)`。', trap: '状态下标和房屋下标容易错一位，先明确 `dp[i]` 是否包含第 i 间。'
  },
  {
    title: '滑雪', slug: 'skiing', article: '02-memoization.md', source: '洛谷 P1434', sourceUrl: 'https://www.luogu.com.cn/problem/P1434', difficulty: '基础', duration: '55～75 分钟',
    description: '把严格下降关系看作 DAG，并用记忆化搜索复用后缀答案。',
    statement: '给定一张高度矩阵。可以从任意格出发，每一步移动到上下左右相邻且高度严格更低的格子，求最多能经过多少个格子。',
    input: '第一行 `R C`，随后 R 行各 C 个高度。', output: '输出最长严格下降路径包含的格子数。', constraints: '`1 ≤ R,C ≤ 100`，高度在 `0..10000`。',
    state: '`memo[x][y]` 表示从格子 `(x,y)` 出发的最长下降路径长度。', decision: '选择一个更低的四邻格作为下一步。', transition: '`memo[x][y]=1+max(memo[nx][ny])`。', base: '没有更低邻格时答案为 1。', order: 'DFS 按依赖计算；缓存后每格只展开一次。', answer: '所有起点状态的最大值。', complexity: '时间 `O(RC)`，空间 `O(RC)`。', trap: '必须使用严格不等号；平台高原不能相互转移，否则会出现环。'
  },
  {
    title: '挖地雷', slug: 'mine-digging', article: '02-memoization.md', source: '洛谷 P2196', sourceUrl: 'https://www.luogu.com.cn/problem/P2196', difficulty: '进阶', duration: '70～90 分钟',
    description: '在有向无环图上同时求最大权路径并恢复确定答案。',
    statement: '有 n 个地窖，每个地窖有一定数量的地雷；给出若干条编号从小到大的单向通道。选择任意起点并沿通道前进，使经过地窖的地雷总数最大。输出路径和最大总数；若总数并列，输出编号序列字典序最小的路径。',
    input: '第一行 `n`，第二行 n 个地雷数，第三行通道数 `m`，随后 m 行为 `u v`（`u<v`）。', output: '第一行输出路径编号，第二行输出最大地雷总数。', constraints: '`1 ≤ n ≤ 20`，地雷数非负且不超过 300，通道不重复。',
    state: '`best[i]` 表示从 i 出发可取得的最大地雷数，并同时保存对应路径。', decision: '停止在 i，或选择一条 `i→j` 通道继续。', transition: '`best[i]=mine[i]+max(best[j])`，相等时比较完整路径字典序。', base: '出度为 0 时路径只有 i。', order: '按编号从大到小，或记忆化 DFS。', answer: '所有起点中权值最大、再按路径字典序最小者。', complexity: '时间 `O(n+m)` 加路径比较开销，空间 `O(n+m)`。', trap: '只记录前驱而不定义并列规则，会让标准输出依赖遍历顺序。'
  },
  {
    title: '矩阵中的最长递增路径', slug: 'longest-increasing-path', article: '02-memoization.md', source: 'LeetCode 329', sourceUrl: 'https://leetcode.cn/problems/longest-increasing-path-in-a-matrix/', difficulty: '基础', duration: '55～75 分钟',
    description: '用四邻接严格递增关系构造隐式 DAG。',
    statement: '给定整数矩阵，可以从任意格出发，每一步走到上下左右相邻且数值严格更大的格子。求最长路径的格子数。',
    input: '第一行 `m n`，随后 m 行各 n 个整数。', output: '输出最长严格递增路径长度。', constraints: '`1 ≤ m,n ≤ 200`，元素为非负 32 位整数。',
    state: '`memo[x][y]` 表示从 `(x,y)` 出发的最长递增路径。', decision: '选择一个值更大的相邻格。', transition: '`memo[x][y]=1+max(memo[nx][ny])`。', base: '无可走邻格时为 1。', order: '记忆化 DFS 自动遵循数值依赖。', answer: '枚举起点后的最大缓存值。', complexity: '时间 `O(mn)`，空间 `O(mn)`。', trap: '不能简单按坐标顺序做普通网格 DP；依赖方向由数值而不是位置决定。'
  },
  {
    title: '最长上升子序列', slug: 'longest-increasing-subsequence', article: '03-linear-grid.md', source: '洛谷 B3637', sourceUrl: 'https://www.luogu.com.cn/problem/B3637', difficulty: '基础', duration: '45～60 分钟',
    description: '理解子序列不要求连续，以及“以 i 结尾”的经典状态。',
    statement: '给定一个整数序列，删除任意元素但保持剩余元素原有顺序，求严格上升子序列的最大长度。',
    input: '第一行 `n`，第二行 n 个整数。', output: '输出最长严格上升子序列长度。', constraints: '`1 ≤ n ≤ 5000`，元素为正整数且不超过 `10^6`。',
    state: '`dp[i]` 表示以 `a[i]` 结尾的 LIS 长度。', decision: '选择一个更早且更小的 `a[j]` 接在前面。', transition: '`dp[i]=1+max(dp[j])`，其中 `j<i` 且 `a[j]<a[i]`。', base: '每个位置单独成序列，初值 1。', order: 'i 从左到右，j 枚举 i 之前。', answer: '所有 `dp[i]` 的最大值。', complexity: '本 Lab 目标为时间 `O(n²)`、空间 `O(n)`。', trap: '“严格上升”使用 `<`；相等元素不能延长序列。'
  },
  {
    title: '合唱队形', slug: 'choir-formation', article: '03-linear-grid.md', source: '洛谷 P1091', sourceUrl: 'https://www.luogu.com.cn/problem/P1091', difficulty: '基础', duration: '55～70 分钟',
    description: '把双向形态拆成以同一峰值结尾的两个一维 DP。',
    statement: '一排同学按原顺序站立。请移除尽量少的人，使剩余身高先严格上升、再严格下降；峰值可以位于任意位置。输出最少移除人数。',
    input: '第一行 `n`，第二行 n 个身高。', output: '输出最少移除人数。', constraints: '`2 ≤ n ≤ 100`，身高在 `130..230`。',
    state: '`left[i]` 为以 i 结尾的上升长度，`right[i]` 为以 i 开始的下降长度。', decision: '把 i 作为峰值，组合左右两段。', transition: '分别做左右 LIS，峰形长度为 `left[i]+right[i]-1`。', base: '每个位置两侧初值都是 1。', order: 'left 正序，right 逆序。', answer: '`n-max(left[i]+right[i]-1)`。', complexity: '时间 `O(n²)`，空间 `O(n)`。', trap: '峰值被左右两段各计算一次，合并时必须减 1。'
  },
  {
    title: '尼克的任务', slug: 'nick-tasks', article: '03-linear-grid.md', source: '洛谷 P1280', sourceUrl: 'https://www.luogu.com.cn/problem/P1280', difficulty: '进阶', duration: '60～80 分钟',
    description: '从末尾倒推时间轴，区分“可休息”和“必须选任务”。',
    statement: '工作时间为 1..n。若某一时刻没有任务开始，可以休息 1 个单位；若有一个或多个任务在此刻开始，必须选择其中一个并连续工作其持续时间，期间忽略其他开始的任务。求最多休息时间。',
    input: '第一行 `n k`，随后 k 行给出任务的开始时刻和持续时间。', output: '输出最多可休息的时间单位数。', constraints: '`1 ≤ n,k ≤ 10^4`，每个任务结束不晚于 `n+1`。',
    state: '`dp[i]` 表示从时刻 i 到工作结束最多还能休息多久。', decision: '无任务则休息；有任务则从此刻开始选择一个任务。', transition: '无任务：`dp[i]=dp[i+1]+1`；有任务：`dp[i]=max(dp[i+duration])`。', base: '`dp[n+1]=0`。', order: '时刻从 n 递减到 1。', answer: '`dp[1]`。', complexity: '时间 `O(n+k)`，空间 `O(n+k)`。', trap: '有任务开始时不能选择休息；正序 DP 很难知道哪些任务会在未来被忽略。'
  },
  {
    title: '不同路径', slug: 'unique-paths', article: '03-linear-grid.md', source: 'LeetCode 62', sourceUrl: 'https://leetcode.cn/problems/unique-paths/', difficulty: '入门', duration: '30～45 分钟',
    description: '建立最基础的右下网格计数模型。',
    statement: '机器人从 m×n 网格左上角出发，每步只能向右或向下，求到达右下角的路径数。',
    input: '一行两个整数 `m n`。', output: '输出路径总数。', constraints: '`1 ≤ m,n ≤ 100`，保证答案不超过 `2×10^9`。',
    state: '`dp[i][j]` 表示走到格子 `(i,j)` 的路径数。', decision: '最后一步来自上方或左方。', transition: '`dp[i][j]=dp[i-1][j]+dp[i][j-1]`。', base: '起点为 1；首行首列由唯一方向延伸。', order: '逐行或逐列填表。', answer: '右下角状态。', complexity: '时间 `O(mn)`，空间可为 `O(n)`。', trap: '边界初始化应体现可达性，不要让不存在的上方/左方重复贡献。'
  },
  {
    title: '过河卒', slug: 'river-crossing-pawn', article: '03-linear-grid.md', source: '洛谷 P1002', sourceUrl: 'https://www.luogu.com.cn/problem/P1002', difficulty: '基础', duration: '45～60 分钟',
    description: '在网格计数中加入马及其控制点形成的障碍。',
    statement: '卒从坐标 `(0,0)` 出发，只能向右或向上，到达 `(bx,by)`。马位于 `(hx,hy)`，马所在点及一步可跳到的点都不能经过。求卒的路径数。',
    input: '一行四个整数 `bx by hx hy`。', output: '输出合法路径数。', constraints: '四个坐标均在 `0..20`。',
    state: '`dp[x][y]` 表示到达 `(x,y)` 且避开控制点的路径数。', decision: '从左边或下边进入当前格。', transition: '障碍格为 0，否则累加两个前驱。', base: '若起点未被控制，`dp[0][0]=1`。', order: 'x、y 单调递增。', answer: '`dp[bx][by]`。', complexity: '时间 `O(bx·by)`，空间 `O(bx·by)`。', trap: '马自身的位置也不可经过；起点或终点被控制时答案应为 0。'
  },
  {
    title: '不同路径 II', slug: 'unique-paths-with-obstacles', article: '03-linear-grid.md', source: 'LeetCode 63', sourceUrl: 'https://leetcode.cn/problems/unique-paths-ii/', difficulty: '入门', duration: '35～50 分钟',
    description: '通过障碍清零掌握网格可达性的传播。',
    statement: '在 m×n 的 0/1 网格中，0 表示可走，1 表示障碍。机器人从左上角出发，只能向右或向下，求到达右下角的合法路径数。',
    input: '第一行 `m n`，随后 m 行各 n 个 0/1。', output: '输出合法路径数。', constraints: '`1 ≤ m,n ≤ 100`，答案不超过 `2×10^9`。',
    state: '`dp[i][j]` 表示到达可走格 `(i,j)` 的路径数。', decision: '由上方或左方到达。', transition: '障碍格为 0；可走格累加上、左状态。', base: '起点可走时为 1，否则为 0。', order: '左上到右下。', answer: '`dp[m-1][n-1]`。', complexity: '时间 `O(mn)`，空间 `O(n)`。', trap: '首行/首列遇到障碍后，后面的格子不能继续初始化为 1。'
  },
  {
    title: '最小路径和', slug: 'minimum-path-sum', article: '03-linear-grid.md', source: 'LeetCode 64', sourceUrl: 'https://leetcode.cn/problems/minimum-path-sum/', difficulty: '基础', duration: '40～55 分钟',
    description: '把网格计数的加法半环替换为最小值转移。',
    statement: '给定一个非负整数网格，从左上角走到右下角，每步只能向右或向下。路径代价为经过格子的数字总和，求最小代价。',
    input: '第一行 `m n`，随后 m 行各 n 个非负整数。', output: '输出最小路径和。', constraints: '`1 ≤ m,n ≤ 200`，格值在 `0..200`。',
    state: '`dp[i][j]` 表示到达 `(i,j)` 的最小路径和。', decision: '最后一步来自上方或左方。', transition: '`dp[i][j]=grid[i][j]+min(up,left)`。', base: '起点等于自身格值，边界只能沿单一方向累加。', order: '左上到右下。', answer: '右下角状态。', complexity: '时间 `O(mn)`，空间 `O(n)`。', trap: '不存在的前驱应视为正无穷而非 0，否则边界会凭空获得更小路径。'
  },
  {
    title: '传纸条', slug: 'message-passing', article: '03-linear-grid.md', source: '洛谷 P1006', sourceUrl: 'https://www.luogu.com.cn/problem/P1006', difficulty: '进阶', duration: '75～100 分钟',
    description: '用同步步数把两条网格路径压缩到三维状态。',
    statement: '两名同学同时从网格左上角走向右下角，每一步各自只能向右或向下。经过格子可获得该格的好感值；若两人在同一步位于同一格，该格只计一次。求两条路径可获得的最大总和。',
    input: '第一行 `m n`，随后 m 行各 n 个非负好感值。', output: '输出最大总和。', constraints: '`2 ≤ m,n ≤ 50`，格值非负。',
    state: '`dp[k][x1][x2]` 表示走了 k 步、两人行坐标为 x1/x2 时的最大收益，列坐标由 k 推出。', decision: '两人上一步各自来自左或上，共四种组合。', transition: '取四个前驱最大值，再加入两个当前位置的值；重合时只加一次。', base: '两人都在起点，收益为起点值。', order: '同步步数 k 递增。', answer: '两人同时到达终点的状态。', complexity: '时间 `O((m+n)m²)`，空间 `O(m²)` 滚动。', trap: '不能把两条路径分别求最优后相加；它们在重合格上的收益存在耦合。'
  },
  {
    title: '编辑距离', slug: 'edit-distance', article: '03-linear-grid.md', source: '洛谷 P2758', sourceUrl: 'https://www.luogu.com.cn/problem/P2758', difficulty: '基础', duration: '55～75 分钟',
    description: '在双前缀状态中统一插入、删除和替换三种操作。',
    statement: '把字符串 A 变成字符串 B。每次可以插入一个字符、删除一个字符或替换一个字符，三种操作代价均为 1。求最少操作数。输入中的单个连字符 `-` 表示空串。',
    input: '两行字符串 A、B；每行仅含小写字母或单个 `-`。', output: '输出最小编辑距离。', constraints: '两个字符串长度均不超过 2000。',
    state: '`dp[i][j]` 表示把 A 的前 i 个字符变成 B 的前 j 个字符的最小代价。', decision: '删除 A 末字符、插入 B 末字符、或匹配/替换末字符。', transition: '`min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost)`。', base: '`dp[i][0]=i`，`dp[0][j]=j`。', order: '两个前缀长度递增。', answer: '`dp[|A|][|B|]`。', complexity: '时间 `O(|A||B|)`，空间可滚动到 `O(|B|)`。', trap: '字符相等时对角转移代价为 0；空串边界不是 0。'
  },
  {
    title: '采药', slug: 'herb-gathering', article: '04-knapsack.md', source: '洛谷 P1048', sourceUrl: 'https://www.luogu.com.cn/problem/P1048', difficulty: '基础', duration: '45～60 分钟',
    description: '建立标准 0-1 背包模型并理解容量倒序。',
    statement: '有 M 株药草，每株采集需要一定时间并具有一定价值；每株最多采一次。总时间不超过 T，求最大价值。',
    input: '第一行 `T M`，随后 M 行为 `time value`。', output: '输出可获得的最大价值。', constraints: '`1 ≤ T ≤ 1000`，`1 ≤ M ≤ 100`。',
    state: '`dp[c]` 表示容量不超过 c 时的最大价值。', decision: '当前药草不选，或选一次。', transition: '`dp[c]=max(dp[c],dp[c-time]+value)`。', base: '所有容量初值为 0。', order: '物品正序，容量从 T 倒序。', answer: '`dp[T]`。', complexity: '时间 `O(TM)`，空间 `O(T)`。', trap: '容量正序会在同一轮重复使用当前物品，把 0-1 背包误写成完全背包。'
  },
  {
    title: '装箱问题', slug: 'box-packing', article: '04-knapsack.md', source: '洛谷 P1049', sourceUrl: 'https://www.luogu.com.cn/problem/P1049', difficulty: '入门', duration: '35～50 分钟',
    description: '把“最小剩余空间”改写为“最大已用容量”。',
    statement: '箱子容量为 V，有 n 个物品，每个物品只有体积且最多装一次。求装入若干物品后箱子的最小剩余空间。',
    input: '第一行 `V n`，随后给出 n 个物品体积。', output: '输出最小剩余空间。', constraints: '`1 ≤ V ≤ 20000`，`1 ≤ n ≤ 30`。',
    state: '`dp[c]` 表示容量 c 内能装入的最大总体积。', decision: '当前物品选或不选。', transition: '`dp[c]=max(dp[c],dp[c-volume]+volume)`。', base: '初值为 0。', order: '物品正序，容量倒序。', answer: '`V-dp[V]`。', complexity: '时间 `O(Vn)`，空间 `O(V)`。', trap: '目标是剩余最小，不需要额外设计最小值状态；先最大化使用量更直接。'
  },
  {
    title: '疯狂的采药', slug: 'unbounded-herb-gathering', article: '04-knapsack.md', source: '洛谷 P1616', sourceUrl: 'https://www.luogu.com.cn/problem/P1616', difficulty: '基础', duration: '45～60 分钟',
    description: '通过容量正序把 0-1 背包改造成完全背包。',
    statement: '有 M 种药草，每种可采任意多次。每次消耗固定时间并得到固定价值，总时间不超过 T，求最大价值。',
    input: '第一行 `T M`，随后 M 行为 `time value`。', output: '输出最大价值。', constraints: '所有时间为正，且 `M×T ≤ 10^7`。',
    state: '`dp[c]` 表示容量 c 内的最大价值。', decision: '不增加当前种类，或再采一株当前种类。', transition: '`dp[c]=max(dp[c],dp[c-time]+value)`。', base: '初值为 0。', order: '种类在外，容量从 time 正序到 T。', answer: '`dp[T]`。', complexity: '时间 `O(MT)`，空间 `O(T)`。', trap: '完全背包必须允许本轮的新状态再次参与转移，因此容量正序。'
  },
  {
    title: '小 A 点菜', slug: 'exact-menu-count', article: '04-knapsack.md', source: '洛谷 P1164', sourceUrl: 'https://www.luogu.com.cn/problem/P1164', difficulty: '基础', duration: '45～60 分钟',
    description: '把背包目标从最优值切换为恰好装满的方案计数。',
    statement: '有 n 道菜，每道菜只能点一次。两道价格相同但下标不同的菜仍视为不同选择。求总价恰好为 m 的点菜方案数。',
    input: '第一行 `n m`，第二行 n 个菜价。', output: '输出恰好花完 m 的方案数。', constraints: '`1 ≤ n ≤ 100`，`1 ≤ m ≤ 10000`，菜价为正。',
    state: '`dp[s]` 表示使用已处理菜品凑出金额 s 的方案数。', decision: '不点当前菜，或点一次。', transition: '`dp[s]+=dp[s-price]`。', base: '`dp[0]=1`，代表什么都不点的一种空方案。', order: '菜品在外，金额倒序。', answer: '`dp[m]`。', complexity: '时间 `O(nm)`，空间 `O(m)`。', trap: '忘记 `dp[0]=1` 会让所有非空方案失去起点；金额正序又会重复点同一道菜。'
  },
  {
    title: '分割等和子集', slug: 'partition-equal-subset-sum', article: '04-knapsack.md', source: 'LeetCode 416', sourceUrl: 'https://leetcode.cn/problems/partition-equal-subset-sum/', difficulty: '基础', duration: '45～60 分钟',
    description: '把集合二分转化为目标为总和一半的 0-1 可行性背包。',
    statement: '给定一组正整数，判断能否把所有元素分成两个子集，使两个子集的元素和相等。每个元素必须且只能属于一个子集。',
    input: '第一行 `n`，第二行 n 个正整数。', output: '可行输出 `YES`，否则输出 `NO`。', constraints: '`1 ≤ n ≤ 200`，每个数不超过 100。',
    state: '`dp[s]` 表示能否从已处理元素中选出和为 s 的子集。', decision: '当前元素选或不选。', transition: '`dp[s] = dp[s] || dp[s-x]`。', base: '`dp[0]=true`。', order: '若总和为偶数，元素在外，容量倒序到一半。', answer: '`dp[sum/2]`。', complexity: '时间 `O(n·sum)`，空间 `O(sum)`。', trap: '总和为奇数可立即判 NO；容量正序会让一个元素被重复使用。'
  },
  {
    title: '零钱兑换', slug: 'coin-change', article: '04-knapsack.md', source: 'LeetCode 322', sourceUrl: 'https://leetcode.cn/problems/coin-change/', difficulty: '基础', duration: '45～60 分钟',
    description: '在完全背包中求恰好达到金额的最少硬币数。',
    statement: '给定若干种正整数面额，每种硬币可使用任意多枚。求凑成指定金额需要的最少硬币数；无法凑成时输出 -1。',
    input: '第一行 `n amount`，第二行 n 个互不相同的面额。', output: '输出最少硬币数或 `-1`。', constraints: '`1 ≤ n ≤ 12`，`0 ≤ amount ≤ 10000`。',
    state: '`dp[s]` 表示凑成金额 s 的最少硬币数。', decision: '选择一枚面额 coin 作为最后一枚。', transition: '`dp[s]=min(dp[s],dp[s-coin]+1)`。', base: '`dp[0]=0`，其他状态为不可达正无穷。', order: '硬币在外、金额正序，或金额在外枚举硬币。', answer: '若 `dp[amount]` 可达则输出它，否则 -1。', complexity: '时间 `O(n·amount)`，空间 `O(amount)`。', trap: '不可达状态不能直接加 1；金额为 0 时答案是 0。'
  },
  {
    title: '零钱兑换 II', slug: 'coin-change-combinations', article: '04-knapsack.md', source: 'LeetCode 518', sourceUrl: 'https://leetcode.cn/problems/coin-change-ii/', difficulty: '基础', duration: '45～60 分钟',
    description: '用循环顺序区分无序组合与有序排列。',
    statement: '给定若干种正整数面额，每种可使用任意多枚。求凑成指定金额的硬币组合数；组合中硬币顺序不同不产生新方案。',
    input: '第一行 `n amount`，第二行 n 个互不相同的面额。', output: '输出无序组合数。', constraints: '`1 ≤ n ≤ 300`，`0 ≤ amount ≤ 5000`。',
    state: '`dp[s]` 表示使用已处理面额凑出 s 的组合数。', decision: '为当前组合加入一枚当前面额。', transition: '`dp[s]+=dp[s-coin]`。', base: '`dp[0]=1`。', order: '面额在外层，金额正序。', answer: '`dp[amount]`。', complexity: '时间 `O(n·amount)`，空间 `O(amount)`。', trap: '把金额放外层会把不同取用顺序重复计数，得到排列数。'
  },
  {
    title: '组合总和 IV', slug: 'ordered-combination-count', article: '04-knapsack.md', source: 'LeetCode 377', sourceUrl: 'https://leetcode.cn/problems/combination-sum-iv/', difficulty: '基础', duration: '45～60 分钟',
    description: '与零钱组合题对照，明确“顺序是否构成新方案”。',
    statement: '给定一组互不相同的正整数，每个数可使用任意多次。求元素和恰好为 target 的有序序列数量；例如 `[1,2]` 与 `[2,1]` 是两种方案。',
    input: '第一行 `n target`，第二行 n 个正整数。', output: '输出有序序列数量。', constraints: '`1 ≤ n ≤ 200`，`0 ≤ target ≤ 1000`，测试保证答案可放入 64 位有符号整数。',
    state: '`dp[s]` 表示总和为 s 的有序序列数。', decision: '选择最后一个加入的数字 x。', transition: '`dp[s]+=dp[s-x]`。', base: '`dp[0]=1`，空序列是构造后续序列的起点。', order: '总和 s 在外层，候选数字在内层。', answer: '`dp[target]`。', complexity: '时间 `O(n·target)`，空间 `O(target)`。', trap: '这题要求排列数，循环顺序恰好与零钱兑换 II 相反。'
  },
  {
    title: '宝物筛选', slug: 'bounded-treasure-selection', article: '04-knapsack.md', source: '洛谷 P1776', sourceUrl: 'https://www.luogu.com.cn/problem/P1776', difficulty: '进阶', duration: '65～85 分钟',
    description: '用二进制拆分把有数量上限的物品转成少量 0-1 物品。',
    statement: '有 n 种宝物，第 i 种每件价值 v、重量 w，最多有 c 件。背包容量为 W，求不超容量的最大价值。',
    input: '第一行 `n W`，随后 n 行为 `value weight count`。', output: '输出最大价值。', constraints: '`n ≤ 100`，`W ≤ 4×10^4`，总件数不超过 `10^5`。',
    state: '`dp[cap]` 表示容量 cap 内的最大价值。', decision: '把数量 c 拆成 1、2、4…件的若干组，每组作为一件 0-1 物品。', transition: '对每个拆分组执行一次 0-1 背包倒序转移。', base: '所有容量初值为 0。', order: '种类、拆分组、容量倒序。', answer: '`dp[W]`。', complexity: '时间 `O(W∑log c_i)`，空间 `O(W)`。', trap: '最后一组应取剩余数量，而不是强行取下一个 2 的幂。'
  },
  {
    title: '通天之分组背包', slug: 'group-knapsack', article: '04-knapsack.md', source: '洛谷 P1757', sourceUrl: 'https://www.luogu.com.cn/problem/P1757', difficulty: '进阶', duration: '60～80 分钟',
    description: '处理“每组至多选一件”的互斥选择。',
    statement: '有 n 件物品，每件有重量、价值和组号。同一组最多选择一件，背包容量为 C，求最大价值。',
    input: '第一行 `C n`，随后 n 行为 `weight value group`。', output: '输出最大价值。', constraints: '`C ≤ 1000`，`n ≤ 1000`，组数不超过 100。',
    state: '`dp[c]` 表示处理完若干整组后容量 c 内的最大价值。', decision: '当前组不选，或选其中恰好一件。', transition: '新层从旧层复制，再用旧层 `dp[c-weight]+value` 更新各候选。', base: '未处理任何组时均为 0。', order: '按组处理；组内候选必须共同读取上一组状态。', answer: '`dp[C]`。', complexity: '时间 `O(Cn)`，空间 `O(C)` 或双层数组。', trap: '若在同一组内原地连续更新，会错误地选中同组多件物品。'
  },
  {
    title: '樱花', slug: 'cherry-blossom-mixed-knapsack', article: '04-knapsack.md', source: '洛谷 P1833', sourceUrl: 'https://www.luogu.com.cn/problem/P1833', difficulty: '进阶', duration: '70～90 分钟',
    description: '统一处理 0-1、多重与完全三种背包物品。',
    statement: '给定开始和结束时间，以及若干种樱花树。观赏一次消耗时间并获得美学值；数量标记为 0 表示可观赏无限次，1 表示一次，大于 1 表示最多该次数。求时间内最大美学值。',
    input: '第一行 `HH:MM HH:MM n`，随后 n 行为 `time value count`。', output: '输出最大美学值。', constraints: '可用时间不超过 1000 分钟，树种数不超过 10000，单次时间为正。',
    state: '`dp[t]` 表示用时不超过 t 的最大美学值。', decision: '按 count 将物品分别视为完全、0-1 或二进制拆分的多重物品。', transition: '完全物品容量正序；0-1 与拆分组容量倒序。', base: '所有时间状态初值为 0。', order: '逐种处理，根据类型选择容量方向。', answer: '`dp[可用分钟]`。', complexity: '时间约 `O(T∑log count)`，完全物品按 `O(T)` 处理。', trap: '先正确解析跨小时的分钟差；`count=0` 不是“没有”，而是无限。'
  },
  {
    title: '金明的预算方案', slug: 'budget-with-dependencies', article: '04-knapsack.md', source: '洛谷 P1064', sourceUrl: 'https://www.luogu.com.cn/problem/P1064', difficulty: '进阶', duration: '75～100 分钟',
    description: '把主件及其附件组合成分组背包的合法候选。',
    statement: '预算为 N。每件物品有价格和重要度，收益为价格×重要度；物品要么是主件，要么是某主件的附件。购买附件前必须购买其主件，每个主件最多两个附件。求预算内最大收益。',
    input: '第一行 `N m`，随后 m 行为 `price importance parent`；parent 为 0 表示主件，否则是主件编号。', output: '输出最大收益。', constraints: '`N ≤ 32000`，`m ≤ 60`，重要度在 `1..5`。',
    state: '`dp[c]` 表示处理完若干主件组后预算 c 内的最大收益。', decision: '每组可不买、只买主件、主件加任一附件、或主件加两个附件。', transition: '枚举合法组合，用上一组状态更新当前组。', base: '未买任何物品时收益为 0。', order: '按主件分组处理，预算倒序或使用新旧两层。', answer: '`dp[N]`。', complexity: '每组至多四个候选，时间 `O(Nm)`，空间 `O(N)`。', trap: '附件不能脱离主件；不能把主件和附件当作互相独立的普通 0-1 物品。'
  },
  {
    title: 'Buying Hay', slug: 'buying-hay', article: '04-knapsack.md', source: '洛谷 P2918', sourceUrl: 'https://www.luogu.com.cn/problem/P2918', difficulty: '进阶', duration: '60～80 分钟',
    description: '用封顶状态解决“至少达到目标”的完全背包最小费用。',
    statement: '有 n 家供应商，每家出售固定重量、固定价格的一包干草，且可购买任意多包。至少需要 H 单位干草，求达到或超过 H 的最小费用。',
    input: '第一行 `n H`，随后 n 行为 `cost weight`。', output: '输出购买至少 H 单位干草的最小费用。', constraints: '`n ≤ 100`，`H ≤ 50000`，每包重量和费用均不超过 5000。',
    state: '`dp[x]` 表示获得“封顶为 H 的重量 x”所需最小费用。', decision: '再购买某供应商的一包。', transition: '`dp[min(H,x+weight)]=min(dp[min(...)],dp[x]+cost)`。', base: '`dp[0]=0`，其他状态为正无穷。', order: '重量状态从小到大，允许同一包型重复使用。', answer: '`dp[H]`。', complexity: '时间 `O(nH)`，空间 `O(H)`。', trap: '只计算恰好 H 会漏掉必须超额购买的最优解；把所有超过目标的重量统一封顶即可。'
  }
]

for (const [index, item] of catalog.entries()) {
  item.number = index + 1
  item.labId = `14E${String(index + 1).padStart(2, '0')}`
  item.dir = `E-14-${String(index + 1).padStart(2, '0')}-${item.slug}`
}

function makeReadme(item, cases) {
  const title = `Lab 14-E-${String(item.number).padStart(2, '0')}：${item.title}`
  const labPath = `labs/chapter-14/exercise/${item.dir}`
  const article = {
    '01-state-design.md': '01-dp-thinking-and-state-design.md',
    '02-memoization.md': '02-memoization-to-tabulation.md',
    '03-linear-grid.md': '03-linear-and-grid-dp.md',
    '04-knapsack.md': '04-knapsack-dp.md'
  }[item.article]
  return `---
title: "${title}"
description: "${item.description}"
order: ${item.number}
chapter: 14
labId: "${item.labId}"
chapterTitle: "动态规划"
updated: "2026-09-01"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "${item.difficulty}"
duration: "${item.duration}"
---

# ${title}

## 学习目标

- [ ] 能独立写清状态含义、合法转移与初始化，而不是只背代码模板。
- [ ] 能实现本题的 C++17 动态规划，并解释为什么循环顺序满足依赖关系。
- [ ] 能用边界与反例检查「${item.trap}」这一常见错误。

## 前置知识与环境

先阅读 [第 14 章对应小节](../../../../content/chapter-14-dynamic-programming/${article})，并确保本机可使用 C++17。首次运行可执行 §make doctor§；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

${item.statement}

### 输入格式

${item.input}

### 输出格式

${item.output}

### 数据范围

${item.constraints}

### 样例输入

§§§text
${cases[0].input.trimEnd()}
§§§

### 样例输出

§§§text
${cases[0].output.trimEnd()}
§§§

## 做题前先填状态卡

| 问题 | 本题答案 |
| --- | --- |
| 状态 | ${item.state} |
| 选择 | ${item.decision} |
| 转移 | ${item.transition} |
| 初值 | ${item.base} |
| 顺序 | ${item.order} |
| 答案 | ${item.answer} |

不要急着写循环。先用一个最小输入手算状态表，再检查每个右侧依赖是否已经计算；如果依赖来自“当前物品的新状态”，还要说明这是否意味着允许重复选择。

## 复杂度目标

${item.complexity}

## 测试设计提示

公开测试共 20 组、总分 100 分，覆盖样例、最小规模、单行/单列或单元素、不可达/全负/重复值等题型边界，以及容易暴露循环方向和初始化错误的回归输入。测试只接受标准输出；调试信息请写到标准错误。

## 运行与评分

§§§powershell
cd ${labPath}
make run

# 没有 Make 时，在仓库根执行
pnpm lab:run -- ${labPath}

# 作者与 CI 的严格检查
pnpm lab:verify -- ${labPath}
§§§

## 完成清单

- [ ] §student/main.cpp§ 已替换占位逻辑，并能通过编译。
- [ ] 20 个公开测试全部通过，严格评分为 100/100。
- [ ] 能口头解释状态、转移、初始化、遍历顺序和复杂度。
- [ ] 主动构造了至少一个会击穿常见错误的额外输入。

## 思考与复盘

1. 如果改用另一种状态定义，转移和循环顺序会怎样变化？
2. 哪个最小反例最容易暴露「${item.trap}」？
3. 能否压缩空间？压缩后会不会覆盖本轮仍需读取的状态？

## 题目来源与课程化说明

核心问题参考 [${item.source}](${item.sourceUrl})。本 Lab 为课程标准输入/输出环境重新表述题面，并独立编写参考实现与测试数据；不复制第三方题解、代码或隐藏测试。
`.replaceAll('§', '`')
}

function studentSource(item) {
  const fallback = item.number === 7 ? "cout << 1 << '\\n' << 0 << '\\n';" : item.number === 22 ? "cout << \"NO\\n\";" : "cout << 0 << '\\n';"
  return `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: 按 README 的状态卡完成动态规划。先读完输入，保留一个可编译但不会满分的起点。
    string token;
    while (cin >> token) {
    }
    ${fallback}
    return 0;
}
`
}

function manifest() {
  return `${JSON.stringify({
    $schema: '../../../../schemas/lab.schema.json', schemaVersion: 1, type: 'program', language: 'cpp',
    toolchain: { standard: 'c++17', profile: 'course-default' },
    targets: { student: { sources: ['student/main.cpp'] }, solution: { sources: ['solution/main.cpp'] } },
    judge: { kind: 'stdio', cases: 'tests/cases.json', compare: { mode: 'tokens' }, limits: { timeMs: 2000, outputKb: 1024 } }
  }, null, 2)}\n`
}

const thinMakefile = `LAB_DIR := $(CURDIR)
REPO_ROOT := $(LAB_DIR)/../../../..
include ../../../../tools/lab/lab.mk
`

function rngFor(seed) {
  let value = seed >>> 0
  return (min, max) => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return min + ((value >>> 0) % (max - min + 1))
  }
}

function vectorInput(values) {
  return `${values.length}\n${values.join(' ')}\n`
}

function gridInput(grid) {
  return `${grid.length} ${grid[0].length}\n${grid.map((row) => row.join(' ')).join('\n')}\n`
}

function makeGrid(rows, cols, create) {
  return Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => create(i, j)))
}

function decorateInputs(inputs) {
  if (inputs.length !== 20) throw new Error(`expected 20 inputs, got ${inputs.length}`)
  if (new Set(inputs).size !== inputs.length) throw new Error('duplicate generated input')
  return inputs.map((input, index) => ({
    input,
    tags: index === 0 ? ['sample']
      : index <= 2 ? ['boundary']
        : index <= 5 ? ['regression']
          : index >= 18 ? ['stress']
            : ['normal']
  }))
}

function buildInputs(number) {
  const random = rngFor(140000 + number)
  const inputs = []
  const randArray = (n, lo, hi) => Array.from({ length: n }, () => random(lo, hi))

  switch (number) {
    case 1: {
      return decorateInputs([2, 1, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 35, 40, 44, 45].map((n) => `${n}\n`))
    }
    case 2: {
      inputs.push(vectorInput([10, 15, 20]), vectorInput([0, 0]), vectorInput([9, 1]))
      inputs.push(vectorInput([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]))
      inputs.push(vectorInput([5, 5, 5, 5]), vectorInput([0, 7, 0, 7, 0]))
      for (let i = inputs.length; i < 20; i++) inputs.push(vectorInput(randArray(i === 19 ? 100 : 2 + i, 0, 40)))
      return decorateInputs(inputs)
    }
    case 3: {
      inputs.push('5\n7\n3 8\n8 1 0\n2 7 4 4\n4 5 2 6 5\n', '1\n9\n', '2\n0\n0 0\n')
      for (let c = inputs.length; c < 20; c++) {
        const n = c === 19 ? 35 : 2 + (c % 8)
        const rows = Array.from({ length: n }, (_, i) => randArray(i + 1, 0, 30))
        inputs.push(`${n}\n${rows.map((row) => row.join(' ')).join('\n')}\n`)
      }
      return decorateInputs(inputs)
    }
    case 4: {
      inputs.push(vectorInput([-2, 1, -3, 4, -1, 2, 1, -5, 4]), vectorInput([-7]), vectorInput([-9, -2, -11]))
      inputs.push(vectorInput([0, 0, 0]), vectorInput([5, -6, 5]), vectorInput([8, -1, -1, -1]))
      for (let c = inputs.length; c < 20; c++) inputs.push(vectorInput(randArray(c === 19 ? 500 : 5 + c, -30, 30)))
      return decorateInputs(inputs)
    }
    case 5: {
      inputs.push(vectorInput([1, 2, 3, 1]), vectorInput([0]), vectorInput([2, 9]))
      inputs.push(vectorInput([2, 7, 9, 3, 1]), vectorInput([5, 5, 5, 5]), vectorInput([0, 100, 0, 100, 0]))
      for (let c = inputs.length; c < 20; c++) inputs.push(vectorInput(randArray(c === 19 ? 100 : 3 + c, 0, 60)))
      return decorateInputs(inputs)
    }
    case 6: {
      inputs.push('2 2\n4 3\n2 1\n', '1 1\n7\n', '1 6\n6 5 4 3 2 1\n')
      inputs.push('3 3\n5 5 5\n5 5 5\n5 5 5\n', '3 3\n9 8 7\n2 3 6\n1 4 5\n')
      for (let c = inputs.length; c < 20; c++) {
        const rows = c === 19 ? 20 : 2 + (c % 6)
        const cols = c === 19 ? 20 : 2 + ((c * 3) % 6)
        inputs.push(gridInput(makeGrid(rows, cols, () => random(0, 100))))
      }
      return decorateInputs(inputs)
    }
    case 7: {
      const mineInput = (weights, edges) => `${weights.length}\n${weights.join(' ')}\n${edges.length}\n${edges.map((edge) => edge.join(' ')).join('\n')}${edges.length ? '\n' : ''}`
      inputs.push(mineInput([5, 10, 5, 20], [[1, 2], [1, 3], [2, 4], [3, 4]]), mineInput([7], []), mineInput([0, 0, 0], []))
      inputs.push(mineInput([5, 5, 5], [[1, 3], [2, 3]]), mineInput([1, 2, 3, 4], [[1, 2], [2, 3], [3, 4]]))
      for (let c = inputs.length; c < 20; c++) {
        const n = c === 19 ? 20 : 3 + (c % 7)
        const weights = randArray(n, 0, 25)
        const edges = []
        for (let u = 1; u <= n; u++) for (let v = u + 1; v <= n; v++) if (random(0, 99) < 28) edges.push([u, v])
        inputs.push(mineInput(weights, edges))
      }
      return decorateInputs(inputs)
    }
    case 8: {
      inputs.push('3 3\n9 9 4\n6 6 8\n2 1 1\n', '1 1\n42\n', '1 5\n1 2 3 4 5\n')
      inputs.push('3 3\n1 1 1\n1 1 1\n1 1 1\n', '3 3\n3 4 5\n3 2 6\n2 2 1\n')
      for (let c = inputs.length; c < 20; c++) {
        const rows = c === 19 ? 20 : 2 + (c % 6)
        const cols = c === 19 ? 20 : 2 + ((c * 5) % 6)
        inputs.push(gridInput(makeGrid(rows, cols, () => random(0, 150))))
      }
      return decorateInputs(inputs)
    }
    case 9: {
      inputs.push(vectorInput([10, 9, 2, 5, 3, 7, 101, 18]), vectorInput([7]), vectorInput([5, 5, 5, 5]))
      inputs.push(vectorInput([1, 2, 3, 4, 5]), vectorInput([5, 4, 3, 2, 1]), vectorInput([1, 3, 2, 4, 3, 5]))
      for (let c = inputs.length; c < 20; c++) inputs.push(vectorInput(randArray(c === 19 ? 200 : 5 + c, 1, 100)))
      return decorateInputs(inputs)
    }
    case 10: {
      inputs.push(vectorInput([186, 186, 150, 200, 160, 130, 197, 220]), vectorInput([150, 160]), vectorInput([170, 170, 170]))
      inputs.push(vectorInput([130, 140, 150, 160]), vectorInput([200, 190, 180, 170]), vectorInput([150, 160, 170, 160, 150]))
      for (let c = inputs.length; c < 20; c++) inputs.push(vectorInput(randArray(c === 19 ? 100 : 5 + c, 130, 230)))
      return decorateInputs(inputs)
    }
    case 11: {
      const taskInput = (n, tasks) => `${n} ${tasks.length}\n${tasks.map((task) => task.join(' ')).join('\n')}${tasks.length ? '\n' : ''}`
      inputs.push(taskInput(10, [[2, 3], [2, 5], [7, 2]]), taskInput(1, [[1, 1]]), taskInput(5, [[1, 5]]))
      inputs.push(taskInput(6, [[2, 1], [2, 3], [2, 5]]), taskInput(8, [[8, 1]]))
      for (let c = inputs.length; c < 20; c++) {
        const n = c === 19 ? 500 : 10 + c
        const k = c === 19 ? 300 : 3 + c
        const tasks = Array.from({ length: k }, () => {
          const start = random(1, n)
          return [start, random(1, n - start + 1)]
        })
        inputs.push(taskInput(n, tasks))
      }
      return decorateInputs(inputs)
    }
    case 12: {
      const pairs = [[3, 7], [1, 1], [1, 12], [12, 1], [2, 2], [2, 8], [8, 2], [3, 3], [4, 5], [5, 4], [6, 6], [7, 8], [8, 7], [9, 9], [10, 3], [3, 10], [12, 8], [8, 12], [15, 10], [10, 15]]
      return decorateInputs(pairs.map(([m, n]) => `${m} ${n}\n`))
    }
    case 13: {
      const rows = [[6, 6, 3, 3], [0, 0, 5, 5], [1, 1, 0, 0], [2, 2, 1, 0], [5, 0, 2, 2], [0, 5, 2, 2]]
      while (rows.length < 20) rows.push([random(2, 20), random(2, 20), random(0, 20), random(0, 20)])
      return decorateInputs(rows.map((row) => `${row.join(' ')}\n`))
    }
    case 14: {
      inputs.push('3 3\n0 0 0\n0 1 0\n0 0 0\n', '1 1\n0\n', '1 1\n1\n')
      inputs.push('1 5\n0 0 1 0 0\n', '3 3\n0 1 0\n0 0 0\n0 0 0\n')
      for (let c = inputs.length; c < 20; c++) {
        const rows = c === 19 ? 18 : 2 + (c % 7)
        const cols = c === 19 ? 18 : 2 + ((c * 3) % 7)
        const grid = makeGrid(rows, cols, () => random(0, 99) < 24 ? 1 : 0)
        if (c % 3 !== 0) grid[0][0] = 0
        if (c % 4 !== 0) grid[rows - 1][cols - 1] = 0
        inputs.push(gridInput(grid))
      }
      return decorateInputs(inputs)
    }
    case 15: {
      inputs.push('3 3\n1 3 1\n1 5 1\n4 2 1\n', '1 1\n9\n', '1 5\n1 2 3 4 5\n')
      inputs.push('4 1\n1\n2\n3\n4\n', '2 2\n0 0\n0 0\n')
      for (let c = inputs.length; c < 20; c++) {
        const rows = c === 19 ? 25 : 2 + (c % 7)
        const cols = c === 19 ? 25 : 2 + ((c * 5) % 7)
        inputs.push(gridInput(makeGrid(rows, cols, () => random(0, 40))))
      }
      return decorateInputs(inputs)
    }
    case 16: {
      inputs.push('3 3\n0 2 3\n4 5 6\n7 8 0\n', '2 2\n1 0\n0 1\n', '2 3\n0 0 0\n0 0 0\n')
      inputs.push('3 3\n5 0 0\n0 100 0\n0 0 7\n', '2 4\n1 2 3 4\n5 6 7 8\n')
      for (let c = inputs.length; c < 20; c++) {
        const rows = c === 19 ? 15 : 2 + (c % 6)
        const cols = c === 19 ? 15 : 2 + ((c * 3) % 6)
        inputs.push(gridInput(makeGrid(rows, cols, () => random(0, 30))))
      }
      return decorateInputs(inputs)
    }
    case 17: {
      const pairs = [['kitten', 'sitting'], ['-', '-'], ['-', 'abc'], ['abc', '-'], ['a', 'a'], ['a', 'b'], ['abc', 'abc'], ['abc', 'ac'], ['ac', 'abc'], ['intention', 'execution']]
      const alphabet = 'abcd'
      while (pairs.length < 20) {
        const lenA = pairs.length === 19 ? 100 : random(1, 18)
        const lenB = pairs.length === 19 ? 95 : random(1, 18)
        const make = (length) => Array.from({ length }, () => alphabet[random(0, alphabet.length - 1)]).join('')
        pairs.push([make(lenA), make(lenB)])
      }
      return decorateInputs(pairs.map(([a, b]) => `${a}\n${b}\n`))
    }
    case 18: {
      const itemInput = (capacity, items) => `${capacity} ${items.length}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      inputs.push(itemInput(70, [[71, 100], [69, 1], [1, 2]]), itemInput(1, [[1, 7]]), itemInput(5, [[6, 99]]))
      for (let c = inputs.length; c < 20; c++) {
        const cap = c === 19 ? 500 : 10 + c * 3
        const count = c === 19 ? 80 : 3 + c
        inputs.push(itemInput(cap, Array.from({ length: count }, () => [random(1, cap + 5), random(0, 80)])))
      }
      return decorateInputs(inputs)
    }
    case 19: {
      const boxInput = (capacity, volumes) => `${capacity} ${volumes.length}\n${volumes.join('\n')}\n`
      inputs.push(boxInput(24, [8, 3, 12, 7, 9, 7]), boxInput(1, [1]), boxInput(10, [11, 12]))
      inputs.push(boxInput(10, [5, 5]), boxInput(10, [6, 4, 3]))
      for (let c = inputs.length; c < 20; c++) {
        const cap = c === 19 ? 500 : 15 + c * 4
        inputs.push(boxInput(cap, randArray(c === 19 ? 30 : 3 + c, 1, cap + 10)))
      }
      return decorateInputs(inputs)
    }
    case 20: {
      const completeInput = (capacity, items) => `${capacity} ${items.length}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      inputs.push(completeInput(10, [[3, 4], [4, 5]]), completeInput(1, [[1, 2]]), completeInput(7, [[8, 100]]))
      inputs.push(completeInput(12, [[3, 5]]), completeInput(20, [[6, 10], [5, 9]]))
      for (let c = inputs.length; c < 20; c++) {
        const cap = c === 19 ? 600 : 15 + c * 3
        inputs.push(completeInput(cap, Array.from({ length: c === 19 ? 60 : 3 + c }, () => [random(1, cap + 5), random(0, 100)])))
      }
      return decorateInputs(inputs)
    }
    case 21: {
      const menuInput = (prices, target) => `${prices.length} ${target}\n${prices.join(' ')}\n`
      inputs.push(menuInput([1, 2, 3, 3], 6), menuInput([5], 5), menuInput([5], 4))
      inputs.push(menuInput([2, 2, 2], 4), menuInput([1, 1, 1], 2))
      for (let c = inputs.length; c < 20; c++) inputs.push(menuInput(randArray(c === 19 ? 40 : 4 + c, 1, 30), c === 19 ? 160 : random(1, 100)))
      return decorateInputs(inputs)
    }
    case 22: {
      inputs.push(vectorInput([1, 5, 11, 5]), vectorInput([1]), vectorInput([2, 2]))
      inputs.push(vectorInput([1, 2, 3, 5]), vectorInput([100, 100, 100, 100]), vectorInput([1, 1, 1, 1, 2]))
      for (let c = inputs.length; c < 20; c++) inputs.push(vectorInput(randArray(c === 19 ? 120 : 4 + c, 1, 60)))
      return decorateInputs(inputs)
    }
    case 23:
    case 24:
    case 25: {
      const coinInput = (coins, amount) => `${coins.length} ${amount}\n${coins.join(' ')}\n`
      if (number === 23) inputs.push(coinInput([1, 2, 5], 11), coinInput([2], 0), coinInput([2], 3))
      else if (number === 24) inputs.push(coinInput([1, 2, 5], 5), coinInput([2], 0), coinInput([2], 3))
      else inputs.push(coinInput([1, 2, 3], 4), coinInput([2], 0), coinInput([2], 3))
      inputs.push(coinInput([1], 20), coinInput([3, 4], 18), coinInput([2, 5, 7], 27))
      for (let c = inputs.length; c < 20; c++) {
        const count = 2 + (c % 6)
        const set = new Set()
        while (set.size < count) set.add(random(1, 20))
        const target = number === 25 ? (c === 19 ? 35 : random(1, 28)) : (c === 19 ? 160 : random(1, 80))
        inputs.push(coinInput([...set], target))
      }
      return decorateInputs(inputs)
    }
    case 26: {
      const boundedInput = (capacity, items) => `${items.length} ${capacity}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      inputs.push(boundedInput(10, [[6, 4, 2], [4, 3, 3]]), boundedInput(1, [[5, 1, 1]]), boundedInput(5, [[10, 6, 10]]))
      inputs.push(boundedInput(20, [[3, 2, 20]]), boundedInput(15, [[7, 5, 2], [6, 4, 2]]))
      for (let c = inputs.length; c < 20; c++) {
        const cap = c === 19 ? 500 : 20 + c * 4
        inputs.push(boundedInput(cap, Array.from({ length: c === 19 ? 60 : 3 + c }, () => [random(1, 60), random(1, cap + 5), random(1, 20)])))
      }
      return decorateInputs(inputs)
    }
    case 27: {
      const groupInput = (capacity, items) => `${capacity} ${items.length}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      inputs.push(groupInput(10, [[4, 7, 1], [6, 9, 1], [5, 8, 2]]), groupInput(1, [[1, 1, 1]]), groupInput(5, [[6, 20, 1]]))
      inputs.push(groupInput(10, [[5, 10, 1], [5, 11, 1], [5, 7, 2]]), groupInput(20, [[4, 5, 3], [6, 9, 1], [3, 4, 3], [10, 20, 2]]))
      for (let c = inputs.length; c < 20; c++) {
        const cap = c === 19 ? 300 : 20 + c * 3
        const count = c === 19 ? 100 : 4 + c
        inputs.push(groupInput(cap, Array.from({ length: count }, () => [random(1, cap + 5), random(0, 80), random(1, Math.min(12, count))])))
      }
      return decorateInputs(inputs)
    }
    case 28: {
      const mixedInput = (minutes, items) => {
        const start = 8 * 60
        const end = start + minutes
        const clock = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
        return `${clock(start)} ${clock(end)} ${items.length}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      }
      inputs.push(mixedInput(60, [[10, 5, 0], [30, 20, 1], [15, 8, 2]]), mixedInput(1, [[1, 2, 1]]), mixedInput(10, [[11, 100, 0]]))
      inputs.push(mixedInput(30, [[5, 3, 0]]), mixedInput(40, [[10, 8, 1], [10, 7, 4]]))
      for (let c = inputs.length; c < 20; c++) {
        const minutes = c === 19 ? 600 : 30 + c * 10
        const count = c === 19 ? 100 : 3 + c
        inputs.push(mixedInput(minutes, Array.from({ length: count }, (_, i) => [random(1, minutes + 5), random(0, 90), i % 4 === 0 ? 0 : random(1, 12)])))
      }
      return decorateInputs(inputs)
    }
    case 29: {
      const budgetInput = (budget, items) => `${budget} ${items.length}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      inputs.push(budgetInput(1000, [[800, 2, 0], [400, 5, 1], [300, 5, 1]]), budgetInput(10, [[10, 1, 0]]), budgetInput(100, [[110, 5, 0]]))
      inputs.push(budgetInput(500, [[200, 3, 0], [100, 5, 1], [200, 4, 0]]), budgetInput(700, [[300, 2, 0], [100, 5, 1], [100, 4, 1], [400, 3, 0]]))
      for (let c = inputs.length; c < 20; c++) {
        const groups = c === 19 ? 20 : 2 + (c % 6)
        const items = []
        for (let g = 0; g < groups; g++) {
          const mainIndex = items.length + 1
          items.push([random(1, 20) * 10, random(1, 5), 0])
          const accessories = random(0, 2)
          for (let a = 0; a < accessories; a++) items.push([random(1, 12) * 10, random(1, 5), mainIndex])
        }
        inputs.push(budgetInput(c === 19 ? 3000 : (30 + c * 8) * 10, items))
      }
      return decorateInputs(inputs)
    }
    case 30: {
      const hayInput = (target, items) => `${items.length} ${target}\n${items.map((item) => item.join(' ')).join('\n')}\n`
      inputs.push(hayInput(15, [[10, 6], [14, 10]]), hayInput(1, [[5, 3]]), hayInput(10, [[7, 11]]))
      inputs.push(hayInput(20, [[3, 2]]), hayInput(30, [[10, 10], [13, 15]]))
      for (let c = inputs.length; c < 20; c++) {
        const target = c === 19 ? 1000 : 25 + c * 10
        inputs.push(hayInput(target, Array.from({ length: c === 19 ? 80 : 3 + c }, () => [random(1, 100), random(1, 120)])))
      }
      return decorateInputs(inputs)
    }
    default:
      throw new Error(`unknown lab number ${number}`)
  }
}

function solveWithOracle(number, input) {
  const raw = input.trim().split(/\s+/)
  let cursor = 0
  const next = () => raw[cursor++]
  const num = () => Number(next())
  const oneLine = (value) => `${value}\n`

  switch (number) {
    case 1: {
      const n = num()
      let previous = 1
      let current = 1
      for (let i = 1; i <= n; i++) [previous, current] = [current, previous + current]
      return oneLine(previous)
    }
    case 2: {
      const n = num()
      const cost = Array.from({ length: n }, num)
      let twoBack = 0
      let oneBack = 0
      for (let i = 2; i <= n; i++) {
        const now = Math.min(oneBack + cost[i - 1], twoBack + cost[i - 2])
        twoBack = oneBack
        oneBack = now
      }
      return oneLine(oneBack)
    }
    case 3: {
      const n = num()
      let dp = [num()]
      for (let i = 1; i < n; i++) {
        const row = Array.from({ length: i + 1 }, num)
        const nextRow = Array(i + 1).fill(Number.NEGATIVE_INFINITY)
        for (let j = 0; j <= i; j++) {
          if (j < i) nextRow[j] = Math.max(nextRow[j], dp[j] + row[j])
          if (j > 0) nextRow[j] = Math.max(nextRow[j], dp[j - 1] + row[j])
        }
        dp = nextRow
      }
      return oneLine(Math.max(...dp))
    }
    case 4: {
      const n = num()
      let ending = num()
      let answer = ending
      for (let i = 1; i < n; i++) {
        const value = num()
        ending = Math.max(value, ending + value)
        answer = Math.max(answer, ending)
      }
      return oneLine(answer)
    }
    case 5: {
      const n = num()
      let twoBack = 0
      let oneBack = 0
      for (let i = 0; i < n; i++) {
        const value = num()
        const now = Math.max(oneBack, twoBack + value)
        twoBack = oneBack
        oneBack = now
      }
      return oneLine(oneBack)
    }
    case 6:
    case 8: {
      const rows = num()
      const cols = num()
      const grid = makeGrid(rows, cols, () => num())
      const memo = makeGrid(rows, cols, () => 0)
      const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      const increasing = number === 8
      const dfs = (x, y) => {
        if (memo[x][y]) return memo[x][y]
        let best = 1
        for (const [dx, dy] of directions) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= rows || ny < 0 || ny >= cols) continue
          const legal = increasing ? grid[nx][ny] > grid[x][y] : grid[nx][ny] < grid[x][y]
          if (legal) best = Math.max(best, 1 + dfs(nx, ny))
        }
        memo[x][y] = best
        return best
      }
      let answer = 0
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) answer = Math.max(answer, dfs(i, j))
      return oneLine(answer)
    }
    case 7: {
      const n = num()
      const mines = Array.from({ length: n }, num)
      const graph = Array.from({ length: n }, () => [])
      const edges = num()
      for (let i = 0; i < edges; i++) graph[num() - 1].push(num() - 1)
      const bestValue = Array(n).fill(0)
      const bestPath = Array.from({ length: n }, () => [])
      const less = (left, right) => {
        const length = Math.min(left.length, right.length)
        for (let i = 0; i < length; i++) if (left[i] !== right[i]) return left[i] < right[i]
        return left.length < right.length
      }
      for (let i = n - 1; i >= 0; i--) {
        bestValue[i] = mines[i]
        bestPath[i] = [i + 1]
        for (const v of graph[i]) {
          const value = mines[i] + bestValue[v]
          const candidate = [i + 1, ...bestPath[v]]
          if (value > bestValue[i] || (value === bestValue[i] && less(candidate, bestPath[i]))) {
            bestValue[i] = value
            bestPath[i] = candidate
          }
        }
      }
      let start = 0
      for (let i = 1; i < n; i++) if (bestValue[i] > bestValue[start] || (bestValue[i] === bestValue[start] && less(bestPath[i], bestPath[start]))) start = i
      return `${bestPath[start].join(' ')}\n${bestValue[start]}\n`
    }
    case 9: {
      const n = num()
      const values = Array.from({ length: n }, num)
      const dp = Array(n).fill(1)
      let answer = 1
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) if (values[j] < values[i]) dp[i] = Math.max(dp[i], dp[j] + 1)
        answer = Math.max(answer, dp[i])
      }
      return oneLine(answer)
    }
    case 10: {
      const n = num()
      const values = Array.from({ length: n }, num)
      const left = Array(n).fill(1)
      const right = Array(n).fill(1)
      for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (values[j] < values[i]) left[i] = Math.max(left[i], left[j] + 1)
      for (let i = n - 1; i >= 0; i--) for (let j = n - 1; j > i; j--) if (values[j] < values[i]) right[i] = Math.max(right[i], right[j] + 1)
      let best = 0
      for (let i = 0; i < n; i++) best = Math.max(best, left[i] + right[i] - 1)
      return oneLine(n - best)
    }
    case 11: {
      const n = num()
      const k = num()
      const tasks = Array.from({ length: n + 2 }, () => [])
      for (let i = 0; i < k; i++) tasks[num()].push(num())
      const dp = Array(n + 2).fill(0)
      for (let i = n; i >= 1; i--) {
        if (tasks[i].length === 0) dp[i] = dp[i + 1] + 1
        else for (const duration of tasks[i]) dp[i] = Math.max(dp[i], dp[i + duration])
      }
      return oneLine(dp[1])
    }
    case 12: {
      const rows = num()
      const cols = num()
      const dp = Array(cols).fill(1)
      for (let i = 1; i < rows; i++) for (let j = 1; j < cols; j++) dp[j] += dp[j - 1]
      return oneLine(dp[cols - 1])
    }
    case 13: {
      const bx = num()
      const by = num()
      const hx = num()
      const hy = num()
      const blocked = new Set()
      const horseMoves = [[0, 0], [1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]]
      for (const [dx, dy] of horseMoves) blocked.add(`${hx + dx},${hy + dy}`)
      const dp = makeGrid(bx + 1, by + 1, () => 0)
      if (!blocked.has('0,0')) dp[0][0] = 1
      for (let x = 0; x <= bx; x++) for (let y = 0; y <= by; y++) {
        if (blocked.has(`${x},${y}`) || (x === 0 && y === 0)) continue
        dp[x][y] = (x ? dp[x - 1][y] : 0) + (y ? dp[x][y - 1] : 0)
      }
      return oneLine(dp[bx][by])
    }
    case 14: {
      const rows = num()
      const cols = num()
      const dp = Array(cols).fill(0)
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        const obstacle = num()
        if (obstacle) dp[j] = 0
        else if (i === 0 && j === 0) dp[j] = 1
        else dp[j] += j ? dp[j - 1] : 0
      }
      return oneLine(dp[cols - 1])
    }
    case 15: {
      const rows = num()
      const cols = num()
      const infinity = Number.MAX_SAFE_INTEGER
      const dp = Array(cols).fill(infinity)
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        const value = num()
        if (i === 0 && j === 0) dp[j] = value
        else dp[j] = value + Math.min(dp[j], j ? dp[j - 1] : infinity)
      }
      return oneLine(dp[cols - 1])
    }
    case 16: {
      const rows = num()
      const cols = num()
      const grid = makeGrid(rows, cols, () => num())
      const negative = -1e18
      let dp = makeGrid(rows, rows, () => negative)
      dp[0][0] = grid[0][0]
      for (let step = 1; step <= rows + cols - 2; step++) {
        const nextLayer = makeGrid(rows, rows, () => negative)
        for (let x1 = 0; x1 < rows; x1++) {
          const y1 = step - x1
          if (y1 < 0 || y1 >= cols) continue
          for (let x2 = 0; x2 < rows; x2++) {
            const y2 = step - x2
            if (y2 < 0 || y2 >= cols) continue
            let previous = negative
            for (const px1 of [x1, x1 - 1]) for (const px2 of [x2, x2 - 1]) {
              if (px1 >= 0 && px2 >= 0) previous = Math.max(previous, dp[px1][px2])
            }
            if (previous === negative) continue
            const gain = grid[x1][y1] + (x1 === x2 ? 0 : grid[x2][y2])
            nextLayer[x1][x2] = previous + gain
          }
        }
        dp = nextLayer
      }
      return oneLine(dp[rows - 1][rows - 1])
    }
    case 17: {
      let left = next()
      let right = next()
      if (left === '-') left = ''
      if (right === '-') right = ''
      let previous = Array.from({ length: right.length + 1 }, (_, i) => i)
      for (let i = 1; i <= left.length; i++) {
        const current = Array(right.length + 1).fill(0)
        current[0] = i
        for (let j = 1; j <= right.length; j++) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1))
        previous = current
      }
      return oneLine(previous[right.length])
    }
    case 18:
    case 20: {
      const capacity = num()
      const count = num()
      const dp = Array(capacity + 1).fill(0)
      for (let i = 0; i < count; i++) {
        const weight = num()
        const value = num()
        if (number === 18) for (let c = capacity; c >= weight; c--) dp[c] = Math.max(dp[c], dp[c - weight] + value)
        else for (let c = weight; c <= capacity; c++) dp[c] = Math.max(dp[c], dp[c - weight] + value)
      }
      return oneLine(dp[capacity])
    }
    case 19: {
      const capacity = num()
      const count = num()
      const dp = Array(capacity + 1).fill(0)
      for (let i = 0; i < count; i++) {
        const volume = num()
        for (let c = capacity; c >= volume; c--) dp[c] = Math.max(dp[c], dp[c - volume] + volume)
      }
      return oneLine(capacity - dp[capacity])
    }
    case 21: {
      const count = num()
      const target = num()
      const dp = Array(target + 1).fill(0)
      dp[0] = 1
      for (let i = 0; i < count; i++) {
        const price = num()
        for (let sum = target; sum >= price; sum--) dp[sum] += dp[sum - price]
      }
      return oneLine(dp[target])
    }
    case 22: {
      const count = num()
      const values = Array.from({ length: count }, num)
      const total = values.reduce((sum, value) => sum + value, 0)
      if (total % 2) return 'NO\n'
      const target = total / 2
      const dp = Array(target + 1).fill(false)
      dp[0] = true
      for (const value of values) for (let sum = target; sum >= value; sum--) dp[sum] ||= dp[sum - value]
      return dp[target] ? 'YES\n' : 'NO\n'
    }
    case 23: {
      const count = num()
      const amount = num()
      const coins = Array.from({ length: count }, num)
      const dp = Array(amount + 1).fill(amount + 1)
      dp[0] = 0
      for (const coin of coins) for (let sum = coin; sum <= amount; sum++) dp[sum] = Math.min(dp[sum], dp[sum - coin] + 1)
      return oneLine(dp[amount] > amount ? -1 : dp[amount])
    }
    case 24: {
      const count = num()
      const amount = num()
      const coins = Array.from({ length: count }, num)
      const dp = Array(amount + 1).fill(0)
      dp[0] = 1
      for (const coin of coins) for (let sum = coin; sum <= amount; sum++) dp[sum] += dp[sum - coin]
      return oneLine(dp[amount])
    }
    case 25: {
      const count = num()
      const target = num()
      const values = Array.from({ length: count }, num)
      const dp = Array(target + 1).fill(0)
      dp[0] = 1
      for (let sum = 1; sum <= target; sum++) for (const value of values) if (value <= sum) dp[sum] += dp[sum - value]
      return oneLine(dp[target])
    }
    case 26: {
      const count = num()
      const capacity = num()
      const dp = Array(capacity + 1).fill(0)
      for (let i = 0; i < count; i++) {
        const value = num()
        const weight = num()
        let remaining = num()
        for (let group = 1; remaining > 0; group *= 2) {
          const take = Math.min(group, remaining)
          remaining -= take
          for (let c = capacity; c >= weight * take; c--) dp[c] = Math.max(dp[c], dp[c - weight * take] + value * take)
        }
      }
      return oneLine(dp[capacity])
    }
    case 27: {
      const capacity = num()
      const count = num()
      const groups = new Map()
      for (let i = 0; i < count; i++) {
        const item = [num(), num()]
        const group = num()
        if (!groups.has(group)) groups.set(group, [])
        groups.get(group).push(item)
      }
      let dp = Array(capacity + 1).fill(0)
      for (const items of groups.values()) {
        const previous = dp
        dp = previous.slice()
        for (let c = 0; c <= capacity; c++) for (const [weight, value] of items) if (weight <= c) dp[c] = Math.max(dp[c], previous[c - weight] + value)
      }
      return oneLine(dp[capacity])
    }
    case 28: {
      const toMinute = (clock) => {
        const [hour, minute] = clock.split(':').map(Number)
        return hour * 60 + minute
      }
      const capacity = toMinute(next())
      const end = toMinute(next())
      const count = num()
      const dp = Array(end - capacity + 1).fill(0)
      const total = end - capacity
      for (let i = 0; i < count; i++) {
        const weight = num()
        const value = num()
        let amount = num()
        if (amount === 0) {
          for (let c = weight; c <= total; c++) dp[c] = Math.max(dp[c], dp[c - weight] + value)
        } else {
          for (let group = 1; amount > 0; group *= 2) {
            const take = Math.min(group, amount)
            amount -= take
            for (let c = total; c >= weight * take; c--) dp[c] = Math.max(dp[c], dp[c - weight * take] + value * take)
          }
        }
      }
      return oneLine(dp[total])
    }
    case 29: {
      const budget = num()
      const count = num()
      const items = Array.from({ length: count + 1 }, () => ({ price: 0, value: 0, parent: 0, accessories: [] }))
      for (let i = 1; i <= count; i++) {
        const price = num()
        const importance = num()
        const parent = num()
        items[i] = { price, value: price * importance, parent, accessories: [] }
      }
      for (let i = 1; i <= count; i++) if (items[i].parent) items[items[i].parent].accessories.push(i)
      let dp = Array(budget + 1).fill(0)
      for (let i = 1; i <= count; i++) {
        if (items[i].parent) continue
        const options = [[items[i].price, items[i].value]]
        for (const accessory of items[i].accessories) options.push([items[i].price + items[accessory].price, items[i].value + items[accessory].value])
        if (items[i].accessories.length === 2) {
          const [a, b] = items[i].accessories
          options.push([items[i].price + items[a].price + items[b].price, items[i].value + items[a].value + items[b].value])
        }
        const previous = dp
        dp = previous.slice()
        for (let c = 0; c <= budget; c++) for (const [price, value] of options) if (price <= c) dp[c] = Math.max(dp[c], previous[c - price] + value)
      }
      return oneLine(dp[budget])
    }
    case 30: {
      const count = num()
      const target = num()
      const items = Array.from({ length: count }, () => [num(), num()])
      const infinity = Number.MAX_SAFE_INTEGER
      const dp = Array(target + 1).fill(infinity)
      dp[0] = 0
      for (let weight = 0; weight < target; weight++) {
        if (dp[weight] === infinity) continue
        for (const [cost, gain] of items) {
          const nextWeight = Math.min(target, weight + gain)
          dp[nextWeight] = Math.min(dp[nextWeight], dp[weight] + cost)
        }
      }
      return oneLine(dp[target])
    }
    default:
      throw new Error(`missing oracle for ${number}`)
  }
}

function cpp(body) {
  return `#include <bits/stdc++.h>\nusing namespace std;\n\n${body.trim()}\n`
}

function solutionSource(number) {
  switch (number) {
    case 1:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long previous = 1;
    long long current = 1;
    for (int level = 1; level <= n; ++level) {
        long long next = previous + current;
        previous = current;
        current = next;
    }
    cout << previous << '\n';
    return 0;
}`)
    case 2:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> cost(n);
    for (long long& value : cost) cin >> value;

    long long twoBack = 0;
    long long oneBack = 0;
    for (int position = 2; position <= n; ++position) {
        long long current = min(oneBack + cost[position - 1], twoBack + cost[position - 2]);
        twoBack = oneBack;
        oneBack = current;
    }
    cout << oneBack << '\n';
    return 0;
}`)
    case 3:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> dp(n, numeric_limits<long long>::lowest() / 4);
    cin >> dp[0];
    for (int row = 1; row < n; ++row) {
        vector<long long> next(row + 1, numeric_limits<long long>::lowest() / 4);
        for (int column = 0; column <= row; ++column) {
            long long value;
            cin >> value;
            if (column < row) next[column] = max(next[column], dp[column] + value);
            if (column > 0) next[column] = max(next[column], dp[column - 1] + value);
        }
        dp.swap(next);
    }
    cout << *max_element(dp.begin(), dp.end()) << '\n';
    return 0;
}`)
    case 4:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long ending;
    cin >> ending;
    long long answer = ending;
    for (int i = 1; i < n; ++i) {
        long long value;
        cin >> value;
        ending = max(value, ending + value);
        answer = max(answer, ending);
    }
    cout << answer << '\n';
    return 0;
}`)
    case 5:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long twoBack = 0;
    long long oneBack = 0;
    for (int i = 0; i < n; ++i) {
        long long value;
        cin >> value;
        long long current = max(oneBack, twoBack + value);
        twoBack = oneBack;
        oneBack = current;
    }
    cout << oneBack << '\n';
    return 0;
}`)
    case 6:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<vector<int>> height(rows, vector<int>(columns));
    for (auto& row : height) for (int& value : row) cin >> value;

    vector<vector<int>> memo(rows, vector<int>(columns));
    const array<int, 4> dx{1, -1, 0, 0};
    const array<int, 4> dy{0, 0, 1, -1};
    function<int(int, int)> dfs = [&](int x, int y) {
        if (memo[x][y] != 0) return memo[x][y];
        int best = 1;
        for (int direction = 0; direction < 4; ++direction) {
            int nx = x + dx[direction];
            int ny = y + dy[direction];
            if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && height[nx][ny] < height[x][y]) {
                best = max(best, 1 + dfs(nx, ny));
            }
        }
        return memo[x][y] = best;
    };

    int answer = 0;
    for (int i = 0; i < rows; ++i) for (int j = 0; j < columns; ++j) answer = max(answer, dfs(i, j));
    cout << answer << '\n';
    return 0;
}`)
    case 7:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> mines(n);
    for (long long& value : mines) cin >> value;
    int edgeCount;
    cin >> edgeCount;
    vector<vector<int>> graph(n);
    while (edgeCount--) {
        int from, to;
        cin >> from >> to;
        graph[from - 1].push_back(to - 1);
    }

    vector<long long> bestValue(n);
    vector<vector<int>> bestPath(n);
    for (int i = n - 1; i >= 0; --i) {
        bestValue[i] = mines[i];
        bestPath[i] = {i + 1};
        for (int next : graph[i]) {
            long long candidateValue = mines[i] + bestValue[next];
            vector<int> candidatePath{i + 1};
            candidatePath.insert(candidatePath.end(), bestPath[next].begin(), bestPath[next].end());
            if (candidateValue > bestValue[i] ||
                (candidateValue == bestValue[i] && candidatePath < bestPath[i])) {
                bestValue[i] = candidateValue;
                bestPath[i] = move(candidatePath);
            }
        }
    }

    int start = 0;
    for (int i = 1; i < n; ++i) {
        if (bestValue[i] > bestValue[start] ||
            (bestValue[i] == bestValue[start] && bestPath[i] < bestPath[start])) start = i;
    }
    for (int i = 0; i < static_cast<int>(bestPath[start].size()); ++i) {
        if (i) cout << ' ';
        cout << bestPath[start][i];
    }
    cout << '\n' << bestValue[start] << '\n';
    return 0;
}`)
    case 8:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<vector<long long>> matrix(rows, vector<long long>(columns));
    for (auto& row : matrix) for (long long& value : row) cin >> value;

    vector<vector<int>> memo(rows, vector<int>(columns));
    const array<int, 4> dx{1, -1, 0, 0};
    const array<int, 4> dy{0, 0, 1, -1};
    function<int(int, int)> dfs = [&](int x, int y) {
        if (memo[x][y] != 0) return memo[x][y];
        int best = 1;
        for (int direction = 0; direction < 4; ++direction) {
            int nx = x + dx[direction];
            int ny = y + dy[direction];
            if (nx >= 0 && nx < rows && ny >= 0 && ny < columns && matrix[nx][ny] > matrix[x][y]) {
                best = max(best, 1 + dfs(nx, ny));
            }
        }
        return memo[x][y] = best;
    };

    int answer = 0;
    for (int i = 0; i < rows; ++i) for (int j = 0; j < columns; ++j) answer = max(answer, dfs(i, j));
    cout << answer << '\n';
    return 0;
}`)
    case 9:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> values(n);
    for (int& value : values) cin >> value;
    vector<int> dp(n, 1);
    int answer = 1;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < i; ++j) {
            if (values[j] < values[i]) dp[i] = max(dp[i], dp[j] + 1);
        }
        answer = max(answer, dp[i]);
    }
    cout << answer << '\n';
    return 0;
}`)
    case 10:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> height(n);
    for (int& value : height) cin >> value;
    vector<int> left(n, 1), right(n, 1);
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < i; ++j) if (height[j] < height[i]) left[i] = max(left[i], left[j] + 1);
    }
    for (int i = n - 1; i >= 0; --i) {
        for (int j = n - 1; j > i; --j) if (height[j] < height[i]) right[i] = max(right[i], right[j] + 1);
    }
    int bestFormation = 0;
    for (int i = 0; i < n; ++i) bestFormation = max(bestFormation, left[i] + right[i] - 1);
    cout << n - bestFormation << '\n';
    return 0;
}`)
    case 11:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int totalTime, taskCount;
    cin >> totalTime >> taskCount;
    vector<vector<int>> tasks(totalTime + 2);
    while (taskCount--) {
        int start, duration;
        cin >> start >> duration;
        tasks[start].push_back(duration);
    }
    vector<int> dp(totalTime + 2);
    for (int time = totalTime; time >= 1; --time) {
        if (tasks[time].empty()) {
            dp[time] = dp[time + 1] + 1;
        } else {
            for (int duration : tasks[time]) dp[time] = max(dp[time], dp[time + duration]);
        }
    }
    cout << dp[1] << '\n';
    return 0;
}`)
    case 12:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<long long> dp(columns, 1);
    for (int row = 1; row < rows; ++row) {
        for (int column = 1; column < columns; ++column) dp[column] += dp[column - 1];
    }
    cout << dp.back() << '\n';
    return 0;
}`)
    case 13:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int targetX, targetY, horseX, horseY;
    cin >> targetX >> targetY >> horseX >> horseY;
    vector<vector<bool>> blocked(targetX + 1, vector<bool>(targetY + 1));
    const array<int, 9> dx{0, 1, 1, -1, -1, 2, 2, -2, -2};
    const array<int, 9> dy{0, 2, -2, 2, -2, 1, -1, 1, -1};
    for (int move = 0; move < 9; ++move) {
        int x = horseX + dx[move];
        int y = horseY + dy[move];
        if (x >= 0 && x <= targetX && y >= 0 && y <= targetY) blocked[x][y] = true;
    }

    vector<vector<long long>> dp(targetX + 1, vector<long long>(targetY + 1));
    if (!blocked[0][0]) dp[0][0] = 1;
    for (int x = 0; x <= targetX; ++x) {
        for (int y = 0; y <= targetY; ++y) {
            if (blocked[x][y] || (x == 0 && y == 0)) continue;
            if (x > 0) dp[x][y] += dp[x - 1][y];
            if (y > 0) dp[x][y] += dp[x][y - 1];
        }
    }
    cout << dp[targetX][targetY] << '\n';
    return 0;
}`)
    case 14:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<long long> dp(columns);
    for (int row = 0; row < rows; ++row) {
        for (int column = 0; column < columns; ++column) {
            int obstacle;
            cin >> obstacle;
            if (obstacle) dp[column] = 0;
            else if (row == 0 && column == 0) dp[column] = 1;
            else if (column > 0) dp[column] += dp[column - 1];
        }
    }
    cout << dp.back() << '\n';
    return 0;
}`)
    case 15:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    const long long infinity = numeric_limits<long long>::max() / 4;
    vector<long long> dp(columns, infinity);
    for (int row = 0; row < rows; ++row) {
        for (int column = 0; column < columns; ++column) {
            long long value;
            cin >> value;
            if (row == 0 && column == 0) dp[column] = value;
            else dp[column] = value + min(dp[column], column > 0 ? dp[column - 1] : infinity);
        }
    }
    cout << dp.back() << '\n';
    return 0;
}`)
    case 16:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int rows, columns;
    cin >> rows >> columns;
    vector<vector<long long>> grid(rows, vector<long long>(columns));
    for (auto& row : grid) for (long long& value : row) cin >> value;

    const long long negative = numeric_limits<long long>::lowest() / 4;
    vector<vector<long long>> dp(rows, vector<long long>(rows, negative));
    dp[0][0] = grid[0][0];
    for (int step = 1; step <= rows + columns - 2; ++step) {
        vector<vector<long long>> next(rows, vector<long long>(rows, negative));
        for (int x1 = 0; x1 < rows; ++x1) {
            int y1 = step - x1;
            if (y1 < 0 || y1 >= columns) continue;
            for (int x2 = 0; x2 < rows; ++x2) {
                int y2 = step - x2;
                if (y2 < 0 || y2 >= columns) continue;
                long long previous = negative;
                for (int fromX1 : {x1, x1 - 1}) {
                    for (int fromX2 : {x2, x2 - 1}) {
                        if (fromX1 >= 0 && fromX2 >= 0) previous = max(previous, dp[fromX1][fromX2]);
                    }
                }
                if (previous == negative) continue;
                long long gain = grid[x1][y1];
                if (x1 != x2) gain += grid[x2][y2];
                next[x1][x2] = previous + gain;
            }
        }
        dp.swap(next);
    }
    cout << dp[rows - 1][rows - 1] << '\n';
    return 0;
}`)
    case 17:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string left, right;
    cin >> left >> right;
    if (left == "-") left.clear();
    if (right == "-") right.clear();

    vector<int> previous(right.size() + 1);
    iota(previous.begin(), previous.end(), 0);
    for (int i = 1; i <= static_cast<int>(left.size()); ++i) {
        vector<int> current(right.size() + 1);
        current[0] = i;
        for (int j = 1; j <= static_cast<int>(right.size()); ++j) {
            int replaceCost = left[i - 1] == right[j - 1] ? 0 : 1;
            current[j] = min({previous[j] + 1, current[j - 1] + 1, previous[j - 1] + replaceCost});
        }
        previous.swap(current);
    }
    cout << previous.back() << '\n';
    return 0;
}`)
    case 18:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int totalTime, itemCount;
    cin >> totalTime >> itemCount;
    vector<long long> dp(totalTime + 1);
    while (itemCount--) {
        int time, value;
        cin >> time >> value;
        for (int capacity = totalTime; capacity >= time; --capacity) {
            dp[capacity] = max(dp[capacity], dp[capacity - time] + value);
        }
    }
    cout << dp[totalTime] << '\n';
    return 0;
}`)
    case 19:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int capacity, itemCount;
    cin >> capacity >> itemCount;
    vector<int> dp(capacity + 1);
    while (itemCount--) {
        int volume;
        cin >> volume;
        for (int space = capacity; space >= volume; --space) {
            dp[space] = max(dp[space], dp[space - volume] + volume);
        }
    }
    cout << capacity - dp[capacity] << '\n';
    return 0;
}`)
    case 20:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int totalTime, typeCount;
    cin >> totalTime >> typeCount;
    vector<long long> dp(totalTime + 1);
    while (typeCount--) {
        int time, value;
        cin >> time >> value;
        for (int capacity = time; capacity <= totalTime; ++capacity) {
            dp[capacity] = max(dp[capacity], dp[capacity - time] + value);
        }
    }
    cout << dp[totalTime] << '\n';
    return 0;
}`)
    case 21:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int itemCount, target;
    cin >> itemCount >> target;
    vector<long long> dp(target + 1);
    dp[0] = 1;
    while (itemCount--) {
        int price;
        cin >> price;
        for (int amount = target; amount >= price; --amount) dp[amount] += dp[amount - price];
    }
    cout << dp[target] << '\n';
    return 0;
}`)
    case 22:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> values(n);
    int total = 0;
    for (int& value : values) {
        cin >> value;
        total += value;
    }
    if (total % 2 != 0) {
        cout << "NO\n";
        return 0;
    }
    int target = total / 2;
    vector<bool> possible(target + 1);
    possible[0] = true;
    for (int value : values) {
        for (int sum = target; sum >= value; --sum) possible[sum] = possible[sum] || possible[sum - value];
    }
    cout << (possible[target] ? "YES" : "NO") << '\n';
    return 0;
}`)
    case 23:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int typeCount, amount;
    cin >> typeCount >> amount;
    vector<int> coins(typeCount);
    for (int& coin : coins) cin >> coin;
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int sum = coin; sum <= amount; ++sum) dp[sum] = min(dp[sum], dp[sum - coin] + 1);
    }
    cout << (dp[amount] > amount ? -1 : dp[amount]) << '\n';
    return 0;
}`)
    case 24:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int typeCount, amount;
    cin >> typeCount >> amount;
    vector<int> coins(typeCount);
    for (int& coin : coins) cin >> coin;
    vector<long long> dp(amount + 1);
    dp[0] = 1;
    for (int coin : coins) {
        for (int sum = coin; sum <= amount; ++sum) dp[sum] += dp[sum - coin];
    }
    cout << dp[amount] << '\n';
    return 0;
}`)
    case 25:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int count, target;
    cin >> count >> target;
    vector<int> values(count);
    for (int& value : values) cin >> value;
    vector<long long> dp(target + 1);
    dp[0] = 1;
    for (int sum = 1; sum <= target; ++sum) {
        for (int value : values) if (value <= sum) dp[sum] += dp[sum - value];
    }
    cout << dp[target] << '\n';
    return 0;
}`)
    case 26:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int typeCount, capacity;
    cin >> typeCount >> capacity;
    vector<long long> dp(capacity + 1);
    while (typeCount--) {
        int value, weight, amount;
        cin >> value >> weight >> amount;
        for (int group = 1; amount > 0; group *= 2) {
            int take = min(group, amount);
            amount -= take;
            int groupWeight = weight * take;
            int groupValue = value * take;
            for (int space = capacity; space >= groupWeight; --space) {
                dp[space] = max(dp[space], dp[space - groupWeight] + groupValue);
            }
        }
    }
    cout << dp[capacity] << '\n';
    return 0;
}`)
    case 27:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int capacity, itemCount;
    cin >> capacity >> itemCount;
    map<int, vector<pair<int, int>>> groups;
    while (itemCount--) {
        int weight, value, group;
        cin >> weight >> value >> group;
        groups[group].push_back({weight, value});
    }

    vector<long long> dp(capacity + 1);
    for (const auto& [group, items] : groups) {
        vector<long long> previous = dp;
        for (int space = 0; space <= capacity; ++space) {
            for (const auto& [weight, value] : items) {
                if (weight <= space) dp[space] = max(dp[space], previous[space - weight] + value);
            }
        }
    }
    cout << dp[capacity] << '\n';
    return 0;
}`)
    case 28:
      return cpp(String.raw`
int toMinutes(const string& clock) {
    int separator = static_cast<int>(clock.find(':'));
    return stoi(clock.substr(0, separator)) * 60 + stoi(clock.substr(separator + 1));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string startClock, endClock;
    int typeCount;
    cin >> startClock >> endClock >> typeCount;
    int totalTime = toMinutes(endClock) - toMinutes(startClock);
    vector<long long> dp(totalTime + 1);
    while (typeCount--) {
        int time, value, amount;
        cin >> time >> value >> amount;
        if (amount == 0) {
            for (int space = time; space <= totalTime; ++space) {
                dp[space] = max(dp[space], dp[space - time] + value);
            }
            continue;
        }
        for (int group = 1; amount > 0; group *= 2) {
            int take = min(group, amount);
            amount -= take;
            int groupTime = time * take;
            int groupValue = value * take;
            for (int space = totalTime; space >= groupTime; --space) {
                dp[space] = max(dp[space], dp[space - groupTime] + groupValue);
            }
        }
    }
    cout << dp[totalTime] << '\n';
    return 0;
}`)
    case 29:
      return cpp(String.raw`
struct Item {
    int price = 0;
    int value = 0;
    int parent = 0;
    vector<int> accessories;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int budget, itemCount;
    cin >> budget >> itemCount;
    vector<Item> items(itemCount + 1);
    for (int i = 1; i <= itemCount; ++i) {
        int importance;
        cin >> items[i].price >> importance >> items[i].parent;
        items[i].value = items[i].price * importance;
    }
    for (int i = 1; i <= itemCount; ++i) {
        if (items[i].parent != 0) items[items[i].parent].accessories.push_back(i);
    }

    vector<long long> dp(budget + 1);
    for (int i = 1; i <= itemCount; ++i) {
        if (items[i].parent != 0) continue;
        vector<pair<int, int>> options{{items[i].price, items[i].value}};
        for (int accessory : items[i].accessories) {
            options.push_back({items[i].price + items[accessory].price,
                               items[i].value + items[accessory].value});
        }
        if (items[i].accessories.size() == 2) {
            int first = items[i].accessories[0];
            int second = items[i].accessories[1];
            options.push_back({items[i].price + items[first].price + items[second].price,
                               items[i].value + items[first].value + items[second].value});
        }
        vector<long long> previous = dp;
        for (int space = 0; space <= budget; ++space) {
            for (const auto& [price, value] : options) {
                if (price <= space) dp[space] = max(dp[space], previous[space - price] + value);
            }
        }
    }
    cout << dp[budget] << '\n';
    return 0;
}`)
    case 30:
      return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int companyCount, target;
    cin >> companyCount >> target;
    vector<pair<int, int>> packages(companyCount);
    for (auto& [cost, weight] : packages) cin >> cost >> weight;
    const long long infinity = numeric_limits<long long>::max() / 4;
    vector<long long> dp(target + 1, infinity);
    dp[0] = 0;
    for (int weight = 0; weight < target; ++weight) {
        if (dp[weight] == infinity) continue;
        for (const auto& [cost, gain] : packages) {
            int nextWeight = min(target, weight + gain);
            dp[nextWeight] = min(dp[nextWeight], dp[weight] + cost);
        }
    }
    cout << dp[target] << '\n';
    return 0;
}`)
    default:
      throw new Error(`missing C++ solution for ${number}`)
  }
}

function writeText(filePath, content) {
  if (content.includes('\r')) throw new Error(`CR detected in generated content: ${filePath}`)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function generateLab(item) {
  const labDirectory = path.join(LAB_ROOT, item.dir)
  if (!fs.existsSync(labDirectory)) throw new Error(`missing scaffold ${item.dir}`)
  const scaffoldReadme = fs.readFileSync(path.join(labDirectory, 'README.md'), 'utf8')
  if (!scaffoldReadme.includes(`labId: "${item.labId}"`)) throw new Error(`scaffold ID mismatch for ${item.dir}`)

  const planned = buildInputs(item.number).map((test, index) => {
    const sequence = String(index + 1).padStart(3, '0')
    const label = index === 0 ? 'sample' : index <= 2 ? 'boundary' : index <= 5 ? 'regression' : index >= 18 ? 'stress' : 'normal'
    const basename = `${sequence}-${label}`
    const output = solveWithOracle(item.number, test.input)
    if (output.length === 0 || output.includes('NaN') || output.includes('Infinity')) throw new Error(`bad oracle output ${item.labId}/${basename}`)
    return { ...test, output, basename }
  })

  const caseManifest = planned.map((test) => ({
    id: test.basename,
    input: `tests/${test.basename}.in`,
    expected: `tests/${test.basename}.out`,
    points: 5,
    tags: test.tags
  }))
  const totalPoints = caseManifest.reduce((sum, test) => sum + test.points, 0)
  if (caseManifest.length !== 20 || totalPoints !== 100) throw new Error(`case contract mismatch for ${item.labId}`)

  const casesForReadme = planned.map((test) => ({ input: test.input, output: test.output }))
  const files = new Map([
    [path.join(labDirectory, 'README.md'), makeReadme(item, casesForReadme)],
    [path.join(labDirectory, 'lab.json'), manifest()],
    [path.join(labDirectory, 'Makefile'), thinMakefile],
    [path.join(labDirectory, 'student', 'main.cpp'), studentSource(item)],
    [path.join(labDirectory, 'solution', 'main.cpp'), solutionSource(item.number)],
    [path.join(labDirectory, 'tests', 'cases.json'), `${JSON.stringify(caseManifest, null, 2)}\n`]
  ])
  for (const test of planned) {
    files.set(path.join(labDirectory, 'tests', `${test.basename}.in`), test.input)
    files.set(path.join(labDirectory, 'tests', `${test.basename}.out`), test.output)
  }
  if (WRITE) for (const [filePath, content] of files) writeText(filePath, content)
  return { labId: item.labId, files: files.size, cases: planned.length }
}

if (!fs.existsSync(LAB_ROOT)) throw new Error(`missing chapter 14 exercise root: ${LAB_ROOT}`)
if (catalog.length !== 30) throw new Error(`catalog must contain 30 labs, got ${catalog.length}`)
if (new Set(catalog.map((item) => item.labId)).size !== catalog.length) throw new Error('duplicate lab ID')
if (new Set(catalog.map((item) => item.slug)).size !== catalog.length) throw new Error('duplicate slug')

const report = catalog.map(generateLab)
const totalCases = report.reduce((sum, item) => sum + item.cases, 0)
const mode = WRITE ? 'WRITE' : 'DRY-RUN'
console.log(`${mode}: ${report.length} Labs, ${totalCases} cases, ${report.reduce((sum, item) => sum + item.files, 0)} generated files`)
console.log(`${report[0].labId}..${report.at(-1).labId}`)
