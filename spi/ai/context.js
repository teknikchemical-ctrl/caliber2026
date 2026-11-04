// Conversation context is a selector for read-only tools, never an instruction or SQL.
const invalid=message=>Object.assign(new Error(message),{status:400});
export function resolveContext(question,history=[],context={}){
 if(!context||typeof context!=='object'||Array.isArray(context))throw invalid('Context must be an object');for(const key of Object.keys(context))if(!['material_no','funcloc','page'].includes(key))throw invalid('Unknown context field: '+key);
 if(context.material_no!=null&&(!Number.isSafeInteger(context.material_no)||context.material_no<=0))throw invalid('Context material number must be a positive integer');for(const key of ['funcloc','page'])if(context[key]!=null&&(typeof context[key]!=='string'||context[key].length>160))throw invalid('Context '+key+' must be at most 160 characters');
 const explicit=Number((question.match(/\b\d{10}\b/)||[])[0]);if(explicit)return {material_no:explicit,source:'question'};
 const tag=(question.toUpperCase().match(/\b(?:[A-Z]{2}_)?[A-Z]{1,5}-\d+[A-Z]?\b/)||[])[0];if(tag)return {funcloc:tag,source:'question'};
 const refers=/\b(it|its|this|that|same|part|material|history|historical|trend|forecast|prediction|predict|next year|next month|last month|lead time|reorder|stock|why|explain|reason)\b/i.test(question);
 if(!refers)return context.funcloc?{funcloc:context.funcloc,source:'page'}:{};
 const portfolioQuestion=/\b(?:which|what)\b.*\b(?:parts|materials|spares)\b|largest excess stock|top reorder|what should we reorder/i.test(question);
 if(portfolioQuestion)return context.funcloc?{funcloc:context.funcloc,source:'page'}:{};
 if(context.material_no&&(!context.page||['spi_forecast','spi_calc','spi_fo','spi_ask','ai','spi_h_fc','spi_f_part','spi_f_par','spi_f_dec'].includes(context.page)))return {...context,source:'page'};
 if(context.funcloc)return {funcloc:context.funcloc,source:'page'};
 for(const h of (Array.isArray(history)?history:[]).slice(-6).reverse()){if(h?.role!=='user')continue;const text=String(h.text||h.content||'').slice(0,2000),id=Number((text.match(/\b\d{10}\b/)||[])[0]);if(id)return {material_no:id,source:'conversation'};const loc=(text.toUpperCase().match(/\b(?:[A-Z]{2}_)?[A-Z]{1,5}-\d+[A-Z]?\b/)||[])[0];if(loc)return {funcloc:loc,source:'conversation'}}
 return context.funcloc?{funcloc:context.funcloc,source:'page'}:{};
}
