#include <iostream>
#include <queue>
#include <iomanip>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    priority_queue<int> maxHeap;
    priority_queue<int, vector<int>, greater<int>> minHeap;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        if (maxHeap.empty() || x <= maxHeap.top()) {
            maxHeap.push(x);
        } else {
            minHeap.push(x);
        }
        if ((int)maxHeap.size() > (int)minHeap.size() + 1) {
            minHeap.push(maxHeap.top()); maxHeap.pop();
        } else if ((int)minHeap.size() > (int)maxHeap.size()) {
            maxHeap.push(minHeap.top()); minHeap.pop();
        }
        double median;
        if (maxHeap.size() == minHeap.size()) {
            median = (maxHeap.top() + minHeap.top()) / 2.0;
        } else {
            median = maxHeap.top();
        }
        cout << fixed << setprecision(1) << median << '\n';
    }
    return 0;
}
