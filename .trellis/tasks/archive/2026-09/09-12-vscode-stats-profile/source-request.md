可以。下面这份你可以直接复制给 Codex / Claude Code / GPT，让它基于现有插件代码实现。我的目标是把它写成**产品需求 + UI 规范 + 实现约束 + 验收标准**，尽量避免 AI 自己乱发挥。

````md
# DSA-Mastery VS Code 插件「做题统计页」UI/UX 重构任务

## 0. 任务背景

当前 DSA-Mastery VS Code 插件已经拥有「做题统计」页面，现有功能包括：

- 总提交次数
- 总通过次数
- 提交过的题目数
- 通过的题目数
- 年度活动热力图
- 累计通过趋势折线图
- 各章节完成进度

当前功能基本完整，本次任务 **不重构底层统计逻辑，不改变已有数据来源和数据持久化方式**，主要完成：

1. 做题统计页整体视觉重构
2. 新增基于过题数的 Rank / Title 等级体系
3. 优化统计信息层级
4. 优化活动热力图
5. 优化累计通过趋势图
6. 重构章节进度展示
7. 做好 VS Code WebView 不同尺寸下的响应式适配

目标不是制作传统 BI Dashboard，而是让页面更接近：

> **VS Code Native × Linear × GitHub Contribution Graph**

整体风格要求：

- Developer Tool
- 简洁
- 克制
- 高信息密度
- 暗色优先
- 有算法社区气质
- 不要游戏化过度
- 不要花哨渐变、大量阴影、玻璃拟态
- 不要做成普通后台管理系统

---

# 1. Rank / Title 等级系统

## 1.1 核心原则

新增一个类似 Codeforces Rank 的称号体系。

### Rank 只由「已通过的不同题目数 solvedCount」决定。

不要根据：

- submissions
- accepted submissions
- acceptance rate
- 连续签到

决定主等级。

原因：

重复 WA 不应该帮助用户升级。

例如：

```text
用户 A：
30 solved
40 submissions

用户 B：
30 solved
180 submissions
````

两人的 Rank 都必须相同。

---

# 2. Rank 等级划分

使用以下固定等级：

| solvedCount | Rank             | 中文辅助含义 | 颜色             |
| ----------: | ---------------- | ------ | -------------- |
|         0–9 | Trainee          | 训练者    | Gray           |
|       10–29 | Pupil            | 学徒     | Green          |
|       30–59 | Specialist       | 专精者    | Cyan           |
|       60–99 | Expert           | 专家     | Blue           |
|     100–149 | Candidate Master | 候选大师   | Violet         |
|     150–199 | Master           | 大师     | Orange         |
|     200–249 | Grandmaster      | 宗师     | Red            |
|        ≥250 | Legendary        | 传奇     | Deep Red / Red |

建议颜色：

```css
--rank-trainee: #9CA3AF;
--rank-pupil: #22C55E;
--rank-specialist: #06B6D4;
--rank-expert: #3B82F6;
--rank-candidate-master: #A855F7;
--rank-master: #F97316;
--rank-grandmaster: #EF4444;
--rank-legendary: #EF4444;
```

Legendary 可以稍微做出特殊视觉差异，但不要浮夸。

例如：

```text
Legendary
```

可以采用双色文字：

```css
.legendary-prefix {
    color: #991B1B;
}

.legendary-rest {
    color: #EF4444;
}
```

因为当前是 Dark Theme，不要直接照搬 Codeforces 白底下的黑色首字母，否则可能看不清。

---

# 3. Rank 数据结构

建议不要把判断逻辑散落在组件内部。

统一定义 Rank 配置：

```ts
interface RankInfo {
  name: string
  zhName: string
  minSolved: number
  maxSolved?: number
  color: string
}
```

例如：

```ts
const RANKS: RankInfo[] = [
  {
    name: 'Trainee',
    zhName: '训练者',
    minSolved: 0,
    maxSolved: 9,
    color: '#9CA3AF',
  },
  {
    name: 'Pupil',
    zhName: '学徒',
    minSolved: 10,
    maxSolved: 29,
    color: '#22C55E',
  },

  ...
]
```

另外实现统一函数：

```ts
getRankBySolvedCount(solvedCount)
getNextRank(currentRank)
getRankProgress(solvedCount)
```

不要在 JSX / Vue template 中大量 hardcode if-else。

---

# 4. Rank 进度计算

如果当前：

```text
solved = 14
```

那么：

```text
Current Rank:
Pupil

Current Rank Range:
10–29

Next Rank:
Specialist

Next threshold:
30
```

页面应该显示：

```text
Pupil

14 solved · 58 submissions

████████░░░░░░░░░░░

16 problems to Specialist
```

注意：

进度条应该表示：

> 当前 Rank 内，从本等级起点到下一等级门槛的进度

例如 Pupil：

```text
10 → 30
```

14 solved：

```ts
progress = (14 - 10) / (30 - 10)
```

而不是：

```ts
14 / 30
```

这样 Rank Progress 更合理。

但 UI 文本可以继续显示：

```text
14 / 30
```

便于理解。

Legendary 已是最高等级时：

不要显示：

```text
0 problems to next rank
```

而显示：

```text
Highest rank reached
```

或者：

```text
MAX RANK
```

---

# 5. Rank UI

Rank 不要设计成 RPG 徽章墙。

不要：

* 皇冠
* 火焰
* 大量粒子
* 金色外发光
* 巨大的 Lv.7
* 游戏卡牌风

应该像 Codeforces / Developer Profile。

建议在页面 Header 区域增加：

```text
PROGRESS OVERVIEW

做题统计
提交、通过与章节完成度的汇总

CURRENT RANK

Pupil
14 solved · 58 submissions

██████████░░░░░░░░░

16 problems to Specialist
```

其中：

```text
Pupil
```

使用 Rank 对应颜色。

不要显示：

```text
Lv.2 Pupil
```

Title 本身就是等级。

---

# 6. Rank Up 提示

如果现有架构能够可靠检测：

```text
beforeSolvedCount
afterSolvedCount
```

并确认跨越 Rank 阈值，可以增加一个非常克制的 Toast：

```text
RANK UP

Pupil → Specialist
```

持续约：

```text
2–3 seconds
```

不要做复杂动画。

建议：

* opacity
* translateY
* 极轻微 scale

即可。

如果当前代码无法稳定判断升级事件，则本轮不强制实现 Toast。

不要为了 Toast 修改大量底层架构。

---

# 7. 页面整体设计方向

视觉参考：

```text
VS Code Native
+
Linear
+
GitHub Contribution Graph
```

关键词：

```text
dense
clean
developer-oriented
subtle
dark
precise
```

避免：

```text
Ant Design Dashboard
Admin Panel
Gaming UI
Glassmorphism
Neon Cyberpunk
```

---

# 8. 全局颜色系统

目前页面存在：

* 灰绿色背景
* 棕色热力图
* 蓝色折线

视觉系统不统一。

重新定义页面 Design Tokens。

建议：

```css
--bg: #18191B;

--surface-1: #1E2023;
--surface-2: #232529;
--surface-hover: #272A2E;

--border-subtle: rgba(255,255,255,0.06);
--border-hover: rgba(255,255,255,0.11);

--text-primary: rgba(255,255,255,0.92);
--text-secondary: rgba(255,255,255,0.62);
--text-tertiary: rgba(255,255,255,0.38);

--accent: #4F9CFF;
--accent-soft: rgba(79,156,255,0.12);
```

如果插件当前已经读取 VS Code CSS variables：

优先尽可能继承 VS Code Theme，例如：

```css
var(--vscode-editor-background)
var(--vscode-editor-foreground)
var(--vscode-panel-border)
```

不要破坏其他 VS Code Theme。

可以采用：

```text
VS Code variables
+
DSA-Mastery fallback tokens
```

的方式。

---

# 9. 页面宽度与布局

当前在宽屏中内容拉得过宽。

增加内容最大宽度：

```css
.dashboard {
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    padding: 40px 40px 72px;
}
```

建议：

```text
Desktop:
max-width ≈ 1280–1400px

普通窗口:
padding 24px

较窄 WebView:
padding 16px
```

不要让章节 Progress Bar 横跨接近整个 2K 屏幕。

---

# 10. Typography

保留当前：

```text
PROGRESS OVERVIEW
ACTIVITY
MOMENTUM
CURRICULUM
```

这类英文 Micro Label。

它很符合 Developer Tool 气质。

统一：

```css
.section-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-tertiary);
}
```

页面主标题：

```css
.page-title {
    font-size: 28px;
    font-weight: 650;
    letter-spacing: -0.02em;
}
```

说明文字：

```css
.page-description {
    font-size: 13px;
    color: var(--text-secondary);
}
```

避免过多字号。

建议整个页面只保留大约：

```text
10
12
13
16
20
28
32
```

几个字号级别。

---

# 11. 减少「框感」

现在几乎所有区域都有：

```text
border
+
border-radius
```

导致页面很像传统 Dashboard。

调整原则：

### KPI 卡片

保留轻微 Surface。

### Heatmap / Trend / Curriculum

可以保留大区域 Surface，但弱化：

```css
border: 1px solid rgba(255,255,255,.05);
```

或者部分区域直接通过 spacing 分隔。

不要每个小元素继续嵌套边框。

减少：

```text
框
  框
    框
```

---

# 12. 顶部统计卡片重构

当前四张卡：

```text
58
提交次数

18
通过次数

19
提交过的题目

14
通过的题目
```

保留四项数据，但视觉优化。

建议结构：

```text
58
提交次数
```

数字：

```css
font-size: 30–34px;
font-weight: 650;
```

Label：

```css
font-size: 12px;
color: var(--text-secondary);
```

卡片：

```css
background: rgba(255,255,255,.018);
border: 1px solid var(--border-subtle);
border-radius: 10px;
```

Hover：

```css
transform: translateY(-1px);
border-color: var(--border-hover);
```

动画时间：

```text
120–180ms
```

不要做：

```text
box-shadow: 0 20px 50px ...
```

---

# 13. 建议调整统计语义

如果数据含义允许，顶部四项名称尽量明确区分：

```text
提交次数
通过次数
尝试题目
已解决题目
```

或者：

```text
Submissions
Accepted
Attempted
Solved
```

避免：

```text
通过次数
通过的题目
```

视觉上过于接近、用户需要思考区别。

---

# 14. 活动热力图 Activity Heatmap

这一部分是整个页面的重要视觉元素。

继续采用 GitHub Contribution Graph 风格。

当前棕色梯度替换为统一 Accent 色阶。

建议：

```css
--heat-0: #2A2C30;
--heat-1: #173B5C;
--heat-2: #1E5B8E;
--heat-3: #267BC0;
--heat-4: #4FA3FF;
```

或者根据当前主题动态推导 Accent。

重点：

```text
0 次 = 中性灰
低活跃 = 深色 accent
高活跃 = 明亮 accent
```

不要使用：

```text
灰 → 棕 → 橙
```

---

# 15. Heatmap Today 状态

当天 Cell 可以增加：

```css
outline: 1px solid rgba(255,255,255,.35);
outline-offset: 1px;
```

非常克制即可。

不要用大圆圈。

---

# 16. Heatmap Tooltip

Hover 日期 Cell 显示：

```text
2026-09-12

提交 8 次
通过 5 次
解决 3 题
```

具体根据现有数据能力展示。

如果只能得到 submissions，则只展示已有数据。

禁止为了 UI 虚构统计。

---

# 17. Heatmap 控件

保留：

```text
提交次数 / 通过次数
年份选择
```

但控制按钮视觉降低存在感。

不要比 Heatmap 本身抢眼。

建议使用：

```text
Segmented Control
```

尺寸紧凑。

---

# 18. 累计通过趋势图

当前折线图区块过高，而数据点较少。

压缩高度。

建议：

```text
desktop:
220–250px

small window:
180–220px
```

不要再占 350px+。

---

# 19. Trend Chart 视觉

使用 Accent：

```text
line:
2px

points:
4–5px

area fill:
约 5%–10% opacity
```

Area Gradient：

```text
Accent 10%
↓
transparent
```

避免大面积蓝色色块。

Grid：

```text
极弱
```

例如：

```css
rgba(255,255,255,.06)
```

坐标轴文字：

```text
text-tertiary
```

---

# 20. Trend Chart 空状态 / 少量数据

如果数据点只有：

```text
0
1
```

不要渲染一张巨大的空折线图。

提供合理 Empty State：

```text
完成更多题目后，这里会显示你的成长趋势。
```

风格克制。

---

# 21. Curriculum 章节进度区域必须重点重构

当前问题：

```text
章节名称          ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 14/22
```

在宽屏下 Progress Bar 太长，信息密度低。

重构为真正的 Progress List。

---

# 22. Curriculum 推荐布局

桌面宽度足够时：

```text
2 columns
```

例如：

```text
01 线性表                         64%
████████████████░░░░░░░░
14 / 22


02 栈与队列                        0%
░░░░░░░░░░░░░░░░░░░░░░
0 / 12
```

形成：

```text
┌─────────────────┐ ┌─────────────────┐
│ Chapter 01      │ │ Chapter 02      │
│ 线性表      64% │ │ 栈与队列     0% │
│ ███████░░░      │ │ ░░░░░░░░░░      │
│ 14 / 22         │ │ 0 / 12          │
└─────────────────┘ └─────────────────┘
```

但不要真的给每个章节画明显 Card Border。

更推荐：

```text
Grid
+
spacing
+
非常弱的 separator
```

---

# 23. Curriculum Responsive

建议：

```css
.curriculum-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

较窄时：

```css
@media (...) {
    grid-template-columns: 1fr;
}
```

具体 breakpoint 根据 VS Code WebView 实际测试确定，不要机械按照浏览器 768px。

---

# 24. Chapter Progress Bar

高度：

```text
5–6px
```

而不是粗大 Progress Bar。

背景：

```text
surface / neutral gray
```

完成部分：

```text
accent
```

建议：

```css
height: 6px;
border-radius: 999px;
```

100% 完成章节可以增加极轻微状态区别，例如：

```text
✓
```

但不要大面积绿色。

---

# 25. Chapter 信息层级

每项显示：

```text
01
线性表

14 / 22                       64%
████████████████░░░░
```

其中：

章节编号：

```text
tertiary
```

章节名：

```text
primary
```

数量：

```text
secondary
```

百分比：

```text
secondary / accent
```

---

# 26. 整体推荐页面结构

最终结构：

```text
PROGRESS OVERVIEW
做题统计
提交、通过与章节完成度的汇总


CURRENT RANK

Pupil
14 solved · 58 submissions

██████████░░░░░░░░░

16 problems to Specialist


┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 58       │ │ 18       │ │ 19       │ │ 14       │
│ 提交次数 │ │ 通过次数 │ │ 尝试题目 │ │ 已解决   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘


ACTIVITY
活动热图

□ □ □ □ □ □ ■ ■ □ ...
□ □ □ □ □ ■ ■ ■ □ ...
□ □ □ □ □ □ ■ □ □ ...


MOMENTUM
累计通过趋势

18 ┤                           ●
   │                    ●──────
14 ┤             ●──────
   │
 9 ┤       ●────
   │
 0 ┤ ●──────────────────────────
     08/28                  09/03


CURRICULUM
章节进度

01 线性表                        64%
██████████████░░░░░░
14 / 22

02 栈与队列                       0%
░░░░░░░░░░░░░░░░░░░░
0 / 12
```

---

# 27. Spacing System

尽量采用固定 spacing scale。

例如：

```text
4
8
12
16
20
24
32
40
48
64
```

不要随机出现：

```text
17px
23px
37px
```

建议：

```text
页面 Section 间距：32–40px
Section Header → Content：16px
组件内部：12–16px
```

---

# 28. Border Radius

统一：

```text
Large Surface:
10–12px

Small Control:
6–8px

Progress:
999px
```

不要不同地方随机：

```text
7
9
14
18
```

---

# 29. Animation

只允许轻量动画：

```text
hover
120–180ms

rank progress
200–300ms

toast
200ms
```

只使用：

```text
opacity
transform
color
border-color
```

尽量避免复杂 layout animation。

---

# 30. Accessibility

必须保证：

* Rank 不只靠颜色表达
* Hover 信息可读
* Dark Theme 对比度足够
* 不使用过暗的正文
* 不要因为 Accent 改色导致文字不可读

Title 一定包含文字：

```text
Expert
```

而不是只显示一个蓝色标记。

---

# 31. VS Code Theme Compatibility

这是 VS Code 插件 WebView，不是独立网站。

必须检查：

```text
Dark Theme
Light Theme
High Contrast（如果现有架构支持）
```

优先使用：

```text
--vscode-*
```

CSS Variables。

禁止为了追求截图效果：

```css
body {
  background: #18191b !important;
}
```

导致用户切换 VS Code Theme 后页面风格割裂。

如果现有页面已经是强制 Dark Theme，则保持现有架构，不扩大本次任务范围。

---

# 32. 不要修改的内容

除非实现 UI 必须，否则不要修改：

* 题目提交逻辑
* Test Case 运行逻辑
* Judge 逻辑
* 文件扫描逻辑
* 章节识别逻辑
* 数据持久化格式
* 题目完成判断逻辑
* VS Code Extension Activation
* command 注册

本次主要修改：

```text
statistics / progress WebView
UI components
styles
charts
rank calculation
```

---

# 33. 不要添加以下内容

本轮不要自行扩展：

* 签到系统
* 积分商城
* 每日任务
* 经验值 XP
* Lv.1 / Lv.2 / Lv.3
* RPG 图标
* 成就墙
* 隐藏成就
* 排行榜
* 好友系统
* 云同步
* 新的数据采集体系

这些都超出本次范围。

---

# 34. 组件拆分建议

根据项目当前技术栈适配，不要为了拆组件而大规模重构。

如果当前结构允许，建议拆为：

```text
ProgressDashboard
├── DashboardHeader
├── RankOverview
├── StatsGrid
│   └── StatCard
├── ActivityHeatmap
├── MomentumChart
└── CurriculumProgress
    └── ChapterProgressItem
```

Rank 逻辑单独：

```text
rank.ts
```

例如：

```text
constants/
  ranks.ts

utils/
  rank.ts
```

但必须优先遵守仓库已有目录规范。

---

# 35. 实现前要求

先阅读当前项目代码。

找到：

1. 统计页面入口
2. 当前统计数据结构
3. WebView 框架
4. 图表库
5. Heatmap 实现
6. CSS / theme 架构
7. Chapter Progress 数据来源

不要在没有阅读现有实现的情况下直接重写页面。

优先：

```text
复用现有组件
复用现有 Chart Library
复用现有统计逻辑
```

---

# 36. 禁止为了“美观”替换技术栈

例如项目当前已经使用：

```text
ECharts
```

就不要自行换：

```text
Recharts
```

项目当前使用：

```text
Vue
```

不要重写 React。

项目当前是原生 DOM：

不要为了这个页面引入一个大型前端框架。

---

# 37. 验收场景

至少测试：

### Scenario A

```text
solved = 0
```

应显示：

```text
Trainee
```

---

### Scenario B

```text
solved = 9
```

仍然：

```text
Trainee
```

---

### Scenario C

```text
solved = 10
```

变成：

```text
Pupil
```

---

### Scenario D

```text
solved = 29
```

仍为：

```text
Pupil
```

---

### Scenario E

```text
solved = 30
```

变成：

```text
Specialist
```

---

### Scenario F

依次验证边界：

```text
60
100
150
200
250
```

对应：

```text
Expert
Candidate Master
Master
Grandmaster
Legendary
```

---

### Scenario G

```text
solved >= 250
```

Rank 永远：

```text
Legendary
```

并显示：

```text
MAX RANK
```

不能出现不存在的 Next Rank。

---

# 38. Rank Progress 边界测试

例如：

```text
10 solved
```

Pupil Rank Progress 应为：

```text
0%
```

因为刚进入 Pupil。

```text
20 solved
```

Pupil：

```text
50%
```

```text
29 solved
```

接近：

```text
95%
```

```text
30 solved
```

进入 Specialist：

```text
0%
```

注意：

不要因为重新进入新 Rank 导致 UI 视觉 Bug。

---

# 39. 页面视觉验收

最终页面应该满足：

### 第一眼

能快速看到：

```text
当前 Rank
Solved 数量
最近活跃度
学习增长趋势
章节完成情况
```

### 5 秒内

用户能够判断：

```text
我现在是什么水平？
距离下一 Rank 还有多少？
最近有没有在刷题？
哪几个章节完成度最高？
```

---

# 40. 页面视觉禁止项

最终效果不要出现：

* 大面积 Glow
* Neon
* 多色 Gradient
* 3D Card
* 强阴影
* 玻璃拟态
* 巨型圆角
* Emoji 滥用
* 游戏 HUD
* 过度动效
* 每个区域一个完全不同的 Accent Color
* 过大的空白图表
* 极长章节进度条
* 过多框线

---

# 41. 最终目标

重构前：

> 一个功能完整的做题数据 Dashboard。

重构后：

> 一个真正属于 DSA-Mastery 的算法训练 Progress Profile。

用户看到页面时应该产生：

```text
“我已经是 Specialist 了。”
“再做 7 题就能到 Expert。”
“这周刷题明显比上周多。”
“线性表快完成了，接下来该推进树。”
```

而不是：

```text
“这里有几个统计数字。”
```

---

# 42. 开发流程要求

请按照以下顺序执行：

1. 阅读并分析现有统计页面代码
2. 找出涉及文件
3. 简要说明准备修改哪些文件以及原因
4. 实现 Rank 数据模型
5. 重构 Header + Rank Overview
6. 优化 Stats Cards
7. 优化 Heatmap
8. 优化 Momentum Chart
9. 重构 Curriculum Progress
10. 完成 Responsive
11. 检查 VS Code Theme Compatibility
12. 运行项目现有 lint / typecheck / test / build
13. 修复本次改动引入的问题
14. 输出修改文件清单和最终结果

不要只生成设计稿。

必须直接完成代码实现。

---

# 43. 最终验收标准

任务完成必须同时满足：

* [ ] Rank 完全按照 solvedCount 计算
* [ ] 8 个 Rank 边界正确
* [ ] Rank 使用对应颜色
* [ ] 显示下一 Rank 所需题数
* [ ] Legendary 正确处理最高等级
* [ ] Submission 不影响 Rank
* [ ] 页面 Accent 色统一
* [ ] Heatmap 不再使用旧棕色体系
* [ ] Trend Chart 明显降低高度
* [ ] Trend Area Fill 明显弱化
* [ ] Curriculum 不再使用超长单列 Progress Bar
* [ ] 宽屏下 Curriculum 优先双列
* [ ] 窄屏正常退化到单列
* [ ] 页面 max-width 合理
* [ ] Border 数量和存在感降低
* [ ] 英文 Micro Labels 保留
* [ ] Typography 层次统一
* [ ] VS Code 窗口尺寸变化时布局正常
* [ ] 原有统计数据功能无回归
* [ ] 原有题目提交 / Judge 功能无回归
* [ ] 项目 lint/typecheck/build 通过

```

我建议你把这整段直接交给 Codex，然后再追加一句：

> **“不要一次性推翻现有页面，先阅读现有实现，在现有技术栈和组件体系上增量重构；完成后自行运行项目检查，并用 git diff 审查是否存在无关修改。”**

这句话很重要，会明显减少 AI 为了“重构 UI”顺手把整个插件前端改烂的概率。
```
