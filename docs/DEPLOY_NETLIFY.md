# Deploying to Netlify (free, open access)

The site is a static page (`dist/index.html`) plus three Netlify Functions in `netlify/functions`:

| Function | Route | Job |
|---|---|---|
| `ai` | `POST /api/ai` | Hides the AI key, applies limits, builds the prompt from the records the page retrieved, calls a free model provider and streams the answer back |
| `kb` | `/api/kb/*` | Shared knowledge store in Netlify Blobs: knowledge items, imported work orders, feedback, audit trail, answer log |
| `health` | `GET /api/health` | Reports whether the store and the AI are available (never returns the key) |

## One time setup (about 10 minutes, no payment)

1. Push this repository to GitHub (already done) and in Netlify choose **Add new site, Import an existing project**, pick the repository and branch. `netlify.toml` already sets the build command (`python3 build.py`), the publish folder (`dist`) and the functions folder.
2. Create a free API key at a provider with a free tier, for example Google AI Studio (Gemini). Other options are Groq or OpenRouter (free models).
3. In Netlify open **Site configuration, Environment variables** and add:

| Variable | Value |
|---|---|
| `AI_API_KEY` | the key from step 2 |
| `AI_PROVIDER` | `gemini` (default when a key is set) or `openai` for any OpenAI compatible API |
| `AI_MODEL` | for example `gemini-2.5-flash`. Check the provider for the current free model names |
| `AI_BASE_URL` | only for `openai`, for example `https://api.groq.com/openai/v1` |
| `AI_MODELS` | optional comma separated list the user may pick from in Settings |
| `AI_DAILY_MAX` | optional, total AI requests per day for the whole site (default 800). Keep it under the provider's free quota |
| `AI_RATE_PER_MIN`, `AI_RATE_PER_DAY` | optional, per visitor limits (defaults 12 and 120) |

4. Trigger a deploy. Open the site. The sidebar footer shows **Shared database online** and **AI assistant live**. The gear opens Settings, where **Test the AI connection** confirms the key works.

Netlify Blobs needs no setup. It is available to functions on every site.

## Optional settings

| Variable | Effect |
|---|---|
| `EDIT_CODE` | When set, every change to the shared database needs this code. Visitors enter it once in Settings, Access codes. Reading stays open. |
| `APPROVE_CODE` | When set, approving a knowledge item needs this code in addition to the edit code. Use it so only reviewers can make knowledge trusted. |
| `ADMIN_CODE` | Enables backup, restore and clean-up in Settings, Administration. The admin routes stay disabled while it is unset. |
| `AI_MODEL_FALLBACK` | Models tried in order when `AI_MODEL` is not available to the key (default `gemini-2.0-flash,gemini-1.5-flash`). |
| `AI_EMBED_MODEL`, `AI_EMBED_DAILY` | Embedding model for meaning-based search (default `gemini-embedding-001`) and the daily number of new texts allowed (default 4000). |

Settings, Run diagnostics calls `/api/selftest` and reports in plain language whether storage, the key and the model work.

## Functions

| Route | Job |
|---|---|
| `POST /api/ai` | answer writer; may return tool calls that the page runs and sends back |
| `POST /api/embed` | embeddings for meaning-based search, cached on the server by content hash |
| `/api/kb/*` | shared knowledge store; `GET /api/kb/export` and `POST /api/kb/import` for backup (admin) |
| `GET /api/health` | status, access flags and today's AI usage |
| `GET /api/selftest` | diagnostics |

## How it behaves

- Everyone who opens the URL uses the same shared knowledge. The page polls every 15 seconds, so a knowledge item, an approval, an imported work order or feedback from one person appears for the others within about 15 seconds. Deleting an item removes it everywhere.
- The base plant data (P&IDs, OPLs, datasheets, interlocks, maintenance history) is part of the page. The shared store holds what people add on top.
- The page retrieves the matching records and runs the computed tools (statistics, rankings, predictions, chain reactions) in the browser, then sends them to `/api/ai`. The model writes a natural language answer. The page checks the cited sources and every number against the records. Bypass requests are always answered by the built-in safety handler.
- If the AI key is missing, the daily budget is used up, the provider fails or the visitor is rate limited, the assistant answers from the records directly and the footer says so.
- Opened as a plain file, the page works as before from browser storage.

## Open access and what it means

There is no login. Anyone with the URL can read and add knowledge and use the AI up to the limits. Limits are approximate (no locking) and stop casual abuse, not a determined attacker. Anything added is visible to every visitor, and the free model providers may use prompts for their own purposes: do not put confidential plant data in a public deployment. The approval workflow and audit trail record who did what, but the name is a label typed in Settings, not an identity. To close the site later, enable Netlify password protection or add an access check in `netlify/functions/_lib.mjs`.

## Local trial

```
npm install
npm run build
LOCAL_STORE_DIR=/tmp/akp AI_PROVIDER=mock node tools/devserver.mjs 8888   # http://localhost:8888
node tests/live.js                                                         # two browser users, adapters, limits, fallback
```
`AI_PROVIDER=mock` gives a deterministic offline AI for trials. The functions can also be run with `netlify dev` if you have the Netlify CLI.
