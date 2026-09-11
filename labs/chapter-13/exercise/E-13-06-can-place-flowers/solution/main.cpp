#include <iostream>
#include <vector>
using namespace std;
int main() { int n, need; if (!(cin >> n >> need)) return 0; vector<int> bed(n); for (int& x : bed) cin >> x; int planted = 0; for (int i = 0; i < n; ++i) if (bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i + 1 == n || bed[i + 1] == 0)) { bed[i] = 1; ++planted; } cout << (planted >= need ? "true" : "false") << '\n'; }
