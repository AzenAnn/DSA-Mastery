#include <iostream>
#include <string>

// Lab 03-E-17：KMP 与 nextval 的比较次数
// 学生骨架：只实现了朴素匹配的计数，并把同一个数字打印三次。
// 它只能拿到 KMP 与 KMP+nextval 恰好等于朴素次数的那些用例的分，确定性不满分。
int main() {
    // TODO: 本题要求输出三个数字：朴素 BF、KMP、KMP+nextval 的比较次数。
    //   1) 计数口径：每次执行 S[i] == T[j] 的字符比较计 1 次（成功与失败都计）；
    //      构造 next / nextval 的比较不计入；KMP 中 j == -1 的推进不计次；
    //      一旦 j 到达 |T|（首次匹配成功）立即结束，不再扫描主串剩余部分。
    //   2) next / nextval 用 0-based、next[0] = -1 的约定：
    //      next[j] 是 T[0..j-1] 的最长相等真前后缀长度；
    //      nextval[j] = (T[j] == T[next[j]]) ? nextval[next[j]] : next[j]，nextval[0] = -1。
    //   3) KMP 与 KMP+nextval 只差在失配时用哪张表回退。
    // 两行都可能含空格，必须整行读入。
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::string pattern;
    if (!std::getline(std::cin, text)) text.clear();
    if (!std::getline(std::cin, pattern)) pattern.clear();

    const long long n = static_cast<long long>(text.size());
    const long long m = static_cast<long long>(pattern.size());

    // TODO: 这里只做了朴素匹配的计数，请补齐 next / nextval 两张表和两趟 KMP。
    long long i = 0;
    long long j = 0;
    long long naive = 0;
    while (i < n && j < m) {
        ++naive;
        if (text[static_cast<std::size_t>(i)] == pattern[static_cast<std::size_t>(j)]) {
            ++i;
            ++j;
        } else {
            i = i - j + 1;
            j = 0;
        }
    }

    std::cout << naive << ' ' << naive << ' ' << naive << '\n';
    return 0;
}
