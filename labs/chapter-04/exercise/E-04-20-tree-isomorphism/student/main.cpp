#include <bits/stdc++.h>
using namespace std;

// TODO: 实现规范编码函数 encode(u, parent, adj)
// 叶子节点返回 "()"
// 非叶子节点：递归收集子树编码，排序后拼接，用 "(" + 拼接 + ")" 包裹

// TODO: 实现求重心函数 findCentroids(n, adj)
// 1. DFS 计算子树大小 sz[u]
// 2. 对每个节点，计算删除后的最大连通块大小
// 3. 返回使最大值最小的所有节点（1个或2个）

// TODO: 对每棵树，求重心集合，计算每个重心的规范编码，放入集合中

// TODO: 比较两棵树的编码集合，有交集则输出 ISOMORPHIC，否则 NON-ISOMORPHIC

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: 读取两棵树的输入

    return 0;
}
