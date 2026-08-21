#include <iostream>
#include <string>
#include <vector>

std::vector<int> build_next(const std::string& p) {
    int m = static_cast<int>(p.size());
    std::vector<int> next(m, 0);
    int k = -1, j = 0;
    next[0] = -1;
    while (j < m - 1) {
        if (k == -1 || p[j] == p[k]) {
            ++j;
            ++k;
            next[j] = k;
        } else {
            k = next[k];
        }
    }
    return next;
}

std::vector<int> build_nextval(const std::string& p, const std::vector<int>& next) {
    int m = static_cast<int>(p.size());
    std::vector<int> nextval(m, 0);
    nextval[0] = -1;
    for (int j = 1; j < m; ++j) {
        int k = next[j];
        nextval[j] = (p[j] == p[k]) ? nextval[k] : k;
    }
    return nextval;
}

void print_array(const std::vector<int>& a) {
    for (std::size_t i = 0; i < a.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string p;
    std::getline(std::cin, p);
    std::vector<int> next = build_next(p);
    std::vector<int> nextval = build_nextval(p, next);
    print_array(next);
    print_array(nextval);
    return 0;
}
