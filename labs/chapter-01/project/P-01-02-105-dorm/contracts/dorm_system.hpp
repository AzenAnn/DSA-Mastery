#pragma once
#include "pending_list.hpp"
#include <iosfwd>

namespace dorm105 {
struct DailySummary {
    int students = 0;
    int deliveries = 0;
    int helpScore = 0;
    int pending = 0;
    int topCount = 0;
    int topIndices[kStudentCapacity]{};
};

class DormSystem {
public:
    StudentTable students;
    PendingList pending;
    bool removeStudent(const std::string& id);
    // 非法寝室或任何受影响学生关联待送任务时返回 -1，整批不修改。
    int removeRoom(int floor, int room);
    DailySummary summary() const;
};

// 框架提供：每行一个命令，错误行不修改状态；EOF 或 QUIT 结束。
int runSession(std::istream& input, std::ostream& output);
} // namespace dorm105
