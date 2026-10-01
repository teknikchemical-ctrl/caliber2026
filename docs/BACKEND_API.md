# Backend API for the LLM connection

The browser build already implements the logic below locally (`dl.js`, `facts.js`, `intent.js`, `ai.js`). A server version keeps the same names and shapes so the front end only changes its endpoint.

## Components

| Component | Responsibility |
|---|---|
| Ingestion | Parse a file, detect asset, tags, revision and date, split into chunks of about 700 characters on paragraph boundaries, compute `content_hash`, run quality gates, store as a draft |
| Indexer | For chunks with `embedding is null` or a changed `content_hash`, call the embedding model and store the vector. Maintain the `tsvector` |
| Retrieval | Hybrid search: BM25 (`ts_rank_cd`) plus vector cosine, filtered by asset, status visibility for the caller's role and validity dates, then re-ranked with the status trust weight |
| Tool service | Deterministic handlers (see `tools.json`) that read typed `fact`, `work_order`, `failure_event` tables. They return `{text, sources, conf}` |
| Orchestrator | Builds the prompt from `PROMPT_TEMPLATE.md`, calls the model, executes tool calls (max 3 rounds), validates the answer against `answer.schema.json`, rejects citations that were not retrieved, computes confidence and number checks, writes `qa_log` |
| Evaluation | Runs `eval_case` rows against the live pipeline on every prompt or model change and stores `eval_run` |

## Endpoints (JSON over HTTPS, bearer token with the user's role)

### POST /v1/ask
Request: the payload documented in `AI_PROVIDER_CONTRACT.md` without `retrieved` (the server retrieves). Extra fields: `conversation_id`, `stream` (boolean).

Response (non streaming):
```json
{ "answer": "...", "citations": ["il:TJC-LLD-IL-KC-4501#03"], "confidence": 82,
  "needs_verification": false, "refused": false, "handler": "consequence_analysis", "model": "model-name",
  "sources": [{ "chunk_id": "...", "title": "...", "revision": "Rev 3", "status": "Issued for Operation" }],
  "trace": [{ "step": "retrieve", "detail": "6 of 1109 chunks", "ms": 14 }], "qa_id": "Q..." }
```
Streaming: `Content-Type: text/event-stream`, one JSON object per event, `{"delta":"..."}` for tokens, then `{"done":true, ...final fields above}`.

### GET /v1/search?q=&asset=&kinds=&k=
Returns ranked chunks with `chunk_id`, `score`, `rel`, `status`, `revision`, `snippet`. Used by global search and by the model's `search_chunks` tool.

### GET /v1/facts?asset=&kind=&name=
Typed facts (set points, permissives, bill of material, nozzles, datasheet values, locations).

### GET /v1/records/{id}
Full record (document version, work order, interlock, OPL, knowledge item) with revisions.

### Knowledge Studio
`POST /v1/knowledge` (create draft), `PUT /v1/knowledge/{id}` (new revision), `POST /v1/knowledge/{id}/submit`, `POST /v1/knowledge/{id}/review` with `decision` approved, rejected or changes_requested. Server rules: a reviewer cannot approve their own item unless role Manager; Operators cannot approve; approving an item with the same title supersedes the earlier approved item; changing an approved item returns it to in_review.

### Feedback and evaluation
`POST /v1/feedback` `{qa_id, verdict, comment}`, `GET /v1/qa_log`, `POST /v1/eval/run`, `GET /v1/eval/runs`.

## Rules the server must enforce (not the browser)

1. **Authorization**: filter chunks by `acl_roles` and status visibility before retrieval. Operators never receive draft or in_review content.
2. **Citations**: drop or reject any citation whose `chunk_id` was not in the sources or tool results of this request.
3. **Safety requests**: a bypass, defeat or override request is answered by the `safety_guard` tool, not by the model. Log it.
4. **Prompt injection**: wrap every source in `<source>` tags, strip control characters, and keep the "untrusted data" rule in the system prompt. Never let source text change tool arguments without validation.
5. **Numbers**: verify numeric values in the answer against the cited chunks and facts; set `needs_verification` when a value cannot be found.
6. **Budget**: at most 12 sources and 6000 tokens of context; drop lowest scored first. Cache identical question and source set pairs.
7. **Logging**: write `qa_log` and `qa_citation` for every request, including refusals and failures. Redact personal data from logs.
8. **Evaluation gate**: block deployment of a new model or prompt if the pass rate of `eval_case` drops below the previous run or below 90 percent.

## Migration path from this build

1. Download the backend bundle from the Integrations page (`schema.sql`, `chunks.jsonl`, `facts.jsonl`, `relations.jsonl`, `tools.json`, `eval_cases.json`).
2. Create the schema and load the files. Compute embeddings with `DB.embedAll` equivalent on the server.
3. Port the handlers in `intent.js` to the tool service (they are plain functions over facts and work orders).
4. Point the Assistant endpoint at `/v1/ask`. The page already sends the contract, shows streaming tokens, tool steps, citations and the model name.
