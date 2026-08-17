# C++ Lab 工具链研究

## 仓库事实

- 项目已经固定 Node.js `>= 22.13.0` 与 pnpm，使用 Node 标准库实现评分器不会新增第二套脚本运行时。
- 当前没有 C++、Make、CMake 或测试数据；简单与大型 Lab 可以从不同构建层级开始。

## 官方资料

1. GCC 标准选择：GCC 官方文档说明可用 `-std=c++17`、`-std=c++20` 等显式选择 ISO C++ 方言；不同 GCC 版本的默认方言会变化，因此课程工具不应依赖默认值。  
   https://gcc.gnu.org/onlinedocs/gcc/Standards.html

2. Node 子进程：Node 22 的 `child_process.spawn()` 支持参数数组、工作目录、`timeout`、AbortSignal 和 Windows 隐藏窗口；官方同时警告 shell 模式不得接收未清洗输入。因此评分器应使用 `shell: false` 和参数数组。  
   https://nodejs.org/download/release/v22.17.0/docs/api/child_process.html

3. GNU Make：GNU Make 官方手册把 `all`、`clean` 等动作定义为典型 phony target，并说明 Make 只负责执行 recipe，不理解具体测试语义。适合让 Makefile 作为统一 CLI 的薄入口，而不是复制评分规则。  
   https://www.gnu.org/software/make/manual/html_node/Phony-Targets.html

4. CMake/CTest：CMake 官方教程说明 `enable_testing()`/`add_test()` 可注册测试，`ctest --test-dir build` 运行并报告；适合多 target 的大型 Lab，不必强加给单文件题。  
   https://cmake.org/cmake/help/latest/guide/tutorial/Testing%20and%20CTest.html

5. CMake Presets：官方文档说明 `CMakePresets.json` 用于提交项目级共享配置，`CMakeUserPresets.json` 用于本机且不应提交。大型 Lab 应提交前者，不提交后者。  
   https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html

6. Dev Container/Codespaces：GitHub 官方文档说明 `devcontainer.json` 可以定义工具、运行时和创建后设置，使 Codespaces 使用仓库指定环境；Dev Container registry 提供可组合 features。它适合作为可选可复现环境，而不是替代原生安装说明。  
   https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers  
   https://containers.dev/features.html

7. GitHub CI：GitHub 官方文档把 Actions CI 定位为在提交/PR 上构建和运行测试并回传结果，适合独立验证 Linux/Windows 工具链。  
   https://docs.github.com/en/actions/get-started/continuous-integration

## 结论

- 不提交编译器二进制；提交要求、检测、CI 和可选容器。
- 简单 program 使用直接编译器 + Node runner，避免 CMake 成为无谓门槛。
- project 使用 CMake Presets + CTest，以 target/test 表达多任务关系。
- 项目根 Makefile用于批量维护；program/project Lab 额外保存模板生成的极薄 Makefile，以支持 `cd` 后直接 `make run`。两者都加载共享 `lab.mk`，真正的跨平台评分逻辑仍在 Node CLI。
- 默认标准应显式指定。面向学校环境时建议 C++17，个别 Lab 可覆盖 C++20；最终由用户确认兼容基线。
