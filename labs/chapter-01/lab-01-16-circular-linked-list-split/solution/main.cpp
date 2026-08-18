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

    std::size_t first_len = (n + 1) / 2;
    Node* mid = head;
    for (std::size_t i = 1; i < first_len; ++i) mid = mid->next;

    Node* second_head = mid->next;
    mid->next = head;
    tail->next = second_head;

    auto print = [&](Node* h, std::size_t len) {
        bool first = true;
        Node* p = h;
        for (std::size_t i = 0; i < len; ++i) {
            if (!first) std::cout << ' ';
            std::cout << p->value;
            first = false;
            p = p->next;
        }
    };

    print(head, first_len);
    std::cout << '\n';
    print(second_head, n - first_len);
    std::cout << '\n';
}
