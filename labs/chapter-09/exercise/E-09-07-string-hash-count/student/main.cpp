#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::string> words(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> words[i];

    // TODO(1): 手写散列函数：h = h * 131 + c（unsigned long long 自然溢出），
    //          再对素数表长（如 131071）取模得到桶下标。
    // TODO(2): 手写散列表（链地址法）：节点同时存散列值与原串；插入时先比散列值、
    //          相同再比原串——不同串可能撞出同一散列值，不能只比散列值。
    // TODO(3): 统计“新出现的串”个数并输出，替换下面的占位输出。
    // 占位行为：直接输出 n（把每个串都当作不同），仅保证骨架可编译运行。
    std::cout << n << '\n';
    (void)words;
    return 0;
}
