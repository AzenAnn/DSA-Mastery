---
title: "7.3 A* 寻路可视化"
description: "通过交互式网格理解 A* 如何结合实际代价与启发式估计寻找最短路径。"
order: 3
chapter: 7
chapterTitle: "图的遍历与应用"
updated: "2026-08-24"
contributors: ["Azen"]
status: "draft"
---

<script setup>
import { withBase } from "vitepress";

const demoUrl = withBase("/demos/astar-pathfinding.html");
</script>

# 7.3 A* 寻路可视化

A* 既记录从起点到当前状态已经付出的代价，也估计当前状态到终点还需要多远，并优先探索总评分较小的候选：

$$
f(n)=g(n)+h(n).
$$

- $g(n)$：从起点到当前节点的已知代价；
- $h(n)$：从当前节点到终点的启发式估计；
- $f(n)$：优先队列中的综合评分。

若 $h(n)=0$，A* 退化为 Dijkstra。若启发式从不高估真实剩余代价，并配合正确的重复状态处理，A* 可以保持最优性；更有信息量的启发式通常减少无关探索。

## 交互式演示

点击“播放”观察完整过程，也可以逐步前进、拖动时间线、画墙或移动起点和终点。开放集表示已发现但尚未展开的候选，关闭集表示已经展开的格子，最终路径在到达终点后回溯得到。

<iframe
  :src="demoUrl"
  title="A* 寻路交互式可视化"
  class="astar-demo-frame"
  loading="lazy"
></iframe>

::: tip 观察三个对照
分别尝试无障碍网格、只有一条窄通道的网格，以及需要远离终点绕行的网格。比较开放集大小、节点展开顺序和最终路径，理解启发式只改变搜索效率，不应改变满足前提时的最优结果。
:::

<style scoped>
.astar-demo-frame {
  display: block;
  width: 100%;
  height: 980px;
  margin: 20px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--course-code-bg);
}

@media (max-width: 720px) {
  .astar-demo-frame {
    height: 1500px;
  }
}
</style>
