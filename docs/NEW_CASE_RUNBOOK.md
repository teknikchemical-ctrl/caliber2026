# Running a new case in under a day

This is the plan for the hackathon day. It assumes two people, each with a Claude session on the same repository, and a plant-related case that comes with documents (P&IDs, datasheets, interlock logic, OPLs, a maintenance history) or a brief that describes them.

## Before the day (once)
1. Merge the prepared branch into `main`. Create the Netlify site from the repository and set `ADMIN_CODE` and `AI_API_KEY` (`LAUNCH_NETLIFY_GEMINI.txt`). Check "Shared database online" and "AI connected" on the footer.
2. Add the second person as a collaborator, and have them open a Claude session on the repository.
3. In each session run `bash tools/setup_env.sh`, then `python3 build.py` and `npm run test:quick`. Everything must be green before the day.
4. Agree who is Stream A and who is Stream B (`CLAUDE.md`).

## Deploying another case
Netlify builds the default case (`lldpe`). For a new case set the environment variable `CASE=<id>` in Netlify (Site configuration > Environment variables) and redeploy, or change the default in `build.py`. For the drop package: `CASE=<id> python3 build.py && python3 tools/pack.py`. Locally: `python3 build.py <id>`.

## Hour by hour

| When | Stream A (data and intelligence) | Stream B (pages, visuals, deliverables) |
|---|---|---|
| 0:00 to 0:30 | Read the brief. Fill `docs/CAPABILITIES.md` against it: which asks the app already covers, which need a new module. Run `tools/new_case.sh <id> "<Plant title>"`. | Same brief. Decide the story: the three questions the judges will ask and the one demo path. Start the deck outline. |
| 0:30 to 2:30 | **Intake.** Split the documents with `tools/pdf_pages.sh`, read them, write `plant.json` (use `docs/INTAKE_PROMPTS.md`). Import the maintenance history with `tools/pack_import_mh.py` if it is a spreadsheet. | Research and numbers for the business case. Reuse the finance and report builders, change the inputs. |
| 2:30 to 3:00 | `python3 tools/pack_build.py cases/<id>`, fix every error from the validator, `python3 build.py <id>`, `node tests/smoke_case.js`. **Push. First public URL exists.** | Review the first build on the URL: list what looks wrong or wrong-worded. |
| 3:00 to 7:00 | Make the assistant excellent on this case: add case-specific evaluation questions, fix wrong answers, add any case-specific tool. Keep the score above 90%. | Hand-draw the two or three hero units: put the corrected sheets in `cases/<id>/geo/pid.js` (or accept the generated ones). Build the case-specific page the brief asks for. |
| 7:00 to 9:00 | Server, roles, AI key, Netlify checks, performance check (`tools/profile_load.js`). | Deck, report, demo video. Screenshots with `tools/case_shots.js`. |
| 9:00 to 11:00 | Run `tests/smoke_case.js`, `tests/layout.js`, `tools/text_audit.js`. Fix leftovers of the old plant's wording. | Final deck and report. Rehearse the demo on the public URL. |
| 11:00 on | Freeze. Only fixes. Tag the release. | Submit. |

## Rules for the day
- Push to a branch after every working step. Merge to `main` only when `npm run test:quick` and the smoke test pass.
- Do not edit `build.py`, `src/base.html` or the tests in both sessions at the same time. Say in the chat which one you are in.
- Anything synthetic must be labelled as such in the app and in the deliverables (the compiler marks generated work orders "SYNTHETIC record").
- Check the hackathon rules about pre-built frameworks and about AI use before using prepared code or the Gemini key in the submission.

## When something is missing from the data
| Missing | What the app does | What to do |
|---|---|---|
| Interlock logic | the set is treated as a control loop with no trips | write `interlock` for safety-critical sets only |
| Maintenance history | `"history": {"source": "synthetic"}` creates invented records | say so on the page and in the deck, or remove the maintenance claims |
| Drawings | generated schematics | fine for the demo; redraw the hero units if time allows |
| Fluid not in the hazard table | hazard simulator skips the set | add a row to `HSE_F` in `hse.js` |

## If a build fails
`python3 tools/pack_validate.py <id>` first. Then `node --check` on the failing module. A build that stops with `PATCH MISSING` means a text patch in `build.py` no longer finds its text: fix the text patch, not the module.
