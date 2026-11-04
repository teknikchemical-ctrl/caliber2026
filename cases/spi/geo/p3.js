/* SPI case: 3D plant layout (owner: Claude B). Low units (pumps, turbine drivers) in the front row, furnaces, exchanger and control valve behind them so nothing hides behind the pipe rack.
   Scale of each unit from the size of its model so that it fits its 11 m by 9.5 m pad. Schematic layout, not a surveyed plot plan. */
const P3POS=(()=>{const o={},rows=[["PP-148A","PP-411A","KT-383A","KT-202"],["BF-108","BF-110","HE-605","FCV-1905D"]];
 rows.forEach((r,ri)=>r.forEach((tag,i)=>{const s=KB.sets.find(x=>x.tag===tag);if(s)o[s.n]=[(i-1.5)*11,ri?9:-9]}));
 KB.sets.filter(s=>!o[s.n]).forEach((s,i)=>{o[s.n]=[(i%4-1.5)*11,18+Math.floor(i/4)*14]});return o})();
const P3SC=(()=>{const o={};KB.sets.forEach(s=>{const b=spiBBox(s.n),w=Math.max(b.mx[0]-b.mn[0],b.mx[2]-b.mn[2]),h=b.mx[1]-b.mn[1];o[s.n]=+Math.max(1,Math.min(3.4,8.4/w,14/h)).toFixed(2)});return o})();
window.P3SITE={tank:0,dist:50};
