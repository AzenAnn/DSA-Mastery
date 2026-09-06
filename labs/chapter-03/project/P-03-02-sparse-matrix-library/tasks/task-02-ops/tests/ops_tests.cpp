#include "sparse_matrix.hpp"

#include <cassert>
#include <initializer_list>
#include <iostream>
#include <stdexcept>
#include <string>

using dsa::SparseMatrix;
using dsa::Triple;

static SparseMatrix make(std::size_t rows, std::size_t cols,
                         std::initializer_list<Triple> data) {
    SparseMatrix m;
    m.rows = rows;
    m.cols = cols;
    m.data.assign(data);
    return m;
}

static bool eq(const SparseMatrix& a, const SparseMatrix& b) {
    if (a.rows != b.rows || a.cols != b.cols || a.data.size() != b.data.size())
        return false;
    for (std::size_t i = 0; i < a.data.size(); ++i) {
        if (a.data[i].row != b.data[i].row || a.data[i].col != b.data[i].col ||
            a.data[i].value != b.data[i].value)
            return false;
    }
    return true;
}

static void test_transpose() {
    auto m = make(2, 3, {{0, 0, 1}, {0, 2, 2}, {1, 1, 3}, {1, 2, 4}});
    auto t = dsa::transpose(m);
    auto expect = make(3, 2, {{0, 0, 1}, {1, 1, 3}, {2, 0, 2}, {2, 1, 4}});
    assert(eq(t, expect));
    assert(eq(dsa::transpose(t), m));  // 两次转置回到原样
}

static void test_add() {
    auto a = make(2, 2, {{0, 0, 1}, {0, 1, 2}, {1, 0, 3}});
    auto b = make(2, 2, {{0, 0, 4}, {1, 1, 5}});
    auto s = dsa::add(a, b);
    auto expect = make(2, 2, {{0, 0, 5}, {0, 1, 2}, {1, 0, 3}, {1, 1, 5}});
    assert(eq(s, expect));

    auto c = make(2, 2, {{0, 0, -1}});  // 相加抵消为 0 应被消去
    auto s2 = dsa::add(a, c);
    auto expect2 = make(2, 2, {{0, 1, 2}, {1, 0, 3}});
    assert(eq(s2, expect2));
}

static void test_multiply() {
    auto a = make(2, 3, {{0, 0, 1}, {0, 2, 2}, {1, 1, 3}});
    auto b = make(3, 2, {{0, 1, 4}, {2, 0, 5}});
    // C[0][0]=10, C[0][1]=4, 其余为 0
    auto c = dsa::multiply(a, b);
    auto expect = make(2, 2, {{0, 0, 10}, {0, 1, 4}});
    assert(eq(c, expect));
}

static void test_boundary() {
    auto empty = make(3, 2, {});
    auto te = dsa::transpose(empty);
    assert(te.rows == 2 && te.cols == 3 && te.data.empty());

    auto m = make(2, 2, {{0, 0, 7}});
    assert(dsa::get(m, 0, 0) == 7);
    assert(dsa::get(m, 1, 1) == 0);

    bool threw = false;
    try {
        dsa::add(make(2, 2, {{0, 0, 1}}), make(3, 3, {{0, 0, 1}}));
    } catch (const std::invalid_argument&) {
        threw = true;
    }
    assert(threw);

    threw = false;
    try {
        dsa::multiply(make(2, 3, {}), make(2, 2, {}));  // a.cols(3) != b.rows(2)
    } catch (const std::invalid_argument&) {
        threw = true;
    }
    assert(threw);
}

int main(int argc, char** argv) {
    std::string mode = argc > 1 ? argv[1] : "all";
    if (mode == "transpose") {
        test_transpose();
    } else if (mode == "add") {
        test_add();
    } else if (mode == "multiply") {
        test_multiply();
    } else if (mode == "boundary") {
        test_boundary();
    } else {
        test_transpose();
        test_add();
        test_multiply();
        test_boundary();
    }
    std::cout << "ok\n";
    return 0;
}
