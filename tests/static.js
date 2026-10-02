/* Static checks on the sources: catches the class of bug where two components use the same CSS class name and restyle each other.
   A class selector that is defined on its own (".name{...}") in more than one place with different layout properties is reported. */
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const files=[path.join(root,"src","base.html"),...fs.readdirSync(path.join(root,"src","modules")).filter(f=>f.endsWith(".css")).map(f=>path.join(root,"src","modules",f))];
const LAYOUT=/^(width|height|min-width|min-height|max-width|display|position|flex|flex-direction|grid-template-columns|padding|margin|border-radius|overflow)$/;
const defs={};
for(const f of files){let t=fs.readFileSync(f,"utf8");if(f.endsWith(".html"))t=t.split("\n").filter(l=>l.length<20000).join("\n");
 t=t.replace(/\/\*[\s\S]*?\*\//g,"");
 /* top level and media rules are handled alike; only plain ".name{...}" selectors are compared */
 for(const m of t.matchAll(/(?:^|[}\s;])\.([a-zA-Z_][\w-]*)\s*\{([^{}]*)\}/g)){const decl={};m[2].split(";").forEach(d=>{const i=d.indexOf(":");if(i>0){const k=d.slice(0,i).trim().toLowerCase();if(LAYOUT.test(k))decl[k]=d.slice(i+1).trim()}});if(Object.keys(decl).length)(defs[m[1]]=defs[m[1]]||[]).push({file:path.basename(f),decl})}}
/* known, reviewed duplicates: the same class is used for the same purpose in the older and newer styles */
const ALLOW=new Set(["card","tag","muted","nav","brand","sub","tab","msg","b","eq","gl","lv","fl","bl","bn","pl","pdn","ots","otsh","otsb","ttl","stamp","seg","hbar","modal","nzb","aim","bl","pz"]);
let bad=0;
for(const [name,list] of Object.entries(defs)){if(ALLOW.has(name)||list.length<2)continue;const files2=new Set(list.map(x=>x.file));if(files2.size<2)continue;
 const sig=x=>JSON.stringify(Object.entries(x.decl).sort());const diff=new Set(list.map(sig)).size>1;
 if(diff){bad++;console.log("DUPLICATE CLASS",name,"defined with different layout in",[...files2].join(", "))}}
/* JavaScript: top level function declared twice in different modules */
const js=fs.readdirSync(path.join(root,"src","modules")).filter(f=>f.endsWith(".js"));const fn={};
for(const f of js){const t=fs.readFileSync(path.join(root,"src","modules",f),"utf8");for(const m of t.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm))(fn[m[1]]=fn[m[1]]||new Set()).add(f)}
const FNALLOW=new Set(["render","go","aiRoute","aiLog","mhSaveGen"]);
for(const [n,s] of Object.entries(fn)){if(s.size>1&&!FNALLOW.has(n)){bad++;console.log("FUNCTION DECLARED IN SEVERAL MODULES",n,[...s].join(", "))}}
console.log(bad?"\n"+bad+" problem(s)":"static checks passed");process.exit(bad?1:0);
