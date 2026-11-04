"""Generate the planning workbook, comparison, source register and decision memo.
Run python3 finance/assistant/build.py [output-directory]. No source or prior outputs overwritten in the repository.
"""
import json,sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill,Alignment
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.chart import BarChart,Reference
from openpyxl.worksheet.datavalidation import DataValidation
from docx import Document
from pptx import Presentation
from pptx.util import Inches,Pt
from model import calculate,OPTIONS
HERE=Path(__file__).resolve().parent
cfg=json.loads((HERE/'planning_inputs.json').read_text());evidence=json.loads((HERE/'evidence.json').read_text());v={k:a['value'] for k,a in cfg['inputs'].items()}
out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/ai-assistant-finance');out.mkdir(parents=True,exist_ok=True)
models={o:calculate(v,o) for o in OPTIONS}
wb=Workbook();inputs=wb.active;inputs.title='Inputs';inputs.append(['Input','Value','Unit','Basis','Description','Source / verification'])
for k,a in cfg['inputs'].items():
 r=inputs.max_row+1;inputs.append([k,a['value'],a['unit'],a['basis'],a['description'],a['source']+' CURRENT QUOTE UNVERIFIED'])
 wb.defined_names['a_'+k]=DefinedName('a_'+k,attr_text=f"'Inputs'!$B${r}");inputs.cell(r,2).font=Font(color='0000FF')
valid=DataValidation(type='decimal',operator='greaterThanOrEqual',formula1=0);valid.errorTitle='Nonnegative value required';valid.error='Use the documented unit and a nonnegative number';valid.showErrorMessage=True;inputs.add_data_validation(valid);valid.add(f'B2:B{inputs.max_row}')
readme=wb.create_sheet('Read me',0)
for row in [['AI knowledge assistant investment model'],['USD, before tax, constant prices, year-end flows; IDR is an assumed reporting conversion only'],[cfg['status']],['Blue cells = inputs; black cells = live formulas. Literature figures are not imported as plant savings.'],['Cash view requires evidenced incremental spend and cash conversion. Capacity/economic NPV is not booked profit.'],['All options are read-only knowledge support, not process control. On-prem GPU is a single-host pilot without HA.'],['Human verification time is subtracted even for unsuccessful attempts; failed queries still consume API tokens.'],['Negative investment case is a valid result. No downtime or rework benefit is assumed without real-case data.'],['Base case uses 50 users, 60% adoption, 85% usable answers; all are illustrative assumptions.'],['Scenario cost multipliers apply to all project costs; benefit changes are explicitly shown.'],['Original primary-source research and current price verification are blocked until domain access is applied.'],['Do not present study outcomes or planning allowances as plant evidence, supplier quotes or guaranteed cost reductions.'],['See finance/assistant/README.md for the case intake, measurement protocol, exclusions and responsibility matrix.']]:readme.append(row)
summary=wb.create_sheet('Comparison');summary.append(['Deployment','Cash NPV USD','Economic NPV USD','Initial cash USD','Annual cash OPEX USD','Annual cash benefit USD','Life-cycle cash TCO USD','IRR','Payback years','BCR','Break-even minutes/day','Monthly vendor price floor USD','NPV IDR'])
metadata={}
for i,option in enumerate(OPTIONS):
 ws=wb.create_sheet(option);ws.append([option+' | USD | before tax | horizon and rate from Inputs']);ws.append(['Metric','Value','Unit / treatment'])
 refs={}
 def add(k,expr,note='USD'):
  r=ws.max_row+1;ws.append([k,'='+expr,note]);refs[k]=f'$B${r}';return refs[k]
 def a(k):return 'a_'+k
 def b(k):return refs[k]
 cloud=int(option=='cloud_api');enterprise=int(option=='enterprise_seat');local=int(option=='onprem_gpu');mult=[1,.5,1.5][i]
 add('requests',f'{a("users")}*{a("days")}*{a("queries")}*{a("adoption")}','requests/year; unsuccessful requests included')
 add('api',f'{cloud}*{b("requests")}*a_retry*(a_input_tokens*a_input_price+a_output_tokens*a_output_price)/1000000')
 add('embedding_initial',f'{1-local}*a_pages*a_page_tokens*a_embedding_price/1000000')
 add('ocr','a_pages*a_ocr')
 add('ingestion_review','a_pages*a_review_minutes/60*a_review_rate')
 add('implementation',f'(a_discovery_hours+a_connector_hours+a_app_hours*{mult}+a_security_hours+a_evaluation_hours+a_training_hours+a_pm_hours)*a_engineer_rate','USD; app effort factor Assumption: cloud 1, enterprise .5, onprem 1.5')
 add('hardware',f'{local}*(a_gpu_qty*a_gpu_price+a_gateway_qty*a_gateway_price+a_firewall_qty*a_firewall_price)+a_tablet_qty*a_tablet_price')
 add('initial_cash',f'(({b("implementation")}+{b("ingestion_review")})*a_implementation_cash+{b("ocr")}+{b("embedding_initial")}+{b("hardware")})*(1+a_contingency)')
 add('initial_economic',f'({b("implementation")}+{b("ingestion_review")}+{b("ocr")}+{b("embedding_initial")}+{b("hardware")})*(1+a_contingency)')
 add('staff','12*(a_support_hours*a_support_rate+a_evaluation_month*a_engineer_rate)')
 add('refresh_review',f'{b("ingestion_review")}*a_refresh')
 add('refresh_fees',f'({b("ocr")}+{b("embedding_initial")})*a_refresh')
 add('power',f'{local}*a_gpu_qty*a_power_kw*a_power_hours*a_electricity')
 add('hardware_support',f'{b("hardware")}*a_hardware_support')
 add('gpu_ops',f'{local}*a_onprem_ops_hours*a_support_rate*12')
 add('seats',f'{enterprise}*a_users*(a_enterprise_seat+a_base_licence*a_incremental_base)*12')
 add('connectors',f'{enterprise}*a_enterprise_connector_month*12')
 add('model_support',f'{local}*a_model_support*12')
 add('fees',f'{b("api")}+{b("refresh_fees")}+12*(a_hosting+a_security_month)+{b("power")}+{b("hardware_support")}+{b("seats")}+{b("connectors")}+{b("model_support")}+a_failure_allowance')
 add('opex_cash',f'{b("fees")}+({b("staff")}+{b("refresh_review")}+{b("gpu_ops")})*a_operations_cash')
 add('opex_economic',f'{b("fees")}+{b("staff")}+{b("refresh_review")}+{b("gpu_ops")}')
 add('search_hours','a_users*a_days*a_adoption/60*(a_minutes*a_usable-a_verification_minutes)','net hours/year; may be negative')
 add('onboard_hours','a_new_hires*a_onboard_hours*a_adoption*a_usable','hours/year; separate population')
 add('capacity_value',f'({b("search_hours")}+{b("onboard_hours")})*a_hourly','USD/year; economic capacity, not booked profit')
 add('search_cash',f'{b("search_hours")}*a_hourly*a_cash_share')
 add('onboard_cash',f'{b("onboard_hours")}*a_hourly*a_onboard_cash')
 add('production','a_incidents*a_hours_avoided*a_contribution*a_attribution*a_demand*a_adoption*a_usable')
 add('rework','a_rework_events*a_rework_cost*a_rework_reduction*a_adoption*a_usable')
 add('cash_benefit',f'{b("search_cash")}+{b("onboard_cash")}+{b("production")}+{b("rework")}')
 add('economic_benefit',f'{b("capacity_value")}+{b("production")}+{b("rework")}')
 add('replacement',f'{local}*a_gpu_qty*a_gpu_price*a_replacement_share')
 add('vendor_monthly_floor',f'{b("opex_economic")}/12/(1-a_vendor_margin)','USD/month; excludes onboarding, CAC, R&D, tax and setup profit')
 add('breakeven_minutes',f'IFERROR(MAX(0,({b("opex_cash")}-{b("onboard_cash")}-{b("production")}-{b("rework")}+a_users*a_days*a_adoption/60*a_verification_minutes*a_hourly*a_cash_share)/(a_users*a_days/60*a_adoption*a_usable*a_hourly*a_cash_share)),"Not defined")','gross minutes/user-day needed for operating break-even, not NPV break-even')
 add('ebit_proxy',f'{b("cash_benefit")}-{b("opex_cash")}-{b("hardware")}/a_depreciation','USD/year during initial depreciation period; not statutory accounts')
 add('peak_requests_second',f'{b("requests")}/a_days/a_active_hours/3600*a_peak_factor','requests/sec; hardware throughput unverified')
 start=ws.max_row+2;ws.cell(start,1,'Year');headers=['Ramp','Cash benefit','Cash cost','Net cash flow','Cumulative','Discounted net','Economic net','Discounted economic net','Replacement','Shutdown']
 for c,label in enumerate(headers,2):ws.cell(start,c,label)
 for t in range(31):
  r=start+1+t;ws.cell(r,1,t);ws.cell(r,2,'=0' if t==0 else '=a_rollout1' if t==1 else '=a_rollout2' if t==2 else '=1')
  ws.cell(r,3,f'=IF(A{r}<=a_horizon,{b("cash_benefit")}*B{r},0)')
  ws.cell(r,10,f'=IF(AND(A{r}=a_replacement_year,A{r}<=a_horizon),{b("replacement")},0)' if t else '=0')
  ws.cell(r,11,f'=IF(A{r}=a_horizon,a_decommission,0)' if t else '=0')
  ws.cell(r,4,f'={b("initial_cash")}' if t==0 else f'=IF(A{r}<=a_horizon,{b("opex_cash")}+J{r}+K{r},0)')
  ws.cell(r,5,f'=C{r}-D{r}');ws.cell(r,6,f'=E{r}' if t==0 else f'=F{r-1}+E{r}');ws.cell(r,7,f'=E{r}/(1+a_discount)^A{r}')
  ws.cell(r,8,f'=-{b("initial_economic")}' if t==0 else f'=IF(A{r}<=a_horizon,{b("economic_benefit")}*B{r}-{b("opex_economic")}-J{r}-K{r},0)')
  ws.cell(r,9,f'=H{r}/(1+a_discount)^A{r}')
 first=start+1;last=start+31;mr=last+2
 metric_formulas={'npv':f'SUM(G{first}:G{last})','economic_npv':f'SUM(I{first}:I{last})','irr':f'IF(OR(E{first}>=0,COUNTIF(E{first+1}:E{last},"<0")>0),"Not defined",IFERROR(IRR(E{first}:E{last}),"Not defined"))','bcr':f'IFERROR(SUMPRODUCT(C{first}:C{last},1/(1+a_discount)^A{first}:A{last})/SUMPRODUCT(D{first}:D{last},1/(1+a_discount)^A{first}:A{last}),"Not defined")','tco':f'SUM(D{first}:D{last})'}
 for k,expr in metric_formulas.items():
  ws.cell(mr,1,k);ws.cell(mr,2,'='+expr);refs[k]=f'$B${mr}';mr+=1
 ramp_pv='('+'+'.join(f'IF({t}<=a_horizon,'+('a_rollout1' if t==1 else 'a_rollout2' if t==2 else '1')+f'/(1+a_discount)^{t},0)' for t in range(1,31))+')'
 extra={'additional_cash_benefit_required':f'MAX(0,-{refs["npv"]})/{ramp_pv}','npv_breakeven_minutes':f'IFERROR(MAX(0,a_minutes-{refs["npv"]}/(a_users*a_days/60*a_adoption*a_usable*a_hourly*a_cash_share*{ramp_pv})),"Not defined")','cost_per_request':f'IFERROR({refs["tco"]}/({refs["requests"]}*a_horizon),"Not defined")'}
 for key,expr in extra.items():
  ws.cell(mr,1,key);ws.cell(mr,2,'='+expr);refs[key]=f'$B${mr}';mr+=1
 # First crossing is provisional if replacement creates a later cumulative deficit; full schedule remains visible.
 for k,col in [('payback','F'),('discounted_payback','L')]:
  if col=='L':
   ws.cell(start,12,'Cumulative discounted net')
   for r in range(first,last+1):ws.cell(r,12,f'=G{r}' if r==first else f'=L{r-1}+G{r}')
  candidates=[]
  for t in range(1,31):
   r=first+t;candidates.append(f'IF(AND({col}{r-1}<0,{col}{r}>=0),{t-1}-{col}{r-1}/({col}{r}-{col}{r-1}),999)')
  minimum='MIN('+','.join(candidates)+')';ws.cell(mr,1,k);ws.cell(mr,2,f'=IF({minimum}=999,"Beyond horizon",{minimum})');refs[k]=f'$B${mr}';mr+=1
 def sheetref(k):return f"'{option}'!{refs[k]}"
 r=summary.max_row+1;summary.append([option,*['='+sheetref(k) for k in ['npv','economic_npv','initial_cash','opex_cash','cash_benefit','tco','irr','payback','bcr','breakeven_minutes','vendor_monthly_floor']],'='+sheetref('npv')+'*a_fx'])
 metadata[option]={k:f'{option}!{ref.replace("$","")}' for k,ref in refs.items()}
 chart=BarChart();chart.title='Annual and cumulative cash flow';chart.add_data(Reference(ws,min_col=5,max_col=6,min_row=start,max_row=last),titles_from_data=True);chart.set_categories(Reference(ws,min_col=1,min_row=first,max_row=last));ws.add_chart(chart,'N3')
# Scenario and sensitivity calculations are separate recalculable worksheets generated from input overrides.
# Full variant input copies ensure cost and adoption interact rather than relying on a percentage of the base NPV.
variants=wb.create_sheet('Scenario results');variants.append(['Deployment','Scenario','Cash NPV USD','Cash benefit USD/year','Annual cash OPEX USD','Assumption note'])
# A live scenario formula uses per-option cash schedules and exact analytical changes to the base levers/costs.
for option in OPTIONS:
 ws=wb[option];ref=lambda k: "'"+option+"'!"+metadata[option][k].split('!')[1]
 for sc in cfg['scenarios']:
  rr=variants.max_row+1;ad=sc['adoption'];us=sc['usable'];tf=sc['time_factor'];cost=sc['cost_factor']
  # Reference the adjustment parameters as editable cells so stress cases can be changed.
  variants.append([option,sc['name'],None,None,None,'Assumption; no study benchmark or probability'])
  for cc,val in [(7,ad),(8,us),(9,tf),(10,cost)]:variants.cell(rr,cc,('=a_adoption' if cc==7 else '=a_usable') if sc['name']=='Base' and cc in (7,8) else val).font=Font(color='0000FF')
  variants.cell(1,7,'Adoption');variants.cell(1,8,'Usable');variants.cell(1,9,'Time factor');variants.cell(1,10,'Cost factor')
  search=f'a_users*a_days*G{rr}/60*(a_minutes*I{rr}*H{rr}-a_verification_minutes)*a_hourly*a_cash_share'
  other=f'(a_new_hires*a_onboard_hours*a_hourly*a_onboard_cash+a_incidents*a_hours_avoided*a_contribution*a_attribution*a_demand+a_rework_events*a_rework_cost*a_rework_reduction)*G{rr}*H{rr}'
  variants.cell(rr,4,'='+search+'+'+other)
  # API spend varies with adoption; all other recurring costs follow the stress cost multiplier.
  apicoeff='a_users*a_days*a_queries*a_retry*(a_input_tokens*a_input_price+a_output_tokens*a_output_price)/1000000' if option=='cloud_api' else '0'
  variants.cell(rr,5,f'=({ref("opex_cash")}-{ref("api")}+({apicoeff})*G{rr})*J{rr}')
  terms=[f'-{ref("initial_cash")}*J{rr}']
  for t in range(1,31):
   ramp='a_rollout1' if t==1 else 'a_rollout2' if t==2 else '1'
   extra=f'IF({t}=a_replacement_year,{ref("replacement")},0)' if option=='onprem_gpu' else '0'
   shutdown=f'IF({t}=a_horizon,a_decommission,0)'
   terms.append(f'IF({t}<=a_horizon,(D{rr}*{ramp}-E{rr}-({extra}+{shutdown})*J{rr})/(1+a_discount)^{t},0)')
  variants.cell(rr,3,'='+'+'.join(terms))
sensitivity=wb.create_sheet('Sensitivity');sensitivity.append(['Deployment','Input','Factor','Cash NPV USD','Basis'])
for option in OPTIONS:
 ref=lambda k: "'"+option+"'!"+metadata[option][k].split('!')[1]
 ramp_pv='('+'+'.join((('a_rollout1' if t==1 else 'a_rollout2' if t==2 else '1')+f'/(1+a_discount)^{t}') for t in range(1,31))+')'
 # Gate beyond-horizon terms dynamically.
 ramp_pv='('+'+'.join(f'IF({t}<=a_horizon,'+('a_rollout1' if t==1 else 'a_rollout2' if t==2 else '1')+f'/(1+a_discount)^{t},0)' for t in range(1,31))+')'
 cost_pv='('+'+'.join(f'IF({t}<=a_horizon,1/(1+a_discount)^{t},0)' for t in range(1,31))+')'
 for key in ['minutes','cash_share','adoption','implementation','opex_cash']:
  for factor in [.8,1.2]:
   rr=sensitivity.max_row+1;sensitivity.append([option,key,factor,None,'Assumption: one-at-a-time +/-20%, not an empirical confidence interval']);sensitivity.cell(rr,3).font=Font(color='0000FF')
   delta=f'(C{rr}-1)'
   if key=='minutes':expr=f'{ref("npv")}+a_users*a_days*a_adoption/60*a_minutes*a_usable*a_hourly*a_cash_share*{delta}*{ramp_pv}'
   elif key=='cash_share':expr=f'{ref("npv")}+{ref("search_cash")}*{delta}*{ramp_pv}'
   elif key=='adoption':expr=f'{ref("npv")}+{ref("cash_benefit")}*{delta}*{ramp_pv}-{ref("api")}*{delta}*{cost_pv}'
   elif key=='implementation':expr=f'{ref("npv")}-{ref("implementation")}*a_implementation_cash*(1+a_contingency)*{delta}'
   else:expr=f'{ref("npv")}-{ref("opex_cash")}*{delta}*{cost_pv}'
   sensitivity.cell(rr,4,'='+expr)
sources=wb.create_sheet('Evidence and prices');sources.append(['ID','Evidence type','Source','Finding / pricing scope','Transfer limitation','Verification status'])
for e in evidence['studies']:sources.append([e['id'],e['type'],e['url'],e['reported_finding'],e['caution'],e['verification']])
for e in evidence['pricing_sources_to_verify']:sources.append([e['id'],'Pricing lead',e['url'],e['items'],'Do not label as a current quote',e['status']])
for e in evidence['industrial_case_leads']:sources.append([e['organisation'],'Industrial deployment lead',e['primary_source_domain'],e['application'],e['what_it_cannot_support'],e['verification']])
for ws in wb:
 ws.freeze_panes='B2'
 for col in 'ABCDEFGHIJKLMN':ws.column_dimensions[col].width=23
 ws.column_dimensions['A'].width=37
 if ws.title in ['Inputs','Evidence and prices']:
  for col in 'CDEF':ws.column_dimensions[col].width=48
 if ws.title=='Read me':ws.column_dimensions['A'].width=130
 for row in ws:
  for c in row:
   c.alignment=Alignment(vertical='top',wrap_text=True)
   if c.data_type=='f':c.font=Font(color='000000');c.number_format='#,##0.00;[Red](#,##0.00)'
   if c.row==1:c.font=Font(color='FFFFFF',bold=True);c.fill=PatternFill('solid',fgColor='0B2A4A')
wb.save(out/'AI_Assistant_Investment_Model.xlsx')
(out/'results.json').write_text(json.dumps({'status':cfg['status'],'models':models,'scenarios':{o:{s['name']:calculate(v,o,s) for s in cfg['scenarios']} for o in OPTIONS},'cells':metadata},indent=2)+'\n')
# A plain-language decision memo and slides use the same calculated model values.
fmt=lambda x:'Not reached / not defined' if x is None else f'{x:,.2f}'
sections=[('Decision status',[cfg['status'],'Do not claim a guaranteed saving. Cash value, capacity value and production contribution are separate. Zero production/rework benefit is assumed until the real case supplies evidence.']),('Deployment and cost comparison',[f"{o}: initial cash USD {m['initial_cash']:,.0f}; annual cash OPEX USD {m['opex_cash']:,.0f}; full annual economic OPEX USD {m['opex_economic']:,.0f}; {int(v['horizon'])}-year cash TCO USD {m['tco']:,.0f}; cash NPV USD {m['npv']:,.0f}; economic NPV USD {m['economic_npv']:,.0f}." for o,m in models.items()]),('Hardware and software allowances',['All are assumptions pending written quotes: GPU host USD 10,000; read-only gateway USD 1,500; segmentation appliance USD 2,000. Cloud/enterprise reuse existing clients and buy no GPU in this scope. Hazardous-area device certification is not included in the generic tablet allowance.',f"API budget: USD {v['input_price']}/million input tokens and USD {v['output_price']}/million output tokens; {int(v['input_tokens']):,} input and {int(v['output_tokens']):,} output tokens/call, {v['retry']} calls/request. Cloud annual model spend USD {models['cloud_api']['api']:,.2f} at assumed adoption. This is not current provider pricing.",f"Enterprise budget: USD {v['enterprise_seat']}/user/month plus incremental eligible base licences, connectors and capacity. Existing base licences are assumed available, not verified. On-prem licensing/support and power are separately costed.",'Use the live option worksheets for each labour and infrastructure line; input units, bases and sources are in Inputs.']),('How profit is created',[f"Routine search creates {models['cloud_api']['search_hours']:,.0f} net hours/year after source verification. Capacity value is USD {models['cloud_api']['capacity_value']:,.0f}/year; only the stated cash conversion share is claimed as cash benefit.",'Replace overtime, external invoices or an approved hire; ordinary salaried time released is capacity. Additional production must be sold and valued at contribution margin, not revenue. Exclude overlapping asset downtime and double-counted labour.','Benefit owner and finance approval are required for every cash claim. Supplier service margin and the customer investment return are different models.']),('Returns, break-even and stress cases',[f"{o}: IRR {str(round(m['irr']*100,2))+'%' if m['irr'] is not None else 'not defined'}; simple payback {fmt(m['payback'])} years; discounted payback {fmt(m['discounted_payback'])} years; BCR {fmt(m['bcr'])}; operating break-even gross search minutes/user-day {fmt(m['breakeven_minutes'])}; NPV break-even minutes {fmt(m['npv_breakeven_minutes'])}; extra steady annual cash benefit needed USD {fmt(m['additional_cash_benefit_required'])}." for o,m in models.items()]+['Negative NPV is a valid planning result. Downside/base/upside assumptions are in Scenario results; they are not empirical confidence bounds. Replacements can reverse an early payback crossing; inspect the complete cash schedule.']),('Research and transfer limits',[e['title']+': '+e['reported_finding']+' '+e['caution']+' Source: '+e['url']+' Verification: '+e['verification'] for e in evidence['studies']]+['Industrial lead: Siemens/Schaeffler Industrial Copilot. No quantified plant cost saving is asserted without a retrieved primary case source.']),('Real-case intake and investment gate',['Collect actual eligible user counts, time observations, page counts, document access rules, measured usable-answer rate, token usage, latency/concurrency and supplier quotations.','Attach production-critical-path incident records, saleable demand and variable contribution margin before enabling downtime benefits. Identify the invoices or payroll budget actions that realise time savings.','Run a matched or phased pilot and measure net task time including failed answers and source verification. Reconcile savings with finance. Mandatory safety and competence activities remain.','Stop or narrow scope if access/safety checks fail, quality is below the agreed task threshold, or cash NPV remains negative under approved assumptions. See the committed README for the full intake checklist.'])]
doc=Document();doc.sections[0].header.paragraphs[0].text=f"AI assistant | USD | {int(v['horizon'])} years | discount {v['discount']:.0%} | illustrative"
for i,(title,lines) in enumerate(sections):
 if i:doc.add_page_break()
 doc.add_heading(title,0)
 for line in lines:
  r=doc.add_paragraph().add_run(line);r.bold=title in ['Deployment and cost comparison','Returns, break-even and stress cases']
doc.save(out/'AI_Assistant_Decision_Memo.docx')
prs=Presentation();prs.slide_width=Inches(13.333);prs.slide_height=Inches(7.5)
for title,lines in sections:
 for offset in range(0,len(lines),1 if title=='Research and transfer limits' else 2):
  slide=prs.slides.add_slide(prs.slide_layouts[1]);slide.shapes.title.text=title
  tf=slide.placeholders[1].text_frame;tf.clear()
  for j,line in enumerate(lines[offset:offset+(1 if title=='Research and transfer limits' else 2)]):
   para=tf.paragraphs[0] if j==0 else tf.add_paragraph();para.text=line;para.font.size=Pt(15 if title=='Research and transfer limits' else 17)
  box=slide.shapes.add_textbox(Inches(.3),Inches(7.05),Inches(12.7),Inches(.3));box.text_frame.text=f'USD | {int(v["horizon"])} years | discount {v["discount"]:.0%} | illustrative, current quotes unverified'
prs.save(out/'AI_Assistant_Investment_Slides.pptx')
for option,m in models.items():print(option,'initial cash',round(m['initial_cash'],2),'annual cash opex',round(m['opex_cash'],2),'cash benefit',round(m['cash_benefit'],2),'cash NPV',round(m['npv'],2))
print('Generated',out)
