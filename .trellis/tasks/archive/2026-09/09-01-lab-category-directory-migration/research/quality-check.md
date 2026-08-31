# Labs 三分类目录迁移质量检查

检查日期：2026-09-01

## 结构与内容

- [x] 173 个 Lab 均出现在审计映射中，`labId`、旧路径和新路径各自全仓唯一。
- [x] 迁移后仍为 Theory 43、Exercise 122、Project 8；72 篇教材、168 个 manifest、516 道交互题数量不变。
- [x] 暂存区逐文件映射审计确认原有 2384 个 `labs/` 跟踪文件无缺失、无额外复制；另新增 9 个空分类标记。1876 个文件字节完全不变，其余只落在 README、JSON、Makefile 和已审阅的题号引用注释中。
- [x] 13 个现有章节目录均包含 `theory/`、`exercise/`、`project/`；9 个空分类由 `.gitkeep` 保留。
- [x] 不存在章节目录下直接放置的 Lab，也不存在迁移前的旧目录实体。
- [x] 所有 README title/H1、目录编号、分类、`chapter`、`labId` 和 manifest 类型通过内容校验。
- [x] Schema、薄 Makefile、Markdown 链接及 Quiz JSON 中的图片链接均按新目录深度修正。

## 工具与网站

- [x] `lab:new` 为新章节补齐三类目录，按 T/E/P 独立编号，并在第一道题创建后移除对应 `.gitkeep`。
- [x] Lab 扫描器与内容校验会拒绝旧平铺目录、畸形分类目录、缺失分类目录以及 `.gitkeep` 状态漂移。
- [x] CLI 定位、Golden Quiz/Program/Project、Make/CLI 一致性和学生包脱仓运行通过。
- [x] VS Code 插件测试、类型检查和构建通过；新目录可发现，旧本地进度键可迁移到稳定 `labId`。
- [x] `pnpm test` 通过，根路径产物为 72 篇教材、173 个 Lab、25 个课程框架页、301 个 HTML。
- [x] Pages base `/DSA-Mastery/` 的 build、`check:site` 和 Playwright 22 项测试通过。
- [x] 代表性 Theory/Exercise/Project 新地址返回 200，三个旧平铺地址返回 404。
- [x] lint、TypeScript、`git diff --check` 通过；fixture 与 `.lab-cache` 均已清理。

## 说明

Golden 与 Make 一致性检查最初被并行启动，Windows 曾因两进程共同清理同一缓存报告 `EBUSY`。改为顺序执行后两项均通过；这属于本地验证调度竞争，不是产品缺陷。
