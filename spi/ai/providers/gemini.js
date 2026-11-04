// Vercel adapter. Credentials stay in headers; model-list success is never treated as answer success.
let discovery={key:'',base:'',at:0,models:[]};
const retryable=e=>[429,500,502,503,504].includes(e.status)||([400,404].includes(e.status)&&/model|not found|not supported|retired|no longer/i.test(e.message))||['AbortError','TimeoutError'].includes(e.name);
const safeSchema=s=>{if(Array.isArray(s))return s.map(safeSchema);if(!s||typeof s!=='object')return s;const out={};for(const[k,v]of Object.entries(s)){if(k==='properties')out[k]=Object.fromEntries(Object.entries(v).map(([name,x])=>[name,safeSchema(x)]));else if(['type','description','items','enum','required','minimum','maximum','minItems','maxItems','nullable'].includes(k))out[k]=safeSchema(v)}if(out.type){const ts=[].concat(out.type);out.type=String(ts.find(x=>x!=="null")||"string").toUpperCase();if(ts.includes("null"))out.nullable=true}else if(out.enum?.length)out.type=typeof out.enum[0]==="number"?"NUMBER":"STRING";return out};
export function gemini({key=process.env.AI_API_KEY,base=process.env.AI_BASE_URL||'https://generativelanguage.googleapis.com/v1beta',model=process.env.AI_MODEL||'gemini-flash-latest',fallbacks=(process.env.AI_MODEL_FALLBACK||'gemini-flash-lite-latest,gemini-2.5-flash').split(','),callMs=8000,totalMs=25000,fetcher=fetch}={}){
 const request=async(url,body,signal)=>{const r=await fetcher(url,{method:body?'POST':'GET',signal,headers:{'content-type':'application/json','x-goog-api-key':key},...(body?{body:JSON.stringify(body)}:{})});let j;try{j=await r.json()}catch(e){if(!r.ok)throw Object.assign(new Error('Provider HTTP '+r.status),{status:r.status});throw e}if(!r.ok)throw Object.assign(new Error('Provider HTTP '+r.status+': '+String(j.error?.message||'request refused').slice(0,180)),{status:r.status});return j};
 const discover=async signal=>{
  if(discovery.key===key&&discovery.base===base&&Date.now()-discovery.at<600000)return discovery.models;
  const j=await request(base+'/models?pageSize=200',null,signal);
  const names=(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>String(m.name).replace(/^models\//,'')).filter(n=>/^gemini-/.test(n)&&!/embedding|image|tts|audio|live|vision|robotics|computer-use/.test(n));
  const score=n=>(/flash-lite/.test(n)?2:/flash/.test(n)?3:/pro/.test(n)?1:0)*1000+Number((/gemini-(\d+(?:\.\d+)?)/.exec(n)||[])[1]||0)*10;
  names.sort((a,b)=>score(b)-score(a));discovery={key,base,at:Date.now(),models:names};return names;
 };
 return {name:'gemini',async complete({system='',messages=[],tools,schema,temperature=.2,signal}={}){
  if(!key)throw new Error('AI_API_KEY is not configured in the Vercel environment');
  if(JSON.stringify({system,messages}).length>24000)throw new Error('AI prompt exceeds the request token budget');
  const overall=AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(totalMs)]),tried=new Set(),attempts=[];
  let queue=[...new Set([model,...fallbacks.map(x=>x.trim()).filter(Boolean)])],discovered=false;
  while(queue.length||!discovered){
   if(overall.aborted)break;
   if(!discovered&&(tried.size>=2||!queue.length)){discovered=true;try{queue=[...(await discover(AbortSignal.any([overall,AbortSignal.timeout(Math.min(callMs,2000))]))).filter(m=>!tried.has(m)).slice(0,3),...queue]}catch(e){attempts.push({step:'discovery',error:e.message})}}
   const selected=queue.shift();if(!selected||tried.has(selected))continue;tried.add(selected);
   const attemptSignal=AbortSignal.any([overall,AbortSignal.timeout(callMs)]);
   const body={systemInstruction:{parts:[{text:system}]},contents:messages.map(m=>({role:['assistant','model'].includes(m.role)?'model':'user',parts:[{text:String(m.content??m.text??'')}]})),generationConfig:{temperature,maxOutputTokens:1600}};
   if(schema){body.generationConfig.responseMimeType='application/json';body.generationConfig.responseSchema=safeSchema(schema)}
   if(/gemini-2\.5-flash/.test(selected))body.generationConfig.thinkingConfig={thinkingBudget:0};
   if(tools?.length&&!schema)body.tools=[{functionDeclarations:tools.map(t=>({name:t.name,description:t.description,parameters:safeSchema(t.parameters)}))}];
   try{
    const j=await request(`${base}/models/${encodeURIComponent(selected)}:generateContent`,body,attemptSignal),candidate=j.candidates?.[0],parts=candidate?.content?.parts||[];
    const text=parts.filter(p=>p.text&&!p.thought).map(p=>p.text).join('').trim(),calls=parts.filter(p=>p.functionCall).map(p=>p.functionCall);
    if(!text&&!calls.length)throw Object.assign(new Error('Provider returned no answer: '+(j.promptFeedback?.blockReason||candidate?.finishReason||'empty output')),{status:422});
    let json;if(schema){try{json=JSON.parse(text)}catch{throw Object.assign(new Error('Provider returned invalid JSON'),{status:422})}}
    return {json,text,tool_calls:calls,usage:{input_tokens:j.usageMetadata?.promptTokenCount??null,output_tokens:j.usageMetadata?.candidatesTokenCount??null},model:selected,attempts};
   }catch(e){attempts.push({model:selected,error:e.message});if(!retryable(e))throw Object.assign(e,{attempts})}
  }
  throw Object.assign(new Error('No Gemini model answered within the request budget. Check model availability, key restrictions and quota.'),{attempts});
 }};
}
export default gemini;
