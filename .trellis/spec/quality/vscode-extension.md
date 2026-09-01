# VS Code Extension Lab Identity and Progress Contract

## 1. Scope / Trigger

适用于修改 `tools/vscode-extension/**` 中的 Lab 扫描、树视图、做题 WebView 导航、提交/统计状态或源码快照路径时。尤其适用于仓库 Lab 目录从平铺结构迁移到 `theory`、`exercise`、`project` 分类结构，或 README frontmatter 增加/调整 `labId` 时。

## 2. Signatures

```ts
interface ProgramLab {
  id: string;              // 稳定业务身份，如 01E01
  name: string;            // 当前目录名，只用于资源定位
  legacyNames: string[];   // 旧目录键别名
  relativePath: string;    // 当前 Lab 路径，传给 lab CLI
}

discoverProgramLabs(repoRoot: string): Promise<Chapter[]>;
ProgressTracker.migrateLabKeys(labs: readonly ProgramLab[]): Promise<void>;
remapRecordKeys<T>(source, aliases, merge): { records: Record<string, T>; changed: boolean };
remapEventKeys<T extends { labName: string }>(source, aliases): { events: T[]; changed: boolean };
```

## 3. Contracts

- 扫描 `labs/chapter-*/theory/`、`exercise/`、`project/` 下的直接 Lab 子目录；不存在的分类目录跳过。迁移过渡期可以读取章节目录下的旧平铺 Lab，但若新旧副本同时存在，优先分类目录并去重。
- 只有 `lab.json.type` 为 `program` 或 `quiz` 且其运行数据有效的目录进入插件；README-only、坏 manifest、坏 quiz、无 student source 的目录跳过。`project` 的人工评审任务不能被当作自动判题题目。
- 合法稳定编号匹配 `^\d{2}[TEP]\d{2,}$`，从 README frontmatter `labId` 读取。缺失或非法编号退回当前目录名，不用 `order` 推导稳定 ID。
- `id` 是树命令参数、进度/Quiz key、活动事件值、章节统计索引和新源码快照目录名；`name`/`legacyNames` 只用于路径或兼容解析。判题 CLI 必须收到 `relativePath`，不能收到 `id`。
- 进度 schema 3 兼容读取 schema 2；扫描完成后才执行目录键迁移。迁移前写入 `dsaMastery.progress.v1.backup.v<old>.<timestamp>`，成功后主记录使用稳定 ID。
- 合并冲突时保留代码题的通过状态、最高分、最早通过时间、最近提交和按快照去重的历史；选择题按答案时间优先、同一时间再按尝试次数选择。历史快照按 `HistoryEntry.snapshot` 原路径读取，不批量搬动物理文件。
- 树/WebView 展示稳定编号；标题中已有的 `Lab 01-E-01` 或 `Lab 01E01` 前缀不得再重复显示。命令解析和 WebView 导航接受 `id`、当前目录名和 `legacyNames`。

## 4. Validation & Error Matrix

| 条件 | 行为 |
| --- | --- |
| 分类目录不存在 | 跳过该分类，继续扫描其它分类 |
| `labId` 缺失/非法 | 使用当前目录名作为身份，不抛异常 |
| manifest 缺失/坏 JSON/不支持类型 | 跳过目录 |
| quiz 数据损坏或 program 没有 student source | 跳过目录 |
| 新旧目录副本同时存在 | 分类目录优先，只保留一个 Lab |
| 旧键与稳定键冲突 | 调用领域 merge，不能覆盖丢数据 |
| 迁移持久化前 | 先保留完整 globalState 备份 |
| 旧快照路径 | 保持 `HistoryEntry.snapshot`，不因重命名猜测或删除文件 |

## 5. Good / Base / Bad Cases

- Good：`labs/chapter-01/exercise/E-01-01-foo/README.md` 声明 `labId: 01E01`，树/状态使用 `01E01`，CLI 使用 `labs/chapter-01/exercise/E-01-01-foo`。
- Good：新分类目录和 `lab-01-06-foo` 暂时共存时，树只显示分类版本，旧进度键和活动事件合并到 `01E01`。
- Base：旧平铺 Lab 没有 `labId` 时仍可被发现，身份退回目录名，待内容迁移后再获得稳定编号。
- Bad：用 `order` 生成稳定 ID、把 `name` 写入新进度键，或把 `01E01` 作为 CLI 路径。

## 6. Tests Required

- 身份测试：合法、空值、非法 `labId` 回退；旧/新标题编号前缀去重。
- 发现测试：三分类目录、旧平铺兼容、README-only/不支持类型过滤、过渡期新旧副本去重、stable ID 唯一性。
- 迁移工具测试：多个旧键合并到稳定键、稳定记录不被覆盖、活动事件只改键不改顺序/其它字段。
- 领域合并测试：代码题历史按 snapshot 去重且保留 latest/best/pass；Quiz 答案按时间和同刻尝试次数选择。
- 每次修改后运行插件全量 `node --experimental-strip-types --test test/*.test.ts`、`tsc -p tsconfig.json --noEmit` 和 `node build.mjs`；若 pnpm 被依赖 build-script approval 拦截，记录该环境限制并直接运行等价脚本。

## 7. Wrong vs Correct

### Wrong

```ts
progress.get(lab.name);
await scoreLab(repoRoot, lab.name);
```

目录改名会让进度断开，且分类目录下 CLI 路径不完整。

### Correct

```ts
progress.get(lab.id);
await scoreLab(repoRoot, lab.relativePath);
```

稳定 ID 管理用户状态，实际相对路径管理仓库资源和判题入口。
