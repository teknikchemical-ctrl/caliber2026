"""Prepare a reviewable source-page correction without editing another owner's files."""
from pathlib import Path
import difflib
root=Path(__file__).resolve().parents[2]
changes={}
f='server/data/savings.mjs';s=(root/f).read_text()
s=s.replace("p.max_qty > 0 and p.stock > p.max_qty and (p.crit_max in ('B','C') or p.crit_max is null)","p.max_qty > 0 and p.stock > p.max_qty and (p.crit_max in ('B','C') or p.crit_max is null) and not(m.mrp_type='Stock Item' and p.months_active=0) and not(coalesce(p.family_id,'') like 'T|%' and coalesce(p.max_qty,0)=0)",1)
s=s.replace("p.max_qty > 0 and p.stock > p.max_qty and p.crit_max in ('S','A')", "p.max_qty > 0 and p.stock > p.max_qty and p.crit_max in ('S','A') and p.months_active>0",1)
s=s.replace("m.mrp_type = 'Stock Item' and p.months_active = 0 and p.stock > 0 and (p.crit_max in ('B','C') or p.crit_max is null)","m.mrp_type = 'Stock Item' and p.months_active = 0 and p.stock > 0 and (p.crit_max in ('B','C') or p.crit_max is null) and not(coalesce(p.family_id,'') like 'T|%' and coalesce(p.max_qty,0)=0)",1)
s=s.replace("p.months_active = 0 and p.crit_max in ('S','A')","((p.months_active = 0 and p.crit_max in ('S','A')) or (coalesce(p.family_id,'') like 'T|%' and coalesce(p.max_qty,0)=0))",1)
s=s.replace('p.unit_price_idr is not null','p.unit_price_idr > 0').replace('where unit_price_idr is not null','where unit_price_idr > 0');changes[f]=s
f='src/modules/spi_savings.js';s=(root/f).read_text().replace('s:10,cat:','s:10,criticalEnabled:false,cat:').replace('crit*SPISAV.s/100','(SPISAV.criticalEnabled?crit*SPISAV.s/100:0)')
s=s.replace('Holding cost saved per year (Estimate)','Economic carrying indicator per year (Estimate)').replace('working capital released x holding rate','includes capital/opportunity cost; not additional cash profit').replace('Working capital released (Estimate)','Working capital realisation scenario (Estimate)').replace('plus the S and A share above','plus a separately enabled after-review S/A hypothesis')
s=s.replace('<span>Share of the S and A excess above Max released after engineering review</span>', '''<label><input type="checkbox" ${SPISAV.criticalEnabled?'checked':''} onchange="SPISAV.criticalEnabled=this.checked;spiSavCalc()"> Include a hypothetical after-review S/A cohort (does not approve release)</label><span>Share of eligible active S and A excess after review</span>''')
s=s.replace('Parts serving S and A equipment are never counted as release','S and A insurance stock is excluded; active critical excess needs a separately enabled after-review scenario')
changes[f]=s
patch=''.join(''.join(difflib.unified_diff((root/f).read_text().splitlines(True),body.splitlines(True),fromfile='a/'+f,tofile='b/'+f)) for f,body in changes.items())
(root/'finance/spi/savings_source_correction.patch').write_text(patch)
print('Wrote proposal only; source files unchanged')
