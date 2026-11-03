"""Transparent, case-independent assistant investment model; all monetary values USD."""
import math
OPTIONS=('cloud_api','enterprise_seat','onprem_gpu')
def validate(v):
 for k,x in v.items():
  if isinstance(x,bool) or not isinstance(x,(float,int)) or not math.isfinite(x) or x<0:raise ValueError('Nonnegative finite input required: '+k)
 for k in ('horizon','users','gpu_qty','gateway_qty','firewall_qty','tablet_qty','replacement_year'):
  if int(v[k])!=v[k]:raise ValueError('Integer required: '+k)
 for k in ('adoption','usable','cash_share','onboard_cash','attribution','demand','rework_reduction','refresh','contingency','incremental_base','hardware_support','replacement_share','rollout1','rollout2','vendor_margin','implementation_cash','operations_cash'):
  if v[k]>1:raise ValueError('Fraction above 1: '+k)
 for k in ('horizon','users','days','hourly','fx','active_hours','depreciation'):
  if v[k]<=0:raise ValueError('Positive required: '+k)
 if v['horizon']>30:raise ValueError('Horizon above 30 years')
 if v['vendor_margin']>=1:raise ValueError('Vendor margin must be below 1')
def irr(cf):
 if cf[0]>=0 or not any(x>0 for x in cf[1:]) or any(x<0 for x in cf[1:]):return None
 lo=-.9999;hi=1
 def npv(r):return sum(x/(1+r)**t for t,x in enumerate(cf))
 while npv(hi)>0 and hi<1e9:hi*=2
 if npv(hi)>0:return None
 for _ in range(160):
  mid=(lo+hi)/2
  if npv(mid)>0:lo=mid
  else:hi=mid
 return (lo+hi)/2

def calculate(v,option,scenario=None):
 validate(v)
 if option not in OPTIONS:raise ValueError('Unknown deployment')
 s=scenario or {};ad=s.get('adoption',v['adoption']);usable=s.get('usable',v['usable']);tf=s.get('time_factor',1);cf=s.get('cost_factor',1)
 if not 0<=ad<=1 or not 0<=usable<=1 or tf<0 or cf<0:raise ValueError('Invalid scenario')
 # Coefficients express explicit planning scope, not vendor performance evidence.
 multiplier={'cloud_api':1,'enterprise_seat':.5,'onprem_gpu':1.5}[option]
 requests=v['users']*v['days']*v['queries']*ad
 api=requests*v['retry']*(v['input_tokens']*v['input_price']+v['output_tokens']*v['output_price'])/1e6 if option=='cloud_api' else 0
 embed=v['pages']*v['page_tokens']*v['embedding_price']/1e6 if option!='onprem_gpu' else 0
 ingest_review=v['pages']*v['review_minutes']/60*v['review_rate'];ocr=v['pages']*v['ocr']
 implementation=(v['discovery_hours']+v['connector_hours']+v['app_hours']*multiplier+v['security_hours']+v['evaluation_hours']+v['training_hours']+v['pm_hours'])*v['engineer_rate']
 hw=(v['gpu_qty']*v['gpu_price']+v['gateway_qty']*v['gateway_price']+v['firewall_qty']*v['firewall_price']) if option=='onprem_gpu' else 0
 clients=v['tablet_qty']*v['tablet_price'];hardware=hw+clients
 initial_economic=(implementation+ingest_review+ocr+embed+hardware)*(1+v['contingency'])*cf
 initial_cash=((implementation+ingest_review)*v['implementation_cash']+ocr+embed+hardware)*(1+v['contingency'])*cf
 staff=12*(v['support_hours']*v['support_rate']+v['evaluation_month']*v['engineer_rate'])
 refresh_review=ingest_review*v['refresh'];refresh_fees=(ocr+embed)*v['refresh']
 power=v['gpu_qty']*v['power_kw']*v['power_hours']*v['electricity'] if option=='onprem_gpu' else 0
 support=hardware*v['hardware_support']
 gpu_ops=v['onprem_ops_hours']*v['support_rate']*12 if option=='onprem_gpu' else 0
 seats=v['users']*(v['enterprise_seat']+v['base_licence']*v['incremental_base'])*12 if option=='enterprise_seat' else 0
 connectors=v['enterprise_connector_month']*12 if option=='enterprise_seat' else 0
 model_support=v['model_support']*12 if option=='onprem_gpu' else 0
 fees=api+refresh_fees+12*(v['hosting']+v['security_month'])+power+support+seats+connectors+model_support+v['failure_allowance']
 opex_economic=(fees+staff+refresh_review+gpu_ops)*cf
 opex_cash=(fees+(staff+refresh_review+gpu_ops)*v['operations_cash'])*cf
 search_hours=v['users']*v['days']*ad/60*(v['minutes']*tf*usable-v['verification_minutes'])
 onboarding_hours=v['new_hires']*v['onboard_hours']*ad*usable
 capacity=(search_hours+onboarding_hours)*v['hourly']
 search_cash=search_hours*v['hourly']*v['cash_share'];onboard_cash=onboarding_hours*v['hourly']*v['onboard_cash']
 production=v['incidents']*v['hours_avoided']*v['contribution']*v['attribution']*v['demand']*ad*usable
 rework=v['rework_events']*v['rework_cost']*v['rework_reduction']*ad*usable
 cash_benefit=search_cash+onboard_cash+production+rework
 economic_benefit=capacity+production+rework
 flows=[];economic_flows=[];cash=[];cum=-initial_cash;payback=None;discounted_cum=-initial_cash;discounted_payback=None
 replacement=v['gpu_qty']*v['gpu_price']*v['replacement_share']*cf if option=='onprem_gpu' else 0
 for t in range(int(v['horizon'])+1):
  ramp=0 if t==0 else v['rollout1'] if t==1 else v['rollout2'] if t==2 else 1
  spend=initial_cash if t==0 else opex_cash+(replacement if t==v['replacement_year'] else 0)+(v['decommission']*cf if t==v['horizon'] else 0)
  economic_spend=initial_economic if t==0 else opex_economic+(replacement if t==v['replacement_year'] else 0)+(v['decommission']*cf if t==v['horizon'] else 0)
  ben=cash_benefit*ramp;net=ben-spend;flows.append(net);economic_flows.append(economic_benefit*ramp-economic_spend)
  before=0 if t==0 else cum;cum=net if t==0 else cum+net
  disc=net/(1+v['discount'])**t;prev_disc=0 if t==0 else discounted_cum;discounted_cum=disc if t==0 else discounted_cum+disc
  if t>0 and payback is None and before<0<=cum:payback=t-1-before/net
  if t>0 and discounted_payback is None and prev_disc<0<=discounted_cum:discounted_payback=t-1-prev_disc/disc
  cash.append(dict(year=t,ramp=ramp,benefit=ben,cost=spend,net=net,cumulative=cum,discounted=disc))
 pv_b=sum(x['benefit']/(1+v['discount'])**x['year'] for x in cash);pv_c=sum(x['cost']/(1+v['discount'])**x['year'] for x in cash)
 npv=pv_b-pv_c
 # Year-3 steady-state break-even search time, with existing other benefits held constant.
 coeff=v['users']*v['days']/60*ad*usable*v['hourly']*v['cash_share']
 breakeven_minutes=max(0,(opex_cash-onboard_cash-production-rework+v['users']*v['days']*ad/60*v['verification_minutes']*v['hourly']*v['cash_share'])/coeff) if coeff>0 else None
 ramp_pv=sum((v['rollout1'] if t==1 else v['rollout2'] if t==2 else 1)/(1+v['discount'])**t for t in range(1,int(v['horizon'])+1))
 npv_minutes=max(0,v['minutes']-npv/(coeff*tf*ramp_pv)) if coeff*tf*ramp_pv>0 else None
 return dict(npv_breakeven_minutes=npv_minutes,additional_cash_benefit_required=max(0,-npv)/ramp_pv,cost_per_request=sum(x['cost'] for x in cash)/(requests*v['horizon']) if requests>0 else None,option=option,requests=requests,api=api,embedding_initial=embed,ocr=ocr,ingestion_review=ingest_review,implementation=implementation,hardware=hardware,initial_cash=initial_cash,initial_economic=initial_economic,opex_cash=opex_cash,opex_economic=opex_economic,search_hours=search_hours,capacity_value=capacity,search_cash=search_cash,onboard_cash=onboard_cash,production=production,rework=rework,cash_benefit=cash_benefit,economic_benefit=economic_benefit,cash=cash,flows=flows,npv=npv,economic_npv=sum(x/(1+v['discount'])**t for t,x in enumerate(economic_flows)),irr=irr(flows),payback=payback,discounted_payback=discounted_payback,bcr=pv_b/pv_c if pv_c else None,tco=sum(x['cost'] for x in cash),breakeven_minutes=breakeven_minutes,vendor_monthly_floor=opex_economic/12/(1-v['vendor_margin']),peak_requests_second=requests/v['days']/v['active_hours']/3600*v['peak_factor'])
