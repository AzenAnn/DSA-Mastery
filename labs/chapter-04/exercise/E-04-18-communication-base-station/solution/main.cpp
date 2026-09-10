#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < n - 1; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }

    if (n == 1) {
        cout << "0.00\nNODE 1\n";
        return 0;
    }

    auto bfs = [&](int src, vector<ll>& dist, vector<int>& parent, vector<int>& pw) {
        dist.assign(n + 1, -1);
        parent.assign(n + 1, -1);
        pw.assign(n + 1, 0);
        queue<int> q;
        dist[src] = 0;
        q.push(src);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (auto [v, w] : adj[u]) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + w;
                    parent[v] = u;
                    pw[v] = w;
                    q.push(v);
                }
            }
        }
    };

    vector<ll> dist;
    vector<int> parent, pw;

    bfs(1, dist, parent, pw);
    int A = 1;
    for (int i = 1; i <= n; ++i) if (dist[i] > dist[A]) A = i;

    bfs(A, dist, parent, pw);
    int B = A;
    for (int i = 1; i <= n; ++i) if (dist[i] > dist[B]) B = i;

    ll D = dist[B];
    double halfD = D / 2.0;

    vector<int> path;
    for (int u = B; u != -1; u = parent[u]) path.push_back(u);

    ll sum = 0;
    for (int i = 0; i < (int)path.size() - 1; ++i) {
        int v = path[i];
        int u = path[i + 1];
        int w = pw[v];
        if (sum + w == D / 2 && D % 2 == 0) {
            cout << fixed << setprecision(2) << halfD << "\nNODE " << u << "\n";
            return 0;
        }
        if (sum + w > halfD) {
            double d = halfD - sum;
            cout << fixed << setprecision(2) << halfD << "\nEDGE ";
            if (u < v) cout << u << " " << v << " " << fixed << setprecision(2) << d << "\n";
            else cout << v << " " << u << " " << fixed << setprecision(2) << (w - d) << "\n";
            return 0;
        }
        sum += w;
    }

    cout << fixed << setprecision(2) << halfD << "\nNODE " << B << "\n";
    return 0;
}
