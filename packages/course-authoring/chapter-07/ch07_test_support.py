"""Independent graph oracles for the Ch7 authoring checks (Python standard library)."""
from collections import Counter, deque
from functools import lru_cache
import heapq
import itertools
import sys

sys.setrecursionlimit(30000)
INF = 10**30
MOD = 80112002


def graph_input(n, edges, extra=""):
    return f"{n} {len(edges)}{extra}\n" + "".join(" ".join(map(str, e)) + "\n" for e in edges)


def parse_graph(text):
    lines = text.splitlines()
    head = list(map(int, lines[0].split()))
    return head, [tuple(map(int, line.split())) for line in lines[1:1 + head[1]]]


def adjacency(n, edges, undirected=False):
    graph = [[] for _ in range(n)]
    for u, v, *_ in edges:
        graph[u].append(v)
        if undirected:
            graph[v].append(u)
    return graph


def has_cycle(n, edges):
    graph = adjacency(n, edges)
    color = [0] * n

    def visit(u):
        color[u] = 1
        for v in graph[u]:
            if color[v] == 1 or (color[v] == 0 and visit(v)):
                return True
        color[u] = 2
        return False

    return any(not color[u] and visit(u) for u in range(n))


def floyd(n, edges):
    d = [[INF] * n for _ in range(n)]
    for u in range(n):
        d[u][u] = 0
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
    for k in range(n):
        for u in range(n):
            if d[u][k] == INF:
                continue
            for v in range(n):
                if d[k][v] != INF:
                    d[u][v] = min(d[u][v], d[u][k] + d[k][v])
    return d


def edge_classes(text):
    (n, m), edges = parse_graph(text)
    graph = [[] for _ in range(n)]
    for i, (u, v) in enumerate(edges):
        graph[u].append((v, i))
    for row in graph:
        row.sort()
    entered, exited, tree = [0] * n, [0] * n, set()
    timer = 0

    def visit(u):
        nonlocal timer
        timer += 1
        entered[u] = timer
        for v, i in graph[u]:
            if not entered[v]:
                tree.add(i)
                visit(v)
        timer += 1
        exited[u] = timer

    for u in range(n):
        if not entered[u]:
            visit(u)
    result = []
    for i, (u, v) in enumerate(edges):
        if i in tree:
            label = "TREE"
        elif entered[v] <= entered[u] and exited[u] <= exited[v]:
            label = "BACK"
        elif entered[u] < entered[v] and exited[v] < exited[u]:
            label = "FORWARD"
        else:
            label = "CROSS"
        result.append(f"{i + 1} {label}")
    return "\n".join(result) + ("\n" if result else "")


def euler_status(n, edges):
    parent = list(range(n))
    degree = [0] * n

    def root(u):
        while parent[u] != u:
            u = parent[u]
        return u

    for u, v in edges:
        degree[u] += 1
        degree[v] += 1
        parent[root(u)] = root(v)
    active = [u for u in range(n) if degree[u]]
    odd = [u for u in range(n) if degree[u] % 2]
    valid = len({root(u) for u in active}) <= 1 and len(odd) in (0, 2)
    start = odd[0] if odd else (active[0] if active else 0)
    return valid, start, bool(odd)


def euler(text, trail=False):
    (n, m), edges = parse_graph(text)
    valid, start, odd = euler_status(n, edges)
    if not valid:
        return "Not Eulerian\n"
    if not trail:
        return f"Eulerian Path {start}\n" if odd else "Eulerian Circuit\n"
    graph = [[] for _ in range(n)]
    for i, (u, v) in enumerate(edges):
        heapq.heappush(graph[u], (v, i))
        heapq.heappush(graph[v], (u, i))
    used, reverse = set(), []

    def visit(u):
        while graph[u]:
            v, i = heapq.heappop(graph[u])
            if i not in used:
                used.add(i)
                visit(v)
        reverse.append(u)

    visit(start)
    path = reverse[::-1]
    assert len(path) == m + 1 and path[0] == start
    assert Counter(tuple(sorted(e)) for e in edges) == Counter(
        tuple(sorted(e)) for e in zip(path, path[1:])
    )
    return f"{m}\n" + " ".join(map(str, path)) + "\n"


def courses(text, order=False):
    (n, _), pairs = parse_graph(text)
    edges = [(b, a) for a, b in pairs]
    if has_cycle(n, edges):
        return "-1\n" if order else "NO\n"
    if not order:
        return "YES\n"
    # Repeatedly inspect predecessor sets, independent of indegree bookkeeping.
    prerequisites = [set() for _ in range(n)]
    for u, v in edges:
        prerequisites[v].add(u)
    remaining, completed, result = set(range(n)), set(), []
    while remaining:
        u = min(v for v in remaining if prerequisites[v] <= completed)
        remaining.remove(u)
        completed.add(u)
        result.append(u)
    positions = {v: i for i, v in enumerate(result)}
    assert all(positions[u] < positions[v] for u, v in edges)
    return " ".join(map(str, result)) + "\n"


def safe_states(text):
    (n, _), edges = parse_graph(text)
    graph = adjacency(n, edges)
    color = [0] * n

    def safe(u):
        if color[u]:
            return color[u] == 2
        color[u] = 1
        for v in graph[u]:
            if not safe(v):
                return False
        color[u] = 2
        return True

    result = [u for u in range(n) if safe(u)]
    return f"{len(result)}\n" + " ".join(map(str, result)) + "\n"


def dag(text, mode):
    (n, m), raw = parse_graph(text)
    edges = [(e[0] - (mode != 21), e[1] - (mode != 21), *e[2:]) for e in raw]
    assert not has_cycle(n, edges)
    incoming = [[] for _ in range(n)]
    outgoing = [[] for _ in range(n)]
    for e in edges:
        u, v = e[:2]
        w = e[2] if mode == 21 else 0
        incoming[v].append((u, w))
        outgoing[u].append((v, w))
    # DFS postorder on predecessors; avoid a language recursion limit on long DAGs.
    ordered, seen = [], set()
    for root in range(n):
        stack = [(root, False)]
        while stack:
            u, leaving = stack.pop()
            if leaving:
                ordered.append(u)
            elif u not in seen:
                seen.add(u)
                stack.append((u, True))
                stack.extend((v, False) for v, _ in incoming[u] if v not in seen)
    if mode == 19:
        counts = [0] * n
        for u in ordered:
            counts[u] = sum(counts[v] for v, _ in incoming[u]) % MOD if incoming[u] else 1
        answer = sum(counts[u] for u in range(n) if not outgoing[u]) % MOD
        return f"{answer}\n"
    duration = list(map(int, text.splitlines()[m + 1].split())) if mode == 20 else [0] * n

    finished = [0] * n
    for u in ordered:
        finished[u] = duration[u] + max((finished[v] + w for v, w in incoming[u]), default=0)
    total = max(finished)
    if mode == 20:
        return f"{total}\n"

    tails = [0] * n
    for u in reversed(ordered):
        tails[u] = max((w + tails[v] for v, w in outgoing[u]), default=0)
    critical = [i + 1 for i, (u, v, w) in enumerate(edges) if finished[u] + w + tails[v] == total]
    return f"{total}\n{len(critical)}\n" + " ".join(map(str, critical)) + "\n"


def cities(text):
    (n, _), edges = parse_graph(text)
    weight = [[INF] * n for _ in range(n)]
    for u, v, w in edges:
        u -= 1
        v -= 1
        weight[u][v] = weight[v][u] = min(weight[u][v], w)
    selected, best, total = set(), [INF] * n, 0
    best[0] = 0
    for _ in range(n):
        u = min((v for v in range(n) if v not in selected), key=lambda v: best[v])
        if best[u] == INF:
            return "-1\n"
        selected.add(u)
        total += best[u]
        for v in range(n):
            best[v] = min(best[v], weight[u][v])
    return f"{total}\n"


def points(text):
    rows = text.splitlines()
    n = int(rows[0])
    coords = [tuple(map(int, r.split())) for r in rows[1:]]
    edges = sorted((abs(x - a) + abs(y - b), u, v)
                   for u, (x, y) in enumerate(coords)
                   for v, (a, b) in enumerate(coords[:u]))
    groups = [{u} for u in range(n)]
    owner = list(range(n))
    total = 0
    for w, u, v in edges:
        a, b = owner[u], owner[v]
        if a == b:
            continue
        if len(groups[a]) < len(groups[b]):
            a, b = b, a
        for node in groups[b]:
            owner[node] = a
        groups[a].update(groups[b])
        groups[b].clear()
        total += w
    return f"{total}\n"


def grid(text, effort=False):
    values = list(map(int, text.split()))
    rows, cols = values[:2]
    data = values[2:]
    if not effort and (data[0] or data[-1]):
        return "-1\n"
    distance = [INF] * len(data)
    distance[0] = 0
    ready = [(0, 0)]
    while ready:
        d, u = heapq.heappop(ready)
        if distance[u] != d:
            continue
        if u == len(data) - 1:
            return f"{d}\n"
        r, c = divmod(u, cols)
        for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
            if not (0 <= nr < rows and 0 <= nc < cols):
                continue
            v = nr * cols + nc
            if not effort and data[v]:
                continue
            new = max(d, abs(data[u] - data[v])) if effort else d + 1
            if new < distance[v]:
                distance[v] = new
                heapq.heappush(ready, (new, v))
    return "-1\n"


def wormholes(text):
    data = iter(map(int, text.split()))
    answer = []
    for _ in range(next(data)):
        n, m, w = next(data), next(data), next(data)
        edges = []
        for _ in range(m):
            u, v, t = next(data) - 1, next(data) - 1, next(data)
            edges.extend([(u, v, t), (v, u, t)])
        for _ in range(w):
            u, v, t = next(data) - 1, next(data) - 1, next(data)
            edges.append((u, v, -t))
        d = floyd(n, edges)
        answer.append("YES" if any(d[u][u] < 0 for u in range(n)) else "NO")
    return "\n".join(answer) + "\n"


def heuristics(text):
    (n, m, target, k), edges = parse_graph(text)
    d = floyd(n, edges)
    rows = text.splitlines()
    output = []
    for row in rows[m + 1:m + 1 + k]:
        h = list(map(int, row.split()))
        admissible = h[target] == 0 and all(h[u] <= d[u][target] for u in range(n))
        consistent = h[target] == 0 and all(h[u] <= w + h[v] for u, v, w in edges)
        assert not consistent or admissible
        output.append(f"{'YES' if admissible else 'NO'} {'YES' if consistent else 'NO'}")
    return "\n".join(output) + "\n"


@lru_cache(None)
def puzzle_distances():
    goal = "123804765"
    distance, ready = {goal: 0}, deque([goal])
    while ready:
        state = ready.popleft()
        zero = state.index("0")
        r, c = divmod(zero, 3)
        for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
            if 0 <= nr < 3 and 0 <= nc < 3:
                cells = list(state)
                v = nr * 3 + nc
                cells[zero], cells[v] = cells[v], cells[zero]
                new = "".join(cells)
                if new not in distance:
                    distance[new] = distance[state] + 1
                    ready.append(new)
    assert len(distance) == 181440
    return distance


def maxflow(n, edges, source, sink):
    # Dinic level graph, distinct from the C++ Edmonds-Karp solution.
    graph = [[] for _ in range(n)]
    for u, v, cap in edges:
        forward, backward = [v, cap, None], [u, 0, None]
        forward[2], backward[2] = backward, forward
        graph[u].append(forward)
        graph[v].append(backward)
    total = 0
    while True:
        level, ready = [-1] * n, deque([source])
        level[source] = 0
        while ready:
            u = ready.popleft()
            for v, cap, _ in graph[u]:
                if cap and level[v] == -1:
                    level[v] = level[u] + 1
                    ready.append(v)
        if level[sink] == -1:
            return total
        next_edge = [0] * n

        def push(u, amount):
            if u == sink:
                return amount
            while next_edge[u] < len(graph[u]):
                e = graph[u][next_edge[u]]
                if e[1] and level[e[0]] == level[u] + 1:
                    sent = push(e[0], min(amount, e[1]))
                    if sent:
                        e[1] -= sent
                        e[2][1] += sent
                        return sent
                next_edge[u] += 1
            return 0

        while True:
            sent = push(source, INF)
            if not sent:
                break
            total += sent


def matching(text, pairs=False):
    rows = text.splitlines()
    if pairs:
        left, total = map(int, rows[0].split())
        right = total - left
        edges = [(a - 1, b - left - 1) for a, b in
                 (map(int, row.split()) for row in rows[1:-1])]
    else:
        left, right, _ = map(int, rows[0].split())
        edges = [(a - 1, b - 1) for a, b in (map(int, row.split()) for row in rows[1:])]
    network = [(left + right, u, 1) for u in range(left)]
    network += [(left + v, left + right + 1, 1) for v in range(right)]
    network += [(u, left + v, 1) for u, v in edges]
    optimum = maxflow(left + right + 2, network, left + right, left + right + 1)
    if not pairs:
        return f"{optimum}\n"
    # Canonical witness follows the published traversal contract.
    graph, owner = [set() for _ in range(left)], {}
    for u, v in edges:
        graph[u].add(v)

    def augment(u, seen):
        for v in sorted(graph[u]):
            if v in seen:
                continue
            seen.add(v)
            if v not in owner or augment(owner[v], seen):
                owner[v] = u
                return True
        return False

    for u in range(left):
        augment(u, set())
    result = sorted((u + 1, v + left + 1) for v, u in owner.items())
    assert len(result) == optimum
    assert len({u for u, _ in result}) == optimum
    assert all((u - 1, v - left - 1) in edges for u, v in result)
    return f"{optimum}\n" + "".join(f"{u} {v}\n" for u, v in result)


def network(text):
    (n, _, source, sink), raw = parse_graph(text)
    source -= 1
    sink -= 1
    edges = [(u - 1, v - 1, cap) for u, v, cap in raw]
    answer = maxflow(n, edges, source, sink)
    if n <= 10:
        cuts = [sum(c for u, v, c in edges if mask >> u & 1 and not mask >> v & 1)
                for mask in range(1 << n) if mask >> source & 1 and not mask >> sink & 1]
        assert answer == min(cuts)
    return f"{answer}\n"


def cost_flow(text):
    (n, _, source, sink), raw = parse_graph(text)
    source -= 1
    sink -= 1
    edges = [(u - 1, v - 1, cap, cost) for u, v, cap, cost in raw]
    # Enumerate feasible integral flows for tiny networks: no shortest-path code.
    if len(edges) <= 9 and all(cap <= 3 for _, _, cap, _ in edges):
        best = (0, 0)
        for amounts in itertools.product(*(range(cap + 1) for _, _, cap, _ in edges)):
            balance, cost = [0] * n, 0
            for (u, v, _, w), amount in zip(edges, amounts):
                balance[u] += amount
                balance[v] -= amount
                cost += w * amount
            if any(balance[u] for u in range(n) if u not in (source, sink)):
                continue
            if balance[source] < 0 or balance[sink] != -balance[source]:
                continue
            best = max(best, (balance[source], -cost))
        return f"{best[0]} {-best[1]}\n"
    # Large stress fixtures deliberately contain independent two-edge channels.
    outgoing = {v: (cap, w) for u, v, cap, w in edges if u == source}
    incoming = {u: (cap, w) for u, v, cap, w in edges if v == sink}
    assert len(edges) == len(outgoing) + len(incoming)
    assert outgoing.keys() == incoming.keys()
    flow = cost = 0
    for u in outgoing:
        a, b = outgoing[u], incoming[u]
        amount = min(a[0], b[0])
        flow += amount
        cost += amount * (a[1] + b[1])
    return f"{flow} {cost}\n"


ORACLES = {
    13: edge_classes, 14: euler, 15: lambda s: euler(s, True),
    16: courses, 17: lambda s: courses(s, True), 18: safe_states,
    19: lambda s: dag(s, 19), 20: lambda s: dag(s, 20), 21: lambda s: dag(s, 21),
    22: cities, 23: points, 24: lambda s: grid(s, True), 25: wormholes,
    26: grid, 27: heuristics, 28: lambda s: f"{puzzle_distances().get(s.strip(), -1)}\n",
    29: matching, 30: lambda s: matching(s, True), 31: network, 32: cost_flow,
}
