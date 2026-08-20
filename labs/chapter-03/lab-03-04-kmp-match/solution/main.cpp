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

int kmp_match(const std::string& s, const std::string& p) {
    int n = static_cast<int>(s.size());
    int m = static_cast<int>(p.size());
    if (m == 0) return 0;
    std::vector<int> next = build_next(p);
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (j == -1 || s[i] == p[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
    }
    return j == m ? i - m : -1;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string s, p;
    std::getline(std::cin, s);
    std::getline(std::cin, p);
    std::cout << kmp_match(s, p) << '\n';
    return 0;
}
