# Codex Finance handoff
**Updated:** 2026-11-03 WIB | **Branch:** codex/finance | **Baseline:** 7995889 | Commit: see git log -1.
## Ready to merge
- Sample-case Finance workflow: record cost/downtime breakdowns and charts, labelled inputs, cost build-up, NPV/IRR/payback/BCR, 3 scenarios, cash flow, sensitivity, explicit unvalued risk, CSV/print and cost_summary in fin.js only.
- cases/mock-cdu/fin.json has SYNTHETIC demonstration assumptions; _template has null required values. All real-case inputs remain to be sourced. Benefits cover the whole supplied history, not a guessed partial rollout.
- 16 Finance evaluation questions; smoke test checks answers directly. Integrator: recompile mock-cdu to include eval_extra_fin.json in Governance; generated case files are untouched.
- finance/build_case.py generates a live-formula workbook, Word report and financial slides from any case's saved FIN inputs and MH. Reproduction: finance/CASE_FINANCE.md. Legacy first-case deliverables unchanged.
## Validation
- Pure model/edge checks and independent Python NPV passed; 16 LibreOffice-recalculated metrics (returns, scenarios, sensitivity) match the page. Sample NPV 151,823,149 IDR; demonstration only.
- HTTP Finance smoke tests passed with 16 answer evaluations, totals, user edits/reset, invalid inputs and responsive checks; rendered page, report and slides inspected. Default build/static checks passed.
- Required quick suite: build/static pass; shared regression cannot navigate file:// (ERR_BLOCKED_BY_ADMINISTRATOR with system Chromium). Shared layout/case/3D suites remain unverified; no shared tests edited.
## Next / waiting on
- Human/integrator: load and announce real case id on main; Finance then merges main, replaces sourced inputs and reconciles deliverables. No invented probability from risk categories. Use explicit annual probability and consequence for risk valuation.
- Merge main hourly during active real-case work; push only codex/finance, no PR. For preview, human configures the Netlify branch. Generated sample artifacts are under /tmp/finance-mock-cdu and reproducible from the committed builder.
