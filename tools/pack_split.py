#!/usr/bin/env python3
"""Split cases/<id>/plant.json into fragments, one file per equipment set, so several people can enter data without merge conflicts.
    python3 tools/pack_split.py cases/<id>        creates cases/<id>/plant/case.json and plant/sets/NN-tag.json, and removes plant.json
    python3 tools/pack_split.py cases/<id> --join writes plant.json back from the fragments
"""
import json, os, re, sys
cd = sys.argv[1]; fr = os.path.join(cd, "plant"); pj = os.path.join(cd, "plant.json")
if "--join" in sys.argv:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import pack_build
    spec = pack_build.load_spec(cd); json.dump(spec, open(pj, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    for root, _, fs in os.walk(fr, topdown=False):
        for f in fs: os.remove(os.path.join(root, f))
        os.rmdir(root)
    print("joined into", pj); sys.exit()
spec = json.load(open(pj, encoding="utf-8")); sets = spec.pop("sets")
os.makedirs(os.path.join(fr, "sets"), exist_ok=True)
json.dump(spec, open(os.path.join(fr, "case.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for i, s in enumerate(sets, 1):
    name = f"{i:02d}-{re.sub(r'[^a-z0-9]+', '', s['tag'].lower())}.json"
    json.dump(s, open(os.path.join(fr, "sets", name), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
os.remove(pj)
print(f"{len(sets)} sets written to {fr}/sets, the rest to {fr}/case.json")
