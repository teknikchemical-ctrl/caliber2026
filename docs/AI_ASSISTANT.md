# Using and checking the AI assistant

The assistant searches the records of the plant shown in the app. It uses those records and the built-in calculation tools to answer questions. With a working server connection, Gemini writes the answer. Without that connection, the app answers from its local records and shows a search-only label. A local answer does not prove that Gemini works.

Open each cited source before using a safety-critical value. Check its revision and approval status. Confidence scores and predictive results are screening estimates, not approval to operate. The assistant refuses requests for instructions to bypass trips or interlocks.

## Connect Gemini

An administrator can set `AI_API_KEY` in the Netlify site's environment settings and redeploy. Start with `AI_PROVIDER=gemini`. `AI_MODEL` selects the first model; `AI_MODEL_FALLBACK` lists alternatives separated by commas. The current defaults try Flash models. Availability and quota depend on the account and can change.

Alternatively, set `ADMIN_CODE` on Netlify and redeploy. In the app, open Settings, enter the administrator code under Access codes, then enter the key under Connect the AI and choose Save and test. A saved key takes priority over the environment key. Remove the saved key to return to the environment key. Enter keys only in these secure settings, never in chat, source files, screenshots or handoff notes.

## Check the connection

1. Open Settings and select Test the AI connection. A Working message confirms that the app received an answer through its configured provider. The full assistant request is used for this check.
2. Select Run diagnostics. Shared storage checks whether server-side records can be saved and read. Provider connection checks the model list. A listed model is not proof that it will answer.
3. Read AI answer. This makes a small real request and reports which model returned visible text, or why the attempts failed. Empty output, hidden reasoning alone, a blocked response and malformed JSON do not count as answers. Each upstream operation has a 1.5 s limit and the whole diagnostic has a 6 s limit to leave deployment overhead. A slow diagnostic can fail even when a longer normal request would work.
4. Ask a normal plant question and open its sources. Confirm the label says AI connected and the answer names the model. Check that sources belong to the selected plant.

Diagnostics also support an OpenAI compatible provider. A test provider is labelled as a test and does not establish a real Gemini connection. Diagnostics are not an embeddings test or a guarantee that a full question will complete.

## Read a failure

| Message | What to check |
|---|---|
| No AI key on the server | Add the key in Netlify and redeploy, or use Connect the AI with the administrator code. |
| HTTP 400, 401 or 403 | Check the provider, key, API restrictions and request error. Trying another model cannot repair a rejected key. |
| Model not found or HTTP 404 | Check `AI_MODEL`. The assistant tries configured alternatives and can discover available Gemini models. |
| HTTP 429 or quota exceeded | Check account quota and billing restrictions. A different model may have quota; repeated retries cannot create quota. |
| HTTP 500, 502, 503 or 504 | Read the accompanying provider message. Retry once and check the provider status. A Netlify crash page needs function logs. |
| No answer text or SAFETY | The provider returned no visible answer. Do not treat the model-list check as success. |
| Diagnostics time limit | Retry once. If it repeats, check Netlify function logs and select a faster model. Diagnostics report partial completed checks. |
| Search by meaning stays loading | This concerns embeddings, a separate service with its own model and quota. Keyword search can still work. Report the embedding error from the browser or function logs. |
| Search only (AI not reachable) | The app fell back to records. Read Test the AI connection and Run diagnostics for the underlying cause. |

When reporting a problem, share the failing check name, its message, model name, approximate time and whether it happened after redeployment. Remove keys, access codes and private plant text from logs before sharing. Do not send a key to an agent.

## A different plant tomorrow

The integrator adds the new case pack and builds it. The assistant sends that case's title and retrieved records to the server. Check a known equipment question, a question the records cannot answer and a bypass request on the new case. Confirm citations, approval warnings, numeric values and the refusal. Never fill gaps with figures from the previous plant.

## Developer checks and current verification

From the repository root, run `bash tools/setup_env.sh`, `python3 build.py`, `npm run test:quick` and `node tests/live.js`. Set `CHROMIUM` to the installed browser, `/usr/bin/chromium` in this cloud environment. Browser and local-server commands here need command sandbox escalation. The live test uses local fake providers and HTTP, including diagnostics failure cases and the original plant's 131-question evaluation. It cannot prove live Gemini access.

This cloud browser blocks file URLs, so the shared regression runner in `npm run test:quick` cannot navigate to its build here. That runner needs an HTTP route from its owner. No administrator browser policy is disabled. The live suite remains the HTTP-based assistant check. Claude A must merge `codex/ai` and redeploy before these changes reach the live site. A human must then run the connection and diagnostics checks above; no real Gemini key was available for local validation.
