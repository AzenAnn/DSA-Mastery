#include "sparse_matrix.hpp"

namespace dsa {

// TODO: 实现稀疏矩阵的转置、加法、乘法与取值。
// 约定：data 按 (row, col) 升序；add/multiply 维度不匹配时抛 std::invalid_argument。

SparseMatrix transpose(const SparseMatrix& m) {
    (void)m;
    return {};
}

SparseMatrix add(const SparseMatrix& a, const SparseMatrix& b) {
    (void)a;
    (void)b;
    return {};
}

SparseMatrix multiply(const SparseMatrix& a, const SparseMatrix& b) {
    (void)a;
    (void)b;
    return {};
}

int get(const SparseMatrix& m, std::size_t row, std::size_t col) {
    (void)m;
    (void)row;
    (void)col;
    return 0;
}

}  // namespace dsa
