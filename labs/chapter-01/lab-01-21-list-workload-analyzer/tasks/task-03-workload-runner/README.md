# Task 03：统一工作负载运行器

本任务把前两个任务中的容器放到同一个、可复现的实验协议下。你需要完成参数解析、五种工作负载、重复测量与结构化输出。

学生版已经提供工作负载执行核心；你仍需完成 `student/workload_output.cpp` 中的 JSON 输出，并确保前两个任务的计数器实现正确，否则成本核算测试不会通过。

## 约束

- 相同配置下，两种容器必须收到完全相同的操作序列。
- 初始化和预热不得进入正式计时及成本统计。
- 所有随机行为只依赖 `--seed`，不得使用系统时间。
- JSON 输出必须包含版本号、配置、等价性结论、时间与全部逻辑成本字段。

## 自测

在 Lab 根目录执行：

```bash
make run TASK=workload-runner
```

完成后还应手动运行 `.lab-cache/bin/student/list_workload --profile head-churn --size 4096 --operations 2000 --json`（Windows 可执行文件带 `.exe`），确认输出是合法 JSON。`--ops` 是 `--operations` 的短别名。
