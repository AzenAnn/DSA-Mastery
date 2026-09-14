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
scoreProject(repoRoot: string, labRelativePath: string): Promise<ProjectScoreResult>;
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
- Project 提交前只保存当前 Project 根目录内、且路径精确匹配已发现 `student/` 文件的 dirty 文档；不能调用 `workspace.saveAll()` 影响其它题目。之后调用 `node tools/lab/cli.mjs score <relativePath> --json`，由 CLI 负责 CMake、CTest、stdio 比较器、依赖和权重计算。
- 进度 schema 3 继续兼容旧 Program/Quiz 状态；Project 使用独立 `dsaMastery.projectProgress.v1`，以 stable `labId` 为 key，只保存最近一次自动结果摘要和提交次数，不保存多文件源码快照或完整长输出。`resetAll()` 必须同时清理两张状态表。
- 每次 Project 提交追加 `ActivityEvent` 的 `submit`；只有 `automatedFull && manualPending === 0 && !internalError` 才追加 `pass`、章节计数为已完成并显示最终完成状态。自动满分但存在 manual task 必须显示“自动通过 · 待人工”，不能伪造最终绿勾。
- Project 不提供 Program 的单文件提交历史入口。直接调用历史命令时给出明确的多文件历史暂不支持提示；Program 的历史、快照迁移和 diff 行为保持不变。

## 4. Validation & Error Matrix

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
| Project dirty 文件来自其它 Lab 或不在 `student/` | 不保存、不提交 |

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
const files = lab.studentFiles.filter((file) => isOpenAndDirty(file.absolutePath));
await Promise.all(files.map((file) => save(file.absolutePath)));
const result = await scoreProject(repoRoot, lab.relativePath);
await progress.recordProjectSubmission(lab, result);
```

学生文件入口来自扫描到的 `student/` 白名单，评分和聚合由既有 CLI 负责，状态以 stable `labId` 独立持久化。

## 8. Quiz 侧边栏一键测评契约

### 1. Scope / Trigger

当修改 Quiz 树节点后的 `dsaMastery.submit` 播放按钮，或修改 Quiz WebView 与扩展宿主的提交消息时适用。该入口不能像 Program/Project 一样先调用 `LabPanel.show()`：当前未提交的单选值只存在于 WebView DOM，重渲染会丢失它们。

### 2. Signatures

```ts
LabPanel.submitQuiz(lab: LabEntry, deps: PanelDeps): Promise<void>;

// 宿主 → 当前 Quiz WebView
{ type: "submitQuiz" }

// Quiz WebView → 宿主
{ type: "quizAnswers", answers: Array<{ questionId: string; selected: number }> }

// 宿主 → Quiz WebView（同一批处理结束）
{ type: "quizBatchComplete" }
```

### 3. Contracts

- `dsaMastery.submit` 对 Quiz 调用 `LabPanel.submitQuiz()`；Program 和 Project 继续走 `show()` 后 `submitActive()` 的既有判题流程。
- 仅当单例面板正在显示相同 `lab.id` 的 Quiz 时，`submitQuiz()` 可以向 WebView 发送 `{ type: "submitQuiz" }`；该分支不得调用 `load()` 或替换 `webview.html`。
- WebView 只收集 `input:checked:not(:disabled)`，并以 `quizAnswers` 批量回传。未选择题不应产生记录，已锁定题目不应再次进入批次。
- 宿主把 WebView 消息当成不可信输入：只接受存在的 question ID、整数选项索引和该题选项范围内的值；同一批次中的 ID 去重。
- WebView 在发出批次后保持 `quizBatchInFlight`，直至宿主发回 `quizBatchComplete`；它还必须为单题和批量入口共用每题 pending 集合，直至相应 `quizResult` 回填。宿主同时保持 `quizBatchInProgress` 及每题 pending 集合。两层锁必须阻止结果反馈回填前的连续点击重复写入进度。
- 每个合法项必须复用现有单题 `answerQuiz()` / `ProgressTracker.recordQuizAnswer()` 路径，以保持反馈、进度、完成徽章和树装饰一致。
- 当前面板不是目标题目时，只加载并显示目标 Quiz；不向错误的 WebView 发送提交请求，也不伪造提交。

### 4. Validation & Error Matrix

| 条件 | 行为 |
| --- | --- |
| 当前面板是同一 Quiz | 不重载 WebView，发送 `submitQuiz` |
| 当前面板不存在、不是 Quiz 或 Quiz ID 不同 | 仅打开目标题目，不提交 |
| 批量消息为空 | 不写入进度 |
| 题目 ID 不存在、重复，或选项非整数/越界 | 忽略该项，继续处理其它合法项 |
| radio 未选择或已 disabled | WebView 不把该题发送给宿主 |
| 同一批处理尚未收到 `quizBatchComplete` | WebView 忽略重复的 `submitQuiz` 请求 |
| 单题或批次正在写入 | WebView 与宿主都忽略重叠的批次或同题提交 |

### 5. Good / Base / Bad Cases

- Good：在当前 Quiz 中先选多题但不点“提交本题”，点击树节点播放按钮后，每题仍保留选择并显示既有正确/错误反馈。
- Base：点击尚未打开的 Quiz 播放按钮时，扩展只打开该 Quiz，用户可继续选择答案。
- Bad：Quiz 分支先执行 `LabPanel.show()` 再调用通用 `submitActive()`；这会重建 WebView、丢弃临时选择且只显示“逐题作答”的提示。

### 6. Tests Required

- UI 契约测试必须断言 `submitQuiz`/`quizBatchComplete` 宿主消息、`quizAnswers` 回传、`input:checked:not(:disabled)` 过滤、两侧批次锁、Quiz 分支不调用 `load()`、宿主去重并顺序复用 `answerQuiz()`。
- 运行 `node --experimental-strip-types --test test/*.test.ts`、`tsc -p tsconfig.json --noEmit` 和 `node build.mjs`，以及本仓库要求的相关质量门禁。

### 7. Wrong vs Correct

#### Wrong

```ts
await LabPanel.show(lab, panelDeps);
await LabPanel.submitActive();
```

#### Correct

```ts
if (lab.type === "quiz") {
  await LabPanel.submitQuiz(lab, panelDeps);
  return;
}
await LabPanel.show(lab, panelDeps);
await LabPanel.submitActive();
```
