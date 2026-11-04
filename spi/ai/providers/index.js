import {mock} from './mock.js';
import {gemini} from './gemini.js';
export function provider(options={}){const name=options.name||process.env.AI_PROVIDER||'mock';if(name==='mock')return mock();if(name==='gemini')return gemini(options);throw new Error('Unsupported AI_PROVIDER; use mock or gemini')}
