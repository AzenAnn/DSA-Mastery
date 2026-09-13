#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::string> roster(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) std::cin >> roster[i];

    int m = 0;
    std::cin >> m;
    (void)roster;
    // TODO(1): 手写散列表（131 进制多项式散列 + 素数表长取模，链地址法处理冲突），
    //          把名单插入表中；节点上要能挂“是否已点名”的状态标记。
    // TODO(2): 每次点名先查找：不在名单输出 WRONG；在名单且首次点到输出 OK 并把
    //          标记置为已点；已点过输出 REPEAT。
    // TODO(3): 用上述三态逻辑替换下面的占位输出。
    // 占位行为：对所有点名一律输出 WRONG，仅保证骨架可编译运行。
    while (m-- > 0) {
        std::string name;
        std::cin >> name;
        (void)name;
        std::cout << "WRONG" << '\n';
    }
    return 0;
}
