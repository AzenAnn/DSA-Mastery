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

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string s, t, v;
    std::getline(std::cin, s);
    std::getline(std::cin, t);
    std::getline(std::cin, v);

    std::vector<int> next = build_next(t);
    int n = static_cast<int>(s.size());
    int m = static_cast<int>(t.size());
    std::string out;
    int i = 0, j = 0, last = 0;
    while (i < n) {
        if (j == -1 || s[i] == t[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
        if (j == m) {
            int start = i - m;
            out.append(s, last, static_cast<std::size_t>(start - last));
            out += v;
            last = i;
            j = 0;
        }
    }
    out.append(s, last, static_cast<std::size_t>(n - last));
    std::cout << out << '\n';
    return 0;
}
