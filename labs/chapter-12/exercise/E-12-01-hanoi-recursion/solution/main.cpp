#include <iostream>

void moveDisks(int n, char from, char to, char aux) {
    if (n == 0) {
        return;
    }
    if (n == 1) {
        std::cout << "disk 1: " << from << "->" << to << '\n';
        return;
    }
    moveDisks(n - 1, from, aux, to);
    std::cout << "disk " << n << ": " << from << "->" << to << '\n';
    moveDisks(n - 1, aux, to, from);
}

int main() {
    int n;
    std::cin >> n;
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }

    long long steps = (1LL << n) - 1;
    std::cout << steps << '\n';
    moveDisks(n, 'A', 'C', 'B');
    return 0;
}
