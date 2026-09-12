#include "pending_list.hpp"

namespace dorm105 {
bool PendingList::append(const Request& request, const StudentTable& students) {
    // 先调用 acceptable；校验失败时不要申请节点。
    // 提示：tail_ 在空表中指向头结点，能否统一空表和非空表的尾插？
    // 自查：next 终止于 nullptr，尾指针和 size_ 同步更新。
    (void)request; (void)students;
    return false; // TODO
}
bool PendingList::insertAfter(const std::string& afterId, const Request& request,
                              const StudentTable& students) {
    // 找到指定任务后再补单；不存在、重复、满表等情况不修改清单。
    // 先画 A -> B，再画在 A 后插入 X 的链接；哪条链接必须先保存？
    // 自查：在尾节点之后插入时，tail_ 是否仍正确？
    (void)afterId; (void)request; (void)students;
    return false; // TODO
}
bool PendingList::cancel(const std::string& requestId) {
    // 提示：从 head_ 出发找“目标的前驱”，第一条任务也有前驱。
    // 自查：释放前先断开链接；删除末尾时更新 tail_；空表可以再次插入。
    (void)requestId;
    return false; // TODO
}
int PendingList::processOnce(StudentTable& students) {
    // 每条原有任务只尝试一次，复用 Task 2 的 tryDeliver。
    // 手算：A、B、C、D 依次成功、成功、失败、成功；最终只留下 C。
    // 提示 1：当前任务的前驱应指向谁？头结点能统一哪些边界？
    // 提示 2：释放当前节点前需要保存什么？释放后还能读取 next 吗？
    // 提示 3：删除成功任务与保留失败任务时，前驱都需要前进吗？
    // 自查：连续删除、全部保留、全部完成、尾节点删除、下一轮重试。
    (void)students;
    return 0; // TODO：返回本轮完成数。
}
} // namespace dorm105
