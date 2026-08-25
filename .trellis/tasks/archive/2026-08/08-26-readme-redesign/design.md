# README 改版设计

## 1. 设计目标

README 是一个“30 秒理解、3 分钟找到入口”的项目首页。它先服务课程学习者，再为愿意参与项目的人提供贡献入口，不承担完整开发文档或仓库手册的职责。

## 2. 品牌方向

### 语气

| 特质 | 要做到 | 避免 |
| --- | --- | --- |
| 扎实 | 用已有课程与 Lab 证明价值 | “最全”“顶级”“一站式”等夸张口号 |
| 清晰 | 一段只表达一个决定，入口靠前 | 长段背景说明与重复愿景 |
| 可信 | 准确描述当前内容与完成状态 | 用尚未完善的机制包装项目 |
| 克制 | 复用既有品牌横幅和少量状态信息 | 大量徽章、Emoji、居中 HTML 和装饰分隔 |

### 核心信息

- 主标题：`DSA Mastery`
- 品牌短句：`学透 · 做实 · 用活`
- 一句话定位：`面向大学课程的数据结构与算法理论与实验教程，把概念理解与动手实践放在同一条学习路径中。`
- 主要行动：`进入在线课程`
- 次要行动：`课程地图`、`浏览 Labs`、`参与贡献`
- 内容证据：`60+ 教材页面`、`100+ Lab`

## 3. 信息架构

```text
品牌横幅
  ├─ 标题 / 短句 / 一句话定位
  ├─ 在线课程 / 课程地图 / Labs / 贡献
  └─ Pages 状态

为什么是 DSA Mastery
  └─ 理论理解 / 动手实现 / 多层练习

当前内容
  ├─ 60+ 教材页面 / 100+ Lab
  ├─ 课程全景插图
  └─ 课程主题分组

Lab 类型
  ├─ Lab 模式插图
  └─ Theory / Exercise / Project

开始学习
  ├─ 在线学习入口
  ├─ git clone
  └─ Windows 环境配置教程

参与贡献
许可说明
```

明确不设置“学习闭环”“质量保证”“仓库导览”“教材原文件”“Lab 原文件”和通用文档资源区。

## 4. 首屏视觉稿

```md
<p align="center">
  <img src="./public/og.png" alt="DSA Mastery：学透、做实、用活" width="100%" />
</p>

<h1 align="center">DSA Mastery</h1>

<p align="center"><strong>学透 · 做实 · 用活</strong></p>

<p align="center">
  面向大学课程的数据结构与算法理论与实验教程，<br />
  把概念理解与动手实践放在同一条学习路径中。
</p>

<p align="center">
  <a href="https://azenann.github.io/DSA-Mastery/"><strong>进入在线课程</strong></a>
  · <a href="https://azenann.github.io/DSA-Mastery/learn/">课程地图</a>
  · <a href="https://azenann.github.io/DSA-Mastery/labs/">浏览 Labs</a>
  · <a href="./CONTRIBUTING.md">参与贡献</a>
</p>

<p align="center">
  <a href="https://github.com/AzenAnn/DSA-Mastery/actions/workflows/pages.yml">
    <img src="https://github.com/AzenAnn/DSA-Mastery/actions/workflows/pages.yml/badge.svg" alt="Pages build status" />
  </a>
</p>
```

横幅直接使用仓库现有品牌资产，下面只保留一个状态徽章，避免徽章墙削弱主信息。

## 5. 关键模块示意

### 为什么是 DSA Mastery

| 理论理解 | 动手实现 | 多层练习 |
| --- | --- | --- |
| 从定义、ADT 与不变量出发理解数据结构和算法。 | 通过 C++ Lab 把抽象概念转化为可以运行的实现。 | 用 Theory、Exercise 与 Project 承接不同阶段的学习目标。 |

### 当前内容

| 学习主题 | 已覆盖方向 |
| --- | --- |
| 基础与线性结构 | 绪论、线性表、栈与队列、字符串与数组 |
| 树与图 | 树与二叉树、树的应用、图的存储与遍历 |
| 查找与排序 | 查找、基础排序、高效排序与外部排序 |
| 综合方法 | 贪心算法与持续扩展的课程练习 |

> 当前仓库已包含 **60+ 教材页面** 与 **100+ Lab**。内容仍按课程节奏持续完善，未完成页面会明确标注状态。

### 三类 Lab

| Theory | Exercise | Project |
| --- | --- | --- |
| 交互选择题与概念辨析 | 可编译、可判分的单题程序 | 多任务与综合能力结合的完整实验 |

### 开始学习

在线阅读作为默认路径；需要获取仓库时只展示：

```bash
git clone https://github.com/AzenAnn/DSA-Mastery.git
```

其余安装与配置步骤统一指向[Windows 学生实验环境安装指南](https://azenann.github.io/DSA-Mastery/learn/chapter-preface/02-windows-student-setup/)，避免 README 与教程重复维护。

## 6. 新增图片设计

### 课程全景图

- **位置**：`当前内容` 标题和规模摘要之后、主题表格之前。
- **作用**：用从左到右的视觉路径串联数组/链表、栈/队列、树、图、查找与排序。
- **风格**：宽幅编辑设计，暖白纸张纹理、深色墨线、靛蓝连接线、少量橙色重点。
- **限制**：不出现标题、标签、代码文字、Logo 或水印；知识名称由旁边正文承担。
- **文件**：`public/readme/course-panorama.png`。

### Lab 模式图

- **位置**：`Lab 类型` 标题和引导语之后、三类 Lab 表格之前。
- **作用**：用三个连续工作台场景分别表现概念思考、代码实现和综合项目。
- **风格**：与课程全景图共享纸张、墨线和配色，构图更具操作感但保持克制。
- **限制**：不出现可读文字、题目内容、代码内容、Logo 或水印。
- **文件**：`public/readme/lab-modes.png`。

两张图都按 README 横向分区图使用，控制在近似 `3:1` 的视觉比例；生成结果若偏高，通过 README 的全宽布局统一视觉宽度，不在图内叠加正文。

## 7. 本地预览

- 用支持 GitHub Flavored Markdown 的本地渲染器展示根目录 README，而不是把 README 临时复制进课程内容目录。
- 在本机端口启动预览，只产生临时预览状态，不把预览页或构建输出提交到仓库。
- 以桌面宽度截取完整页面与首屏重点区域，检查首屏信息、两张插图、表格和长页面节奏。

## 8. 内容取舍

README 不展示以下内容：

- 学习闭环与质量保证机制。
- 仓库目录树和文件职责说明。
- `content/` 教材原文件入口。
- `labs/` Lab 原文件入口。
- Node.js、pnpm、编译器、编辑器和测试命令的逐项配置。
- 面向维护者的完整文档索引。

## 9. 兼容与风险

- GitHub 支持所用的 `<p>`、`<h1>`、`<img>` 与 `<br>`，不依赖 GitHub 不支持的 CSS。
- `public/og.png` 已存在且与网站视觉一致；若未来更换 OG 图，README 会自然同步使用新资产路径。
- 圆整统计值降低维护频率，但仍需在内容规模跌破或跨越阈值时更新。
- 仓库无 License；视觉改版不能弱化现有授权提醒。
- AI 图片可能产生伪文字或视觉歧义；使用无文字提示词并逐张人工检查，不合格时只针对单个问题迭代。
- 新图片会增加仓库与 README 加载体积；保存前检查尺寸和文件大小，避免为装饰引入过大的资源。
