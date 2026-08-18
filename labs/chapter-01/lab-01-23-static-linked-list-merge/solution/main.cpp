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
    for (std::size_t i = 0; i < n; ++i) std::cin >> sa[i].data >> sa[i].next;
    int head_a = -1;
    if (n > 0) std::cin >> head_a;

    std::size_t m = 0;
    std::cin >> m;
    std::vector<Slot> sb(m);
    for (std::size_t i = 0; i < m; ++i) std::cin >> sb[i].data >> sb[i].next;
    int head_b = -1;
    if (m > 0) std::cin >> head_b;

    std::vector<long long> result;
    int pa = head_a, pb = head_b;
    while (pa != -1 || pb != -1) {
        long long va = (pa != -1) ? sa[pa].data : (1LL << 60);
        long long vb = (pb != -1) ? sb[pb].data : (1LL << 60);
        if (va <= vb) {
            result.push_back(va);
            pa = sa[pa].next;
        } else {
            result.push_back(vb);
            pb = sb[pb].next;
        }
    }

    bool first = true;
    for (auto v : result) {
        if (!first) std::cout << ' ';
        std::cout << v;
        first = false;
    }
    std::cout << '\n';
}
