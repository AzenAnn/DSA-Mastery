import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const LAB_ROOT = path.join(ROOT, 'labs', 'chapter-12', 'exercise')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')

const catalog = [
  {
    title: 'Function', slug: 'function-memoization', source: '洛谷 P1464', sourceUrl: 'https://www.luogu.com.cn/problem/P1464', article: '01-recursion-contracts.md', difficulty: '基础', duration: '45～60 分钟',
    description: '用记忆化递归实现经典三参数函数，区分定义域裁剪、边界与缓存。',
    statement: '按题目给定的分段递归定义计算函数 w(a,b,c)。输入包含多组三元组，以 -1 -1 -1 结束；终止行不输出。',
    input: '每行三个 64 位整数 `a b c`。当且仅当三者均为 `-1` 时结束。',
    output: '对每组数据输出 `w(a, b, c) = answer`，其中空格与标点必须与样例一致。',
    constraints: '测试组数不超过 `10^5`；输入可超出 `0..20`，但有效缓存状态只有 `21³` 个。',
    contract: '`solve(a,b,c)` 返回递归定义中的 `w(a,b,c)`；先处理非正数和大于 20 的边界，再查询或写入缓存。',
    split: '每个非边界状态依题目条件拆成 3 个或 4 个更小参数状态。',
    combine: '按递归式执行加减；相同状态只求一次。',
    complexity: '时间 `O(21³ + T)`，空间 `O(21³)`，其中 `T` 为输入组数。',
    trap: '不要先用输入下标访问缓存；负数和大于 20 的参数会越界。',
    sampleInput: '1 1 1\n2 2 2\n10 4 6\n50 50 50\n-1 7 18\n-1 -1 -1\n',
    sampleOutput: 'w(1, 1, 1) = 2\nw(2, 2, 2) = 4\nw(10, 4, 6) = 523\nw(50, 50, 50) = 1048576\nw(-1, 7, 18) = 1\n'
  },
  {
    title: '幂次方', slug: 'power-expression', source: '洛谷 P1010', sourceUrl: 'https://www.luogu.com.cn/problem/P1010', article: '01-recursion-contracts.md', difficulty: '基础', duration: '45～60 分钟',
    description: '递归输出整数的二进制幂次表示，练习输出型递归的精确定义。',
    statement: '把正整数写成若干个 2 的幂之和，并继续递归表示指数。指数 0 写成 `2(0)`，指数 1 写成 `2`，其余写成 `2(expression)`；各项按指数从大到小排列。',
    input: '一行一个整数 `n`。', output: '输出 `n` 的题目规定幂次表示，不输出空格。', constraints: '`1 ≤ n ≤ 20000`。',
    contract: '`encode(n)` 返回整数 `n` 的唯一规范字符串。', split: '找出所有为 1 的二进制位；大于 1 的位指数继续交给 `encode`。', combine: '按指数降序用 `+` 连接各项。',
    complexity: '主层扫描 `O(log n)` 个二进制位，递归指数很小；空间为递归深度 `O(log log n)`。',
    trap: '指数 0 和 1 有特殊格式，不能统一写成 `2(encode(exp))`。', sampleInput: '137\n', sampleOutput: '2(2(2)+2+2(0))+2(2+2(0))+2(0)\n'
  },
  {
    title: '南蛮图腾', slug: 'south-barbarian-totem', source: '洛谷 P1498', sourceUrl: 'https://www.luogu.com.cn/problem/P1498', article: '02-call-stack-and-iteration.md', difficulty: '基础', duration: '50～70 分钟',
    description: '用自相似图形理解递归返回后再组合结果的过程。',
    statement: '输出规模为 n 的南蛮图腾。规模 1 是两行三角形；每扩大一级，上半部分放置一个旧图形，下半部分并排放置两个旧图形。',
    input: '一行一个整数 `n`。', output: '输出 `2^n` 行 ASCII 图。行末多余空格不参与本地 exact 比较，但行首与行内空格必须正确。', constraints: '`1 ≤ n ≤ 10`。',
    contract: '`build(n)` 返回高度 `2^n`、逻辑宽度 `2^(n+1)` 的字符画。', split: '递归取得规模 `n-1` 的完整图形。', combine: '上半居中复制一次，下半左右复制两次。',
    complexity: '时间与输出量相同，为 `Θ(4^n)`；递归辅助栈 `O(n)`。', trap: '不要在控制台用不稳定的退格或光标移动；先构造每一行再输出。', sampleInput: '2\n', sampleOutput: '   /\\\n  /__\\\n /\\  /\\\n/__\\/__\\\n', compare: { mode: 'exact' }, outputKb: 8192, timeMs: 5000
  },
  {
    title: 'Pow(x, n)', slug: 'pow-x-n', source: 'LeetCode 50', sourceUrl: 'https://leetcode.cn/problems/powx-n/', article: '03-divide-conquer-modeling.md', difficulty: '基础', duration: '40～55 分钟',
    description: '用二分递归把线性次乘法降为对数次乘法，并安全处理最小负指数。',
    statement: '计算实数 x 的整数 n 次幂。不得调用语言内置的幂函数作为核心算法。', input: '一行一个浮点数 `x` 和一个 32 位整数 `n`。', output: '输出 `x^n`，本地判题使用绝对与相对误差 `1e-9`。', constraints: '`-100 < x < 100`，`-2^31 ≤ n ≤ 2^31-1`；测试保证结果可表示。',
    contract: '`fastPow(x,e)` 处理非负 64 位指数 `e` 并返回幂。', split: '只递归计算一次 `x^(e/2)`。', combine: '平方半幂；奇数指数再乘一个 x。负指数先转为倒数。', complexity: '时间 `O(log |n|)`，递归栈 `O(log |n|)`。', trap: '直接对 32 位的 `INT_MIN` 取负会溢出，应先提升到 64 位。', sampleInput: '2.00000 10\n', sampleOutput: '1024\n', compare: { mode: 'float', absTol: 1e-9, relTol: 1e-9 }
  },
  {
    title: '赦免战俘', slug: 'pardon-prisoners', source: '洛谷 P5461', sourceUrl: 'https://www.luogu.com.cn/problem/P5461', article: '03-divide-conquer-modeling.md', difficulty: '基础', duration: '45～65 分钟',
    description: '在二维方阵上递归处理三个子象限，建立几何分治坐标感。',
    statement: '有一个 `2^n × 2^n` 的全 1 方阵。每次把当前方阵左上角四分之一改为 0，并对其余三个四分之一继续相同过程，直到边长为 1。输出最终矩阵。', input: '一行一个整数 `n`。', output: '输出 `2^n` 行，每行 `2^n` 个 0/1，元素之间以空格分隔。', constraints: '`1 ≤ n ≤ 10`。',
    contract: '`pardon(row,col,size)` 完成指定正方形区域的全部递归修改。', split: '把区域分为四个等大象限，左上象限整体清零。', combine: '无需数值合并；递归处理右上、左下和右下三个象限。', complexity: '输出本身需要 `Θ(4^n)` 时间与空间。', trap: '只清零最外层左上角是不够的；另外三个象限仍要继续递归。', sampleInput: '2\n', sampleOutput: '0 0 0 1\n0 0 1 1\n0 1 0 1\n1 1 1 1\n', compare: { mode: 'exact' }, outputKb: 8192, timeMs: 5000
  },
  {
    title: 'Secret Cow Code', slug: 'secret-cow-code', source: '洛谷 P3612', sourceUrl: 'https://www.luogu.com.cn/problem/P3612', article: '03-divide-conquer-modeling.md', difficulty: '进阶', duration: '55～75 分钟',
    description: '从巨大递归字符串反向映射下标，避免构造指数增长的内容。',
    statement: '从初始大写字符串 S 开始反复扩展：新串由旧串和“旧串最后一个字符移到最前面后的结果”拼接。求无限扩展过程中第 N 个字符。', input: '一行给出字符串 `S` 和 1-based 位置 `N`。', output: '输出第 `N` 个字符。', constraints: '`1 ≤ |S| ≤ 30`，`1 ≤ N ≤ 10^18`。',
    contract: '`locate(N,len)` 把当前长度 `len` 中的位置映射回前一半，直到落入初始串。', split: '先倍增长度覆盖 N，再逐层判断 N 位于旧串还是旋转副本。', combine: '不构造字符串，只更新 N 和当前长度。', complexity: '时间 `O(log(N/|S|))`，额外空间 `O(1)`。', trap: '旋转副本的第一个字符来自旧串末尾，其余位置向前偏移一位。', sampleInput: 'COW 8\n', sampleOutput: 'C\n'
  },
  {
    title: '求第 k 小的数', slug: 'kth-smallest-quickselect', source: '洛谷 P1923', sourceUrl: 'https://www.luogu.com.cn/problem/P1923', article: '04-combine-patterns.md', difficulty: '基础', duration: '55～75 分钟',
    description: '用三路划分快速选择，只递归进入包含目标下标的一侧。',
    statement: '给定 n 个整数和 0-based 下标 k，求升序排列后下标为 k 的数。', input: '第一行 `n k`，第二行 n 个整数。', output: '输出第 k 小的数。', constraints: '`1 ≤ n ≤ 5×10^6`，`0 ≤ k < n`，元素在 32 位整数范围内。',
    contract: '`select(left,right,k)` 保证返回当前区间按升序排列后全局下标 k 对应的值。', split: '以枢轴做 `<`、`=`、`>` 三路划分。', combine: '若 k 落入等于区间直接返回，否则只进入一侧，不需要合并数组。', complexity: '期望时间 `O(n)`，最坏 `O(n²)`；原地额外空间取决于递归深度。', trap: '题目的 k 从 0 开始；重复值需要三路划分，否则可能退化或死循环。', sampleInput: '5 1\n4 3 2 1 5\n', sampleOutput: '2\n', timeMs: 4000
  },
  {
    title: 'Sort an Array', slug: 'sort-array-merge', source: 'LeetCode 912', sourceUrl: 'https://leetcode.cn/problems/sort-an-array/', article: '04-combine-patterns.md', difficulty: '基础', duration: '50～70 分钟',
    description: '完整实现归并排序，重点维护合并阶段的有序区间不变量。',
    statement: '给定整数数组，将其按非递减顺序排序。课程要求使用归并排序完成。', input: '第一行 `n`，第二行 n 个整数。', output: '输出排序后的 n 个整数，以空格分隔。', constraints: '`1 ≤ n ≤ 5×10^4`，`-5×10^4 ≤ a[i] ≤ 5×10^4`。',
    contract: '`mergeSort(left,right)` 返回时保证闭区间 `[left,right]` 已排序。', split: '按中点拆成两个近似等长区间并递归排序。', combine: '用双指针稳定合并两个有序区间。', complexity: '时间 `O(n log n)`，辅助数组 `O(n)`，递归栈 `O(log n)`。', trap: '合并后必须把临时结果写回原数组；相等时先取左侧可保持稳定。', sampleInput: '5\n5 2 3 1 2\n', sampleOutput: '1 2 2 3 5\n'
  },
  {
    title: 'Construct Quad Tree', slug: 'construct-quad-tree', source: 'LeetCode 427', sourceUrl: 'https://leetcode.cn/problems/construct-quad-tree/', article: '04-combine-patterns.md', difficulty: '进阶', duration: '65～85 分钟',
    description: '递归压缩二值网格，并用规范前序序列稳定表达树结构。',
    statement: '把 `n×n` 的 0/1 网格构造成四叉树：区域全相同则成为叶结点，否则分成四个象限。', input: '第一行 `n`，随后 n 行各 n 个 0/1。n 是 2 的幂。', output: '输出规范前序 token：叶子为 `L0` 或 `L1`，内部结点为 `I`，子树顺序固定为左上、右上、左下、右下，token 以空格分隔。', constraints: '`1 ≤ n ≤ 64`。',
    contract: '`build(row,col,size)` 返回恰好表示该正方形区域的最简四叉树。', split: '若区域不统一，按左上、右上、左下、右下分成四块。', combine: '创建内部结点并按固定顺序挂接四棵子树。', complexity: '朴素均匀性检查最坏 `O(n² log n)`，空间为树结点与递归栈。', trap: '本地输出不是 LeetCode 的数组序列化；必须遵守课程定义的 token 与子树顺序。', sampleInput: '2\n1 1\n1 0\n', sampleOutput: 'I L1 L1 L1 L0\n'
  },
  {
    title: '地毯填补问题', slug: 'carpet-tromino', source: '洛谷 P1228', sourceUrl: 'https://www.luogu.com.cn/problem/P1228', article: '04-combine-patterns.md', difficulty: '进阶', duration: '70～95 分钟',
    description: '用中心 L 形骨牌制造四个同构子问题，练习“先补接口，再递归”。',
    statement: '在 `2^k × 2^k` 棋盘中有一个特殊方格。用 L 形骨牌覆盖其余方格，每块骨牌输出左上参考坐标 `(x,y)` 与方向编号 `c`。', input: '一行三个整数 `k x y`，其中 `(x,y)` 是 1-based 特殊方格坐标。', output: '每行输出一块骨牌 `x y c`。本地固定规范为：先输出当前层中心骨牌，再按左上、右上、左下、右下递归；方向编号沿用原题定义。', constraints: '`1 ≤ k ≤ 10`，`1 ≤ x,y ≤ 2^k`。',
    contract: '`tile(top,left,size,holeX,holeY)` 覆盖区域内除指定洞外的所有格。', split: '判断真实洞所在象限，用一块中心骨牌在另外三个象限各制造一个虚拟洞。', combine: '中心骨牌连接四个子问题，之后四个象限彼此独立。', complexity: '骨牌数为 `(4^k-1)/3`，时间与输出均为 `Θ(4^k)`，递归栈 `O(k)`。', trap: '洛谷原题使用 Special Judge，合法方案不唯一；本地为了可复现只接受上述固定输出次序和规范方案，判定范围比原题更窄。', sampleInput: '2 1 1\n', sampleOutput: '3 3 1\n2 2 1\n1 4 3\n4 1 2\n4 4 1\n', compare: { mode: 'exact' }, outputKb: 16384, timeMs: 6000
  },
  {
    title: '逆序对', slug: 'inversion-count', source: '洛谷 P1908', sourceUrl: 'https://www.luogu.com.cn/problem/P1908', article: '04-combine-patterns.md', difficulty: '基础', duration: '55～75 分钟',
    description: '在归并两个有序区间时统计跨区间逆序对。',
    statement: '给定长度为 n 的序列，统计满足 `i<j` 且 `a[i]>a[j]` 的下标对数量。', input: '第一行 `n`，第二行 n 个整数。', output: '输出逆序对数量。', constraints: '`1 ≤ n ≤ 5×10^5`，元素为不超过 `10^9` 的整数。',
    contract: '`count(left,right)` 返回区间内逆序对数，并把该区间排为非递减。', split: '递归统计左半、右半内部答案。', combine: '合并时若右值小于当前左值，它与左侧尚未合并的所有元素组成逆序对。', complexity: '时间 `O(n log n)`，空间 `O(n)`；答案必须使用 64 位整数。', trap: '相等元素不是逆序对，比较条件不能写成 `>=`。', sampleInput: '6\n5 4 2 6 3 1\n', sampleOutput: '11\n', timeMs: 4000
  },
  {
    title: 'Different Ways to Add Parentheses', slug: 'different-ways-add-parentheses', source: 'LeetCode 241', sourceUrl: 'https://leetcode.cn/problems/different-ways-to-add-parentheses/', article: '04-combine-patterns.md', difficulty: '进阶', duration: '60～85 分钟',
    description: '枚举最后执行的运算符，组合左右子表达式的全部结果。',
    statement: '给定由非负整数与 `+`、`-`、`*` 组成的表达式，返回所有不同括号化方式得到的结果。', input: '一行一个合法表达式。', output: '把所有结果按非递减顺序输出，空格分隔；重复结果必须保留。', constraints: '表达式长度不超过 20，单个数在 `0..99`，结果数量不超过 `10^4`。',
    contract: '`solve(l,r)` 返回子串 `[l,r)` 的全部计算结果，包含重复值。', split: '枚举每个运算符作为最后一次运算，递归求左右结果集合。', combine: '对左右结果做笛卡尔积并执行当前运算，再汇总所有分割点。', complexity: '输出规模可能呈 Catalan 增长；记忆化避免重复解析同一子串。', trap: '不能用 set 去重；题目按括号化方式计数，相同数值可能出现多次。', sampleInput: '2*3-4*5\n', sampleOutput: '-34 -14 -10 -10 10\n'
  },
  {
    title: 'Beautiful Array', slug: 'beautiful-array', source: 'LeetCode 932', sourceUrl: 'https://leetcode.cn/problems/beautiful-array/', article: '04-combine-patterns.md', difficulty: '进阶', duration: '55～75 分钟',
    description: '利用仿射变换保持性质，递归构造确定的漂亮数组。',
    statement: '构造 `1..n` 的一个排列，使任意 `i<k<j` 都不满足 `2*a[k]=a[i]+a[j]`。', input: '一行一个整数 `n`。', output: '输出课程规范构造：先递归构造 `ceil(n/2)` 并映射为奇数 `2x-1`，再递归构造 `floor(n/2)` 并映射为偶数 `2x`。', constraints: '`1 ≤ n ≤ 1000`。',
    contract: '`beautiful(n)` 返回 `1..n` 的规范漂亮排列。', split: '分别递归解决奇数位置的缩小问题和偶数位置的缩小问题。', combine: '奇数映射整体放在前，偶数映射整体放在后。', complexity: '时间 `O(n log n)`（直接递归拼接），输出空间 `O(n)`。', trap: '漂亮数组答案不唯一；本地只接受“奇数映射在前、偶数映射在后”的规范构造。', sampleInput: '5\n', sampleOutput: '1 5 3 2 4\n'
  },
  {
    title: 'Reverse Pairs', slug: 'reverse-pairs', source: 'LeetCode 493', sourceUrl: 'https://leetcode.cn/problems/reverse-pairs/', article: '04-combine-patterns.md', difficulty: '挑战', duration: '70～95 分钟',
    description: '在归并排序中用单调双指针统计 `a[i] > 2*a[j]` 的跨区间数对。',
    statement: '给定整数数组，统计满足 `i<j` 且 `a[i] > 2*a[j]` 的重要翻转对数量。', input: '第一行 `n`，第二行 n 个 32 位整数。', output: '输出重要翻转对数量。', constraints: '`1 ≤ n ≤ 5×10^4`。',
    contract: '`count(left,right)` 返回区间内重要翻转对数，并把区间排序。', split: '递归统计左右半区内部答案。', combine: '两半有序后，对每个左元素单调推进右指针统计，再执行普通归并。', complexity: '时间 `O(n log n)`，空间 `O(n)`。', trap: '`2*a[j]` 必须在 64 位中计算，否则极值会溢出并改变比较结果。', sampleInput: '5\n1 3 2 3 1\n', sampleOutput: '2\n'
  },
  {
    title: 'Count of Smaller Numbers After Self', slug: 'count-smaller-after-self', source: 'LeetCode 315', sourceUrl: 'https://leetcode.cn/problems/count-of-smaller-numbers-after-self/', article: '04-combine-patterns.md', difficulty: '挑战', duration: '75～100 分钟',
    description: '归并原下标而不是数值本身，为每个元素累计右侧更小元素数。',
    statement: '对数组中每个位置 i，计算其右侧严格小于 `a[i]` 的元素个数。', input: '第一行 `n`，第二行 n 个整数。', output: '输出 n 个计数，按原数组顺序排列。', constraints: '`1 ≤ n ≤ 10^5`，`-10^4 ≤ a[i] ≤ 10^4`。',
    contract: '`sortIndices(left,right)` 返回按数值稳定排序的原下标区间，并把跨区间贡献累加到答案。', split: '按原位置把下标数组分成左右两半。', combine: '合并时记录已经先取出的右半较小元素数量，并加到每个左半元素。', complexity: '时间 `O(n log n)`，空间 `O(n)`。', trap: '相等值不算更小；比较相等时应先取左侧，避免误计。', sampleInput: '4\n5 2 6 1\n', sampleOutput: '2 1 1 0\n'
  },
  {
    title: 'Count of Range Sum', slug: 'count-range-sum', source: 'LeetCode 327', sourceUrl: 'https://leetcode.cn/problems/count-of-range-sum/', article: '04-combine-patterns.md', difficulty: '挑战', duration: '80～110 分钟',
    description: '把区间和转化为前缀和差值，并在归并层用两个滑动边界计数。',
    statement: '给定整数数组与 `lower≤upper`，统计区间和落在闭区间 `[lower,upper]` 内的连续子数组数量。', input: '第一行 `n lower upper`，第二行 n 个 32 位整数。', output: '输出合法连续子数组数量。', constraints: '`1 ≤ n ≤ 10^5`，`-10^5 ≤ lower≤upper ≤10^5`。',
    contract: '`count(prefix,left,right)` 统计前缀和下标区间中的合法有序对，并在返回时将其排序。', split: '把前缀和数组按下标分成左右两半，递归统计内部区间。', combine: '对每个左前缀和，在有序右半中维护差值落入 `[lower,upper]` 的两个边界，再归并。', complexity: '时间 `O(n log n)`，空间 `O(n)`；前缀和与答案使用 64 位。', trap: '前缀和数组必须包含初始 0，否则会漏掉从下标 0 开始的子数组。', sampleInput: '3 -2 2\n-2 5 -1\n', sampleOutput: '3\n'
  }
]

for (const [index, item] of catalog.entries()) {
  item.number = index + 1
  item.labId = `12E${String(index + 1).padStart(2, '0')}`
  item.dir = `E-12-${String(index + 1).padStart(2, '0')}-${item.slug}`
}

const thinMakefile = `LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)/../../../..\ninclude ../../../../tools/lab/lab.mk\n`

function readme(item) {
  const seq = String(item.number).padStart(2, '0')
  const title = `Lab 12-E-${seq}：${item.title}`
  const labPath = `labs/chapter-12/exercise/${item.dir}`
  return `---
title: "${title}"
description: "${item.description}"
order: ${item.number}
chapter: 12
labId: "${item.labId}"
chapterTitle: "分治与递归"
updated: "2026-09-04"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "${item.difficulty}"
duration: "${item.duration}"
---

# ${title}

## 学习目标

- [ ] 能写清递归函数的输入、返回值、边界条件与规模递减方式。
- [ ] 能识别本题的拆分与合并阶段，并独立完成 C++17 实现。
- [ ] 能用边界或反例解释「${item.trap}」。

## 前置知识与环境

先阅读 [第 12 章对应小节](../../../../content/chapter-12-divide-conquer-recursion/${item.article})，并确保本机可使用 C++17。首次运行可执行 §make doctor§；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

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
${item.sampleInput.trimEnd()}
§§§

### 样例输出

§§§text
${item.sampleOutput.trimEnd()}
§§§

## 递归契约卡

| 问题 | 本题答案 |
| --- | --- |
| 子问题契约 | ${item.contract} |
| Divide | ${item.split} |
| Conquer | 对规模严格更小的子问题递归求解；达到最小规模时直接返回。 |
| Combine | ${item.combine} |
| 终止性检查 | 每次递归都缩短区间、减小规模或把下标映射到更短的一层。 |

::: pitfall 易错点
${item.trap}
:::

## 复杂度目标

${item.complexity}

## 测试设计提示

公开测试共 20 组、每组 5 分，总分 100 分。它们覆盖样例、最小规模、边界值、重复值、负数或极值、典型回归输入和适度压力数据。测试只读取标准输出；调试信息请写到标准错误。

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
- [ ] 能口头说明递归契约、基本情况、规模递减与合并不变量。
- [ ] 主动构造了至少一个会击穿常见错误的额外输入。

## 思考与复盘

1. 如果把子问题契约改成另一种区间语义，边界和合并会怎样变化？
2. 哪个最小反例最容易暴露「${item.trap}」？
3. 递归调用栈保存了哪些信息？能否安全改写成迭代？

## 题目来源与课程化说明

核心问题参考 [${item.source}](${item.sourceUrl})。本 Lab 为统一的标准输入/输出环境重新表述题面，并独立编写参考实现与测试数据；不复制第三方题解、代码或隐藏测试。若本地输出合同与原平台不同，以上“输出格式”和“递归契约卡”是本 Lab 的判定依据。
`.replaceAll('§', '`')
}

function manifest(item) {
  return `${JSON.stringify({
    $schema: '../../../../schemas/lab.schema.json',
    schemaVersion: 1,
    type: 'program',
    language: 'cpp',
    toolchain: { standard: 'c++17', profile: 'course-default' },
    targets: { student: { sources: ['student/main.cpp'] }, solution: { sources: ['solution/main.cpp'] } },
    judge: {
      kind: 'stdio',
      cases: 'tests/cases.json',
      compare: item.compare ?? { mode: 'tokens' },
      limits: { timeMs: item.timeMs ?? 2500, outputKb: item.outputKb ?? 1024 }
    }
  }, null, 2)}\n`
}

function studentSource() {
  return `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: 根据 README 中的递归契约卡实现算法。
    // 先保留一个能编译、但不会通过完整测试的起点。
    string token;
    while (cin >> token) {
    }
    cout << 0 << '\\n';
    return 0;
}
`
}

function cpp(body) {
  return `#include <bits/stdc++.h>\nusing namespace std;\n\n${body.trim()}\n`
}

function solutionSource(number) {
  switch (number) {
    case 1: return cpp(String.raw`
long long memo[21][21][21];
bool ready[21][21][21];

long long solve(long long a, long long b, long long c) {
    if (a <= 0 || b <= 0 || c <= 0) return 1;
    if (a > 20 || b > 20 || c > 20) return solve(20, 20, 20);
    if (ready[a][b][c]) return memo[a][b][c];
    ready[a][b][c] = true;
    if (a < b && b < c) {
        memo[a][b][c] = solve(a, b, c - 1) + solve(a, b - 1, c - 1) - solve(a, b - 1, c);
    } else {
        memo[a][b][c] = solve(a - 1, b, c) + solve(a - 1, b - 1, c)
                       + solve(a - 1, b, c - 1) - solve(a - 1, b - 1, c - 1);
    }
    return memo[a][b][c];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long a, b, c;
    while (cin >> a >> b >> c && !(a == -1 && b == -1 && c == -1)) {
        cout << "w(" << a << ", " << b << ", " << c << ") = " << solve(a, b, c) << '\n';
    }
    return 0;
}`)
    case 2: return cpp(String.raw`
string encode(int value) {
    string result;
    for (int bit = 30; bit >= 0; --bit) {
        if (((value >> bit) & 1) == 0) continue;
        if (!result.empty()) result += '+';
        if (bit == 0) result += "2(0)";
        else if (bit == 1) result += '2';
        else result += "2(" + encode(bit) + ")";
    }
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    cout << encode(n) << '\n';
    return 0;
}`)
    case 3: return cpp(String.raw`
vector<string> build(int level) {
    if (level == 1) return {" /\\", "/__\\"};
    vector<string> previous = build(level - 1);
    int oldHeight = static_cast<int>(previous.size());
    int oldWidth = oldHeight * 2;
    vector<string> result(oldHeight * 2, string(oldWidth * 2, ' '));
    for (int row = 0; row < oldHeight; ++row) {
        result[row].replace(oldHeight, previous[row].size(), previous[row]);
        result[row + oldHeight].replace(0, previous[row].size(), previous[row]);
        result[row + oldHeight].replace(oldWidth, previous[row].size(), previous[row]);
    }
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    for (string row : build(n)) {
        while (!row.empty() && row.back() == ' ') row.pop_back();
        cout << row << '\n';
    }
    return 0;
}`)
    case 4: return cpp(String.raw`
double fastPow(double base, long long exponent) {
    if (exponent == 0) return 1.0;
    double half = fastPow(base, exponent / 2);
    double result = half * half;
    return exponent % 2 == 0 ? result : result * base;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    double x;
    int n;
    cin >> x >> n;
    long long exponent = n;
    if (exponent < 0) {
        x = 1.0 / x;
        exponent = -exponent;
    }
    cout << setprecision(17) << fastPow(x, exponent) << '\n';
    return 0;
}`)
    case 5: return cpp(String.raw`
vector<vector<int>> board;

void pardon(int row, int col, int size) {
    if (size == 1) return;
    int half = size / 2;
    for (int i = row; i < row + half; ++i) {
        for (int j = col; j < col + half; ++j) board[i][j] = 0;
    }
    pardon(row, col + half, half);
    pardon(row + half, col, half);
    pardon(row + half, col + half, half);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    int size = 1 << n;
    board.assign(size, vector<int>(size, 1));
    pardon(0, 0, size);
    for (const auto& row : board) {
        for (int j = 0; j < size; ++j) cout << row[j] << (j + 1 == size ? '\n' : ' ');
    }
    return 0;
}`)
    case 6: return cpp(String.raw`
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string initial;
    unsigned long long position;
    cin >> initial >> position;
    unsigned long long baseLength = initial.size();
    unsigned long long length = baseLength;
    while (length < position) length *= 2;
    while (position > baseLength) {
        unsigned long long half = length / 2;
        if (position == half + 1) position = half;
        else if (position > half + 1) position = position - half - 1;
        length = half;
    }
    cout << initial[static_cast<size_t>(position - 1)] << '\n';
    return 0;
}`)
    case 7: return cpp(String.raw`
int selectK(vector<int>& values, int left, int right, int k) {
    int pivot = values[left + (right - left) / 2];
    int less = left, current = left, greater = right;
    while (current <= greater) {
        if (values[current] < pivot) swap(values[less++], values[current++]);
        else if (values[current] > pivot) swap(values[current], values[greater--]);
        else ++current;
    }
    if (k < less) return selectK(values, left, less - 1, k);
    if (k > greater) return selectK(values, greater + 1, right, k);
    return pivot;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> values(n);
    for (int& value : values) cin >> value;
    cout << selectK(values, 0, n - 1, k) << '\n';
    return 0;
}`)
    case 8: return cpp(String.raw`
void mergeSort(vector<int>& values, vector<int>& buffer, int left, int right) {
    if (right - left <= 1) return;
    int middle = left + (right - left) / 2;
    mergeSort(values, buffer, left, middle);
    mergeSort(values, buffer, middle, right);
    int i = left, j = middle, write = left;
    while (i < middle || j < right) {
        if (j == right || (i < middle && values[i] <= values[j])) buffer[write++] = values[i++];
        else buffer[write++] = values[j++];
    }
    copy(buffer.begin() + left, buffer.begin() + right, values.begin() + left);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> values(n), buffer(n);
    for (int& value : values) cin >> value;
    mergeSort(values, buffer, 0, n);
    for (int i = 0; i < n; ++i) cout << values[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}`)
    case 9: return cpp(String.raw`
struct Node {
    bool leaf;
    int value;
    array<unique_ptr<Node>, 4> child;
    Node(bool isLeaf, int cell) : leaf(isLeaf), value(cell) {}
};

unique_ptr<Node> build(const vector<vector<int>>& grid, int row, int col, int size) {
    int first = grid[row][col];
    bool uniform = true;
    for (int i = row; i < row + size && uniform; ++i) {
        for (int j = col; j < col + size; ++j) uniform = uniform && grid[i][j] == first;
    }
    if (uniform) return make_unique<Node>(true, first);
    int half = size / 2;
    auto node = make_unique<Node>(false, 0);
    node->child[0] = build(grid, row, col, half);
    node->child[1] = build(grid, row, col + half, half);
    node->child[2] = build(grid, row + half, col, half);
    node->child[3] = build(grid, row + half, col + half, half);
    return node;
}

void serialize(const Node* node, vector<string>& tokens) {
    if (node->leaf) {
        tokens.push_back(node->value ? "L1" : "L0");
        return;
    }
    tokens.push_back("I");
    for (const auto& child : node->child) serialize(child.get(), tokens);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<int>> grid(n, vector<int>(n));
    for (auto& row : grid) for (int& value : row) cin >> value;
    vector<string> tokens;
    serialize(build(grid, 0, 0, n).get(), tokens);
    for (int i = 0; i < static_cast<int>(tokens.size()); ++i) cout << tokens[i] << (i + 1 == static_cast<int>(tokens.size()) ? '\n' : ' ');
    return 0;
}`)
    case 10: return cpp(String.raw`
void tile(int top, int left, int size, int holeRow, int holeCol) {
    if (size == 1) return;
    int half = size / 2;
    int middleRow = top + half;
    int middleCol = left + half;
    bool topHalf = holeRow < middleRow;
    bool leftHalf = holeCol < middleCol;
    if (topHalf && leftHalf) cout << middleRow + 1 << ' ' << middleCol + 1 << " 1\n";
    else if (topHalf) cout << middleRow + 1 << ' ' << middleCol << " 2\n";
    else if (leftHalf) cout << middleRow << ' ' << middleCol + 1 << " 3\n";
    else cout << middleRow << ' ' << middleCol << " 4\n";

    tile(top, left, half,
         topHalf && leftHalf ? holeRow : middleRow - 1,
         topHalf && leftHalf ? holeCol : middleCol - 1);
    tile(top, middleCol, half,
         topHalf && !leftHalf ? holeRow : middleRow - 1,
         topHalf && !leftHalf ? holeCol : middleCol);
    tile(middleRow, left, half,
         !topHalf && leftHalf ? holeRow : middleRow,
         !topHalf && leftHalf ? holeCol : middleCol - 1);
    tile(middleRow, middleCol, half,
         !topHalf && !leftHalf ? holeRow : middleRow,
         !topHalf && !leftHalf ? holeCol : middleCol);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k, row, col;
    cin >> k >> row >> col;
    tile(0, 0, 1 << k, row - 1, col - 1);
    return 0;
}`)
    case 11: return cpp(String.raw`
long long countInversions(vector<long long>& values, vector<long long>& buffer, int left, int right) {
    if (right - left <= 1) return 0;
    int middle = left + (right - left) / 2;
    long long answer = countInversions(values, buffer, left, middle)
                     + countInversions(values, buffer, middle, right);
    int i = left, j = middle, write = left;
    while (i < middle || j < right) {
        if (j == right || (i < middle && values[i] <= values[j])) buffer[write++] = values[i++];
        else {
            answer += middle - i;
            buffer[write++] = values[j++];
        }
    }
    copy(buffer.begin() + left, buffer.begin() + right, values.begin() + left);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> values(n), buffer(n);
    for (long long& value : values) cin >> value;
    cout << countInversions(values, buffer, 0, n) << '\n';
    return 0;
}`)
    case 12: return cpp(String.raw`
string expression;
map<pair<int, int>, vector<long long>> memo;

vector<long long> solve(int left, int right) {
    pair<int, int> key{left, right};
    if (memo.count(key)) return memo[key];
    vector<long long> results;
    for (int i = left; i < right; ++i) {
        char op = expression[i];
        if (op != '+' && op != '-' && op != '*') continue;
        vector<long long> a = solve(left, i);
        vector<long long> b = solve(i + 1, right);
        for (long long x : a) for (long long y : b) {
            if (op == '+') results.push_back(x + y);
            else if (op == '-') results.push_back(x - y);
            else results.push_back(x * y);
        }
    }
    if (results.empty()) results.push_back(stoll(expression.substr(left, right - left)));
    return memo[key] = results;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> expression;
    vector<long long> results = solve(0, expression.size());
    sort(results.begin(), results.end());
    for (int i = 0; i < static_cast<int>(results.size()); ++i) cout << results[i] << (i + 1 == static_cast<int>(results.size()) ? '\n' : ' ');
    return 0;
}`)
    case 13: return cpp(String.raw`
vector<int> beautiful(int n) {
    if (n == 1) return {1};
    vector<int> result;
    for (int value : beautiful((n + 1) / 2)) result.push_back(value * 2 - 1);
    for (int value : beautiful(n / 2)) result.push_back(value * 2);
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> answer = beautiful(n);
    for (int i = 0; i < n; ++i) cout << answer[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}`)
    case 14: return cpp(String.raw`
long long countPairs(vector<long long>& values, vector<long long>& buffer, int left, int right) {
    if (right - left <= 1) return 0;
    int middle = left + (right - left) / 2;
    long long answer = countPairs(values, buffer, left, middle) + countPairs(values, buffer, middle, right);
    int j = middle;
    for (int i = left; i < middle; ++i) {
        while (j < right && values[i] > 2LL * values[j]) ++j;
        answer += j - middle;
    }
    merge(values.begin() + left, values.begin() + middle, values.begin() + middle, values.begin() + right, buffer.begin() + left);
    copy(buffer.begin() + left, buffer.begin() + right, values.begin() + left);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> values(n), buffer(n);
    for (long long& value : values) cin >> value;
    cout << countPairs(values, buffer, 0, n) << '\n';
    return 0;
}`)
    case 15: return cpp(String.raw`
vector<int> values, indices, buffer, answer;

void countSmaller(int left, int right) {
    if (right - left <= 1) return;
    int middle = left + (right - left) / 2;
    countSmaller(left, middle);
    countSmaller(middle, right);
    int i = left, j = middle, write = left;
    while (i < middle || j < right) {
        if (j == right || (i < middle && values[indices[i]] <= values[indices[j]])) {
            answer[indices[i]] += j - middle;
            buffer[write++] = indices[i++];
        } else {
            buffer[write++] = indices[j++];
        }
    }
    copy(buffer.begin() + left, buffer.begin() + right, indices.begin() + left);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    values.resize(n);
    for (int& value : values) cin >> value;
    indices.resize(n);
    iota(indices.begin(), indices.end(), 0);
    buffer.resize(n);
    answer.assign(n, 0);
    countSmaller(0, n);
    for (int i = 0; i < n; ++i) cout << answer[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}`)
    case 16: return cpp(String.raw`
long long lowerBoundValue, upperBoundValue;

long long countRange(vector<long long>& prefix, vector<long long>& buffer, int left, int right) {
    if (right - left <= 1) return 0;
    int middle = left + (right - left) / 2;
    long long answer = countRange(prefix, buffer, left, middle) + countRange(prefix, buffer, middle, right);
    int lower = middle, upper = middle;
    for (int i = left; i < middle; ++i) {
        while (lower < right && prefix[lower] - prefix[i] < lowerBoundValue) ++lower;
        while (upper < right && prefix[upper] - prefix[i] <= upperBoundValue) ++upper;
        answer += upper - lower;
    }
    merge(prefix.begin() + left, prefix.begin() + middle, prefix.begin() + middle, prefix.begin() + right, buffer.begin() + left);
    copy(buffer.begin() + left, buffer.begin() + right, prefix.begin() + left);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n >> lowerBoundValue >> upperBoundValue;
    vector<long long> prefix(n + 1, 0), buffer(n + 1);
    for (int i = 1; i <= n; ++i) {
        long long value;
        cin >> value;
        prefix[i] = prefix[i - 1] + value;
    }
    cout << countRange(prefix, buffer, 0, n + 1) << '\n';
    return 0;
}`)
    default: throw new Error(`missing C++ solution for ${number}`)
  }
}

function seededValues(seed, length, minimum = -100, maximum = 100) {
  let state = seed >>> 0
  return Array.from({ length }, () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return minimum + (state % (maximum - minimum + 1))
  })
}

function arrayInput(values, prefix = '') {
  return `${prefix || values.length}\n${values.join(' ')}\n`
}

function gridInput(grid) {
  return `${grid.length}\n${grid.map((row) => row.join(' ')).join('\n')}\n`
}

function buildInputs(number) {
  const tag = (input, tags = ['normal']) => ({ input, tags })
  switch (number) {
    case 1: {
      const triples = [[1,1,1],[2,2,2],[10,4,6],[50,50,50],[-1,7,18],[0,0,0],[20,20,20],[21,20,20],[20,21,20],[20,20,21],[1,2,3],[5,10,15],[10,10,10],[15,15,15],[20,1,1],[1,20,20],[-5,-6,-7],[100,2,3],[3,2,1],[19,20,20]]
      return triples.map((values, i) => tag(`${values.join(' ')}\n-1 -1 -1\n`, i < 2 ? ['boundary'] : i > 16 ? ['stress'] : ['normal']))
    }
    case 2: return [137,1,2,3,4,5,6,7,8,9,10,16,31,32,64,127,1024,4096,19999,20000].map((n,i) => tag(`${n}\n`, i < 3 ? ['boundary'] : i > 17 ? ['stress'] : ['normal']))
    case 3: return [2,1,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10].map((n,i) => tag(`${n}\n`, i === 1 ? ['boundary'] : n >= 9 ? ['stress'] : i >= 10 ? ['regression'] : ['normal']))
    case 4: return [[2,10],[2.1,3],[2,-2],[1,2147483647],[-1,2147483647],[-1,-2147483648],[0,5],[0.5,20],[1.5,0],[-2,3],[-2,4],[10,-3],[0.25,-4],[99,2],[-0.5,9],[3,13],[1.0001,10000],[2,-31],[-2,-31],[0.0001,2]].map(([x,n],i) => tag(`${x} ${n}\n`, i < 4 ? ['boundary'] : i >= 16 ? ['stress'] : ['normal']))
    case 5: return [2,1,3,4,5,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10].map((n,i) => tag(`${n}\n`, n === 1 ? ['boundary'] : n >= 9 ? ['stress'] : i >= 10 ? ['regression'] : ['normal']))
    case 6: return [['COW',8],['A',1],['A',1e18],['AB',2],['AB',3],['AB',4],['AB',5],['ABC',4],['ABC',5],['ABC',6],['ABC',7],['CODE',16],['SECRET',31],['XYZ',100],['HELLOWORLD',999],['Z',999999999999999999n],['ALGORITHM',1000000],['AABC',17],['QWERTY',64],['COWCODE',1000000000000000000n]].map(([s,n],i) => tag(`${s} ${n}\n`, i < 3 ? ['boundary'] : i >= 15 ? ['stress'] : ['normal']))
    case 7: {
      const cases = [
        tag('5 1\n4 3 2 1 5\n'), tag('1 0\n42\n',['boundary']), tag('5 0\n5 4 3 2 1\n',['boundary']), tag('5 4\n1 2 3 4 5\n',['boundary']),
        tag('7 3\n2 2 2 2 2 2 2\n',['regression']), tag('8 4\n3 1 2 3 3 0 4 3\n',['regression']), tag('6 2\n-5 -1 -3 -2 -4 0\n'), tag('9 5\n9 1 8 2 7 3 6 4 5\n')
      ]
      while (cases.length < 20) { const i = cases.length; const values = seededValues(100 + i, i >= 18 ? 10000 : 20 + i, -1000, 1000); const k = (i * 17) % values.length; cases.push(tag(`${values.length} ${k}\n${values.join(' ')}\n`, i >= 18 ? ['stress'] : ['normal'])) }
      return cases
    }
    case 8: {
      const values = [[5,2,3,1,2],[1],[1,2,3,4,5],[5,4,3,2,1],[0,0,0,0],[-5,-1,-3,2,0],[50000,-50000,0,50000], [2,1], [3,1,2,1,3], [9,8,7,6,5,4,3,2,1,0]]
      while (values.length < 20) values.push(seededValues(200 + values.length, values.length >= 18 ? 5000 : values.length * 7, -50000, 50000))
      return values.map((v,i) => tag(arrayInput(v), i < 2 ? ['boundary'] : i >= 18 ? ['stress'] : ['normal']))
    }
    case 9: {
      const grids = [
        [[1,1],[1,0]], [[0]], [[1]], [[0,0],[0,0]], [[1,1],[1,1]], [[0,1],[1,0]],
        Array.from({length:4},()=>Array(4).fill(0)), Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>(r<2&&c<2?1:0))),
        Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>(r+c)%2)), Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r<4?1:c<4?0:1)))
      ]
      while (grids.length < 20) { const size = grids.length >= 18 ? 64 : 8; const seed = grids.length; grids.push(Array.from({length:size},(_,r)=>Array.from({length:size},(_,c)=>((r*31+c*17+seed)%7<3?1:0)))) }
      return grids.map((g,i)=>tag(gridInput(g), i<3?['boundary']:i>=18?['stress']:['normal']))
    }
    case 10: return [[2,1,1],[1,1,1],[1,1,2],[1,2,1],[1,2,2],[2,1,4],[2,4,1],[2,4,4],[3,4,5],[3,8,8],[4,1,16],[4,8,8],[5,17,3],[5,32,1],[6,33,33],[7,1,128],[7,64,65],[8,129,17],[9,512,512],[10,777,256]].map((v,i)=>tag(`${v.join(' ')}\n`,i<5?['boundary']:i>=17?['stress']:['normal']))
    case 11: {
      const values = [[5,4,2,6,3,1],[1],[1,2,3,4,5],[5,4,3,2,1],[2,2,2,2],[-1,-2,-3],[3,1,2,3,1],[1000000000,0,999999999], [2,1], [1,3,2,3,1]]
      while(values.length<20) values.push(seededValues(300+values.length, values.length>=18?10000:values.length*8, -1000000000,1000000000))
      return values.map((v,i)=>tag(arrayInput(v),i<2?['boundary']:i>=18?['stress']:['normal']))
    }
    case 12: return ['2*3-4*5','0','1+1','2-1-1','11','10+5','2*2*2','3+2*2','9-0*3','10*2-3','1+2+3+4','5*4-3*2','99-98+1','0*1+2','2*3+4*5','7-3-2-1','1*2-3+4','12*3-4+5','2*3-4*5+6','1+2*3-4*5'].map((e,i)=>tag(`${e}\n`,i<2?['boundary']:i>=18?['stress']:['normal']))
    case 13: return [5,1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,1000].map((n,i)=>tag(`${n}\n`,i<2?['boundary']:i>=18?['stress']:['normal']))
    case 14: {
      const values=[[1,3,2,3,1],[2,4,3,5,1],[1],[1,2,3,4], [4,3,2,1], [0,0,0],[-5,-5],[-2,-1,-3], [2147483647,-2147483648], [5,1,2,0]]
      while(values.length<20) values.push(seededValues(400+values.length,values.length>=18?5000:values.length*9,-2147483648,2147483647))
      return values.map((v,i)=>tag(arrayInput(v),i<3?['boundary']:i>=18?['stress']:['normal']))
    }
    case 15: {
      const values=[[5,2,6,1],[1],[1,2,3,4],[4,3,2,1],[2,2,2],[-1,-2,-3],[3,1,2,1],[10000,-10000,0], [2,1], [5,1,5,1,5]]
      while(values.length<20) values.push(seededValues(500+values.length,values.length>=18?10000:values.length*8,-10000,10000))
      return values.map((v,i)=>tag(arrayInput(v),i<2?['boundary']:i>=18?['stress']:['normal']))
    }
    case 16: {
      const raw=[
        [[-2,5,-1],-2,2], [[0],0,0], [[1],1,1], [[1],2,3], [[-1,-1],-2,-1], [[0,0,0],0,0], [[1,-1,1,-1],0,0], [[3,-2,5,-1],2,6],
        [[2147483647,-2147483648],-1,0], [[-5,-4,-3],-12,-3]
      ]
      while(raw.length<20){const i=raw.length; const v=seededValues(600+i,i>=18?5000:i*7,-100000,100000); raw.push([v,-50000+i*101,50000-i*97])}
      return raw.map(([v,l,u],i)=>tag(`${v.length} ${l} ${u}\n${v.join(' ')}\n`,i<4?['boundary']:i>=18?['stress']:['normal']))
    }
    default: throw new Error(`missing cases for ${number}`)
  }
}

function writeText(filePath, content) {
  if (content.includes('\r')) throw new Error(`CR detected in ${filePath}`)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function generateLab(item) {
  const labDirectory = path.join(LAB_ROOT, item.dir)
  if (WRITE && fs.existsSync(labDirectory) && !FORCE) {
    throw new Error(`refusing to overwrite ${item.dir}; pass --write --force for this fixed allowlist`)
  }
  const tests = buildInputs(item.number)
  tests[0].input = item.sampleInput
  if (tests.length !== 20) throw new Error(`${item.labId} must have 20 cases, got ${tests.length}`)
  const cases = tests.map((test, index) => {
    const sequence = String(index + 1).padStart(3, '0')
    const role = index === 0 ? 'sample' : index <= 2 ? 'boundary' : index <= 5 ? 'regression' : index >= 18 ? 'stress' : 'normal'
    const basename = `${sequence}-${role}`
    return { ...test, basename, manifest: { id: basename, input: `tests/${basename}.in`, expected: `tests/${basename}.out`, points: 5, tags: test.tags } }
  })
  const files = new Map([
    [path.join(labDirectory, 'README.md'), readme(item)],
    [path.join(labDirectory, 'lab.json'), manifest(item)],
    [path.join(labDirectory, 'Makefile'), thinMakefile],
    [path.join(labDirectory, 'student', 'main.cpp'), studentSource()],
    [path.join(labDirectory, 'solution', 'main.cpp'), solutionSource(item.number)],
    [path.join(labDirectory, 'tests', 'cases.json'), `${JSON.stringify(tests.map((test, i) => cases[i].manifest), null, 2)}\n`]
  ])
  for (const test of cases) {
    files.set(path.join(labDirectory, 'tests', `${test.basename}.in`), test.input)
    const expectedPath = path.join(labDirectory, 'tests', `${test.basename}.out`)
    if (!fs.existsSync(expectedPath)) files.set(expectedPath, '')
  }
  if (WRITE) for (const [filePath, content] of files) writeText(filePath, content)
  return { labId: item.labId, dir: item.dir, files: files.size }
}

if (!fs.existsSync(LAB_ROOT)) throw new Error(`missing Lab root: ${LAB_ROOT}`)
if (catalog.length !== 16) throw new Error(`catalog must contain 16 labs, got ${catalog.length}`)
if (new Set(catalog.map((item) => item.labId)).size !== 16) throw new Error('duplicate lab ID')
if (new Set(catalog.map((item) => item.dir)).size !== 16) throw new Error('duplicate lab directory')

const report = catalog.map(generateLab)
console.log(`${WRITE ? 'WRITE' : 'DRY-RUN'}: ${report.length} Labs, ${report.length * 20} cases, ${report.reduce((sum, item) => sum + item.files, 0)} generated files`)
for (const item of report) console.log(`${item.labId} ${item.dir}`)
