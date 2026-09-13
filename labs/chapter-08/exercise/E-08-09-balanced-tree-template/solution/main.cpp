// Lab 08-E-09 参考实现：手写 AVL 树（带子树大小 size），multiset 语义。
// 插入覆盖 LL/RR/LR/RL 四种失衡形态；删除沿回溯路径逐层 rebalance；
// 借助 size 支持按排名查询与第 k 小查询。整体每个操作 O(log n)。
#include <algorithm>
#include <cstdio>
#include <iostream>
#include <vector>

struct Node {
    long long key = 0;
    int left = 0;    // 0 号位置是空哨兵，left/right 为 0 表示空
    int right = 0;
    int height = 0;  // 空结点高度 0，叶结点高度 1
    int size = 0;    // 子树元素个数（含重复）
};

static std::vector<Node> t;
static int root = 0;

static inline int h(int x) { return t[x].height; }
static inline int sz(int x) { return t[x].size; }

static void pull(int x) {
    int hl = h(t[x].left), hr = h(t[x].right);
    t[x].height = (hl > hr ? hl : hr) + 1;
    t[x].size = sz(t[x].left) + sz(t[x].right) + 1;
}

static int rotateLeft(int x) {  // RR 失衡的一次左旋
    int r = t[x].right;
    t[x].right = t[r].left;
    t[r].left = x;
    pull(x);
    pull(r);
    return r;
}

static int rotateRight(int x) {  // LL 失衡的一次右旋
    int l = t[x].left;
    t[x].left = t[l].right;
    t[l].right = x;
    pull(x);
    pull(l);
    return l;
}

// 恢复以 x 为根子树的平衡（插入/删除回溯时调用），返回新的子树根。
static int rebalance(int x) {
    pull(x);
    int bf = h(t[x].left) - h(t[x].right);
    if (bf > 1) {
        if (h(t[t[x].left].left) < h(t[t[x].left].right)) {
            t[x].left = rotateLeft(t[x].left);  // LR：先把折线拉直
        }
        x = rotateRight(x);                     // LL
    } else if (bf < -1) {
        if (h(t[t[x].right].right) < h(t[t[x].right].left)) {
            t[x].right = rotateRight(t[x].right);  // RL：先把折线拉直
        }
        x = rotateLeft(x);                         // RR
    }
    return x;
}

static int insertNode(int x, long long key) {
    if (x == 0) {
        t.push_back(Node{key, 0, 0, 1, 1});
        return static_cast<int>(t.size()) - 1;
    }
    if (key < t[x].key) {
        t[x].left = insertNode(t[x].left, key);
    } else {
        t[x].right = insertNode(t[x].right, key);  // 相等进右子树（可重复）
    }
    return rebalance(x);
}

static int eraseNode(int x, long long key) {
    if (x == 0) return 0;  // 输入保证待删元素存在，此分支只是防御
    if (key < t[x].key) {
        t[x].left = eraseNode(t[x].left, key);
    } else if (t[x].key < key) {
        t[x].right = eraseNode(t[x].right, key);
    } else {
        if (t[x].left == 0 || t[x].right == 0) {
            // 至多一个孩子：孩子直接顶替；高度最多矮 1，交给祖先回溯再平衡
            return t[x].left != 0 ? t[x].left : t[x].right;
        }
        // 两个孩子：用中序后继的键替换，再从右子树删除后继结点
        int s = t[x].right;
        while (t[s].left != 0) s = t[s].left;
        t[x].key = t[s].key;
        t[x].right = eraseNode(t[x].right, t[s].key);
    }
    return rebalance(x);
}

// 排名：严格小于 key 的元素个数 + 1
static long long rankOf(long long key) {
    int x = root;
    long long less = 0;
    while (x != 0) {
        if (key <= t[x].key) {
            x = t[x].left;
        } else {
            less += sz(t[x].left) + 1;
            x = t[x].right;
        }
    }
    return less + 1;
}

// 第 k 小（k 从 1 开始，保证合法）
static long long kth(long long k) {
    int x = root;
    while (true) {
        long long leftCount = sz(t[x].left);
        if (k <= leftCount) {
            x = t[x].left;
        } else if (k == leftCount + 1) {
            return t[x].key;
        } else {
            k -= leftCount + 1;
            x = t[x].right;
        }
    }
}

// 前驱：严格小于 key 的最大元素（保证存在）
static long long prevKey(long long key) {
    int x = root;
    long long best = 0;
    while (x != 0) {
        if (t[x].key < key) {
            best = t[x].key;
            x = t[x].right;
        } else {
            x = t[x].left;
        }
    }
    return best;
}

// 后继：严格大于 key 的最小元素（保证存在）
static long long nextKey(long long key) {
    int x = root;
    long long best = 0;
    while (x != 0) {
        if (t[x].key > key) {
            best = t[x].key;
            x = t[x].left;
        } else {
            x = t[x].right;
        }
    }
    return best;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    t.assign(1, Node{});  // t[0] 空哨兵
    t.reserve(100005);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::string out;
    out.reserve(1 << 20);
    char buf[24];
    for (int i = 0; i < n; ++i) {
        int opt = 0;
        long long x = 0;
        std::cin >> opt >> x;
        long long ans = 0;
        bool hasOutput = false;
        switch (opt) {
            case 1:
                root = insertNode(root, x);
                break;
            case 2:
                root = eraseNode(root, x);
                break;
            case 3:
                ans = rankOf(x);
                hasOutput = true;
                break;
            case 4:
                ans = kth(x);
                hasOutput = true;
                break;
            case 5:
                ans = prevKey(x);
                hasOutput = true;
                break;
            case 6:
                ans = nextKey(x);
                hasOutput = true;
                break;
            default:
                break;
        }
        if (hasOutput) {
            int len = std::snprintf(buf, sizeof(buf), "%lld\n", ans);
            out.append(buf, static_cast<size_t>(len));
        }
    }
    std::cout << out;
    return 0;
}
