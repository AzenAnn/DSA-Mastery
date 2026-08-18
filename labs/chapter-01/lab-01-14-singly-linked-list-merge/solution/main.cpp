#include <cstddef>
#include <iostream>
#include <vector>

struct Node {
    long long value{};
    Node* next = nullptr;
};

Node* build_list(std::size_t n) {
    Node* head = nullptr;
    Node* tail = nullptr;
    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    return head;
}

void print_list(Node* head) {
    bool first = true;
    for (Node* p = head; p; p = p->next) {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
    }
    std::cout << '\n';
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0, m = 0;
    std::cin >> n;
    Node* a = build_list(n);
    std::cin >> m;
    Node* b = build_list(m);

    Node dummy{0, nullptr};
    Node* tail = &dummy;

    while (a && b) {
        if (a->value <= b->value) {
            tail->next = a; a = a->next;
        } else {
            tail->next = b; b = b->next;
        }
        tail = tail->next;
    }
    tail->next = a ? a : b;

    print_list(dummy.next);
}
