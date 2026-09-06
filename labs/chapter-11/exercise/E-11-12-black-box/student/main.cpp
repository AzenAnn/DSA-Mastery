#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int M, N;
    cin >> M >> N;
    vector<long long> a(M);
    for (int i = 0; i < M; ++i) cin >> a[i];
    vector<int> u(N);
    for (int i = 0; i < N; ++i) cin >> u[i];

    // TODO: 用对顶堆（大根堆 + 小根堆）维护第 i 小。
    // 提示：
    //   big（大根堆）保存当前最小的 i 个元素，small（小根堆）保存其余元素；
    //   插入时与 big.top() 比较后放进合适的堆，
    //   查询前把 big 的大小调整到恰好 i，big.top() 就是第 i 小的元素。

    return 0;
}
