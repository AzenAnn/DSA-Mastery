#include <iostream>

void move(int n, char from, char to, char aux) {
    if (n <= 0) {
        return;
    }
    if (n == 1) {
        std::cout << "disk 1: " << from << "->" << to << '\n';
        return;
    }
    move(n - 1, from, aux, to);
    std::cout << "disk " << n << ": " << from << "->" << to << '\n';
    move(n - 1, aux, to, from);
}

int main() {
    int n = 0;
    std::cin >> n;
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }
    if (n > 15) {
        return 0;
    }
    long long moves = (1LL << n) - 1;
    std::cout << moves << '\n';
    move(n, 'A', 'C', 'B');
    return 0;
}
