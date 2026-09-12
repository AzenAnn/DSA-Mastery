#include "student_table.hpp"

namespace dorm105 {
int StudentTable::findIndex(const std::string& id) const {
    for (int i = 0; i < size_; ++i) if (data_[i].id == id) return i;
    return -1;
}
bool StudentTable::add(const std::string& id, const std::string& name, int floor, int room) {
    if (!validId(id) || name.empty() || !validRoom(floor, room) ||
        size_ == kStudentCapacity || findIndex(id) >= 0) return false;
    data_[size_++] = Student{id, name, floor, room};
    return true;
}
bool StudentTable::update(const std::string& id, const std::string& name, int floor, int room) {
    const int index = findIndex(id);
    if (index < 0 || name.empty() || !validRoom(floor, room)) return false;
    data_[index].name = name;
    data_[index].floor = floor;
    data_[index].room = room;
    return true;
}
bool StudentTable::erase(const std::string& id) {
    const int index = findIndex(id);
    if (index < 0) return false;
    for (int i = index + 1; i < size_; ++i) data_[i - 1] = data_[i];
    data_[--size_] = Student{};
    return true;
}
int StudentTable::removeByRoom(int floor, int room) {
    if (!validRoom(floor, room)) return 0;
    const int oldSize = size_;
    int write = 0;
    for (int read = 0; read < oldSize; ++read) {
        if (data_[read].floor == floor && data_[read].room == room) continue;
        if (write != read) data_[write] = data_[read];
        ++write;
    }
    for (int i = write; i < oldSize; ++i) data_[i] = Student{};
    size_ = write;
    return oldSize - write;
}
int StudentTable::findByName(const std::string& name, int indices[]) const {
    int count = 0;
    for (int i = 0; i < size_; ++i) if (data_[i].name == name) indices[count++] = i;
    return count;
}
} // namespace dorm105
