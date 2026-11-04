# Process-industry AI knowledge assistant investment pack

This pack is prepared for the forthcoming real case. It does not assume which plant, loss rate, headcount or operating margin the brief will provide. `planning_inputs.json` is an explicitly illustrative USD budget, with a separate assumed IDR conversion. Every number is labelled; none is a current vendor quote or plant fact. `evidence.json` distinguishes bibliographic knowledge from sources actually retrieved. Network access currently prevents new primary-source verification.

## What the investment buys

Compare three functionally scoped alternatives: (1) custom retrieval assistant using a paid model API, (2) an enterprise assistant subscription with eligible underlying licences and connectors, (3) a locally hosted open-weight model on a GPU server. All provide read-only retrieval from approved manuals, P&IDs, work orders and controlled procedures; they do not control equipment, replace process safeguards, or authorise a maintenance decision. On-premises means local inference only after validating the entire document, OCR, embedding, telemetry and update path. Check model licence terms and data residency explicitly.

Cloud requires no new plant GPU. Existing approved clients can be reused. A gateway or firewall is not automatically required for a document-only pilot, but must be budgeted if the architecture review requires it. The on-premises budget includes one server, one gateway and one segmentation appliance and is a pilot configuration without high availability. Industrial/Ex-rated tablets need a site-specific certification requirement and quote; the planning tablet price is not an intrinsically safe-device offer.

## How cost becomes profit

- Routine search: users x working days x measured minutes saved / 60 x adoption x usable-answer share. Multiplying by loaded hourly cost gives capacity value. Only the documented fraction that displaces overtime, a contractor invoice or a planned hire is a cash benefit. Existing salaried staff finishing work sooner does not automatically increase accounting profit.
- Troubleshooting: eligible incidents x reduction in actual production critical-path hours x contribution margin per recovered plant-hour x attributable share x saleable-demand fraction x adoption x usable-answer share. Use incremental variable margin, not sales revenue. Sum overlapping asset downtime only once at the plant bottleneck. This lever defaults to zero until the case supplies evidence.
- Onboarding: separately measured new-hire hours saved x rate x adoption x usable share x cash conversion. Exclude these users/hours from routine search to prevent overlap. Do not reduce mandatory safety or competence training.
- Rework: verified avoided repeat jobs x external incremental cost per job x reduction x adoption x usable share. Exclude labour, downtime, contractor spend and scrap already captured in other levers. This lever also defaults to zero.
- Safety, compliance and incident losses: describe potential benefits and controls, but do not assign an unmeasured monetary saving. The operating error-response allowance is a stress budget, not a calibrated expected safety loss.

Cloud and licence spend, implementation labour, document review, cybersecurity, user training, evaluation, ongoing ownership, retries, refreshes, replacement hardware, electricity and decommissioning all count. Free trials are not a production cost model. Raw API tokens are often a small part of total cost; data preparation and organisational ownership can dominate.

## Financial views and decision criteria

The workbook separates incremental cash flow from full economic cost/capacity value. Internal project and support time is included in economic TCO; only the specified incremental cash fraction is included in the cash investment case. Do not count both as separate benefits. NPV, IRR, benefit-cost ratio, simple and discounted payback use cash benefits. Economic NPV is a separate opportunity-cost view, not booked profit. All cash flows are before tax, in constant USD, with year-end annual flows and no debt or terminal salvage. Taxes, incentives, grants, tariffs, recoverable VAT and software capitalisation require the real jurisdiction and finance approval; no tax shield or subsidy is invented.

Benefits ramp in years 1 and 2, costs start immediately, and owned GPU hardware is refreshed in the stated year. Terminal shutdown cost is included. Accounting bridge: incremental recurring cash benefit minus recurring cash operating spend minus depreciation of purchased hardware approximates steady-state incremental EBIT; depreciation is not deducted again from cash flow. This is not a complete statutory income statement.

Downside/base/upside scenarios vary adoption, usable answers, time savings and costs. They are planning stress cases, not study confidence intervals. Sensitivity should identify which real measurement can reverse the decision. Report operating break-even minutes saved per user-day and the recovered-production margin needed to close any cash shortfall. A positive capacity-value NPV with negative cash NPV is a capacity project, not a demonstrated cash-saving project.

For a vendor business model, monthly recurring revenue must cover delivery OPEX divided by (1 minus target gross margin). This excludes customer-specific onboarding recovery, sales acquisition, product R&D, taxes and profit on setup. The plant's willingness to pay is constrained by its own conservative cash benefits; a viable supplier margin does not establish customer ROI. Internal incentives: plant manager owns production-loss evidence, maintenance manager owns rework, operations owns use and answer acceptance, finance signs off cash conversion, IT/OT owns security and service cost. A benefit owner and budget line are prerequisites to claiming profit.

## Literature and real enterprise cases

`evidence.json` records the original NBER customer-support study, the Science professional-writing experiment and the HBS/BCG study. Their measured outcomes differ from plant maintenance. A 14% improvement in support issues per hour cannot be multiplied by all plant payroll or all downtime. The BCG failure outside the task frontier reinforces the need for source-grounded answers and human checks. Siemens/Schaeffler is an industrial deployment lead; no quantified cost reduction is attributed to it without a retrieved primary source. Vendor stories, forecasts and independently measured experiments must remain separate evidence classes.

The research and pricing verification work remains open until the original domains are reachable. Never copy the planning prices into a slide labelled Market source. Obtain dated URLs, currency, region, tax and billing terms plus retrieved source text before changing a price's basis. Keep a quote validity date and retrieval timestamp; benchmark throughput before choosing GPU hardware.

## What to fill from the real case

1. Plant/case id, currency, actual FX policy, discount rate, project horizon and allowed deployment/data boundary.
2. Eligible users/roles, licence inventory, working days, separate task populations and measured baseline search/repair/reporting times.
3. Documents/pages, file types, OCR fraction, revisions, permissions, review effort and approved-source acceptance rate.
4. Workload: queries per user, context and output tokens, retry rate, peak concurrency, latency and availability requirements.
5. Eligible incidents with start/end timestamps, overlapping production bottlenecks, variable contribution margin and demand constraint. Reconcile the history with the operations ledger.
6. Cash realisation: invoice, overtime budget, contractor hours or approved avoided hire. Attach an owner and measurement method to each saving.
7. Written vendor quotes: API, enterprise seats and prerequisites, connectors, storage, logs, egress, HA, GPU BOM, power, warranty, security, installation, training and taxes.
8. Pilot measurements: compare matched tasks/users or phased rollout; record both successful and failed answers and verification time. Benefits must be net of checking/correction work. Use a holdout where practical and do not attribute parallel process improvements to AI.
9. Go/no-go: access/source controls and safety screening pass; useful-answer rate meets a predeclared task standard; cash NPV is positive under approved assumptions; owner accepts the operating budget. Otherwise restrict the pilot, reduce scope or stop.

Do not confuse protocol targets (to be chosen by the plant) with literature results. Tomorrow's substitutions are data entry and revalidation, not permission to invent missing figures.

## Build, use and verify

```
python3 finance/assistant/test_model.py
python3 finance/assistant/build.py /tmp/ai-assistant-finance
mkdir -p /tmp/ai-assistant-finance/recalculated
soffice -env:UserInstallation=file:///tmp/ai-finance-lo --headless --convert-to xlsx --outdir /tmp/ai-assistant-finance/recalculated /tmp/ai-assistant-finance/AI_Assistant_Investment_Model.xlsx
python3 finance/assistant/test_model.py /tmp/ai-assistant-finance
soffice -env:UserInstallation=file:///tmp/ai-finance-lo --headless --convert-to pdf --outdir /tmp/ai-assistant-finance /tmp/ai-assistant-finance/AI_Assistant_Decision_Memo.docx
```

Use the recalculated workbook for cached-value viewers. It recalculates deployment costs, benefits, scenarios, sensitivity and cash flow when the blue inputs change. The schedule supports horizons from 1 to 30 years; rows beyond the chosen horizon have zero new flows. The Base scenario links to the main adoption/usability inputs; downside and upside are independently editable stress cases. Gross minutes saved are reduced by source-verification/correction time before valuing time; the operating and NPV break-even minutes differ.

Documents/slides/JSON are generated snapshots, not live Excel-linked reports. For final deliverables, change the reviewed `planning_inputs.json`, regenerate all outputs and reconcile again. Do not change the currency label without converting every monetary input. A reporting FX assumption does not establish exchange-rate risk or imported procurement taxes. Operating thresholds do not guarantee positive lifecycle NPV; compare the NPV threshold and complete cash schedule.

The quote/source register is intentionally explicit about missing verification. The workbook is usable for planning now, but source verification and procurement accuracy remain open. Full economic TCO includes internal staff capacity, while cash TCO includes only the stated incremental cash fractions; neither should be hidden to make a project look profitable.

`real_case_intake.csv` is a blank input register with units and responsible owners. Fill actual values, basis, dated source and quote expiry. Empty real-case inputs are unknown, not zero. The populated planning file remains separate and explicitly illustrative.

This architecture/procurement model is a companion to the existing Costing page. It includes benefit ramp, separate cash/economic views, server refresh and decommissioning that the current simple `fin.json` page model does not express. Do not paste its lifecycle NPV into the page or claim page reconciliation. Its 153 baseline workbook outputs are reconciled to `finance/assistant/model.py`. Existing page/Excel reconciliation remains under `finance/build_case.py`; a future integration must preserve the full schedule rather than hide lifecycle costs in a single annual benefit.
