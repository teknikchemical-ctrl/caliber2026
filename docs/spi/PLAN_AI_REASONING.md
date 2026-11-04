# Plan: better AI reasoning and database reading (Claude A, about 6 hours)

## What went wrong in the five sample questions (checked against the database)
| Question | What the assistant did | What the data holds | Cause |
|---|---|---|---|
| Heat exchanger parts | Asked for an exact material number | 459 heat exchanger locations (class HE); parts include 53 tube plugs; many installed materials | Only text search on part descriptions; no class or equipment search; asks instead of summarising |
| Fuel oil pump | "None found" | No part or location named "fuel oil pump", but fuel oil equipment exists (cooler HE-535C, condenser HE-868B, scrubber CL-272, drums) | No search over location names or services; no related-equipment fallback; no synonyms |
| PP-952A gasoline pump | Said no parts, asked for a material number | Location exists (class PP, criticality A) but has no bill of materials; same-class pumps do | Did not explain why it is empty or offer the class-level parts and similar pumps |
| What happened on 30 Sept 2026 | "Not in baseline data" | 99 issues (16,572 units), 11 notifications, 13 purchase request or delivery lines on that date | No date tool; question not understood |
| PP-1323B vibration measurement | Good, but a wall of text with raw ids | Planned task monthly, next due 2026-10-01 | No answer structure: lead sentence, key figures, links |

## Root causes
1. **Retrieval is narrow.** One regex picks the first tool; part search matches description text only. No search over locations, classes, systems, tasks, notifications; no synonym map (heat exchanger = class HE, pump = PP, compressor = KC, furnace = BF, turbine = KT).
2. **No entity resolution.** The question is not turned into typed entities (material, location, class, system, item type, date, supplier) with scores before tools run.
3. **Asks instead of trying.** It should answer with the best match and offer candidates, and ask only when two readings differ materially.
4. **No reasoning loop.** A single tool round with a small model (flash-lite). No plan, no check that the evidence answers the question, no second try with a broader search.
5. **Weak memory.** Last 6 turns as text only; no focus entity (the part, location or class under discussion) carried between turns.
6. **Answer style.** Citations in the text, raw ids, no lead sentence, no links into the app.

## Build, in order
1. **Knowledge layer (1 hour).** SQLite FTS5 index over material descriptions, location names and tags, class names, system names, planned task text, notification text; a glossary of synonyms and class codes built from the data (class names, item types, service words from location names). One function `resolveEntities(question)` returns scored typed candidates and any date or period.
2. **New read-only tools (1.5 hours).** `find_entities` (the resolver), `describe_scope` (class, system, item type, location or supplier: counts, stock, value, zero stock, excess, demand, lead time, top parts), `list_scope_parts` (installed parts of a class or location with stock status), `activity_on_date` (issues, notifications, purchase lines, planned items on a date or month), `explain_empty` (why a location has no parts: no bill of materials; offers same-class parts and similar locations), `compare_scope`. All grounded in SQL, no free SQL from the model.
3. **Reasoning loop (1.5 hours).** Plan, retrieve, check, answer. Step 1 the planner reads the question plus resolver output and returns JSON: intent, entities, tools. Step 2 run up to 8 tools. Step 3 a check: does the evidence contain what the question asks; if not, broaden once (class, synonym, related equipment). Step 4 compose. Existing validators stay (every number from a tool result, citations present, safety guard). Rules mode uses the same resolver and tools, so it improves without a key.
4. **Answer format and memory (1 hour).** Lead sentence, up to three bold figures, a short list with part numbers that open the part forecast, one "see in the app" link to the matching view, evidence behind a fold. Conversation state keeps the focus entity and period; follow-ups such as "and its lead time?" resolve against it.
5. **UI (30 minutes).** Candidate chips when a name is ambiguous, suggested follow-ups, links in answers.
6. **Evaluation (1 hour).** 60 golden questions (the five above, the brief's key questions, per-tab questions) with expected tool and facts; script `tests/spi_ai_eval.js` runs rules mode in CI and Gemini on demand; target at least 90% in rules mode.

## Model use
Gemini flash-lite stays for the answer (cheap, fast). Planner uses `AI_MODEL_PLANNER` if set (a larger Gemini model), otherwise the same model. Each question has a 25 second budget; the function limit is 60 seconds.

## Who does what
Me: items 1 to 6 (files in `spi/ai/`, `server/ai/`, `spi_chat.js`, tests). Codex AI: review for safety (never explains bypassing a trip), extra golden questions, Gemini live run when the key is set. No page work by anyone else.

## Not changing
`POST /api/ai/ask` request and response shape (floating box and Ask the AI page keep working); validators; safety guard; labels Estimate and Assumption.
