# Codex finance handoff
**Updated:** 2026-11-03 20:10 WIB | **Branch:** codex/finance | **Baseline:** 700bd46939a86565ffdcbac35c06dcfd2457d551 | Current change: see git log -1.
## Done
- Read the role briefing, fin.js helper contract, governance formulas and finance builders; installed dependencies; built mock-cdu and inspected its Costing screenshot.
- tests/fin_smoke.js now serves the chosen HTML over loopback HTTP, keeps all five checks, closes resources and optionally writes FIN_SCREENSHOT. The local server explicitly reports no shared backend.
- Finance smoke: 5 checks passed. lldpe and mock-cdu pack validation: 0 errors, 0 warnings. Default build and static checks passed. No application or case inputs changed.
## In progress
- Real-case work has not started. The example remains a starter page with synthetic maintenance records and zero-valued financial assumptions, not a business case.
## Next, in order
1. After the human announces the case: git fetch origin, git merge origin/main; inspect the brief and case pack; record sources and missing inputs in fin.json with Case data, Market source, Estimate or Assumption labels.
2. Implement record-based cost breakdowns, downtime valuation, cost build-up, scenarios, NPV/IRR/payback/BCR, sensitivity and cash flow; avoid double counting and treating risk categories as probabilities.
3. Add cost_summary, CSV/print exports and 15+ evaluation questions; reconcile page, Excel formulas, reports and slides; test totals and financial edge cases independently.
## How to check / gotchas
- From repo root: BUILD_OUT=/tmp/fin python3 build.py mock-cdu; CHROMIUM=/usr/bin/chromium FIN_SCREENSHOT=/tmp/fin-costing.png node tests/fin_smoke.js /tmp/fin/index.html. Browser/socket commands need the cloud command sandbox escalation; Playwright download is policy-blocked. Run tools/baseline_check.sh codex before every push; commit only owned files. No PR or main push.
## Waiting on
- Human: announce the real case and its id. Claude A: shared regress.js, smoke_case.js and case_shots.js use file URLs blocked by this browser's administrator policy; npm run test:quick reaches passing build/static then fails before regression assertions. Shared browser suites/screenshots remain unverified here; consider local HTTP support. Existing build text-patch warnings remain unchanged.
