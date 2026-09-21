"""Generate/check Ch7 cases, cross-check solutions, and kill documented mutants.

python packages/course-authoring/chapter-07/check-ch07-exercises.py --write
python packages/course-authoring/chapter-07/check-ch07-exercises.py --solutions --mutations
Only --write changes tracked test data. Binaries/reports go to .lab-cache/ch07-audit.
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

# Author checks must not leave Python bytecode among the repository's scripts.
sys.dont_write_bytecode = True
from ch07_cases import fixtures
from ch07_test_support import ORACLES

ROOT = Path(__file__).resolve().parents[3]
LABS = ROOT / "labs/chapter-07/exercise"
CACHE = ROOT / ".lab-cache/ch07-audit"

# Public Lab numbers follow the guide. Fixture IDs remain frozen so renumbering
# cannot change random seeds, oracle dispatch, or the historical mutation suite.
FIXTURE_IDS = {
    3: 13, 4: 14, 5: 15, 6: 16, 7: 17, 8: 18, 9: 19, 10: 20, 11: 21,
    13: 22, 14: 23, 15: 24, 22: 25, 23: 26, 24: 27, 25: 28,
    27: 29, 28: 30, 29: 31, 30: 32,
}

# Single, realistic bug per reference. The test suite must reject each mutant.
MUTATIONS = {
    13: ('discovered[u] < discovered[v] ? "FORWARD" : "CROSS"', '"CROSS"'),
    14: ('if (!graph[u].empty() && !seen[u])', 'if (false)'),
    15: ('if (odd.size() == 2) start = odd[0];', ''),
    16: ('removed == n ? "YES" : "NO"', 'removed > 0 ? "YES" : "NO"'),
    17: ('priority_queue<int, vector<int>, greater<int>> ready;', 'queue<int> ready;'),
    18: ('if (--outdegree[u] == 0)', 'if (outdegree[u]-- > 0)'),
    19: ('answer = (answer + ways[u]) % MOD;', 'answer = answer + ways[u];'),
    20: ('finish[v] = max(finish[v], finish[u] + duration[v]);', 'finish[v] = finish[u] + duration[v];'),
    21: ('vector<long long> latest(n, total);', 'vector<long long> latest = earliest;'),
    22: ('selected == n - 1 ? cost : -1', 'cost'),
    23: ('+ abs(points[u].second - points[v].second)', '+ 0'),
    24: ('answer = w; break;', 'break;'),
    25: ('vector<long long> distance(n, 0);', 'vector<long long> distance(n, 1000000000000000LL); distance[0] = 0;'),
    26: ('if (grid[0][0] || grid[rows - 1][cols - 1])', 'if (false)'),
    27: ('h[u] > w + h[v]', 'false'),
    28: ('"123804765"', '"123456780"'),
    29: ('matched[v] == -1 || augment(matched[v])', 'matched[v] == -1'),
    30: ('matched[b] == 0 || augment(matched[b])', 'matched[b] == 0'),
    31: ('graph[v][e.reverse].capacity += pushed;', '/* reverse capacity incorrectly omitted */'),
    32: ('graph[v][e.reverse].capacity += pushed;', '/* reverse capacity incorrectly omitted */'),
}


def mutant_source(lab_id, source):
    old, new = MUTATIONS[lab_id]
    assert old in source, (lab_id, old)
    result = source.replace(old, new)
    if lab_id == 17:
        result = result.replace('ready.top()', 'ready.front()')
    if lab_id == 19:
        result = result.replace(' % MOD', '')
    if lab_id == 24:
        result = result.replace('components.unite(u, v);', 'if (components.unite(u, v)) answer += w;')
    if lab_id == 25:
        result = result.replace('if (distance[v] > distance[u] + w)',
                                'if (distance[u] < 1000000000000000LL && distance[v] > distance[u] + w)')
    return result


def compile_cpp(compiler, source, binary):
    result = subprocess.run([compiler, "-std=c++17", "-O2", str(source), "-o", str(binary)],
                            capture_output=True, text=True, timeout=90)
    assert result.returncode == 0, result.stdout + result.stderr


def execute(binary, data):
    result = subprocess.run([str(binary)], input=data, capture_output=True, text=True, timeout=8)
    assert result.returncode == 0, result.stderr
    return result.stdout.split()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--solutions", action="store_true")
    parser.add_argument("--mutations", action="store_true")
    parser.add_argument("--lab", type=int, choices=sorted(FIXTURE_IDS))
    args = parser.parse_args()
    compiler = shutil.which(os.environ.get("CXX", "clang++")) or shutil.which("g++")
    if args.solutions or args.mutations:
        assert compiler, "Set CXX to a GCC/Clang C++ compiler."
    CACHE.mkdir(parents=True, exist_ok=True)
    report = []
    for lab_id in ([args.lab] if args.lab else sorted(FIXTURE_IDS)):
        fixture_id = FIXTURE_IDS[lab_id]
        matches = list(LABS.glob(f"E-07-{lab_id:02d}-*"))
        assert len(matches) == 1, (lab_id, matches)
        lab = matches[0]
        cases, expected = [], []
        for index, (name, data, tag) in enumerate(fixtures(fixture_id), 1):
            case_id = f"{index:03d}-{name}"
            output = ORACLES[fixture_id](data)
            entry = {"id": case_id, "input": f"tests/{case_id}.in",
                     "expected": f"tests/{case_id}.out", "points": 5, "tags": [tag]}
            cases.append(entry)
            expected.append((case_id, data, output))
            if args.write:
                (lab / "tests").mkdir(exist_ok=True)
                (lab / entry["input"]).write_text(data, encoding="utf-8", newline="\n")
                (lab / entry["expected"]).write_text(output, encoding="utf-8", newline="\n")
            assert (lab / entry["input"]).read_text(encoding="utf-8") == data, case_id
            assert (lab / entry["expected"]).read_bytes() == output.encode("utf-8"), case_id
        case_path = lab / "tests/cases.json"
        if args.write:
            case_path.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8", newline="\n")
        assert json.loads(case_path.read_text(encoding="utf-8")) == cases
        assert sum(c["points"] for c in cases) == 100
        entry = {"labId": f"07E{lab_id:02d}", "cases": len(cases), "oracle": "PASS"}
        extension = ".exe" if os.name == "nt" else ""
        if args.solutions:
            binary = CACHE / f"solution-{lab_id}{extension}"
            compile_cpp(compiler, lab / "solution/main.cpp", binary)
            for case_id, data, output in expected:
                assert execute(binary, data) == output.split(), (lab_id, case_id)
            entry["solution"] = "PASS"
        if args.mutations:
            source = (lab / "solution/main.cpp").read_text(encoding="utf-8")
            mutant = CACHE / f"mutant-{lab_id}.cpp"
            mutant.write_text(mutant_source(fixture_id, source), encoding="utf-8")
            binary = CACHE / f"mutant-{lab_id}{extension}"
            compile_cpp(compiler, mutant, binary)
            killed = []
            for case_id, data, output in expected:
                try:
                    wrong = execute(binary, data) != output.split()
                except (subprocess.TimeoutExpired, AssertionError):
                    wrong = True
                if wrong:
                    killed.append(case_id)
                    break
            assert killed, f"07E{lab_id}: mutation survived; improve the regression fixture"
            entry["mutationKilledBy"] = killed[0]
        report.append(entry)
        print(json.dumps(entry), flush=True)
    suffix = f"-{args.lab}" if args.lab else ""
    (CACHE / f"report{suffix}.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
