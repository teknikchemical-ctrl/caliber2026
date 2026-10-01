-- Target relational schema for the server side knowledge hub (PostgreSQL 15+ with pgvector).
-- The browser build keeps the same shapes in memory: chunk, fact, relation, qa_log, eval_case.
create extension if not exists vector;
create extension if not exists pg_trgm;

-- Controlled vocabularies ---------------------------------------------------------------------------
create table status_vocab (
  code text primary key,                      -- approved, completed, listed, not_stated, review_flag, in_review, planned, in_progress, draft, superseded, rejected
  label text not null,
  trust numeric(3,2) not null check (trust between 0 and 1),
  visible_to text not null check (visible_to in ('all','staff','none'))
);
create table app_user (
  user_id uuid primary key default gen_random_uuid(),
  display_name text not null,
  role text not null check (role in ('Operator','Engineer','Reliability','HSE','Manager')),
  active boolean not null default true
);

-- Assets --------------------------------------------------------------------------------------------
create table asset (
  asset_id text primary key,                  -- AST-002
  tag text not null unique,                   -- GA-1201A, the common key across all sources
  name text not null,
  unit_name text, area int,
  equipment_set int unique,                   -- 1..8
  criticality text, fluid text,
  functional_location text, grid_ref text, elevation text, easting numeric, northing numeric
);
create table component (
  component_id text primary key,              -- GA-1201A/5
  asset_id text not null references asset(asset_id),
  item_no text, part_name text not null, material text, quantity int, notes text
);

-- Documents, versions and chunks ----------------------------------------------------------------------
create table document (
  document_id text primary key,               -- DOC-001
  asset_id text references asset(asset_id),
  doc_type text not null,                     -- P&ID, Datasheet, Interlock Logic, Equipment Drawing (GA), Plot Plan, OPL, SOP
  title text not null,
  source_system text not null,                -- EDMS, AIMS, CMMS, Tacit, KnowledgeStudio
  classification text not null default 'internal' check (classification in ('public','internal','restricted'))
);
create table document_version (
  version_id text primary key,                -- DOC-001@02
  document_id text not null references document(document_id),
  revision text, status_code text not null references status_vocab(code),
  issued_on date, valid_from date, valid_to date, superseded_by text references document_version(version_id),
  content_hash text not null
);
create table chunk (
  chunk_id text primary key,                  -- il:TJC-LLD-IL-KC-4501#03 (record kind, record id, ordinal): stable and unique
  kind text not null check (kind in ('doc','wo','inst','il','ga','pp','opl','dq','uk','pdm')),
  record_id text not null,                    -- the owning record, for example DOC-004 or WO-240002
  version_id text references document_version(version_id),
  asset_id text references asset(asset_id),
  ordinal int not null, section text, page int,
  title text not null, body text not null,
  tags text[] not null default '{}',
  status_code text not null references status_vocab(code),
  trust numeric(3,2) not null,
  occurred_on date,
  valid_from date, valid_to date,
  acl_class text not null default 'internal', acl_roles text[] not null,
  token_count int not null,
  content_hash text not null,                 -- re-embed only when this changes
  embedding vector(1536),
  search tsvector generated always as (to_tsvector('english', coalesce(title,'')||' '||coalesce(section,'')||' '||body||' '||array_to_string(tags,' '))) stored,
  unique (kind, record_id, ordinal)
);
create index chunk_search_idx on chunk using gin (search);
create index chunk_tags_idx on chunk using gin (tags);
create index chunk_asset_idx on chunk (asset_id, status_code);
create index chunk_embedding_idx on chunk using hnsw (embedding vector_cosine_ops);

-- Typed facts: values extracted from the sources so tools can compare and compute ----------------------
create table fact (
  fact_id text primary key,
  asset_id text not null references asset(asset_id),
  kind text not null check (kind in ('setpoint','permissive','final_element','bom','nozzle','datasheet','location','instrument_range')),
  tag text, name text not null,
  op text check (op in ('<','<=','>','>=','=','~','')), value_num numeric, unit text, value_text text,
  voting text, logic_id text,
  attributes jsonb not null default '{}',     -- actuates[], rating_class, face, material, easting, northing ...
  source_chunk_id text references chunk(chunk_id),
  status_code text not null references status_vocab(code)
);
create index fact_lookup_idx on fact (asset_id, kind, tag);
create table relation (
  from_type text not null, from_id text not null, rel text not null, to_type text not null, to_id text not null,
  primary key (from_type, from_id, rel, to_type, to_id)
);

-- Interlocks and instruments ---------------------------------------------------------------------------
create table interlock (
  interlock_id text primary key, asset_id text not null references asset(asset_id), logic_id text, sil text, description text, notes text
);
create table interlock_trigger (
  interlock_id text references interlock(interlock_id), trigger_id text, cause text, tag text, op text, setpoint numeric, unit text, voting text,
  actuates text[] not null default '{}', primary key (interlock_id, trigger_id)
);
create table instrument (
  instrument_id text primary key, asset_id text not null references asset(asset_id), tag text not null, type text, variable text, setpoint_text text, action text, review_flag text
);

-- Maintenance and failures -----------------------------------------------------------------------------
create table work_order (
  wo_number text primary key, asset_id text not null references asset(asset_id), notification text, work_type text, discipline text, priority text,
  problem text, root_cause text, root_cause_class text, action text, parts text, breakdown boolean, downtime_h numeric, labour_cost numeric, material_cost numeric, total_cost numeric,
  reported_at timestamptz, started_at timestamptz, completed_at timestamptz, status text, interlock_id text references interlock(interlock_id), generated boolean default false
);
create table failure_event (
  failure_id text primary key, wo_number text references work_order(wo_number), asset_id text not null references asset(asset_id), component_id text references component(component_id),
  symptom text, root_cause text, root_cause_class text, corrective_action text, recurred_within_90d boolean, source text not null check (source in ('work_order','opl_case','knowledge_item'))
);
create table opl (
  opl_no text primary key, asset_id text not null references asset(asset_id), title text, class text, objective text, reviewer text, approver text, issued_on date, steps jsonb, key_points jsonb
);
create table opl_case (
  opl_no text references opl(opl_no), ordinal int, symptom text, cause text, action text, primary key (opl_no, ordinal)
);

-- Knowledge Studio ---------------------------------------------------------------------------------------
create table knowledge_item (
  item_id text primary key, item_type text not null check (item_type in ('document','tacit','lesson','failure')),
  asset_id text references asset(asset_id), title text not null, current_revision text not null, status_code text not null references status_vocab(code),
  author uuid references app_user(user_id), created_at timestamptz default now(), updated_at timestamptz default now()
);
create table knowledge_revision (
  item_id text references knowledge_item(item_id), revision text, body text not null, meta jsonb, created_at timestamptz default now(), created_by uuid references app_user(user_id), primary key (item_id, revision)
);
create table knowledge_review (
  review_id bigserial primary key, item_id text references knowledge_item(item_id), revision text, reviewer uuid references app_user(user_id), decision text check (decision in ('approved','rejected','changes_requested')), note text, decided_at timestamptz default now()
);

-- Assistant logging, feedback and evaluation --------------------------------------------------------------
create table qa_log (
  qa_id text primary key, asked_at timestamptz not null default now(), user_id uuid references app_user(user_id), role text,
  question text not null, intent text, handler text, model text, prompt_version text, contract_version text,
  answer text, confidence int, level text, numbers_checked text, latency_ms int, tokens_in int, tokens_out int, feedback text
);
create table qa_citation (
  qa_id text references qa_log(qa_id), chunk_id text references chunk(chunk_id), retrieved boolean not null, cited boolean not null, rank int, score numeric, primary key (qa_id, chunk_id)
);
create table feedback (
  feedback_id bigserial primary key, qa_id text references qa_log(qa_id), verdict text check (verdict in ('Useful','Incomplete','Wrong')), comment text, status text default 'Open', created_at timestamptz default now()
);
create table eval_case (
  case_id text primary key, category text, question text not null, must text[], any_of text[], must_not text[], expected_handler text, min_conf int, max_conf int, refuse boolean default false, setup text, cleanup text, active boolean default true
);
create table eval_run (
  run_id bigserial primary key, ran_at timestamptz default now(), model text, prompt_version text, passed int, total int, failed_cases text[], detail jsonb
);
create table audit_log (
  audit_id bigserial primary key, at timestamptz default now(), user_id uuid, role text, action text not null, detail text, ref text
);

insert into status_vocab(code,label,trust,visible_to) values
 ('approved','Approved or issued',1.00,'all'),('completed','Completed',0.90,'all'),('listed','Listed',0.90,'all'),('not_stated','Approval not stated',0.80,'all'),
 ('review_flag','Flagged for review',0.75,'all'),('in_review','In review',0.70,'staff'),('planned','Planned',0.70,'all'),('in_progress','In progress',0.80,'all'),
 ('draft','Draft',0.55,'staff'),('superseded','Superseded',0.35,'staff'),('rejected','Rejected',0.00,'none');
