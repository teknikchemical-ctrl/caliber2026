#!/usr/bin/env python3.13
"""Builds spi/fixtures/mini.sqlite: about 300 parts with every related row, same schema as the full database (owner: Claude A).
Coverage: every demand class, every criticality, a pooled family of 5, insurance-spare candidates, KT parts, bad lead time, zero price, non-IDR, excess and zero-stock cases."""
import os, sqlite3, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "spi/db/spi.sqlite"); OUT = os.path.join(ROOT, "spi/fixtures/mini.sqlite")
s = sqlite3.connect(SRC); s.row_factory = sqlite3.Row
pick = []
def take(sql, n, args=()):
    got = [r[0] for r in s.execute(sql + f" order by material_no limit {n * 6}", args)]
    k = 0
    for g in got[::max(1, len(got) // max(n, 1))]:
        if g not in pick and k < n: pick.append(g); k += 1
Q = "select p.material_no from part_profile p join material m using(material_no) left join (select material_no, group_concat(dq_flag) f from po_line group by material_no) q using(material_no) where "
take(Q + "p.demand_class='smooth'", 15); take(Q + "p.demand_class='erratic'", 20); take(Q + "p.demand_class='intermittent'", 40); take(Q + "p.demand_class='lumpy'", 30)
take(Q + "p.demand_class='single_event'", 35); take(Q + "p.demand_class='no_demand' and p.crit_max='S' and m.for_tag like 'KT-%'", 12); take(Q + "p.demand_class='no_demand' and p.crit_max in ('S','A') and p.stock=0", 15)
take(Q + "p.demand_class='no_demand' and p.stock>0 and m.mrp_type='Stock Item'", 15); take(Q + "p.demand_class='no_demand' and p.crit_max in ('B','C')", 10)
take(Q + "q.f like '%NEG_LT%'", 3); take(Q + "q.f like '%LT_GT_365%'", 4); take(Q + "q.f like '%ZERO_PRICE%'", 4); take(Q + "q.f like '%NONIDR%'", 4)
take(Q + "p.excess_value_idr>0 and p.crit_max in ('B','C')", 12); take(Q + "p.stock=0 and p.months_active>=4 and p.crit_max in ('S','A')", 12); take(Q + "p.pm_due_12m>0 and p.months_active>=3", 12)
take(Q + "m.mrp_type='Non Stock' and p.stock>0", 6)
fam = s.execute("select family_id from spec_family where members between 5 and 8 and family_id like 'S|%' and family_id in (select family_id from part_profile where months_active>=1) order by members desc limit 1").fetchone()
if fam: take(Q + "p.family_id=?", 6, (fam[0],))
pick = sorted(set(pick))
if os.path.exists(OUT): os.remove(OUT)
o = sqlite3.connect(OUT); o.executescript(open(os.path.join(ROOT, "spi/db/schema.sql")).read())
o.execute("pragma foreign_keys=off"); o.execute(f"attach database '{SRC}' as f"); o.execute("create temp table pk(m integer primary key)"); o.executemany("insert into pk values(?)", [(x,) for x in pick])
ex = lambda sql: o.execute(sql)
ex("insert into bom select * from f.bom where material_no in (select m from pk)")
ex("create temp table fl(x text primary key)"); ex("insert or ignore into fl select funcloc from f.bom where material_no in (select m from pk)")
ex("insert or ignore into fl select funcloc from f.part_equipment where material_no in (select m from pk)")
ex("insert or ignore into fl select funcloc from f.notification where funcloc in (select x from fl)")
ex("insert into funcloc select * from f.funcloc where funcloc in (select x from fl) or funcloc like 'SITE_%'")
ex("insert into spec_family select * from f.spec_family where family_id in (select spec_family from f.material where material_no in (select m from pk))")
ex("insert into material select * from f.material where material_no in (select m from pk)")
ex("insert into movement select * from f.movement where material_no in (select m from pk)")
ex("insert into demand_month select * from f.demand_month where material_no in (select m from pk)")
ex("insert into part_equipment select * from f.part_equipment where material_no in (select m from pk)")
ex("insert into part_profile select * from f.part_profile where material_no in (select m from pk)")
ex("insert into notification select * from f.notification where funcloc in (select x from fl)")
ex("insert into maint_item select * from f.maint_item where funcloc in (select x from fl)")
ex("insert into po_line select * from f.po_line where material_no in (select m from pk)")
ex("insert into dq_issue select * from f.dq_issue"); ex("insert into meta select * from f.meta"); ex("insert or replace into meta values('fixture','mini: about 300 parts, same schema as the full database')")
o.commit(); o.execute("detach database f"); o.execute("vacuum")
n = lambda t: o.execute(f"select count(*) from {t}").fetchone()[0]
print("fixture", OUT, round(os.path.getsize(OUT) / 1e6, 2), "MB", {t: n(t) for t in ["material", "bom", "funcloc", "movement", "po_line", "notification", "maint_item", "part_profile"]})
print(dict(o.execute("select demand_class, count(*) from part_profile group by 1").fetchall()), dict(o.execute("select coalesce(crit_max,'-'), count(*) from part_profile group by 1").fetchall()))
