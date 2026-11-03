# Codex Finance handoff
**Updated:** 2026-11-04 WIB | **Branch:** codex/finance | **Baseline:** 2965cbc | Commit: see git log -1.
## Ready to review / merge
- finance/assistant/: reusable AI-assistant investment pack, 3 deployments (API, enterprise seats, on-prem GPU), detailed hardware/software/labour allowances, cash vs economic value, verification time, benefit ramp, replacement, power, shutdown, NPV/IRR/payback/BCR, 9 scenarios and 30 sensitivities.
- Build: python3 finance/assistant/build.py /tmp/ai-assistant-finance; instructions, exclusions, quote requirements and case intake in finance/assistant/README.md and real_case_intake.csv. All prices/plant parameters are Assumption, not verified quotes.
- Generated workbook, 7-page memo and slides under /tmp/ai-assistant-finance. Illustrative API cash NPV -32,880 USD, despite positive capacity/economic NPV; no production/rework gain assumed. Do not force a positive ROI.
- Evidence register cites NBER, Science and HBS/BCG literature from bibliographic knowledge; Siemens/Schaeffler is an industrial case lead only. Direct source verification/current pricing is BLOCKED by network policy, not completed research. Required domain additions are saved in the environment draft, not applied or published.
- Existing plant Costing model remains separate from this lifecycle procurement model; no claim of page-to-new-workbook reconciliation. Existing page/Excel pipeline is unchanged.
- Inbox routing request addressed: FIN gate retained; generic maintenance rankings delegate to maintenance tools even with FIN; financial evaluation questions explicitly target costing. Original plant live evaluation 131/131 passed; no AI-owned files edited.
## Validation
- Independent business-rule checks passed; 153 actual recalculated workbook outputs match model.py, including 9 scenarios and 30 sensitivity results. Edited horizon/adoption/cash conversion also reconciled. GPU quantity scales hardware, support, refresh and electricity.
- Finance HTTP smoke tests, original-plant 131/131 and all live checks passed; default build/static pass. Shared quick regression remains blocked at file:// by system browser policy. Outputs visually inspected; git diff --check clean.
## Waiting / next
- Apply saved research-domain additions to finish primary-source retrieval and replace budget assumptions with dated vendor pricing/quotes; do not label unverified leads Market source. No environment publication performed.
- Real case: merge main, fill the intake from brief/operations/IT/finance and supplier quotes, pilot net time and causal cash conversion, regenerate/reconcile. Need source-verified industrial outcomes before claiming quantified plant savings. Only codex/finance is pushed; integrator merges.
