# GitHub collaboration implementation plan

Goal: preserve local 7645dbb and establish two-person collaboration without production changes.
Architecture: external worktree for public documentation; separate private repository for reviewed internal metadata. No runtime code or license change.

- [x] Recheck branches, PRs, untracked files and credentials guard.
- [x] Create isolated chore/github-collaboration from 7645dbb.
- [x] Reuse PR #1 README/assets and development test configuration; omit license.
- [x] Add CONTRIBUTING, TEAM_WORKFLOW, repository boundaries, templates and PR-only CI.
- [x] Verify frontend tests/build, local links, ignored material and staged diff.
- [x] Initialize Private skeleton and source/privacy/license inventory without raw files.
- [x] Confirm production binding: feat/edgeone-hk-pilot, production auto-deploy on, Preview auto-deploy off.
- [ ] Push V2 development and collaboration branches; create Draft PR targeting V2; keep existing PRs unchanged.
