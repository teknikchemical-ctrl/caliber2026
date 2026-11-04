# Handoff note, Claude B

**USAGE (corrected 2026-11-04, from the human):** Claude B has used about 1% and has the MOST usage left (about 99%). Claude A read "1%" as "1% left" when it reassigned B's pages in commit af2a3df. Claude A: please reassign B1 to B4 back to Claude B if you want, or keep them as they are. I do whatever A writes in `docs/inbox/claude-b.md`.

## Parked head start for B1 (not in src/, so it cannot collide with A's files)
`(removed)` (copy to `src/modules/` and drop the `.txt`): `spi_core.js` (spiApi with fixture mode, render hook, run-time nav group, tables, bars, tooltips), `spi_stub.js` (sample data in API shape), `spi_dash.js` (Overview), `spi_arch.js` (Data and architecture), `style_spi.css`. Written, not yet built or looked at. Data shapes assumed are in `spi_stub.js` (`/api/data/summary`, `/api/data/dq`, `/api/data/architecture`, `/api/engine/health`); A and Codex Fin should match them or tell me the real ones. Needs build.py to include `src/modules/spi_*.js` and `style_spi.css`; no dispatch or nav patch needed.

Keep this file current. Update it at every push, in under 15 lines. A new session, or the other Claude, must be able to continue from this note and the git history alone.

**Updated:** 2026-11-03   **Branch:** claude/funny-edison-pis09w   **Last commit:** see git log

## Done (works, pushed)
- T05: review of the 3D of the example plant `mock-cdu` (notes below, written by Claude B, moved here from the task board by Claude A)

- T11: `tools/g3shots.js`, 3D screenshots of every view. Run `CHROMIUM=/opt/pw-browsers/chromium node tools/g3shots.js dist/index.html /tmp/g3s`
- Baseline on mock-cdu before any 3D change: stress3d passes, case_shots 0 errors, hazard 3D and scenario 3D work

## In progress (not finished: which files, what state)
- T06 started, committed but NOT yet reviewed by the human (human asked to stop design work): g3d.js `Rf` framing (fixes cropped tank and cooling tower), plant3d.js default and reset camera (dist 68, pit .62, whole plant), auto3d.js new fired-heater model (box, burners, convection box, stack, doors; nozzles all on the +z side, last tweak not looked at in a screenshot). Tests passed: smoke, stress3d. Revert with `git revert` of the commit if unwanted.

## Next, in order
1. T06: fix items 1, 3 and 7 of the review first (largest visible gain), then 2, 4, 5. All fit in auto3d.js, g3d.js, plant3d.js, style3d.css

## Gotchas (things that surprised me, decisions and why)
- Hard-coded from the first plant: `p3Scene` in plant3d.js (70x42 m slab, rack, control room, tank, flare, separator test on set 6, lane ids in `p3Routes`); `hse3Build` in hse3d.js (boundary E100-E260 N102-N246, rack at N168, control room at E103 N186). Fits 2 rows of up to 4 columns only. Make them follow `P3POS`, `POS`, `HA`, `VA`, `MUS`.
- `autoKind` is in auto.js (Claude A's). A missing keyword for a new machine type goes to A as a one-line request.
- After any model change run `node tools/g3bridge.js`, then `node tests/stress3d.js`. `node tools/profile_load.js` needs `mkdir -p /tmp/claude-0/t` once.
- Primitives: `g3B(key,x,y,z,w,h,d,color,{r,m,sh,in,anim})` box, `g3C(key,axis,x,y,z,len,r,color,opts,r2)` cylinder/cone, `g3E(key,axis,x,y,z,ra,rb,color,a0,a1,opts)` dish. Metres, y up, centred on x=0 z=0. key = BOM number or nozzle mark (selectable); empty = decoration.

## How to check my work
- `BUILD_OUT=/tmp/x python3 build.py mock-cdu && node tools/g3shots.js /tmp/x/index.html /tmp/g3s`, then open the PNGs; `node tests/stress3d.js`

## Waiting on the other Claude / the human
-

## Review of the example plant's 3D (T05, by Claude B)
B | T05 3D review of mock-cdu (7 sets, built with `BUILD_OUT=/tmp/x python3 build.py mock-cdu`; smoke test and static checks pass, 0 script errors in case_shots) | docs/TASKS.md only | Open Equipment Sets, any set, tab "Drawing and 3D", button "3D model"; dashboard "Plant in 3D"; Plot Plan, Hazard simulator, "3D site" | weak points below | needs from A: none yet
B | T05 weak in the 3D, in order of impact:
  1. Fired heater F-101 (set 2) is built as a horizontal drum with a stack. It has no radiant box, burners, tube coil or convection section, so it does not read as a heater. Also loose small fragments float around it (stray nozzle stubs and flanges not attached to the body).
  2. Column C-101 (set 3) is narrow and plain: no trays or manways shown, no skirt detail, pipe stubs are thin, ladder is a hairline. It looks small next to the plot plan footprint.
  3. Tank T-101 (set 6) and cooling tower CT-701 (set 7) are cropped by the model frame: base and platform cut off at the bottom edge. Camera distance and framing do not account for large equipment. Tank has no roof nozzles, stairs or dike; cooling tower has no fill, louvres or multiple fan cells.
  4. Drum V-102 (set 5) and exchanger E-102 (set 4) look almost identical: same horizontal vessel, same saddles. E-102 needs a visible channel, shell and floating head, tube bundle hint and different colour; V-102 needs a boot, demister or level gauge cue.
  5. Materials: everything is the same light grey with orange nozzles. No colour coding by service, no insulation or paint variation, no flange bolts, no pipe stubs with labels. Models look generic.
  6. Part labels and callouts: no part numbers shown on the 3D model by default, only on click. Nozzle marks (N1..) are not shown. Empty light grey background with a faint grid; no ground shadow on tall items.
  7. Dashboard "Plant in 3D": opens on a close, tilted view where the pipe rack, road and plot edge dominate and only half the units fit; labels overlap pipes (E-102, C-101). The first view should be a full plant overview. Large empty grey plot slab. Equipment sits far apart with thin lines between them; pipe rack steel is dark and heavy next to the pale equipment. A tall diagonal structure (flare or stack) on the right edge is cut off.
  8. Hazard 3D site and scenario replay were not checked in this pass (2D plan only in the crawler). To do next.
  9. Speed not measured yet: run `node tools/profile_load.js` and `node tests/stress3d.js` before changing anything.
  Next for B (T06): 1, 3, 7 first (largest visible gain on the dashboard and first impression), then 2, 4, 5. All fixes fit in auto3d.js, g3d.js, plant3d.js and style3d.css. No change needed in files owned by others.
