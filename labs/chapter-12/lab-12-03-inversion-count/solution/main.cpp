#include <iostream>
#include <vector>

long long mergeCount(std::vector<long long>& arr, std::vector<long long>& tmp, int l, int r) {
    if (l >= r) {
        return 0;
    }
    int mid = l + (r - l) / 2;
    long long ans = mergeCount(arr, tmp, l, mid) + mergeCount(arr, tmp, mid + 1, r);

    int i = l, j = mid + 1, k = l;
    while (i <= mid && j <= r) {
        if (arr[i] <= arr[j]) {
            tmp[k++] = arr[i++];
        } else {
            ans += static_cast<long long>(mid - i + 1);
            tmp[k++] = arr[j++];
        }
    }
    while (i <= mid) tmp[k++] = arr[i++];
    while (j <= r) tmp[k++] = arr[j++];

    for (int p = l; p <= r; ++p) {
        arr[p] = tmp[p];
    }
    return ans;
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
    for (auto& x : a) {
        std::cin >> x;
    }

    std::cout << mergeCount(a, tmp, 0, n - 1) << '\n';
    return 0;
}
