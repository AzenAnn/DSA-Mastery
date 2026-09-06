# 验证记录：Ch12 分治与递归整体重构

日期：2026-09-04  
分支：`chapter/ch12-divide-conquer-rebuild`  
基线：`origin/main@5fadebc`

## 内容与 Lab

- Ch12 正文：8 篇。
- Ch12 Exercise：16 个；Theory：0 个；Project：0 个。
- 16 个 Lab 均为 20 个公开测试、总分 100 分。
- 16 次最终 `pnpm lab:verify`：reference 均为 100/100；starter 均可编译且非满分；期望输出无漂移。
- `node scripts/check-chapter-12-lab-contracts.mjs`：16/16 通过，包含 P1228 覆盖合法性与 Beautiful Array 性质检查。

## 仓库门禁

- `pnpm run validate`：通过。
- `pnpm test`：通过；内容统计为 82 篇教材、221 个 Lab、216 个 manifest、551 道选择题。
- `pnpm run test:lab-tools`：40 通过、1 个 Windows 符号链接测试按设计跳过。
- `pnpm run test:lab-docs`、`pnpm run test:lab-make`、`pnpm run test:discovery`：通过。
- Pages 子路径构建与 `pnpm run check:site`：通过。
- `pnpm run test:pages`：25/25 通过。
- `git diff --check`：通过。

## 浏览器检查

- 本地地址：`http://127.0.0.1:5173/learn/chapter-12-divide-conquer-recursion/00-overview/`。
- 页面目录唯一项：8 篇正文、16 个 Exercise Lab。
- 通过侧栏进入 P1228 Lab，标题、来源和本地判定说明可见。
- 6 个关键页面在 1440px/390px、浅色/深色共 24 个组合中无根级横向溢出，主题状态一致。
- 控制台错误：0。

## 环境说明

仓库级 golden Project 检查在本机无法使用：已安装的 Visual Studio 18 BuildTools `VsDevCmd.bat` 初始化失败。Ch12 Program Lab 已通过可用的 Clang 21.1、CMake 4.0.3 与 GNU Make 4.4.1 验证；这不是 Ch12 内容或 Lab 合同失败，因此未修改 Lab CLI 的 MSVC 选择逻辑。

## Trellis 状态

用户要求本轮不提交、不 push。`trellis-finish-work` 要求工作提交存在后才能归档并写 journal，因此任务保持 `in_progress`，待用户授权提交后再执行归档。
