# Case financial deliverables

The live case model is `cases/<id>/fin.json`; `src/modules/fin.js` consumes it. The standalone builder reads the same inputs and history and generates Excel, Word and PowerPoint outputs without importing the original plant model in `finance/spec.py`. The original financial deliverables remain available as the first-case templates.

Run from the repository root:

```
node tests/fin_model.js
BUILD_OUT=/tmp/fin python3 build.py mock-cdu
CHROMIUM=/usr/bin/chromium node tests/fin_smoke.js /tmp/fin/index.html
python3 finance/build_case.py mock-cdu /tmp/finance-mock-cdu
mkdir -p /tmp/finance-mock-cdu/recalculated
soffice -env:UserInstallation=file:///tmp/caliber-fin-lo --headless --convert-to xlsx --outdir /tmp/finance-mock-cdu/recalculated /tmp/finance-mock-cdu/Financial_Model.xlsx
node tests/fin_reconcile.js /tmp/finance-mock-cdu
soffice -env:UserInstallation=file:///tmp/caliber-fin-lo --headless --convert-to pdf --outdir /tmp/finance-mock-cdu /tmp/finance-mock-cdu/Financial_Report.docx
```

Outputs are generated outside the checkout. Excel has live formulas, blue input cells and black formulas. Recalculation is necessary to populate cached results for viewers. `tests/fin_reconcile.js` checks actual recalculated results against the page, including scenarios and sensitivity. The Python builder also checks an independent NPV calculation against JavaScript before writing outputs. Dependencies: Node, locked npm packages, Python with openpyxl, python-docx and python-pptx; LibreOffice for recalculation and PDF.

Every model input carries `value`, `unit`, `basis` and `source`. Basis is Case data, Market source, Estimate or Assumption. `mock-cdu` uses labelled synthetic assumptions; it is a working demonstration and cannot support a real investment decision. `_template` deliberately has null required inputs. Replace the inputs and supply the correct observation exposure for the real case. Cases without the new schema show required-input messages. No legacy assumption is silently copied into the new model.

Year zero contains implementation plus contingency. Annual maintenance and downtime savings use the stated history exposure; annual flows occur at year end, at constant prices and before tax. No terminal value, debt, tax benefit, inflation or ramp is assumed. Simple payback interpolates uniform annual cash flow; it is not discounted payback. IRR is defined only for a negative initial investment followed by nonnegative inflows. Zero costs give an undefined BCR. Benefits cover the supplied history; the implementation set count affects costs only. A partial rollout needs corresponding case history and assumptions. Downtime is asset-hours, may overlap, and is not plant outage time. Missing recorded costs and downtime are counted and excluded from sums.

`risk` may contain `{set, annualProbability, consequence, basis, source}`. Probability must be a fraction from 0 to 1 for a one-year horizon; consequence is incremental loss per event in the case currency. No risk value is invented from health or risk category. Expected loss is separate from cash-flow benefits. For repeated annual events, use an event-frequency model in a separate reviewed extension rather than interpreting probability as an event count.

Local browser edits are labelled Assumption and stored under the case id plus an input signature. The workbook and generated documents use saved case inputs, so reset browser overrides before comparing baseline metrics. Save reviewed inputs in fin.json to reproduce an edited scenario outside that browser.

The 16 Finance evaluation questions are in `cases/mock-cdu/eval_extra_fin.json`. The Finance smoke test exercises them directly. They are picked up by the repository's pack compiler on the next compilation; ask the integrator to compile them rather than committing generated case files. `cost_summary` registers only in fin.js; the AI agent's files are untouched.
