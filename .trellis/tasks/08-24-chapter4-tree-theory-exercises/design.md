# Design：第 4 章树与二叉树理论题整理

## 1. Architecture and Boundaries

本任务复用现有内容发现与 Quiz 数据流：

```text
用户提供的 01～08 Obsidian Markdown（只读）
  -> 按文档、按原顺序截取题目
  -> 选择题 -> lab-04-15～22/quiz.json
  -> 综合题 -> 对应 README.md 的折叠题解
  -> lab.json 声明 type=quiz
  -> 现有 CourseIndex + quiz.data.ts + QuizSet
  -> 章节目录 / Labs 首页 / 侧栏 Theory 分类 / 搜索 / 页面交互
```

题目进入仓库后，选择题以 `quiz.json` 为唯一事实来源，综合题以对应 README 为唯一事实来源。不会新增运行时数据源、组件或 Schema。

## 2. Extraction Contract

- 输入集合固定为文件名前缀 `01-`～`08-` 的八份 Markdown；不遍历其余题库文件。
- 以 `### 选择题 N` 与 `### 综合题 N` 为题目边界，源顺序即目标顺序。
- 选择题上限 20、综合题上限 5；不足时保留全部，不跨文档补齐。
- Obsidian callout 仅承担结构标记：题目信息映射到 Quiz 元数据，题面映射到 `stem`，A～D 映射到 `options`，答案与详解映射到 `answer`/`explanation`。
- 题目内部稳定 id 使用 `ch04-LL-qNN` 形式，避免同一道题在多个主题文档中出现时造成全局冲突；按用户验收反馈不再写入或展示 `source`、`targetId`。

抽取后执行双向计数审计：源文件选中块数、目标 JSON 项数、README 综合题标题数必须与 PRD 表格逐行一致。

## 3. Lab Information Architecture

每个 Lab 的文件结构一致：

```text
labs/chapter-04/lab-04-LL-topic-quiz/
├─ README.md
├─ lab.json
└─ quiz.json
```

README 顺序为：目标 → 前置知识 → 题量与预期成果 → 作答方法 → 选择题 `<QuizSet />` → 综合题（若有） → 完成清单 → 复盘。综合题答案使用 `::: details`，不会与交互选择题的答案总览混在一起。

`lab.json` 统一声明：

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "quiz",
  "quiz": {
    "questions": "quiz.json",
    "questionType": "single-choice",
    "reveal": "after-submit",
    "scoring": "points"
  }
}
```

## 4. Content Normalization

- 去除选项的 `A.`～`D.` 展示前缀，由 QuizSet 统一生成。
- 将答案字母转换为 0-based 索引，不改变正确答案语义。
- 保留 Markdown 公式、表格、代码和题内列表；移除 Obsidian 专属 callout 前缀。
- 对外部图片题使用源文档已有的文字版结构描述。这样页面在离线、Pages 子路径和移动端都可独立作答，也避免外部图片热链与许可不确定性。
- 删除选择题题面与综合题中的来源行、原始页面链接和题目标识；不修改题目本身的作答语义。

## 5. Directory and Routing Integration

远端 `chapter/04` 已有 Program Lab order 1～14，新 Quiz 使用 15～22。`content/chapter-04-tree/00-overview.md` 只增加一张相对链接目录表，不复制题面。Labs 首页、侧栏分类和搜索继续读取 `CourseIndex`；合法 frontmatter、目录名和 `lab.json` 是唯一接入合同。

## 6. Validation Strategy

- 数据审计：逐 Lab 题量、综合题量、四选一、答案范围、内部 id 唯一、解析非空，并确认 `source`、`targetId` 与可见来源行均不存在；总量 117/16。
- 路径审计：只出现 `01`～`08` 对应主题；无源目录绝对路径、Obsidian callout、外部图片热链、构建缓存或临时脚本。
- 项目门禁：`pnpm lab:validate`、`pnpm run validate:content`、`pnpm run validate`、`pnpm run test:discovery`、`pnpm test`。
- Pages 门禁：设置 `/DSA-Mastery` base 和正式 `SITE_URL` 后 build、`check:site`、`test:pages`。
- 浏览器验收：桌面和 390px 移动端检查第 4 章目录、八个 Lab、Quiz 完整交互、综合题折叠和前后页。
- 用户验收：保留 `pnpm run dev` 的本地服务，用户确认后才进入提交、推送和 PR。

## 7. Compatibility, Risk, and Rollback

- 不修改 Quiz Schema/组件，现有 14 个 Program Lab 行为不受影响。
- 新增八个目录可按 Lab 独立回退；概览目录必须与目录增删同步回退。
- 最大风险是源题答案或解析本身存在知识错误。自动校验只能证明结构合法，不能替代 Review Owner 的逐题核验；所有页面保持 `draft`。
- 同一真题可能在多个主题源文档中重复，这是“每份文档分别摘取”的预期结果，不做跨文档去重。
