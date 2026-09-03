#include <cstddef>
#include <iostream>

struct Node {
    long long value{};
    Node* next = nullptr;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;

    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    // Build circular linked list
    Node* head = nullptr;
    Node* tail = nullptr;
    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    long long x = 0;
    std::cin >> x;
    tail->next = head;

    // Count how many nodes will remain
    std::size_t remaining = 0;
    Node* curr = head;
    do {
        if (curr->value != x) ++remaining;
        curr = curr->next;
    } while (curr != head);

    if (remaining == 0) {
        std::cout << "\n";
        return 0;
    }

    // Find the first node that is not x, to be the new head
    Node* new_head = head;
    while (new_head->value == x) new_head = new_head->next;

    // Traverse one full circle from new_head, deleting x nodes
    Node dummy{0, new_head};
    Node* prev = &dummy;
    curr = new_head;
    do {
        Node* nxt = curr->next;
        if (curr->value == x) {
            prev->next = nxt;
            delete curr;
        } else {
            prev = curr;
        }
        curr = nxt;
    } while (curr != new_head);

    // Output one full circle from new_head
    bool first = true;
    Node* p = dummy.next;
    do {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
        p = p->next;
    } while (p != dummy.next);
    std::cout << '\n';
}
