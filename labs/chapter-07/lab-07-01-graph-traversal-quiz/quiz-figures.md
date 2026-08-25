# 题库配图源（构建期生成 SVG，不面向学习者）

本文件仅用于让 `vitepress-plugin-diagrams` 在构建期生成选择题配图：构建后 SVG 会写入 `public/diagrams/`，由同目录 `quiz.json` 的题面或解析引用。学习者不需要访问本页。

## 第 4 题：BFS 分层示例图

```graphviz
digraph Q04BfsGraph {
  rankdir=LR;
  node [shape=circle];
  s -> a;
  s -> c;
  s -> d;
  c -> e;
  c -> b;
  b -> d;
  d -> c;
  e -> s;
}
```
<!-- diagram id="dfs-bfs-q04-graph" caption: "第 4 题：有向图 G 及从 s 出发的 BFS 分层" -->

## 第 5 题解析：BFS 树与 DFS 树高度对比

```graphviz
graph Q05TreeCompare {
  rankdir=TB;
  node [shape=circle];
  subgraph cluster_bfs {
    label="BFS 树（高 2）";
    s1 [label="s"];
    a1 [label="a"];
    b1 [label="b"];
    c1 [label="c"];
    d1 [label="d"];
    s1 -- a1;
    s1 -- b1;
    a1 -- c1;
    b1 -- d1;
  }
  subgraph cluster_dfs {
    label="DFS 树（高 3）";
    s2 [label="s"];
    a2 [label="a"];
    c2 [label="c"];
    b2 [label="b"];
    d2 [label="d"];
    s2 -- a2;
    a2 -- c2;
    c2 -- b2;
    b2 -- d2;
  }
}
```
<!-- diagram id="dfs-bfs-q05-trees" caption: "第 5 题解析：同一张图，BFS 树与 DFS 树的高度对比" -->

## 第 8 题解析：DFS 边分类示例图

```graphviz
digraph Q08EdgeTypes {
  rankdir=LR;
  node [shape=circle];
  1 -> 2;
  2 -> 3;
  3 -> 1;
  1 -> 4;
  4 -> 2;
}
```
<!-- diagram id="dfs-bfs-q08-graph" caption: "第 8 题解析：从 1 出发 DFS，3→1 是后向边，4→2 是交叉边" -->

## 第 15 题解析：路径计数示例图

```graphviz
digraph Q15PathCount {
  rankdir=LR;
  node [shape=circle];
  A -> B;
  A -> C;
  B -> D;
  B -> E;
  C -> D;
  C -> E;
}
```
<!-- diagram id="dfs-bfs-q15-paths" caption: "第 15 题解析：A 到 E 有 A-B-E 与 A-C-E 两条简单路径" -->

## 第 12 题：3×3 迷宫示意图

```graphviz
graph Q12Maze {
  layout=neato;
  node [shape=box, style=rounded, fixedsize=true, width=0.75, height=0.55, fontsize=15];
  s [label="S", style="filled,rounded", fillcolor="#a8d08d", pos="0,2!"];
  a [label="", pos="1,2!"];
  w01 [label="#", style="filled,rounded", fillcolor="#cfcfcf", pos="2,2!"];
  b [label="", pos="0,1!"];
  w11 [label="#", style="filled,rounded", fillcolor="#cfcfcf", pos="1,1!"];
  c [label="", pos="2,1!"];
  d [label="", pos="0,0!"];
  e [label="", pos="1,0!"];
  t [label="T", style="filled,rounded", fillcolor="#f4b183", pos="2,0!"];
  s -- a;
  s -- b;
  b -- d;
  d -- e;
  e -- t;
  c -- t;
}
```
<!-- diagram id="dfs-bfs-q12-maze" caption: "第 12 题：3×3 迷宫，S 为起点、T 为终点、# 为障碍物" -->
