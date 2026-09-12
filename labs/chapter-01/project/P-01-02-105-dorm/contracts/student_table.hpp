#pragma once
#include "model.hpp"

namespace dorm105 {
class StudentTable {
public:
    int size() const;
    // 越界返回 nullptr；合法指针仅在下一次表的结构修改前有效。
    const Student* at(int index) const;
    Student* at(int index);
    int findIndex(const std::string& id) const;
    bool add(const std::string& id, const std::string& name, int floor, int room);
    bool update(const std::string& id, const std::string& name, int floor, int room);
    bool erase(const std::string& id);
    // 底层表不检查待送引用，整合层负责检查。返回实际删除人数。
    int removeByRoom(int floor, int room);
    // 调用方提供至少 kStudentCapacity 个 int；仅写返回数量以内的位置。
    int findByName(const std::string& name, int indices[]) const;

private:
    Student data_[kStudentCapacity]{};
    int size_ = 0;
};
} // namespace dorm105
