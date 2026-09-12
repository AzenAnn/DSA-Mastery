#include "student_table.hpp"

namespace dorm105 {
int StudentTable::size() const { return size_; }
const Student* StudentTable::at(int index) const {
    return index >= 0 && index < size_ ? &data_[index] : nullptr;
}
Student* StudentTable::at(int index) {
    return index >= 0 && index < size_ ? &data_[index] : nullptr;
}
} // namespace dorm105
