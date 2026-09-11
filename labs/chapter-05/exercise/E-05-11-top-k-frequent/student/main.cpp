#include <algorithm>
#include <iostream>
#include <queue>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;

// TODO: 实现小根堆比较器 Cmp
//   弹出优先级：次数少者先出；次数相同则值大者先出

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    unordered_map<long long, int> cnt;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        ++cnt[x];
    }
    // TODO: 声明小根堆（元素为 pair<次数, 值>，比较器为 Cmp）
    // TODO: 逐个把 (次数, 值) 入堆，堆大小超过 k 就弹出堆顶
    // TODO: 取出堆中所有值、升序排序并输出
    return 0;
}
