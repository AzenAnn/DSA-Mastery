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

    Node dummy{0, nullptr, head};
    if (head) head->prev = &dummy;

    Node* prev = &dummy;
    Node* curr = head;

    while (curr && curr->next) {
        Node* first = curr;
        Node* second = curr->next;
        Node* next_pair = second->next;

        prev->next = second;
        second->prev = prev;

        second->next = first;
        first->prev = second;

        first->next = next_pair;
        if (next_pair) next_pair->prev = first;

        prev = first;
        curr = next_pair;
    }

    head = dummy.next;
    if (head) head->prev = nullptr;

    bool first = true;
    for (Node* p = head; p; p = p->next) {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
    }
    std::cout << '\n';
}
