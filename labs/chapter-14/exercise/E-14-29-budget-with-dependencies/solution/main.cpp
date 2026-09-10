#include <bits/stdc++.h>
using namespace std;

struct Item {
    int price = 0;
    int value = 0;
    int parent = 0;
    vector<int> accessories;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int budget, itemCount;
    cin >> budget >> itemCount;
    vector<Item> items(itemCount + 1);
    for (int i = 1; i <= itemCount; ++i) {
        int importance;
        cin >> items[i].price >> importance >> items[i].parent;
        items[i].value = items[i].price * importance;
    }
    for (int i = 1; i <= itemCount; ++i) {
        if (items[i].parent != 0) items[items[i].parent].accessories.push_back(i);
    }

    vector<long long> dp(budget + 1);
    for (int i = 1; i <= itemCount; ++i) {
        if (items[i].parent != 0) continue;
        vector<pair<int, int>> options{{items[i].price, items[i].value}};
        for (int accessory : items[i].accessories) {
            options.push_back({items[i].price + items[accessory].price,
                               items[i].value + items[accessory].value});
        }
        if (items[i].accessories.size() == 2) {
            int first = items[i].accessories[0];
            int second = items[i].accessories[1];
            options.push_back({items[i].price + items[first].price + items[second].price,
                               items[i].value + items[first].value + items[second].value});
        }
        vector<long long> previous = dp;
        for (int space = 0; space <= budget; ++space) {
            for (const auto& [price, value] : options) {
                if (price <= space) dp[space] = max(dp[space], previous[space - price] + value);
            }
        }
    }
    cout << dp[budget] << '\n';
    return 0;
}
