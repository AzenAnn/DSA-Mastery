#include <cstddef>
#include <iostream>
#include <vector>

struct Slot {
    long long data{};
    int next = -1;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;

    std::vector<Slot> slots(n);
    for (std::size_t i = 0; i < n; ++i) {
        std::cin >> slots[i].data >> slots[i].next;
    }

    int head = -1;
    if (n > 0) std::cin >> head;

    int prev = -1;
    int curr = head;
    while (curr != -1) {
        int nxt = slots[curr].next;
        slots[curr].next = prev;
        prev = curr;
        curr = nxt;
    }
    head = prev;

    bool first = true;
    for (int p = head; p != -1; p = slots[p].next) {
        if (!first) std::cout << ' ';
        std::cout << slots[p].data;
        first = false;
    }
    std::cout << '\n';
}
