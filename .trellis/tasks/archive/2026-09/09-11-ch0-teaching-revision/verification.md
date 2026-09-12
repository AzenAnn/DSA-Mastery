# Ch0 改版核验记录

## 工作区与范围

- 新分支：`docs/ch0-teaching-revision`，基于拉取后的 `origin/main`（`09e98c3`），开发者 Azen。
- 两篇 ch0 主文路径与 H1 不变；保留 `#抽象数据类型`，保留四类基本操作、等概率成功查找 `(n+1)/2` 和二分查找的衔接。
- 初始已有改动：删除的 threaded-tree `4eae...svg`；未跟踪的 bst-degenerate-chain `b795...svg`、max-path-sum-local `a223...svg`、threaded-tree `730d...svg`；ui-ux-pro-max 的 `__pycache__`。这些不属于本任务。

## 知识纠错与依据

| 原问题 | 修正与依据 |
| --- | --- |
| 混合递推错误给出低于平方的界 | 根节点已花 `n²`；子问题平方规模系数和为 `35/144<1`，代换证明得到 `Θ(n²)` |
| `1<p<2` 时把积分当作收敛 | 积分等于 `(n^(2-p)-1)/(2-p)`，为 `Θ(n^(2-p))`；保留在 ch12 拓展 |
| Akra–Bazzi 临界解必为正、缺条件的近似证明 | 改为唯一实数解，说明系数和为 1 时 `p=0`，不给不完整的一般定理证明 |
| 栈加法、堆取 max | 依据对象生存期；父调用保留的堆数组必须与子调用同时计入 |
| 归纳失败说明猜想错误 | `T(n)=2T(n/2)+1` 用 `Cn` 失败，但 `Cn-1` 闭合；准确解为 `2n-1` |
| 几何循环统一写 `2n-1` | `<n` 使用 `ceil(log₂n)` 轮；`<=n` 使用 `floor(log₂n)+1` 轮，零输入单列 |
| q5/q7 平方边界多算或少算一行 | q5 精确为 `floor(sqrt(n))`；q7 为 `m(m-1)/2`，`m=ceil(sqrt(n))` |
| q11 只问 `O(n²)` 导致四个选项均满足 | 改问 `Θ(n²)`，题目 ID 与答案索引不变 |
| q19 改终止条件到 0 就平方级 | 正整数反复整数折半必先到 1 再到 0，只多一次除法；从 `n²` 每次减 1 才需平方次 |
| 计数与机器计时混为一谈 | 明确单位成本模型、变量范围、优化可能改变机器执行、打印不能保证循环未被化简 |
| Savitch 定理误称空间层次定理 | 收到可选书目阅读中，区分空间模拟与层次定理，不做“空间更强”的推论 |
| 作者指南的 `caption:` 未被插件解析 | 核对插件 1.3.1 的属性解析，改为 `caption="..."`；同步指南、规范和实际图注断言 |

## 已完成的运行检查

- PASS：`pnpm run validate`，内容、vue-tsc、ESLint 全部通过。
- PASS：`pnpm test`，含 validate、树演示 5 项、bootstrap 36 项、Lab 工具 45 项通过及 1 项平台跳过、Lab 文档、内容发现、root-base build 与 check:site。
- 平台跳过：Windows 当前策略不允许创建测试符号链接，原测试自带 skip；并非本任务新增跳过。
- PASS：root-base 产物检查，88 教材、264 Lab、25 框架页、426 HTML，`base=/`。
- PASS：`node .trellis/tasks/09-11-ch0-teaching-revision/verify-counts.mjs`，从真实 Markdown 和 quiz.json 提取 C++，使用本机 LLVM-MinGW 的 g++（Clang 21.1.0-rc2）编译执行。
- PASS：循环与题库边界覆盖 `n=0..4096`，平方循环缩小为 `0..128` 加幂边界；首次完整运行还核对了全部 `0..4096` 的平方循环。计数一致。
- PASS：重复学号比较数、递归总调用/峰值活跃栈帧覆盖 `n=0..64`；阶乘仅执行 `0..12` 避免 int 溢出。
- PASS：前缀和对 `n=0..50` 的全部合法区间与直接求和比对，并覆盖负元素、非法位置、空区间、更新后旧前缀失效。
- PASS：混合递推整数取整版本覆盖 `n=6..100000`，全部位于 `[n²,2n²]`；数值核验补充正文的数学证明，不替代证明。
- PASS：三份 Student 接口/表示片段通过 C++17 语法检查；原计数 Lab 实际输出 `10/100/1000` 与表格一致。
- 构建提示：现有 bundle 大于 500 kB 的非阻塞警告；未调整站点打包范围。

## Pages 与视觉验收

- PASS：最终 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 的 build 与 check:site，426 个 HTML，图资源均带且仅带一个部署前缀。
- PASS：`node .trellis/tasks/09-11-ch0-teaching-revision/verify-pages.mjs`，两文各 390/1440px × 浅/暗主题，共 8 组，均无根页面横向溢出（0px）。
- PASS：0.1 的 3 个 details、3 张图，0.2 的 6 个 details、30 处 MathJax 公式、1 张图；图像完整加载，图注可见，没有 MathJax error，代码组可切换。
- PASS：跨文链接的 fragment 存在；修复“先预测-再验证”“循环题组-每次只改变一个条件”“变式三-只移动指针的初始化位置”的连字符。既有 ADT 锚点保留。
- PASS：q5/q11/q19 在四组视口/主题下实际选择、提交正确答案、显示修正解析、重新作答，19 题与每题四个选项均保留。
- PASS：定向浏览器检查未发现 pageerror、console.error、失败资源或同源 HTTP 4xx/5xx。
- 人工查看：移动浅暗的链式地址、局部插入、结构对照、递归树与图注，以及桌面与移动的公式、details 和契约段落。固定浅色图画布的文字与边清晰，图注随主题显示。
- PASS：最终全站 `pnpm run test:pages`，56 项全部通过（6.4 分钟）。首轮为 55 通过、1 个键盘焦点测试失败；根因是测试先用鼠标展开 details，切换了 focus-visible 模态。改为 focus summary 后按 Enter 展开，定向与最终全量复测均通过。

## 原有改动保护与预览

- PASS：原有三份未跟踪 SVG 的 SHA-256 与构建前相同，原有删除仍保持删除；未动 __pycache__。
- 本次只新增 `graphviz-ch0-*` 四份 SVG，无主题、组件、依赖或渲染器修改。
- 已启动独立隐藏预览进程，`http://127.0.0.1:4178/DSA-Mastery/learn/chapter-00-introduction/01-data-structure-basics/` 返回 HTTP 200。使用新端口，保留已有预览服务。

截图及浏览器 JSON 位于忽略目录 `outputs/ch0-teaching-revision/`，编译产物与计数输出位于 `.lab-cache/ch0-teaching-verification/`。
