#include <algorithm>
#include <iostream>
#include <vector>

struct Node {
    long long sum;
    long long bestPrefix;
    long long bestSuffix;
    long long bestSubarray;
};

Node divideAndConquer(const std::vector<long long>& a, int l, int r) {
    if (l == r) {
        return {a[l], a[l], a[l], a[l]};
    }
    int mid = l + (r - l) / 2;
    Node left = divideAndConquer(a, l, mid);
    Node right = divideAndConquer(a, mid + 1, r);

    Node cur{};
    cur.sum = left.sum + right.sum;
    cur.bestPrefix = std::max(left.bestPrefix, left.sum + right.bestPrefix);
    cur.bestSuffix = std::max(right.bestSuffix, right.sum + left.bestSuffix);
    cur.bestSubarray = std::max({left.bestSubarray, right.bestSubarray, left.bestSuffix + right.bestPrefix});
    return cur;
}

int main() {
    int n;
    std::cin >> n;
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }

    std::vector<long long> a(n);
    for (auto& v : a) {
        std::cin >> v;
    }

    std::cout << divideAndConquer(a, 0, n - 1).bestSubarray << '\n';
    return 0;
}
