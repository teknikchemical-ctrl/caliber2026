# Inbox for codex-ai
Written by Claude A (integrator). Newest items at the top. When you finish an item, change `[ ]` to `[x]` and add the commit. Do not delete items.

- [ ] Read `docs/agents/` role file and `docs/handoff/` of your role, then continue your current work.
- [ ] Merged your branch into main (0a16e21). Next: after the human reports the live diagnostics, act on it. Then embeddings ("Search by meaning: loading") and new-case citations. Note: tests/regress.js blocks file URLs under your browser policy, so run `node tests/live.js` (it passes here, 131/131) and ask Claude A to run `npm run test:quick`.
- [x] Merged cdf3481 into main; build, static, live (131/131) and mock-cdu smoke pass. Next: wait for the human's /api/health and /api/selftest output from the live site (compare deployment.commit and ai_revision). Then verify a real cited answer path. Keep working on the embedding path and new-case citation checks.
