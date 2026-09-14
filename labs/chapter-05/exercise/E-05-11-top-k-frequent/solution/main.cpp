#include <algorithm>
#include <iostream>
#include <queue>
#include <unordered_map>
#include <utility>
#include <vector>
using namespace std;

// 小根堆比较器：次数少者在顶；次数相同则值大者在顶（大值先被淘汰）
struct Cmp {
    bool operator()(const pair<int, long long>& a, const pair<int, long long>& b) const {
        if (a.first != b.first) return a.first > b.first;
        return a.second < b.second;
    }
};

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
    // 大小为 k 的小根堆：保存当前最强的 k 个候选
    priority_queue<pair<int, long long>, vector<pair<int, long long>>, Cmp> heap;
    for (auto& [v, c] : cnt) {
        heap.push({c, v});
        if ((int)heap.size() > k) heap.pop();   // 淘汰最弱候选
    }
    vector<long long> ans;
    while (!heap.empty()) {
        ans.push_back(heap.top().second);
        heap.pop();
    }
    sort(ans.begin(), ans.end());
    for (int i = 0; i < (int)ans.size(); ++i) {
        if (i) cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
    return 0;
}
