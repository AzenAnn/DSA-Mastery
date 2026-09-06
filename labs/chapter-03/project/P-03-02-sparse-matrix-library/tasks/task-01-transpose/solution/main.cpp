#include <iostream>
#include <vector>

struct Triple {
    int row, col, value;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int rows, cols, count;
    std::cin >> rows >> cols >> count;
    std::vector<Triple> data(count);
    for (int i = 0; i < count; ++i) {
        std::cin >> data[i].row >> data[i].col >> data[i].value;
    }

    // 快速转置：num[col] 统计每列非零元个数，cpot[col] 为每列在结果中的起始位置。
    std::vector<int> num(cols, 0), cpot(cols, 0);
    for (const auto& t : data) ++num[t.col];
    for (int c = 1; c < cols; ++c) cpot[c] = cpot[c - 1] + num[c - 1];

    std::vector<Triple> result(count);
    for (const auto& t : data) {
        int pos = cpot[t.col]++;
        result[pos] = {t.col, t.row, t.value};
    }

    for (const auto& t : result) {
        std::cout << t.row << ' ' << t.col << ' ' << t.value << '\n';
    }
    return 0;
}
