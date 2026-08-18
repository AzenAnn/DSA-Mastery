#include <cstddef>
#include <iostream>
#include <vector>

struct Node {
    long long value{};
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
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    std::size_t k = 0;
    std::cin >> k;

    Node dummy{0, head};
    Node* fast = &dummy;
    Node* slow = &dummy;

    for (std::size_t i = 0; i < k; ++i) fast = fast->next;
    while (fast->next) {
        fast = fast->next;
        slow = slow->next;
    }

    Node* target = slow->next;
    slow->next = target->next;
    delete target;

    bool first = true;
    for (Node* p = dummy.next; p; p = p->next) {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
    }
    std::cout << '\n';
}
