# DSA Mastery

> 把理论、实现、实验与问题训练连成一条完整路径，帮助课程学习者扎实掌握数据结构与算法。

DSA Mastery 是两名学生共同维护、面向课程学习者的数据结构与算法理论与实验教程。它不只帮助读者记住定义或通过几次作业，而是沿着“理解概念 → 推导性质与复杂度 → 独立实现 → 设计测试 → 解决典型问题”的路径，建立能够应对课堂、考试、实验和综合应用的扎实能力。

两名维护者通过写作、实现、复现与交叉 Review 为内容提供持续的质量控制；这是项目的生产方式，不是最终目的。最终发布面向同学和其他读者，希望他们能够把理论理解与实验能力真正结合，在学校的数据结构与算法课程中达到高水平，并为后续算法学习打下可靠基础。

当前是用于团队讨论的 **Demo / MVP**，重点是用第 0、1 章验证这套教程结构是否清楚、实验是否可复现、网站是否适合持续阅读，而不是一次性做完一本教材。

在线课程网站：[https://azenann.github.io/DSA-Mastery/](https://azenann.github.io/DSA-Mastery/)

## 希望读者最终做到

- 准确说明核心概念、ADT、表示方法与关键不变量，而不是只背结论。
- 独立推导典型操作和算法的时间、空间复杂度，并说清分析前提。
- 从接口约定出发完成实现，处理正常、边界与错误输入。
- 用测试和小型实验比较不同表示与算法的取舍。
- 把所学方法迁移到课程题目、综合实验和新的问题情境中。

## Demo 已包含

- 第 0 章“绪论”：数据结构基础概念、算法复杂度与分析方法。
- 第 1 章“线性表”：ADT、顺序表与链表的基础内容。
- 每章两个轻量 Lab，用于把理论结论转化为可运行、可测试的实验能力。
- VitePress 自动渲染的教程网站：章节导航、中文搜索、深色模式、MathJax 公式、代码复制与前后页跳转等。
- 项目蓝图、两人轮换协作、章节完成标准和更新方法。

## 快速开始

需要 Node.js `>= 22.13.0`。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

仓库使用 Corepack 固定的 pnpm `11.1.1`。日常检出后使用 `pnpm install --frozen-lockfile` 获得一致依赖；只有主动新增或更新依赖时才用 `pnpm install`，并提交更新后的 `pnpm-lock.yaml`。开发服务只监听 `127.0.0.1`；启动后打开终端显示的本地地址。提交改动前运行：

```bash
pnpm test
```

`pnpm test` 会串行执行内容校验、Vue/TypeScript 检查、ESLint、临时内容自动发现、VitePress 生产构建和最终产物审计。`validate:content` 会检查必填字段、章节顺序和 Markdown 相对 `.md` 链接。涉及 Pages base、导航或主题时，还需按 [迁移与回滚说明](docs/VITEPRESS_MIGRATION.md#3-本地命令与已验证结果)运行 `pnpm run test:pages`。

做 C++ Lab 时，Windows、Linux 与 macOS 的首选入口是进入题目目录后运行 `make run`；Windows 未安装 GNU Make 时，使用 `pnpm lab:run -- <lab-path>`。环境、三类 Lab 结构、判题器、测试数据和 Review 的完整约定见 [Lab 更新与测试指南](docs/LAB_AUTHORING_GUIDE.md)。

## 内容如何自动更新

教材正文位于 `content/chapter-*/`。网站会扫描这些目录中的 `.md` 文件，并依据 frontmatter 中的 `chapter` 与 `order` 自动排序；URL 由目录和文件名推导，因此新增页面后不需要手工注册路由或修改导航。

最小示例：

```md
---
title: "第 2 章 栈与队列"
description: "理解受限线性结构及其典型应用。"
order: 0
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-09"
contributors: ["你的名字"]
status: "draft"
---

# 第 2 章 栈与队列
```

Lab 位于 `labs/chapter-*/lab-*/README.md`，除上述字段外还需要：

```yaml
lab: true
difficulty: "入门"
duration: "45～60 分钟"
```

正文之间可以直接使用 `./01-page.md` 或跨目录相对 `.md` 链接：内容校验先检查源文件存在，VitePress 构建再改写为 Pages-aware 课程 URL。不要在正文中硬编码 `/DSA-Mastery/`。

保存文件后，开发模式会更新页面；正式合并前运行测试即可验证站点。教材协作见 [更新工作流](docs/UPDATE_WORKFLOW.md)，Quiz、Program、Project 的机器接口与完整模板见 [Lab 更新与测试指南](docs/LAB_AUTHORING_GUIDE.md)。

通过 Review 的改动合并到 `main` 后，GitHub Actions 会自动完成内容检查、网站测试、静态构建与 GitHub Pages 发布。维护者无需提交 `dist/` 等生成目录；发布状态可在仓库的 **Actions** 页面查看。

## 仓库导览

```text
dsa-mastery/
├─ .vitepress/                  # VitePress 配置、内容索引与 Vue 主题
│  ├─ config.ts                # 路由、Markdown、搜索、Pages base
│  ├─ content-index.ts         # 构建期课程索引
│  ├─ content.data.ts          # Vue 数据加载器
│  └─ theme/                   # 默认主题扩展与品牌组件
├─ index.md                     # 品牌首页入口
├─ content/                     # 教材 Markdown（内容单一事实来源）
│  ├─ chapter-00-introduction/
│  └─ chapter-01-linear-list/
├─ labs/                        # 分章节实验说明与后续可运行材料
│  ├─ index.md                 # Lab 目录入口
│  ├─ chapter-00/
│  └─ chapter-01/
├─ public/                      # 网站静态资源
├─ scripts/                     # 内容、自动发现与静态产物检查
├─ tools/lab/                   # 统一 Lab CLI、判题器与共享 Make 规则
├─ schemas/                     # Lab、Quiz、Cases、Task 的 v1 Schema
├─ tests/                       # Pages 最终产物浏览器测试
├─ .trellis/                    # 团队任务、规范与协作工作流
├─ .agents/、.codex/            # Trellis 提供的 Agent/Codex 集成
├─ docs/
│  ├─ PROJECT_BLUEPRINT.md      # 项目定位、架构、路线图与风险
│  ├─ UPDATE_WORKFLOW.md        # 日常新增章节、Lab 与 Review 流程
│  ├─ LAB_AUTHORING_GUIDE.md    # 三类 Lab 的创建、运行、评分与迁移手册
│  ├─ LAB_MIGRATION_TRACKER.md  # README-only Lab 的渐进迁移清单
│  ├─ TRELLIS_ONBOARDING.md     # 团队任务与规范入门
│  ├─ VITEPRESS_MIGRATION.md    # 迁移结果、已知风险与回滚
│  └─ CLEANUP_REPORT.md         # 旧栈删除证据与恢复边界
└─ .github/                     # 协作模板与 GitHub Pages 自动发布
```

建议从以下入口开始：

- 想读教材：访问[在线课程网站](https://azenann.github.io/DSA-Mastery/)，或进入 `content/` 阅读 Markdown。
- 想做实验：进入 `labs/`，按 Lab 的目标、步骤和验收清单完成。
- 想参与更新：先读 [CONTRIBUTING.md](CONTRIBUTING.md)、[更新工作流](docs/UPDATE_WORKFLOW.md) 和 [Trellis 协作入门](docs/TRELLIS_ONBOARDING.md)。
- 想新增或迁移 Lab：按 [Lab 更新与测试指南](docs/LAB_AUTHORING_GUIDE.md) 使用统一 Schema、脚手架、Make 与评分工作流。
- 想理解长期规划：阅读 [项目蓝图](docs/PROJECT_BLUEPRINT.md)。
- 想了解站点架构、Pages 验证或回滚：阅读 [VitePress 迁移说明](docs/VITEPRESS_MIGRATION.md)。

## Single Source of Truth

```text
content/chapter-*/*.md ─────► 教程网站
     │                            │
     ├─ 当前：人工校对 + 自动构建 ┤
     └─ 未来：统一导出流程 ──────► PDF / 全书归档

labs/**/README.md ──────────► Lab 页面与实验入口
labs 中的 manifest/源码/测试 ─► 统一 CLI、Make、评分与质量验证
```

原则很简单：

- 教材内容只改 Markdown，不直接修改构建产物。
- 网站代码负责“如何展示”，Markdown 负责“讲什么”。
- 完整实现、测试和基准测试留在 Lab/代码目录，正文只保留关键片段与解释。
- PDF 与 LaTeX 暂不纳入 Demo；以后如引入，应从 Markdown 自动生成，避免双份维护。

## 协作方式

两位核心维护者按章轮换：一章由 A 担任 Chapter Owner、B 担任 Review Owner，下一章交换。Owner 负责把理论、示例和 Lab 串成完整学习体验；Reviewer 必须亲自复现、测试并审阅正确性。作者不能在没有另一人批准时自行合并。

我们只保留 `main` 与短生命周期分支，MVP 阶段不增加长期 `dev` 分支。示例：

```text
chapter/02-stack-queue
lab/02-stack-simulator
fix/linear-list-complexity
```

## 质量底线

每个章节进入 `main` 前需要满足：读者成果明确、目标与术语清楚、关键结论和复杂度经人工核验、示例或 Lab 可复现、练习能够检查理解、引用可追溯、网站构建与测试通过、另一名成员完成 Review。AI 可以起草、找反例和辅助检查，但不能替代知识正确性、版权与最终合并决定的人工确认。

## 现在与以后

**MVP 现在做：** 两章 Markdown、基础网站、少量 Lab、稳定的新增内容规则、轻量 Review。

**验证后再做：** 按课程主线补齐章节、综合练习与可运行 Lab，再逐步加入交互可视化、多语言实现、Benchmark、LaTeX/PDF、版本发布与更完整的质量门禁和预览流程。先证明内容能够形成真实的读者能力，再增加基础设施。

## 贡献与许可

欢迎通过 Issue 提出勘误、实验建议和章节改进。提交内容前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。仓库目前公开可见，但尚未添加明确的内容与代码 License；公开可见不等于获得复制、修改或再分发授权。维护者应尽快共同确定许可方案，在此之前请先取得作者明确许可。

引用教材、论文、网页、图片或开源代码时必须标明来源和许可，尽量用自己的结构与语言讲解，不复制受版权保护的正文或图表。详见 [更新工作流中的版权规则](docs/UPDATE_WORKFLOW.md#8-版权引用与-ai-复核)。

---

真正掌握 > 短期记忆，理论与实验并重，正确性 > 更新速度。
