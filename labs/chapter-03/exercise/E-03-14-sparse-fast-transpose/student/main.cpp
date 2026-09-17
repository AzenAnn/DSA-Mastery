#include <iostream>
#include <vector>

// 稀疏矩阵三元组顺序表：每个非零元记录 (行, 列, 值)，按行优先严格有序。
struct Triple {
    int row;
    int col;
    long long value;
};

int main() {
    // TODO: 本题要求稀疏矩阵三元组的「快速」转置，复杂度必须是 O(nnz + cols)：
    //   1) 先一趟扫描三元组表，统计每一列的非零元个数，得到 num[c]；
    //   2) 再对 num 做 0-based 前缀和：cpot[0] = 0，cpot[c] = cpot[c-1] + num[c-1]；
    //      nnz = 0 时 cpot 全是 0，第一行要输出 cols 个 0；
    //   3) 输出第一行 cpot[0..cols-1]、第二行 `cols rows nnz`；
    //   4) 按转置后行优先（原列序升序）输出 nnz 行 `c r v`。
    // 下面这个骨架只输出占位结果（cpot 全 0 与形状行），没有输出转置表，
    // 因此只有 nnz = 0 的用例能得分。请把 3) 4) 补全为真正的快速转置。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int rows = 0;
    int cols = 0;
    int nnz = 0;
    std::cin >> rows >> cols >> nnz;

    std::vector<Triple> source(static_cast<std::size_t>(nnz));
    for (int index = 0; index < nnz; ++index) {
        std::cin >> source[index].row >> source[index].col >> source[index].value;
    }

    // TODO: 占位：这里把 cpot 全部输出为 0（只有 nnz = 0 时与正确答案一致）。
    //       应改为「一趟计数 num + 一趟 0-based 前缀和」得到真正的 cpot。
    for (int col = 0; col < cols; ++col) {
        if (col) std::cout << ' ';
        std::cout << 0;
    }
    std::cout << '\n';

    std::cout << cols << ' ' << rows << ' ' << nnz << '\n';

    // TODO: 占位：这里应当输出转置表（nnz 行 `c r v`，按原列序升序）。
    //       实现方式：再一趟扫描 source，把 (r, c, v) 写到转置表
    //       cpot[c] 位置后 cpot[c] += 1；总复杂度保持 O(nnz + cols)。
    return 0;
}
