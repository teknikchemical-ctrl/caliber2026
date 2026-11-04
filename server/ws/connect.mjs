// GET /api/ws/connect (owner: Claude B). How the blocks of the Equipment explorer connect, from the FuncLoc list and the BoM only.
// Every functional location is put in one block (equipment class, or a sub-item class such as the motor of a pump or the burner of a furnace).
// Links between blocks, four kinds:
//   piping    a piping line whose description names both ends ("PIPE-10 FROM PP-807B TO PP-148A")
//   mounted   a sub-item and the equipment it belongs to (tag PP-1807C-M, "MOTOR FOR PP-1807C"; BF-108-QF21 on furnace BF-108)
//   serves    an instrument, valve, orifice or junction box whose description names the equipment ("SAFETY VALVE HE-1741B")
//   parts     spare parts listed in the BoMs of both blocks (common spares)
// Per block: locations, locations with a BoM, distinct parts, stock value, value above Max, parts at zero stock with issues, criticality split, the locations with the most BoM lines.
import { openDb, json, guard, fig, pay } from "./_lib.mjs";
const MAIN = { KT: "turbine", KC: "blower", PP: "pump", BF: "furnace", HE: "hx", FCV: "valve", LCV: "valve", PCV: "valve", TCV: "valve", PRV: "prv", SDV: "sdv", MOV: "mov", VD: "vessel", CL: "column", TIT: "instr", PIT: "instr", FIT: "instr", LIT: "instr", DPT: "instr", PGI: "instr", TEL: "instr", ROF: "orifice", JBX: "jbox", LINE: "line" };
const LAB = { turbine: "Turbine driver", blower: "Compressor train", pump: "Centrifugal pump", furnace: "Cracking furnace", hx: "Heat exchanger", valve: "Control valve", prv: "Relief valve", sdv: "Shutdown valve", mov: "Motor valve", vessel: "Vessel", column: "Column", instr: "Instrument", orifice: "Orifice", jbox: "Junction box", line: "Piping line", motor: "Motor", cstation: "Switch station", burner: "Burner", peepdoor: "Peep door", convsec: "Convection section", qfit: "Quench fitting", dsteam: "Dilution steam", coilout: "Coil outlet" };
const SUBBF = [["burner", /BURNER/], ["peepdoor", /PEEP/], ["convsec", /CONVECTION/], ["qfit", /QUENCH FITTING/], ["dsteam", /DILUTION STEAM/], ["coilout", /COIL OUTLET/]];
const TAGRE = /\b((?:PP|HE|VD|KC|KT|BF|CL)-\d+[A-Z]?(?:-M)?)\b/;
let cache = null;
function build(db) {
  const F = db.prepare("select funcloc, tag, descr, criticality, eq_class, has_bom from funcloc where eq_class is not null and eq_class <> 'SYSTEM'").all(), grp = {}, byTag = {};
  const blockOf = (r) => { const d = String(r.descr || "").toUpperCase(), t = String(r.tag || "");
    if (/^MOTOR FOR /.test(d) || /-M$/.test(t)) return "motor";
    if (/-CSS$/.test(t) || /SWITCH STATION/.test(d)) return "cstation";
    if (r.eq_class === "BF" && /^BF-\d+[A-Z]?-/.test(t)) { for (const [k, re] of SUBBF) if (re.test(d)) return k; }
    return MAIN[r.eq_class] || null; };
  F.forEach((r) => { r.block = blockOf(r); if (r.block) { grp[r.funcloc] = r.block; if (r.tag) byTag[r.tag] = r; } });
  const L = {}, add = (a, b, kind, ex) => { if (!a || !b || a === b && kind !== "piping") return; const [x, y] = a < b ? [a, b] : [b, a], k = x + "|" + y + "|" + kind, z = L[k] = L[k] || { a: x, b: y, kind, count: 0, examples: [] }; z.count++; if (ex && z.examples.length < 3) z.examples.push(ex); };
  F.forEach((r) => { if (!r.block) return; const d = String(r.descr || "").toUpperCase(), t = String(r.tag || "");
    if (r.block === "line") { const m = /FROM\s+([A-Z]+-[A-Z0-9]+)\s+TO\s+([A-Z]+-[A-Z0-9]+)/.exec(d); if (m && byTag[m[1]] && byTag[m[2]]) add(byTag[m[1]].block, byTag[m[2]].block, "piping", t + ": " + m[1] + " to " + m[2]); return; }
    if (["motor", "cstation", "burner", "peepdoor", "convsec", "qfit", "dsteam", "coilout"].includes(r.block)) { const f = /FOR ([A-Z]+-[A-Z0-9]+(?:-M)?)/.exec(d), p = f ? f[1] : t.replace(/-[A-Z0-9]+$/, ""), P = byTag[p]; if (P) add(r.block, P.block, "mounted", t + " on " + p); return; }
    if (["instr", "prv", "sdv", "valve", "mov", "orifice", "jbox"].includes(r.block)) { const m = TAGRE.exec(d), P = m && byTag[m[1]]; if (P) add(r.block, P.block, "serves", t + " on " + m[1]); } });
  /* common spare parts between blocks */
  const B = db.prepare("select b.funcloc, b.material_no, p.stock, p.stock_value_idr v, p.excess_value_idr x, p.n_issues ni, p.crit_max c from bom b left join part_profile p using(material_no)").all(), M = {}, P = {};
  B.forEach((r) => { const g = grp[r.funcloc]; if (!g) return; (M[g] = M[g] || new Set()).add(r.material_no); P[r.material_no] = r; });
  const ks = Object.keys(M); for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { let n = 0; for (const m of M[ks[i]]) if (M[ks[j]].has(m)) n++; if (n) { const [x, y] = ks[i] < ks[j] ? [ks[i], ks[j]] : [ks[j], ks[i]]; L[x + "|" + y + "|parts"] = { a: x, b: y, kind: "parts", count: n, examples: [] }; } }
  const bl = {}; B.forEach((r) => { bl[r.funcloc] = (bl[r.funcloc] || 0) + 1; });
  const G = {}; Object.keys(LAB).forEach((k) => { G[k] = { id: k, label: LAB[k], locations: 0, with_bom: 0, parts: 0, stock_value_idr: 0, excess_value_idr: 0, stockout_parts: 0, crit: { S: 0, A: 0, B: 0, C: 0 }, top: [] }; });
  F.forEach((r) => { const g = G[r.block]; if (!g) return; g.locations++; if (r.has_bom) g.with_bom++; if (r.criticality) g.crit[r.criticality]++; if (bl[r.funcloc]) g.top.push({ funcloc: r.funcloc, tag: r.tag, descr: r.descr, criticality: r.criticality, bom_lines: bl[r.funcloc] }); });
  Object.entries(M).forEach(([k, s]) => { const g = G[k]; g.parts = s.size; s.forEach((m) => { const p = P[m] || {}; g.stock_value_idr += p.v || 0; g.excess_value_idr += p.x || 0; if ((p.stock || 0) <= 0 && (p.ni || 0) > 0) g.stockout_parts++; }); });
  Object.values(G).forEach((g) => { g.top = g.top.sort((x, y) => "SABC".indexOf(x.criticality || "C") - "SABC".indexOf(y.criticality || "C") || y.bom_lines - x.bom_lines).slice(0, 8); });
  return { blocks: G, links: Object.values(L).sort((x, y) => y.count - x.count) };
}
export default guard((req, res) => {
  const db = openDb(); if (!cache) cache = build(db);
  const k = cache.links.reduce((s, x) => { s[x.kind] = (s[x.kind] || 0) + x.count; return s; }, {});
  json(res, 200, pay("ws.connect", {}, cache, [fig("blocks", "Blocks with locations", Object.values(cache.blocks).filter((b) => b.locations).length, "blocks"), fig("piping", "Piping lines between blocks", k.piping || 0, "lines"), fig("mounted", "Sub-items on their equipment", k.mounted || 0, "locations"), fig("serves", "Instruments and valves naming their equipment", k.serves || 0, "locations")],
    ["FuncLoc list", "BoM", "Movement Material (part profile)"], ["A block is an equipment class or a sub-item class. Stock value counts each part once per block. Parts can be common to several blocks."]));
});
