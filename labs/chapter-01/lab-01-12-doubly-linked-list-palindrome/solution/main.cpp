#include <cstddef>
#include <iostream>
#include <vector>

struct Node {
    long long value{};
    Node* prev = nullptr;
    Node* next = nullptr;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;

    Node* head = nullptr;
    Node* tail = nullptr;
    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        Node* node = new Node{v, tail, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    Node* left = head;
    Node* right = tail;
    bool ok = true;
    while (left && right && left != right && left->prev != right) {
        if (left->value != right->value) { ok = false; break; }
        left = left->next;
        right = right->prev;
    }

    std::cout << (ok ? "YES" : "NO") << '\n';
}
