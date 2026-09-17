// Lab 03-E-16 学生骨架：插入已经写好，删除分支还没实现。
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
    // TODO: 本题要求实现两种操作，目前只完成了插入，删除分支还是空的。
    //   1) `I p T`：在 0-based 下标 p 处插入串 T；若插入后长度超过 cap，只保留前 cap 个字符，
    //      其余丢弃，并把被丢弃的字符数累加进“被截断丢弃的字符总数”。
    //      ——这一条已经写好，可以对照 cap 恰好填满 / 插入被截断的用例自查。
    //   2) `D p len`：从 0-based 下标 p 起删除 len 个字符；若 p + len 超过当前串长，
    //      只删到末尾，并把**真正删掉**的字符数累加进“删除字符总数”。
    //      ——这里现在什么都不做，所以删除总数恒为 0，凡是含删除操作的用例都会出错。
    //   3) 输出两行：第一行是最终串（可能为空行）；第二行是三个整数
    //      `最终长度 被截断丢弃的字符总数 删除字符总数`。
    // 提示：删除越界是正常输入，不要输出 ERROR；空插入串 T 与 len=0 也都是合法操作。
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
    long long deleted = 0;    // 被删除的字符总数（TODO：删除分支还没写，所以恒为 0）

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
            // TODO: 在这里实现删除（注意越界要删到末尾，并把真正删掉的字符数累加到 deleted）。
            skipSpaces(line, pos);
            const long long count = readInt(line, pos);
            (void)count;
        }
    }

    std::cout << text << '\n';
    std::cout << static_cast<long long>(text.size()) << ' ' << truncated << ' ' << deleted << '\n';
    return 0;
}
