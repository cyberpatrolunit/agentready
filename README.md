# AgentReady

**Generate a `CLAUDE.md` + `AGENTS.md` tailored to your repo — in your browser or one `npx` away.**

![AgentReady demo: paste a package.json, get a tailored CLAUDE.md](docs/demo.gif)

Coding agents read `CLAUDE.md` (Claude Code) and `AGENTS.md` (the open standard) before touching your code. Most repos don't have one, and generic templates don't help. AgentReady detects your actual stack and generates both files with:

- **Exact commands** — install, dev, build, lint, typecheck, and how to run a *single* test with your runner
- **Stack conventions** — the rules a senior dev on your framework enforces in review
- **Gotchas** — the failure modes of your stack that trip up coding agents (Next.js server/client boundaries, FastAPI event-loop blocking, pandas chained indexing, …)

Detection covers ~30 frameworks across JavaScript/TypeScript, Python, Rust, Go, PHP, and Ruby — from `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `composer.json`, `Gemfile`, and lockfiles.

## Use it

**Web (nothing leaves your browser):** [getagentready.dev](https://getagentready.dev) — parsing and generation are client-side JS; works offline after load.

**CLI:**

```sh
cd your-repo
npx getagentready          # writes CLAUDE.md + AGENTS.md
npx getagentready --stdout # preview without writing
npx getagentready --help   # all flags
```

## How it works

Three small dependency-free modules (shared verbatim between web and CLI):

- [`public/lib/detect.js`](public/lib/detect.js) — manifests → stack profile (frameworks, package manager, test runner, linter, resolved commands)
- [`public/lib/knowledge.js`](public/lib/knowledge.js) — curated per-framework conventions and gotchas
- [`public/lib/generate.js`](public/lib/generate.js) — profile → both markdown files

```sh
npm install
npm test        # vitest
```

## Detection misses?

Open an issue with your manifest (or a description of what was wrong) — detection improvements are the most valuable contributions. PRs to `knowledge.js` welcome: keep entries imperative, specific, and true.

## Going deeper

The free generator produces a strong baseline. The [Agent-Ready Pro Pack](https://getagentready.dev/#pro) is the layer beyond it: hand-tuned per-stack configs, 12 installable Claude Code workflow skills, enforcement hooks, and CI recipes. It's how this tool stays free.

## License

MIT
