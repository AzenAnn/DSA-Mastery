# Ch6 20 道代码题检阅记录

日期：2026-09-12。负责人：Azen。Codex 主会话按 inline 流程实现和检阅；研究 agent 只提供题源与生成物来源证据。

## 检阅结论

20 题的算法、题面合同、评分、分发和最终全站浏览器检查均通过，未发现阻塞问题。代码提交已推送至任务分支，远端 SHA 与本地工作提交一致。

## 发现与处理

1. 两道洛谷链接的原题均要求矩阵和排序邻接表，不能直接作为用户所列专项的未改编题面。06E06/07 已逐题标明新增查询、删减输出和范围调整，并保留原题链接。
2. 固定输出比较不能默认接受任意分量编号或任意道路/不可达见证。06E15/17/20/21/22/23 明确采用确定规则，并以独立答案和图性质核验；没有修改共享比较器。
3. 生成器最初把 U/D/M/L 拼进大写 case ID，不符合 schema。已统一为小写并同步实际文件名；400 组 manifest 均通过 `loadLab` 校验。此约束及多解适配规则已补入 `.trellis/spec/content/lab-tooling.md`。
4. 新增浏览器测试最初精确匹配“正确性说明”，忽略 VitePress 标题的 permalink 无障碍名称，导致四个视口/主题用例定位失败。已改为按标题级别和文字前缀定位，样例标题同样修正；题面渲染本身完整。

## 验证证据

- [x] 20 个独立 Lab，稳定 ID 为 06E04 至 06E23；新增目录均含 README、lab.json、薄 Makefile、student、solution、cases.json 和 20 对输入输出，共 920 个文件、89,802,723 字节。
- [x] 20 份题面具备题源、改编说明、输入输出、编号、范围、已核对样例、边界、实现任务、证明、复杂度、运行命令和复盘；没有空题面或参考代码占位。
- [x] 生成器预期与实际发布文件逐项比较无漂移；C++ 不由生成器覆盖，原有 06E01/02/03 不在生成范围。
- [x] `node scripts/check-chapter-06-lab-contracts.mjs`：20 Labs、400 组数据全部通过；权重每题合计 100，预期文件为 LF，样例与手工推导常量一致。
- [x] `CXX=clang++` 下运行 `node scripts/check-chapter-06-lab-contracts.mjs --verify --differential --pack`：20 个参考解各 100/100，20 个学生骨架均可编译且小于 100；1,000 组固定种子随机对拍通过，3 个独立学生包通过。
- [x] `CXX=cl` 下运行 `node scripts/check-chapter-06-lab-contracts.mjs --verify`：20 个参考解各 100/100，学生得分与 Clang 完全一致，预期输出无漂移。
- [x] 无向连通参考遍历与 JS 并查集对照，C++ 迭代 Kosaraju 与 JS 迭代 Tarjan 对照，小图再用传递闭包核对；凝聚图核对顶点映射、边集、去重、无自环和 DAG 性质。
- [x] 最大规模包含长链、反向链、串接 SCC、密图和输出压力。06E18 的 `n=100000,m=0` 得 `4999950000`；乘法为 `long long`。最大单组输出为 06E09 的 3,331,355 字节，低于配置限制。
- [x] 06E09、06E18、06E23 的 student pack 复制到仓库外临时目录，断言不含 solution/cache/binary，再独立 validate/score；学生可以编译并按预期未满分。
- [x] 现有 06E01/02/03 的 `lab:verify` 全部通过；原目录内容无修改。
- [x] `pnpm test` 通过：内容/typecheck/lint、5 项 tree 单测、36 项 bootstrap、45 项 Lab/tool/state 测试、Lab 文档、自动发现、根路径 build/check。另有 1 项既有 Windows 符号链接策略跳过。
- [x] 配置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 和 `SITE_URL=https://azenann.github.io/DSA-Mastery` 后 `pnpm build`、`pnpm run check:site` 通过：88 篇教材、284 个 Lab、25 个课程框架页、446 个 HTML。
- [x] `pnpm run test:pages --workers 1`：最终 61 项全站 Chromium 检查全部通过，耗时 6.6 分钟。包含新增 5 项 ch6 测试：四种视口/主题各遍历 20 页，以及 Labs 索引/搜索。
- [x] 人工查看 1440px 浅色的 06E09、1440px 暗色的 06E23 样例、390px 浅色的 06E18、390px 暗色的 06E09 样例和章节侧栏。标题换行、输入区、元信息和导航均清晰，无遮挡；20 页四种视口/主题均通过页面横向溢出断言。
- [x] 新增浏览器测试文件单独 ESLint 通过；只调整该测试的定位方式，无站点运行时改动。
- [x] 提交前 `git diff --cached --check` 通过；936 个暂存文件均在任务明确范围，每题恰好 46 个，无编译物。工作提交推送后 `git ls-remote --heads origin lab/ch06-graph-exercises` 返回同一 SHA。

Clang 报告：`.lab-cache/ch06/verify-clang__-all-pack.json`。MSVC 报告：`.lab-cache/ch06/verify-cl-all.json`。运行报告与截图为本机验证产物，未加入产品提交。

| Lab | 参考解（Clang/MSVC） | 学生骨架（Clang/MSVC） |
| --- | --- | --- |
| 06E04 | 100/100 | 0/100 |
| 06E05 | 100/100 | 50/100 |
| 06E06 | 100/100 | 15/100 |
| 06E07 | 100/100 | 15/100 |
| 06E08 | 100/100 | 10/100 |
| 06E09 | 100/100 | 0/100 |
| 06E10 | 100/100 | 30/100 |
| 06E11 | 100/100 | 15/100 |
| 06E12 | 100/100 | 25/100 |
| 06E13 | 100/100 | 50/100 |
| 06E14 | 100/100 | 0/100 |
| 06E15 | 100/100 | 0/100 |
| 06E16 | 100/100 | 0/100 |
| 06E17 | 100/100 | 0/100 |
| 06E18 | 100/100 | 45/100 |
| 06E19 | 100/100 | 35/100 |
| 06E20 | 100/100 | 45/100 |
| 06E21 | 100/100 | 0/100 |
| 06E22 | 100/100 | 0/100 |
| 06E23 | 100/100 | 0/100 |

## 生成物清理范围

仅移除本次已知生成物，不做代码/依赖迁移：

| 路径 | 证据与处理 | 恢复方式 |
| --- | --- | --- |
| 本次 20 个新增 Lab 根目录中的 `main.obj` | 本次 MSVC 验证生成的目标文件；不属于发布合同，按已列出的绝对路径逐项删除 | 重新运行 MSVC 编译 |
| `public/diagrams/graphviz-bst-degenerate-chain-b7951c2016c712d624607bc4c9a86725.svg` | 插件由未修改的第 8 章生成，与 dist 副本 SHA256 相同；删除未跟踪副本 | 重新 build |
| `public/diagrams/graphviz-max-path-sum-local-a2233706cac444ca35cbdd8e5c321c53.svg` | 插件由未修改的第 4 章生成，与 dist 副本 SHA256 相同；删除未跟踪副本 | 重新 build |
| `public/diagrams/graphviz-threaded-tree-diagram-730d7317a4f02762f0c8106f47506a73.svg` | 插件按内容哈希生成，替换旧 ID 对应文件；删除未跟踪副本 | 重新 build |
| `public/diagrams/graphviz-threaded-tree-diagram-4eae157403c1104e3b50e87940e24ec7.svg` | 本次 build 删除的已跟踪旧图，恢复 HEAD 内容，避免无关变更 | Git HEAD |

不删除 `dist/pages`，最终静态预览与浏览器检查使用其中独立的产物副本。

## 限制与交付范围

- 本机为 Windows，Node 24.14.0、pnpm 11.1.1、Clang 21.1.0、MSVC 19.51.36256；未声明 Linux/macOS/GCC 已验证。
- CSES 官方访问超时；三题明确使用本地约束及课程样例。1682 判定方法另参考 USACO Guide。LeetCode 官方访问受限，使用 doocs/leetcode 镜像核对；具体来源见 `docs/ch06-exercise-sources.md` 和任务 research。
- 原题允许的其他正确道路方案、SCC 编号或不可达见证可能不通过本地固定比较；这一适配已经逐题明示。
- README 保持 `status: draft`，知识内容最终发布仍按仓库 Review Owner 流程。此次用户授权范围为完成、检阅、提交及推送任务分支。
- 隐藏子进程预览启动被自动审批策略拒绝，未给具体原因；已使用会话内 Node HTTP 服务，仅监听 `127.0.0.1:4174` 并限制读取 `dist/pages`，请求检查成功。

## 提交与推送

工作提交：`31ac483a40040e260855d4e2610bd1cd061fc2fc`，`feat(ch06): add twenty graph exercise labs`。已推送 `origin/lab/ch06-graph-exercises`，远端返回该 SHA。任务归档提交为 `d9b2b62b`；Azen 会话 38 已记录在 `.trellis/workspace/Azen/journal-1.md`。归档和会话记录作为后续独立提交推送；不合并 main，不触发部署。
