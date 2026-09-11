# Ch15 Exercise 技术方案

## 目录与数据流

每题位于 `labs/chapter-15/exercise/E-15-SS-slug/`，包含 `README.md`、`lab.json`、标准三行Makefile、`student/main.cpp`、`solution/main.cpp`、`tests/cases.json` 和固定 `.in/.out`。新建 `theory/.gitkeep` 与 `project/.gitkeep`，不创建占位题。

frontmatter使用 `chapter: 15`、`chapterTitle: 回溯与搜索`、`order: 1..21`、`labId: 15E01..15E21`、实际修改日期、贡献者、难度、时长、`lab: true` 和 `status: draft`。标题及H1一致，形式为 `Lab 15-E-SS：题目名称`。分类由 `lab.json.type: program` 派生。

```text
README + lab.json -> ContentIndex -> autoLabChapter: 15
  -> 本章Labs/Exercise、Labs目录、搜索、课程路由

student + solution + tests -> 现有Lab CLI / Makefile -> 编译、评分、verify
```

导航只在 `.vitepress/content-index.ts` 的ch15定义末尾加入 `autoLabChapter: 15`，不维护第二份Lab URL数组，不新增组件或CSS。新增Lab使用C++17和现有stdio评分器，不引入依赖。

## 各题实现

| ID | slug | 参考算法 | 主要回归 |
| --- | --- | --- | --- |
| 01 | permutations | 路径、used、DFS | n=1、字典序、n=9输出 |
| 02 | combinations | 递增起点DFS | r=0、r=n、n=20/r=10 |
| 03 | subsets | 子集DFS | 空子集、负数、无重复 |
| 04 | prime-sum-selection | 位置组合、素数试除 | 重复值按位置计数、最大和 |
| 05 | phone-letter-combinations | 数字映射DFS | 7/9四字母、长度4 |
| 06 | maze-paths | 四邻DFS、撤销visited | 终点障碍、多路径、恢复现场 |
| 07 | strange-elevator | 无权图BFS | 起终相同、K=0、不可达 |
| 08 | knight-traversal | 棋盘BFS | 1x1、窄棋盘、400x400 |
| 09 | generate-parentheses | 左右括号计数DFS | 前缀合法、Catalan计数 |
| 10 | combination-sum | 当前候选可重复DFS | 无解、复用、答案少于150 |
| 11 | subsets-ii | 排序、同层去重 | 全等、混合重复、空子集 |
| 12 | permutations-ii | 排序、used、同层去重 | 负数、全等、多重集排列数 |
| 13 | combination-sum-ii | 位置限用一次DFS | 相同数值不同位置、去重 |
| 14 | word-search | 网格DFS、恢复现场 | 大小写、禁止重复用格子 |
| 15 | palindrome-partitioning | 回文预处理、分割DFS | 单字符、全同字符 |
| 16 | n-queens | 按行搜索、列及对角线占用 | n=1/2/3、已知解数、n=9 |
| 17 | sudoku-solver | 位掩码、最少候选优先 | 唯一解、给定值保持不变 |
| 18 | eight-puzzle | BFS或双向BFS | 目标状态、前导0、最短步 |
| 19 | sticks | 目标长度枚举、拼组剪枝 | 整除但不可拼组、重复段、65段 |
| 20 | target-sudoku | 位掩码、最少候选、上界剪枝 | 多解最优、无解、官方样例 |
| 21 | knight-spirit | IDA*、可采纳下界 | 0步、恰好15步、超过15步 |

每题参考实现独立可编译；学生骨架完成读入及必要输出框架，核心算法保留TODO且不能满分。README关联现有ch15适当教材，给出搜索状态、选择、终止、撤销或剪枝的解释。

## 输入输出

洛谷保留官方stdio。P1706使用场宽5，P1157使用场宽3；本地tokens评分忽略空白，这一点在README说明。P1157的r=0参考输出为空行，独立合同检查核验该行为；tokens无法区分空行和无输出，不为此修改共享比较器。P1443输出空格分隔矩阵。

P1379读九字符字符串，目标 `123804765`，官方保证可达。P1120单组输入，不加结尾0。P2324首行T，其后每组5行，目标 `11111/01111/00*11/00001/00000`，上限含15步。

力扣README明确以下本地stdio适配：

- 数组输入第一行n，第二行n个整数；组合总和类第一行 `n target`。
- 数值序列集合（78/39/90/47/40）：首行答案数，每个答案一行 `长度 元素...`。子集/组合内部升序；排列保留内部排列。集合按数值序列字典序，空子集写 `0`，无解只写答案数 `0`。
- 电话组合与括号：输入数字字符串或n；首行答案数，其后每行字符串，按字典序。
- 单词搜索：输入m n、m行连续字母、目标单词；输出 `true` 或 `false`。
- 回文分割：输入字符串；首行分割数，每行 `片段数 片段...`，按子串序列字典序。
- N皇后：输入n；首行棋盘数，每盘n行 `.`/`Q`，无额外标题。按皇后列下标序列字典序排列棋盘。
- 解数独：输入9行9字符，`.`为空格；输出9行数字，保留原题唯一解前提。

合法输入采用当前官方范围，见 `research/problem-contracts.md`；不自动扩大到旧版本约束。特别是LC17不含空串、LC22不含n=0、LC37不含多解/无解。

## 测试与资源

- 各题固定用例分数合计100；数量按有效边界确定，不重复输入凑20题。
- P1706 `outputKb: 32768`，P1157 `outputKb: 8192`，LC47至少2048KB；其余按最大合法输出估算，尤其检查LC131。时间限额依据较大合法输入实测，不能以放宽限制掩盖错误算法。
- `.out` 固定LF。新增用例先创建输出文件，再用现有 `refresh-expected --write` 生成；结果仍须独立核验。
- 枚举题独立核查计数、合法性、唯一性、排序和完整集合，采用位掩码或标准排列算法交叉验证。LC39生成数据需满足答案数严格少于150。
- BFS距离用独立算法核对。P2324的15步案例用双向最短路确认，不能把随机走15次当作最短15步；IDA*下界使用非空棋子错位数或全部错位数的一半向上取整。
- 数独检查给定值与行列宫；LC37生成盘独立确认唯一解。P1074核对官方2829/2852样例及小空位多解穷举的最高分，不能只验棋盘合法。
- 必要时增加本章数据生成和合同检查脚本，使用Node标准库及固定种子，只操作本章文件，不覆盖既有student/solution。临时产物在 `.lab-cache/`。

## 站点与兼容

扩展 `tests/pages-navigation.spec.mjs`，复用静态服务器和既有helper，断言ch15三分类、21条练习及顺序、折叠、从章节/教材/Labs目录进入新题和搜索。桌面与390px移动端真实点击，浅暗主题截图检查文字、侧栏和无根页面横向溢出。

验证默认 `/` 与 `/DSA-Mastery/` 最终产物。结束时启动可用本地预览并提供URL。无旧Lab迁移或插件进度变更，无共享判题器修改。

回退仅限本次新增Lab/脚本/测试及ch15自动收录字段，不还原其他人的改动。若来源核验改变产品范围，先更新方案再重新审阅；算法、用例和资源限额可根据验证结果修正。
