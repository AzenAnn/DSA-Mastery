---
title: "Lab 02-03：可撤销浏览器——栈的超级大综合"
description: "用双栈导航与命令栈撤销重做，实现一个支持前进/后退与 Undo/Redo 的可撤销浏览器内核。"
order: 3
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-19"
contributors: ["Azen", "Jeff"]
status: "draft"
lab: true
labCategory: "project"
difficulty: "综合"
duration: "300～420 分钟"
---

# Lab 02-03：可撤销浏览器——栈的超级大综合

## 目标 

实现一个"可撤销浏览器"内核：它既能像真实浏览器一样前进 / 后退导航，又能在每个页面上支持撤销 / 重做输入操作。本 Lab 是**栈这一章的超级大综合**，要求你把线性结构、命令模式（Command Pattern，命令模式）、边界处理与异常安全四个工程能力整合进同一个系统。

::: info 容器范围
本 Lab 只允许使用栈语义的容器（必要时可用 `std::vector` 或链表实现栈），不使用 `queue`、`map`、`set` 或优先队列，确保考察点落在栈上。栈与队列联动的综合题是 Lab 02-05 停车场管理。
:::

## 背景阐述

你要为 DSA Mastery 课程实现一个本地工具：一个支持"前进 / 后退"导航、又能在页面内"撤销 / 重做"输入操作的浏览器内核。它把 2.3 节"栈与队列的应用"里两个最典型的场景应用（浏览器前进后退、编辑器 Undo/Redo）拼成一个完整成品——这正是"积木式"设计里"先搭小板块、再拼大成品"的收口之作。

真实浏览器（Chrome / Firefox）在实现历史记录时，背后正是栈结构：后退栈保存"我去过哪里"，前进栈保存"我退回去之后还能前进到哪里"。本 Lab 把这个思想简化成可运行、可测试的内核。

## 前置知识

- 第 1 章线性表（顺序存储或链式存储）；
- 第 2.1 节栈的 ADT（Abstract Data Type，抽象数据类型）、LIFO（Last In First Out，后进先出）语义与复杂度分析；
- 第 2.2 节队列的 ADT、FIFO（First In First Out，先进先出）语义（用于对比"为什么撤销操作选栈而非队列"）；
- 基本的 C++ 类与对象：继承、虚函数、`std::unique_ptr` 智能指针、`std::string`。

## 建议用时

300～420 分钟（5～7 小时），建议分 2～3 次提交：先做导航模块，再做 Undo/Redo，最后做跨页面存档与日志。

## 数据结构与模块总览

整个内核由导航双栈与页面内命令双栈协作完成。导航栈不能只保存 URL，而要保存完整的 `PageState`，这样后退和前进时才能连同页面内容及 Undo/Redo 历史一起恢复：

| 栈 | 作用 | 存什么 |
| --- | --- | --- |
| `back_stack_` | 后退栈 | 当前页之前访问过的完整 `PageState` |
| `forward_stack_` | 前进栈 | 从当前页后退出去、还能前进回去的完整 `PageState` |
| `current_page_->undo_stack` | 撤销栈 | 当前页已执行、可撤销的命令 |
| `current_page_->redo_stack` | 重做栈 | 当前页已撤销、可重做的命令 |

`PageState` 是只移动、不复制的页面快照。它至少包含 URL、页面文档以及该页面自己的两个命令栈。命令对象可持有指向 `PageDocument` 的引用；建议用 `std::unique_ptr<PageDocument>` 保持页面状态在移动前后的地址稳定。

## 任务

### 模块一：导航历史（必做）

实现 `Browser` 类的导航部分，公开以下 API（Application Programming Interface，应用程序接口）：

```cpp
class Browser {
public:
    void visit(const std::string& url);       // 访问新页面
    std::string back(int steps = 1);          // 后退 steps 步，返回当前页 URL
    std::string forward(int steps = 1);       // 前进 steps 步，返回当前页 URL
    std::string current() const;              // 当前页 URL
    bool can_go_back() const;                 // 是否还能后退
    bool can_go_forward() const;              // 是否还能前进
};
```

**底层**：`std::stack<PageState> back_stack_, forward_stack_;` 加一个表示当前页的 `std::optional<PageState> current_page_;`。程序启动时没有当前页，`current()` 返回空字符串。

**行为约束**（这是本模块的精华，务必逐条实现）：

| 操作 | 语义 |
| --- | --- |
| `visit(url)` | 若已有当前页，先把整个 `current_page_` 移入 `back_stack_`；首次访问不压入空页面。随后**清空 `forward_stack_`**，并创建 URL 为 `url`、文档和命令栈均为空的新页面 |
| `back(k)` | 连续 k 次：若后退栈非空，把当前 `PageState` 移入 `forward_stack_`，再把 `back_stack_` 栈顶移为当前页；若栈已空则停在当前页并提前结束 |
| `forward(k)` | 与 `back(k)` 对称，把当前 `PageState` 移入 `back_stack_`，再从 `forward_stack_` 恢复页面 |
| 初始状态执行 `back(1)` | 后退栈为空，保持“无当前页”状态并返回空字符串，不抛异常 |

::: warning 页面状态只能移动
移动 `PageState` 时必须转移其中 `std::unique_ptr` 的所有权，不能复制。每次状态转移应先完成步数、当前页和目标栈状态等业务检查，再修改导航栈。本 Lab 要求业务校验失败时状态不变；模拟 `std::bad_alloc` 等资源耗尽不在验收范围内。
:::

### 模块二：页面级 Undo / Redo（必做）

在 `Browser` 之上扩展"页面编辑"能力。核心是 **Command Pattern（命令模式）**：把每一次用户操作封装成一个命令对象，对象自带"如何执行"与"如何撤销"两种行为，入栈管理。

1. 定义抽象基类：

```cpp
class Command {
public:
    virtual ~Command() = default;
    virtual void execute() = 0;      // 正向执行
    virtual void undo() = 0;         // 反向撤销
    virtual std::string describe() const = 0;   // 例如 "INPUT hello"
};
```

2. 定义页面状态，让每个页面独立拥有文档与命令历史：

```cpp
struct PageDocument {
    std::string text;
};

struct PageState {
    std::string url;
    std::unique_ptr<PageDocument> document;
    std::stack<std::unique_ptr<Command>> undo_stack;
    std::stack<std::unique_ptr<Command>> redo_stack;
};
```

3. 为当前页面提供三个 API：

```cpp
void doCommand(std::unique_ptr<Command> cmd);   // 执行并压入 undo 栈
bool undo();                                    // 撤销一次
bool redo();                                    // 重做一次
```

**行为约束**：

| 操作               | 语义                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `doCommand(cmd)` | 没有当前页或 `cmd` 不满足业务前置条件（见模块三）→ 抛异常，不执行、不压栈；否则执行 `execute()`，成功后把命令移入当前页的 `undo_stack`，并**清空当前页的 `redo_stack`** |
| `undo()` | 当前页不存在或其 `undo_stack` 为空 → 返回 `false`；否则先通过栈顶指针执行 `undo()`，成功后再把该指针移出并弹栈，最后移入同一页面的 `redo_stack`，返回 `true` |
| `redo()` | 当前页不存在或其 `redo_stack` 为空 → 返回 `false`；否则先通过栈顶指针执行 `execute()`，成功后再把该指针移出并弹栈，最后移回同一页面的 `undo_stack`，返回 `true` |

### 模块三：命令样例与业务约束（必做）

实现至少 3 个具体 `Command` 子类，并落地一条业务约束：

1. `InputCommand`：模拟"在某表单输入文本"，`undo()` 应移除这段输入；
2. `SubmitCommand`：模拟"提交表单"，**业务约束：只有上一条命令是 `InputCommand` 时才能执行**；
3. `ClearCommand`：清空当前页输入，`undo()` 应恢复清空前的文本。

业务约束可以由 `Browser::doCommand` 在执行前检查 `undo_stack_.top()` 是否为 `InputCommand`，也可以让命令暴露独立的 `validate()`。不满足时抛异常，由命令行驱动层捕获并打印日志，程序不崩溃。不要让 `Browser` 一边声明向调用方抛异常，一边在内部吞掉同一异常。

本 Lab 要求三种具体命令在业务校验通过后提供可回滚的状态转换：先准备可能分配失败的新字符串或快照，再用不抛异常的交换提交结果。这样，`execute()` 或 `undo()` 失败时不会留下半次修改。至于向另一个命令栈压入 `unique_ptr` 时发生的内存耗尽，不纳入本 Lab 的模拟验收范围，设计说明中应明确这一边界。

### 模块四：结构化日志（必做）

每次状态变化都打印一行日志，使读者能够追踪导航栈与命令栈的转移：

```
[10:01:23] visit  https://sysu.edu.cn          | current=sysu.edu.cn          | back=[home]                    | fwd=[]
[10:01:31] visit  https://cs.sysu.edu.cn       | current=cs.sysu.edu.cn        | back=[home, sysu.edu.cn]       | fwd=[]
[10:02:05] back(1)                              | current=sysu.edu.cn           | back=[home]                    | fwd=[cs.sysu.edu.cn]
[10:02:20] DO INPUT "hello"                     | undo=[INPUT hello]            | redo=[]
[10:02:25] UNDO                                 | undo=[]                       | redo=[INPUT hello]
```

建议封装一个 `Logger` 类，统一输出时间戳、动作、当前页与四个栈的实时快照。若目标是从日志**完整重建页面文档**，还必须额外记录命令参数、页面文档内容或可重放事件；仅记录栈中命令名称不够。

## 输入输出格式（命令行）

`main()` 从 `stdin` 逐行读指令，支持：

| 指令                | 含义                    |
| ----------------- | --------------------- |
| `VISIT <url>`     | 访问新页面                 |
| `BACK [k]`        | 后退（缺省 1 步），输出当前页      |
| `FORWARD [k]`     | 前进（缺省 1 步），输出当前页      |
| `DO INPUT <text>` | 在当前页执行输入命令            |
| `DO SUBMIT`       | 提交（需先有输入）             |
| `DO CLEAR`        | 清空输入                  |
| `UNDO`            | 撤销一次                  |
| `REDO`            | 重做一次                  |
| `HISTORY`         | 打印导航历史 + Undo/Redo 状态 |
| `EXIT`            | 退出并打印统计               |

### 示例输入

```input
VISIT https://home.sysu.edu.cn
VISIT https://cs.sysu.edu.cn
VISIT https://dsa.sysu.edu.cn/lab02
BACK 1
BACK 1
FORWARD 2
VISIT https://github.com
DO INPUT "lab02-03 = done"
DO SUBMIT
UNDO
REDO
HISTORY
EXIT
```

### 示例输出

```output
[10:00:00] visit  https://home.sysu.edu.cn    | current=home.sysu.edu.cn       | back=[]            | fwd=[]
[10:00:05] visit  https://cs.sysu.edu.cn      | current=cs.sysu.edu.cn         | back=[home]        | fwd=[]
[10:00:09] visit  https://dsa.sysu.edu.cn/lab02 | current=dsa.sysu.edu.cn/lab02 | back=[home, cs]    | fwd=[]
[10:00:15] back(1)                            | current=cs.sysu.edu.cn         | back=[home]        | fwd=[dsa]
[10:00:20] back(1)                            | current=home.sysu.edu.cn       | back=[]            | fwd=[dsa, cs]
[10:00:25] forward(2)                         | current=dsa.sysu.edu.cn/lab02 | back=[home, cs]    | fwd=[]
[10:00:30] visit  https://github.com          | current=github.com             | back=[home, cs, dsa] | fwd=[]   # 前进栈被清空
[10:00:40] DO INPUT "lab02-03 = done"         | undo=[INPUT]                   | redo=[]
[10:00:42] DO SUBMIT                          | undo=[INPUT, SUBMIT]           | redo=[]
[10:00:45] UNDO                               | undo=[INPUT]                   | redo=[SUBMIT]
[10:00:48] REDO                               | undo=[INPUT, SUBMIT]           | redo=[]
HISTORY:
  back_stack_  = [home.sysu.edu.cn, cs.sysu.edu.cn, dsa.sysu.edu.cn/lab02]
  current      = github.com
  forward_stack_ = []
  undo_stack_  = [INPUT "lab02-03 = done", SUBMIT]
  redo_stack_  = []
EXIT
```

## 错误样例测试（必须通过）

请把下表每一行写成一条测试用例，程序**不得崩溃**，必须给出明确的错误信息：

| # | 错误场景     | 输入                 | 预期行为                             |
| - | -------- | ------------------ | -------------------------------- |
| 1 | 初始状态后退 | 启动后直接 `BACK 1` | 返回空字符串，不崩溃，仍保持无当前页状态 |
| 2 | 后退步数超过历史 | 访问 2 页后 `BACK 99`  | 停在最早可达页，不越界                      |
| 3 | 无输入直接提交  | 新页直接 `DO SUBMIT`   | 抛出"未输入不可提交"，不压栈，`undo_stack_` 为空 |
| 4 | 空撤销      | 新页直接 `UNDO`        | 返回失败信息，程序继续运行                    |
| 5 | 空重做      | 撤销后把可重做项耗尽再 `REDO` | 返回失败信息，不崩溃                       |
| 6 | 非法步数     | `BACK abc`         | 提示"步数必须是整数"，跳过该行                 |
| 7 | 未知指令     | `FLY to moon`      | 提示"未知指令"，跳过该行                    |
| 8 | 访问空 URL  | `VISIT ""`         | 拒绝访问，当前页不变                       |

## 提示点与易错点

- **前进栈何时清空**：只有 `visit()` 清空 `forward_stack_`，`back()`/`forward()` 都不清空。很多同学在 `back()` 里误清前进栈，导致"后退再前进"失败。这是本 Lab 最容易错的一处，先写测试再写实现。
- **导航栈必须保存完整页面状态**：切换页面时要把 URL、文档与 Undo/Redo 栈作为一个 `PageState` 整体移动。只保存 URL 或额外维护一个单独的存档栈，都无法同时保证反复后退、前进和重复 URL 场景下恢复正确状态。
- **`back()` 越界用"提前结束"而非抛异常**：真实浏览器的后退按钮在没历史时是灰的，不是弹窗报错。语义上应"尽力后退，不足则停"。
- **`doCommand` 预检要在 `execute()` 之前**：先验证业务约束，再准备新状态并提交修改；业务验证或命令执行失败时，页面与两个命令栈都必须保持不变。不要把这一业务保证扩大成“可以恢复所有内存耗尽错误”。
- **智能指针转移所有权**：`undo_stack_` 保存 `std::unique_ptr<Command>`。`undo()` / `redo()` 应先通过当前栈顶指针完成命令操作；成功后再把指针 `move` 到局部变量、弹栈并移入另一个栈。不能先 `pop()` 再访问已经删除的栈顶，也不能复制命令对象。
- **为什么是栈不是队列**：撤销"最后一步操作"是典型的 LIFO；如果用队列会先撤销最早的操作，违背直觉。想一想：`visit` 页面后"前进栈清空"，等价于什么数据结构操作？

## 复杂度分析要求

在说明文档里回答：

1. 导航模块 `visit` / `back` / `forward` 单次操作的时间复杂度与空间复杂度各是多少？
2. `undo` / `redo` 单次操作的复杂度？
3. 两个导航栈保存完整 `PageState` 时，在最坏情况下（访问 N 个页面、每个页面 K 条命令）的总空间复杂度？
4. 用队列代替 `back_stack_` 会发生什么？给出一个具体反例（用 3 个 URL 演示）。

## 提交物

1. 完整可运行源码，建议目录 `labs/chapter-02/lab-02-03-undoable-browser/`：
   - `browser.h` / `browser.cpp`（导航 + Undo/Redo + 存档）
   - `command.h` / `command.cpp`（`Command` 基类与三个子类）
   - `logger.h` / `logger.cpp`（结构化日志）
   - `main.cpp`（命令行驱动）
2. 运行结果输出：覆盖示例输入、错误样例测试表全部 8 条、验收清单全部用例。
3. 设计说明（500～800 字），覆盖上文"复杂度分析要求"的 4 个问题。
4. 单元测试：每个 API 至少一组正常用例 + 一组边界用例（可用 GoogleTest 或简易 `assert`）。

## 验收标准

### 模块一：导航历史

- [ ] 连续 `visit` 三个 URL 后，`back(2)` 到达第一个 URL
- [ ] `back(99)` 在超过历史长度时停在最早页，不崩溃
- [ ] `forward(99)` 在超过前进栈长度时停在最远页，不崩溃
- [ ] `visit(new_url)` 后 `forward_stack_` 被清空（关键行为）
- [ ] `can_go_back()` / `can_go_forward()` 与栈空状态一致
- [ ] 无任何 `visit` 时，`back(1)` 返回空字符串并保持无当前页状态

### 模块二：Undo / Redo

- [ ] `doCommand` 后对应命令出现在 `undo_stack_` 顶，`redo_stack_` 清空
- [ ] `undo()` 把命令从 undo 栈移到 redo 栈，反向操作可观测
- [ ] `redo()` 把命令从 redo 栈移回 undo 栈，重做可观测
- [ ] `visit(new_url)` 后旧的完整 `PageState` 进入后退栈，新页从空文档、空命令栈开始
- [ ] `back()` / `forward()` 反复切换时，每页文档与 Undo/Redo 栈都恢复为离开时状态
- [ ] 重复访问同一 URL 时，各次访问仍作为独立 `PageState`，不会按 URL 错配历史

### 模块三：业务约束

- [ ] `SubmitCommand` 无前置 `InputCommand` 时 `doCommand` 抛异常、不压栈
- [ ] `ClearCommand` `undo()` 一次能恢复清空前文本

### 模块四：健壮性与日志

- [ ] 错误样例测试表 8 条全部通过，无一次崩溃
- [ ] 每次状态变化都打印日志，能追踪导航栈与命令栈；若声称可重建页面文档，日志还包含足够的命令参数或文档快照
- [ ] 退出时所有智能指针正确释放（可用 AddressSanitizer 或 Valgrind 验证无泄漏）

## 加分项（任选 ≥ 1 项）

- **持久化**：把导航历史序列化到文件，下次启动恢复。提示：写文件前先写栈长度，再依次写栈元素（栈序列化）。
- **多标签页**：用栈实现"标签页栈"，每个标签内嵌一个独立 `Browser`，栈顶是当前可见标签。
- **地址栏预测**：维护一个全局栈存"最近访问的 N 个 URL"，输入前缀时给出提示（需扫描栈，O(N)）。
- **可视化**：每秒输出一次 HTML 快照，便于调试时肉眼验证栈状态。

## 延伸思考

1. 真实浏览器的"后退 30 天"历史是按时间排序的线性表，为什么这里用栈就够建模前进/后退？
2. 如果页面级操作不是"栈式撤销"，而是"选择性撤销某一步"，栈还够用吗？需要换成什么结构？（提示：这指向后续章节的链表 / 树）
3. 导航栈直接保存 `PageState` 与使用哈希表（`unordered_map<url, 页面状态>`）各有什么取舍？为什么仅按 URL 查状态无法正确区分同一 URL 的多次独立访问？
