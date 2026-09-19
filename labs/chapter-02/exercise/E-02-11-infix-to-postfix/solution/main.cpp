#include <cctype>
#include <iostream>
#include <stack>
#include <string>

bool op(char ch) { return ch == '+' || ch == '-' || ch == '*' || ch == '/'; }
int priority(char ch) { return (ch == '*' || ch == '/') ? 2 : 1; }

int main() {
    std::string expression;
    if (!(std::cin >> expression)) return 0;
    std::stack<char> operators;
    std::string output;
    bool expectOperand = true;
    bool valid = true;
    for (char ch : expression) {
        if (std::isalnum(static_cast<unsigned char>(ch))) {
            if (!expectOperand) { valid = false; break; }
            output += ch; expectOperand = false;
        } else if (ch == '(') {
            if (!expectOperand) { valid = false; break; }
            operators.push(ch);
        } else if (ch == ')') {
            if (expectOperand) { valid = false; break; }
            while (!operators.empty() && operators.top() != '(') { output += operators.top(); operators.pop(); }
            if (operators.empty()) { valid = false; break; }
            operators.pop();
        } else if (op(ch)) {
            if (expectOperand) { valid = false; break; }
            while (!operators.empty() && operators.top() != '(' && priority(operators.top()) >= priority(ch)) { output += operators.top(); operators.pop(); }
            operators.push(ch); expectOperand = true;
        } else { valid = false; break; }
    }
    if (expectOperand) valid = false;
    while (valid && !operators.empty()) {
        if (operators.top() == '(') { valid = false; break; }
        output += operators.top(); operators.pop();
    }
    std::cout << (valid ? output : "ERROR") << '\n';
}
