-- SPI database schema (contract). Owner: Claude A. Everyone codes against this file; change it only through Claude A (write the request in your handoff file).
-- Files: spi/db/spi.sqlite (full) and spi/fixtures/mini.sqlite (about 300 parts, same schema); batch results in spi/db/results.sqlite (schema_results.sql). Dates are ISO text (YYYY-MM-DD), months are 'YYYY-MM'.
-- Layers: (1) clean source tables, (2) derived tables made by the ETL, (3) AI and forecasting tables written by the engine and the AI agent.
PRAGMA foreign_keys=ON;

-- ============ 1. CLEAN SOURCE LAYER (from the six Excel files) ============
CREATE TABLE funcloc(
  funcloc TEXT PRIMARY KEY,            -- 'PX_KT-383A'
  descr TEXT, criticality TEXT CHECK(criticality IN('S','A','B','C') OR criticality IS NULL),
  parent TEXT, level INTEGER, tag TEXT, -- tag = 'KT-383A' (prefix PX_ removed) when the location is an equipment or instrument tag
  eq_class TEXT,                        -- KT, KC, BF, PP, HE, FCV, PRV ... (prefix of tag) or NULL
  eq_class_name TEXT,                   -- 'steam turbine driver', 'compressor', 'cracking furnace' ... from spi/etl/eqclass_map.json
  system_code TEXT,                     -- 'S01' when under a SITE_PX_Sxx system
  has_bom INTEGER DEFAULT 0
);
CREATE TABLE material(
  material_no INTEGER PRIMARY KEY, descr TEXT, unit TEXT,
  mrp_type TEXT,                        -- 'Stock Item' | 'Non Stock'
  stock REAL, min_qty REAL, max_qty REAL,
  item_type TEXT,                       -- first word group of the description: BEARING, SEAL, GASKET, VALVE ...
  spec_family TEXT REFERENCES spec_family(family_id),
  nps TEXT, rating TEXT, grade TEXT, end_conn TEXT, schedule TEXT,  -- parsed from the description when present (ASME B16.5 style), else NULL
  dwg_no TEXT, for_tag TEXT,            -- 'DWG.463-7036' and 'PP-1604A' parsed from ',DWG.xxx,FOR tag'
  last_unit_price_idr REAL, price_basis TEXT   -- 'last PO amount / PR quantity' or NULL
);
CREATE TABLE bom(
  funcloc TEXT REFERENCES funcloc(funcloc), material_no INTEGER REFERENCES material(material_no),
  installed_qty REAL, dup_rows INTEGER DEFAULT 1,
  PRIMARY KEY(funcloc, material_no)
);
CREATE TABLE movement(                  -- spare part issue (consumption)
  id INTEGER PRIMARY KEY, posting_date TEXT, month TEXT, material_no INTEGER REFERENCES material(material_no),
  qty REAL, unit TEXT, order_no INTEGER, notif_no INTEGER, funcloc TEXT   -- notif_no and funcloc filled only when order_no matches a notification (about 16% of rows)
);
CREATE TABLE notification(
  notif_no INTEGER PRIMARY KEY, notif_date TEXT, type TEXT, order_no INTEGER, priority TEXT,
  funcloc TEXT REFERENCES funcloc(funcloc), descr TEXT, created_on TEXT, req_start TEXT, req_end TEXT, completed_on TEXT, status TEXT
);
CREATE TABLE maint_item(
  item_no INTEGER PRIMARY KEY, plan_no INTEGER, funcloc TEXT REFERENCES funcloc(funcloc), descr TEXT, abc TEXT,
  priority INTEGER, cycle_text TEXT, cycle_months INTEGER,          -- '5 YEARLY' -> 60 (parsed, NULL if unreadable)
  start_of_cycle TEXT, next_due TEXT                                 -- next occurrence on or after the data cut-off date
);
CREATE TABLE po_line(
  id INTEGER PRIMARY KEY, pr_no INTEGER, pr_item INTEGER, pr_type TEXT, pr_date TEXT, material_no INTEGER REFERENCES material(material_no),
  qty REAL, uom TEXT, pr_delivery TEXT, plant INTEGER, purch_group TEXT, po_no INTEGER, po_item INTEGER,
  supplier_code INTEGER, supplier TEXT, amount REAL, currency TEXT, po_delivery TEXT,
  lead_days INTEGER, unit_price REAL, dq_flag TEXT                   -- dq_flag: NEG_LT, LT_GT_365, ZERO_PRICE, NONIDR ...
);

-- ============ 2. DERIVED LAYER (ETL) ============
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT);   -- data_cutoff ('2026-09-30'), etl_version, built_at, source_files
CREATE TABLE spec_family(                -- parts that are interchangeable by specification (see docs/spi/STANDARDS.md)
  family_id TEXT PRIMARY KEY, label TEXT, item_type TEXT, standard_ref TEXT, members INTEGER, basis TEXT
);
CREATE TABLE demand_month(               -- issue quantity per part per month, only months with an issue (zero months are implied)
  material_no INTEGER, month TEXT, qty REAL, n_issues INTEGER, PRIMARY KEY(material_no, month)
);
CREATE TABLE part_equipment(             -- which equipment a part serves, and how we know
  material_no INTEGER, funcloc TEXT, installed_qty REAL, source TEXT CHECK(source IN('bom','dwg_text','order_link')), PRIMARY KEY(material_no, funcloc, source)
);
CREATE TABLE part_profile(               -- one row per BoM material: everything the AI and the engine need, computed once
  material_no INTEGER PRIMARY KEY REFERENCES material(material_no),
  crit_max TEXT, crit_rank INTEGER,       -- S=4 A=3 B=2 C=1 over all installed locations
  n_funcloc INTEGER, installed_total REAL,
  n_issues INTEGER, months_active INTEGER, total_qty REAL, first_issue TEXT, last_issue TEXT, months_since_last INTEGER,
  adi REAL, cv2 REAL, demand_class TEXT CHECK(demand_class IN('smooth','erratic','intermittent','lumpy','no_demand','single_event')),
  n_notif_linked INTEGER, notif_rate_12m REAL,        -- notifications per year on the equipment the part serves (weighted)
  pm_due_12m INTEGER, pm_next_due TEXT,               -- planned maintenance items due in the next 12 months on the equipment it serves
  lt_n INTEGER, lt_median REAL, lt_mean REAL, lt_sd REAL, lt_p90 REAL, supplier_count INTEGER,
  stock REAL, min_qty REAL, max_qty REAL, unit_price_idr REAL, stock_value_idr REAL, excess_value_idr REAL,
  months_cover REAL, turnover REAL, abc_class TEXT, xyz_class TEXT,
  family_id TEXT, dq_flags TEXT            -- JSON list
);
CREATE TABLE location_profile(          -- one row per functional location: criticality, stock keeping, maintenance and cost (ETL). Stock is held at material level: stock figures here are the parts installed at the location and are NOT additive across locations.
  funcloc TEXT PRIMARY KEY, tag TEXT, descr TEXT, criticality TEXT, eq_class TEXT, eq_class_name TEXT, system_code TEXT,
  n_parts INTEGER, n_parts_used INTEGER, stock_value_idr REAL, excess_value_idr REAL, n_zero_stock INTEGER, n_below_min INTEGER, n_critical_zero INTEGER,
  notif_total INTEGER, notif_12m INTEGER, notif_high_12m INTEGER, notif_open INTEGER, pm_due_12m INTEGER, pm_next_due TEXT
);
CREATE INDEX ix_lp_crit ON location_profile(criticality); CREATE INDEX ix_lp_class ON location_profile(eq_class);
CREATE TABLE equipment_set(              -- the equipment sets used for drawings, plot plan and 3D (see docs/spi/EQUIPMENT_SETS.md)
  set_no INTEGER PRIMARY KEY, tag TEXT, name TEXT, funcloc TEXT, eq_class TEXT, system_code TEXT, criticality TEXT, n_parts INTEGER, basis TEXT
);
CREATE TABLE dq_issue(id INTEGER PRIMARY KEY, table_name TEXT, key TEXT, issue TEXT, severity TEXT CHECK(severity IN('info','warn','error')), detail TEXT, action TEXT);
CREATE TABLE eval_case(id TEXT PRIMARY KEY, question TEXT, expected_json TEXT, sql TEXT, tolerance REAL);   -- golden questions, answers computed by SQL

-- Layer 3 (AI runs, ledger, plans, forecasts, parameters, recommendations) lives in schema_results.sql / results.sqlite, attached at run time as "res".
CREATE INDEX ix_mov_mat ON movement(material_no, month); CREATE INDEX ix_bom_mat ON bom(material_no); CREATE INDEX ix_bom_fl ON bom(funcloc);
CREATE INDEX ix_po_mat ON po_line(material_no); CREATE INDEX ix_notif_fl ON notification(funcloc); CREATE INDEX ix_mi_fl ON maint_item(funcloc);
