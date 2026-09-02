#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>

struct Info {
    long long sum;
    long long bestPrefix;
    long long bestSuffix;
    long long bestSub;
};

Info solve(const std::vector<long long>& a, int l, int r) {
    if (l == r) {
        long long v = a[l];
        return {v, v, v, v};
    }
    int mid = l + (r - l) / 2;
    Info L = solve(a, l, mid);
    Info R = solve(a, mid + 1, r);

    Info cur;
    cur.sum = L.sum + R.sum;
    cur.bestPrefix = std::max(L.bestPrefix, L.sum + R.bestPrefix);
    cur.bestSuffix = std::max(R.bestSuffix, R.sum + L.bestSuffix);
    cur.bestSub = std::max({L.bestSub, R.bestSub, L.bestSuffix + R.bestPrefix});
    return cur;
}

int main() {
    int n = 0;
    std::cin >> n;
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }

    std::vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }

    if (n == 1) {
        std::cout << a[0] << '\n';
        return 0;
    }
    std::cout << solve(a, 0, n - 1).bestSub << '\n';
    return 0;
}
