#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int childCount = 0;
    int cookieCount = 0;
    if (!(std::cin >> childCount >> cookieCount)) return 0;

    std::vector<int> greed(childCount);
    std::vector<int> cookies(cookieCount);
    for (int& value : greed) std::cin >> value;
    for (int& value : cookies) std::cin >> value;

    std::sort(greed.begin(), greed.end());
    std::sort(cookies.begin(), cookies.end());

    int child = 0;
    for (int cookie = 0; cookie < cookieCount && child < childCount; ++cookie) {
        if (cookies[cookie] >= greed[child]) ++child;
    }

    std::cout << child << '\n';
    return 0;
}
