# Design · 第 14 章动态规划代码题 Labs

## 1. Architecture and boundaries

本任务只新增内容与可复现作者工具，不改变网站架构。数据流沿用现有合同：

```text
curated problem catalog
  -> pnpm lab:new 自动分配 14E01..14E30
  -> README / lab.json / student / solution / tests
  -> validate-content + Lab CLI
  -> CourseIndex 自动发现
  -> VitePress Ch.14 Exercise 导航与页面
```

源事实分成三层：

1. 官方页面：题名、核心任务、约束、样例和来源身份；
2. 课程 catalog：标准输入输出适配、slug、稳定编号、教学模型和测试矩阵；
3. 每个 Lab 目录：最终学习者文档、代码和静态测试。

不在 VitePress 或侧栏中再维护一份 Ch.14 题目列表。

## 2. Directory and identity contract

```text
labs/chapter-14/
├─ theory/.gitkeep
├─ exercise/
│  ├─ E-14-01-climbing-stairs/
│  ├─ ...
│  └─ E-14-30-buying-hay/
└─ project/.gitkeep
```

- 用 `pnpm lab:new -- --type program --chapter 14 --slug <slug> --order <n>` 按目录顺序生成，验证自动编号而非手写身份。
- 生成第一题时脚手架删除 `exercise/.gitkeep`；空的 Theory/Project 保留标记。
- catalog 在生成后断言实际 `labId` 与预期一一对应，发现偏移立即停止，不继续覆盖。

## 3. Problem catalog

实现使用一个结构化 catalog 描述每题的不可变元信息：

```js
{
  id: "14E01",
  order: 1,
  slug: "climbing-stairs",
  title: "爬楼梯",
  section: "14.1 状态设计",
  source: { platform: "LeetCode", problemId: "70", url: "..." },
  contract: { input: "...", output: "...", limits: "..." },
  model: { state: "...", transition: "...", base: "...", order: "..." },
  cases: [ ... ]
}
```

catalog 不保存或再分发第三方完整题面；README 由课程自写段落生成或人工补充。结构化 catalog 同时驱动来源审计、case 计数和路径检查，减少 30 份手工元数据漂移。

## 4. Standard-I/O adaptations

### 4.1 LeetCode

- 数组题统一先读 `n`，再读一行 `n` 个整数；网格题先读 `m n`，再读矩阵。
- 双参数背包题统一第一行 `n target/amount`，第二行读候选数组。
- 布尔结果固定输出 `YES`/`NO`。
- 只输出最终数值，不要求 LeetCode 的 `class Solution`；README 明确函数接口到完整程序的转换。

### 4.2 Luogu

- 保留核心输入字段与输出目标，重写叙事和字段说明。
- `P2196` 原题允许输出任意最优路径；课程版要求最大值相同时输出字典序最小路径。
- `P1833` 保留 `hh:mm` 时间输入，训练混合背包前的容量换算。
- `P1064` 保留主件/附件编号关系，训练依赖分组的合法组合枚举。

## 5. README teaching template

每题沿用 Program Golden 结构，但 DP 提示统一使用“状态设计卡”：

1. 学习目标；
2. 问题描述（课程自写）；
3. 输入/输出/约束；
4. 样例；
5. 状态设计卡：状态语义、决策、转移、边界、顺序、答案；
6. 复杂度与最小反例；
7. 运行与评分；
8. 完成清单；
9. 思考与复盘；
10. 来源与课程化改动。

README 可以说明推荐模型，但不嵌入完整 reference code；完整代码只在 `solution/main.cpp`。

## 6. Code design

- 每题一个清晰的 C++17 `main`，使用标准流、`vector`、`long long` 和必要 helper。
- 记忆化题把 `dfs` 语义写在函数名/注释中；递归深度受官方约束控制。
- 路径还原题保存 predecessor，并在相同最优值时执行确定性比较。
- 空间压缩只在不损害教学清晰度时使用；同步双人和编辑距离可保留二维/三维语义。
- starter 保留输入骨架、输出占位和 TODO，不复制转移循环。

## 7. Test generation and evidence

每题固定 20 case、每个 5 分。catalog 中定义紧凑输入，独立 JavaScript oracle 计算期望值并写出 LF 文件。case 族至少包括：

- `001-sample`；
- 最小规模与边界；
- 等值、单调、全零、全负、不可达等结构；
- 针对错误状态、错误初值、错误枚举方向或重复计数的最小反例；
- 数值上界/溢出；
- 一项不产生巨型仓库文件的性能形状。

生成后执行两层核对：

1. catalog oracle 断言每题 20 case、100 分、唯一 ID、LF；
2. `pnpm lab:verify` 用 C++ solution 跑同一批输入，且 starter 不能满分。

## 8. Reproducibility helper

新增作者脚本 `scripts/generate-chapter-14-dp-labs.mjs`，职责限定为：

- 从内置 catalog 填充已经由 `lab:new` 创建的 Ch.14 目录；
- 默认 dry-run，只有 `--write` 才落盘；
- 拒绝路径/ID/已有非占位文件不符合预期的目录；
- 生成 README、manifest、代码与 tests，并进行 case/oracle 自检；
- 不联网、不抓题解、不修改其它章节。

脚本保留在仓库中，作为 30 题来源/测试的可复现作者工具；最终静态 Lab 不依赖该脚本运行。

## 9. Compatibility and rollback

- 这是纯新增 Ch.14 内容，回滚可删除 `labs/chapter-14/`、生成脚本和对应任务文件，不触碰其它章节。
- 不新增重定向、不修改旧 ID、不调整 schema。
- 本地预览用现有 VitePress server；生成的 `dist/`、`.lab-cache/` 与测试报告不提交。

## 10. Validation layers

```text
catalog audit
  -> per-Lab validate/verify
  -> chapter aggregate audit (30 labs / 600 cases)
  -> validate-content + lint/typecheck
  -> Lab docs/tools/golden/make
  -> VitePress build + check:site
  -> browser/manual Ch.14 preview
```

失败时优先修 catalog 或单题源文件；不放宽全局 validator 来迁就坏内容。
