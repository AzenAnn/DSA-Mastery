#include "test_support.hpp"
int main(int argc, char** argv) {
    CHECK(argc == 2, "test group");
    const std::string group = argv[1];
    expr::TokenStack stack;
    expr::Token out = number(99, 7);
    if (group == "empty") {
        CHECK(stack.empty() && stack.size() == 0, "new stack is empty");
        CHECK(!stack.pop(out) && out.value == 99 && out.offset == 7, "failed pop preserves output");
        CHECK(!stack.peek(out) && out.value == 99, "failed peek preserves output");
    } else if (group == "lifo") {
        CHECK(stack.push(number(-5, 3)) && stack.push({expr::Kind::Plus, 0, 8}), "push preserves complete tokens");
        CHECK(stack.peek(out) && out.kind == expr::Kind::Plus && out.offset == 8 && stack.size() == 2, "peek does not remove");
        CHECK(stack.pop(out) && out.kind == expr::Kind::Plus, "last token first");
        CHECK(stack.pop(out) && out.value == -5 && out.offset == 3 && stack.empty(), "remaining token");
        CHECK(stack.push(number(12)) && stack.pop(out) && out.value == 12, "reuse after empty");
    } else if (group == "capacity") {
        for (std::size_t i = 0; i < expr::kCapacity; ++i) CHECK(stack.push(number(static_cast<std::int64_t>(i))), "fill to capacity");
        CHECK(!stack.push(number(999)) && stack.size() == expr::kCapacity, "overflow leaves state unchanged");
        for (std::size_t i = expr::kCapacity; i > 0; --i) CHECK(stack.pop(out) && out.value == static_cast<std::int64_t>(i - 1), "capacity LIFO");
        CHECK(!stack.pop(out) && stack.empty(), "underflow after full drain");
    } else CHECK(false, "unknown test group");
}
