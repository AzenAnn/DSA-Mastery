import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
inventory = {"articles": [], "choice": [], "composite": [], "exercise": []}
for p in sorted((ROOT / "content/chapter-04-tree").glob("*.md")):
    inventory["articles"].append({"source": p.relative_to(ROOT).as_posix(), "lines": len(p.read_text(encoding="utf-8").splitlines())})
for p in sorted((ROOT / "labs/chapter-04/theory").glob("*/quiz.json")):
    src = p.read_text(encoding="utf-8")
    group = p.parent.name[5:7]
    for index, q in enumerate(json.loads(src), 1):
        line = src[:src.index('"id": ' + json.dumps(q["id"]))].count("\n") + 1
        inventory["choice"].append({"key": f"T{group}-Q{index:02}", "source": p.relative_to(ROOT).as_posix(), "line": line, **{k: v for k, v in q.items() if k not in ("answer", "explanation")}})
for p in sorted((ROOT / "labs/chapter-04/theory").glob("*/README.md")):
    lines = p.read_text(encoding="utf-8").splitlines()
    group = p.parent.name[5:7]
    starts = [i for i, l in enumerate(lines) if re.match(r"### 综合题 \d", l)]
    for index, start in enumerate(starts, 1):
        end = next(i for i in range(start, len(lines)) if lines[i].startswith("::: details"))
        inventory["composite"].append({"key": f"T{group}-C{index:02}", "source": p.relative_to(ROOT).as_posix(), "line": start + 1, "prompt": "\n".join(f"{i+1}: {lines[i]}" for i in range(start, end)), "answer_line": end + 1})
for p in sorted((ROOT / "labs/chapter-04/exercise").glob("*/README.md")):
    lines = p.read_text(encoding="utf-8").splitlines()
    end = next(i for i, l in enumerate(lines) if l == "## 题解")
    inventory["exercise"].append({"key": "E" + p.parent.name[5:7], "source": p.relative_to(ROOT).as_posix(), "line": 16, "prompt": "\n".join(f"{i+1}: {lines[i]}" for i in range(end)), "answer_line": end + 1})
(OUT / "blind-inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
print({k: len(v) for k, v in inventory.items()})
