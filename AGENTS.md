# Agent Instructions

This project uses **GitHub Issues** for task tracking.
Issues: https://github.com/sujitkamthe/growth-impact-field-guide/issues

## Finding Work

Browse open issues at the link above. Filter by label:
- `content` — changes to guide content or framing
- `ux` — website structure and presentation
- `bug` — something isn't working

## Session Completion

**When ending a work session**, complete ALL steps below. Work is NOT complete until `git push` succeeds.

1. **File issues for remaining work** — create GitHub Issues for anything needing follow-up
2. **Run quality gates** (if code changed) — `node build.js` to verify the build passes
3. **PUSH TO REMOTE**:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
4. **Verify** — all changes committed and pushed

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
