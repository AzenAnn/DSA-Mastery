# Design：线性表第 3、4 篇教材落地

## Architecture and Boundaries

本任务沿用现有 VitePress 内容链路，不新增运行时能力：

```text
Markdown 正文与 frontmatter
  -> validate-content.mjs
  -> content-index.ts 统一收集与课程编排映射
  -> VitePress sidebar / search / prev-next / rewrite
  -> dist/pages
  -> artifact check + Pages-base Playwright
```

课程正文仍以 `content/chapter-*/*.md` 为唯一事实来源。`.vitepress/content-index.ts` 只修正线性表章节的 `sourcePath` 映射，不复制标题或正文，不改变收集、排序与路由算法。

## File Plan

| 文件 | 设计动作 |
| --- | --- |
| `content/chapter-01-linear-list/03-linked-list.md` | 在保留源路径和 URL 的前提下重写为完整链表演进文章 |
| `content/chapter-01-linear-list/04-comparison-and-selection.md` | 新增顺序表/链表比较与选型文章 |
| `content/chapter-01-linear-list/00-overview.md` | 补充第 4 篇导览并校准章节学习路径 |
| `content/README.md` | 更新线性表目录示例 |
| `.vitepress/content-index.ts` | 把线性表 `lessonSources` 对齐为实际的 00～04 文件 |
| `tests/pages-navigation.spec.mjs` | 用最小断言覆盖移动侧栏中新文章与代表性渲染能力 |

## Article 3 Structure

1. 学习目标与运行示例：用一组需要频繁中间插删的数据引出连续存储搬移。
2. 3.1 离散存储引入：地址不连续、逻辑顺序连续；明确节点结构。
3. 3.2 重构路线：
   - 裸节点暴露造成所有权、空指针、长度维护问题；
   - 封装 `SinglyLinkedList`；
   - 缓存 `size_` 并写出维护不变量。
4. 3.3 dummy head：用“头插/中插同一代码路径”解释哨兵价值。
5. 3.4 双向循环哨兵：使用一个 sentinel 表示空表、头和尾；解释四次链接更新与尾删。
6. 例题采用“题面 → 状态图/推导 → 代码或答案 → 复杂度”的格式；答案较长时用 VitePress `details`。
7. 末尾链接现有单链表 Lab，完整工程与黑盒测试留给 Lab。

## Article 4 Structure

1. 先用同一操作模型比较顺序表、单链表和双向循环哨兵链表。
2. 性能矩阵同时呈现渐近复杂度、定位前提、局部性和空间开销。
3. Cache 结论只解释机制：连续元素提升空间局部性，节点跳转可能导致更多 cache miss；不承诺固定倍数。
4. 决策树先问“是否高频随机访问”，再问“是否已持有稳定节点/迭代器”“是否高频两端操作”“是否受内存与局部性约束”。
5. 场景例题包含至少：读多写少排行榜、持有当前节点的播放列表或撤销历史、LRU（哈希定位 + 双向链表调整顺序）、队列选型反例（`deque` 往往比裸链表更实用）。
6. C++ 片段展示容器接口和组合结构的关键操作，解释选择依据，不复制标准库实现。

## Code Contracts

- 示例使用 C++17 能力；避免依赖平台专有扩展。
- 裸指针示例必须明确谁负责 `delete`，容器类提供析构并禁止未经实现的浅拷贝，避免教材代码示范双重释放。
- 单链表保持：dummy head 永远存在；`size_` 等于有效节点数；最后节点 `next == nullptr`。
- 双向循环哨兵保持：空表 `sentinel.next == &sentinel` 且 `sentinel.prev == &sentinel`；任意相邻节点满足 `x.next->prev == x` 与 `x.prev->next == x`。
- 任何 `O(1)` 插删结论都写明调用者已经持有目标节点或其前驱；按下标定位仍为 `O(n)`。

## Compatibility

- `03-linked-list.md` 不改名，因此现有 `/learn/chapter-01-linear-list/03-linked-list/` URL 保持兼容。
- 新页面按内容契约生成 `/learn/chapter-01-linear-list/04-comparison-and-selection/`。
- 不修改 rewrite、base 或主题；本地 `/` 与 Pages `/DSA-Mastery/` 使用同一源 URL。
- 课程编排映射从不存在的未来拆分页切换为本任务实际交付页；全局自动发现仍保持不变。

## Risks and Mitigations

| 风险 | 缓解 |
| --- | --- |
| 链接更新顺序错误导致丢链或断开的反向链接 | 用不变量、操作前后图和可运行断言共同验证 |
| 裸指针示例出现泄漏、浅拷贝或双重释放 | 提供析构、删除拷贝操作，并用编译运行检查 |
| 把 cache、节点字节数写成绝对结论 | 明确硬件、ABI、对齐和分配器条件，只给机制和典型量级 |
| 新页生成但侧栏缺失 | 同步修正 `lessonSources`，浏览器断言第 3、4 篇可见 |
| 长文影响移动阅读 | 控制段落长度，使用小节、表格、callout 和折叠答案，并做 390px 检查 |

## Rollback

本任务没有数据迁移。若需要回退，只需恢复第 3 篇、章首页、索引与测试，删除新第 4 篇；`dist/pages` 和预览日志均为生成物，不进入提交。
