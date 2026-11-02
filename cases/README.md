# Cases

One folder per plant. See `docs/CASE_PACKS.md`.

| Folder | What it is |
|---|---|
| `lldpe/` | The first case. Hand-drawn P&IDs, 3D models, plot plan and scenario rules in `geo/` |
| `mock-cdu/` | Crude distillation unit, 7 sets, made only from `plant.json` with generated geometry. Used as the dry run |
| `_template/` | Smallest useful `plant.json`. Copy it to start a new case |

Start a case: `cp -r cases/_template cases/<id>`, edit `plant.json`, then `python3 tools/pack_build.py cases/<id> && python3 build.py <id>`.
