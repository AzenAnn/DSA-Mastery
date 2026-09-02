#include <iostream>
#include <vector>
using namespace std;

struct Node { long long value; Node* next; };

Node* mergeTwo(Node* a, Node* b) {
    if (!a) return b;
    if (!b) return a;
    if (a->value <= b->value) { a->next = mergeTwo(a->next, b); return a; }
    b->next = mergeTwo(a, b->next); return b;
}

Node* mergeRange(vector<Node*>& lists, int left, int right) {
    if (left > right) return nullptr;
    if (left == right) return lists[left];
    int mid = left + (right - left) / 2;
    return mergeTwo(mergeRange(lists, left, mid), mergeRange(lists, mid + 1, right));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int k;
    if (!(cin >> k)) return 0;
    vector<Node*> lists(k, nullptr);
    for (int i = 0; i < k; ++i) {
        int n; cin >> n;
        Node* tail = nullptr;
        for (int j = 0; j < n; ++j) {
            long long value; cin >> value;
            Node* node = new Node{value, nullptr};
            if (!lists[i]) lists[i] = node; else tail->next = node;
            tail = node;
        }
    }
    Node* merged = mergeRange(lists, 0, k - 1);
    bool first = true;
    while (merged) {
        cout << (first ? "" : " ") << merged->value; first = false;
        Node* old = merged; merged = merged->next; delete old;
    }
    cout << '\n';
}
