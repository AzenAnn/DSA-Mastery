#include <bits/stdc++.h>
using namespace std;

string encode(int u, int p, const vector<vector<int>>& adj) {
    vector<string> childCodes;
    for (int v : adj[u]) {
        if (v == p) continue;
        childCodes.push_back(encode(v, u, adj));
    }
    sort(childCodes.begin(), childCodes.end());
    return "(" + accumulate(childCodes.begin(), childCodes.end(), string("")) + ")";
}

vector<int> findCentroids(int n, const vector<vector<int>>& adj) {
    vector<int> sz(n + 1, 0);
    function<void(int, int)> dfs = [&](int u, int p) {
        sz[u] = 1;
        for (int v : adj[u]) {
            if (v == p) continue;
            dfs(v, u);
            sz[u] += sz[v];
        }
    };
    dfs(1, 0);

    vector<int> cents;
    int minMax = n;
    function<void(int, int)> dfs2 = [&](int u, int p) {
        int mx = n - sz[u];
        for (int v : adj[u]) {
            if (v == p) continue;
            mx = max(mx, sz[v]);
        }
        if (mx < minMax) {
            minMax = mx;
            cents = {u};
        } else if (mx == minMax) {
            cents.push_back(u);
        }
        for (int v : adj[u]) {
            if (v == p) continue;
            dfs2(v, u);
        }
    };
    dfs2(1, 0);
    return cents;
}

set<string> getCodes(int n, const vector<vector<int>>& adj) {
    auto cents = findCentroids(n, adj);
    set<string> codes;
    for (int c : cents) {
        codes.insert(encode(c, 0, adj));
    }
    return codes;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n1;
    if (!(cin >> n1)) return 0;
    vector<vector<int>> adj1(n1 + 1);
    for (int i = 0; i < n1 - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj1[u].push_back(v);
        adj1[v].push_back(u);
    }

    int n2;
    cin >> n2;
    vector<vector<int>> adj2(n2 + 1);
    for (int i = 0; i < n2 - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj2[u].push_back(v);
        adj2[v].push_back(u);
    }

    if (n1 != n2) {
        cout << "NON-ISOMORPHIC\n";
        return 0;
    }

    auto codes1 = getCodes(n1, adj1);
    auto codes2 = getCodes(n2, adj2);

    for (const auto& s : codes1) {
        if (codes2.count(s)) {
            cout << "ISOMORPHIC\n";
            return 0;
        }
    }
    cout << "NON-ISOMORPHIC\n";
    return 0;
}
