#ifndef DSA_LAB_SPARSE_MATRIX_HPP
#define DSA_LAB_SPARSE_MATRIX_HPP

#include <cstddef>
#include <vector>

namespace dsa {

// 一个非零元：行、列、值。
struct Triple {
    std::size_t row = 0;
    std::size_t col = 0;
    int value = 0;
};

// 稀疏矩阵：行数、列数，以及按 (row, col) 升序的三元组表。
struct SparseMatrix {
    std::size_t rows = 0;
    std::size_t cols = 0;
    std::vector<Triple> data;
};

// 转置：行列互换并重排为按 (row, col) 升序，O(rows + cols + t)。
SparseMatrix transpose(const SparseMatrix& m);

// 同型加法（a.rows == b.rows 且 a.cols == b.cols），否则抛 std::invalid_argument。
SparseMatrix add(const SparseMatrix& a, const SparseMatrix& b);

// 乘法（要求 a.cols == b.rows，否则抛 std::invalid_argument），结果按 (row, col) 升序。
SparseMatrix multiply(const SparseMatrix& a, const SparseMatrix& b);

// 取值：命中返回该非零元的值，未命中返回 0。
int get(const SparseMatrix& m, std::size_t row, std::size_t col);

}  // namespace dsa

#endif  // DSA_LAB_SPARSE_MATRIX_HPP
