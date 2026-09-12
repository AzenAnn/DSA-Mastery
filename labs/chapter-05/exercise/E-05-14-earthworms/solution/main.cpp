#include <algorithm>
#include <climits>
#include <deque>
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n, m, q, u, v, t;
    cin >> n >> m >> q >> u >> v >> t;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end(), greater<long long>());   // Q0：初始蚯蚓，降序
    deque<long long> q1, q2;                          // 切出的左段、右段（单调队列）
    long long off = 0;                                // 全局生长偏移
    size_t p = 0;
    vector<long long> cut;
    for (long long s = 1; s <= t; ++s) {
        off += q;                                     // 本秒生长量先计入偏移
        // 三队列队首取最大（相对值比较）
        long long best = LLONG_MIN;
        int which = 0;
        if (p < a.size() && a[p] > best) { best = a[p]; which = 0; }
        if (!q1.empty() && q1.front() > best) { best = q1.front(); which = 1; }
        if (!q2.empty() && q2.front() > best) { best = q2.front(); which = 2; }
        if (which == 0) ++p;
        else if (which == 1) q1.pop_front();
        else q2.pop_front();
        long long x = best + off;                     // 切断时刻的实际长度
        if (s <= m) cut.push_back(x);
        long long left = x * u / v;
        long long right = x - left;
        q1.push_back(left - off);                     // 以当前偏移为基准入队
        q2.push_back(right - off);
    }
    for (int i = 0; i < (int)cut.size(); ++i) {
        if (i) cout << ' ';
        cout << cut[i];
    }
    cout << '\n';
    // 收集第 t 秒后的实际长度并升序输出
    vector<long long> rest;
    for (; p < a.size(); ++p) rest.push_back(a[p] + off);
    for (auto x : q1) rest.push_back(x + off);
    for (auto x : q2) rest.push_back(x + off);
    sort(rest.begin(), rest.end());
    for (int i = 0; i < (int)rest.size(); ++i) {
        if (i) cout << ' ';
        cout << rest[i];
    }
    cout << '\n';
    return 0;
}
