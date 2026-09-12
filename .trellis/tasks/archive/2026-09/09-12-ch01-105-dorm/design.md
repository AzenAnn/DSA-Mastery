# Design

- Branch: `lab/ch01-105-dorm`, based on fetched `origin/main`; developer: Azen.
- Lab: `labs/chapter-01/project/P-01-02-105-dorm`, stable ID `01P02`.
- CTest tasks: `students` (30), `delivery` (25), `pending` (30), `final` (15). Explicit implementation module targets and build dependencies follow 02P04.
- Contracts live in `contracts/`. Supplied support/CLI code lives in `src/` for student packaging. Each task has student, solution, tests and CMake declarations.
- Student table uses a plain array of capacity 105. IDs are 1-20 ASCII digits; names are nonempty. Floors 1-10 and rooms 1-30 are fictional model limits. Identity is immutable. Failed operations preserve state.
- New students start with stamina 100, helpfulness 0 and deliveries 0. Cost to floor f: `3*(f-1)+1`; reward: `10+2*(f-1)`. Every trip begins/ends at floor 1. Self-delivery and missing students fail; stamina never automatically recovers. Winners are all successful helpers tied at the maximum, in table order.
- Pending requests store IDs only; helper and recipient are fixed by input. Active request IDs are unique and reusable after removal. Capacity is 105. Supply sentinel/tail initialization and cleanup, disable copying. Each pass attempts every original request once against current student state.
- Final guards single/bulk student removal when pending references exist. Room edits are allowed and resolved at execution. Summary derives totals from students and pending count.
- Provided line-based CLI uses standard streams/quoted strings, validates all arguments before execution and has an ASCII output protocol. Chinese names may be UTF-8 strings. Binaries live in `.lab-cache/bin/{student,solution}/`.
- No shared tooling/dependency changes. Existing content discovery collects the Lab. Core student algorithms remain incomplete with progressive Chinese comments.
- Preserve unrelated untracked Python cache and learner history. User review precedes commit/push. No production deployment.
