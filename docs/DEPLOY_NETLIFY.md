# Hosting on Netlify

The site is `dist/index.html` plus the functions in `netlify/functions`. Storage is Netlify Blobs, which every site has, so there is no database to set up. The step-by-step version for first-timers is `LAUNCH_NETLIFY_GEMINI.txt`.

## Setup

1. In Netlify, add a new site from the GitHub repository and pick the branch. `netlify.toml` already has the build command (`python3 build.py`), the publish folder (`dist`) and the functions folder.
2. Get a free key from Google AI Studio (Gemini). Groq or OpenRouter free models also work.
3. Add the environment variables below, then deploy.
4. Open the site. The sidebar footer should read "Shared database online" and "AI connected". In Settings, "Run diagnostics" checks storage, the key and the model name.

| Variable | Use |
|---|---|
| `AI_API_KEY` | The key |
| `AI_PROVIDER` | `gemini` (the default once a key is set) or `openai` for an OpenAI-compatible API such as Groq |
| `AI_MODEL` | For example `gemini-2.5-flash`. Check AI Studio for the free models available to your key |
| `AI_BASE_URL` | Only for `openai`, for example `https://api.groq.com/openai/v1` |
| `AI_MODELS` | Optional list of models users can choose from in Settings |
| `AI_MODEL_FALLBACK` | Tried in order if `AI_MODEL` is not available to the key. Default `gemini-2.0-flash,gemini-1.5-flash` |
| `AI_DAILY_MAX` | AI requests per day for the whole site. Default 800. Keep it under the provider's free quota |
| `AI_RATE_PER_MIN`, `AI_RATE_PER_DAY` | Per-visitor limits. Defaults 12 and 120 |
| `AI_EMBED_MODEL`, `AI_EMBED_DAILY` | Embedding model for search by meaning (default `gemini-embedding-001`) and how many new texts per day (default 4000) |
| `EDIT_CODE` | If set, saving anything to the shared database needs this code |
| `APPROVE_CODE` | If set, approving a knowledge item needs this code too |
| `ADMIN_CODE` | Turns on backup, restore and clean-up in Settings. The admin routes are off without it |

Environment variables are read at build time. After changing one, trigger a new deploy.

## Functions

| Route | What it does |
|---|---|
| `POST /api/ai` | Writes the answer. May hand tool calls back to the page |
| `POST /api/embed` | Embeddings for search by meaning, cached by content hash |
| `/api/kb/*` | Shared knowledge store. `GET /api/kb/export` and `POST /api/kb/import` are the admin backup |
| `/api/config` | Admin only (needs `ADMIN_CODE`). `POST` saves a provider key in the server store, `GET` says whether one is saved (never the key), `DELETE` removes it. A saved key overrides `AI_API_KEY` and applies at once |
| `GET /api/health` | Status, which codes are required, today's AI use |
| `GET /api/selftest` | Diagnostics |

## How it behaves

- Everyone sees the same shared knowledge. The page checks for changes every 15 seconds, so an approval, an imported work order or a piece of feedback shows up for the others within about that time. Deleting an item removes it for everyone.
- The plant data (P&IDs, OPLs, datasheets, interlocks, maintenance history) is part of the page. The shared store only holds what people add.
- The page finds the matching records and works out any counts, rankings or forecasts itself, then sends both to `/api/ai`. The model writes the wording. The page checks the citations and every number before showing the answer. A request to bypass a protection never goes to the model.
- If the key is missing, the daily limit is used up, the provider fails or the visitor hits a limit, the assistant answers straight from the records and the footer says so.
- Opened as a plain file, the page keeps working from browser storage.

## Entering the key on the site

Instead of setting `AI_API_KEY` in Netlify, set `ADMIN_CODE`, sign in as the demo admin, open Settings, Connect the AI, paste the key and press Save and test. The key is kept in the server store and is never sent back to the browser. It is used on the next request, so no redeploy is needed. Removing it falls back to the Netlify variable.

## Roles

The sign-in role is enforced in the page: approving and removing knowledge, bulk import, accepting scenario rules and Administration are limited by role (see `PERM` in `src/modules/auth.js`). The API itself only checks the access codes, so use `EDIT_CODE`, `APPROVE_CODE` and `ADMIN_CODE` when the address is shared widely.

## About open access

Without access codes, anyone with the link can read, add and approve knowledge and use the AI up to the limits. The limits are approximate and only stop casual misuse. Free AI providers may use prompts for their own purposes, so keep confidential plant data out of a public site. The name in the audit trail is whatever the user typed in Settings. Set `EDIT_CODE` and `APPROVE_CODE` if you want some control, or use Netlify's site password protection.

## Trying it locally

```
npm install
npm run build
LOCAL_STORE_DIR=/tmp/akp AI_PROVIDER=mock node tools/devserver.mjs 8888
```

Then open http://localhost:8888. The mock provider gives canned answers, so no key is needed. `node tests/live.js` runs the full local check.
