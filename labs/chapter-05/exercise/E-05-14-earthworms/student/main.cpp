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
    sort(a.begin(), a.end(), greater<long long>());
    deque<long long> q1, q2;   // 左段、右段队列
    long long off = 0;         // 全局偏移
    size_t p = 0;
    vector<long long> cut;
    for (long long s = 1; s <= t; ++s) {
        // TODO: off += q（先计入本秒生长量）
        // TODO: 从 a[p]、q1.front()、q2.front() 中选出最大的相对值并弹出
        // TODO: x = best + off；若 s <= m 记录 x
        // TODO: 计算 left = x * u / v、right = x - left；
        //       以 left - off、right - off 入队 q1、q2
    }
    // TODO: 输出前 m 个切断值
    // TODO: 合并三个来源，加上 off 还原实际长度，升序输出
    return 0;
}
