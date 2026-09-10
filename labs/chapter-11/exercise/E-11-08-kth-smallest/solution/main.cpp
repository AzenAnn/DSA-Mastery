#include <cstdio>
#include <algorithm>
using namespace std;

const int MAXN = 5000000 + 5;
int a[MAXN];

int main() {
    int n, k;
    scanf("%d %d", &n, &k);
    for (int i = 0; i < n; ++i) scanf("%d", &a[i]);

    --k; // 转为 0 起下标

    int l = 0, r = n - 1;
    while (true) {
        // 三路划分：a[l..i-1] < pivot，a[i..j] == pivot，a[j+1..r] > pivot
        int pivot = a[l + (r - l) / 2];
        int i = l, j = r, p = l;
        while (p <= j) {
            if (a[p] < pivot) {
                swap(a[i++], a[p++]);
            } else if (a[p] > pivot) {
                swap(a[p], a[j--]);
            } else {
                ++p;
            }
        }
        if (k < i) {
            r = i - 1;
        } else if (k > j) {
            l = j + 1;
        } else {
            printf("%d\n", pivot);
            return 0;
        }
    }
}
