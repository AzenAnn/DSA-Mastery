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
    std::vector<Slot> sa(n);
    for (std::size_t i = 0; i < n; ++i) {
        std::cin >> sa[i].data >> sa[i].next;
    }
    int head_a = -1;
    std::cin >> head_a;

    std::size_t m = 0;
    std::cin >> m;
    std::vector<Slot> sb(m);
    for (std::size_t i = 0; i < m; ++i) {
        std::cin >> sb[i].data >> sb[i].next;
    }
    int head_b = -1;
    std::cin >> head_b;

    std::vector<Slot> slots(n + m);
    for (std::size_t i = 0; i < n; ++i) {
        slots[i] = sa[i];
    }
    for (std::size_t i = 0; i < m; ++i) {
        slots[n + i].data = sb[i].data;
        slots[n + i].next = (sb[i].next == -1) ? -1 : static_cast<int>(sb[i].next + n);
    }
    if (head_b != -1) {
        head_b += static_cast<int>(n);
    }

    int merged_head = -1;
    int tail = -1;
    int pa = head_a;
    int pb = head_b;

    while (pa != -1 && pb != -1) {
        int next_node = -1;
        if (slots[pa].data <= slots[pb].data) {
            next_node = pa;
            pa = slots[pa].next;
        } else {
            next_node = pb;
            pb = slots[pb].next;
        }

        if (tail == -1) {
            merged_head = next_node;
        } else {
            slots[tail].next = next_node;
        }
        tail = next_node;
    }

    int remain = (pa != -1) ? pa : pb;
    if (tail == -1) {
        merged_head = remain;
    } else {
        slots[tail].next = remain;
    }

    bool first = true;
    for (int p = merged_head; p != -1; p = slots[p].next) {
        if (!first) std::cout << ' ';
        std::cout << slots[p].data;
        first = false;
    }
    std::cout << '\n';
}
