---
title: "Git 刷题使用指南"
description: "面向初学者的个人分支答题、远程更新与冲突处理指南。"
order: 7
chapter: "preface"
chapterTitle: "课程作者指南"
updated: "2026-09-03"
contributors: ["Qing"]
status: "draft"
---

# DSA-Mastery 刷题 Git 使用指南

> 面向 Git 零基础读者。
> 目标：在**保留个人答题内容**的前提下，持续获取远端仓库里的最新题目和更新。
> 全程只需要 Git Bash（Windows）或终端（macOS / Linux），以下命令均以 Git Bash 为例。

## 目录

- [0. 30 秒理解核心概念](#0-30-秒理解核心概念)
- [1. 两条必须记住的原则](#1-两条必须记住的原则)
- [2. 场景一：首次使用](#2-场景一首次使用)
- [3. 场景二：日常更新](#3-场景二日常更新)
- [4. 常用辅助命令速查](#4-常用辅助命令速查)
- [5. 常见错误与处理方法](#5-常见错误与处理方法)
- [6. 完整对照示例](#6-完整对照示例)

---

## 0. 30 秒理解核心概念

用"共享文档"来类比：

| 概念 | 类比 | 说明 |
| --- | --- | --- |
| 仓库（Repository） | 整个共享文档库 | 存所有题目和教材的地方，你把它完整下载到本地 |
| main 分支 | 官方正式版 | 远端最新、最全的内容，永远只"看"，不在上面改 |
| 个人分支 | 你的草稿纸 | 从 main 复制一份出来，你在上面随便写答案 |
| 提交（commit） | 存一次草稿 | 把当前改动记录成一个"存档点"，之后可以随时回到 |
| 拉取（pull） | 拿官方新版 | 把远端新增内容下载到本地 |
| 合并（merge） | 把草稿和官方新版拼到一起 | 把官方新题合进你的草稿；同一处有不同修改时需要处理冲突 |
| 冲突（conflict） | 同一处你俩都改了 | 官方和你改了同一个文件的同一处，需要你手动决定留哪边 |

---

## 1. 两条必须记住的原则

**原则一：main 只当"远端镜像"，绝不在 main 上做题或提交。**
main 的唯一作用，是当远端最新版的本地副本。只要养成"只在个人分支上动手"的习惯，整个流程就不会乱。

**原则二：更新前先保存个人修改，再用 `git merge` 同步。**
先提交个人修改，或使用 `git stash -u` 暂存未提交修改。合并时 Git 会尽量保留双方改动；如果两边改了同一处，会提示冲突，需要手动整理，不能保证“永远不会覆盖”。
`merge` 简单、可撤销（`git merge --abort`）、历史直观；`rebase` 会重写历史、冲突处理更复杂，不适合初学者。本文全部使用 `merge`。

---

## 2. 场景一：首次使用

### 2.1 安装与准备

1. 安装 Git。Windows 用户建议一并安装 **Git Bash**（安装 Git 时默认自带）。
2. 配置身份（只需做一次，之后所有仓库共用）：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 2.2 克隆仓库

如果希望使用 SSH，先按下面步骤配置一次 SSH key：

```bash
# 1. 生成 SSH key（一路按回车即可；已有 key 可跳过）
ssh-keygen -t ed25519 -C "你的 GitHub 邮箱"

# 2. 查看公钥并复制整行内容
cat ~/.ssh/id_ed25519.pub

# 3. 登录 GitHub，打开头像菜单 → Settings → SSH and GPG keys → New SSH key
#    把刚才复制的整行内容粘贴到 Key 中，填写标题后保存

# 4. 测试连接
ssh -T git@github.com
# 第一次连接若询问是否继续，输入 yes

# 5. 使用 SSH 地址克隆
git clone git@github.com:AzenAnn/DSA-Mastery.git
```

如果看到类似 `Hi 用户名!` 的认证成功提示，就可以使用 SSH 地址克隆。暂时不想配置 SSH 时，直接使用 HTTPS 即可，后续流程完全相同：

```bash
git clone https://github.com/AzenAnn/DSA-Mastery.git
```

> SSH 配置失败也不影响刷题，先用 HTTPS 克隆即可。
>
> **注意**：GitHub 已不支持用登录密码进行 git 操作。用 HTTPS 拉取 / 推送时如果提示输入密码，要输的是 GitHub 的 **Personal Access Token（个人访问令牌）**，不是账号密码。

### 2.3 进入目录，确认状态

```bash
# 首先在该文件夹右键，选择 "在终端打开"
git branch        # 看到 * main，说明当前在 main
git remote -v     # 看到 origin，说明远端连接正常
```

### 2.4 创建个人答题分支

`switch -c` = 基于当前分支创建新分支并切换过去：

```bash
git switch -c answer-你的名字
```

> 分支名建议以 `answer-` 开头，避免和仓库已有的 `chapter/`、`codex/`、`feat/` 等分支混淆。

### 2.5 开始答题

本地答题使用项目自建的 **DSA Mastery VSCode 插件**，不需要先用终端运行判题命令：

1. 用 VSCode 打开仓库根目录，也就是包含 `labs/` 和 `tools/lab/cli.mjs` 的目录。不要只打开某个 Lab 子目录。
2. 查看最左侧活动栏，点击 **DSA Mastery**。
3. 展开章节并点击要做的题目。题目面板会显示题面和相关信息。
4. 点击 **打开答题文件**；Project 题还可以在 task 卡片中选择对应文件。
5. 在打开的学生文件中写答案，然后点击 **提交**。插件会保存文件、检查环境、编译并运行自动测试。

插件会把提交记录、最好成绩、通过状态和源码快照保存在 VSCode 的插件用户数据中（`globalState` / `globalStorage`），这些**做题记录不保存在项目目录，也不会写入 Git**。你编写的学生源文件仍会保存在项目目录中，因此可以按第 3 节提交到个人分支；插件记录不会因为执行 `git merge main` 被覆盖，但换电脑或重装 VSCode 后不会自动带过去，仍建议定期备份。

如果活动栏没有 DSA Mastery 图标，请先按插件指南安装 VSIX 并重启 VSCode。插件只在打开仓库根目录时扫描题目。

### 2.6 首次自检

```bash
git branch         # 应看到 * answer-你的名字（当前就在个人分支）
git status         # 这里可能显示插件刚保存的学生文件尚未提交，这是正常的
```

在插件题目面板中可以查看本题的提交结果和提交历史。Git 的 `git log` 只显示你提交到个人分支的项目文件版本，不显示插件内的每次答题记录。

---

## 3. 场景二：日常更新

> 每次开始刷题前做一遍，用时约 1 分钟。
> 核心思路：**先保存你的草稿 → 让 main 变成最新 → 把最新合并进你的草稿。**

### 3.1 保存个人修改（关键，不要跳过）

先看个人分支上有没有还没提交的改动：

```bash
git status
```

- 有改动且想存档 → 提交：

```bash
git add 修改过的文件路径
# 直接  git add . 是添加所有更改的文件（注意，有个英文的句号 "." )
git commit -m "保存当前答题进度"
```

### 3.2 更新 main

```bash
git switch main    # 1. 切到 main
git pull --ff-only origin main  # 2. 拉取远端最新内容，main 变成最新
```

> `--ff-only` 会确保 `main` 只是跟随远程前进。如果提示无法快进，说明 `main` 上有额外的本地提交，请按第 5.1 节处理，不要直接重置。

### 3.3 把最新内容同步到个人分支

```bash
git switch answer-你的名字    # 1. 切回个人分支
git merge main               # 2. 把 main 的最新内容合并进来
```

合并后：远端新增的题目进来了，已经提交的个人答题内容会保留；如果双方修改了同一个文件的同一处，Git 会提示冲突，按第 5.3 节处理。

> 如果这里 Git 停下来提示冲突，先别慌，跳到第 5.3 节「同步时发生冲突」处理。

### 3.4 继续答题 + 确认成功

```bash
# ... 正常刷题，写答案，提交 ...
git status        # 干净，说明更新完成
git log --oneline # 应能看到 main 的最新提交已并入（真正合并时才会多一条 Merge 记录）
```

> **更新时机**：每次开始刷题前先更新一次，不要隔很久攒一大堆再合——合并涉及的文件越多，冲突概率越高。

---

## 4. 常用辅助命令速查

| 想做什么 | 命令 |
| --- | --- |
| 查看当前分支 | `git branch` |
| 查看文件修改状态 | `git status` |
| 切换分支 | `git switch 分支名` |
| 创建并切换到新分支 | `git switch -c 新分支名` |
| 把修改加入下一次提交 | `git add 文件路径` 或 `git add .` |
| 保存一次本地版本 | `git commit -m "说明文字"` |
| 查看提交记录 | `git log --oneline --decorate -n 10` |
| 查看某个文件改了什么 | `git diff 文件名` |
| 放弃某文件未提交的改动 | `git restore 文件名`（会丢弃修改） |
| 放弃一次正在进行的合并 | `git merge --abort` |

`git add` 只是把修改放进“下一次提交”，`git commit` 才会真正创建本地存档。`git add .` 会加入当前目录下的所有修改，使用前先看一眼 `git status`。

`git merge --abort` 只在合并发生冲突、Git 还没有完成合并时使用，作用是取消这次合并并回到合并前的状态；平时不需要执行。

---

## 5. 常见错误与处理方法

### 5.1 在 main 上做了修改 / 提交

- 只是改了、还没提交：

```bash
git stash -u
git switch answer-你的名字
git stash pop       # 改动会回到个人分支
```

- 已经在 main 上提交了：

  不要急着自己执行 `reset --hard` 或其他恢复命令。先停止操作，把 `git status`、`git log --oneline -5` 和报错信息原样发给 AI，请 AI 根据你的实际状态给出处理步骤。确认个人答案已经保留前，不要执行 `git push`。

### 5.2 有未提交内容时无法切换分支

报错形如：`error: Your local changes to the following files would be overwritten by checkout...`

意思是 Git 不允许你带着“没存好的草稿”换分支。先把修改提交，再切换：

```bash
git add 修改过的文件路径
git commit -m "保存当前答题进度"
git switch main
```

### 5.3 同步时发生冲突

有些 Lab 要求直接在已有的 `student/main.cpp` 中答题。如果你完成题目后，远程仓库也修改了这个文件，执行 `git merge main` 时可能发生冲突。这表示你的答题代码和远程的新模板或新改动出现在同一个文件的同一处，Git 无法自动决定保留哪一部分。`<<<<<<< HEAD` 代表当前个人分支，`>>>>>>> main` 代表正在合并的 `main`。

**识别**：

```bash
git status        # 冲突文件会标记为 "both modified"
```

打开冲突文件，会看到类似：

```
[个人分支的内容]
----------------
[main 的内容]
```

**解决**：用 VS Code 打开冲突文件，结合题目最新要求整理出最终代码。通常应保留你的算法实现，同时吸收远程对题目模板、输入输出或文件结构的必要修改。删掉 `<<<<<<<`、`=======`、`>>>>>>>` 三种标记并保存，然后：

```bash
git add 冲突文件
git commit -m "解决冲突"     # 提交即完成合并（带 -m 信息，避免弹出文本编辑器）
```

然后回到 VS Code 的 DSA Mastery 面板，再次提交这道题，确认代码仍能通过测试。

**想放弃这次合并**：

```bash
git merge --abort     # 回到合并前的状态
```

### 5.4 提交时报错 "Please tell me who you are"

说明还没配置身份，Git 不知道提交人是谁。执行第 2.1 节的两条 `git config` 命令后再提交即可：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

---

## 6. 完整对照示例

从零开始、可直接照抄的完整流程（假设用户名为 zhang）：

```bash
# ================= 首次使用 =================
git clone https://github.com/AzenAnn/DSA-Mastery.git
cd DSA-Mastery
git switch -c answer-zhang
# 用 VSCode 打开当前 DSA-Mastery 根目录
# 在左侧活动栏点击 DSA Mastery，展开章节并点击题目
# 点击“打开答题文件”，完成代码后点击“提交”
# 提交结果和提交历史保存在 VSCode 插件中，不进入 Git

# 如需保存代码版本，再提交插件写入的学生文件
git add labs/chapter-14/exercise/E-14-09-longest-increasing-subsequence/student/main.cpp
git commit -m "完成最长上升子序列"

# ================= 某天，开始今天的刷题 =================
git status                                  # 1. 先看有没有没保存的改动
git add labs/chapter-14/exercise/E-14-09-longest-increasing-subsequence/student/main.cpp  # 2. 把今天的改动放入暂存
git commit -m "保存当前答题进度"             # 3. 存档
git switch main                             # 4. 切到 main
git pull --ff-only origin main               # 5. 拉取远端最新
git switch answer-zhang                     # 6. 切回个人分支
git merge main                              # 7. 把最新内容合并进来
# 回到 VSCode 的 DSA Mastery 侧边栏继续答题；不要 git push
```

---

完成这些，你就掌握了这套"个人做题 + 单向同步远端"的流程。遇到没覆盖到的问题，可以把报错信息原样贴出来再问。
