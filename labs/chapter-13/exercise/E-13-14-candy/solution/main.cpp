#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() { int n; if (!(cin >> n)) return 0; vector<int> r(n), c(n, 1); for (int& x : r) cin >> x; for (int i = 1; i < n; ++i) if (r[i] > r[i - 1]) c[i] = c[i - 1] + 1; for (int i = n - 2; i >= 0; --i) if (r[i] > r[i + 1]) c[i] = max(c[i], c[i + 1] + 1); long long answer = 0; for (int x : c) answer += x; cout << answer << '\n'; }
