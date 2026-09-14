#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    // TODO: 读入树的边，构建邻接表

    if (n == 1) {
        cout << "0.00\nNODE 1\n";
        return 0;
    }

    // TODO: 实现 BFS/DFS，找最远点
    // 第一次从任意点出发找 A
    // 第二次从 A 出发找 B，同时记录父节点和边权

    // TODO: 从 B 沿父节点回溯到 A，累加边权
    // 找到累计距离首次 >= D/2 的位置
    // 若恰好等于，中心为节点
    // 否则中心在边内部

    // TODO: 输出半径和中心位置
    // 注意：边上输出时保证 u < v

    return 0;
}
