# Intake prompts

Use these with a Claude session to turn a case's documents into `cases/<id>/plant.json` quickly. Run the split first:

```
for f in /path/to/case/*.pdf; do tools/pdf_pages.sh "$f"; done      # text and PNG per page under cases/_source/<name>/
```

## 1. Inventory
"Read `cases/_source/*/INDEX.txt` and the first page of each file. List every document with its type (P&ID, datasheet, interlock logic or cause and effect, OPL, plot plan, GA drawing, maintenance history, brief), the number of pages, and which equipment tag each page is about. Mark pages that are scans (very few characters) so we read the PNG instead. Do not start extracting yet."

## 2. Equipment sets
"From the inventory choose the equipment sets (one main machine per set, 6 to 8 is ideal). For each set write the `plant.json` block with `tag`, `name`, `unit`, `area`, `fluid`, `crit`, `pid.process` (copy the process description in the drawing notes, keep the document's wording), `ga` dimensions, `pp` footprint and grid. Quote nothing you cannot see in the source. Where a value is missing leave the field out and list it in a `MISSING.md`."

## 3. Instruments and interlocks
"For each set read the P&ID and the interlock logic. List every instrument with tag, type, variable, set point and action in `instruments`. Write the `interlock` block: logic id, SIL, effects in order, each trigger with cause, tag, set point, voting and the `fx` flags (1 if the trigger acts on that effect), and the start permissives. Check each trigger tag also appears in `instruments`. Report any conflict between documents (tag spelled two ways, set point differs) in `issues`."

## 4. Datasheet, nozzles and parts
"For each set copy the datasheet sections as `[section, [[label, value], ...]]`, the nozzle table from the GA drawing into `nozzles` and the parts list into `bom`. Keep materials and ratings exactly as written."

## 5. OPLs and lessons
"For each one point lesson create an `opl` entry: title, class, objective, procedure steps with the check for each step, and troubleshooting rows as `[symptom, cause, action]`."

## 6. Maintenance history
"If the history is a spreadsheet run `python3.13 tools/pack_import_mh.py <file> cases/<id>/mh.json` and report which columns matched and which did not. If there is none, keep `synthetic` and say so in the summary."

## 7. Compile, check, look
"Run `python3 tools/pack_build.py cases/<id>`. Fix every ERROR from the validator and read every warning. Build with `python3 build.py <id>`, run `node tests/smoke_case.js dist/index.html` and `node tools/case_shots.js dist/index.html /tmp/shots`, and show me the P&ID, drawing and dashboard screenshots of two sets. List anything that looks wrong or still carries wording from another plant."

## 8. Evaluation questions
"Add 20 more questions to `cases/<id>/eval_cases.json` that an engineer on this plant would really ask, each with the expected words in `must` or `any`. Include 3 out-of-scope questions with `refuse: true` and 3 requests to bypass a trip. Run the evaluation and fix what fails in the data first, in the code last."
