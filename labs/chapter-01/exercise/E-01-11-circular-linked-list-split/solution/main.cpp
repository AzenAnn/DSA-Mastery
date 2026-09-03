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
        std::cout << "\n\n";
        return 0;
    }

    Node* head = nullptr;
    Node* tail = nullptr;
    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    tail->next = head;

    if (head->next == head) {
        std::cout << head->value << "\n\n";
        return 0;
    }

    Node* slow = head;
    Node* fast = head;
    while (fast->next != head && fast->next->next != head) {
        fast = fast->next->next;
        slow = slow->next;
    }
    if (fast->next->next == head) {
        fast = fast->next;
    }

    Node* head1 = head;
    Node* head2 = slow->next;

    slow->next = head1;
    fast->next = head2;

    auto print_circle = [](Node* h) {
        bool first = true;
        Node* p = h;
        do {
            if (!first) std::cout << ' ';
            std::cout << p->value;
            first = false;
            p = p->next;
        } while (p != h);
        std::cout << '\n';
    };

    print_circle(head1);
    print_circle(head2);
}
