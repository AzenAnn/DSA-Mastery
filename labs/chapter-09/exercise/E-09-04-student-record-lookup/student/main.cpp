#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::string> ids(static_cast<size_t>(n));
    std::vector<std::string> names(static_cast<size_t>(n));
    std::vector<int> a(static_cast<size_t>(n)), b(static_cast<size_t>(n)), c(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) {
        std::cin >> ids[i] >> names[i] >> a[i] >> b[i] >> c[i];
    }

    int m = 0;
    std::cin >> m;
    (void)ids; (void)names; (void)a; (void)b; (void)c;
    // TODO(1): 手写散列索引：对学号字符串做 131 进制多项式散列、对素数表长取模，
    //          链地址法处理冲突；节点上存学号原串与记录下标（冲突时比较原串）。
    // TODO(2): 注意学号是字符串键、允许前导零——012345 与 12345 是两个不同的键，
    //          不要把学号转成整数做数组下标。
    // TODO(3): 查询命中时输出 `学号 姓名 成绩1 成绩2 成绩3`，成绩用 %.1f 格式化
    //          （78 输出 78.0）；未命中输出 No Answer!。用该逻辑替换下面的占位输出。
    // 占位行为：对所有查询一律输出 No Answer!，仅保证骨架可编译运行。
    while (m-- > 0) {
        std::string id;
        std::cin >> id;
        (void)id;
        std::cout << "No Answer!" << '\n';
    }
    return 0;
}
