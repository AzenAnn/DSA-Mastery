#include <iostream>
using namespace std;

struct Node { long long value; Node* next; };

Node* append(Node*& tail, long long value) {
    Node* node = new Node{value, nullptr};
    if (tail) tail->next = node;
    tail = node;
    return node;
}

Node* mergeLists(Node* first, Node* second) {
    if (!first) return second;
    if (!second) return first;
    if (first->value <= second->value) {
        first->next = mergeLists(first->next, second);
        return first;
    }
    second->next = mergeLists(first, second->next);
    return second;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    if (!(cin >> n >> m)) return 0;
    Node *first = nullptr, *firstTail = nullptr, *second = nullptr, *secondTail = nullptr;
    for (int list = 0; list < 2; ++list) {
        int length = list == 0 ? n : m;
        Node*& head = list == 0 ? first : second;
        Node*& tail = list == 0 ? firstTail : secondTail;
        for (int i = 0; i < length; ++i) { long long value; cin >> value; Node* node = append(tail, value); if (!head) head = node; }
    }
    Node* merged = mergeLists(first, second);
    bool firstValue = true;
    while (merged) {
        cout << (firstValue ? "" : " ") << merged->value;
        firstValue = false;
        Node* old = merged;
        merged = merged->next;
        delete old;
    }
    cout << '\n';
}
