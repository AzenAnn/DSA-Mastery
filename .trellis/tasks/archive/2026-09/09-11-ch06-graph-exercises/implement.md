# Ch6 执行与验收计划

## 状态

- [x] 用户同意创建任务并进入规划。
- [x] 从最新 origin/main 创建 `lab/ch06-graph-exercises`，确认 Azen 身份。
- [x] 检查旧 Lab、内容索引、schema、判题器、薄 Makefile 和验证入口。
- [x] PRD 收敛，设计覆盖 20 题的目录、输入输出、来源差异和验证方法。
- [x] 向用户展示最终规划并取得本方案的实现确认。
- [x] 运行 `python ./.trellis/scripts/task.py start .trellis/tasks/09-11-ch06-graph-exercises`。

当前为 in_progress；用户已确认最终方案。Codex inline 模式无需 implement/check JSONL；主会话已加载 `trellis-before-dev` 并直接实现。

## 实现顺序

1. [x] 读取 `trellis-before-dev` 和本任务三份规划文件，复查 git 状态及本次文件范围。
2. [x] 按 design.md 映射创建 20 个独立目录和 manifest；补齐题源文档 `docs/ch06-exercise-sources.md`。
3. [x] 完成 06E04-06E11：中心、法官、矩阵、邻接表、转置、三种表示、ADT、网络秩。
4. [x] 完成 06E12-06E19：路径、钥匙、省份、分量标签/规模/弱连通、不可达点对、完全分量。
5. [x] 完成 06E20-06E23：道路、强连通判断、SCC 划分、凝聚图。
6. [x] 补齐全部 README 的样例、说明、复杂度、运行命令、错误情况和复盘；核对 student 没有完整核心答案。
7. [x] 生成每题 20 组测试，默认预览/显式写入；为 400 组预期保留独立 oracle 核对。
8. [x] 实现 `scripts/check-chapter-06-lab-contracts.mjs`，覆盖结构、输入有效性、样例同步、独立答案和关键性质。
9. [x] 逐题 `lab:verify`，修复后仅重测受影响项；运行小图对拍与规模/最大输出验证。
10. [x] 验证现有 ch6 三题仍可运行，新增 20 题进入自动索引与产物。
11. [x] 执行完整收尾检查、检阅和问题修复，形成 `review.md`。
12. [ ] 更新规范中本次确认且可复用的合同（若无新合同则记录无需更新的理由），记录 Azen 会话与任务完成状态。
13. [x] 暂存本任务明确路径，提交并推送；核对远端 SHA，向用户给出检阅结论、提交和分支链接。

## 验证命令

依赖使用固定 pnpm 11.1.1；只有缺依赖时运行 `pnpm install --frozen-lockfile`。规划期已验证 Node v24.14.0、Clang 21.1.0、MSVC 19.51.36256、GNU Make 4.4.1；`lab:doctor` 成功。

```powershell
node scripts/check-chapter-06-lab-contracts.mjs
pnpm lab:validate -- labs/chapter-06/exercise/E-06-04-star-graph-center
pnpm lab:verify -- labs/chapter-06/exercise/E-06-04-star-graph-center
pnpm test
git diff --check
```

validate/verify 路径需遍历全部新增 Lab，并检查各 JSON 报告的 reference=100、student<100、student 可编译、无 oracle 漂移。原有 06E01/02/03 也作章节回归。针对全部新增 C++ 至少执行本机 Clang 验证，并用 MSVC 编译/运行；不把本机两个编译器写成 Linux/macOS 已验证。

`pnpm test` 包括 validate、已有单测、Lab 文档、自动发现、build 和 check:site。若暴露基线问题，区分本任务与既有问题，记录真实影响，不能伪报全绿。

## 学生分发与页面检阅

抽取 `06E09`、`06E18`、`06E23`，分别代表多格式输入、大数连通和 SCC：

```powershell
pnpm lab:pack -- labs/chapter-06/exercise/E-06-09-graph-representation-conversion --profile student
pnpm lab:pack -- labs/chapter-06/exercise/E-06-18-unreachable-pairs --profile student
pnpm lab:pack -- labs/chapter-06/exercise/E-06-23-scc-condensation --profile student
```

复制生成包到仓库外的明确临时目录，断言无 solution/cache/编译物，执行独立 validate 和 run，正常得到学生未满分结果。临时目录操作使用绝对路径和原生 PowerShell/Node API。

构建后抽查 Labs 索引和三道代表页，确认 20 个新增路由存在、样例可读、代码块无泄漏、站内链接有效；用 Playwright 在桌面/移动视口查看代表页并记录截图。站点如需本地服务，后台隐藏启动并在交付时给出 URL。

## 检阅清单

- [x] 一题一目录，身份、标题、order、路径、chapter 与 manifest 一致。
- [x] 20 题来源和改编边界明确，样例均有实际验证。
- [x] 编号基准、自环、平行边、空图约束在题面和数据中一致。
- [x] 参考算法与复杂度成立，长链无递归栈风险，点对乘法使用 64 位。
- [x] 所有多解输出均已规范化，并用独立性质校验有效性。
- [x] student 可编译、核心算法留空且非满分，solution 全通过。
- [x] 400 组测试有效，不能仅靠 reference 复制生成来证明正确性。
- [x] 打包、内容发现、构建、路由、链接及代表页面检查通过。
- [x] 检阅发现全部修复或明确记录阻塞，不包含未经识别的工作区变更。

## 提交与回退

按实际变更路径暂存，检查 staged diff，不使用无范围的 `git add -A`。提交可按完整 Lab 内容和独立校验分为可复现的关注点；保持 task 文件/证据同步。

```powershell
git diff --cached --check
git commit -m "feat(ch06): add twenty graph exercise labs"
git push -u origin lab/ch06-graph-exercises
git rev-parse HEAD
git ls-remote --heads origin lab/ch06-graph-exercises
```

不 amend/强推共享历史，不修改 main；如需回退已推送成果，用新增 revert 提交，避免删除既有用户内容。
