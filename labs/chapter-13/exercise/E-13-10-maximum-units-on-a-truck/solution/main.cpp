#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() { int n, size; if (!(cin >> n >> size)) return 0; vector<pair<int,int>> types(n); for (auto& [boxes, units] : types) cin >> boxes >> units; sort(types.begin(), types.end(), [](auto a, auto b) { return a.second > b.second; }); long long answer = 0; for (auto [boxes, units] : types) { int take = min(size, boxes); answer += 1LL * take * units; size -= take; } cout << answer << '\n'; }
