# Two Claude sessions on one repository: how it works day to day

- **Claude A** (features, data, AI) and **Claude B** (3D UI) each run in their own cloud session with their own branch, named by the system (for example `claude/great-tesla-l0uw33` and `claude/funny-edison-pis09w`). The two names are written at the top of `docs/TASKS.md`.
- **`main` is the shared version.** Only Claude A writes to `main`, and only after merging B's branch and passing the tests.
- Claude B never pushes to `main`. B pushes its own branch often and pulls `main` often.

## Check the baseline (both Claudes, at the start, before every push, before every merge)
```
tools/baseline_check.sh a     # Claude A
tools/baseline_check.sh b     # Claude B
```
It prints the commit of `main`, how far your branch is ahead of or behind it, and lists any file you changed that belongs to the other Claude. If it says you are behind, merge `origin/main` first. If it names files that are not yours, move that request to `docs/TASKS.md`.

## Claude B starts or refreshes from main
```
git fetch origin
git merge origin/main        # brings in everything Claude A has put on main
```
Do this at the start and before each new piece of work. If the merge reports a conflict in a file B owns, keep B's version; in any other file, keep main's version and tell A in `docs/TASKS.md`.

## Claude A merges Claude B and updates main (every 1 to 2 hours, or when asked)
```
git fetch origin
git merge origin/<B branch>   # B's 3D work
python3 build.py && npm run test:quick
BUILD_OUT=/tmp/x python3 build.py <id> && node tests/smoke_case.js /tmp/x/index.html
git push origin HEAD:main     # fast-forward only; never force
```
If a test fails, A tells B in `docs/TASKS.md` what broke and does not update `main`.

## Files
Each file has exactly one owner (see the two role files). The case documents are uploaded to `cases/<id>/source/` on `main` by the human; both Claudes pull them.
