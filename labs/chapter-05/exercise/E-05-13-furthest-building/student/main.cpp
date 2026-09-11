#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long b;
    int l;
    cin >> n >> b >> l;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    // TODO: 声明存储“高度差”的小根堆
    for (int i = 0; i + 1 < n; ++i) {
        int diff = h[i + 1] - h[i];
        // TODO: 跳过非正差值；入堆；
        //       堆大小超过 l 时弹出最小差值用砖支付；
        //       砖变负则输出 i 并结束
    }
    cout << n - 1 << '\n';
    return 0;
}
