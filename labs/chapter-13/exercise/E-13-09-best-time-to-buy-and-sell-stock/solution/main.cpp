#include <algorithm>
#include <iostream>
#include <limits>
using namespace std;
int main() { int n, price, low = numeric_limits<int>::max(), answer = 0; if (!(cin >> n)) return 0; while (n--) { cin >> price; if (price < low) low = price; else answer = max(answer, price - low); } cout << answer << '\n'; }
