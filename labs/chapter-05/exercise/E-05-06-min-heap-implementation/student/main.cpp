#include <iostream>
#include <vector>
using namespace std;

struct MinHeap {
    vector<int> h;
    MinHeap() { h.push_back(0); }
    void push(int x) {
        // TODO: 将 x 插入最小堆并维持堆性质
    }
    int top() {
        // TODO: 返回堆顶元素（最小值），若堆空返回 -1
        return -1;
    }
    bool empty() { return h.size() <= 1; }
    int pop() {
        // TODO: 删除并返回堆顶元素，若堆空返回 -1
        return -1;
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
