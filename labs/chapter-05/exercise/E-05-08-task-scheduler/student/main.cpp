#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> tasks(n);
    for (int i = 0; i < n; ++i) cin >> tasks[i];
    // TODO: 统计任务频次，用优先队列安排任务，计算最少时间
    int time = 0;
    cout << time << '\n';
    return 0;
}
