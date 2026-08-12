---
title: "5.4 A* 寻路可视化"
description: "通过交互式网格理解 A* 如何结合实际代价与启发式估计寻找最短路径。"
order: 4
chapter: 5
chapterTitle: "图"
updated: "2026-08-12"
contributors: ["Codex"]
status: "draft"
---

<script setup>
import { withBase } from "vitepress";

const demoUrl = withBase("/demos/astar-pathfinding.html");
</script>

# 5.4 A* 寻路可视化

A* 是一种启发式寻路算法。它既记录从起点到当前格子已经付出的代价，也估计当前格子到终点还需要多远，并优先探索总评分最小的格子。

$$
f(n) = g(n) + h(n)
$$

- $g(n)$：从起点走到当前格子的实际代价；
- $h(n)$：从当前格子到终点的估计代价；
- $f(n)$：两者之和，用于决定下一步优先探索哪个格子。

## 交互式演示

点击“播放”观察完整过程，也可以逐步前进、拖动时间线、画墙或移动起点和终点。黄色表示开放集，紫色表示已经检查的格子，绿色表示最终路径。

<iframe
  :src="demoUrl"
  title="A* 寻路交互式可视化"
  class="astar-demo-frame"
  loading="lazy"
></iframe>

<style scoped>
.astar-demo-frame {
  display: block;
  width: 100%;
  height: 980px;
  margin: 20px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: #21252b;
}

@media (max-width: 720px) {
  .astar-demo-frame {
    height: 1500px;
  }
}
</style>
