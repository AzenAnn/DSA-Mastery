#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    // TODO(1): 读入 n 行 i val l r，按编号 i 保存结点（val 需用 long long）。
    // TODO(2): 递归向子树传递开区间 (low, high)：结点必须满足 low < val < high，
    //          左子树上界收紧为 val，右子树下界收紧为 val；空树输出 1。
    // 注意：哨兵用 <climits> 的 LLONG_MIN / LLONG_MAX，
    //       不能用 ±1e18 当哨兵——结点关键字本身可以恰好取到 ±1e18；
    //       只比较父子结点会漏掉"孙辈违反祖先约束"的情况。
    int verdict = 1;
    (void)n;
    std::cout << verdict << '\n';
    return 0;
}
