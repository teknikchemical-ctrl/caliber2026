# SPI: Spare Part Intelligence and Inventory Optimization (CALIBER 2026 final case)

Read in this order. Everything here overrides the older single-plant documents (`docs/CASE_PACKS.md`, `docs/NEW_CASE_RUNBOOK.md`) where they disagree.

| # | File | What it answers |
|---|---|---|
| 1 | `BRIEF.md` | What the competition asks, the submission rules, the deck format, the checklist we are judged on |
| 2 | `DATA.md` | The six data files, how they join, what is wrong with them, the numbers we already know |
| 3 | `ARCHITECTURE.md` | The system: layers, repo layout, Vercel and SQLite decisions, who owns which folder |
| 4 | `AI_REASONING.md` | The reasoning agent between the database and the forecasting scripts, both flows, tools, guardrails |
| 5 | `FORECASTING.md` | Methods, formulas, assumptions, validation. What the engine must do and how we prove it |
| 6 | `STANDARDS.md` | Engineering standards and codes we apply, and where they show up in the product |
| 7 | `EQUIPMENT_SETS.md` | How equipment sets, parts lists and drawings are generated from the data |
| 8 | `TIMELINE.md` | Milestones, the order of work, de-risking spikes, usage budget, fallbacks |
| 9 | `agents/*.md` | One role file per agent: A, B, CODEX_AI, CODEX_FIN. Your files, your tasks, your tests, your done list |

Contracts (code against these, never against each other's internals): `spi/db/schema.sql`, `spi/contracts/*.schema.json`.
Task board: `docs/TASKS.md`. Messages between agents: `docs/inbox/<agent>.md`. State of each agent: `docs/handoff/<agent>.md`.
Deadline: **Thursday 5 November 2026, 06:00** (confirm time zone with the human: assumed WIB).
