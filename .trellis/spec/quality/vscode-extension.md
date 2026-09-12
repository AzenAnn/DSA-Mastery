# VS Code Extension Lab Identity, Project and Progress Contract

## 1. Scope / Trigger

适用于修改 `tools/vscode-extension/**` 中的 Lab 扫描、树视图、做题 WebView 导航、Project 文件入口、提交/统计状态或源码快照路径时。尤其适用于仓库 Lab 目录从平铺结构迁移到 `theory`、`exercise`、`project` 分类结构，或 README frontmatter 增加/调整 `labId` 时。

## 2. Signatures

```ts
interface LabBase {
  id: string;             // 稳定业务身份，如 01E01、01P01
  name: string;           // 当前目录名，只用于资源定位/兼容解析
  legacyNames: string[];  // 旧目录键别名
  labPath: string;        // Lab 绝对路径
  relativePath: string;   // 相对仓库根，传给 lab CLI
  title: string;
  chapter: number;
  order: number;
}

type LabEntry = ProgramLab | QuizLab | ProjectLab;

discoverProgramLabs(repoRoot: string): Promise<Chapter[]>;
ProgressTracker.migrateLabKeys(labs: readonly LabEntry[]): Promise<void>;
scoreProject(repoRoot: string, labRelativePath: string, taskId?: string): Promise<ProjectScoreResult>;
ProgressTracker.getProject(labId: string): ProjectProgress | undefined;
ProgressTracker.recordProjectSubmission(
  lab: ProjectLab,
  result: ProjectScoreResult,
): Promise<ProjectProgress>;
```

Project 的结果类型必须保留以下可辨识层级：

```ts
ProjectScoreResult {
  tasks: Array<
    | { kind: "stdio"; judge: ScoreResult; status: Verdict; weight: number; weightedScore: number }
    | { kind: "ctest"; tests: ProjectCtestResult[]; status: Verdict; weight: number; weightedScore: number }
    | { kind: "manual"; status: "PENDING"; checklist: string[]; weight: number; weightedScore: 0 }
  >;
  automatedScore: number;
  automatedMax: number;
  manualPending: number;
  provisionalTotal: number;
  total: number;
  automatedFull: boolean;
  internalError: boolean;
}
```

## 3. Contracts

- 扫描 `labs/chapter-*/theory/`、`exercise/`、`project/` 下的直接 Lab 子目录；不存在的分类目录跳过。迁移过渡期可以读取章节目录下的旧平铺 Lab，但若新旧副本同时存在，优先分类目录并去重。
- `program`、`quiz` 和结构完整的 `project` 都进入插件。Project 顶层必须是 C++/CMake Project，task manifest 必须与顶层 `kind` 一致；README-only、坏 manifest、缺 task manifest、坏 task 数据或没有可解析运行数据的 Project 跳过，不阻塞其它 Lab。
- 合法稳定编号匹配 `^\d{2}[TEP]\d{2,}$`，从 README frontmatter `labId` 读取。缺失或非法编号退回当前目录名，不用 `order` 推导稳定 ID。
- `id` 是树命令参数、进度 key、活动事件值和章节统计索引；`name`/`legacyNames` 只用于资源定位或兼容解析。判题 CLI 必须收到 `relativePath`，不能收到 `id`。
- Project task 展示 `id`、相对路径、kind、weight、dependsOn；`stdio` 读取 task 的公开输入/期望输出，`ctest` 读取测试名称和分值，`manual` 读取 checklist 并显示 `PENDING`。学生文件只从当前 task 的 `student/` 下递归收集；不展示 `solution/`、`tests/`、`.lab-cache/` 或符号链接文件/目录作为作答入口。
- Project 提交前重新收集本 Project 内的相关输入（学生代码、公共头文件、测试、配置），逐一保存匹配的 dirty 文档；跳过 solution/cache/符号链接和其它题目，不能调用 `workspace.saveAll()`。保存失败或保存期间再次编辑取消测评。之后调用 `score <relativePath> [--task id] --json`，由 CLI 负责构建与评分。
- 本次提交捕获固定 Lab 身份和面板版本，切题后旧结果不能覆盖新面板；本地提交锁和 CLI Project 锁同时保护并发。评分后重新调用 `project-status --dirty-files JSON`，不能把未保存输入对应的旧成绩当作当前通过。
- 当前状态仅缓存在内存并由 CLI 指纹核验；文件/编辑监听按 revision 丢弃过期响应。`currentUnknown` 只显示历史，不计入完成。Project 当前状态表提供 `UNASSESSED/STALE/BLOCKED`、依赖、任务题面、公共接口、学生文件、单项/全项测评与原始诊断。
- 进度 schema 3 继续兼容旧 Program/Quiz 状态；Project 使用独立 `dsaMastery.projectProgress.v1`，以 stable `labId` 为 key，只保存最近一次自动结果摘要和提交次数，不保存多文件源码快照或完整长输出。`resetAll()` 必须同时清理两张状态表。
- 每次 Project 提交追加 `ActivityEvent` 的 `submit`；只有 `automatedFull && manualPending === 0 && !internalError` 才追加 `pass`、章节计数为已完成并显示最终完成状态。自动满分但存在 manual task 必须显示“自动通过 · 待人工”，不能伪造最终绿勾。
- Project 不提供 Program 的单文件提交历史入口。直接调用历史命令时给出明确的多文件历史暂不支持提示；Program 的历史、快照迁移和 diff 行为保持不变。

## 4. Validation & Error Matrix

### Ch4 Explicit Renumbering

`ch04Migration.ts` 保存 2026-09-11 明确授权的 20 个旧新编号映射。必须在扫描确认完整新布局后执行一次，标记 `ch04-exercise-order-2026-09-11` 与主进度一起持久化。迁移从原始记录同时生成结果，不能逐条原地搬移重叠键；随后才合并旧目录与平铺目录别名。备份写入成功前不能更改状态，历史 snapshot 路径保持原样。`load()`、后续别名合并与 `resetAll()` 必须保留 appliedMigrations，防止新成绩被再次迁移。旧布局或部分扫描不触发；旧扩展与新扩展同时写同一 globalState 不属于本次兼容范围。

相关回归为 `ch04-migration.test.ts`：20 个交叉 ID、旧布局拒绝、备份失败、别名合并、快照/事件完整、重启幂等与重置后保留迁移标志。

| 条件 | 行为 |
| --- | --- |
| 分类目录不存在 | 跳过该分类，继续扫描其它分类 |
| `labId` 缺失/非法 | 使用当前目录名作为身份，不抛异常 |
| manifest 缺失/坏 JSON/不支持类型 | 跳过目录 |
| Project manifest 缺少 `buildSystem: "cmake"`、task.json、必需 task 数据或出现不安全相对路径 | 跳过该 Project，不影响其它 Lab；提交时仍由 CLI 做权威校验 |
| `student/` 本身或其子项是符号链接 | 不跟随、不收录其文件 |
| Project CLI 顶层错误（如 `CMAKE_NOT_FOUND`、schema/path error） | 面板显示明确工具错误，不写入 ProjectProgress，不追加 pass |
| Project task 返回 `IE` | 保留任务级结果，顶层显示评测内部错误，不追加 pass |
| `stdio` task | 展示 `judge.cases[]`，包括 verdict、得分、耗时、stderr 和首处差异 |
| `ctest` task | 展示命名测试的 verdict、得分、耗时和失败输出；构建失败时标记 CTest 未运行 |
| `manual` task | 固定显示 `PENDING`、权重和 checklist；不计入 automated 分，不录入人工分 |
| 自动部分满分且有 manual pending | 显示“自动通过 · 待人工”，不计入最终完成/通过 |
| 新旧目录副本同时存在 | 分类目录优先，只保留一个 Lab |
| 旧键与 stable 键冲突 | 调用领域 merge，不能覆盖丢数据；迁移前备份旧主状态 |
| Project dirty 文件来自其它 Lab 或不在相关输入集合 | 不保存该文件 |
| 历史满分但当前未核验或已失效 | 历史保留，当前不能计入完成 |
| 上游源码修改 | CLI 按 `buildDependsOn` 传递失效；旧配置回退 `dependsOn`，不设置测试通过门禁 |

## 5. Good / Base / Bad Cases

- Good：`P-03-01` 进入树；面板显示 matcher 的 stdio cases、engine 的 CTest 名称和 report 的 `PENDING`，提交传入 `labs/chapter-03/project/P-03-01-string-match-engine`，结果保留 task → case/test 层级。
- Good：自动结果 `Automated 80/80 + Manual pending 20` 时显示“自动通过 · 待人工”，章节完成数不增加。
- Base：本机缺少 CMake 时 Project 仍可展示；提交由 CLI 返回 `CMAKE_NOT_FOUND`，扩展显示环境错误，Program/Quiz 不受影响。
- Bad：把 Project 当成 `student/main.cpp`，只打开一个文件、压平 task 结果，或使用 `workspace.saveAll()` 保存其它题目的改动。
- Bad：用 `lab.name` 做进度 key、把 `lab.id` 当 CLI 路径，或跟随 `student/` 符号链接读取 Project 外部文件。

## 6. Tests Required

- 身份测试：合法、空值、非法 `labId` 回退；旧/新标题编号前缀去重。
- 发现测试：三分类目录、旧平铺兼容、README-only/不支持类型过滤、过渡期新旧副本去重、5 个真实 Project、三种 task 元数据、Project 学生文件分组和符号链接不跟随。
- 迁移工具测试：多个旧键合并到稳定键、稳定记录不被覆盖、活动事件只改键不改顺序/其它字段；Project 使用独立 key。
- Project 结果测试：保留 task → case/test 层级；manual 为 `PENDING`；自动满 + manual pending 不通过；IE 不追加 pass；长 CTest 输出不写入持久化摘要。
- UI contract 测试：Project README、task/card、依赖、权重、学生文件入口、stdio case、CTest、PENDING、错误/差异输出和 Automated/Manual pending/Provisional total 都存在；Project 不出现 Program history 控件。
- 提交回归：保存失败取消、无关文件不保存、切题/并发保护、当前结果优先于历史。安装回归必须在隔离的 user-data/extensions 中使用实际 VSIX，并比较真实 SQLite 中旧版进度、升级、重启和回退；`--extensionTestsPath` 的内存 storage 不能作为持久化证据。
- 打包使用固定 vsce、受控 pnpm allowBuilds；安装脚本不依赖固定文件名/PATH，不提升权限或永久改策略。VSIX README 链接用绝对站点 URL，避免 vsce 将包外相对路径重写为坏链。Windows PowerShell、macOS bash 各按真实语法说明，未原生实测平台必须注明。
- 每次修改后运行插件全量 `node --experimental-strip-types --test test/*.test.ts`、`tsc -p tsconfig.json --noEmit` 和 `node build.mjs`，并运行相关仓库门禁 `pnpm run validate`、`pnpm run test:lab-tools`、`pnpm test`；若 CMake 不可用，记录 `CMAKE_NOT_FOUND`，不能把环境失败写成代码通过。

## 7. Wrong vs Correct

### Wrong

```ts
const source = path.join(lab.labPath, "student", "main.cpp");
await vscode.workspace.saveAll();
await scoreLab(repoRoot, lab.name);
```

这会丢失 Project 的多 task 文件结构，保存其它 Lab 的改动，并把目录名误当成 CLI 路径。

### Correct

```ts
const inputs = await collectProjectFiles(lab.labPath);
const files = inputs.filter((file) => isOpenAndDirty(path.join(lab.labPath, file)));
for (const file of files) {
  if (!(await save(path.join(lab.labPath, file)))) throw new Error("保存失败，取消测评");
}
const result = await scoreProject(repoRoot, lab.relativePath);
await progress.recordProjectSubmission(lab, result);
```

学生文件入口来自扫描到的 `student/` 白名单，保存范围还包含当前工程相关输入；评分和聚合由 CLI 负责，历史以 stable `labId` 独立持久化。

## 8. Statistics Profile And Rank

`StatsPanel` 只读取既有事件及按题型生成的章节完成数，交给纯函数 `renderStatsDocument({ events, bars, now? }, { cspSource, styleUri, nonce })`。样式合同见 [统计 WebView](../frontend/visual-responsive.md)。不得为了 Rank 改变持久化、活动采集或提交逻辑。

- `getRankProgress(countActivity(events).labsPassed)` 是唯一 Rank 输入，沿用当前事件日志中不同 `labName` 的通过数；不能传 `passes`、`submissions` 或章节当前完成数。保留既有事件上限，不在 UI 层创建第二份终身统计。
- `rank.ts` 集中定义 Trainee/Pupil/Specialist/Expert/Candidate Master/Master/Grandmaster/Legendary，起点分别为 0/10/30/60/100/150/200/250。`getNextRank` 返回下一配置或 undefined。
- 进度为 `(solved - rank.minSolved) / (next.minSolved - rank.minSolved) * 100`；14 solved 是 Pupil、20%、距离 Specialist 16 题。新等级从 0% 开始；Legendary 为 100%、无 nextRank、显示 MAX RANK。
- 非有限/负数输入按零处理，非负有限小数取整；重复提交与同一 Lab 的重复通过不影响 Rank。热图和趋势仍统计原始事件次数，Project 当前完成仍使用 `projectProgressPassed`，不能以历史 Rank 反推章节当前通过。
- 历史事件可能包含无效日期：总计和 Rank 保留原有计数，只有热图、年份和趋势过滤无法解析的时间；渲染器不能因空日期映射崩溃，也不能改写持久化记录。
- 现有面板只有命令触发快照刷新；不能把重开面板/恢复本地视图状态当作一次新晋级事件。没有可靠 before/after 数据时省略可选 Rank Up 通知。
- `rank.test.ts` 覆盖所有门槛相邻值、最高等级、非法输入和重复活动不升级。`stats-panel-ui.test.ts` 对实际渲染文档断言 Rank、计数、日期、CSP、转义及宿主 Project 完成判断；浏览器验收不能以源码正则替代。
