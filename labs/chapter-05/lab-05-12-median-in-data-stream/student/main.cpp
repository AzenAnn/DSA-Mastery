#include <iostream>
#include <queue>
#include <iomanip>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    priority_queue<int> maxHeap;
    priority_queue<int, vector<int>, greater<int>> minHeap;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        // TODO: 将 x 插入合适的堆中
        // TODO: 平衡两个堆的大小
        double median = 0;
        // TODO: 计算当前中位数
        cout << fixed << setprecision(1) << median << '\n';
    }
    return 0;
}
