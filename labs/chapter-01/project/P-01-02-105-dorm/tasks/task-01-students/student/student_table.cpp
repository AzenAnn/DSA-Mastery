#include "student_table.hpp"

namespace dorm105 {
int StudentTable::findIndex(const std::string& id) const {
    // 宿管王拿着学号找人：要比较姓名，还是唯一的学号？
    // 提示：只检查 [0, size_)，不存在时返回 -1。
    (void)id;
    return -1; // TODO
}
bool StudentTable::add(const std::string& id, const std::string& name, int floor, int room) {
    // 先检查 validId、validRoom、姓名非空、容量和重复学号。
    // 提示：复用 findIndex；通过所有检查后才写入新学生。
    // 想一想：新增学生的体力和统计值应如何初始化？
    (void)id; (void)name; (void)floor; (void)room;
    return false; // TODO
}
bool StudentTable::update(const std::string& id, const std::string& name, int floor, int room) {
    // 换寝不应清空已经积累的热心值，也不应恢复体力。
    // 提示：先定位并校验，然后只修改姓名、楼层、房间号。
    (void)id; (void)name; (void)floor; (void)room;
    return false; // TODO
}
bool StudentTable::erase(const std::string& id) {
    // 手算：[甲, 乙, 丙, 丁] 删除乙，哪些元素需要补位？
    // 提示：补位应该从左往右，还是从右往左？
    // 自查：首元素、尾元素、唯一元素、查无此人。
    (void)id;
    return false; // TODO
}
int StudentTable::removeByRoom(int floor, int room) {
    // 某间寝室整体搬离；其他学生必须保持原有相对顺序。
    // 手算：[甲, 乙, 丙, 丁, 戊] 中乙、丙离开，最终有效区域是什么？
    // 提示 1：反复 erase 会不会重复搬动丁、戊？
    // 提示 2：用一个下标检查原名单，另一个表示下一名保留者的存放位置。
    // 思考：这两个下标何时前进？结束时哪个值就是新的 size_？
    // 自查：无人搬离、全员搬离、连续匹配、空表；目标 O(n)，额外空间 O(1)。
    (void)floor; (void)room;
    return 0; // TODO：返回实际删除人数；非法寝室返回 0。
}
int StudentTable::findByName(const std::string& name, int indices[]) const {
    // 名字可以相同：发现一个匹配后，是否应该立即 return？
    // 提示：分别维护扫描下标和已经收集到的结果数量，保持名单顺序。
    (void)name; (void)indices;
    return 0; // TODO：indices 由调用方提供，容量为 105。
}
} // namespace dorm105
