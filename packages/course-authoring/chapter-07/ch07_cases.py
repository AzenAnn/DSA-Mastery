"""Named, deterministic fixtures. No reference executable is used to write answers."""
import random
from ch07_test_support import graph_input, puzzle_distances


def matrix_input(rows):
    return f"{len(rows)} {len(rows[0])}\n" + "".join(" ".join(map(str, row)) + "\n" for row in rows)


def fixtures(lab_id):
    rng = random.Random(70700 + lab_id)
    cases = []

    def add(name, data, tag="regression"):
        cases.append((name, data, tag))

    def graph(name, n, edges, tag="regression", extra=""):
        add(name, graph_input(n, edges, extra), tag)

    if lab_id == 13:
        graph("sample", 5, [(0, 2), (0, 1), (1, 2), (2, 0), (0, 3), (3, 2), (4, 0)], "sample")
        graph("singleton", 1, [], "boundary")
        graph("self-loop", 1, [(0, 0)], "boundary")
        graph("parallel-edge-forward", 2, [(0, 1), (0, 1)], "regression")
        graph("later-tree-cross", 4, [(0, 1), (2, 3), (3, 1)])
        graph("black-descendant-forward", 3, [(0, 2), (0, 1), (1, 2)])
        graph("input-order-vs-neighbor-order", 4, [(0, 3), (0, 2), (0, 1), (1, 3), (2, 3)])
        graph("isolated-root", 5, [(1, 4), (4, 3), (3, 1)])
        for i in range(9):
            n = i + 4
            edges = [(rng.randrange(n), rng.randrange(n)) for _ in range(3 * n)]
            graph(f"seeded-directed-{i}", n, edges, "normal")
        graph("long-chain", 2000, [(u, u + 1) for u in range(1999)], "stress")
        graph("dense-directed", 80, [(u, v) for u in range(80) for v in range(80)], "stress")
        graph("many-dfs-roots", 10000, [(9999, 0)], "stress")
    elif lab_id in (14, 15):
        graph("sample", 3, [(0, 1), (1, 2), (2, 0)], "sample")
        graph("singleton-empty", 1, [], "boundary")
        graph("many-isolated", 6, [], "boundary")
        graph("isolated-zero", 5, [(2, 3), (3, 4), (4, 2)])
        graph("two-disconnected-cycles", 6, [(0, 1), (1, 2), (2, 0), (3, 4), (4, 5), (5, 3)])
        graph("two-odd", 5, [(4, 3), (3, 2), (2, 1)])
        graph("four-odd", 4, [(0, 1), (0, 2), (0, 3)])
        graph("seven-bridges", 4, [(0, 1), (0, 1), (0, 2), (0, 2), (0, 3), (1, 3), (2, 3)])
        graph("self-loop", 3, [(2, 2)])
        graph("parallel-bridges", 2, [(0, 1), (0, 1)])
        graph("bridge-must-be-spliced", 4, [(0, 1), (0, 2), (2, 3), (3, 0)])
        graph("disconnected-loops", 3, [(0, 0), (2, 2)])
        for i in range(5):
            n = 6 + i
            walk = [rng.randrange(n) for _ in range(20 + i)]
            if i % 2:
                walk.append(walk[0])
            edges = list(zip(walk, walk[1:]))
            rng.shuffle(edges)
            graph(f"seeded-walk-{i}", n, edges, "normal")
        graph("long-chain", 2000, [(u, u + 1) for u in range(1999)], "stress")
        graph("many-parallel", 2, [(0, 1)] * 3000, "stress")
        graph("max-vertices-isolated", 10000, [(9998, 9999)], "stress")
    elif lab_id in (16, 17, 18, 19, 20, 21):
        patterns = [
            ("sample", 4, [(0, 2), (1, 2), (2, 3)], "sample"),
            ("singleton", 1, [], "boundary"),
            ("no-edges", 8, [], "boundary"),
            ("diamond", 4, [(0, 1), (0, 2), (1, 3), (2, 3)], "regression"),
            ("new-small-ready-vertex", 4, [(1, 0)], "regression"),
            ("disconnected", 7, [(1, 2), (2, 3), (4, 5)], "boundary"),
            ("many-sources", 8, [(u, 7) for u in range(7)], "normal"),
            ("many-sinks", 8, [(0, v) for v in range(1, 8)], "normal"),
        ]
        if lab_id in (16, 17, 18):
            patterns += [
                ("self-loop", 3, [(1, 1)], "regression"),
                ("disconnected-cycle", 6, [(0, 1), (3, 4), (4, 3)], "regression"),
                ("cycle-with-exit", 4, [(0, 1), (1, 0), (1, 2), (2, 3)], "regression"),
                ("edge-into-cycle", 5, [(0, 1), (1, 2), (2, 1), (3, 4)], "regression"),
            ]
        else:
            patterns += [
                ("non-numeric-topological-order", 5, [(4, 2), (2, 0), (3, 1)], "regression"),
                ("two-components-different-length", 6, [(0, 1), (1, 2), (3, 4)], "regression"),
                ("shortcut-does-not-dominate", 4, [(0, 1), (1, 2), (2, 3), (0, 3)], "regression"),
                ("isolated-is-a-chain", 3, [(0, 1)], "regression"),
            ]
        for i in range(5):
            n = 8 + i
            labels = list(range(n))
            rng.shuffle(labels)
            edges = [(labels[u], labels[v]) for u in range(n) for v in range(u + 1, n)
                     if rng.random() < .3 + i * .05]
            patterns.append((f"seeded-dag-{i}", n, edges, "normal"))
        patterns += [
            ("long-chain", 1000, [(u, u + 1) for u in range(999)], "stress"),
            ("layered-many-paths", 82, [(0, 1), (0, 2)] +
             [(u, v) for layer in range(39) for u in (1 + 2 * layer, 2 + 2 * layer)
              for v in (3 + 2 * layer, 4 + 2 * layer)] + [(79, 81), (80, 81)], "stress"),
            ("dense-dag", 120, [(u, v) for u in range(120) for v in range(u + 1, 120)], "stress"),
        ]
        for name, n, edges, tag in patterns:
            if lab_id in (16, 17):
                graph(name, n, [(v, u) for u, v in edges], tag)
            elif lab_id == 18:
                graph(name, n, edges, tag)
            elif lab_id == 19:
                graph(name, n, [(u + 1, v + 1) for u, v in edges], tag)
            elif lab_id == 20:
                duration = [rng.randint(1, 10000) for _ in range(n)]
                if name == "sample":
                    duration = [3, 2, 5, 4]
                add(name, graph_input(n, [(u + 1, v + 1) for u, v in edges]) +
                    " ".join(map(str, duration)) + "\n", tag)
            else:
                weighted = [(u, v, 10**9 if name == "long-chain" else rng.randint(0, 15))
                            for u, v in edges]
                if name == "sample":
                    weighted = [(0, 2, 3), (1, 2, 2), (2, 3, 5)]
                graph(name, n, weighted, tag)
    elif lab_id == 22:
        graph("sample", 3, [(1, 2, 1), (2, 3, 2), (1, 3, 9)], "sample")
        graph("singleton", 1, [], "boundary")
        graph("disconnected", 4, [(1, 2, 1), (3, 4, 1)], "boundary")
        graph("parallel-cheaper-later", 3, [(1, 2, 9), (1, 2, 1), (2, 3, 2)])
        graph("zero-cost", 3, [(1, 2, 0), (2, 3, 0)])
        graph("cycle-cheapest", 4, [(1, 2, 1), (2, 3, 1), (3, 1, 1), (3, 4, 8)])
        graph("large-total", 4, [(1, 2, 10**9), (2, 3, 10**9), (3, 4, 10**9)])
        for i in range(10):
            n = i + 5
            edges = [(u, v, rng.randint(0, 50)) for u in range(1, n + 1)
                     for v in range(u + 1, n + 1) if rng.random() < .25 + i * .04]
            graph(f"seeded-weighted-{i}", n, edges, "normal")
        graph("long-chain", 500, [(u, u + 1, u) for u in range(1, 500)], "stress")
        graph("dense-equal", 100, [(u, v, 7) for u in range(1, 101) for v in range(u + 1, 101)], "stress")
        graph("isolated-last", 500, [(u, u + 1, 1) for u in range(1, 499)], "stress")
    elif lab_id == 23:
        point_sets = [
            ("sample", [(0, 0), (2, 2), (3, 10), (5, 2), (7, 0)], "sample"),
            ("singleton", [(8, -9)], "boundary"),
            ("negative-quadrants", [(-3, -4), (4, 3), (-3, 3)], "regression"),
            ("coordinate-extremes", [(-1000000, -1000000), (1000000, 1000000)], "boundary"),
            ("square-ties", [(0, 0), (0, 1), (1, 0), (1, 1)], "regression"),
            ("collinear", [(i * 7, 0) for i in range(12)], "normal"),
            ("diagonal", [(i, i) for i in range(15)], "normal"),
        ]
        for i in range(10):
            coords = rng.sample([(x, y) for x in range(-20, 21) for y in range(-20, 21)], i + 5)
            point_sets.append((f"seeded-points-{i}", coords, "normal"))
        point_sets += [
            ("max-points", [(i * 1000, (i % 7) * 10000) for i in range(1000)], "stress"),
            ("grid", [(x * 3, y * 7) for x in range(20) for y in range(20)], "stress"),
            ("two-clusters", [(i, 0) for i in range(100)] + [(1000000 - i, 1000000) for i in range(100)], "stress"),
        ]
        for name, points, tag in point_sets:
            add(name, f"{len(points)}\n" + "".join(f"{x} {y}\n" for x, y in points), tag)
    elif lab_id in (24, 26):
        if lab_id == 24:
            grids = [
                ("sample", [[1, 2, 2], [3, 8, 2], [5, 3, 5]], "sample"),
                ("singleton", [[99]], "boundary"),
                ("flat", [[7] * 4 for _ in range(3)], "boundary"),
                ("single-row", [[1, 10, 11, 12]], "boundary"),
                ("single-column", [[1], [9], [2], [7]], "boundary"),
                ("detour-beats-direct", [[1, 99, 1], [1, 99, 1], [1, 1, 1]], "regression"),
                ("bottleneck-not-sum", [[1, 2, 3], [3, 8, 4], [5, 3, 5]], "regression"),
                ("max-height-gap", [[1, 1000000]], "boundary"),
            ]
        else:
            grids = [
                ("sample", [[0, 1, 0], [0, 1, 0], [0, 0, 0]], "sample"),
                ("singleton-open", [[0]], "boundary"),
                ("singleton-blocked", [[1]], "boundary"),
                ("blocked-start", [[1, 0], [0, 0]], "boundary"),
                ("blocked-target", [[0, 0], [0, 1]], "boundary"),
                ("diagonal-forbidden", [[0, 1], [1, 0]], "regression"),
                ("single-row-wall", [[0, 0, 1, 0]], "boundary"),
                ("forced-detour", [[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0]], "regression"),
            ]
        for i in range(9):
            r, c = i + 4, 13 - i
            rows = [[rng.randint(1, 1000) if lab_id == 24 else int(rng.random() < .3)
                     for _ in range(c)] for _ in range(r)]
            if lab_id == 26:
                rows[0][0] = rows[-1][-1] = 0
            grids.append((f"seeded-grid-{i}", rows, "normal"))
        grids += [
            ("max-grid", [[r + c + 1 if lab_id == 24 else 0 for c in range(100)] for r in range(100)], "stress"),
            ("checkerboard", [[1 + (r + c) % 2 * 999999 if lab_id == 24 else (r + c) % 2
                              for c in range(60)] for r in range(60)], "stress"),
            ("long-corridor", [[i + 1 if lab_id == 24 else 0 for i in range(100)]], "stress"),
        ]
        for name, rows, tag in grids:
            add(name, matrix_input(rows), tag)
    elif lab_id == 25:
        def worm(name, groups, tag="regression"):
            data = str(len(groups)) + "\n"
            for n, roads, holes in groups:
                data += f"{n} {len(roads)} {len(holes)}\n"
                data += "".join(" ".join(map(str, e)) + "\n" for e in roads + holes)
            add(name, data, tag)
        worm("sample", [(3, [(1, 2, 2), (2, 3, 2)], [(3, 1, 5)])], "sample")
        worm("singleton-empty", [(1, [], [])], "boundary")
        worm("negative-self-loop", [(1, [], [(1, 1, 1)])], "boundary")
        worm("disconnected-negative-cycle", [(4, [(1, 2, 1)], [(3, 4, 1), (4, 3, 1)])])
        worm("negative-edge-no-cycle", [(3, [], [(1, 2, 10)])])
        worm("zero-total-cycle", [(2, [(1, 2, 3)], [(2, 1, 3)])])
        worm("road-is-bidirectional", [(2, [(1, 2, 2)], [(1, 2, 3)])])
        worm("parallel-road-minimum", [(2, [(1, 2, 9), (1, 2, 2)], [(2, 1, 3)])])
        worm("reset-between-groups", [(2, [], [(1, 1, 1)]), (2, [], []), (3, [(1, 2, 1)], [])])
        for i in range(8):
            n = i + 3
            roads = [(u, v, rng.randint(1, 20)) for u in range(1, n + 1)
                     for v in range(u + 1, n + 1) if rng.random() < .2]
            holes = [(rng.randint(1, n), rng.randint(1, n), rng.randint(1, 10)) for _ in range(i)]
            worm(f"seeded-wormholes-{i}", [(n, roads, holes)], "normal")
        worm("max-vertices-empty", [(500, [], [])], "stress")
        worm("dense-positive", [(70, [(u, v, 100) for u in range(1, 71) for v in range(u + 1, 71)], [])], "stress")
        worm("long-negative-chain", [(100, [], [(u, u + 1, 1) for u in range(1, 100)])], "stress")
    elif lab_id == 27:
        def heuristic(name, n, edges, target, hs, tag="regression"):
            add(name, graph_input(n, edges, f" {target} {len(hs)}") +
                "".join(" ".join(map(str, h)) + "\n" for h in hs), tag)
        heuristic("sample", 3, [(0, 1, 1), (1, 2, 1)], 2,
                  [[2, 1, 0], [2, 0, 0], [3, 1, 0]], "sample")
        heuristic("singleton", 1, [], 0, [[0], [1]], "boundary")
        heuristic("unreachable-finite-estimate", 3, [(0, 1, 5)], 2,
                  [[100, 95, 0], [100, 0, 0], [0, 0, 0]])
        heuristic("goal-normalization", 2, [(0, 1, 5)], 1, [[0, 1]])
        heuristic("zero-weight-equality", 3, [(0, 1, 0), (1, 2, 3)], 2, [[3, 3, 0], [3, 2, 0]])
        heuristic("directed-only", 3, [(2, 1, 1), (1, 0, 1)], 2, [[99, 99, 0], [0, 1, 0]])
        heuristic("parallel-min-weight", 2, [(0, 1, 7), (0, 1, 2)], 1, [[3, 0], [2, 0]])
        heuristic("self-loop", 2, [(0, 0, 0), (0, 1, 2)], 1, [[2, 0]])
        for i in range(9):
            n = i + 4
            edges = [(u, v, rng.randint(0, 20)) for u in range(n) for v in range(n)
                     if rng.random() < .2]
            hs = [[0] * n]
            for _ in range(4):
                h = [rng.randint(0, 30) for _ in range(n)]
                h[-1] = 0
                hs.append(h)
            heuristic(f"seeded-heuristics-{i}", n, edges, n - 1, hs, "normal")
        heuristic("large-distance", 5, [(u, u + 1, 10**9) for u in range(4)], 4,
                  [[(4 - u) * 10**9 for u in range(5)]], "stress")
        heuristic("many-candidates", 30, [(u, u + 1, 1) for u in range(29)], 29,
                  [[min(29 - u, k) for u in range(30)] for k in range(50)], "stress")
        heuristic("dense-zero-graph", 100, [(u, v, 0) for u in range(100) for v in range(100)],
                  0, [[0] * 100, [0] + [1] * 99], "stress")
    elif lab_id == 28:
        add("sample", "123840765\n", "sample")
        add("already-goal", "123804765\n", "boundary")
        add("leading-zero", "023184765\n", "boundary")
        add("opposite-parity", "213804765\n", "regression")
        add("usual-goal-is-not-this-goal", "123456780\n", "regression")
        distance = puzzle_distances()
        for depth in range(2, 17):
            state = next(s for s, d in distance.items() if d == depth)
            add(f"optimal-distance-{depth}", state + "\n", "normal" if depth < 14 else "stress")
        # Include maximum depth while keeping exactly twenty cases.
        cases[-1] = ("maximum-distance", max(distance, key=distance.get) + "\n", "stress")
    elif lab_id in (29, 30):
        def match(name, left, right, edges, tag="regression"):
            if lab_id == 29:
                data = f"{left} {right} {len(edges)}\n" + "".join(f"{u} {v}\n" for u, v in edges)
            else:
                data = f"{left} {left + right}\n" + "".join(f"{u} {left + v}\n" for u, v in edges) + "-1 -1\n"
            add(name, data, tag)
        match("sample", 2, 2, [(1, 1), (1, 2), (2, 1)], "sample")
        match("no-edges", 1, 1, [], "boundary")
        match("single-pair", 1, 1, [(1, 1)], "boundary")
        match("many-left-one-right", 5, 1, [(u, 1) for u in range(1, 6)])
        match("one-left-many-right", 1, 5, [(1, v) for v in range(5, 0, -1)])
        match("augment-long-chain", 5, 5, [(u, v) for u in range(1, 5) for v in (u, u + 1)] + [(5, 1)])
        match("complete-ties", 3, 3, [(u, v) for u in range(3, 0, -1) for v in range(3, 0, -1)])
        match("hall-deficient", 4, 4, [(u, v) for u in range(1, 5) for v in (1, 2)])
        for i in range(9):
            left, right = i + 3, 12 - i
            edges = [(u, v) for u in range(1, left + 1) for v in range(1, right + 1)
                     if rng.random() < .3]
            rng.shuffle(edges)
            match(f"seeded-matching-{i}", left, right, edges, "normal")
        match("dense", 80, 80, [(u, v) for u in range(1, 81) for v in range(1, 81)], "stress")
        match("large-sparse", 100, 100, [(u, u) for u in range(1, 101)], "stress")
        match("large-deficient", 100, 100, [(u, 1) for u in range(1, 101)], "stress")
    elif lab_id in (31, 32):
        def flow(name, n, edges, tag="regression", source=1, sink=None):
            graph(name, n, edges, tag, f" {source} {sink or n}")
        if lab_id == 31:
            flow("sample", 4, [(1, 2, 3), (1, 3, 2), (2, 4, 2), (3, 4, 4)], "sample")
            flow("no-edges", 2, [], "boundary")
            flow("zero-capacity", 2, [(1, 2, 0)], "boundary")
            flow("parallel-edges", 2, [(1, 2, 3), (1, 2, 4)])
            flow("opposite-input-edges", 3, [(1, 2, 5), (2, 1, 7), (2, 3, 4)])
            flow("reverse-residual-required", 6,
                 [(1, 2, 1), (1, 3, 1), (2, 4, 1), (2, 5, 1), (3, 4, 1), (4, 6, 1), (5, 6, 1)])
            flow("large-flow", 4, [(1, 2, 2000000000), (1, 3, 2000000000), (2, 4, 2000000000), (3, 4, 2000000000)])
            flow("non-default-terminals", 4, [(3, 1, 5), (1, 2, 4), (3, 4, 2), (4, 2, 2)], source=3, sink=2)
            for i in range(9):
                n = i % 5 + 4
                edges = [(u, v, rng.randint(0, 20)) for u in range(1, n + 1)
                         for v in range(1, n + 1) if u != v and rng.random() < .25]
                flow(f"seeded-network-{i}", n, edges, "normal")
            flow("long-chain", 200, [(u, u + 1, 1000) for u in range(1, 200)], "stress")
            flow("many-channels", 100, [(1, u, u) for u in range(2, 100)] + [(u, 100, u + 1) for u in range(2, 100)], "stress")
            flow("dense-forward", 60, [(u, v, 10) for u in range(1, 61) for v in range(u + 1, 61)], "stress")
        else:
            flow("sample", 4, [(1, 2, 2, 1), (1, 3, 1, 3), (2, 4, 2, 2), (3, 4, 1, 1)], "sample")
            flow("no-edges", 2, [], "boundary")
            flow("zero-capacity", 2, [(1, 2, 0, -2)], "boundary")
            flow("negative-edge", 3, [(1, 2, 2, -3), (2, 3, 2, 1)])
            flow("parallel-different-costs", 2, [(1, 2, 1, 5), (1, 2, 2, 1)])
            flow("positive-cost-still-maximize-flow", 3, [(1, 2, 2, 3), (2, 3, 2, 5)])
            flow("reverse-cost-required", 6,
                 [(1, 2, 1, 0), (1, 3, 1, 0), (2, 4, 1, 0), (2, 5, 1, 1),
                  (3, 4, 1, 1), (3, 5, 1, 9), (4, 6, 1, 0), (5, 6, 1, 0)])
            flow("opposite-input-edges", 3, [(1, 2, 2, 1), (2, 1, 1, 1), (2, 3, 2, 2)])
            flow("non-default-terminals", 4, [(3, 1, 2, 1), (1, 2, 2, 2), (3, 4, 1, -1), (4, 2, 1, 2)], source=3, sink=2)
            for i in range(8):
                n = i % 3 + 3
                all_edges = [(u, v) for u in range(1, n + 1) for v in range(u + 1, n + 1)]
                rng.shuffle(all_edges)
                edges = [(u, v, rng.randint(1, 3), rng.randint(-3, 7)) for u, v in all_edges[:7]]
                flow(f"seeded-cost-network-{i}", n, edges, "normal")
            flow("large-cost-product", 4, [(1, 2, 1000000, 1000000), (2, 4, 1000000, 1000000),
                                         (1, 3, 1000000, 1000000), (3, 4, 1000000, 1000000)], "stress")
            flow("many-channels", 60, [(1, u, 1000, -u) for u in range(2, 60)] +
                 [(u, 60, 2000, 2 * u) for u in range(2, 60)], "stress")
            flow("unequal-bottlenecks", 40, [(1, u, u, 100) for u in range(2, 40)] +
                 [(u, 40, 40 - u, -u) for u in range(2, 40)], "stress")
    assert len(cases) == 20, (lab_id, len(cases))
    assert len({name for name, _, _ in cases}) == len(cases)
    return cases
