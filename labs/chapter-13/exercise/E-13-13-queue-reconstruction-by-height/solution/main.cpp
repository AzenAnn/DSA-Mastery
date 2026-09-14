#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() { int n; if (!(cin >> n)) return 0; vector<pair<int,int>> people(n); for (auto& p : people) cin >> p.first >> p.second; sort(people.begin(), people.end(), [](auto a, auto b) { return a.first != b.first ? a.first > b.first : a.second < b.second; }); vector<pair<int,int>> answer; for (auto p : people) answer.insert(answer.begin() + p.second, p); for (auto [h, k] : answer) cout << h << ' ' << k << '\n'; }
