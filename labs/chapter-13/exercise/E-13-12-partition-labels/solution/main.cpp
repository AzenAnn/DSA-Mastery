#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() { string s; if (!(cin >> s)) return 0; vector<int> last(26); for (int i = 0; i < (int)s.size(); ++i) last[s[i] - 'a'] = i; vector<int> parts; int start = 0, end = 0; for (int i = 0; i < (int)s.size(); ++i) { end = max(end, last[s[i] - 'a']); if (i == end) { parts.push_back(end - start + 1); start = i + 1; } } cout << parts.size() << '\n'; for (int i = 0; i < (int)parts.size(); ++i) cout << (i ? " " : "") << parts[i]; cout << '\n'; }
