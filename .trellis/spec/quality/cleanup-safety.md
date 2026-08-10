# 迁移清理与删除安全

## 1. Scope / Trigger

清理依赖、缓存、日志、测试产物，执行递归移动/删除，或有人提议重新引入已移除旧运行时时适用。

## 2. Signatures

删除前必须有 `docs/CLEANUP_REPORT.md`，每项记录：

```text
候选路径/依赖 | 旧职责 | 替代物 | 无引用证据 | 删除/保留决定 | 回滚方式
```

历史迁移的 30 个旧 vinext/React/RSC/Cloudflare/Sites 跟踪文件已按 `docs/CLEANUP_REPORT.md` 删除。未来清理不得把这些路径重新引入为并行运行时；新的候选仍须以引用与验证证据为准。

## 3. Contracts

未来删除门禁：

1. VitePress 已完成内容、build、link、Playwright、Pages-base 和视觉验证。
2. CLEANUP_REPORT 已指出每个旧入口的替代文件。
3. 用 `rg` 检查源码、脚本、workflow 和文档无剩余引用。
4. 精确解析目标绝对路径，确认位于当前 workspace 内。
5. 删除后从干净依赖状态重跑完整门禁。

必须保留：

- `content/**`、`labs/**`、`public/**`；
- `README.md`、`CONTRIBUTING.md`、`docs/**`；
- `.github` 模板与经过改写的 Pages workflow；
- `.trellis/**`、`.agents/**`、`.codex/**`、`AGENTS.md`；
- 内容 validator、Playwright 和已验证的 VitePress 替代实现。

当前生成目录 `dist`、`.vitepress/cache`、`test-results`、`playwright-report` 只按明确路径清理并保持 gitignored。旧 `.next`、`.vinext`、`.wrangler` 已从工作区和根忽略规则移除；若回滚到旧架构，应随回滚提交一并恢复所需规则。不要把环境变量、globs 或当前目录推断成递归删除目标。

## 4. Validation & Error Matrix

| 条件 | 行为 |
| --- | --- |
| 替代实现尚未全绿 | 不删除 |
| target 为空、workspace 根或解析到 workspace 外 | 立即停止 |
| `rg` 仍发现有效引用 | 保留并调查 |
| 仅凭文件名“像旧文件” | 标为不确定，不删除 |
| 删除后 lockfile/干净安装仍含旧包 | 清理未完成 |
| 删除后任何 URL/视觉/测试回归 | 回退删除组 |

## 5. Good / Base / Bad Cases

- Good：报告证明某个新候选已有替代、无有效引用，并在单独 commit 删除后重跑 `pnpm test`。
- Base：用途不明的文件先保留并在报告中记录不确定性。
- Bad：对仓库根执行递归清理，或用 `Remove-Item $variable -Recurse` 而未打印并验证解析路径。

## 6. Tests Required

- 删除前后各保存 `rg` 引用结果和 `git status --short`。
- 重新执行 `pnpm install --frozen-lockfile`，确认 lockfile 与安装树不再含已删技术栈。
- 重跑内容、type/lint、build、link、单测和 Pages Playwright。
- 核对七篇教材、四个 Lab、首页、Labs 索引、404 和截图。
- Review staged deletion diff，确认没有课程内容、素材或 Trellis 文件。

## 7. Wrong vs Correct

### Wrong

```powershell
Remove-Item $target -Recurse -Force
```

目标来自未验证变量，且没有替代证据。

### Correct

先用只读命令解析并展示每个绝对目标，逐项确认均在工作区且列入 CLEANUP_REPORT，再在同一 PowerShell 环境按明确路径删除；每组删除保持可独立回退。

## 回滚

- 合并前：保留旧栈直到新栈全绿；放弃 Draft PR 即不影响 `main`。
- 合并后：通过 Review PR 逆序 revert 迁移 commit 组；内容路径保持不变，无数据迁移。
- 仅 Pages 故障：先恢复上一个绿色 Pages artifact，再在修复分支调查。
