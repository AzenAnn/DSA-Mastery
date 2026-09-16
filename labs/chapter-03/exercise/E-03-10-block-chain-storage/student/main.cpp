#include <iostream>
#include <string>

int main() {
    // TODO: 读入块大小 k、串 S 与下标 i，按“每 k 个字符一个块”的块链存储求出：
    //   1) i 所在结点序号（从 1 开始）；2) 块内偏移（从 0 开始）；
    //   3) 结点总数；4) 最后一块的填充槽位数。
    // 本题只要求按块定位，不要求真正建立 next 指针。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long blockSize = 0;
    long long index = 0;
    std::string text;
    std::cin >> blockSize >> text >> index;

    std::cout << 0 << ' ' << 0 << ' ' << 0 << ' ' << 0 << '\n';
    return 0;
}
