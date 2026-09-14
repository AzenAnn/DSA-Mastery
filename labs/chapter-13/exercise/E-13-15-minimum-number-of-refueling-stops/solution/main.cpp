#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main() { long long target, fuel; int n; if (!(cin >> target >> fuel >> n)) return 0; vector<pair<long long,long long>> stations(n); for (auto& s : stations) cin >> s.first >> s.second; priority_queue<long long> available; int stops = 0; for (auto [position, added] : stations) { while (fuel < position && !available.empty()) { fuel += available.top(); available.pop(); ++stops; } if (fuel < position) { cout << -1 << '\n'; return 0; } available.push(added); } while (fuel < target && !available.empty()) { fuel += available.top(); available.pop(); ++stops; } cout << (fuel >= target ? stops : -1) << '\n'; }
