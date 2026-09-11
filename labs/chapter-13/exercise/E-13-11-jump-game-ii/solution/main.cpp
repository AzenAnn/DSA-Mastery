#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() { int n; if (!(cin >> n)) return 0; vector<int> a(n); for (int& x : a) cin >> x; int jumps = 0, end = 0, farthest = 0; for (int i = 0; i + 1 < n; ++i) { farthest = max(farthest, i + a[i]); if (i == end) { ++jumps; end = farthest; } } cout << jumps << '\n'; }
