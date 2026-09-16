# 设计

沿用 Lab v1 和现有内容索引，不修改评分器或手写侧栏。新增题 order 使用 16–27，避开现有 Theory/Project 的 order。缓存残留不代表正式题目，按 README/lab.json 识别。

| ID | slug | 考点 |
| --- | --- | --- |
| 09 | bracket-matching | 多类括号嵌套与错误 |
| 10 | rpn-evaluation | 操作数顺序、负数除法 |
| 11 | infix-to-postfix | 优先级、结合性、括号 |
| 12 | circular-next-greater | 循环遍历、严格大于 |
| 13 | stack-using-queues | FIFO 转换为 LIFO |
| 14 | shared-two-stacks | 两端共享空间、空满边界 |
| 15 | linked-queue | 链式 FIFO、空队列尾指针 |
| 16 | base-conversion | 余数入栈、零与多进制 |
| 17 | adjacent-duplicate-removal | 连锁消除与栈状态 |
| 18 | josephus-order | 循环报数、完整出队次序 |
| 19 | round-robin | 时间片、重新排队、64 位时钟 |
| 20 | multi-source-grid-bfs | 多源队列分层、障碍和不可达 |

测试由 Python 独立模型生成并读回验证，C++ 参考实现通过统一 CLI 检查。每组模块提供 fixtures()（编号映射至 name/input/output/tag 元组）与 MUTATIONS（编号映射至源码单点替换）；统一检查器负责测试文件一致性、样例、引用代码、独立 oracle 和错误变体。生成仅在显式 --write 下执行，编译物写 .lab-cache。

既有案例数高于用户要求，不删除有效测试。新题维持 draft。题源使用真实经典问题名称与链接或明确课程原创练习，不声称已核对无法访问的外部页面。
