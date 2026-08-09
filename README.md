# DSA Lab

> 用“学习 → 解释 → 实现 → 测试 → 复盘”共同写成一套可持续更新的数据结构与算法开源教材。

DSA Lab 是一个由学生长期维护的主动输出式学习项目。Markdown 是教材内容的单一事实来源：新增或修改正文后，网站会自动发现并生成导航与页面；可运行的实验材料独立放在 `labs/`，避免把教材、代码和交互演示混在一起。

当前是用于团队讨论的 **Demo / MVP**，重点是验证内容组织、网站阅读和两人协作流程，而不是一次性做完一本教材。

## Demo 已包含

- 第 0 章“绪论”：课程地图、主动输出方法和复杂度入门。
- 第 1 章“线性表”：ADT、顺序表与链表的基础内容。
- 每章两个轻量 Lab，用于验证“理解—动手—复盘”的学习闭环。
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
dsa-lab/
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

每个章节进入 `main` 前需要满足：目标与术语清楚、关键结论和复杂度经人工核验、示例或 Lab 可复现、引用可追溯、网站构建与测试通过、另一名成员完成 Review。AI 可以起草、找反例和辅助检查，但不能替代知识正确性、版权与最终合并决定的人工确认。

## 现在与以后

**MVP 现在做：** 两章 Markdown、基础网站、少量 Lab、稳定的新增内容规则、轻量 Review。

**验证后再做：** 复杂交互可视化、完整多语言实现、Benchmark、LaTeX/PDF、版本发布与更完整的 CI/CD。先证明团队能连续更新，再增加基础设施。

## 贡献与许可

欢迎通过 Issue 提出勘误、实验建议和章节改进。提交内容前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。项目正式公开前，维护者仍需共同确定内容与代码 License；在 License 明确之前，不应假设仓库内容可以被任意复制或再分发。

引用教材、论文、网页、图片或开源代码时必须标明来源和许可，尽量用自己的结构与语言讲解，不复制受版权保护的正文或图表。详见 [更新工作流中的版权规则](docs/UPDATE_WORKFLOW.md#8-版权引用与-ai-复核)。

---

学习价值 > Star，正确性 > 更新速度，可维护性 > 技术炫技。
