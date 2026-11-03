# Netlify with more than one plant in the same repository

Short answer: the first plant's site is not a problem. A Netlify site builds one repository and one branch, with its own environment variables and its own storage. Two sites can use the same repository and show two different plants.

## How it fits together
| | First plant (existing site) | Hackathon plant (new site) |
|---|---|---|
| Netlify site | the one you already created | create a second one: Add new site, Import from GitHub, same repository |
| Production branch | keep as is, or pin it (below) | `integration` (or `main` once merged) |
| `CASE` variable | not set, so the default case `lldpe` is built | `CASE=<id>` |
| `ADMIN_CODE`, `AI_API_KEY` | its own | its own (the same Gemini key may be reused) |
| Shared database | its own Netlify Blobs store | a separate store: no data is shared between the two |
| URL | unchanged | new `*.netlify.app` address |

`build.py` reads `CASE` (default `lldpe`). The build command `python3 build.py` in `netlify.toml` therefore needs no change.

## Protect the first plant's site from new work
That site redeploys whenever its production branch changes. Your engine changes for the hackathon will not alter the `lldpe` result, because the case data is separate, but a broken build would still stop its deploy. Pick one:
1. **Pin it to a frozen branch.** `git branch release/lldpe <commit> && git push origin release/lldpe`, then in that site: Site configuration > Build and deploy > Branches > Production branch = `release/lldpe`.
2. **Stop auto publishing** (Deploys > Stop auto publishing), so deploys are built but published only when you choose.
Either way, keep the default in `build.py` as `lldpe` until the hackathon is over.

## One URL per agent branch
In the new site: Site configuration > Build and deploy > Branches > Branch deploys. Allow all branches, or just `integration`. Every pushed branch then gets its own address (for example `https://b-pid-fixes--yoursite.netlify.app`) built with the same `CASE`, so each agent and you can look at their work without touching the main site. The free plan has a monthly build allowance and each deploy uses part of it: check Usage, and limit branch deploys to `integration` if it runs low.

## Choosing the case by branch (optional)
Instead of the variable, `netlify.toml` can set the case for a branch:
```
[context.integration.environment]
  CASE = "<id>"
```
Use the variable in the Netlify screen unless you need this: it is easier to change during the day.

## Without GitHub
`CASE=<id> python3 build.py && python3 tools/pack.py` makes `AKP-netlify-drop.zip`. Unzip it and drop the folder on https://app.netlify.com/drop for a separate site. If the footer then says "Local only", the functions were not picked up: use the GitHub route.

## Checks after the first deploy of the new site
Footer shows "Shared database online" and "AI connected" (Settings, Run diagnostics). The sidebar subtitle and the dashboard show the new plant's name. `/api/health` shows `"store":"ok"`.
