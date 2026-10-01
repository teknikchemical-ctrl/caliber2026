# AI provider contract (version 1.2)

The assistant can run offline (retrieval and tools in the browser) or through a real language model. Set one of:

- `window.AI_PROVIDER = async payload => response` (in page or injected script), or
- the endpoint on the Assistant page (HTTP POST, JSON), stored in `localStorage` key `akp_ai_cfg`.

The Integrations page has a test button and a built-in mock provider that exercises the whole contract.

## Request

```json
{
  "question": "What is the start permissive for KC-4501?",
  "scope": { "set": 4 },
  "context": { "page": "Assistant", "set": 4, "label": "KC-4501", "selection": "", "role": "Engineer" },
  "history": [{ "role": "user", "text": "..." }],
  "retrieved": [
    { "chunk_id": "doc:IL-4#07", "id": "IL-4", "k": "doc", "stat": "approved", "date": "2026-03-22", "title": "...", "sec": "Interlock - start permissive", "text": "...",
      "ver": "Rev 02", "status": "Issued for Operation", "score": 31.1, "rel": 1, "hits": ["start", "permissive", "kc-4501"] }
  ],
  "tools": [{ "name": "interlock_info", "description": "...", "parameters": { "type": "object", "properties": {} } }],
  "tool_results": [{ "name": "interlock_info", "args": { "set": 4 }, "result": "plain text" }],
  "policy": "Answer only from the retrieved sources ...",
  "contract": "1.1"
}
```

`tool_results` is present only on the second and later rounds.

## Response

```json
{
  "answer": "The start permissives of KC-4501 are ... [IL-4]",
  "html": false,
  "citations": ["doc:IL-4#07", "il:TJC-LLD-IL-KC-4501#03"],
  "sources": ["doc:IL-4#07"],
  "tool_calls": [{ "name": "plot_plan_query", "args": { "kind": "route", "a": 4 } }],
  "confidence": 82
}
```

- `citations` (preferred) or `sources` are chunk ids resolved against `retrieved`. Any id that was not retrieved is rejected and recorded in the steps. Objects are accepted for `sources`.
- Streaming: set `AI.cfg.stream`; the request carries `"stream": true` and the reply may be `text/event-stream` or NDJSON with `{"delta":"..."}` events then `{"done":true, ...}`.
- Every answer is logged (question, retrieved and cited chunk ids, model, prompt version, confidence, latency, token estimate) in the Question log of the Knowledge Studio.
- If `tool_calls` is non-empty the browser executes them and calls the provider again (maximum 3 rounds).
- `confidence` (0 to 100) is optional and replaces the local estimate.
- A response that fails validation (`aiValidate`) is discarded and the local answer is used.

## Behaviour required from the provider

1. Answer only from `retrieved` and `tool_results`. Cite source ids.
2. If the sources do not support an answer, say so.
3. Never invent set points, limits or values. The browser checks that numbers in the answer appear in the sources and flags those that do not.
4. State the approval status when a source is not Approved or Issued.

## Tools

`maintenance_stats`, `failure_memory`, `predictive_maintenance`, `plot_plan_query`, `interlock_info`, `spec_lookup`, `equipment_info`. Schemas are generated from `AI.tools` and listed on the Integrations page.

## Retrieval upgrade path

`DB.search` is the single retrieval entry point. To add semantic vectors, compute an embedding per chunk in `DB.build()`, store it on the chunk, and blend a cosine score into `DB.search`. The rest of the pipeline is unchanged.
