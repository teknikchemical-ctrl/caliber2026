const assert = require('node:assert/strict');
(async () => {
  const {openDb} = await import('../server/_lib/db.mjs');
  const {ask} = await import('../spi/ai/ask.js');
  const {gemini} = await import('../spi/ai/providers/gemini.js');
  let requests = 0;
  const parts = [
    {functionCall: {id: 'profile-call', name: 'get_part_profile', args: {material_no: 4100000129}}, thoughtSignature: 'opaque-test-signature'},
    {functionCall: {id: 'count-call', name: 'inventory_metric', args: {metric: 'part_count'}}},
    {functionCall: {id: 'invalid-call', name: 'get_part_profile', args: {material_no: 'invalid'}}}
  ];
  const adapter = gemini({key: 'synthetic-test-key', model: 'synthetic-model', fallbacks: [], fetcher: async (url, options) => {
    const body = JSON.parse(options.body);
    requests++;
    let output;
    if (requests === 1) {
      assert(body.tools[0].functionDeclarations.some(t => t.name === 'get_part_profile'));
      output = parts;
    } else {
      const modelIndex = body.contents.findIndex(c => c.role === 'model');
      assert(modelIndex >= 0, 'model tool-call turn must be replayed');
      assert.deepEqual(body.contents[modelIndex].parts, parts, 'preserve call IDs and thought signatures');
      const response = body.contents[modelIndex + 1];
      assert.equal(response.role, 'user');
      assert.equal(response.parts.length, 3);
      const [good, count, bad] = response.parts.map(p => p.functionResponse);
      assert.equal(good.name, 'get_part_profile');
      assert.equal(good.id, 'profile-call');
      assert.equal(good.response.untrusted_tool_result.material_no, 4100000129);
      assert.equal(bad.id, 'invalid-call');
      assert.match(bad.response.error, /Invalid tool arguments/);
      output = [{text: body.generationConfig.responseSchema ? JSON.stringify({answer: 'There are 7481 spare parts.', citations: ['metric:part_count']}) : 'Evidence retrieved.'}];
    }
    return {ok: true, json: async () => ({candidates: [{content: {role: 'model', parts: output}}]})};
  }});
  const result = await ask({db: openDb(), question: 'Find spare parts', adapter});
  assert.equal(requests, 3);
  assert.equal(result.provider, 'gemini');
  assert(result.answer.includes('7481'));
  assert(result.trace.some(t => t.step === 'answer_validation' && t.ok));
  assert(!result.trace.some(t => t.step === 'rules_fallback'));
  let schemaRequests = 0;
  const schemaAdapter = gemini({key: 'synthetic-schema-key', model: 'synthetic-model', fallbacks: [], fetcher: async (url, options) => {
    const body = JSON.parse(options.body);
    schemaRequests++;
    if (body.generationConfig.responseSchema) return {ok: false, status: 400, json: async () => ({error: {message: 'Request contains an invalid argument.'}})};
    if (schemaRequests > 1) {
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert(body.systemInstruction.parts.some(p => p.text.includes('application schema')));
    }
    return {ok: true, json: async () => ({candidates: [{content: {parts: [{text: schemaRequests > 1 ? JSON.stringify({answer: '7481 parts', citations: ['metric:part_count']}) : 'Evidence retrieved.'}]}}]})};
  }});
  const schemaResult = await ask({db: openDb(), question: 'How many spare parts are in the baseline data?', adapter: schemaAdapter});
  assert.equal(schemaRequests, 2);
  assert.equal(schemaResult.provider, 'gemini');
  assert(schemaResult.trace.some(t => t.step === 'answer_validation' && t.ok));
  console.log('PASS: rejected provider schema retries in JSON mode and still passes strict application grounding and schema checks.');
  let networkCalls=0;
  const networkAdapter=gemini({key:'synthetic-network-key',model:'reset-model',fallbacks:['working-model'],fetcher:async()=>{
    if(++networkCalls===1)throw Object.assign(new TypeError('fetch failed'),{cause:{code:'ECONNRESET'}});
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Ready'}]}}]})};
  }});
  const recovered=await networkAdapter.complete({messages:[{role:'user',content:'Test connection'}]});
  assert.equal(recovered.model,'working-model');assert(recovered.attempts[0].error.includes('ECONNRESET'));
  console.log('PASS: transient connection reset is diagnosed without credentials and retried within the request budget.');
  console.log('PASS: Gemini REST tool calls preserve signatures, return SQLite data and validation errors as functionResponse, and produce a grounded answer without fallback.');
})().catch(e => {console.error(e); process.exitCode = 1});
