# 105 栋的热心同学 Project Lab

## Goal

Build Lab 01P02, "105 栋的热心同学", for students who have only learned Ch1 arrays, linked lists and elementary algorithms. The user refined and approved the task sequence in the preceding conversation and now explicitly requests implementation. Deliver the completed local Lab for user review before pushing its feature branch or changing the learner checkout.

## Requirements

- Task 1: fixed-capacity student table, name/student ID/floor/room, CRUD, same-name search and stable in-place bulk deletion.
- Task 2: stamina, helpfulness and successful deliveries; deterministic one-item trips from floor 1 and back, atomic failure, all tied leaders.
- Task 3: sentinel singly linked pending list, append/insert/cancel, one traversal removing successful deliveries and retaining failures.
- Task 4: reuse prior student modules, guard deletion of students referenced by pending requests and produce a daily summary through a supplied CLI.
- Chinese progressive hints in student source; core algorithms remain TODOs in compilable starters.
- Complete Chinese statements, reference solutions, meaningful automated tests, contracts, CMake/CLI integration, sample interaction and student packaging.
- Keep main and the learner branch untouched. User review gates subsequent feature-branch push and learner testing.

## Acceptance Criteria

- [x] Four separately scored tasks totaling 100 automated points actually link earlier student modules.
- [x] Reference passes every task and integration case; starter builds and is not full score.
- [x] Array tests cover consecutive/all/no removals and stable order; delivery tests cover exact stamina and atomic failure; list tests cover consecutive head/middle/tail removal and reuse.
- [x] Model checks and hand-calculated fixtures independently validate reference results.
- [x] Lab uses existing stable-ID and website discovery; the existing VS Code scanner consumes the same manifest layout. Actual learner UI testing follows publication.
- [x] Student pack excludes solutions and runs outside the repository.
- [x] Review notes record actual checks, platform limits and learner testing steps.

## Notes

- Out of scope: optimal scheduling, graphs, stacks/queues, persistence, new extension UI and production deployment. Sorted-list merge remains an optional written challenge.
- No blocking product questions remain; the prior task/hint proposals are the accepted basis. Numeric limits and file layout are implementation choices.
