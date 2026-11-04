// Routes a portfolio question to a view payload (GET /api/view/<name>) so the assistant answers from the same figures as the pages. (owner: Claude A)
export const VIEW_NAMES = ["demand_predictability", "portfolio_forecast", "decision_board", "parameters_shift", "cost_risk", "part_forecast", "maintenance_population", "maintenance_driven_demand", "turnaround_readiness", "open_work_exposure", "cost_balance", "savings_waterfall", "cash_plan", "business_scorecard", "registers"];
const ROUTES = [
  [/zero.stock|out of stock|stocked out|insurance spare|obsolete|obsolescence|pilot (50|list|parts)|register/i, "registers"],
  [/scorecard|success metric|business impact|expected benefit|benefits?\b|payback|roi\b/i, "business_scorecard"],
  [/cash plan|cash position|funding need|peak funding|when .*repay/i, "cash_plan"],
  [/cost reduction|release (idle|excess)|working capital release|realis|where .*(can|could) .*(save|release)/i, "savings_waterfall"],
  [/holding cost|cost.risk balance|cost of (risk|holding)|balance .*(cost|risk)|service level (today|policy)/i, "cost_balance"],
  [/budget|which parts (to|should we) (fund|buy)|efficient frontier|optimi[sz]e .*(cost|inventory)|fund first/i, "cost_risk"],
  [/predictab|irregular|erratic|lumpy|intermittent|adi\b|cv2|single.event|why .*forecast .*(flat|zero)|which parts (can|cannot) be forecast/i, "demand_predictability"],
  [/drives? (the )?(spare part |part )?(demand|consumption)|maintenance.*(demand|consum)|planned maintenance.*(predict|correlat)|work order link|linked (issues|to a notification)/i, "maintenance_driven_demand"],
  [/turnaround|readiness|next (shutdown|campaign)|before the (shutdown|campaign)|shutdown (needs?|parts?)/i, "turnaround_readiness"],
  [/open work|open notification|overdue|zero stock .*(open|notification|work)/i, "open_work_exposure"],
  [/failure (frequency|rate)|repeat.failure|equipment population|installed population|failure/i, "maintenance_population"],
  [/dynamic (min|max|parameter|inventory)|min.?max|reorder point|safety stock|parameters?/i, "parameters_shift"],
  [/next 12 months|portfolio (forecast|demand)|total demand|forecast (for )?the (whole )?(portfolio|plant)/i, "portfolio_forecast"],
  [/stockout risk|overstock risk|reorder recommend|slow.moving alert|what (should|do) (we|i) (do|reorder)|decision board|reorder now|recommendations?/i, "decision_board"]
];
export function viewRoute(q) { for (const [re, name] of ROUTES) if (re.test(q)) return ["get_view", { name }]; return null; }
export async function runView(db, name, args = {}) {
  const { VIEWS } = await import("../../server/_lib/views.mjs");
  if (!VIEWS[name]) throw new Error("Unknown view");
  const q = { ...args }; delete q.name;
  const p = VIEWS[name](db, q), id = "view:" + name + (args.material_no ? ":" + args.material_no : "");
  const limits = (p.notes || []).slice(0, 3).join(" ");
  return { id, answer: (p.insight || p.title) + (limits ? " Limits: " + limits : ""), data: p, facts: (p.figures || []).map(f => ({ id: id + ":" + f.id, origin: "view:" + name, value: { ...f, basis: f.basis } })), evidence_ids: p.source_ids || [], assumptions: p.assumptions || [] };
}

// Page tab id -> view payload, so "Explain this view" on any tab is answered from the figures that tab draws.
const PAGE_VIEW = { spi_f_pred: "demand_predictability", spi_f_port: "portfolio_forecast", spi_f_dec: "decision_board", spi_f_par: "parameters_shift", spi_f_opt: "cost_risk", spi_m_pop: "maintenance_population", spi_m_drv: "maintenance_driven_demand", spi_m_ta: "turnaround_readiness", spi_m_open: "open_work_exposure", spi_c_bal: "cost_balance", spi_c_sav: "savings_waterfall", spi_c_cash: "cash_plan", spi_c_score: "business_scorecard", spi_reg: "registers" };
export function pageViewRoute(q, page) { const name = PAGE_VIEW[page]; return name && /^explain this (view|page)/i.test(q) && VIEW_NAMES.includes(name) ? ["get_view", { name }] : null; }
export const PAGE_VIEW_TABS = Object.keys(PAGE_VIEW);
