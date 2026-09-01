#include <iostream>
#include <vector>
using namespace std;

int cmp_cnt = 0; // 归并排序过程中的比较次数

// 合并两个有序子数组 a[left, mid) 与 a[mid, right)
// 使用哨兵，每次取元素都算作一次比较（与 AOJ ALDS1_5_B 的计数方式一致）
void merge(vector<int>& a, int left, int mid, int right) {
    int n1 = mid - left;
    int n2 = right - mid;
    vector<int> L(n1 + 1), R(n2 + 1);
    for (int i = 0; i < n1; ++i) L[i] = a[left + i];
    for (int i = 0; i < n2; ++i) R[i] = a[mid + i];
    const int INFTY = 2000000001; // 大于 |a[i]| ≤ 10^9 的哨兵
    L[n1] = INFTY;
    R[n2] = INFTY;

    int i = 0, j = 0;
    for (int k = left; k < right; ++k) {
        ++cmp_cnt;
        if (L[i] <= R[j]) {
            a[k] = L[i++];
        } else {
            a[k] = R[j++];
        }
    }
}

// 归并排序区间 [left, right)（左闭右开）
void merge_sort(vector<int>& a, int left, int right) {
    if (left + 1 < right) {
        int mid = (left + right) / 2;
        merge_sort(a, left, mid);
        merge_sort(a, mid, right);
        merge(a, left, mid, right);
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    merge_sort(a, 0, n);

    for (int i = 0; i < n; ++i) {
        if (i) cout << ' ';
        cout << a[i];
    }
    cout << '\n';
    cout << cmp_cnt << '\n';
}
