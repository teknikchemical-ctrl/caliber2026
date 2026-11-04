"""Independent business-rule and arithmetic checks, plus actual workbook recalculation checks."""
import json,math,sys
from pathlib import Path
from openpyxl import load_workbook
from model import calculate,OPTIONS,validate
HERE=Path(__file__).resolve().parent
cfg=json.loads((HERE/'planning_inputs.json').read_text());v={k:a['value'] for k,a in cfg['inputs'].items()}
def close(a,b):assert math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-5),(a,b)
m=calculate(v,'cloud_api')
close(m['requests'],50*220*10*.6)
close(m['api'],66000*1.1*(8000*.4+1000*1.6)/1e6)
net_hours=50*220*.6*(10*.85-2)/60
close(m['search_hours'],net_hours);close(m['search_cash'],net_hours*40*.3)
assert m['npv']<0 and m['economic_npv']>m['npv']
no_cash=calculate({**v,'cash_share':0,'onboard_cash':0},'cloud_api');assert no_cash['cash_benefit']==0 and no_cash['capacity_value']>0
zero=calculate({**v,'adoption':0},'cloud_api');assert zero['requests']==0 and zero['api']==0 and zero['cash_benefit']==0 and zero['npv']<0
harm=calculate({**v,'verification_minutes':30},'cloud_api');assert harm['search_hours']<0
prod=calculate({**v,'adoption':1,'usable':1,'incidents':10,'hours_avoided':1,'contribution':1000,'attribution':.5,'demand':.8},'cloud_api');close(prod['production'],4000)
all_cash=calculate({**v,'cash_share':1,'onboard_cash':1,'implementation_cash':1,'operations_cash':1},'cloud_api');close(all_cash['npv'],all_cash['economic_npv'])
local=calculate(v,'onprem_gpu');assert local['api']==0 and local['hardware']==13500
two=calculate({**v,'gpu_qty':2},'onprem_gpu');close(two['opex_cash']-local['opex_cash'],v['gpu_price']*v['hardware_support']+v['power_kw']*v['power_hours']*v['electricity'])
higher=calculate({**v,'input_price':v['input_price']*2,'output_price':v['output_price']*2},'cloud_api');close(higher['api'],m['api']*2);assert higher['opex_cash']<m['opex_cash']*2
threshold=calculate({**v,'minutes':m['npv_breakeven_minutes']},'cloud_api');close(threshold['npv'],0)
for bad in [{'usable':1.1},{'hourly':0},{'horizon':5.5},{'horizon':31},{'adoption':-1},{'input_price':float('nan')},{'vendor_margin':1}]:
 try:validate({**v,**bad})
 except ValueError:pass
 else:raise AssertionError(bad)
print('Business-rule and independent calculation checks passed')
if len(sys.argv)>1:
 out=Path(sys.argv[1]);r=json.loads((out/'results.json').read_text());w=load_workbook(out/'recalculated/AI_Assistant_Investment_Model.xlsx',data_only=True)
 for sheet in w:
  for row in sheet:
   for c in row:assert c.data_type!='e',(sheet.title,c.coordinate,c.value)
 v={row[0].value:row[1].value for row in w['Inputs'].iter_rows(min_row=2) if row[0].value in cfg['inputs']}
 count=0
 for option in OPTIONS:
  expected=calculate(v,option)
  for key,ref in r['cells'][option].items():
   if key not in expected:continue
   sheet,cell=ref.split('!');actual=w[sheet][cell].value
   if expected[key] is None:assert actual in ['Not defined','Beyond horizon'],(key,actual)
   else:close(actual,expected[key])
   count+=1
 rr=2
 for option in OPTIONS:
  for sc in cfg['scenarios']:
   expected=calculate(v,option,{**sc,'adoption':v['adoption'],'usable':v['usable']} if sc['name']=='Base' else sc)
   for col,key in [(3,'npv'),(4,'cash_benefit'),(5,'opex_cash')]:close(w['Scenario results'].cell(rr,col).value,expected[key]);count+=1
   rr+=1
 rr=2
 for option in OPTIONS:
  base=calculate(v,option)
  for key in ['minutes','cash_share','adoption','implementation','opex_cash']:
   for factor in [.8,1.2]:
    if key in ['minutes','cash_share','adoption']:expected=calculate({**v,key:v[key]*factor},option)['npv']
    elif key=='implementation':expected=base['npv']-base['implementation']*v['implementation_cash']*(1+v['contingency'])*(factor-1)
    else:expected=base['npv']-sum(base['opex_cash']*(factor-1)/(1+v['discount'])**t for t in range(1,int(v['horizon'])+1))
    close(w['Sensitivity'].cell(rr,4).value,expected);count+=1;rr+=1
 print(count,'recalculated workbook outputs match the independent model, including 9 scenarios and 30 sensitivities')
