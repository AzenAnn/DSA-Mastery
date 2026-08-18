# Chapter 1 section 1.5 real-world list practices

## Goal

Add a Chapter 1.5 documentation page that connects the existing linear-list theory to standard-library implementations, static linked lists with a free list, and an engineering-level LRU discussion.

## Requirements

- Create `content/chapter-01-linear-list/05-real-world-practices.md` with Chapter 1 frontmatter, `order: 5`, `status: draft`, and contributor `czjLUCK`.
- Cover standard-library implementation trade-offs, static linked lists and free-list allocation/reclamation, and the LRU combination pattern.
- Reuse rather than duplicate the existing LRU implementation in `04-comparison-and-selection.md`; link to it from the new page.
- Link the static-linked-list discussion to the existing Lab 01-08.
- Add the new page to the Chapter 1 overview and add a forward link from 1.4.
- Use theory-document semantic containers and record traceable sources for library implementation claims.

## Acceptance Criteria

- [ ] The new page is auto-discovered after 1.4 and renders with complete frontmatter.
- [ ] Sections 5.1, 5.2, and 5.3 make their assumptions, complexity claims, and engineering boundaries explicit.
- [ ] The page does not duplicate the existing LRU implementation and has working relative links to 1.4 and Lab 01-08.
- [ ] The Chapter 1 overview and 1.4 link to the new page.
- [ ] `pnpm test` passes and the page is manually checked in the local site.
- [ ] A peer reviewer approves the documentation before publication.

## Confirmed Facts

- Existing Chapter 1 pages use orders 0 through 4; 1.4 already contains the baseline hash-table plus doubly-linked-list LRU example.
- Lab 01-08 already teaches the cursor, capacity, and storage trade-offs of a static linked list.
- `docs/UPDATE_WORKFLOW.md` requires short-lived branches, peer review, and traceable source material for knowledge claims.

## Scope Decision

- Section 5.3 is a conceptual discussion of the thread-safety boundary and
  synchronization trade-offs. It does not add a runnable concurrent LRU,
  benchmarks, or performance claims.

## Research Notes

- The page will distinguish C++ standard guarantees from libstdc++ implementation
  details. The three-pointer vector layout is presented only as a libstdc++
  source-reading example: https://github.com/gcc-mirror/gcc/blob/master/libstdc%2B%2B-v3/include/bits/stl_vector.h
- The Java discussion will cite a pinned OpenJDK source/version when authored.
  OpenJDK documents that `ArrayList` growth details are not specified beyond
  amortized constant-time append, so any approximately 1.5x growth explanation
  must be labeled as an implementation detail.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
