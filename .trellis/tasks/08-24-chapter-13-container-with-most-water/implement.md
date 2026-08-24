# 第 13 章“盛最多水的容器”实施计划

## 目标

在分支 `codex/chapter-13-container-with-most-water` 上新增一个 C++17 标准输入输出 Program Lab，并接入第 13 章的统一 ContentIndex。完整执行步骤与代码合同见仓库计划文件：

[`docs/superpowers/plans/2026-08-24-chapter-13-container-with-most-water.md`](../../../docs/superpowers/plans/2026-08-24-chapter-13-container-with-most-water.md)

## 执行顺序

### 1. 创建 Lab 骨架与图片

- [ ] 运行 `pnpm lab:new -- --type program --chapter 13 --order 1 --slug container-with-most-water`。
- [ ] 将用户提供的 801×383 PNG 复制为 `labs/chapter-13/lab-13-01-container-with-most-water/assets/container-with-most-water.png`。
- [ ] 确认 Lab 目录中没有 `/var/folders`、Downloads 源文件或无关生成物。

### 2. 完成 Program 合同

- [ ] 将 `lab.json` 设置为 schema v1、`type: "program"`、C++17、student/solution targets、stdio tokens judge。
- [ ] 保留三行薄 Makefile，不添加私有编译或判题逻辑。
- [ ] 写入可编译但输出固定 `0` 的 student starter，确保它不是完整答案。
- [ ] 写入使用 `long long`、相向双指针、O(n) 时间和 O(1) 辅助空间的 solution。
- [ ] 写入七个测试用例：官方样例、最小数组、全零、两端等高、递增数组、局部高点和大数值；分值必须为 20/10/10/15/15/15/15，总计 100。
- [ ] README 使用 `Lab 13-01：盛最多水的容器` 标题与完整 frontmatter，包含题面、图片、输入输出、约束、贪心说明、复杂度、运行命令、完成清单和思考题。

### 3. 接入第 13 章

- [ ] 在 `content/chapter-13-greedy/00-overview.md` 增加 Lab 13-01 的相对链接。
- [ ] 在 `.vitepress/content-index.ts` 的第 13 章定义加入 `autoLabChapter: 13`。
- [ ] 不新增手工 `labSources`，让 manifest 和统一 ContentIndex 派生 Lab 分类与导航。

### 4. 专项验证

- [ ] `pnpm lab:validate -- labs/chapter-13/lab-13-01-container-with-most-water --no-color`
- [ ] `pnpm lab:build -- labs/chapter-13/lab-13-01-container-with-most-water --target student --no-color`
- [ ] `pnpm lab:build -- labs/chapter-13/lab-13-01-container-with-most-water --target solution --no-color`
- [ ] `pnpm lab:run -- labs/chapter-13/lab-13-01-container-with-most-water --target solution --no-color`
- [ ] `pnpm lab:verify -- labs/chapter-13/lab-13-01-container-with-most-water --no-color`

预期：七个测试全部通过，solution 为 `100/100`，student 可编译但不满分。

### 5. 仓库质量验证

- [ ] `pnpm run validate:content`
- [ ] `pnpm run typecheck`
- [ ] `pnpm run lint`
- [ ] `pnpm run test:discovery`
- [ ] `pnpm run build`
- [ ] `pnpm run check:site`
- [ ] 环境具备 Playwright 浏览器时运行 `pnpm run test:pages`，检查第 13 章入口、Lab 页面、图片和控制台/网络错误。

### 6. 交付

- [ ] `git diff --check` 通过，确认没有缓存、dist、截图、trace 或临时源文件。
- [ ] 提交产品变更：`feat(ch13): add container with most water lab`。
- [ ] 向用户报告分支、commit、变更文件和验证结果；不推送、不创建远程 PR。

## 风险与回滚点

- 图片相对路径若无法构建，只调整同 Lab `assets/` 引用，不迁移到全局公共目录。
- 第 13 章自动收录若触发既有导航问题，暂时移除 `autoLabChapter: 13` 作为独立回滚点；不改写其他章节或组件。
- `.lab-cache/`、`dist/pages/` 和 VitePress 临时目录只能由工具生成，不进入提交。
