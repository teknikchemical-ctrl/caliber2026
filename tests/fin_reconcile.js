// Check actual formula results after LibreOffice recalculation, not formula text or a zero-test run.
const assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=process.argv[2]||'/tmp/finance-mock-cdu';
const read=cp.execFileSync('python3',['-c',`
from openpyxl import load_workbook
from pathlib import Path
import json,sys
p=Path(sys.argv[1]);r=json.loads((p/'reconciliation.json').read_text());w=load_workbook(p/'recalculated/Financial_Model.xlsx',data_only=True)
for s in w:
 for row in s:
  for c in row:
   assert c.data_type!='e',(s.title,c.coordinate,c.value)
values={}
for k in ['npv','irr','payback','bcr']:
 sheet,cell=r['workbook_'+k+'_cell'].split('!');values[k]=w[sheet][cell].value
values['scenarios']=[w['Scenarios'].cell(i,4).value for i in range(3,6)]
values['sensitivity']=[w['Sensitivity'].cell(i,3).value for i in range(3,12)]
print(json.dumps({'values':values,'case':r['case']}))
`,dir],{encoding:'utf8'});
const data=JSON.parse(read),f=require(path.join(root,'cases',data.case,'fin.json')),r=require(path.join(root,'cases',data.case,'mh.json'));
const {finRecords,finModel}=require('../src/modules/fin.js'),records=finRecords(r),v=Object.fromEntries(Object.entries(f.inputs).map(([k,a])=>[k,a.value])),m=finModel(records,v);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
for(const k of ['npv','irr','payback','bcr'])close(data.values[k],m[k]);
f.scenarios.forEach((s,i)=>close(data.values.scenarios[i],finModel(records,v,s).npv));
let i=0;for(const key of ['downtimeValue','avoidMaintenance','annualRunning'])for(const factor of [.8,1,1.2])close(data.values.sensitivity[i++],finModel(records,{...v,[key]:v[key]*factor}).npv);
console.log('16 recalculated workbook results match page calculations: NPV, IRR, payback, BCR, scenarios and sensitivity');
