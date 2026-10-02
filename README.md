# Asset Knowledge Platform

Knowledge hub for the LLDPE unit, built for CALIBER 2026 Case 1. It puts the P&IDs, equipment drawings, plot plan, interlocks, OPLs, datasheets and the maintenance history in one place, with an assistant that answers from them and shows its sources.

All plant data in the repository is the sample data supplied for CALIBER.

## Run it

Open `knowledge-hub-integrated_BAP5.html` in a browser. It works on its own, with data kept in the browser.

To share knowledge between people and switch on the AI, host it on Netlify. The steps are in `LAUNCH_NETLIFY_GEMINI.txt` and `docs/DEPLOY_NETLIFY.md`.

## Sign-in

A simple sign-in screen, for the demo and not for security: the account list is in the page. `Caliber` / `Caliber2026` is the demo admin (role Manager, can switch role under Settings). The other accounts are the people named in the work orders. The username is the first name and the password is the first name plus 2026, for example `Oscar` / `Oscar2026`. The role follows the employee number: 1xxx supervisors are Managers, 2xxx operators, 3xxx mechanical technicians are Engineers, 4xxx instrument technicians are Reliability, 5xxx electrical technicians are HSE. The sign-in screen lists them all (Demo accounts). Automated browsers skip the screen and sign in as Caliber; add `?login` to the address to see it.

## What is in it

- Dashboard with all eight P&IDs laid out like the plot plan and joined by their process lines
- Equipment sets: P&ID, GA drawing, datasheet, interlock logic, OPLs, maintenance, scenarios
- Maintenance: work orders, timeline, forecasts, plant replay
- Scenarios: replay an OPL case or work order on the P&ID, or trip a unit and follow the knock-on effects
- AI Assistant with sources, a confidence level and a check of every number
- Knowledge Studio: ingestion wizard, review and approval, failure reports
- Failure Memory, Report Center, Case 1 Coverage, Integrations, Data Quality
- Ctrl+K searches everything

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
