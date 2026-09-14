#include <iostream>
using namespace std;
int main() { int n, bill, five = 0, ten = 0; if (!(cin >> n)) return 0; for (int i = 0; i < n; ++i) { cin >> bill; if (bill == 5) ++five; else if (bill == 10) { if (!five--) { cout << "false\n"; return 0; } ++ten; } else if (ten > 0 && five > 0) { --ten; --five; } else if (five >= 3) five -= 3; else { cout << "false\n"; return 0; } } cout << "true\n"; }
