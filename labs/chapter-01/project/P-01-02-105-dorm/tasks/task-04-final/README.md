# Task 4：105 今日热心榜

前三关已经能保存学生、结算帮送和维护任务。这一关补上系统边界，让宿管王和同学们连续执行一组操作。

## 本关交付

只修改 `student/dorm_system.cpp`。菜单、输入解析、数据显示都已提供；`DormSystem` 持有前面实现的学生表与待送链表。

| 函数 | 契约 |
| --- | --- |
| `removeStudent(id)` | 有待送引用或找不到学生时返回 false，否则调用学生表删除 |
| `removeRoom(floor, room)` | 非法寝室或任一受影响学生有待送引用时返回 -1，整批不修改；否则返回删除人数 |
| `summary()` | 只读汇总当前学生数、成功次数总和、热心值总和、待送数及全部并列榜首 |

引用检查同时覆盖帮助者与收件人。必须先检查所有受影响学生，再执行整间寝室的删除；不能先删除一个没有引用的人，后来才发现另一个不能删除。

`summary` 统计当前名单而非永久历史。合法删除某位同学后，其成功次数和热心值也从当前汇总中移除；启动新的程序会清空整个模拟。这个小系统不需要日志或文件存储。

## 全部命令

| 输入 | 输出约定 |
| --- | --- |
| `ADD id "name" floor room` | `OK ADD` 或 `ERROR ADD` |
| `UPDATE id "name" floor room` | `OK UPDATE` 或 `ERROR UPDATE` |
| `FIND id` | 一条 STUDENT 记录或 `NOT_FOUND` |
| `NAME "name"` | `MATCHES n` 后输出全部匹配记录 |
| `LIST` | `STUDENTS n` 后输出整份名单 |
| `ERASE id` | `OK ERASE` 或 `ERROR ERASE` |
| `ERASE_ROOM floor room` | `REMOVED n` 或 `ERROR ERASE_ROOM` |
| `DELIVER helper receiver` | `DELIVERED cost reward`，或失败状态加 `0 0` |
| `REQUEST task helper receiver` | 尾部加入待送单，返回 OK/ERROR REQUEST |
| `AFTER existing task helper receiver` | 在 existing 后补单，返回 OK/ERROR AFTER |
| `CANCEL task` | 返回 OK/ERROR CANCEL |
| `PENDING` | `PENDING n` 后输出任务 |
| `PROCESS` | `PROCESSED 本轮完成数 剩余任务数` |
| `SUMMARY` | 总数行、TOP 人数及每位 LEADER |
| `HELP` / `QUIT` | 显示命令 / 输出 BYE 后结束 |

STUDENT 各列为 `学号 "姓名" 楼层 房间号 体力 热心值 成功次数`；REQUEST 各列为 `任务编号 帮送者学号 收件人学号`；SUMMARY 各列为 `学生数 成功次数总和 热心值总和 待送数`。

帮送失败状态分别为 `UNKNOWN_STUDENT`、`SELF_DELIVERY`、`NO_STAMINA`。语法错误输出 `ERROR INPUT`，未知命令输出 `ERROR COMMAND`；错误行不执行，继续读取下一行。`DELIVER` 表示额外一次临时帮送，不会自动删除清单里的任务；执行清单应使用 `PROCESS`。

## 验证和交互

在本 Lab 根目录运行：

~~~powershell
pnpm lab:run -- . --task final
pnpm lab:build -- . --task final
.\.lab-cache\bin\student\dorm105_cli.exe
~~~

Linux/macOS 对应 `./.lab-cache/bin/student/dorm105_cli`。输入根 README 的完整样例；`tests/sample.in` 和 `sample.out` 是同一案例，`boundaries.in/out` 覆盖耗尽体力、重复执行和清空后汇总。

::: details 提示：不要重复维护统计
总分和总次数已经分散保存在每个学生中，汇总时扫描即可。榜首调用 Task 2，待送数量调用 Task 3。思考新增、删除学生后，如果还额外维护一份总分变量，需要同步多少地方？
:::

## 完成清单

- [ ] 待送任务中的帮助者和收件人都不能被删除。
- [ ] 批量删除失败没有删掉名单中的任何一个人。
- [ ] 换寝后执行旧任务使用新楼层。
- [ ] 连续执行两次 PROCESS 不会重复结算已完成任务。
- [ ] 汇总两次得到相同结果，不改变体力或名单。
- [ ] 完整 Project 严格评分达到 100/100。
