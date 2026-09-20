#include <iostream>
#include <vector>

// 稀疏矩阵三元组顺序表：每个非零元记录 (行, 列, 值)，输入保证按行优先严格有序。
struct Triple {
    int row;
    int col;
    long long value;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int rows = 0;
    int cols = 0;
    int nnz = 0;
    std::cin >> rows >> cols >> nnz;

    std::vector<Triple> source(static_cast<std::size_t>(nnz));
    // 第一趟扫描：统计每一列的非零元个数 num[c]。
    std::vector<int> num(static_cast<std::size_t>(cols), 0);
    for (int index = 0; index < nnz; ++index) {
        std::cin >> source[index].row >> source[index].col >> source[index].value;
        ++num[source[index].col];
    }

    // 0-based 前缀和：cpot[c] 是转置表中第 c 行的起始下标。
    std::vector<int> cpot(static_cast<std::size_t>(cols), 0);
    for (int col = 1; col < cols; ++col) {
        cpot[col] = cpot[col - 1] + num[col - 1];
    }

    // 第一行输出列位置表，nnz = 0 时自然全是 0。
    for (int col = 0; col < cols; ++col) {
        if (col) std::cout << ' ';
        std::cout << cpot[col];
    }
    std::cout << '\n';

    // 第二行输出转置后的形状与非零元个数。
    std::cout << cols << ' ' << rows << ' ' << nnz << '\n';

    // 第二趟扫描：每个三元组一次落到转置表的 cpot[c] 处，然后 cpot[c] 自增。
    std::vector<Triple> transposed(static_cast<std::size_t>(nnz));
    for (const Triple& item : source) {
        transposed[cpot[item.col]++] = Triple{item.col, item.row, item.value};
    }

    // 输入已按行优先有序，因此同一列收到的顺序就是行序升序，无需再排序。
    for (const Triple& item : transposed) {
        std::cout << item.row << ' ' << item.col << ' ' << item.value << '\n';
    }
    return 0;
}
