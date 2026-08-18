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
    int head = -1;

    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        slots[i].data = v;
        slots[i].next = -1;

        if (head == -1 || v < slots[head].data) {
            slots[i].next = head;
            head = static_cast<int>(i);
        } else {
            int prev = head;
            while (slots[prev].next != -1 && slots[slots[prev].next].data <= v) {
                prev = slots[prev].next;
            }
            slots[i].next = slots[prev].next;
            slots[prev].next = static_cast<int>(i);
        }
    }

    bool first = true;
    for (int p = head; p != -1; p = slots[p].next) {
        if (!first) std::cout << ' ';
        std::cout << slots[p].data;
        first = false;
    }
    std::cout << '\n';
}
