"""Build case-specific live-formula workbook, Word report and financial slides.
Usage: python3 finance/build_case.py mock-cdu /tmp/finance-mock-cdu
No legacy plant inputs are imported. Output lives outside the checkout by default.
"""
import json,sys,subprocess
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill
from openpyxl.chart import LineChart,Reference
from docx import Document
from pptx import Presentation
from pptx.util import Inches,Pt
root=Path(__file__).resolve().parents[1]
case=sys.argv[1] if len(sys.argv)>1 else 'mock-cdu'
out=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/finance-'+case);out.mkdir(parents=True,exist_ok=True)
f=json.loads((root/'cases'/case/'fin.json').read_text());rows=json.loads((root/'cases'/case/'mh.json').read_text())
# Independent Python calculation is checked against the JavaScript used by the page.
v={k:a['value'] for k,a in f['inputs'].items()}
if any(x is None for x in v.values()): raise SystemExit('Supply all required case inputs before generating financial deliverables')
maintenance=sum(r.get('tc') or 0 for r in rows);downtime=sum(r.get('dt') or 0 for r in rows)
inv=(v['oneOff']+v['perUnit']*v['units'])*(1+v['contingency'])
benefits=[maintenance/v['historyYears']*v['avoidMaintenance'],downtime/v['historyYears']*v['downtimeValue']*v['avoidDowntime'],v['otherBenefit']]
annual=sum(benefits)-v['annualRunning'];npv=-inv+sum(annual/(1+v['discount'])**t for t in range(1,v['horizon']+1))
js="const f=require('./cases/"+case+"/fin.json'),r=require('./cases/"+case+"/mh.json'),m=require('./src/modules/fin.js');console.log(JSON.stringify(m.finModel(m.finRecords(r),Object.fromEntries(Object.entries(f.inputs).map(([k,a])=>[k,a.value])))))"
model=json.loads(subprocess.check_output(['node','-e',js],cwd=root,text=True));assert abs(model['npv']-npv)<1e-6
wb=Workbook();ws=wb.active;ws.title='Inputs';ws.append(['Input','Value','Unit','Basis','Source'])
idx={}
for k,a in f['inputs'].items():
 idx[k]=ws.max_row+1;ws.append([k,a['value'],a['unit'],a['basis'],a['source']]);ws.cell(idx[k],2).font=Font(color='0000FF')
ws.append(['Status',f['status']]);ws.append(['Currency',f['currency']]);ws.append(['Timing','Constant prices; before tax; t=0 investment; year-end flows; no terminal value'])
def ref(k):return f"Inputs!$B${idx[k]}"
h=wb.create_sheet('History');h.append(['Work order','Equipment','Month','Total cost','Labour','Materials','Asset downtime h','Basis'])
for r in rows:h.append([r.get('wo'),r.get('tag'),str(r.get('rd',''))[:7],r.get('tc'),r.get('lc'),r.get('mc'),r.get('dt'),'Case data: mh.json; '+str(r.get('rem',''))])
n=len(rows)+1
c=wb.create_sheet('Cash flow');c.append([f"{case} | {f['currency']} | {v['horizon']} years | discount {v['discount']:.1%}"])
c.append(['Annual lever','Value']);c.append(['Maintenance avoidance',f'=SUM(History!D2:D{n})/{ref("historyYears")}*{ref("avoidMaintenance")}'])
c.append(['Downtime avoidance',f'=SUM(History!G2:G{n})/{ref("historyYears")}*{ref("downtimeValue")}*{ref("avoidDowntime")}'])
c.append(['Other benefit',f'={ref("otherBenefit")}']);c.append(['Total annual benefit','=SUM(B3:B5)'])
c.append(['Investment',f'=({ref("oneOff")}+{ref("perUnit")}*{ref("units")})*(1+{ref("contingency")})'])
c.append(['Year','Benefit','Cost','Net cash flow','Cumulative','Discounted net'])
for t in range(v['horizon']+1):
 r=9+t;c.append([t,'=0' if t==0 else '=$B$6','=$B$7' if t==0 else '='+ref('annualRunning'),f'=B{r}-C{r}',f'=D{r}' if t==0 else f'=E{r-1}+D{r}',f'=D{r}/(1+{ref("discount")})^A{r}'])
last=9+v['horizon'];metrics=last+2
c.cell(metrics,1,'NPV');c.cell(metrics,2,f'=SUM(F9:F{last})')
c.cell(metrics+1,1,'IRR');c.cell(metrics+1,2,f'=IFERROR(IRR(D9:D{last}),"Not defined")')
c.cell(metrics+2,1,'Simple payback years');c.cell(metrics+2,2,f'=IF(B7=0,0,IF(B6-{ref("annualRunning")}<=0,"Beyond horizon",IF(B7/(B6-{ref("annualRunning")} )>{ref("horizon")},"Beyond horizon",B7/(B6-{ref("annualRunning")}))))')
c.cell(metrics+3,1,'Benefit-cost ratio');c.cell(metrics+3,2,f'=IFERROR((B6*SUMPRODUCT(1/(1+{ref("discount")})^A10:A{last}))/(B7+{ref("annualRunning")}*SUMPRODUCT(1/(1+{ref("discount")})^A10:A{last})),"Not defined")')
chart=LineChart();chart.title='Annual and cumulative cash flow';chart.add_data(Reference(c,min_col=4,max_col=5,min_row=8,max_row=last),titles_from_data=True);chart.set_categories(Reference(c,min_col=1,min_row=9,max_row=last));c.add_chart(chart,'H3')
s=wb.create_sheet('Scenarios');s.append([c.cell(1,1).value]);s.append(['Scenario','Benefit factor','Cost factor','NPV','Basis','Source'])
for a in f['scenarios']:
 r=s.max_row+1;s.append([a['name'],a['benefit'],a['cost'],f"=-'Cash flow'!B7*C{r}+('Cash flow'!B6*B{r}-{ref('annualRunning')}*C{r})*SUMPRODUCT(1/(1+{ref('discount')})^'Cash flow'!A10:A{last})",a['basis'],a['source']]);s.cell(r,2).font=Font(color='0000FF');s.cell(r,3).font=Font(color='0000FF')
sens=wb.create_sheet('Sensitivity');sens.append([c.cell(1,1).value]);sens.append(['Input','Factor','NPV','Basis'])
for key in ['downtimeValue','avoidMaintenance','annualRunning']:
 for factor in [.8,1,1.2]:
  r=sens.max_row+1;delta=f"('Cash flow'!B4*(B{r}-1))" if key=='downtimeValue' else f"('Cash flow'!B3*(B{r}-1))" if key=='avoidMaintenance' else f"(-{ref('annualRunning')}*(B{r}-1))"
  sens.append([key,factor,f"='Cash flow'!B{metrics}+{delta}*SUMPRODUCT(1/(1+{ref('discount')})^'Cash flow'!A10:A{last})",'Assumption: one-at-a-time +/-20%']);sens.cell(r,2).font=Font(color='0000FF')
for sheet in wb:
 sheet.freeze_panes='B2'
 for col,width in [('A',33),('B',25),('C',25),('D',30),('E',42),('F',55),('G',25),('H',25)]:sheet.column_dimensions[col].width=width
 for row in sheet:
  for cell in row:
   if cell.data_type=='f':cell.font=Font(color='000000')
   if cell.row==1:cell.fill=PatternFill('solid',fgColor='0B2A4A');cell.font=Font(color='FFFFFF',bold=True)
wb.save(out/'Financial_Model.xlsx')
summary=f"{case} | {f['currency']} | {v['horizon']} years | discount rate {v['discount']:.1%}"
amount=lambda x:f"{x:,.0f} {f['currency']}"
sections=[('Basis and scope',[f['status'],summary,'Case maintenance history is the source of cost and downtime totals. Downtime is asset-hours, not plant outage duration.']),('Financial result',[f'NPV: {amount(npv)}',f'Year-zero investment: {amount(inv)}',f'Annual benefit: {amount(sum(benefits))}; annual running cost: {amount(v["annualRunning"])}','Before tax; constant prices; no terminal value; all annual flows at year end.']),('Inputs and sources',[f"{k}: {a['value']} {a['unit']}. {a['basis']}: {a['source']}" for k,a in f['inputs'].items()]),('Risk and decision limits',['Predictive health categories are rankings, not probabilities. No expected loss is monetised without sourced annual probabilities and consequences.','Maintenance avoidance and downtime avoidance are separate levers. Confirm contribution loss and overlapping downtime before an investment decision.','Three scenarios and one-at-a-time sensitivity are in the workbook. All demonstration figures must be replaced for the real case.'])]
sections.insert(2,('Returns and scenarios',[
 f"IRR: {model['irr']:.2%}" if model['irr'] is not None else 'IRR: not defined',
 f"Simple payback: {model['payback']:.2f} years" if model['payback'] is not None else 'Simple payback: beyond horizon',
 f"Benefit-cost ratio: {model['bcr']:.2f}" if model['bcr'] is not None else 'Benefit-cost ratio: not defined',
 *[f"{a['name']}: NPV {amount(-inv*a['cost']+sum((sum(benefits)*a['benefit']-v['annualRunning']*a['cost'])/(1+v['discount'])**t for t in range(1,v['horizon']+1)))}. {a['basis']}: {a['source']}" for a in f['scenarios']]
]))
sensitivity_lines=[]
for key in ['downtimeValue','avoidMaintenance','annualRunning']:
 vals=[]
 for factor in [.8,1,1.2]:
  delta=(benefits[1] if key=='downtimeValue' else benefits[0] if key=='avoidMaintenance' else -v['annualRunning'])*(factor-1)
  vals.append(amount(npv+sum(delta/(1+v['discount'])**t for t in range(1,v['horizon']+1))))
 sensitivity_lines.append(key+': NPV at -20%, base, +20% = '+', '.join(vals))
sections.insert(3,('Benefit levers and sensitivity',[
 f'Maintenance avoidance: {amount(benefits[0])} per year',f'Downtime avoidance: {amount(benefits[1])} per year',f'Other benefit: {amount(benefits[2])} per year',*sensitivity_lines,
 'Sensitivity basis: Assumption, one input varied at a time; all other inputs unchanged.'
]))
sections.insert(4,('Cash flow and sensitivity',[
 *[f"Year {a['year']}: benefit {amount(a['benefit'])}; cost {amount(a['cost'])}; net {amount(a['net'])}; cumulative {amount(a['cumulative'])}" for a in model['cash']],
 'Sensitivity assumptions: vary downtime value, maintenance avoidance and annual running cost separately by -20% and +20%. Live formulas are in the workbook.'
]))
doc=Document()
doc.sections[0].header.paragraphs[0].text=summary
for i,(title,lines) in enumerate(sections):
 if i:doc.add_page_break()
 doc.add_heading(title,0);doc.add_paragraph(summary)
 for line in lines:
  para=doc.add_paragraph();run=para.add_run(line);run.bold=line.startswith(('NPV:','Year-zero','Annual benefit:'))
doc.save(out/'Financial_Report.docx')
prs=Presentation();prs.slide_width=Inches(13.333);prs.slide_height=Inches(7.5)
slide_sections=[]
for title,lines in sections:
 for i in range(0,len(lines),4):slide_sections.append((title+(f' ({i//4+1})' if len(lines)>4 else ''),lines[i:i+4]))
for title,lines in slide_sections:
 slide=prs.slides.add_slide(prs.slide_layouts[1]);slide.shapes.title.text=title
 tf=slide.placeholders[1].text_frame;tf.clear()
 for i,line in enumerate(lines[:6]):
  para=tf.paragraphs[0] if i==0 else tf.add_paragraph();para.text=line;para.font.size=Pt(16 if title.startswith('Inputs and sources') else 20)
 box=slide.shapes.add_textbox(Inches(.4),Inches(6.9),Inches(12.5),Inches(.4));box.text_frame.text=summary
prs.save(out/'Financial_Slides.pptx')
(out/'reconciliation.json').write_text(json.dumps(dict(case=case,npv_python=npv,npv_page=model['npv'],workbook_npv_cell=f'Cash flow!B{metrics}',workbook_irr_cell=f'Cash flow!B{metrics+1}',workbook_payback_cell=f'Cash flow!B{metrics+2}',workbook_bcr_cell=f'Cash flow!B{metrics+3}',model=model),indent=2)+'\n')
print('Generated',out,'; independent Python and page NPV:',amount(npv))
