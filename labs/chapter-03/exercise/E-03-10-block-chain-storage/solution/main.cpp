#include <iostream>
#include <string>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long blockSize = 0;
    long long index = 0;
    std::string text;
    std::cin >> blockSize >> text >> index;

    const long long length = static_cast<long long>(text.size());
    const long long nodeCount = (length + blockSize - 1) / blockSize;
    const long long padding = nodeCount * blockSize - length;

    std::cout << index / blockSize + 1 << ' '
              << index % blockSize << ' '
              << nodeCount << ' '
              << padding << '\n';
    return 0;
}
