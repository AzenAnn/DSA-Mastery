#include "expression.hpp"
namespace expr {
bool TokenStack::push(Token value) {
    if (data_.size() == kCapacity) return false;
    data_.push_back(value);
    return true;
}
bool TokenStack::pop(Token& value) {
    if (data_.empty()) return false;
    value = data_.back();
    data_.pop_back();
    return true;
}
bool TokenStack::peek(Token& value) const {
    if (data_.empty()) return false;
    value = data_.back();
    return true;
}
std::size_t TokenStack::size() const { return data_.size(); }
bool TokenStack::empty() const { return data_.empty(); }
}
