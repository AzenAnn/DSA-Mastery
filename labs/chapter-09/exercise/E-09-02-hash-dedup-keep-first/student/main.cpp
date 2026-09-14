#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int t = 0;
    if (!(std::cin >> t)) return 0;
    while (t-- > 0) {
        int n = 0;
        std::cin >> n;
        std::vector<int> a(static_cast<size_t>(n));
        for (int i = 0; i < n; ++i) std::cin >> a[i];

        // TODO(1): 手写一张散列表（建议素数表长 + 除留余数法 H(k)=k mod p，
        //          冲突用线性探测或链地址法），支持 insert（已存在返回 false）
        //          与按组清空两个操作。
        // TODO(2): 每组开始前复位散列表；顺序扫描 a，把“首次出现”的值
        //          依序收集进结果（insert 返回 true 即为首次出现）。
        // TODO(3): 用收集到的结果替换下面的占位输出。
        // 占位行为：原样输出本组全部数值（没有去重），仅保证骨架可编译运行。
        for (int i = 0; i < n; ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << a[i];
        }
        std::cout << '\n';
    }
    return 0;
}
