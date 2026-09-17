// Lab 03-E-16 参考解：定长顺序串的插入与删除。
// 直接用 std::string 模拟：插入后超容量就截断，删除越界就删到末尾，
// 全程维护“被截断丢弃的字符总数”与“被删除的字符总数”。
#include <iostream>
#include <string>

namespace {

// 去掉行尾的换行符与空白：串 S、插入串 T 都不含空白字符，去掉尾部不影响语义
std::string trimRight(const std::string &line) {
    std::size_t end = line.size();
    while (end > 0) {
        const char ch = line[end - 1];
        if (ch == '\r' || ch == '\n' || ch == ' ' || ch == '\t') {
            --end;
        } else {
            break;
        }
    }
    return line.substr(0, end);
}

void skipSpaces(const std::string &line, std::size_t &pos) {
    while (pos < line.size() && (line[pos] == ' ' || line[pos] == '\t')) {
        ++pos;
    }
}

long long readInt(const std::string &line, std::size_t &pos) {
    long long value = 0;
    while (pos < line.size() && line[pos] >= '0' && line[pos] <= '9') {
        value = value * 10 + (line[pos] - '0');
        ++pos;
    }
    return value;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string line;
    if (!std::getline(std::cin, line)) {
        return 0;
    }
    const long long cap = std::stoll(trimRight(line));

    std::string text;
    std::getline(std::cin, text);
    text = trimRight(text);

    std::getline(std::cin, line);
    const long long m = std::stoll(trimRight(line));

    long long truncated = 0;  // 被截断丢弃的字符总数
    long long deleted = 0;    // 被删除的字符总数

    for (long long i = 0; i < m; ++i) {
        if (!std::getline(std::cin, line)) {
            break;
        }
        line = trimRight(line);
        std::size_t pos = 0;
        skipSpaces(line, pos);
        if (pos >= line.size()) {
            continue;
        }
        const char op = line[pos];
        ++pos;
        skipSpaces(line, pos);
        long long p = readInt(line, pos);
        if (p > static_cast<long long>(text.size())) {
            p = static_cast<long long>(text.size());
        }

        if (op == 'I') {
            skipSpaces(line, pos);
            const std::string insertText = line.substr(pos);  // 允许为空串
            std::string merged = text.substr(0, static_cast<std::size_t>(p)) + insertText +
                                 text.substr(static_cast<std::size_t>(p));
            if (static_cast<long long>(merged.size()) > cap) {
                truncated += static_cast<long long>(merged.size()) - cap;
                merged.resize(static_cast<std::size_t>(cap));
            }
            text = merged;
        } else {
            skipSpaces(line, pos);
            const long long count = readInt(line, pos);
            const long long begin = p;
            long long end = p + count;
            if (end > static_cast<long long>(text.size())) {
                end = static_cast<long long>(text.size());  // 越界只删到末尾
            }
            if (end > begin) {
                deleted += end - begin;
                text.erase(static_cast<std::size_t>(begin), static_cast<std::size_t>(end - begin));
            }
        }
    }

    std::cout << text << '\n';
    std::cout << static_cast<long long>(text.size()) << ' ' << truncated << ' ' << deleted << '\n';
    return 0;
}
