# 线性表工作负载评测报告

## 1. 实验环境与方法

- 操作系统 / CPU：
- 编译器、CMake 与构建类型：
- 初始规模（至少三个）：
- operations / seed / warmup / repetitions：
- 计时包含和排除的阶段：

## 2. 正确性证据

- [ ] 五类 profile 均为 `equivalent = true`
- [ ] 两种实现的最终 checksum 与观测值一致
- [ ] 越界与非法 CLI 参数行为符合 README

## 3. 数据表

| Profile | Size | Implementation | 关键计数 | Estimated bytes | Median ns |
| --- | ---: | --- | --- | ---: | ---: |
| random-read | | | | | |
| head-churn | | | | | |
| middle-churn | | | | | |
| tail-churn | | | | | |
| linear-scan | | | | | |

## 4. 原因分析

逐 profile 回答：理论复杂度是什么？定位与修改分别支付什么？计数如何支持或反驳假设？实测时间还受到哪些未控制因素影响？

## 5. 工程选型

### 高频按排名读取、低频批量重建的排行榜

- 建议、访问比例和规模前提：
- 证据与结论反转条件：

### 长期持有当前位置、频繁在附近增删的播放列表

- 建议、句柄和操作位置前提：
- 证据与结论反转条件：

## 6. 局限与复盘

- 为什么操作计数不是 CPU 周期？
- 为什么 `estimatedStorageBytes` 不等于进程真实占用？
- 为什么本实验不能直接给出精确 Cache Miss？
- 一个被测试捕获的错误及其最小回归用例：
