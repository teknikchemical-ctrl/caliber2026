#!/usr/bin/env bash
# Start a new case from the template.   tools/new_case.sh <id> "<Plant title>" [CODE]
#   tools/new_case.sh refinery-cdu "Crude Distillation Unit" CDU
set -euo pipefail
id="${1:?usage: tools/new_case.sh <id> \"<Plant title>\" [CODE]}"; title="${2:?plant title}"; code="${3:-$(echo "$id" | tr a-z A-Z | tr -cd A-Z0-9 | cut -c1-6)}"
cd "$(dirname "$0")/.."
[ -e "cases/$id" ] && { echo "cases/$id exists"; exit 1; }
mkdir -p "cases/$id"; cp cases/_template/plant.json "cases/$id/plant.json"
python3 - "$id" "$title" "$code" <<'PY'
import json, sys
i, t, c = sys.argv[1:4]
p = f"cases/{i}/plant.json"; d = json.load(open(p))
d.pop("_help", None)
d["case"].update({"id": i, "title": t, "subtitle": f"{t} | Equipment Records", "code": c})
json.dump(d, open(p, "w"), indent=1)
PY
echo "created cases/$id/plant.json (two example sets: replace them with the real equipment)"
echo "next:  edit plant.json   then   python3 tools/pack_build.py cases/$id && python3 build.py $id && node tests/smoke_case.js dist/index.html"
