# 统一 Lab 更新机制：最终独立复审

复审日期：2026-08-17

最终快照：`2e918f99ae64e1ab142d5616649a4bdd0ce40a30`

前序完整门禁快照：`e2c3afe8feb69c9240003f142041e50e8e7e5418`

结论：PASS。最终发布快照没有剩余阻断项。前序快照中唯一残留的 Project IE JSON 顶层 `ok` 不一致，已在最终快照修复，并由真实缺失 CTest runner 的 `run`、`score` 两条路径独立复现验证。

本报告基于附件原始 T1–T12 清单、任务 `prd.md`、`design.md`、`implement.md`、适用 Trellis spec 和实际代码路径，不采用既有 audit 自述作为通过依据。

## Findings (fixed)

### F1：Project IE 的 JSON 顶层 ok 曾与退出码矛盾

- 严重度：High，现已修复。
- 文件：`tools/lab/cli.mjs`。
- 原问题：前序快照中，Project CTest runner 无法启动时，`run` 与 `score` 会正确返回 exit 2，`result.internalError` 为 true，task/test 为 IE，但 `createReport` 的默认 `ok: true` 没有被覆盖。只检查 JSON 的自动化调用方会把工具内部错误误判为成功。
- 修复证据：最终快照在输出报告前执行 `report.ok = !project.internalError`；Program 路径也同步以 IE 判定 `ok`。
- 独立复测：构造只含一个 CTest task 的临时 Project，用可成功返回的假 `cmake.exe` 完成 configure/build，同时从 PATH 移除 `ctest`，分别执行 CLI `run` 与 `score`。
  - `run`：exit=2，ok=false，internalError=true，task status=IE，test verdict=IE。
  - `score`：exit=2，ok=false，internalError=true，task status=IE，test verdict=IE。

## Findings (not fixed)

无。未发现仍需修改产品代码、测试、文档或 CI 配置的阻断项。

## 首轮阻断项逐项复测

| 项目 | 结果 | 独立证据 |
| --- | --- | --- |
| CTest 零匹配不得 AC | PASS | 将 Golden Project 的声明测试名改为未注册名称；真实 Ninja Multi-Config 构建后判为 IE，internalError=true。实现同时使用 `--no-tests=error` 并识别 `No tests were found`。 |
| Project IE exit 2 与 JSON 合同 | PASS | 最终真实缺失 ctest fixture 的 run/score 均为 exit 2、ok=false、internalError=true、IE。 |
| Program 多源 pack | PASS | 临时 Program 的 `student/main.cpp`、`shared/helper.cpp`、`include/helper.hpp` 均进入学生包；包内独立 score=100。 |
| Project 缺少可选 contracts 时 pack | PASS | 新建 Project 脚手架未添加 contracts，pack、loadLab、内嵌 CLI validate 均成功。 |
| 学生包二进制过滤 | PASS | 临时加入 exe、dll、pdb、obj 后均未进入学生包；solution 也被排除。 |
| Project task Schema 重写 | PASS | 打包后的 implementation 与 report `task.json` 都解析到包内 `schemas/task.schema.json`，包可独立 validate。 |
| C++20 manifest 传入 CMake | PASS | 将 Golden Project manifest 改为 c++20，真实 CMakeCache 显示 `CMAKE_CXX_STANDARD=20`。 |
| Windows multi-config | PASS | 在 Windows 使用 Ninja Multi-Config 真实配置、构建与 CTest；Release 配置可运行。代码路径显式传 `--config Release` 与 `ctest -C Release`。 |
| Project task-local clean | PASS | 运行 Golden Project 后顶层和 stdio task 均产生 `.lab-cache`；`lab:clean` 后二者都不存在，源码保留。 |
| Quiz README 静态答案拦截 | PASS | 含“标准答案”标题和答案表的临时 Quiz validate 返回 exit 2、ok=false、QUIZ_INVALID。 |
| interactive --json 行为 | PASS | 合同明确 interactive 直接接管终端，不提供 JSON；传 `--json` 返回 exit 2、ok=false、ARGUMENT_INVALID，作者指南明确该例外。 |
| Make TASK 转发 | PASS | Windows `mingw32-make -n interactive TASK=frequency TARGET=solution` 的实际命令含 `--task frequency`；集成测试还验证 Project run TASK 只选择指定 task。 |
| 文档示例语义验证 | PASS | `validate-lab-docs` 把指南 JSON 写成临时 Quiz、Program、Project fixture 并执行 loadLab；同时验证 float 容差、Make target、package script、Golden 路径和文档入口。 |
| Pages deploy 等待 C++ 门禁 | PASS | `pages.yml` 解析成功，`deploy.needs` 精确为 build、lab-cpp；本地文档校验也断言该依赖。 |

## T1–T12 验收覆盖

| 工作包 | 结果 | 关键证据 |
| --- | --- | --- |
| T1 平台与工具链基线 | PASS | 作者指南冻结 Windows/Linux 一等支持、macOS/WSL 支持、Make 推荐非必装、pnpm 兜底、C++17 默认与 C++20 条件、GCC 11/Clang 14/MSVC 19.30/CMake 3.25、容器可选。 |
| T2 统一 Schema | PASS | 四份 v1 Schema 可解析；三类型、未知版本、路径越界、绝对路径、Windows junction 逃逸、ID/分值/依赖/环均有负向验证。 |
| T3 CLI 与脚手架 | PASS | new、doctor、validate、build、run、interactive、score、verify、refresh-expected、pack、clean 均存在；JSON/无色、退出码、Lab 根发现、缓存位置、不覆盖源码合同通过。 |
| T4 Quiz | PASS | 6 个现有 Quiz 已有 manifest；四选一、无手写标签、答案索引、重复 ID/选项、hint/points/元数据、README 单一 QuizSet 和静态答案禁令均校验；Pages 测试覆盖进度、正确数、总分、答案总览、移动端交互。 |
| T5 Program 内容包 | PASS | Golden Program 和多源临时包验证 student/solution、cases、100 分、超时/比较配置、starter 可编译非满分、solution 100、stdout/stderr 分离与 CE 诊断。 |
| T6 本地评分器 | PASS | exact/tokens/float、CRLF/LF、绝对/相对误差、AC/WA/TLE/RE/CE/OLE/IE、真实超时、输出限制、首差异、逐用例分数、JSON、shell:false 均由单测或 Golden 路径覆盖。 |
| T7 Make 体验 | PASS | 根 Makefile、共享 `lab.mk`、薄 Makefile 一致；Windows GNU Make 4.4.1 的 mingw32-make 实际验证根/本地/学生包 run、一致评分、CASE/TASK、interactive、strict score、clean、路径空格和 WA 无 Make 噪声。 |
| T8 oracle 与学生包 | PASS | refresh 预览与显式 write、LF 写入、verify 漂移、Program/Project 独立学生包、solution/cache/binary 排除、内嵌 runner 与独立 Makefile 通过。 |
| T9 Project | PASS | Golden Huffman Project 含 stdio、ctest、manual 三类 task；权重/依赖/循环、共享目录、CMake Presets、CTest、单 task、聚合自动 80/80 与 manual pending 20 均通过。 |
| T10 Golden 与迁移 | PASS | Golden Quiz、Program、Project 均通过；6 个 Quiz manifest 已迁移；README-only 内容仍由 discovery/build 正常处理；迁移追踪文档不要求一次重写全部旧 Lab。 |
| T11 CI、验证与安全 | PASS（本地与配置） | `pnpm test` 含静态内容/Schema/文档、类型、lint、discovery、build、产物检查；独立 C++ matrix 配置 GCC、Clang、MSVC；路径空格、缺编译器、工作树污染、只读权限、无秘密与“非恶意代码沙箱”说明存在。 |
| T12 作者教程 | PASS | `LAB_AUTHORING_GUIDE` 覆盖三类完整教程、命令、环境、测试设计、全部判定、排错、Author Check、Review、迁移、正误对照和 DoD；README、CONTRIBUTING、UPDATE_WORKFLOW、spec index、前言、PR 模板均有入口，示例由脚本语义验证。 |

## Verification

### 最终快照 2e918f99 的定向门禁

- Frozen install：PASS。`pnpm install --frozen-lockfile`，lockfile 未变化。
- Project IE 真实 fixture：PASS。run/score 均为 exit 2、ok=false、internalError=true、task/test IE。
- Lab tools：PASS。`pnpm run test:lab-tools`，26 tests，25 pass、0 fail、1 skip。
- Lint：PASS。`pnpm run lint`，exit 0。
- 工作树污染（报告写入前）：PASS。`git diff --exit-code` 为 0；`git ls-files --others --exclude-standard` 为空。

### 前序完整门禁快照 e2c3afe 的证据

- Frozen install：PASS。`pnpm install --frozen-lockfile`。
- 完整仓库门禁：PASS。`pnpm test` 依次通过内容校验（33 篇教材、23 个 Lab、8 个 manifest、55 道选择题）、typecheck、lint、Lab tools、作者指南语义检查、自动 discovery、VitePress build 和静态产物检查（89 个 HTML）。
- Golden：PASS。`pnpm run test:lab-golden`；Schema、Quiz、Program reference 100/starter 非满分、Project 80/80 + manual pending、两个独立学生包 runner 全部通过。
- Make/CLI：PASS。`pnpm run test:lab-make`；Windows mingw32-make 验证根/本地/学生包、interactive、Project TASK/oracle、严格评分非零。
- Pages 子路径：PASS。`GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与 `SITE_URL` 设置后，build 和 check:site 通过，产物 base=/DSA-Mastery/。
- Playwright：PASS。`pnpm run test:pages`，14/14 passed，覆盖导航、搜索、响应式、Quiz 与 Program 页面。
- Workflow YAML：PASS。PyYAML safe_load 成功；jobs 为 build、lab-cpp、deploy，`deploy.needs` 为 build、lab-cpp。
- 路径安全：PASS。词法 `../`、绝对路径和 Windows NTFS junction 逃逸均返回 PATH_ESCAPE。
- C++20/多配置：PASS。Windows Ninja Multi-Config 真实构建，CMakeCache 标准为 20，零匹配 CTest 为 IE。
- 学生包：PASS。多源 Program 独立得到 100；Project 无 contracts 仍可 pack；Schema 指向包内；solution 与 exe/dll/pdb/obj 排除。
- 工作树污染：PASS。全部前序构建、Golden、Make、Pages 和 Playwright 后，git diff 为 0、无未跟踪文件。

### 外部验证边界与残余风险

- 没有声称真实 GitHub Actions 已运行。临时快照只能解析并本地审查 `pages.yml`；Ubuntu hosted GCC/Clang、Windows hosted MSVC、GitHub token/secret 权限和实际 Pages deploy 必须由真实 PR/push 工作流确认。
- 当前 Windows 审查终端没有 `cl`，因而本地没有执行 MSVC 编译；本地 C++ 路径使用 clang 21.1.0 的 g++ driver、CMake 4.0.3、Ninja 1.13.1 与 GNU Make 4.4.1。
- macOS 与 WSL 支持没有在本机实际运行，只能由对应平台复核。
- 文件 symlink 单测因当前 Windows 权限跳过；本次额外使用无需特权的 NTFS junction 实测 realpath 越界拦截，结果为 PATH_ESCAPE。
- Reviewer 批准、真实 PR 证据、发布后在线抽查属于人工/外部状态，不能由此临时快照替代。
- 本地评分器按设计不是恶意代码沙箱；这一点已在文档与 CI 权限模型中明确，不属于缺陷关闭。

最终判定：本次 T1–T12 实现可进入真实 PR/托管 CI 阶段；独立复审没有发现剩余本地阻断项。
