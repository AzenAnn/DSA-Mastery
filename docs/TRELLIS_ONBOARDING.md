# Trellis 协作入门

Trellis 在本项目中只负责保存开发规范、任务上下文和会话记录。GitHub Issue 负责面向人的需求讨论，Pull Request 负责真实改动、验证和合并；三者不要互相替代。

## 1. 固定版本与个人身份

项目固定使用 Trellis `0.6.14`，不要直接安装 `latest`。项目本身要求 Node.js `>=22.13.0`，同时需要可用的 Python 3 来运行仓库内脚本。

首次准备：

```powershell
npm install --global @mindfoldhq/trellis@0.6.14
trellis --version
trellis init -u <你的-GitHub-用户名>
python ./.trellis/scripts/get_context.py
```

`trellis --version` 应显示 `0.6.14`。`-u` 使用每位维护者稳定、唯一的 GitHub 用户名，不共用 `student`、`admin` 等泛化身份。

在已经初始化的仓库中，`trellis init -u ...` 的目的只是建立当前维护者的本地身份与工作区。执行前先确认工作树，不要使用 `--force` 覆盖团队文件。初始化后重点检查：

- CLI 提示仓库已经初始化时，选择 **Set up developer identity on this device**；不要选择 Full re-initialize；
- `.trellis/.developer` 只保存本机身份，已被忽略，不分享、不提交；
- `.trellis/workspace/<用户名>/` 是该维护者可审查的日志与索引，可以随协作改动提交；
- `.trellis/.runtime/`、缓存、临时文件和 hook 日志不提交；
- `.trellis/.version` 必须保持 `0.6.14`。

若不想全局安装，也可用固定版本执行一次命令：

```powershell
npx --yes @mindfoldhq/trellis@0.6.14 init -u <你的-GitHub-用户名>
```

不要在同一次初始化中混用两种版本。

## 2. 每次开始工作

1. 从最新 `main` 创建一个短分支，并先查看 `git status --short`，区分自己的改动和他人的未提交文件。
2. 读取 `AGENTS.md`、`.trellis/workflow.md` 与 [项目规范索引](../.trellis/spec/index.md)，只展开本次改动涉及的规范。
3. 查看当前上下文：

   ```powershell
   python ./.trellis/scripts/get_context.py
   ```

4. 明确读者结果、范围、非目标和验证方法，再决定是否创建 Issue 或 Trellis task。

仓库使用 Trellis `0.6.14` 的原生 `.trellis/workflow.md`，并将 `session_auto_commit` 设为 `false`、Codex `dispatch_mode` 设为 `inline`。Codex 暴露项目 skills 时，原生流程是：

```text
trellis-start
  → 规划并激活 task
  → trellis-before-dev
  → 修改
  → trellis-check
  → trellis-update-spec
  → 维护者审查并提交
  → trellis-finish-work
```

skills 不可用时，再用下文 Python 命令完成同一生命周期。Trellis 可以写任务或日志文件，但暂存、提交、push 与合并必须由维护者明确执行。

## 3. 任务生命周期

小型拼写、明确断链或单文件说明可直接走小 PR。涉及多文件、架构、内容契约、迁移或需要跨会话继续的工作，创建 Trellis task：

```powershell
python ./.trellis/scripts/task.py create "任务标题" --slug short-kebab-slug --assignee <用户名> --no-start
```

`--slug` 不写日期前缀，脚本会自动添加。推荐流程：

1. 在 task 的 `prd.md` 写清问题、目标、范围、非目标和验收标准；复杂工作再补 `design.md` 与 `implement.md`。规划材料由人确认后再启动实现。
2. 校验任务材料，再将它设为当前任务：

   ```powershell
   python ./.trellis/scripts/task.py validate <任务目录>
   python ./.trellis/scripts/task.py start <任务目录>
   ```

3. 实施前运行/调用 `trellis-before-dev`，完成后用 `trellis-check` 和 `trellis-update-spec`；记录实际测试和关键判断，不要把未运行的检查写成“通过”。
4. 维护者审查 diff 后自行暂存、提交和 push，再发 Draft PR，关联 Issue 与 task，交由另一名维护者 Review。
5. 代码已经提交、质量门禁通过且工作树没有本任务遗留改动后，优先使用 `trellis-finish-work`。若平台没有该入口，再手动归档；本项目显式禁用脚本提交：

   ```powershell
   python ./.trellis/scripts/task.py archive <任务目录> --no-commit
   ```

需要记录一次会话时同样使用 `--no-commit`：

```powershell
python ./.trellis/scripts/add_session.py --title "本次工作" --summary "完成内容与结论" --no-commit
```

归档会把任务状态改为完成并移动目录。它不是“代码已合并”的替代证明；未提交代码、未处理的 blocking Review 或明确后续工作仍存在时不要归档。

## 4. GitHub Issue、Trellis task 与 PR 的边界

| 载体 | 保存什么 | 不保存什么 |
| --- | --- | --- |
| GitHub Issue | 面向同学和维护者的问题、学习结果、范围、负责人、公开讨论与验收 | 大量实现期上下文或会话流水 |
| Trellis task | PRD、设计、实现计划、上下文文件、决策和会话状态 | 社区讨论与最终合并决定 |
| Pull Request | 实际 diff、执行过的验证、截图/复现证据、Review 与回滚信息 | 未落地的长期需求池 |

- 章节与独立 Lab 使用仓库现有 Issue 模板；社区可见或需要分工的事项必须有 Issue。
- 一个 Issue 可以拆成多个 task。通过 task 的 notes/meta 或 PR 文本关联 Issue，不复制整篇讨论。
- task 可以先做内部技术拆分，但不能绕过另一名维护者对知识正确性、版权、发布和删除的审批。
- PR 只解决一个目标；Issue 描述“为什么与做到什么”，task 描述“如何安全完成”，PR 证明“实际改了什么并通过什么”。

## 5. Codex hooks 安全

Codex hooks 会在提示、会话或子代理事件上执行仓库中的脚本，能力等同于运行本地代码，因此只对已审阅、可信的仓库启用。

- `AGENTS.md` 和 `python ./.trellis/scripts/get_context.py` 不依赖 hooks；不启用 hooks 也能按 Trellis 工作。
- 启用前逐项审阅 `.codex/hooks.json`、`.codex/hooks/*.py`、`.codex/config.toml` 以及它们调用的 `.trellis/scripts/**`。
- hooks 是每位维护者的本机选择。不要替队友修改用户级 Codex 配置，也不要提交凭据、绝对个人路径或自动 push/merge 命令。
- 不同 Codex 版本的功能开关可能不同；以当前 Codex 官方说明和本机 `codex --version` 为准，不复制未知来源配置。启用后先在干净工作树中观察一次输出与 `git status`。
- 若 hook 行为异常，先关闭本机 hook 开关，改用手动 `get_context.py`；不要用 `--force` 重跑初始化。

## 6. 团队约定

- 两名维护者使用不同 Trellis 身份、不同短分支，同一时刻不共同编辑同一个 task 文件。
- 知识内容的 Author 与 Review Owner 分离；AI 生成的复杂度、代码、引用和运行结论必须人工复核。
- 提交前只暂存本任务文件，运行对应规范列出的验证，并把真实结果写入 PR。
- `main` push 才可进入正式 Pages 发布；PR 只构建和检查，不部署。
- 遇到未知 dirty 文件、删除候选或配置冲突时先停下确认，不把“清理”当成授权。
