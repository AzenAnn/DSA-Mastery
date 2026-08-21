# 第三章 串匹配与文本处理引擎（工程题）— 执行计划

> 仅当用户明确批准 `prd.md` 与 `design.md` 后执行；`task.py start` 前必须完成本清单的 Review 门禁。

## 前置

- `prd.md`、`design.md` 已由用户 Review 通过；
- 环境：Node 22 / pnpm 11.1.1、GCC 11 / Clang 14 / MSVC 19.30、CMake ≥ 3.25；
- 参考：`docs/LAB_AUTHORING_GUIDE.md`、`.trellis/spec/content/lab-tooling.md`、Golden Project `labs/chapter-04/lab-04-02-huffman-coding`、`labs/chapter-01/lab-01-21-list-workload-analyzer`。

## 顺序清单

1. 脚手架：`pnpm lab:new -- --type project --chapter 3 --order 14 --slug string-match-engine`；若编号被占用，用下一个合法编号并同步 README `order`。
2. 冻结 `contracts/matcher.hpp`（Matcher 抽象、MatchOutcome、next/nextval 构建函数声明）。
3. Task 1 `matcher`：
   - 先写 solution 与 cases（sample/normal/boundary/error/stress/regression）；
   - `pnpm lab:refresh-expected --write` 生成 `.out`（LF），审阅 diff；
   - 再写可编译但不满分的 starter；
   - 填 `task.json` 与顶层 `lab.json`。
4. Task 2 `engine`：
   - `CMakeLists.txt` + `CMakePresets.json`（student/solution 各自 `.lab-cache/cmake/...` 构建目录）；
   - solution 实现三 Matcher + `findall/count/replace/compare` + UTF-8 边界工具；
   - CTest 五组（semantic 30 / next 15 / textops 30 / cost 15 / workload 10）与 `task.json` 分值一一对应；
   - starter 可编译但不满分。
5. `report/`：`task.json` checklist + `template.md`。
6. README：frontmatter（`lab: true`、`difficulty: 综合`、`duration: 5～7 小时`、`order: 14`、`status: draft`）；正文含目标、前置、协议、正常/边界/错误、完成清单、复盘；写明与 lab-03-06 的差异与 UTF-8 冻结语义。
7. 逐 task 验证：
   ```powershell
   pnpm lab:validate -- labs/chapter-03/lab-03-14-string-match-engine
   pnpm lab:run -- labs/chapter-03/lab-03-14-string-match-engine
   pnpm lab:score -- labs/chapter-03/lab-03-14-string-match-engine
   pnpm lab:verify -- labs/chapter-03/lab-03-14-string-match-engine
   ```
8. 仓库级门禁：
   ```powershell
   pnpm test
   pnpm run validate
   pnpm run test:discovery
   pnpm run build
   pnpm run check:site
   pnpm run test:pages
   ```
9. 学生包：`pnpm lab:pack -- --profile student`；在包目录重跑 validate/run；`rg -n "solution|\.lab-cache|\.exe|\.o"` 确认无残留。
10. Review Owner 从干净 clone 独立复现：task-01 单用例、完整聚合评分、一组报告数据；记录 OS/编译器/CMake/命令/分数。

## 风险文件 / 回滚点

- `contracts/matcher.hpp`：任何签名变更 = 回到 planning 更新 prd/design；
- UTF-8 冻结语义：README + engine tests 双处锁定；
- `task-01` 的 `.out` oracle：只经 `refresh-expected --write` 更新，禁止手工重定向覆盖；
- 若 lab-03-14 编号与数组预留位冲突，只改编号与 order，不改内容契约。

## 完成后

- `trellis-check` 全量质量检查（spec 合规、lint、测试、跨层一致性）；
- `trellis-update-spec` 评审：是否记录新约定（如 Project 的 UTF-8 字符边界模式、matcher 统一契约模式）；
- Phase 3.4 提交 → 提醒用户 `/trellis:finish-work`。
