---
name: codebase-tour
description: Use when onboarding to an unfamiliar repository or asked "how does X work here" — build a map before answering from fragments.
---

# Codebase Tour

Random-walking a strange repo produces confident answers about the wrong layer. The fix is a fixed reading order: entry points and build config first, then one real feature traced end to end, then generalize. Breadth before depth, always depth on exactly one example.

## Process

1. **Orient from the top, before opening any source file:**
   ```
   ls                                     # top-level shape
   cat README.md                          # claimed purpose (verify later, don't trust)
   git log --oneline -15                  # what's actively changing
   ```
   Read the manifest for the stack and, critically, the **scripts/tasks**: `package.json` (`scripts` block), `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `justfile`, `docker-compose.yml`. The dev/build/test commands tell you how the authors actually run this thing — that's the ground truth README prose often isn't. Note any `CLAUDE.md`, `CONTRIBUTING.md`, or `docs/` and skim them now.

2. **Find the entry points.** Where does execution start? `main`/`bin` fields in the manifest, `src/main.*`, `cmd/`, `app.py`/`manage.py`, `next.config.*` + `app/` or `pages/`, a router registration file, serverless handler config. Read the entry file fully — it names the framework, middleware stack, and top-level wiring in one place.

3. **Trace one representative flow end to end.** Pick one real feature — an HTTP endpoint, a CLI subcommand, a job — ideally one the user asked about, else a mid-complexity one (not health-check, not the gnarliest). Follow it hop by hop:
   - route/dispatch → handler/controller → validation → business logic/service → data access/model → response/output;
   - for non-request systems, the equivalent data flow: input source → parse → transform → persist/emit.
   Grep for the route string or command name to find the start. Write down every file the request touches, in order, including where errors from each hop end up. This one concrete path teaches the architecture better than reading ten directories abstractly — and it's the skeleton for answering "how does X work here" about anything else.

4. **Map the load-bearing directories.** Identify the 5–6 directories where real work lives and give each a one-line "owns" statement (e.g. `src/services/ — business logic, one file per domain object`). Use size and churn as evidence, not folder names:
   ```
   git ls-files | sed 's|/.*||' | sort | uniq -c | sort -rn | head   # file count per top dir
   git log --oneline --since="6 months ago" --name-only | grep / | sed 's|/.*||' | sort | uniq -c | sort -rn | head   # churn
   ```
   Explicitly mark what you skipped (generated code, vendored deps, legacy areas) so the map's edges are honest.

5. **Learn the testing pattern from 2–3 existing tests.** Find the test dir/pattern, open two or three tests near the flow you traced. Note:
   - the runner and the command to invoke one single test (verify it actually runs);
   - fixture/factory conventions and mocking style (real DB? test containers? stubs?);
   - what the repo considers worth testing — unit-heavy, integration-heavy, or golden files.
   New code must match this pattern — this is where onboarding contributions usually go wrong first.

6. **Produce the tour document**, structured exactly as:
   - **Stack**: languages, framework, DB, build tooling — one line each.
   - **Layout**: the 5–6 directory map from step 4.
   - **One worked example**: the step-3 trace as an ordered file-by-file path.
   - **Conventions observed**: naming, error handling, test style, layering rules — only what you actually saw, each ideally with a file reference.
   - **Where to be careful**: hot-churn files, implicit couplings, areas with no tests, anything surprising.
   - **Commands**: run, test-one-file, lint — copied from step 1, verified where cheap to do so.
   Label inference as inference ("appears to", with the evidence) — a wrong tour is worse than a gap.

7. **Offer to persist it.** Ask whether to save as `ARCHITECTURE.md` or merge the durable parts (commands, layout, conventions) into `CLAUDE.md`. Don't write either file unprompted; if `CLAUDE.md` exists, propose additions rather than restructuring it.

## Red flags

| Rationalization | Correction |
|---|---|
| "I'll just grep for the keyword and read whatever hits" | Fragments without the map mislead. Entry points and build config first, then grep with context. |
| "The README explains the architecture, done" | READMEs describe intentions, often years stale. Verify every claim against the code before repeating it. |
| "I've read enough directories to describe the flow" | Directory reading yields plausible fiction. Trace one real request end to end; list the actual files. |
| "Folder names tell me what each part does" | `utils/` and `core/` name nothing. Use file counts, churn, and contents as evidence. |
| "I'll describe testing conventions from the config file" | Config shows the runner, not the culture. Read 2–3 real tests. |
| "It probably follows standard <framework> layout" | 'Probably' is the word to catch. Check, then either confirm or flag the deviation — deviations are the valuable findings. |
