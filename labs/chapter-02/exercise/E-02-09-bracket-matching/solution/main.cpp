#include <iostream>
#include <stack>
#include <string>

bool matches(char left, char right) {
    return (left == '(' && right == ')') || (left == '[' && right == ']') ||
           (left == '{' && right == '}');
}

int main() {
    std::string text;
    if (!(std::cin >> text)) return 0;
    std::stack<char> pending;
    for (char ch : text) {
        if (ch == '(' || ch == '[' || ch == '{') pending.push(ch);
        else if (ch == ')' || ch == ']' || ch == '}') {
            if (pending.empty() || !matches(pending.top(), ch)) {
                std::cout << "NO\n";
                return 0;
            }
            pending.pop();
        }
    }
    std::cout << (pending.empty() ? "YES" : "NO") << '\n';
}
