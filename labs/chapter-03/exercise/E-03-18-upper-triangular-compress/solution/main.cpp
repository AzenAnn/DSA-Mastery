#include <cstdio>
#include <string>
#include <vector>

namespace {

// 快速读入：一次读入一整块到缓冲区，再按字符解析整数，
// 避免对最多 45150 个整数逐个做格式化输入。
class FastScanner {
public:
    void init(std::FILE* stream) { stream_ = stream; }

    long long nextInt() {
        long long value = 0;
        bool negative = false;
        int current = peek();
        while (current != -1 && current <= ' ') {
            advance();
            current = peek();
        }
        if (current == '-') {
            negative = true;
            advance();
            current = peek();
        }
        while (current >= '0' && current <= '9') {
            value = value * 10 + (current - '0');
            advance();
            current = peek();
        }
        return negative ? -value : value;
    }

private:
    int peek() {
        if (position_ >= size_) {
            if (stream_ == nullptr) return -1;
            size_ = static_cast<int>(std::fread(buffer_, 1, sizeof(buffer_), stream_));
            position_ = 0;
            if (size_ == 0) {
                stream_ = nullptr;
                return -1;
            }
        }
        return static_cast<unsigned char>(buffer_[position_]);
    }

    void advance() { ++position_; }

    char buffer_[1 << 16];
    std::FILE* stream_ = nullptr;
    int position_ = 0;
    int size_ = 0;
};

}  // namespace

int main() {
    FastScanner scanner;
    scanner.init(stdin);

    const long long n = scanner.nextInt();
    const long long total = n * (n + 1) / 2;

    // 压缩数组用 1-based 下标：packed[k] 就是上三角第 k 个元素。
    std::vector<long long> packed(static_cast<std::size_t>(total) + 1, 0);
    for (long long k = 1; k <= total; ++k) {
        packed[static_cast<std::size_t>(k)] = scanner.nextInt();
    }

    // 下三角区域不存储，取值恒为常量 c。
    const long long constant = scanner.nextInt();
    const long long q = scanner.nextInt();

    // 先拼进输出缓冲再一次写出，q 最大 2×10^4 行。
    std::string output;
    output.reserve(static_cast<std::size_t>(q) * 24);
    char line[48];
    for (long long t = 0; t < q; ++t) {
        const long long i = scanner.nextInt();
        const long long j = scanner.nextInt();

        long long k = 0;
        long long value = constant;
        if (i <= j) {
            // 前 i 行（第 0 行到第 i−1 行）共有 i(2n−i+1)/2 个元素，
            // 再加上本行的 j−i 个，最后换成 1-based。
            k = i * (2 * n - i + 1) / 2 + (j - i) + 1;
            value = packed[static_cast<std::size_t>(k)];
        }

        const int length = std::snprintf(line, sizeof(line), "%lld %lld\n", k, value);
        output.append(line, static_cast<std::size_t>(length));
    }
    std::fwrite(output.data(), 1, output.size(), stdout);
    return 0;
}
