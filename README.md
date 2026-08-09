# DSA Mastery

> 把理论、实现、实验与问题训练连成一条完整路径，帮助课程学习者扎实掌握数据结构与算法。

DSA Mastery 是两名学生共同维护、面向课程学习者的数据结构与算法理论与实验教程。它不只帮助读者记住定义或通过几次作业，而是沿着“理解概念 → 推导性质与复杂度 → 独立实现 → 设计测试 → 解决典型问题”的路径，建立能够应对课堂、考试、实验和综合应用的扎实能力。

两名维护者通过写作、实现、复现与交叉 Review 为内容提供持续的质量控制；这是项目的生产方式，不是最终目的。最终发布面向同学和其他读者，希望他们能够把理论理解与实验能力真正结合，在学校的数据结构与算法课程中达到高水平，并为后续算法学习打下可靠基础。

当前是用于团队讨论的 **Demo / MVP**，重点是用第 0、1 章验证这套教程结构是否清楚、实验是否可复现、网站是否适合持续阅读，而不是一次性做完一本教材。

## 希望读者最终做到

- 准确说明核心概念、ADT、表示方法与关键不变量，而不是只背结论。
- 独立推导典型操作和算法的时间、空间复杂度，并说清分析前提。
- 从接口约定出发完成实现，处理正常、边界与错误输入。
- 用测试和小型实验比较不同表示与算法的取舍。
- 把所学方法迁移到课程题目、综合实验和新的问题情境中。

## Demo 已包含

- 第 0 章“绪论”：课程地图、主动输出方法和复杂度入门。
- 第 1 章“线性表”：ADT、顺序表与链表的基础内容。
- 每章两个轻量 Lab，用于把理论结论转化为可运行、可测试的实验能力。
- Markdown 自动渲染的教程网站：章节导航、目录、全文搜索、深色模式、公式、代码复制与前后页跳转等。
- 项目蓝图、两人轮换协作、章节完成标准和更新方法。

## 快速开始

需要 Node.js `>= 22.13.0`。

```bash
npm ci
npm run dev
```

仓库已有 `package-lock.json`，日常检出后优先用 `npm ci` 获得一致依赖；只有主动新增或更新依赖并需要改锁文件时才用 `npm install`。开发服务启动后，打开终端中显示的本地地址。提交改动前请至少运行：

```bash
npm run validate:content
npm run build
npm test
```

`validate:content` 会检查必填字段、章节顺序和 Markdown 相对链接；如需检查代码风格，可运行 `npm run lint`。Windows PowerShell 或终端中直接使用以上 `npm` 命令即可。

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

保存文件后，开发模式会更新页面；正式合并前运行构建和测试即可验证站点。完整步骤、命名规则与检查清单见 [更新工作流](docs/UPDATE_WORKFLOW.md)。

## 仓库导览

```text
dsa-mastery/
├─ app/                         # 教程网站路由、页面与样式
├─ components/                  # 搜索、导航、Markdown 阅读器等界面组件
├─ lib/                         # Markdown 扫描、解析、排序与索引
├─ content/                     # 教材 Markdown（内容单一事实来源）
│  ├─ chapter-00-introduction/
│  └─ chapter-01-linear-list/
├─ labs/                        # 分章节实验说明与后续可运行材料
│  ├─ chapter-00/
│  └─ chapter-01/
├─ public/                      # 网站静态资源
├─ tests/                       # 网站与内容集成测试
├─ docs/
│  ├─ PROJECT_BLUEPRINT.md      # 项目定位、架构、路线图与风险
│  └─ UPDATE_WORKFLOW.md        # 日常新增章节、Lab 与 Review 流程
└─ .github/                     # Issue 与 Pull Request 模板
```

建议从以下入口开始：

- 想读教材：进入 `content/`，或运行网站后在线阅读。
- 想做实验：进入 `labs/`，按 Lab 的目标、步骤和验收清单完成。
- 想参与更新：先读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [更新工作流](docs/UPDATE_WORKFLOW.md)。
- 想理解长期规划：阅读 [项目蓝图](docs/PROJECT_BLUEPRINT.md)。

## Single Source of Truth

```text
content/*.md ───────────────► 教程网站
     │                            │
     ├─ 当前：人工校对 + 自动构建 ┤
     └─ 未来：统一导出流程 ──────► PDF / 全书归档

labs/**/README.md ──────────► Lab 页面与实验入口
labs 中的源码/测试（未来） ─► 可运行结果与质量验证
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

**验证后再做：** 按课程主线补齐章节、综合练习与可运行 Lab，再逐步加入交互可视化、多语言实现、Benchmark、LaTeX/PDF、版本发布与更完整的 CI/CD。先证明内容能够形成真实的读者能力，再增加基础设施。

## 贡献与许可

欢迎通过 Issue 提出勘误、实验建议和章节改进。提交内容前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。项目正式公开前，维护者仍需共同确定内容与代码 License；在 License 明确之前，不应假设仓库内容可以被任意复制或再分发。

引用教材、论文、网页、图片或开源代码时必须标明来源和许可，尽量用自己的结构与语言讲解，不复制受版权保护的正文或图表。详见 [更新工作流中的版权规则](docs/UPDATE_WORKFLOW.md#8-版权引用与-ai-复核)。

---

真正掌握 > 短期记忆，理论与实验并重，正确性 > 更新速度。
