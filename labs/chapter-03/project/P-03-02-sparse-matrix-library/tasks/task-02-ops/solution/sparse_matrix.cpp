#include "sparse_matrix.hpp"

#include <map>
#include <stdexcept>
#include <utility>

namespace dsa {

SparseMatrix transpose(const SparseMatrix& m) {
    SparseMatrix r;
    r.rows = m.cols;
    r.cols = m.rows;
    if (m.data.empty()) return r;

    // num[col] 统计每列非零元个数，cpot[col] 为每列在结果中的起始位置。
    std::vector<std::size_t> num(m.cols, 0), cpot(m.cols, 0);
    for (const auto& t : m.data) ++num[t.col];
    for (std::size_t c = 1; c < m.cols; ++c) cpot[c] = cpot[c - 1] + num[c - 1];

    r.data.resize(m.data.size());
    for (const auto& t : m.data) {
        std::size_t pos = cpot[t.col]++;
        r.data[pos] = {t.col, t.row, t.value};
    }
    return r;
}

int get(const SparseMatrix& m, std::size_t row, std::size_t col) {
    // data 按 (row, col) 升序，二分查找。
    std::size_t lo = 0, hi = m.data.size();
    while (lo < hi) {
        std::size_t mid = lo + (hi - lo) / 2;
        const Triple& t = m.data[mid];
        if (t.row < row || (t.row == row && t.col < col)) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    if (lo < m.data.size() && m.data[lo].row == row && m.data[lo].col == col)
        return m.data[lo].value;
    return 0;
}

SparseMatrix add(const SparseMatrix& a, const SparseMatrix& b) {
    if (a.rows != b.rows || a.cols != b.cols)
        throw std::invalid_argument("add: dimension mismatch");
    SparseMatrix r;
    r.rows = a.rows;
    r.cols = a.cols;
    std::size_t i = 0, j = 0;
    while (i < a.data.size() || j < b.data.size()) {
        Triple t;
        bool takeA = false, takeB = false;
        if (j >= b.data.size()) {
            takeA = true;
        } else if (i >= a.data.size()) {
            takeB = true;
        } else if (a.data[i].row < b.data[j].row ||
                   (a.data[i].row == b.data[j].row && a.data[i].col < b.data[j].col)) {
            takeA = true;
        } else if (b.data[j].row < a.data[i].row ||
                   (b.data[j].row == a.data[i].row && b.data[j].col < a.data[i].col)) {
            takeB = true;
        } else {  // 位置相同，相加
            t = {a.data[i].row, a.data[i].col, a.data[i].value + b.data[j].value};
            ++i;
            ++j;
        }
        if (takeA) t = a.data[i++];
        if (takeB) t = b.data[j++];
        if (t.value != 0) r.data.push_back(t);
    }
    return r;
}

SparseMatrix multiply(const SparseMatrix& a, const SparseMatrix& b) {
    if (a.cols != b.rows)
        throw std::invalid_argument("multiply: dimension mismatch");
    SparseMatrix bt = transpose(b);  // bt.row = b.col, bt.col = b.row
    std::map<std::pair<std::size_t, std::size_t>, int> acc;
    for (const auto& x : a.data) {
        for (const auto& y : bt.data) {
            if (y.col == x.col) {  // y.col = b.row == x.col
                acc[{x.row, y.row}] += x.value * y.value;  // y.row = b.col
            }
        }
    }
    SparseMatrix r;
    r.rows = a.rows;
    r.cols = b.cols;
    for (const auto& [pos, v] : acc) {
        if (v != 0) r.data.push_back({pos.first, pos.second, v});
    }
    return r;
}

}  // namespace dsa
