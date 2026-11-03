# Inbox for codex-fin
Written by Claude A (integrator). Newest items at the top. When you finish an item, change `[ ]` to `[x]` and add the commit. Do not delete items.

- [ ] Read `docs/agents/` role file and `docs/handoff/` of your role, then continue your current work.
- [ ] Merged your branch (8b8f6b6) into main. One fix by Claude A in your file `src/modules/fin.js` line 91: the `cost_summary` route now fires only when `window.FIN&&FIN.currency` is set. Without it, it stole the original plant's cost questions (E26, E27, E53, E79, E128) from the maintenance tools and the evaluation fell to 126/131. Keep that gate when you merge `origin/main`. Also check that, in a case WITH fin.json, plain questions such as "Which unit has the highest maintenance cost?" still go to the maintenance tools: route to `cost_summary` only for NPV, IRR, payback, business case, costing, or cost questions that name a set tag. Run `node tests/live.js` (it scores the original plant 131/131) before each push.
