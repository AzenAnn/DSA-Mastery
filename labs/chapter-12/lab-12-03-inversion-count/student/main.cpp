#include <iostream>
#include <vector>

long long mergeSortCount(std::vector<long long>& a, std::vector<long long>& tmp, int l, int r) {
    if (l >= r) return 0;
    int mid = l + (r - l) / 2;
    long long cnt = mergeSortCount(a, tmp, l, mid);
    cnt += mergeSortCount(a, tmp, mid + 1, r);

    int i = l;
    int j = mid + 1;
    int k = l;
    while (i <= mid && j <= r) {
        if (a[i] <= a[j]) {
            tmp[k++] = a[i++];
        } else {
            cnt += (mid - i + 1);
            tmp[k++] = a[j++];
        }
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];

    for (int p = l; p <= r; ++p) {
        a[p] = tmp[p];
    }
    return cnt;
}

int main() {
    int n;
    std::cin >> n;
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }

    std::vector<long long> a(n);
    std::vector<long long> tmp(n);
    for (auto& v : a) std::cin >> v;
    std::cout << mergeSortCount(a, tmp, 0, n - 1) << '\n';
    return 0;
}
