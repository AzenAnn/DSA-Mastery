# Lab 内容与复现契约

## 1. Scope / Trigger

新增或修改 `labs/chapter-*/lab-*/README.md`、Lab 内实现/测试、Lab 索引或实验验收方式时适用。

## 2. Signatures

```text
labs/chapter-NN/lab-NN-LL-slug/README.md
  -> /labs/chapter-NN/lab-NN-LL-slug/
```

Lab 由同一个内容索引收集，`kind` 固定为 `lab`；其 `chapter + order` 只在 Lab 集合内唯一。

## 3. Contracts

Lab 继承教材八个字段，并额外要求：

| 字段 | 约束 |
| --- | --- |
| `lab` | YAML 布尔值 `true`，不能写字符串 `"true"` |
| `difficulty` | 非空、面向读者的级别，如“入门”“基础” |
| `duration` | 非空、可理解的预计时长，如“45～60 分钟” |

README 至少说明：

- 可检查的学习目标和前置知识；
- 环境、输入、操作步骤和预期输出；
- 正常、边界、错误三类情况；
- 完成清单、思考题和复盘；
- 如果有代码，给出从干净检出开始的精确命令。

完整实现、`src/`、`tests/`、fixtures 和样例放在该 Lab 目录，不复制进多个教材页面。命令不得依赖作者机器的全局包、秘密文件或未说明服务。

## 4. Validation & Error Matrix

| 条件 | 结果 |
| --- | --- |
| 目录编号、chapter、order 不一致 | 内容校验失败 |
| `lab` 不是布尔值 true | 内容校验失败 |
| 缺 difficulty/duration | 内容校验失败 |
| README 没有客观完成标准 | Review blocking |
| 声称运行成功但 PR 无命令和结果 | Review blocking |
| 页面未进入 Labs 索引或搜索 | 构建/浏览器测试失败 |

## 5. Good / Base / Bad Cases

- Good：实现顺序表 Lab，明确空表、非法下标、扩容边界，并给测试断言。
- Base：纯纸笔学习地图 Lab 可以没有源码，但仍有步骤和可检查产物。
- Bad：“实现一个链表并确保正确”，没有接口、边界、运行命令或验收证据。

## 6. Tests Required

- 临时 Lab fixture 必须被内容校验、Labs 索引、搜索和 build 自动发现，并在 `finally` 删除。
- 有代码的 Lab 执行其 README 命令，PR 记录退出码和关键断言。
- Playwright 从 Labs 索引实际点击至少一个 Lab；检查标题、时长、状态和无同源错误。
- Review Owner 从清晰环境独立复现至少一个关键步骤或反例。

## 7. Wrong vs Correct

### Wrong

```yaml
lab: "true"
duration: "很快"
```

```md
## 验收
- [ ] 程序看起来正常
```

### Correct

```yaml
lab: true
difficulty: "基础"
duration: "90～120 分钟"
```

```md
## 验收
- [ ] 空表删除返回约定错误且结构不变
- [ ] 首、中、尾插入后的遍历结果与期望序列一致
```
