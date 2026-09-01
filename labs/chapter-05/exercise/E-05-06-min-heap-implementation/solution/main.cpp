#include <iostream>
#include <vector>
using namespace std;

struct MinHeap {
    vector<int> h;
    MinHeap() { h.push_back(0); }
    void push(int x) {
        h.push_back(x);
        int i = (int)h.size() - 1;
        while (i > 1 && h[i] < h[i / 2]) {
            swap(h[i], h[i / 2]);
            i /= 2;
        }
    }
    int top() {
        return h.size() > 1 ? h[1] : -1;
    }
    bool empty() { return h.size() <= 1; }
    int pop() {
        if (empty()) return -1;
        int res = h[1];
        h[1] = h.back();
        h.pop_back();
        int i = 1, n = (int)h.size() - 1;
        while (2 * i <= n) {
            int j = 2 * i;
            if (j + 1 <= n && h[j + 1] < h[j]) j++;
            if (h[i] <= h[j]) break;
            swap(h[i], h[j]);
            i = j;
        }
        return res;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    MinHeap heap;
    while (q--) {
        char op;
        cin >> op;
        if (op == 'I') {
            int x; cin >> x;
            heap.push(x);
        } else if (op == 'D') {
            if (heap.empty()) cout << "Empty\n";
            else cout << heap.pop() << '\n';
        } else if (op == 'Q') {
            if (heap.empty()) cout << "Empty\n";
            else cout << heap.top() << '\n';
        }
    }
    return 0;
}
