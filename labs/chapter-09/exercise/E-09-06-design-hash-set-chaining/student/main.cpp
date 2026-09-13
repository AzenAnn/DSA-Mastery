#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long bucketCount = 0;
    long long n = 0;
    if (!(std::cin >> bucketCount >> n)) return 0;

    // 链地址法：桶数组 B 个桶，每个桶挂一条单链表，冲突元素串在同一条链上。
    struct Node {
        long long key = 0;
        Node* next = nullptr;
    };
    std::vector<Node*> buckets(static_cast<size_t>(bucketCount), nullptr);
    (void)buckets;

    // TODO(1): add(x)——H(x) = x % bucketCount；先沿链查重（已存在则无效果），
    //   再把新节点头插入对应桶并更新桶头指针。
    // TODO(2): contains(x)——沿链逐节点比较 key，命中输出 1，走到链尾输出 0。
    // TODO(3): remove(x)——沿链记录前驱 prev，命中后摘链；
    //   prev 为空说明删的是头节点，必须同步更新桶头指针，否则出现野指针。
    // 注意集合语义：同一值 add 两次只有一份，remove 一次即视为删除。
    for (long long i = 0; i < n; ++i) {
        std::string op;
        std::cin >> op;
        long long x = 0;
        std::cin >> x;
        (void)x;
        if (op == "contains") {
            std::cout << 0 << '\n';  // 占位输出：完成 TODO 后替换为真实查找结果
        }
    }
    return 0;
}
