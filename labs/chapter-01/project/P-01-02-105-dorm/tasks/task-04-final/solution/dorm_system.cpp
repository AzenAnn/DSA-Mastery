#include "dorm_system.hpp"

namespace dorm105 {
bool DormSystem::removeStudent(const std::string& id) {
    return !pending.referencesStudent(id) && students.erase(id);
}
int DormSystem::removeRoom(int floor, int room) {
    if (!validRoom(floor, room)) return -1;
    for (int i = 0; i < students.size(); ++i) {
        const Student& student = *students.at(i);
        if (student.floor == floor && student.room == room &&
            pending.referencesStudent(student.id)) return -1;
    }
    return students.removeByRoom(floor, room);
}
DailySummary DormSystem::summary() const {
    DailySummary result;
    result.students = students.size();
    result.pending = pending.size();
    for (int i = 0; i < students.size(); ++i) {
        result.deliveries += students.at(i)->delivered;
        result.helpScore += students.at(i)->helpScore;
    }
    result.topCount = findTopHelpers(students, result.topIndices);
    return result;
}
} // namespace dorm105
