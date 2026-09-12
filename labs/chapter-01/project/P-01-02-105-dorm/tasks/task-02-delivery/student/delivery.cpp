#include "delivery.hpp"

namespace dorm105 {
int deliveryCost(int floor) {
    // 每趟：一楼取件 -> 目标楼层 -> 返回一楼。
    // 上一层耗 2，下一级耗 1，取送另耗 1；三楼为什么合计 7？
    // 自查：一楼不是零成本；非法楼层返回 -1。
    (void)floor;
    return -1; // TODO
}
int deliveryReward(int floor) {
    // 题面约定奖励为 10 + 2 * (floor - 1)，非法楼层返回 -1。
    (void)floor;
    return -1; // TODO
}
DeliveryResult tryDeliver(StudentTable& students, const std::string& helperId,
                          const std::string& receiverId) {
    // 先依次检查：双方存在、自取、体力是否足够完整往返。
    // 思考：先扣去程体力，再发现不够返回，会留下什么错误状态？
    // 提示：先计算并判断，再一起更新帮助者的三个字段。
    // 自查：体力恰好够；收件人状态不变；失败 cost/reward 为 0。
    (void)students; (void)helperId; (void)receiverId;
    return {}; // TODO：按契约返回明确状态。
}
int findTopHelpers(const StudentTable& students, int indices[]) {
    // 手算分数 [12, 25, 18, 25]：只保存一个最大值下标会漏掉谁？
    // 提示 1：先确定最高分，再收集全部并列者，保持名单顺序。
    // 提示 2：delivered == 0 的同学不参与本次榜单。
    // 自查：空表、无人帮送、全部并列；不需要排序。
    (void)students; (void)indices;
    return 0; // TODO
}
} // namespace dorm105
