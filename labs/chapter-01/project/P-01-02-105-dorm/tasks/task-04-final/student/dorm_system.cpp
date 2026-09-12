#include "dorm_system.hpp"

namespace dorm105 {
bool DormSystem::removeStudent(const std::string& id) {
    // 先复用 pending.referencesStudent 检查帮送者和收件人引用。
    // 没有待送关联时，再调用 Task 1 的删除函数。
    (void)id;
    return false; // TODO
}
int DormSystem::removeRoom(int floor, int room) {
    // 整间寝室一起搬离：只要有一个人被待送任务引用，整批都不删除。
    // 思考：边检查边删除，是否可能删到一半才发现不能继续？
    // 提示：先完成一轮检查，再复用 Task 1 的批量删除。
    (void)floor; (void)room;
    return -1; // TODO
}
DailySummary DormSystem::summary() const {
    // 统计来自同一份学生表；不维护容易失配的第二份总数。
    // 提示：扫描累加次数和热心值，复用 Task 2 找出并列第一。
    // 自查：本函数只读，连续调用两次结果应该相同。
    return {}; // TODO
}
} // namespace dorm105
