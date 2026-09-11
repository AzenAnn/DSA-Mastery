#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() { int n, k; if (!(cin >> n >> k)) return 0; vector<int> a(n); for (int& x : a) cin >> x; sort(a.begin(), a.end()); for (int i = 0; i < n && k > 0 && a[i] < 0; ++i, --k) a[i] = -a[i]; long long sum = 0; for (int x : a) sum += x; if (k % 2) sum -= 2LL * *min_element(a.begin(), a.end()); cout << sum << '\n'; }
