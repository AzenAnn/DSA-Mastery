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

    Node* curr = head;
    while (curr && curr->next) {
        Node* a = curr;
        Node* b = curr->next;
        Node* p = a->prev;
        Node* s = b->next;

        b->prev = p;
        b->next = a;
        a->prev = b;
        a->next = s;

        if (p) p->next = b;
        else head = b;
        if (s) s->prev = a;

        curr = a->next;
    }

    bool first = true;
    for (Node* p = head; p; p = p->next) {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
    }
    std::cout << '\n';
}
