# The brief and what we are judged on

Source: `docs/spi/source/CALIBER_2026_Final_Case_Brief.pdf` (10 slides). Case: **Spare Part Intelligence and Inventory Optimization, AI-Powered Forecasting and Dynamic Optimization.**

## Problem in one paragraph
Spare part stock is planned from history with static Min/Max values. Criticality and lead time are not consistently used. The result: the critical part is missing at shutdown while slow-moving items sit on the shelf. That causes emergency purchases, higher cost, tied-up working capital and longer downtime. The objective: an AI-powered spare part optimisation solution that improves forecasting, makes inventory decisions dynamic, reduces excess stock and working capital, and keeps critical parts available.

## Expected solution (4 parts) and AI outputs
1. Demand forecasting from consumption, failures, maintenance activity and operating conditions.
2. Dynamic inventory optimisation: Min/Max, safety stock, reorder point, replenishment quantity.
3. Inventory health monitoring: excess, slow-moving, non-moving, potentially obsolete.
4. AI recommendation and cost-risk optimisation: reorder, maintain, reduce or monitor.
Named outputs the brief wants to see: **Stockout Risk, Overstock Risk, Reorder Recommendation, Slow-Moving Alert, Dynamic Inventory Parameters, Cost-Risk Optimization Scenarios.**

## Two key questions the deck must answer (Proposed Solution or Business Impact slide)
1. How can the Company improve demand predictability for spare parts with irregular and uncertain consumption patterns?
2. How can the Company dynamically optimise spare part inventory while balancing inventory cost, availability and operational risk?
Our answers (keep consistent everywhere): (1) classify demand (ADI and CV2), use intermittent-demand methods, pool demand across specification families, add known demand from the maintenance plan and failure rate, and let the AI reasoning agent choose and justify the method per part, checked by a backtest. (2) Service level set by equipment criticality, lead time and its variability from PO history, cost-risk trade-off curve, scenario simulation of raising or lowering stock, insurance spares kept on purpose for critical equipment.

## Submission (must all be met, non-compliance hurts the score)
- **Prototype:** minimum viable prototype, **not static HTML**, published on **Vercel**. **Database using SQLite.** Complete source code and database in a **.zip**. **Screenshot (.png/.jpg) with the timestamp of the latest deployed version in Vercel.**
- **Deck:** exactly this structure, English: 1 Cover (team name, member names); 2 Background and Problem Statement; 3 Solution (proposed solution, key technologies and features that make it unique); 4 Business Impact (success metrics, expected benefits); 5 Roadmap and Risk Management (timeline with activities, outputs, stakeholders per phase; key risks and mitigation); 7 Team Profile and Key Technologies (table: No, Name, Major, Semester, Area of expertise, Contribution; the AI models and tools used); Appendix optional. (The brief skips slide number 6: follow it as written.)
- **Deadline: Thursday 5 November 2026, 06:00.** The submission link arrives by WhatsApp group and email. Aim to submit by 03:00.
- "A well-justified and high-quality data architecture is preferred over simply integrating more data." So: no extra data sources unless justified, and a data architecture page in the app.

## Judging checklist (our own, from the brief)
- [ ] All four solution parts visible in the app, with the six named outputs.
- [ ] Both key questions answered in the app and in the deck.
- [ ] Uses all six data files, joins documented, data quality problems shown, not hidden.
- [ ] AI is visibly the reasoning step (plan, evidence, validation, backtest), not a chat decoration. Works without a key (rules mode) and with a key (Gemini).
- [ ] Scenario simulation of raising and lowering stock with cost and risk.
- [ ] Vercel URL works, SQLite file inside the zip, screenshot with timestamp.
- [ ] Business impact in IDR with every assumption labelled.
