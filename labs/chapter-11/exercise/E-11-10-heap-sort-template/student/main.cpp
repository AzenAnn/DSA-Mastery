#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 用堆排序把 a 从小到大输出到一行。
    // 提示：可以直接用 std::priority_queue（小根堆），
    //   把所有元素入堆后不断弹出堆顶；也可以手写小根堆。
    // 小根堆声明：priority_queue<int, vector<int>, greater<int>> pq;

    return 0;
}
