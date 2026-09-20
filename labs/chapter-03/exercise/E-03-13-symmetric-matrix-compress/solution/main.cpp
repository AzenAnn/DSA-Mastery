#include <cstdio>
#include <string>
#include <vector>

namespace {

// 快速读入：一次读入一整块到缓冲区，再按字符解析整数，
// 避免对最多约 5×10^5 个整数逐个做格式化输入。
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

    // 压缩数组用 1-based 下标，packed[k] 就是 A[i][j] 的值。
    std::vector<long long> packed(static_cast<std::size_t>(total) + 1, 0);
    for (long long k = 1; k <= total; ++k) {
        packed[static_cast<std::size_t>(k)] = scanner.nextInt();
    }

    const long long q = scanner.nextInt();

    // 先拼进输出缓冲再一次写出，q 最大 2×10^4 行。
    std::string output;
    output.reserve(static_cast<std::size_t>(q) * 20);
    char line[32];
    for (long long t = 0; t < q; ++t) {
        const long long i = scanner.nextInt();
        const long long j = scanner.nextInt();
        long long k = 0;
        if (i >= j) {
            // i >= j：直接在下三角里定位。
            k = i * (i + 1) / 2 + j + 1;
        } else {
            // i < j：按对称性 A[i][j] = A[j][i]，交换行列后套同一公式。
            k = j * (j + 1) / 2 + i + 1;
        }
        const int length = std::snprintf(line, sizeof(line), "%lld %lld\n", k,
                                         packed[static_cast<std::size_t>(k)]);
        output.append(line, static_cast<std::size_t>(length));
    }
    std::fwrite(output.data(), 1, output.size(), stdout);
    return 0;
}
