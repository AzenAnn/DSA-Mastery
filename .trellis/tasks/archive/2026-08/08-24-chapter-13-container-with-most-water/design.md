# 技术设计：第 13 章“盛最多水的容器” Program Lab

## 1. 设计目标与边界

新增一个独立的标准输入输出 Program Lab，作为第 13 章贪心算法的第一个可执行练习。实现复用仓库现有的 Lab v1 manifest、C++17 编译、统一判题器、ContentIndex 和 VitePress 默认导航能力。

本次改动只涉及：

- 新建 `labs/chapter-13/lab-13-01-container-with-most-water/` 及其题面、图片、学生代码、参考代码和测试；
- 在第 13 章总览页增加配套 Lab 链接；
- 在 `.vitepress/content-index.ts` 为第 13 章启用 `autoLabChapter: 13`。

不新增 Vue 组件、不修改判题器、不改变全局样式、不改动其他章节或既有 Lab。

## 2. 目录与数据流

```text
README.md + lab.json
        │
        ├─ ContentIndex 扫描 README
        │    ├─ lab.json.type=program → labCategory=exercise
        │    ├─ chapter=13 → 第 13 章 autoLabChapter 自动收录
        │    └─ 生成 Labs 首页、章节入口、侧栏和搜索数据
        │
        └─ tools/lab/core.mjs 加载 manifest
             ├─ student/main.cpp → 学习者目标
             ├─ solution/main.cpp → 参考目标
             └─ tests/cases.json + tests/*.in/*.out → stdio 判题
```

Lab 内图片使用 Markdown 相对路径 `./assets/container-with-most-water.png`。图片作为 Lab 源文件的一部分进入构建，不引用 `/var/folders` 临时路径或外部图片 URL。

## 3. Lab 机器合同

### 3.1 Frontmatter

README 使用当前章节与 Lab 合同：

- `title`: `Lab 13-01：盛最多水的容器`；
- `order`: `1`，`chapter`: `13`，`chapterTitle`: `贪心算法`；
- `updated`: 实现当天日期；`contributors`: `['Shuoyuchen']`；`status`: `draft`；
- `lab: true`、`difficulty` 和 `duration` 非空。

### 3.2 Manifest

`lab.json` 使用 `schemaVersion: 1`、`type: "program"`、`language: "cpp"`，工具链为 C++17，targets 指向：

- `student/main.cpp`；
- `solution/main.cpp`。

判题采用 `judge.kind: "stdio"`，读取 `tests/cases.json`，整数输出使用 `tokens` 比较，保留统一的时间和输出上限。Lab 内 Makefile 只使用仓库规定的三行薄模板。

### 3.3 标准输入输出

- 第一行输入 `n`；
- 第二行输入 `n` 个非负整数 `height[i]`；
- 输出一个整数，表示最大容水量。

参考实现使用相向双指针：每轮计算当前面积，移动高度较小的一侧；当两侧等高时移动任意一侧，本实现固定移动右侧以保持分支确定。面积和答案使用 `long long` 计算，避免实现细节限制题意。

### 3.4 测试分层

测试用例分值合计 100，覆盖：

1. 官方样例 `[1,8,6,2,5,4,8,3,7]`；
2. 最小长度 `[1,1]`；
3. 全零数组；
4. 两端等高 `[4,3,2,1,4]`；
5. 单调递增数组；
6. 中间局部高点 `[2,3,4,5,18,17,6]`；
7. 较大高度与宽度，验证整数范围和非暴力实现的基本边界。

README 的样例、边界说明和测试 tags 与这些用例保持一致。参考输出先由 solution 生成并人工检查，再通过 `refresh-expected --write` 写入，避免手工 oracle 漂移。

## 4. 教材与导航接入

在 `content/chapter-13-greedy/00-overview.md` 增加“配套 Lab”小节，链接到 Lab 的 README 源路径，供 Markdown 校验和 VitePress transform 改写为站内路由。

在 `.vitepress/content-index.ts` 的 `chapter-13-greedy` 定义中加入 `autoLabChapter: 13`。这样 Lab 不需要手工写入 `labSources`，由统一扫描器自动提供给：

- 第 13 章课程入口；
- Labs 总览页；
- 教材和 Lab 侧栏；
- ContentIndex 消费者与搜索索引。

这是向第 13 章开放自动 Lab 集合，不会复制题目清单，也不会影响没有第 13 章 Lab 的其他章节。

## 5. 内容与图片策略

README 以课程题面为主，保留 LeetCode 题名、题号和公开题源链接；不带入爬取时间、API 查询过程、用户 Downloads 路径或多语言函数签名作为机器接口。算法说明解释“移动短板”的安全性，但不把 `solution/main.cpp` 的完整代码复制到 README。

用户提供的 801×383 图片复制到 Lab 的 `assets/` 目录，并使用描述性 alt 文本。图片仅作为题面示意，不作为判题输入或运行时依赖；如果构建检查发现页面相对资源路径不兼容，将优先改为 VitePress 可解析的同 Lab 相对路径，不迁移到全局 `public/`。

## 6. 验证、兼容与回滚

实现后按以下顺序验证：

1. `pnpm lab:validate -- <lab>`；
2. `pnpm lab:build -- <lab> --target student` 与 `--target solution`；
3. `pnpm lab:run -- <lab> --target solution`、`pnpm lab:verify -- <lab>`；
4. `pnpm run validate:content`、`pnpm run typecheck`、`pnpm run lint`；
5. `pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site`；
6. 环境允许时运行 `pnpm run test:pages`，检查第 13 章入口、Lab 链接、图片和无控制台/网络错误。

兼容性依赖现有 `content`/`labs` rewrite 和 `CourseIndex`，不新增旧 URL 重定向。若自动收录或图片构建出现问题，回滚点分别是删除 `autoLabChapter: 13`（Lab 仍可保留在全局索引）和修正同 Lab 图片路径；不会修改既有章节正文或全局组件。

## 7. 分支交付

实现分支为 `codex/chapter-13-container-with-most-water`，基于本地 `main` 创建。只提交本任务相关的 Lab、章节入口、ContentIndex 和 Trellis 规划产物；不推送、不创建远程 PR，除非用户后续明确要求。
