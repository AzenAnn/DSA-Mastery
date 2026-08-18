#include <cstddef>
#include <iostream>

struct Node {
    int value{};
    Node* next = nullptr;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0, m = 0;
    std::cin >> n >> m;

    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    Node* head = new Node{1, nullptr};
    Node* curr = head;
    for (int i = 2; i <= n; ++i) {
        curr->next = new Node{i, nullptr};
        curr = curr->next;
    }
    curr->next = head;

    Node* prev = curr;
    curr = head;
    bool first_out = true;

    while (n-- > 0) {
        for (int i = 1; i < m; ++i) {
            prev = curr;
            curr = curr->next;
        }
        if (!first_out) std::cout << ' ';
        std::cout << curr->value;
        first_out = false;

        prev->next = curr->next;
        Node* to_del = curr;
        curr = curr->next;
        delete to_del;
    }
    std::cout << '\n';
}
