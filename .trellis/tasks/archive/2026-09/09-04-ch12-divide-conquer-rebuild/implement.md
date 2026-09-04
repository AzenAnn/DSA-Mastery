# 实施计划：Ch12 分治与递归整体重构

## 阶段 0：实施前门禁

- [ ] 用户批准 `prd.md`、`design.md`、`implement.md` 的最终版本。
- [ ] 运行 `python ./.trellis/scripts/task.py start 09-04-ch12-divide-conquer-rebuild`，确认状态为 `in_progress`。
- [ ] 按 `trellis-before-dev` 重新加载实现所需规范，确认 `git status --short` 只有本任务规划文件。
- [ ] 记录 `main`、`origin/main` 和当前分支 commit，确保删除可由 Git 恢复。

回滚点：此阶段尚未修改产品代码。

## 阶段 1：建立可复现的 16 题内容源

- [ ] 新增 `scripts/generate-chapter-12-divide-conquer-labs.mjs`，只允许生成 design 中列出的 16 个精确目标目录。
- [ ] 为每题冻结 ID、slug、标题、难度、时长、来源 URL、输入输出、本地化合同、compare mode、limits 与 20 个测试用例元数据。
- [ ] 为每题编写原创 C++17 solution；先用独立小样例或朴素算法交叉验证关键计数题。
- [ ] 为每题编写可编译但非满分的 starter，TODO 指向本题核心方法，不把 solution 留在 student 区。
- [ ] 生成完整 README、manifest、薄 Makefile、student/solution 和 `.in/.out` 文件。

重点人工检查：

- `12E01` 的完整 w 函数分支与输入终止协议；
- `12E02` 的 `0/1` 指数格式；
- `12E03` 的反斜杠、前导空格和最大输出；
- `12E04` 的 `INT_MIN` 与浮点容差；
- `12E06` 的 1 基索引逆映射；
- `12E07` 禁用 `nth_element` 且重复值不死循环；
- `12E09` 的 TL/TR/BL/BR 编码；
- `12E10` 的坐标、方向编号和覆盖合法性；
- `12E12` 保留重复结果；
- `12E13` 是排列且满足 beautiful 性质；
- `12E11/14/15/16` 的相等边界、开闭区间和 64 位中间值。

回滚点：删除 16 个新目录与生成器即可回到旧 Ch12，旧内容尚未删除。

## 阶段 2：逐题验证替代物

对 `12E01`～`12E16` 逐题执行：

```powershell
pnpm lab:validate -- <lab-path>
pnpm lab:refresh-expected -- <lab-path>
pnpm lab:refresh-expected -- <lab-path> --write
pnpm lab:verify -- <lab-path>
```

- [ ] 16 个 reference 均为 100/100。
- [ ] 16 个 starter 均可编译且低于 100 分。
- [ ] 第二次 `refresh-expected` 无 diff，oracle 稳定。
- [ ] cases 每题至少 20 个、总分 100、标签与 README 所述边界一致。
- [ ] 对每题主要错误模型运行最小反例；可用临时错误版本或人工替换验证，结束后精确清理临时文件。
- [ ] 为 P1228 运行独立覆盖检查：除公主格外每格恰好覆盖一次、无越界、方向合法。
- [ ] 为 Beautiful Array 运行独立性质检查：输出是 `1..n` 排列且无违例三元组；测试代表值覆盖 `1..1000`。

若任一替代 Lab 未通过，不进入旧目录删除阶段。

## 阶段 3：删除旧 Ch12 Labs

- [ ] 更新 `docs/CLEANUP_REPORT.md`：列出旧 2 个 Theory + 13 个 Exercise 的精确目录、16 个替代目录、仓库级无外部引用结果、决策和 Git 回滚方式。
- [ ] 再次运行 `rg` 检查 15 个旧 slug 在目标目录外无引用。
- [ ] 验证待删绝对路径全部位于 `C:\Users\28962\Desktop\dsa-lab\labs\chapter-12\`。
- [ ] 删除 15 个旧 Lab 目录，不删除 `labs/chapter-12` 根目录。
- [ ] 在空的 `theory/` 与 `project/` 中保留 `.gitkeep`；`exercise/` 只保留 16 个新 Program Lab。
- [ ] 搜索并确认旧 slug、`12T01/12T02` 以及“13 个编程 Lab”文案不再出现在活动源码中。

回滚点：使用 Git 按精确旧目录恢复，绝不使用 `git reset --hard`。

## 阶段 4：重写 8 篇正文

- [ ] 重写 `00-overview.md`，给出本章定位、先修、七步路线、16 题三段梯度和完成标准。
- [ ] 将旧 `01`～`04` 内容迁移并重构到新 `01`～`07`；删除不再使用的旧文件名，保持章节目录恰好 8 篇。
- [ ] 修正汉诺塔、主定理整除、Ch11 前后关系等已知错误。
- [ ] 每篇加入贯穿示例、反例/易错点、自测与折叠答案；按样式指南使用语义容器。
- [ ] 只在关系复杂时加入 Graphviz，并为每图设置稳定 ID、caption 和不透明背景。
- [ ] 加入正式资料链接、相关 Lab 相对链接和 Ch11/Ch14/Ch15 边界链接。
- [ ] 核对所有 `order`、frontmatter、contributors、updated 与 `status: draft`。

验证：

```powershell
pnpm run validate:content
pnpm run test:discovery
```

## 阶段 5：接入统一课程索引

- [ ] 只修改 `.vitepress/content-index.ts` 的 Ch12 definition。
- [ ] 写入 8 个 `lessonSources`、`autoLabChapter: 12`、learning objectives 与 focus areas。
- [ ] 不新增第二份 Lab 清单，不改 loader、组件或路由算法。
- [ ] 运行内容验证，确认 Ch12 恰好发现 8 篇 lesson、16 个 exercise，theory/project 为空状态。

## 阶段 6：全量质量门禁

### 6.1 依赖与静态检查

```powershell
pnpm install --frozen-lockfile
pnpm run validate
pnpm run test:lab-tools
pnpm run test:lab-docs
pnpm run test:lab-make
pnpm run test:discovery
pnpm test
```

- [ ] 所有命令真实通过；失败项修复后重跑相关最小测试和 `pnpm test`。
- [ ] `git status` 不含 `.lab-cache`、`dist/pages`、截图或临时错误版本。

### 6.2 16 题最终矩阵

- [ ] 在清理旧目录后的最终树上重新逐题运行 16 次 `pnpm lab:verify -- <path>`。
- [ ] 保存简洁结果摘要：路径、reference 分数、starter 分数、oracle 状态。
- [ ] 在当前 Windows 环境运行代表性的 `lab:doctor`、`lab:run` 和单 case；若 MSVC 不可用，使用已验证的 Clang/GCC 路径并如实记录，不把环境缺失写成题目失败。

### 6.3 Pages 子路径

```powershell
$env:GITHUB_PAGES_BASE_PATH = '/DSA-Mastery'
$env:SITE_URL = 'https://azenann.github.io/DSA-Mastery/'
pnpm run build
pnpm run check:site
pnpm run test:pages
Remove-Item Env:GITHUB_PAGES_BASE_PATH
Remove-Item Env:SITE_URL
```

- [ ] 验证 8 个教材 URL 与 16 个三级 Lab URL 均存在。
- [ ] 验证 15 个旧 Lab URL 不存在。
- [ ] 验证 Pages base 只出现一次，正文与 Lab 链接无断链。

## 阶段 7：本地预览与视觉检查

- [ ] 启动 `pnpm run dev`，确认监听 `127.0.0.1` 并记录实际端口。
- [ ] 在 Codex 浏览器面板打开 `/learn/chapter-12-divide-conquer-recursion/00-overview/`。
- [ ] 实际点击 overview → 正文 → Lab → 上一页/下一页/课程侧栏。
- [ ] 检查 390px 与 1440px、浅色与深色：overview、复杂度长文、南蛮图腾、四叉树、P1228、区间和计数。
- [ ] 监控浏览器控制台和失败请求，无横向根溢出、错位、旧链接或 base 错误。
- [ ] 保持本地服务运行，方便用户继续查看；在最终交付中给出 URL 和停止方式。

## 阶段 8：收尾审计

- [ ] 使用 `trellis-check` 按 PRD 逐项审查并修复发现的问题。
- [ ] 比较 `git diff --stat` 与计划范围；任何额外改动逐项解释或撤回。
- [ ] 检查是否产生值得固化的新规范；若有则用 `trellis-update-spec`，没有则记录“现有规范已覆盖”。
- [ ] 按 `trellis-finish-work` 记录验证证据与会话；未经用户授权不提交、不 push。
- [ ] 最终向用户报告：分支、主要文件、16 题验证摘要、全仓测试、预览 URL、剩余人工 Review 风险。
