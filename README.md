# Asset Knowledge Platform

Knowledge hub for the LLDPE unit, built for CALIBER 2026 Case 1. It puts the P&IDs, equipment drawings, plot plan, interlocks, OPLs, datasheets and the maintenance history in one place, with an assistant that answers from them and shows its sources.

All plant data in the repository is the sample data supplied for CALIBER.

## Other plants

The app is an engine plus a case pack. `cases/lldpe` is this plant. A new plant is described in a short `plant.json` and compiled into a pack (`python3 tools/pack_build.py cases/<id>`, `python3 build.py <id>`). `cases/mock-cdu` shows the result for a crude distillation unit with no drawn geometry. See `docs/CASE_PACKS.md`, `docs/NEW_CASE_RUNBOOK.md` and `CLAUDE.md`.

## Run it

Open `knowledge-hub-integrated_BAP5.html` in a browser. It works on its own, with data kept in the browser.

To share knowledge between people and switch on the AI, host it on Netlify. The steps are in `LAUNCH_NETLIFY_GEMINI.txt` and `docs/DEPLOY_NETLIFY.md`.

## Sign-in

A simple sign-in screen, for the demo and not for security: the account list is in the page. `Caliber` / `Caliber2026` is the demo admin (role Manager, can switch role under Settings). The other accounts are the people named in the work orders. The username is the first name and the password is the first name plus 2026, for example `Oscar` / `Oscar2026`. The role follows the employee number: 1xxx supervisors are Managers, 2xxx operators, 3xxx mechanical technicians are Engineers, 4xxx instrument technicians are Reliability, 5xxx electrical technicians are HSE. The sign-in screen lists them all (Demo accounts). Automated browsers skip the screen and sign in as Caliber; add `?login` to the address to see it.

## What is in it

- Dashboard opens on a 3D plant: all eight units on the plot plan layout, joined by pipes, with floating status labels, flow, a flare and simulator trips. Select a unit to fly to it and open its equipment set. The plant P&ID overview follows below
- Equipment sets: P&ID, GA drawing, datasheet, interlock logic, OPLs, maintenance, scenarios
- Maintenance: work orders, timeline, forecasts, plant replay
- Scenarios: replay an OPL case or work order on the P&ID, or trip a unit and follow the knock-on effects
- AI Assistant with sources, a confidence level and a check of every number
- Knowledge Studio: ingestion wizard, review and approval, failure reports
- Failure Memory, Report Center, Integrations, Data Quality, Governance (controls, feasibility, roadmap, business case)
- Performance: key indicators per equipment and for the plant, targets, knowledge status and spare parts outlook
- 2D and 3D views of every equipment drawing (own renderer, no library), with X-ray, moving parts (fan, flywheel, pistons, drum, valve stem, level float) and an information card for the selected part
- AI reading of uploaded documents (`/api/extract`): structure and facts with quotes, secrets masked, unsupported items dropped, reviewed before saving
- My work, notification bell, and Data Quality items that can be resolved or accepted by the roles allowed to review
- Report Center includes a Solution brief; Settings has a scripted demo walkthrough
- Interface language switch (English or Bahasa Indonesia); questions in Bahasa are understood by the offline search
- Installable as an app, and the page opens offline from the service worker (served sites only)
- Ctrl+K searches everything
- Equipment drawings and the plant render with a depth buffer (own renderer): smooth surfaces, correct hidden parts, edge lines and a sharper picture when still. A build step (`node tools/g3bridge.js`) joins any part that would hang in the air
- Start-up readiness for each unit: start permissives read against the live model, latched trips, valves out of position, recent repairs, lessons to read, earlier start-up problems and open document conflicts, with a GO / GO WITH CHECKS / NO-GO result, sign-off and a printable handover note
- HSE hazard simulator on the plot plan, in 2D and in a 3D site model: gas cloud (25, 50 and 100% of the lower flammable limit), jet fire, pool fire and blast, detectors, shutdown timing, walk to muster, worst-case wind and ignition time, and kept cases to compare
- Reliability analysis in Maintenance, Predictive: failure modes ranked by risk priority, reliability measures, chance of each failure mode in 90 days, lessons whose warning signs appear in recent work orders, lesson use, and a combined score that is tested on the history
- A failure mode with no lesson can be turned into a draft lesson from its own work orders
- The assistant has 20 computed tools, including hazard effects and failure modes, and warns about open document conflicts and unapproved sources
- Dashboard strip of what needs attention, readiness and hazard chips on each equipment header, CSV exports, error banner, keyboard help (`?`)

## Pitch deck

`deck/build_all.sh` takes screenshots of the built app, builds `deck/CALIBER2026_Asset_Knowledge_Platform_Deck.pptx` (7 required slides plus appendix) and renders a preview. The business case numbers are in `deck/make_deck.py` and flagged as data or assumption.

## Working on the code

```
npm install
npm run build        # python3 build.py
npm test             # build, static checks, regression, live test
```

Change the files in `src/`, not the generated HTML. `docs/ARCHITECTURE.md` explains how the pieces fit.

| Command | What it does |
|---|---|
| `npm test` | Build, static checks, page regression with the answer evaluation and simulator smoke test, then the live test |
| `npm run test:quick` | Same without the live test |
| `npm run test:layout` | Opens every page and tab at 1440, 1100, 820 and 390 px and reports overlaps, clipped text, spill and accessibility problems |
| `npm run test:layout:quick` | The same at 1440 px only |

The live test starts the functions locally and drives two browsers against them: shared knowledge, access codes, conflicts, backup, AI adapters, rate limits and the offline fallback. GitHub Actions runs the tests on every push.

`src/modules/fx.js` moves small SVG labels off each other automatically and adds the motion (ripples on tripped equipment, the simulator frame, count-up on tiles). Check a new CSS class name before using it. A name that already exists elsewhere restyles the old component without any error, which is how the scenario selector once ended up squashed.

## Limits

- The plant data is a snapshot built into the page. Nothing is connected to the document, maintenance or historian systems.
- Search by meaning uses the AI provider's embeddings. The similarity cut-off (`DB.EMB_MIN`) has not been tuned on real questions.
- Unit history does not predict the next breakdown better than the plant average, so the forecasts are for ranking, not for dates.
- The chain reaction rules are assumptions. They are listed under Scenarios, Assumptions register, for an engineer to review.
- Access codes are shared secrets, not personal logins.
- No email or chat alerts.
