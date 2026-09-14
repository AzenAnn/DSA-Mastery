#include "expression.hpp"
namespace expr {
bool TokenStack::push(Token value) { (void)value; return false; } // TODO: bounded push.
bool TokenStack::pop(Token& value) { (void)value; return false; } // TODO: LIFO removal.
bool TokenStack::peek(Token& value) const { (void)value; return false; } // TODO: non-destructive read.
std::size_t TokenStack::size() const { return data_.size(); }
bool TokenStack::empty() const { return data_.empty(); }
}
